// JavaScript for Automated School Performance Monitoring System

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navigation highlighting based on scroll position
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    function highlightNavLink() {
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = sectionId;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNavLink);

    // Feature cards hover effect enhancement
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.borderColor = getRandomColor();
        });

        card.addEventListener('mouseleave', function() {
            this.style.borderColor = 'transparent';
        });
    });

    function getRandomColor() {
        const colors = ['#4a6fa5', '#38b67a', '#e74c3c', '#f39c12', '#9b59b6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Add animation to elements when they come into view
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .db-schema, .section-heading');

        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;

            if (elementPosition < screenPosition) {
                element.classList.add('animate');
            }
        });
    };

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Run once on page load

    // Add CSS to style the active navigation link
    const style = document.createElement('style');
    style.textContent = `
    .nav-links a.active {
      color: var(--primary);
    }
    .nav-links a.active::after {
      width: 100%;
    }
    .feature-card.animate, .db-schema.animate, .section-heading.animate {
      animation: fadeIn 0.8s ease-out forwards;
    }
  `;
    document.head.appendChild(style);
});