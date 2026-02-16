const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Testing hero text and roles section layout:\n');

    // Test different viewport sizes
    const viewports = [
        { width: 400, height: 800, name: 'Mobile' },
        { width: 1200, height: 900, name: 'Desktop' },
        { width: 1920, height: 1080, name: 'Full HD' }
    ];

    for (let viewport of viewports) {
        await page.setViewport(viewport);
        await page.goto('http://localhost:5500/frivillig.html');
        await new Promise(resolve => setTimeout(resolve, 1500));

        const layoutInfo = await page.evaluate(() => {
            const heroText = document.querySelector('.hero-text');
            const rolesSection = document.querySelector('.roles-section');

            const heroComputed = heroText ? window.getComputedStyle(heroText) : null;
            const heroRect = heroText ? heroText.getBoundingClientRect() : null;

            const rolesComputed = rolesSection ? window.getComputedStyle(rolesSection) : null;
            const rolesRect = rolesSection ? rolesSection.getBoundingClientRect() : null;

            return {
                hero: heroText ? {
                    paddingTop: heroComputed.paddingTop,
                    maxWidth: heroComputed.maxWidth,
                    marginLeft: heroComputed.marginLeft,
                    marginRight: heroComputed.marginRight,
                    left: heroRect.left,
                    right: heroRect.right,
                    width: heroRect.width
                } : null,
                roles: rolesSection ? {
                    maxWidth: rolesComputed.maxWidth,
                    marginLeft: rolesComputed.marginLeft,
                    marginRight: rolesComputed.marginRight,
                    left: rolesRect.left,
                    right: rolesRect.right,
                    width: rolesRect.width
                } : null
            };
        });

        console.log(`${viewport.name} (${viewport.width}px):`);
        console.log('  Hero Text:');
        if (layoutInfo.hero) {
            console.log(`    Padding top: ${layoutInfo.hero.paddingTop}`);
            console.log(`    Max width: ${layoutInfo.hero.maxWidth}`);
            console.log(`    Width: ${layoutInfo.hero.width}px`);
            console.log(`    Position: ${layoutInfo.hero.left}px from left`);
            console.log(`    Margin: left=${layoutInfo.hero.marginLeft}, right=${layoutInfo.hero.marginRight}`);
        }

        console.log('  Roles Section:');
        if (layoutInfo.roles) {
            console.log(`    Max width: ${layoutInfo.roles.maxWidth}`);
            console.log(`    Width: ${layoutInfo.roles.width}px`);
            console.log(`    Position: ${layoutInfo.roles.left}px from left`);
            console.log(`    Margin: left=${layoutInfo.roles.marginLeft}, right=${layoutInfo.roles.marginRight}`);
        }

        // Check alignment
        if (viewport.width >= 1200) {
            if (layoutInfo.hero && layoutInfo.hero.marginLeft === 'auto') {
                console.log('  ✓ Hero text aligned right (margin-left: auto)');
            }
            if (layoutInfo.roles && layoutInfo.roles.marginRight === 'auto') {
                console.log('  ✓ Roles section aligned left (margin-right: auto)');
            }
        }

        console.log('');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();