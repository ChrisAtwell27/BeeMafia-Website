// BeeMafia Documentation JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Role filtering functionality
    initializeRoleFilters();

    // Smooth scrolling for anchor links
    initializeSmoothScrolling();

    // Mobile navigation toggle (if needed in future)
    initializeMobileNav();
});

/**
 * Initialize role filter buttons
 */
function initializeRoleFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const roleSections = document.querySelectorAll('.roles-section');

    if (filterButtons.length === 0 || roleSections.length === 0) {
        return; // Not on roles page
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterTeam = this.getAttribute('data-team');

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter sections
            if (filterTeam === 'all') {
                roleSections.forEach(section => {
                    section.classList.remove('hidden');
                });
            } else {
                roleSections.forEach(section => {
                    const sectionTeam = section.getAttribute('data-team');
                    if (sectionTeam === filterTeam) {
                        section.classList.remove('hidden');
                    } else {
                        section.classList.add('hidden');
                    }
                });
            }

            // Scroll to first visible section
            const firstVisible = document.querySelector('.roles-section:not(.hidden)');
            if (firstVisible && filterTeam !== 'all') {
                firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Skip if it's just "#"
            if (href === '#') {
                return;
            }

            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Update URL without scrolling
                history.pushState(null, null, href);
            }
        });
    });

    // Handle initial hash in URL
    if (window.location.hash) {
        setTimeout(() => {
            const targetId = window.location.hash.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
    }
}

/**
 * Initialize mobile navigation (future enhancement)
 */
function initializeMobileNav() {
    // Placeholder for future mobile menu functionality
    // Can add hamburger menu for mobile devices if needed
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Add scroll-to-top button (optional enhancement)
 */
function addScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↑';
    scrollButton.className = 'scroll-to-top';
    scrollButton.setAttribute('aria-label', 'Scroll to top');

    scrollButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(scrollButton);

    // Show/hide button based on scroll position
    const toggleScrollButton = debounce(() => {
        if (window.pageYOffset > 300) {
            scrollButton.style.display = 'block';
        } else {
            scrollButton.style.display = 'none';
        }
    }, 100);

    window.addEventListener('scroll', toggleScrollButton);

    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    scrollButton.addEventListener('mouseenter', () => {
        scrollButton.style.transform = 'scale(1.1)';
    });

    scrollButton.addEventListener('mouseleave', () => {
        scrollButton.style.transform = 'scale(1)';
    });
}

// Initialize scroll-to-top button
addScrollToTopButton();

/**
 * Add animation on scroll (optional enhancement)
 */
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards and sections
    const animatedElements = document.querySelectorAll(`
        .role-card,
        .feature-card,
        .team-card,
        .stat-card,
        .phase-card,
        .mode-card
    `);

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// Add scroll animations after a short delay
setTimeout(addScrollAnimations, 500);

/**
 * Search functionality for roles (future enhancement)
 */
function initializeRoleSearch() {
    const searchInput = document.getElementById('role-search');
    if (!searchInput) return;

    const roleCards = document.querySelectorAll('.role-card');

    searchInput.addEventListener('input', debounce(function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        roleCards.forEach(card => {
            const roleName = card.querySelector('h3').textContent.toLowerCase();
            const roleDescription = card.querySelector('.role-description').textContent.toLowerCase();

            if (roleName.includes(searchTerm) || roleDescription.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });

        // Show "no results" message if needed
        const visibleCards = Array.from(roleCards).filter(card => card.style.display !== 'none');
        if (visibleCards.length === 0 && searchTerm !== '') {
            showNoResultsMessage();
        } else {
            hideNoResultsMessage();
        }
    }, 300));
}

function showNoResultsMessage() {
    let message = document.getElementById('no-results-message');
    if (!message) {
        message = document.createElement('div');
        message.id = 'no-results-message';
        message.className = 'no-results';
        message.innerHTML = '<p>No roles found matching your search.</p>';
        message.style.cssText = `
            text-align: center;
            padding: 2rem;
            color: var(--gray);
            font-size: 1.1rem;
        `;
        const rolesGrid = document.querySelector('.roles-grid');
        if (rolesGrid) {
            rolesGrid.parentNode.insertBefore(message, rolesGrid.nextSibling);
        }
    }
    message.style.display = 'block';
}

function hideNoResultsMessage() {
    const message = document.getElementById('no-results-message');
    if (message) {
        message.style.display = 'none';
    }
}

// Log that script is loaded
console.log('BeeMafia documentation scripts loaded successfully!');
