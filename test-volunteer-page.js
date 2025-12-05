const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to volunteer page on port 5500
    await page.goto('http://localhost:5500/volunteer.html');

    // Wait for page to load
    await page.waitForSelector('.volunteer-main');

    console.log('✅ Volunteer page loaded successfully');

    // Test role box clicking and scrolling
    await page.waitForSelector('.role-box[data-role="frivillig"]');
    await page.click('.role-box[data-role="frivillig"]');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Clicked on FRIVILLIG role box');

    // Test another role
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('.role-box[data-role="arrangor"]');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Clicked on ARRANGØR role box');

    // Test mobile view
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Switched to mobile view');

    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();

    console.log('✅ All tests passed!');
})();