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
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get initial background color
    const initialColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('Initial background color:', initialColor);

    // Scroll to different sections and check colors
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

        // Get current background color
        const currentColor = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });

        // Get expected color from data attribute
        const expectedColor = await page.evaluate((id) => {
            const section = document.getElementById(id);
            return section ? section.getAttribute('data-color') : null;
        }, sectionId);

        console.log(`Section ${sectionId}:`);
        console.log('  Current color:', currentColor);
        console.log('  Expected color:', expectedColor);
    }

    // Check if sections exist
    const sectionCount = await page.evaluate(() => {
        return document.querySelectorAll('.role-section').length;
    });
    console.log('\nTotal sections found:', sectionCount);

    // Check data-color attributes
    const colorData = await page.evaluate(() => {
        const sections = document.querySelectorAll('.role-section');
        return Array.from(sections).map(s => ({
            id: s.id,
            dataColor: s.getAttribute('data-color')
        }));
    });
    console.log('\nSection color data:', colorData);

    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
})();