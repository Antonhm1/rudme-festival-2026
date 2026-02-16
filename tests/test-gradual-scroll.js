const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to volunteer page on port 5500
    await page.goto('http://localhost:5500/frivillig.html');

    // Wait for content to load
    await page.waitForSelector('.role-section', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get initial background color
    let lastColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('Initial background color:', lastColor);

    // Gradually scroll down and check colors
    console.log('\nGradually scrolling and checking colors:');

    for (let scroll = 0; scroll <= 4000; scroll += 400) {
        await page.evaluate((scrollY) => {
            window.scrollTo(0, scrollY);
        }, scroll);

        await new Promise(resolve => setTimeout(resolve, 200));

        const currentColor = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });

        if (currentColor !== lastColor) {
            console.log(`  At scroll position ${scroll}px: ${currentColor}`);
            lastColor = currentColor;
        }
    }

    // Check what happens with smooth scrolling
    console.log('\nTesting smooth scroll to sections:');

    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Smooth scroll to first section
    await page.evaluate(() => {
        const element = document.getElementById('frivillig');
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 150,
                behavior: 'smooth'
            });
        }
    });

    // Check color changes during smooth scroll
    for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const color = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        console.log(`  During smooth scroll (${i * 200}ms): ${color}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();