/**
 * Section Component - Shared component for creating consistent content sections
 * Used on volunteer page and info page
 *
 * Usage:
 *   SectionComponent.create({
 *     id: 'section-id',
 *     title: 'Section Title',
 *     image: 'path/to/image.jpg',
 *     imageCrop: 50,              // optional: percentage from top for object-position
 *     content: '<p>HTML content</p>' or ['paragraph1', 'paragraph2'],
 *     buttonText: 'Button Text',  // optional: omit for no button
 *     color: '#HEXCOLOR',         // section background color for transitions
 *     container: document.getElementById('container')
 *   });
 *
 * For sections with multiple subsections:
 *   SectionComponent.create({
 *     id: 'section-id',
 *     title: 'Main Section Title',
 *     subsections: [
 *       { title: 'Sub Title 1', image: 'path/to/image1.jpg', imageCrop: 50, content: '...' },
 *       { title: 'Sub Title 2', image: 'path/to/image2.jpg', content: '...' }
 *     ],
 *     color: '#HEXCOLOR',
 *     container: document.getElementById('container')
 *   });
 */

const SectionComponent = {
    /**
     * Create a content section element
     * @param {Object} options - Section configuration
     * @param {string} options.id - Section ID for navigation
     * @param {string} options.title - Section header title
     * @param {string} [options.image] - Image URL (optional, ignored if subsections provided)
     * @param {number} [options.imageCrop] - Image crop position as percentage from top
     * @param {string|string[]} [options.content] - HTML content string or array of paragraphs
     * @param {Object[]} [options.subsections] - Array of subsections (each with title, image, imageCrop, content)
     * @param {string} [options.buttonText] - Button text (omit for no button)
     * @param {string} [options.buttonLink] - Button link URL (if provided, button becomes a link)
     * @param {string} options.color - Section color for background transitions
     * @param {HTMLElement} [options.container] - Container to append to (optional)
     * @returns {HTMLElement} The created section element
     */
    create: function(options) {
        const {
            id,
            title,
            image,
            imageCrop,
            content,
            subsections,
            buttonText,
            buttonLink,
            color,
            container
        } = options;

        // Create section element
        const section = document.createElement('section');
        section.id = id;
        section.className = 'content-section';
        section.setAttribute('data-color', color);

        // Header - outside the content box
        const header = document.createElement('h2');
        header.className = 'content-section-header';
        header.textContent = title;
        section.appendChild(header);

        // Content box
        const contentBox = document.createElement('div');
        contentBox.className = 'content-section-box';

        // Check if we have subsections
        if (subsections && Array.isArray(subsections) && subsections.length > 0) {
            // Render subsections
            subsections.forEach((sub, index) => {
                // Subsection wrapper
                const subWrapper = document.createElement('div');
                subWrapper.className = 'content-subsection';

                // Subsection header
                if (sub.title) {
                    const subHeader = document.createElement('h3');
                    subHeader.className = 'content-subsection-header';
                    subHeader.textContent = sub.title;
                    subWrapper.appendChild(subHeader);
                }

                // Subsection image
                if (sub.image) {
                    const img = document.createElement('img');
                    img.src = sub.image;
                    img.alt = sub.title || title;
                    img.className = 'content-section-image';

                    if (sub.imageCrop !== undefined) {
                        img.style.objectPosition = `center ${sub.imageCrop}%`;
                    }

                    subWrapper.appendChild(img);
                }

                // Subsection content
                if (sub.content) {
                    const descDiv = document.createElement('div');
                    descDiv.className = 'content-section-description';

                    if (typeof sub.content === 'string') {
                        descDiv.innerHTML = sub.content;
                    } else if (Array.isArray(sub.content)) {
                        sub.content.forEach(paragraph => {
                            const p = document.createElement('p');
                            p.innerHTML = paragraph;
                            descDiv.appendChild(p);
                        });
                    }

                    subWrapper.appendChild(descDiv);
                }

                contentBox.appendChild(subWrapper);
            });
        } else {
            // Original single-section behavior
            // Image (if provided)
            if (image) {
                const img = document.createElement('img');
                img.src = image;
                img.alt = title;
                img.className = 'content-section-image';

                // Apply crop position if specified
                if (imageCrop !== undefined) {
                    img.style.objectPosition = `center ${imageCrop}%`;
                }

                contentBox.appendChild(img);
            }

            // Description
            const descDiv = document.createElement('div');
            descDiv.className = 'content-section-description';

            // Handle content as string (HTML) or array of paragraphs
            if (typeof content === 'string') {
                descDiv.innerHTML = content;
            } else if (Array.isArray(content)) {
                content.forEach(paragraph => {
                    const p = document.createElement('p');
                    p.innerHTML = paragraph;
                    descDiv.appendChild(p);
                });
            }

            contentBox.appendChild(descDiv);
        }

        // Button (if provided)
        if (buttonText) {
            if (buttonLink) {
                const link = document.createElement('a');
                link.className = 'content-section-button';
                link.href = buttonLink;
                link.textContent = buttonText;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                contentBox.appendChild(link);
            } else {
                const button = document.createElement('button');
                button.className = 'content-section-button';
                button.textContent = buttonText;
                contentBox.appendChild(button);
            }
        }

        section.appendChild(contentBox);

        // Append to container if provided
        if (container) {
            container.appendChild(section);
        }

        return section;
    },

    /**
     * Generate multiple sections from an array of data
     * @param {Object[]} sectionsData - Array of section configuration objects
     * @param {HTMLElement} container - Container to append sections to
     * @returns {HTMLElement[]} Array of created section elements
     */
    createMultiple: function(sectionsData, container) {
        return sectionsData.map(data => {
            return this.create({
                ...data,
                container: container
            });
        });
    },

    /**
     * Update button styles based on current background color
     * Called from page-specific color transition code
     * @param {string} bgColor - Current background color
     */
    updateButtonStyles: function(bgColor) {
        // Update both buttons and button-styled links
        const buttons = document.querySelectorAll('.content-section-button, .section-button-link');
        buttons.forEach(button => {
            button.style.backgroundColor = '#111';
            button.style.color = bgColor;

            button.onmouseenter = function() {
                this.style.backgroundColor = '#333';
            };
            button.onmouseleave = function() {
                this.style.backgroundColor = '#111';
            };
        });
    },

    /**
     * Create HTML for a button-styled link
     * Use this in content to create download links or navigation links that match the button style
     * @param {string} href - Link URL
     * @param {string} text - Button text
     * @param {boolean} [download=false] - Whether this is a download link
     * @returns {string} HTML string for the button link
     */
    createButtonLink: function(href, text, download = false) {
        const downloadAttr = download ? ' download' : '';
        return `<a href="${href}" class="section-button-link"${downloadAttr}>${text}</a>`;
    },

    /**
     * Get all content sections on the page
     * @returns {NodeList} All content section elements
     */
    getAll: function() {
        return document.querySelectorAll('.content-section');
    }
};

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SectionComponent;
}
