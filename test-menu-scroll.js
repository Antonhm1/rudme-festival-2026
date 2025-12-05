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

    console.log('Testing menu scroll behavior and color changes:\n');

    // Get initial menu position and colors
    const initialState = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu ? menu.getBoundingClientRect() : null;
        const menuBg = menu ? window.getComputedStyle(menu).backgroundColor : null;
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const selectDisplay = document.querySelector('.select-display');
        const selectBg = selectDisplay ? window.getComputedStyle(selectDisplay).backgroundColor : null;

        return {
            menuTop: menuRect ? menuRect.top : null,
            menuBgColor: menuBg,
            bodyBgColor: bodyBg,
            selectBgColor: selectBg,
            scrollY: window.scrollY
        };
    });

    console.log('Initial state:');
    console.log(`  Menu top position: ${initialState.menuTop}px`);
    console.log(`  Menu background: ${initialState.menuBgColor}`);
    console.log(`  Body background: ${initialState.bodyBgColor}`);
    console.log(`  Select background: ${initialState.selectBgColor}`);
    console.log(`  Scroll position: ${initialState.scrollY}px`);
    console.log('');

    // Scroll down 500px
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(resolve => setTimeout(resolve, 500));

    const afterScrollState = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu ? menu.getBoundingClientRect() : null;
        const menuBg = menu ? window.getComputedStyle(menu).backgroundColor : null;
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const selectDisplay = document.querySelector('.select-display');
        const selectBg = selectDisplay ? window.getComputedStyle(selectDisplay).backgroundColor : null;

        return {
            menuTop: menuRect ? menuRect.top : null,
            menuBgColor: menuBg,
            bodyBgColor: bodyBg,
            selectBgColor: selectBg,
            scrollY: window.scrollY
        };
    });

    console.log('After scrolling 500px:');
    console.log(`  Menu top position: ${afterScrollState.menuTop}px`);
    console.log(`  Menu background: ${afterScrollState.menuBgColor}`);
    console.log(`  Body background: ${afterScrollState.bodyBgColor}`);
    console.log(`  Select background: ${afterScrollState.selectBgColor}`);
    console.log(`  Scroll position: ${afterScrollState.scrollY}px`);

    // Check if menu stayed fixed
    const menuScrolled = initialState.menuTop !== afterScrollState.menuTop;
    if (!menuScrolled && initialState.menuTop === afterScrollState.menuTop) {
        console.log(`  ✓ Menu stayed fixed at ${afterScrollState.menuTop}px (position: fixed working correctly)`);
    } else {
        const scrollDiff = initialState.menuTop - afterScrollState.menuTop;
        console.log(`  ✗ Menu position changed by ${scrollDiff}px (should stay fixed)`);
    }
    console.log('');

    // Scroll to green section (frivillig)
    console.log('Scrolling to green (frivillig) section:');
    await page.evaluate(() => {
        const element = document.getElementById('frivillig');
        if (element) {
            element.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const greenState = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuBg = menu ? window.getComputedStyle(menu).backgroundColor : null;
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const selectDisplay = document.querySelector('.select-display');
        const selectBg = selectDisplay ? window.getComputedStyle(selectDisplay).backgroundColor : null;

        return {
            menuBgColor: menuBg,
            bodyBgColor: bodyBg,
            selectBgColor: selectBg,
            expectedColor: document.getElementById('frivillig').getAttribute('data-color')
        };
    });

    console.log(`  Expected color: ${greenState.expectedColor}`);
    console.log(`  Menu background: ${greenState.menuBgColor}`);
    console.log(`  Body background: ${greenState.bodyBgColor}`);
    console.log(`  Select background: ${greenState.selectBgColor}`);
    console.log('');

    // Test color consistency
    console.log('Color consistency check:');
    if (greenState.menuBgColor === greenState.bodyBgColor) {
        console.log('  ✓ Menu background matches body background');
    } else {
        console.log('  ✗ Menu background does NOT match body background');
    }

    if (greenState.selectBgColor === greenState.bodyBgColor) {
        console.log('  ✓ Select display background matches body background');
    } else {
        console.log('  ✗ Select display background does NOT match body background');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();