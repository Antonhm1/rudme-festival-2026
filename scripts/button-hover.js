/**
 * Button Hover - Shared utility for random color hover effect on buttons
 * Used across the site to give black buttons a playful color-changing hover effect
 *
 * Usage:
 *   // Initialize on specific elements
 *   ButtonHover.init('.my-button');
 *
 *   // Or initialize with default selectors (auto-runs on DOMContentLoaded)
 *   // Just include this script - it auto-initializes buttons with class 'random-hover-btn'
 */

const ButtonHover = {
    /**
     * Available colors for random hover effect
     * Based on the festival's role colors palette
     */
    colors: [
        '#90EE90', // green - frivillig
        '#87CEEB', // blue - afvikler
        '#FFB6C1', // pink - arrangor
        '#FFF59D', // light yellow - praktikant
        '#FFEB3B', // bright yellow - rudme lejr
        '#B19CD9', // purple - foreningsmedlem
        '#111111', // black
        '#FFFFFF'  // white
    ],

    /**
     * Get a random color from the colors array
     * @param {string} [excludeColor] - Color to exclude from selection
     * @returns {string} Random hex color
     */
    getRandomColor: function(excludeColor) {
        const available = this.colors.filter(c => c !== excludeColor);
        return available[Math.floor(Math.random() * available.length)];
    },

    /**
     * Initialize hover effect on elements matching selector
     * @param {string} selector - CSS selector for buttons to enhance
     */
    init: function(selector) {
        const self = this;
        const buttons = document.querySelectorAll(selector);

        buttons.forEach(button => {
            // Skip if already initialized
            if (button.dataset.hoverInitialized) return;
            button.dataset.hoverInitialized = 'true';

            button.addEventListener('mouseenter', function() {
                const newBgColor = self.getRandomColor();
                const newTextColor = self.getRandomColor(newBgColor);
                this.style.backgroundColor = newBgColor;
                this.style.color = newTextColor;
            });

            // Colors stay randomized after hover (matches volunteer page behavior)
        });
    },

    /**
     * Fixed color combinations for mobile animation [bg, text]
     */
    mobileCombos: [
        ['#90EE90', '#111111'], // green bg, black text
        ['#FFB6C1', '#87CEEB'], // pink bg, blue text
        ['#111111', '#FFEB3B'], // black bg, yellow text
        ['#87CEEB', '#FFFFFF'], // blue bg, white text
        ['#FFEB3B', '#B19CD9'], // yellow bg, purple text
        ['#B19CD9', '#90EE90']  // purple bg, green text
    ],

    /**
     * Start auto-cycling color animation on mobile for elements matching selector.
     * Cycles through 6 defined color combos every ~1s.
     */
    initMobileAnimation: function(selector) {
        const self = this;
        // Only run on touch devices / narrow screens (no hover support)
        if (window.matchMedia('(hover: hover)').matches) return;

        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
            if (button.dataset.mobileAnimInitialized) return;
            button.dataset.mobileAnimInitialized = 'true';

            // Add CSS transition for smooth color changes
            button.style.transition = 'background-color 0.4s ease, color 0.4s ease';

            let index = 0;
            function cycle() {
                const [bg, text] = self.mobileCombos[index];
                button.style.backgroundColor = bg;
                button.style.color = text;
                index = (index + 1) % self.mobileCombos.length;
            }

            // Start after a short delay, then repeat every 1s
            setTimeout(() => {
                cycle();
                setInterval(cycle, 1000);
            }, 500);
        });
    }
};

// Auto-initialize on DOMContentLoaded for buttons with 'random-hover-btn' class
document.addEventListener('DOMContentLoaded', function() {
    ButtonHover.init('.random-hover-btn');
    ButtonHover.initMobileAnimation('.random-hover-btn');
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ButtonHover;
}
