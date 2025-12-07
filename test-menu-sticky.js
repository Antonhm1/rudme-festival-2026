const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({ width: 1280, height: 720 });

    // Navigate to the info page
    await page.goto('http://localhost:3000/info.html');

    // Wait for the page to load
    await page.waitForSelector('.info-main');
    await page.waitForSelector('.menu-container');
    await page.waitForSelector('#date-text');

    // Check initial positions
    const initialPositions = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const dateText = document.querySelector('#date-text');
        const selectDisplay = document.querySelector('#select-display');

        const menuRect = menu.getBoundingClientRect();
        const dateRect = dateText.getBoundingClientRect();
        const selectRect = selectDisplay ? selectDisplay.getBoundingClientRect() : null;

        const menuStyle = window.getComputedStyle(menu);

        return {
            menu: {
                top: menuRect.top,
                height: menuRect.height,
                middle: menuRect.top + (menuRect.height / 2),
                position: menuStyle.position,
                stickyTop: menuStyle.top
            },
            dateText: {
                top: dateRect.top,
                height: dateRect.height,
                middle: dateRect.top + (dateRect.height / 2)
            },
            select: selectRect ? {
                top: selectRect.top,
                height: selectRect.height,
                middle: selectRect.top + (selectRect.height / 2)
            } : null,
            alignment: Math.abs((menuRect.top + menuRect.height/2) - (dateRect.top + dateRect.height/2))
        };
    });

    console.log('Initial state:');
    console.log('Menu position:', initialPositions.menu.position);
    console.log('Menu top:', initialPositions.menu.top);
    console.log('Menu middle:', initialPositions.menu.middle);
    console.log('Date text middle:', initialPositions.dateText.middle);
    console.log('Vertical alignment difference:', initialPositions.alignment, 'px');
    console.log('Menu sticky top value:', initialPositions.menu.stickyTop);

    // Scroll down
    await page.evaluate(() => {
        window.scrollTo(0, 500);
    });

    // Wait a moment for scroll
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check position after scrolling
    const afterScrollPositions = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu.getBoundingClientRect();
        const scrollY = window.pageYOffset;

        return {
            menuTop: menuRect.top,
            scrollY: scrollY,
            isSticky: menuRect.top <= 100 // Check if it's stuck near top
        };
    });

    console.log('\nAfter scrolling 500px:');
    console.log('Menu top position:', afterScrollPositions.menuTop);
    console.log('Page scroll Y:', afterScrollPositions.scrollY);
    console.log('Is menu sticky (near top)?:', afterScrollPositions.isSticky);

    // Scroll back to top
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });

    // Keep browser open for 3 seconds to observe
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();
})();