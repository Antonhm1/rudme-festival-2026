const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to volunteer page on port 5500
    await page.goto('http://localhost:5500/frivillig.html');

    // Wait for content to load
    await page.waitForSelector('#role-sections-container', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if sections were created and have data-color attributes
    const sectionInfo = await page.evaluate(() => {
        const sections = document.querySelectorAll('.role-section');
        const container = document.getElementById('role-sections-container');
        return {
            containerExists: !!container,
            sectionCount: sections.length,
            sections: Array.from(sections).map(s => ({
                id: s.id,
                dataColor: s.getAttribute('data-color'),
                hasContent: s.querySelector('.role-content-box') !== null,
                offsetTop: s.offsetTop
            }))
        };
    });

    console.log('Section Info:', JSON.stringify(sectionInfo, null, 2));

    // Check if JSON was loaded
    const jsonLoaded = await page.evaluate(() => {
        // Check if fetch was called
        return new Promise(resolve => {
            fetch('assets/volunteers.json')
                .then(response => response.json())
                .then(data => {
                    resolve({
                        loaded: true,
                        roleCount: data.roles ? data.roles.length : 0,
                        firstRole: data.roles ? data.roles[0] : null
                    });
                })
                .catch(err => {
                    resolve({ loaded: false, error: err.message });
                });
        });
    });

    console.log('\nJSON Load Status:', JSON.stringify(jsonLoaded, null, 2));

    // Test clicking on role buttons
    console.log('\nTesting role button clicks:');

    // Check if role boxes exist and have colors
    const roleBoxInfo = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.role-box');
        return Array.from(boxes).map(box => ({
            text: box.textContent,
            dataRole: box.getAttribute('data-role'),
            backgroundColor: box.style.backgroundColor || window.getComputedStyle(box).backgroundColor
        }));
    });

    console.log('Role boxes:', JSON.stringify(roleBoxInfo, null, 2));

    // Try clicking first role box if it exists
    const firstBoxExists = await page.evaluate(() => {
        const box = document.querySelector('.role-box[data-role="frivillig"]');
        return !!box;
    });

    if (firstBoxExists) {
        console.log('\nClicking on FRIVILLIG box...');

        // Get color before click
        const colorBefore = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        console.log('Color before click:', colorBefore);

        // Click the button
        await page.click('.role-box[data-role="frivillig"]');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get color after click
        const colorAfter = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        console.log('Color after click:', colorAfter);

        // Get scroll position
        const scrollPos = await page.evaluate(() => window.scrollY);
        console.log('Scroll position after click:', scrollPos);
    }

    // Check if the color transition function is working
    const functionCheck = await page.evaluate(() => {
        // Check if functions exist
        return {
            hasInitializeColorTransitions: typeof initializeColorTransitions === 'function',
            hasUpdateBackgroundColor: typeof window.updateBackgroundColor === 'function',
            bodyStyle: document.body.style.backgroundColor,
            computedStyle: window.getComputedStyle(document.body).backgroundColor
        };
    });

    console.log('\nFunction Check:', JSON.stringify(functionCheck, null, 2));

    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
})();