// Service Worker for SPMS - Offline First Functionality

const CACHE_NAME = 'spms-v1';
const STATIC_CACHE = 'spms-static-v1';
const DYNAMIC_CACHE = 'spms-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/pages/login.html',
    '/pages/dashboard.html',
    '/pages/student-portal.html',
    '/pages/students.html',
    '/pages/marks.html',
    '/pages/attendance.html',
    '/pages/reports.html',
    '/css/styles.css',
    '/js/script.js',
    '/js/offline.js',
    '/images/school-7421663_1280.png',
    '/images/database-schema-1895779_1280.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
        .then((cache) => {
            console.log('Service Worker: Caching static files');
            return cache.addAll(STATIC_FILES);
        })
        .then(() => {
            console.log('Service Worker: Static files cached successfully');
            return self.skipWaiting();
        })
        .catch((error) => {
            console.error('Service Worker: Error caching static files', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
        .then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('Service Worker: Activated successfully');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const {
        request
    } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and chrome-extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }

    event.respondWith(
        caches.match(request)
        .then((cachedResponse) => {
            // Return cached version if available
            if (cachedResponse) {
                console.log('Service Worker: Serving from cache', request.url);
                return cachedResponse;
            }

            // Try to fetch from network
            return fetch(request)
                .then((response) => {
                    // Check if response is valid
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache dynamic content
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => {
                            console.log('Service Worker: Caching dynamic content', request.url);
                            cache.put(request, responseToCache);
                        });

                    return response;
                })
                .catch(() => {
                    console.log('Service Worker: Network failed, serving offline page');

                    // Return offline fallback for HTML pages
                    if (request.headers.get('accept').includes('text/html')) {
                        return caches.match('/pages/offline.html') ||
                            new Response('Offline - Please check your connection', {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: {
                                    'Content-Type': 'text/html'
                                }
                            });
                    }

                    // Return empty response for other resources
                    return new Response('', {
                        status: 503
                    });
                });
        })
    );
});

// Background sync for data synchronization
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Open IndexedDB and process sync queue
        const dbRequest = indexedDB.open('SPMS_DB', 1);

        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');

            store.getAll().onsuccess = (event) => {
                const queueItems = event.target.result;

                queueItems.forEach(async (item) => {
                    try {
                        // Process each queued item
                        await processQueueItem(item);

                        // Remove processed item from queue
                        store.delete(item.id);
                    } catch (error) {
                        console.error('Failed to process queue item:', error);
                    }
                });
            };
        };
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function processQueueItem(item) {
    const {
        type,
        endpoint,
        method,
        data
    } = item;

    try {
        const response = await fetch(endpoint, {
            method: method || 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Successfully synced item:', type);
        return response.json();
    } catch (error) {
        console.error('Failed to sync item:', error);
        throw error;
    }
}

// Push notifications for updates
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push message received');

    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/images/school-7421663_1280.png',
        badge: '/images/school-7421663_1280.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [{
                action: 'explore',
                title: 'View',
                icon: '/images/school-7421663_1280.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/images/school-7421663_1280.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('SPMS Update', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_UPDATED') {
        // Force update of cache
        event.waitUntil(updateCache());
    }
});

async function updateCache() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_FILES);
        console.log('Service Worker: Cache updated successfully');
    } catch (error) {
        console.error('Service Worker: Failed to update cache', error);
    }
}