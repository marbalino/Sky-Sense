// Robinhood-inspired Interactive Features
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger menu
            const bars = navToggle.querySelectorAll('.bar');
            bars[0].style.transform = navMenu.classList.contains('active') ? 
                'rotate(-45deg) translate(-5px, 6px)' : 'none';
            bars[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
            bars[2].style.transform = navMenu.classList.contains('active') ? 
                'rotate(45deg) translate(-5px, -6px)' : 'none';
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    const bars = navToggle.querySelectorAll('.bar');
                    bars[0].style.transform = 'none';
                    bars[1].style.opacity = '1';
                    bars[2].style.transform = 'none';
                }
            }
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all sections for animation
    document.querySelectorAll('section, .hardware-card, .service-card, .tech-feature').forEach(el => {
        observer.observe(el);
    });

    // Network visualization animation
    const networkNodes = document.querySelectorAll('.network-visualization .node');
    networkNodes.forEach((node, index) => {
        node.style.animationDelay = `${index * 0.5}s`;
    });

    // AI Network animation
    const neurons = document.querySelectorAll('.neuron');
    neurons.forEach((neuron, index) => {
        neuron.style.animationDelay = `${index * 0.2}s`;
    });

    // Tooltip functionality for network nodes
    const nodesWithTooltip = document.querySelectorAll('[data-tooltip]');
    nodesWithTooltip.forEach(node => {
        let tooltip;
        
        node.addEventListener('mouseenter', function() {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: var(--black);
                color: var(--white);
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.875rem;
                font-weight: 500;
                white-space: nowrap;
                z-index: 1000;
                pointer-events: none;
                transform: translate(-50%, -120%);
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            this.style.position = 'relative';
            this.appendChild(tooltip);
            
            requestAnimationFrame(() => {
                tooltip.style.opacity = '1';
            });
        });
        
        node.addEventListener('mouseleave', function() {
            if (tooltip) {
                tooltip.remove();
            }
        });
    });


    // Parallax effect for hero section (desktop only)
    window.addEventListener('scroll', function() {
        if (window.innerWidth > 768) {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.hero-visual');

            parallaxElements.forEach(element => {
                const speed = 0.5;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        }
    });

    // Card hover effects
    const cards = document.querySelectorAll('.hardware-card, .service-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Button click effects
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                left: ${e.clientX - rect.left - size / 2}px;
                top: ${e.clientY - rect.top - size / 2}px;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Dynamic connection lines animation
    const connectionLines = document.querySelectorAll('.connection-line');
    connectionLines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.3}s`;
    });

    // Map expand/collapse functionality
    const toggleMapBtn = document.getElementById('toggleMapView');
    const mapContainer = document.getElementById('liveMapContainer');
    const mapToggleText = document.getElementById('mapToggleText');
    
    if (toggleMapBtn && mapContainer) {
        toggleMapBtn.addEventListener('click', function() {
            mapContainer.classList.toggle('expanded');
            
            if (mapContainer.classList.contains('expanded')) {
                mapToggleText.textContent = 'Close Map';
                toggleMapBtn.querySelector('i').className = 'fas fa-times';
                document.body.style.overflow = 'hidden';
            } else {
                mapToggleText.textContent = 'Expand Map';
                toggleMapBtn.querySelector('i').className = 'fas fa-expand-alt';
                document.body.style.overflow = '';
            }
        });
        
        // Close expanded map with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mapContainer.classList.contains('expanded')) {
                mapContainer.classList.remove('expanded');
                mapToggleText.textContent = 'Expand Map';
                toggleMapBtn.querySelector('i').className = 'fas fa-expand-alt';
                document.body.style.overflow = '';
            }
        });
        
        // Close expanded map by clicking outside
        mapContainer.addEventListener('click', function(e) {
            if (e.target === mapContainer && mapContainer.classList.contains('expanded')) {
                mapContainer.classList.remove('expanded');
                mapToggleText.textContent = 'Expand Map';
                toggleMapBtn.querySelector('i').className = 'fas fa-expand-alt';
                document.body.style.overflow = '';
            }
        });
    }
    
    // Handle iframe loading
    const iframe = document.getElementById('strawberryCreekMap');
    const mapOverlay = document.querySelector('.map-overlay');
    
    if (iframe && mapOverlay) {
        iframe.addEventListener('load', function() {
            setTimeout(() => {
                mapOverlay.style.opacity = '0';
                mapOverlay.style.pointerEvents = 'none';
            }, 1000);
        });
    }

});

// Add CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    @keyframes animate-in {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-in {
        animation: animate-in 0.8s ease-out forwards;
    }

    .tooltip {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: var(--black);
    }
`;

document.head.appendChild(style);