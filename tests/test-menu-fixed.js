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

    console.log('Testing menu fixed position and color changes:\n');

    // Check CSS position style
    const cssPositionCheck = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const computedStyle = menu ? window.getComputedStyle(menu) : null;

        return {
            position: computedStyle ? computedStyle.position : null,
            top: computedStyle ? computedStyle.top : null,
            right: computedStyle ? computedStyle.right : null
        };
    });

    console.log('CSS Position Check:');
    console.log(`  Position: ${cssPositionCheck.position} (should be "fixed")`);
    console.log(`  Top: ${cssPositionCheck.top}`);
    console.log(`  Right: ${cssPositionCheck.right}`);
    console.log('');

    // Get initial state
    const initialState = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu ? menu.getBoundingClientRect() : null;
        const menuBg = menu ? window.getComputedStyle(menu).backgroundColor : null;
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;

        return {
            viewportTop: menuRect ? menuRect.top : null,
            menuBgColor: menuBg,
            bodyBgColor: bodyBg,
            scrollY: window.scrollY
        };
    });

    console.log('Initial state (at top of page):');
    console.log(`  Menu viewport top: ${initialState.viewportTop}px`);
    console.log(`  Menu background: ${initialState.menuBgColor}`);
    console.log(`  Body background: ${initialState.bodyBgColor}`);
    console.log('');

    // Scroll down 1000px
    await page.evaluate(() => window.scrollTo(0, 1000));
    await new Promise(resolve => setTimeout(resolve, 500));

    const afterScrollState = await page.evaluate(() => {
        const menu = document.querySelector('.menu-container');
        const menuRect = menu ? menu.getBoundingClientRect() : null;
        const menuBg = menu ? window.getComputedStyle(menu).backgroundColor : null;
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;

        return {
            viewportTop: menuRect ? menuRect.top : null,
            menuBgColor: menuBg,
            bodyBgColor: bodyBg,
            scrollY: window.scrollY
        };
    });

    console.log('After scrolling 1000px:');
    console.log(`  Menu viewport top: ${afterScrollState.viewportTop}px`);
    console.log(`  Menu background: ${afterScrollState.menuBgColor}`);
    console.log(`  Body background: ${afterScrollState.bodyBgColor}`);

    // For fixed positioning, viewport top should remain the same
    if (cssPositionCheck.position === 'fixed') {
        if (Math.abs(initialState.viewportTop - afterScrollState.viewportTop) < 5) {
            console.log('  ✓ Menu stayed fixed in viewport');
        } else {
            console.log('  ✗ Menu moved despite position:fixed');
        }
    }
    console.log('');

    // Test color changes across sections
    const sections = ['frivillig', 'afvikler', 'arrangor'];
    console.log('Testing color changes across sections:');

    for (let sectionId of sections) {
        await page.evaluate((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
        }, sectionId);

        await new Promise(resolve => setTimeout(resolve, 800));

        const sectionState = await page.evaluate(() => {
            const menu = document.querySelector('.menu-container');
            const menuBg = menu ? window.getComputedStyle(menu).backgroundColor : null;
            const bodyBg = window.getComputedStyle(document.body).backgroundColor;

            return { menuBg, bodyBg };
        });

        console.log(`  ${sectionId}: Menu=${sectionState.menuBg}, Body=${sectionState.bodyBg}`);

        if (sectionState.menuBg === sectionState.bodyBg) {
            console.log(`    ✓ Colors match`);
        } else {
            console.log(`    ✗ Colors don't match`);
        }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();