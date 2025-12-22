/**
 * Roller Component - Horizontal scrolling section with auto-scroll, expandable boxes, and custom scrollbar
 *
 * Usage:
 *   RollerComponent.create({
 *     containerId: 'my-roller',           // ID for the container element
 *     title: 'SECTION TITLE',             // Section title
 *     titleAlign: 'right',                // 'left' or 'right' (default: 'right')
 *     items: [                            // Array of items to display
 *       {
 *         id: 'item-1',
 *         title: 'Item Title',
 *         image: 'path/to/image.jpg',
 *         description: 'Description text or HTML',
 *         color: '#FF6B6B',
 *         tags: [                         // Optional tags/badges
 *           { label: 'Tag 1', color: '#90EE90' },
 *           { label: 'Tag 2', color: '#87CEEB' }
 *         ],
 *         tagsHeading: 'TAGS HEADING'     // Optional heading for tags section
 *       }
 *     ],
 *     buttonTextExpand: 'READ MORE',      // Text when collapsed (default: 'LÆS MERE')
 *     buttonTextCollapse: 'CLOSE',        // Text when expanded (default: 'LUK')
 *     scrollSpeed: 0.5,                   // Auto-scroll speed in px/frame (default: 0.5)
 *     touchResumeDelay: 2000,             // Delay before resuming after touch (default: 2000ms)
 *     infiniteScroll: true,               // Enable infinite scrolling (default: true)
 *     parentElement: document.body        // Element to append to (optional)
 *   });
 *
 * Methods:
 *   RollerComponent.updateScrollbarColor(instance, color) - Update scrollbar thumb color
 *   RollerComponent.destroy(instance) - Clean up and remove the roller
 */

const RollerComponent = {
    // Store active instances for cleanup
    instances: new Map(),

    /**
     * Create a roller section
     * @param {Object} options - Configuration options
     * @returns {Object} Instance object with references and methods
     */
    create: function(options) {
        const {
            containerId,
            title,
            titleAlign = 'right',
            items = [],
            buttonTextExpand = 'LÆS MERE',
            buttonTextCollapse = 'LUK',
            scrollSpeed = 0.5,
            touchResumeDelay = 2000,
            infiniteScroll = true,
            parentElement
        } = options;

        // Create main section
        const section = document.createElement('section');
        section.className = 'roller-section';
        section.id = containerId;

        // Create title
        if (title) {
            const titleEl = document.createElement('h2');
            titleEl.className = `roller-title align-${titleAlign}`;
            titleEl.textContent = title;
            section.appendChild(titleEl);
        }

        // Create scroll container
        const container = document.createElement('div');
        container.className = 'roller-container';

        const scrollContent = document.createElement('div');
        scrollContent.className = 'roller-scroll';

        // Duplicate items for seamless infinite scroll if enabled
        const allItems = infiniteScroll ? [...items, ...items] : items;

        // Generate boxes
        allItems.forEach((item, index) => {
            const box = this._createBox(item, index, buttonTextExpand, buttonTextCollapse);
            scrollContent.appendChild(box);
        });

        container.appendChild(scrollContent);
        section.appendChild(container);

        // Create custom scrollbar
        const scrollbarTrack = document.createElement('div');
        scrollbarTrack.className = 'roller-scrollbar-track';

        const scrollbarThumb = document.createElement('div');
        scrollbarThumb.className = 'roller-scrollbar-thumb';

        scrollbarTrack.appendChild(scrollbarThumb);
        section.appendChild(scrollbarTrack);

        // Append to parent if provided
        if (parentElement) {
            parentElement.appendChild(section);
        }

        // Create instance object
        const instance = {
            id: containerId,
            section,
            container,
            scrollContent,
            scrollbarTrack,
            scrollbarThumb,
            scrollSpeed,
            touchResumeDelay,
            infiniteScroll,
            isAutoScrolling: true,
            scrollPosition: 0,
            animationId: null,
            isDragging: false,
            touchScrollTimeout: null
        };

        // Store instance
        this.instances.set(containerId, instance);

        // Initialize scroll behavior
        this._initializeScrollBehavior(instance);

        return instance;
    },

    /**
     * Create a single box element
     * @private
     */
    _createBox: function(item, index, buttonTextExpand, buttonTextCollapse) {
        const box = document.createElement('div');
        box.className = 'roller-box';
        box.setAttribute('data-item', `${item.id}-${index}`);
        box.style.borderColor = item.color;
        box.style.backgroundColor = item.color;

        // Create tags HTML if provided
        let tagsHTML = '';
        if (item.tags && item.tags.length > 0) {
            const tagBadges = item.tags.map(tag =>
                `<span class="roller-tag-badge" style="background-color: ${tag.color || '#ccc'}">${tag.label}</span>`
            ).join('');

            tagsHTML = `
                <div class="roller-tags-section">
                    ${item.tagsHeading ? `<h4 class="roller-tags-heading">${item.tagsHeading}</h4>` : ''}
                    <div class="roller-tags-badges">
                        ${tagBadges}
                    </div>
                </div>
            `;
        }

        // Create content structure
        box.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="roller-box-image">
            <div class="roller-box-content">
                <div class="roller-box-header">
                    <h3 class="roller-box-title">${item.title}</h3>
                    <button class="roller-box-button" style="background-color: ${item.color}">${buttonTextExpand}</button>
                </div>
                <div class="roller-box-description">
                    ${item.description}
                    ${tagsHTML}
                </div>
            </div>
        `;

        const button = box.querySelector('.roller-box-button');

        // Click handler for box
        box.addEventListener('click', (e) => {
            if (e.target.classList.contains('roller-box-button')) return;

            const wasExpanded = box.classList.contains('expanded');

            // Close all expanded boxes
            document.querySelectorAll('.roller-box.expanded').forEach(expandedBox => {
                expandedBox.classList.remove('expanded');
                const btn = expandedBox.querySelector('.roller-box-button');
                if (btn) btn.textContent = buttonTextExpand;
            });

            // Toggle this box
            if (!wasExpanded) {
                box.classList.add('expanded');
                button.textContent = buttonTextCollapse;
            }
        });

        // Click handler for button
        button.addEventListener('click', (e) => {
            e.stopPropagation();

            const wasExpanded = box.classList.contains('expanded');

            // Close all expanded boxes
            document.querySelectorAll('.roller-box.expanded').forEach(expandedBox => {
                expandedBox.classList.remove('expanded');
                const btn = expandedBox.querySelector('.roller-box-button');
                if (btn) btn.textContent = buttonTextExpand;
            });

            // Toggle this box
            if (!wasExpanded) {
                box.classList.add('expanded');
                button.textContent = buttonTextCollapse;
            }
        });

        return box;
    },

    /**
     * Initialize scroll behavior for an instance
     * @private
     */
    _initializeScrollBehavior: function(instance) {
        const {
            container,
            scrollContent,
            scrollbarTrack,
            scrollbarThumb,
            scrollSpeed,
            touchResumeDelay,
            infiniteScroll
        } = instance;

        // Update scrollbar position
        const updateScrollbar = () => {
            const scrollPercentage = container.scrollLeft / (container.scrollWidth - container.clientWidth);
            const maxThumbPosition = scrollbarTrack.clientWidth - scrollbarThumb.clientWidth;
            scrollbarThumb.style.left = (scrollPercentage * maxThumbPosition) + 'px';
        };

        // Auto-scroll function
        const autoScroll = () => {
            if (instance.isAutoScrolling) {
                instance.scrollPosition += scrollSpeed;

                // Reset scroll for seamless loop if infinite scroll enabled
                if (infiniteScroll) {
                    const maxScroll = scrollContent.scrollWidth / 2;
                    if (instance.scrollPosition >= maxScroll) {
                        instance.scrollPosition = 0;
                    }
                } else {
                    // Bounce back for non-infinite scroll
                    const maxScroll = container.scrollWidth - container.clientWidth;
                    if (instance.scrollPosition >= maxScroll) {
                        instance.scrollPosition = maxScroll;
                    }
                }

                container.scrollLeft = instance.scrollPosition;
                updateScrollbar();
            }

            instance.animationId = requestAnimationFrame(autoScroll);
        };

        // Mouse enter - stop auto-scroll
        container.addEventListener('mouseenter', () => {
            instance.isAutoScrolling = false;
        });

        // Mouse leave - resume auto-scroll
        container.addEventListener('mouseleave', () => {
            if (!instance.isDragging) {
                instance.isAutoScrolling = true;
            }
        });

        // Touch start - stop auto-scroll
        container.addEventListener('touchstart', () => {
            instance.isAutoScrolling = false;
            if (instance.touchScrollTimeout) {
                clearTimeout(instance.touchScrollTimeout);
                instance.touchScrollTimeout = null;
            }
        }, { passive: true });

        // Touch move - keep stopped and sync position
        container.addEventListener('touchmove', () => {
            instance.isAutoScrolling = false;
            instance.scrollPosition = container.scrollLeft;
            updateScrollbar();
        }, { passive: true });

        // Touch end - resume after delay
        container.addEventListener('touchend', () => {
            instance.touchScrollTimeout = setTimeout(() => {
                instance.isAutoScrolling = true;
            }, touchResumeDelay);
        }, { passive: true });

        // Manual scroll sync
        container.addEventListener('scroll', () => {
            if (!instance.isAutoScrolling) {
                instance.scrollPosition = container.scrollLeft;
                updateScrollbar();
            }
        });

        // Scrollbar thumb dragging
        let startX = 0;

        scrollbarThumb.addEventListener('mousedown', (e) => {
            instance.isDragging = true;
            instance.isAutoScrolling = false;
            startX = e.clientX - scrollbarThumb.offsetLeft;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!instance.isDragging) return;
            e.preventDefault();

            const x = e.clientX - startX;
            const maxThumbPosition = scrollbarTrack.clientWidth - scrollbarThumb.clientWidth;
            const boundedX = Math.max(0, Math.min(x, maxThumbPosition));

            const scrollPercentage = boundedX / maxThumbPosition;
            container.scrollLeft = scrollPercentage * (container.scrollWidth - container.clientWidth);
            instance.scrollPosition = container.scrollLeft;
        });

        document.addEventListener('mouseup', () => {
            if (instance.isDragging) {
                instance.isDragging = false;
                // Don't auto-resume - wait for mouse to leave
            }
        });

        // Start auto-scrolling
        autoScroll();

        // Cleanup on page unload
        const cleanup = () => {
            if (instance.animationId) {
                cancelAnimationFrame(instance.animationId);
            }
        };

        window.addEventListener('beforeunload', cleanup);
        instance.cleanup = cleanup;
    },

    /**
     * Update scrollbar thumb color
     * @param {Object|string} instanceOrId - Instance object or container ID
     * @param {string} color - Color to apply (will be lightened)
     */
    updateScrollbarColor: function(instanceOrId, color) {
        const instance = typeof instanceOrId === 'string'
            ? this.instances.get(instanceOrId)
            : instanceOrId;

        if (!instance || !instance.scrollbarThumb) return;

        // Lighten the color for better contrast
        const lightenedColor = this._lightenColor(color, 0.7);
        instance.scrollbarThumb.style.backgroundColor = lightenedColor;
    },

    /**
     * Lighten a color
     * @private
     */
    _lightenColor: function(color, factor = 0.7) {
        // Parse RGB color
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = Math.min(255, parseInt(match[1]) + (255 - parseInt(match[1])) * factor);
            const g = Math.min(255, parseInt(match[2]) + (255 - parseInt(match[2])) * factor);
            const b = Math.min(255, parseInt(match[3]) + (255 - parseInt(match[3])) * factor);
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }

        // Parse hex color
        const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        if (hexMatch) {
            const r = Math.min(255, parseInt(hexMatch[1], 16) + (255 - parseInt(hexMatch[1], 16)) * factor);
            const g = Math.min(255, parseInt(hexMatch[2], 16) + (255 - parseInt(hexMatch[2], 16)) * factor);
            const b = Math.min(255, parseInt(hexMatch[3], 16) + (255 - parseInt(hexMatch[3], 16)) * factor);
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }

        return color;
    },

    /**
     * Get an instance by ID
     * @param {string} containerId - The container ID
     * @returns {Object|undefined} The instance or undefined
     */
    getInstance: function(containerId) {
        return this.instances.get(containerId);
    },

    /**
     * Pause auto-scrolling for an instance
     * @param {Object|string} instanceOrId - Instance object or container ID
     */
    pause: function(instanceOrId) {
        const instance = typeof instanceOrId === 'string'
            ? this.instances.get(instanceOrId)
            : instanceOrId;

        if (instance) {
            instance.isAutoScrolling = false;
        }
    },

    /**
     * Resume auto-scrolling for an instance
     * @param {Object|string} instanceOrId - Instance object or container ID
     */
    resume: function(instanceOrId) {
        const instance = typeof instanceOrId === 'string'
            ? this.instances.get(instanceOrId)
            : instanceOrId;

        if (instance) {
            instance.isAutoScrolling = true;
        }
    },

    /**
     * Destroy an instance and clean up
     * @param {Object|string} instanceOrId - Instance object or container ID
     */
    destroy: function(instanceOrId) {
        const instance = typeof instanceOrId === 'string'
            ? this.instances.get(instanceOrId)
            : instanceOrId;

        if (!instance) return;

        // Cancel animation
        if (instance.animationId) {
            cancelAnimationFrame(instance.animationId);
        }

        // Clear timeout
        if (instance.touchScrollTimeout) {
            clearTimeout(instance.touchScrollTimeout);
        }

        // Remove from DOM
        if (instance.section && instance.section.parentElement) {
            instance.section.parentElement.removeChild(instance.section);
        }

        // Remove from instances map
        this.instances.delete(instance.id);
    }
};

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RollerComponent;
}
