const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Testing hero text responsive positioning:\n');

    // Test different viewport sizes
    const viewports = [
        { width: 400, height: 800, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1200, height: 900, name: 'Desktop' },
        { width: 1600, height: 900, name: 'Large Desktop' },
        { width: 1920, height: 1080, name: 'Full HD' }
    ];

    for (let viewport of viewports) {
        await page.setViewport(viewport);
        await page.goto('http://localhost:5500/volunteer.html');
        await new Promise(resolve => setTimeout(resolve, 1500));

        const heroTextInfo = await page.evaluate(() => {
            const heroText = document.querySelector('.hero-text');
            if (!heroText) return null;

            const computed = window.getComputedStyle(heroText);
            const rect = heroText.getBoundingClientRect();

            return {
                // Position info
                left: rect.left,
                right: rect.right,
                width: rect.width,

                // Computed styles
                maxWidth: computed.maxWidth,
                marginLeft: computed.marginLeft,
                marginRight: computed.marginRight,
                paddingRight: computed.paddingRight,
                fontSize: computed.fontSize,

                // Distance from edges
                distanceFromLeft: rect.left,
                distanceFromRight: window.innerWidth - rect.right,

                // Container info
                containerWidth: window.innerWidth
            };
        });

        console.log(`${viewport.name} (${viewport.width}x${viewport.height}):`);

        if (heroTextInfo) {
            console.log(`  Max width: ${heroTextInfo.maxWidth}`);
            console.log(`  Actual width: ${heroTextInfo.width}px`);
            console.log(`  Margin left: ${heroTextInfo.marginLeft}`);
            console.log(`  Margin right: ${heroTextInfo.marginRight}`);
            console.log(`  Distance from left edge: ${heroTextInfo.distanceFromLeft}px`);
            console.log(`  Distance from right edge: ${heroTextInfo.distanceFromRight}px`);
            console.log(`  Font size: ${heroTextInfo.fontSize}`);

            // Check if text is properly constrained
            if (viewport.width >= 1200) {
                const maxWidthNum = parseInt(heroTextInfo.maxWidth);
                if (heroTextInfo.width <= maxWidthNum + 10) { // Allow small rounding differences
                    console.log(`  ✓ Text width properly constrained by max-width`);
                } else {
                    console.log(`  ✗ Text width NOT constrained (width: ${heroTextInfo.width}, max: ${heroTextInfo.maxWidth})`);
                }
            }

            // Check if it's aligned to the right
            if (heroTextInfo.marginLeft === 'auto' || parseInt(heroTextInfo.distanceFromLeft) > parseInt(heroTextInfo.distanceFromRight)) {
                console.log(`  ✓ Text aligned to right side`);
            } else {
                console.log(`  ✗ Text NOT properly aligned to right`);
            }
        } else {
            console.log(`  ERROR: Hero text element not found`);
        }

        console.log('');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();