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

    // Check if the page is scrollable
    const isScrollable = await page.evaluate(() => {
        return document.body.scrollHeight > window.innerHeight;
    });

    console.log('Page is scrollable:', isScrollable);
    console.log('Body overflow style:', await page.evaluate(() => window.getComputedStyle(document.body).overflow));
    console.log('Document height:', await page.evaluate(() => document.body.scrollHeight));
    console.log('Viewport height:', await page.evaluate(() => window.innerHeight));

    // Try to scroll
    await page.evaluate(() => {
        window.scrollTo(0, 500);
    });

    // Check scroll position
    const scrollPosition = await page.evaluate(() => window.pageYOffset);
    console.log('Scroll position after scrolling:', scrollPosition);

    // Scroll to bottom
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });

    const finalScrollPosition = await page.evaluate(() => window.pageYOffset);
    console.log('Final scroll position:', finalScrollPosition);

    // Keep browser open for 3 seconds to observe
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();
})();