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
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Testing role header color changes:\n');

    // Test scrolling to each section and checking header colors
    const sections = ['frivillig', 'afvikler', 'arrangor', 'praktikant'];

    for (let sectionId of sections) {
        // Scroll to section
        await page.evaluate((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
        }, sectionId);

        // Wait for color transition
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get background and header colors
        const colors = await page.evaluate((id) => {
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            const section = document.getElementById(id);
            const header = section ? section.querySelector('.role-header') : null;
            const headerColor = header ? window.getComputedStyle(header).color : null;

            return {
                background: bgColor,
                headerText: headerColor,
                sectionColor: section ? section.getAttribute('data-color') : null
            };
        }, sectionId);

        console.log(`Section: ${sectionId}`);
        console.log(`  Background: ${colors.background}`);
        console.log(`  Header text: ${colors.headerText}`);
        console.log(`  Expected section color: ${colors.sectionColor}`);
        console.log('');
    }

    // Test gradual scrolling
    console.log('Testing gradual scroll color changes:\n');

    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 500));

    for (let scroll = 0; scroll <= 2000; scroll += 500) {
        await page.evaluate((y) => window.scrollTo(0, y), scroll);
        await new Promise(resolve => setTimeout(resolve, 300));

        const colors = await page.evaluate(() => {
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            const headers = document.querySelectorAll('.role-header');
            const firstHeaderColor = headers.length > 0 ?
                window.getComputedStyle(headers[0]).color : null;

            return {
                background: bgColor,
                firstHeaderText: firstHeaderColor
            };
        });

        console.log(`At ${scroll}px scroll:`);
        console.log(`  Background: ${colors.background}`);
        console.log(`  First header text: ${colors.firstHeaderText}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();