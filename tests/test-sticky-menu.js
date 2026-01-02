const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to volunteer page on port 5500
    await page.goto('http://localhost:5500/volunteer.html');

    // Wait for content to load
    await page.waitForSelector('.role-section', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Testing sticky menu behavior:\n');

    // Check CSS position style
    const cssPositionCheck = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const computedStyle = menu ? window.getComputedStyle(menu) : null;

        return {
            position: computedStyle ? computedStyle.position : null,
            top: computedStyle ? computedStyle.top : null
        };
    });

    console.log('CSS Position Check:');
    console.log(`  Position: ${cssPositionCheck.position} (should be "sticky")`);
    console.log(`  Top: ${cssPositionCheck.top} (stick point)`);
    console.log('');

    // Get initial state
    const initialState = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu ? menu.getBoundingClientRect() : null;

        return {
            menuTop: menuRect ? menuRect.top : null,
            scrollY: window.scrollY
        };
    });

    console.log('Initial state (at top of page):');
    console.log(`  Menu position from viewport top: ${initialState.menuTop}px`);
    console.log(`  Scroll position: ${initialState.scrollY}px`);
    console.log('');

    // Scroll down slightly (50px)
    await page.evaluate(() => window.scrollTo(0, 50));
    await new Promise(resolve => setTimeout(resolve, 300));

    const afterSmallScroll = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu ? menu.getBoundingClientRect() : null;

        return {
            menuTop: menuRect ? menuRect.top : null,
            scrollY: window.scrollY
        };
    });

    console.log('After scrolling 50px:');
    console.log(`  Menu position from viewport top: ${afterSmallScroll.menuTop}px`);
    const menuMoved1 = initialState.menuTop - afterSmallScroll.menuTop;
    console.log(`  Menu moved up by: ${menuMoved1}px (should move with scroll initially)`);
    console.log('');

    // Scroll down more (500px total)
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(resolve => setTimeout(resolve, 300));

    const afterLargeScroll = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu ? menu.getBoundingClientRect() : null;

        return {
            menuTop: menuRect ? menuRect.top : null,
            scrollY: window.scrollY
        };
    });

    console.log('After scrolling 500px:');
    console.log(`  Menu position from viewport top: ${afterLargeScroll.menuTop}px`);

    // Check if menu has stuck
    if (Math.abs(afterLargeScroll.menuTop - 20) < 5) {
        console.log(`  ✓ Menu stuck at top (20px from viewport top)`);
    } else {
        console.log(`  Menu position: ${afterLargeScroll.menuTop}px`);
    }
    console.log('');

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 500));

    const afterScrollUp = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu ? menu.getBoundingClientRect() : null;

        return {
            menuTop: menuRect ? menuRect.top : null
        };
    });

    console.log('After scrolling back to top:');
    console.log(`  Menu position from viewport top: ${afterScrollUp.menuTop}px`);
    if (Math.abs(afterScrollUp.menuTop - initialState.menuTop) < 5) {
        console.log(`  ✓ Menu returned to original position`);
    }

    // Test color changes still work
    console.log('\nTesting color changes with sticky menu:');

    await page.evaluate(() => {
        const element = document.getElementById('frivillig');
        if (element) {
            element.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    });
    await new Promise(resolve => setTimeout(resolve, 800));

    const colorState = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuBg = menu ? window.getComputedStyle(menu).backgroundColor : null;
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;

        return { menuBg, bodyBg };
    });

    console.log(`  Menu background: ${colorState.menuBg}`);
    console.log(`  Body background: ${colorState.bodyBg}`);

    if (colorState.menuBg === colorState.bodyBg) {
        console.log(`  ✓ Colors still match with sticky positioning`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();