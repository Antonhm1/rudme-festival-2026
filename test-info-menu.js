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

    // Check initial menu position and background
    const initialMenuPosition = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const selectBg = document.querySelector('.select-bg');
        const bgColor = window.getComputedStyle(selectBg).backgroundColor;
        const pageColor = window.getComputedStyle(document.body).backgroundColor;
        const menuPos = window.getComputedStyle(menu).position;
        const menuTop = menu.getBoundingClientRect().top;

        return {
            menuPosition: menuPos,
            menuTop: menuTop,
            selectBgColor: bgColor,
            pageBackgroundColor: pageColor,
            colorsMatch: bgColor === pageColor
        };
    });

    console.log('Initial state:');
    console.log('Menu position style:', initialMenuPosition.menuPosition);
    console.log('Menu top position:', initialMenuPosition.menuTop);
    console.log('Select background color:', initialMenuPosition.selectBgColor);
    console.log('Page background color:', initialMenuPosition.pageBackgroundColor);
    console.log('Colors match:', initialMenuPosition.colorsMatch);

    // Scroll down
    await page.evaluate(() => {
        window.scrollTo(0, 500);
    });

    // Wait a moment for scroll
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check menu position after scrolling
    const afterScrollPosition = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuTop = menu.getBoundingClientRect().top;
        const scrollY = window.pageYOffset;

        return {
            menuTop: menuTop,
            scrollY: scrollY,
            menuScrolledAway: menuTop < 0
        };
    });

    console.log('\nAfter scrolling 500px:');
    console.log('Menu top position:', afterScrollPosition.menuTop);
    console.log('Page scroll Y:', afterScrollPosition.scrollY);
    console.log('Menu scrolled away:', afterScrollPosition.menuScrolledAway);

    // Check logo and date colors
    const logoDateColors = await page.evaluate(() => {
        const logo = document.querySelector('#logo-container svg');
        const dateText = document.querySelector('#date-text');

        return {
            logoColor: logo ? window.getComputedStyle(logo).color : 'not found',
            dateColor: dateText ? window.getComputedStyle(dateText).color : 'not found'
        };
    });

    console.log('\nLogo and date colors:');
    console.log('Logo color:', logoDateColors.logoColor);
    console.log('Date text color:', logoDateColors.dateColor);

    // Keep browser open for 3 seconds to observe
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();
})();