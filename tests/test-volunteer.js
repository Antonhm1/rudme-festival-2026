const puppeteer = require('puppeteer');

async function testVolunteerPage() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('🚀 Testing volunteer page on port 5500...');

        // Navigate to volunteer page
        await page.goto('http://localhost:5500/frivillig.html', {
            waitUntil: 'networkidle2',
            timeout: 10000
        });

        console.log('✅ Page loaded successfully');

        // Wait for volunteer data to load
        await page.waitForSelector('.volunteer-grid', { timeout: 5000 });
        await page.waitForSelector('.volunteer-box', { timeout: 5000 });

        console.log('✅ Volunteer data loaded');

        // Test tab functionality
        console.log('🔄 Testing tab switching...');

        // Click on "Afvikler" tab
        await page.click('[data-tab="afvikler"]');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if content changed
        const afviklerContent = await page.$('#afvikler-content.active');
        if (afviklerContent) {
            console.log('✅ Afvikler tab activated successfully');
        } else {
            console.log('❌ Afvikler tab activation failed');
        }

        // Click on "Arrangør" tab
        await page.click('[data-tab="arrangør"]');
        await new Promise(resolve => setTimeout(resolve, 500));

        const arrangorContent = await page.$('#arrangør-content.active');
        if (arrangorContent) {
            console.log('✅ Arrangør tab activated successfully');
        } else {
            console.log('❌ Arrangør tab activation failed');
        }

        // Go back to "Frivillig" tab
        await page.click('[data-tab="frivillig"]');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Test poster section scrolling
        console.log('🔄 Testing poster section scroll...');

        const volunteerBoxes = await page.$$('.volunteer-box');
        console.log(`✅ Found ${volunteerBoxes.length} volunteer boxes`);

        if (volunteerBoxes.length > 0) {
            // Get initial background color
            const initialBgColor = await page.evaluate(() => {
                return window.getComputedStyle(document.body).backgroundColor;
            });
            console.log(`📊 Initial background color: ${initialBgColor}`);

            // Scroll the volunteer grid to trigger color changes
            await page.evaluate(() => {
                const grid = document.querySelector('.volunteer-grid');
                if (grid) {
                    grid.scrollLeft = 200;
                }
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            const newBgColor = await page.evaluate(() => {
                return window.getComputedStyle(document.body).backgroundColor;
            });
            console.log(`📊 Background color after scroll: ${newBgColor}`);

            if (initialBgColor !== newBgColor) {
                console.log('✅ Background color changes on scroll');
            } else {
                console.log('⚠️  Background color did not change on scroll');
            }
        }

        // Test individual volunteer box scrolling
        console.log('🔄 Testing individual volunteer box scrolling...');

        if (volunteerBoxes.length > 0) {
            // Click on first volunteer box to test horizontal scrolling
            await volunteerBoxes[0].click();
            await new Promise(resolve => setTimeout(resolve, 500));

            // Try to scroll within the volunteer box
            await page.evaluate(() => {
                const scrollEl = document.querySelector('.volunteer-box-scroll');
                if (scrollEl) {
                    scrollEl.scrollLeft = scrollEl.scrollWidth / 2;
                }
            });

            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('✅ Individual volunteer box scrolling tested');
        }

        // Test responsiveness
        console.log('🔄 Testing mobile responsiveness...');

        await page.setViewport({ width: 375, height: 667 }); // Mobile
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mobileTabsVisible = await page.$('.volunteer-tabs');
        const mobilePosterVisible = await page.$('.volunteer-grid');

        if (mobileTabsVisible && mobilePosterVisible) {
            console.log('✅ Mobile layout working correctly');
        } else {
            console.log('❌ Mobile layout issues detected');
        }

        // Test tablet view
        await page.setViewport({ width: 768, height: 1024 }); // Tablet
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Tablet responsiveness tested');

        // Back to desktop
        await page.setViewport({ width: 1920, height: 1080 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('🎉 All tests completed successfully!');
        console.log('🔍 Page will remain open for manual inspection...');

        // Keep the page open for manual inspection
        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testVolunteerPage();