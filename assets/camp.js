// Camp page JavaScript - Gallery lightbox and smooth animations

document.addEventListener('DOMContentLoaded', function() {
    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item');

    // Open lightbox when gallery item is clicked
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            lightbox.style.display = 'block';
            lightboxImg.src = img.src;
            lightboxCaption.textContent = img.alt;
            document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
        });
    });

    // Close lightbox when X is clicked
    if (lightboxClose) {
        lightboxClose.addEventListener('click', function() {
            lightbox.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        });
    }

    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // Close lightbox with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightbox.style.display === 'block') {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // Smooth scroll animations for sections
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe sections for fade-in animation
    const sectionsToAnimate = document.querySelectorAll('.intro-section, .gallery-section, .activities-section, .features-section, .social-section, .cta-section');

    sectionsToAnimate.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Apply random colors and staggered animation for both activity and feature boxes
    const activityBoxes = document.querySelectorAll('.activity-box');
    const featureBoxes = document.querySelectorAll('.feature-box');
    const allBoxes = [...activityBoxes, ...featureBoxes];

    const colors = [
        '#FFEB3B', // Yellow
        '#FFA726', // Orange
        '#66BB6A', // Green
        '#42A5F5', // Blue
        '#EF5350', // Red
        '#AB47BC', // Purple
        '#26C6DA', // Cyan
        '#EC407A', // Pink
        '#9CCC65', // Light green
        '#FF7043', // Deep orange
        '#78909C', // Blue grey
        '#FFCC80'  // Peach
    ];

    // Shuffle colors array
    const shuffledColors = colors.sort(() => Math.random() - 0.5);

    allBoxes.forEach((box, index) => {
        // Apply random color
        const randomColor = shuffledColors[index % shuffledColors.length];
        box.style.backgroundColor = randomColor;

        // Animation
        box.style.opacity = '0';
        box.style.transform = 'translateY(30px)';
        box.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    });

    const boxObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);
            }
        });
    }, observerOptions);

    allBoxes.forEach(box => {
        boxObserver.observe(box);
    });

    // Gallery items staggered load animation
    galleryItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        item.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
    });

    const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'scale(1)';
                }, 50);
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.01
    });

    galleryItems.forEach(item => {
        galleryObserver.observe(item);
    });


    // Smooth scroll for any internal anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add fade-in animation to images as they load
    const allImages = document.querySelectorAll('.gallery-item img, .hero-image');

    allImages.forEach(img => {
        // Hide image initially
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';

        // Show image when loaded
        if (img.complete) {
            // Image already loaded (from cache)
            img.style.opacity = '1';
        } else {
            // Wait for image to load
            img.addEventListener('load', function() {
                this.style.opacity = '1';
            });

            // In case of error, still show the alt text area
            img.addEventListener('error', function() {
                this.style.opacity = '1';
                console.error('Failed to load image:', this.src);
            });
        }
    });

    // Hover effect removed for social media items

});