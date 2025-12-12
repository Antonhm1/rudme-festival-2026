document.addEventListener('DOMContentLoaded', function() {
    fetch('assets/footer.html')
        .then(response => response.text())
        .then(data => {
            const footerContainer = document.getElementById('footer-placeholder');
            if (footerContainer) {
                footerContainer.innerHTML = data;
                initializeFooterGallery();
                loadFooterLogo();
                setupDynamicFooterColors();
            }
        })
        .catch(error => console.error('Error loading footer:', error));
});

function loadFooterLogo() {
    const logoContainer = document.getElementById('footer-logo-container');
    if (logoContainer) {
        fetch('assets/RUDME-logo.svg')
            .then(response => response.text())
            .then(svg => {
                logoContainer.innerHTML = svg;
                const svgElement = logoContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.style.width = '100%';
                    svgElement.style.height = 'auto';
                }
            })
            .catch(error => console.error('Error loading footer logo:', error));
    }
}

function initializeFooterGallery() {
    const images = document.querySelectorAll('.gallery-image');
    if (images.length === 0) return;

    let currentIndex = 0;

    function switchImage() {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
    }

    setInterval(switchImage, 500);
}

function setupDynamicFooterColors() {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function darkenColor(color, amount = 0.3) {
        let rgb;

        if (color.startsWith('#')) {
            rgb = hexToRgb(color);
        } else if (color.startsWith('rgb')) {
            const values = color.match(/\d+/g);
            rgb = {
                r: parseInt(values[0]),
                g: parseInt(values[1]),
                b: parseInt(values[2])
            };
        } else {
            return color;
        }

        if (!rgb) return color;

        const r = Math.round(rgb.r * (1 - amount));
        const g = Math.round(rgb.g * (1 - amount));
        const b = Math.round(rgb.b * (1 - amount));

        return rgbToHex(r, g, b);
    }

    function updateFooterColor() {
        let bgColor;

        const currentBgVar = getComputedStyle(document.documentElement).getPropertyValue('--current-bg').trim();
        if (currentBgVar) {
            bgColor = currentBgVar;
        } else {
            bgColor = window.getComputedStyle(document.body).backgroundColor;
        }

        if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
            bgColor = '#ffffff';
        }

        const textColor = darkenColor(bgColor, 0.4);
        footer.style.color = textColor;

        const svgElement = footer.querySelector('svg');
        if (svgElement) {
            svgElement.style.fill = bgColor;
            const paths = svgElement.querySelectorAll('path, circle, rect, polygon');
            paths.forEach(path => {
                if (!path.style.fill || path.style.fill === 'currentColor') {
                    path.style.fill = bgColor;
                }
            });
        }
    }

    updateFooterColor();

    const observer = new MutationObserver(updateFooterColor);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    window.addEventListener('scroll', updateFooterColor);
    window.addEventListener('resize', updateFooterColor);

    setInterval(updateFooterColor, 100);
}