const puppeteer = require('puppeteer');

async function testSelectHover() {
    console.log('🧪 Testing select menu hover colors on program page...');

    const browser = await puppeteer.launch({
        headless: false, // Show browser so we can see what's happening
        slowMo: 500 // Slow down for visibility
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        // Navigate to program page
        await page.goto('http://localhost:3000/program.html');
        await page.waitForSelector('.artist-box', { timeout: 10000 });

        console.log('✅ Program page loaded');

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check initial state
        console.log('🔍 Checking initial hover color...');

        // Open the select menu first
        await page.click('#select-display');
        await page.waitForSelector('.select-options li', { visible: true });

        // Test initial hover color (should be light gray)
        const initialHoverColor = await page.evaluate(() => {
            const style = document.getElementById('program-select-hover-styles');
            return style ? style.textContent : 'No styles found';
        });

        console.log('Initial hover styles:', initialHoverColor);

        // Close the menu
        await page.click('body');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Test hovering over an artist box
        console.log('🎨 Testing artist box hover...');

        // Hover over the first artist box (ANIMAUX ANIMÉ - gray)
        const firstBox = await page.$('.artist-box');
        if (firstBox) {
            await firstBox.hover();
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if background changed
            const backgroundColor = await page.evaluate(() => {
                return document.body.style.background;
            });

            console.log('Background after hover:', backgroundColor);

            // Open menu again to test hover color
            await page.click('#select-display');
            await page.waitForSelector('.select-options li', { visible: true });

            // Check hover styles after artist box hover
            const artistHoverStyles = await page.evaluate(() => {
                const style = document.getElementById('program-select-hover-styles');
                return style ? style.textContent : 'No styles found';
            });

            console.log('Hover styles after artist hover:', artistHoverStyles);

            // Test actual hover on menu item
            const menuItem = await page.$('.select-options li:nth-child(2)');
            if (menuItem) {
                await menuItem.hover();
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Get the computed background color of the hovered menu item
                const hoveredBgColor = await page.evaluate(() => {
                    const hoveredItem = document.querySelector('.select-options li:hover');
                    if (hoveredItem) {
                        return window.getComputedStyle(hoveredItem).backgroundColor;
                    }
                    return 'No hovered item found';
                });

                console.log('🎯 Hovered menu item background:', hoveredBgColor);

                // Test another artist box to see color change
                console.log('🔄 Testing color change with different artist...');

                // Close menu first
                await page.click('body');
                await new Promise(resolve => setTimeout(resolve, 500));

                // Hover over second artist box (should be different color)
                const secondBox = await page.$('.artist-box:nth-child(2)');
                if (secondBox) {
                    await secondBox.hover();
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const newBackgroundColor = await page.evaluate(() => {
                        return document.body.style.background;
                    });

                    console.log('Background after second artist hover:', newBackgroundColor);

                    // Test menu hover with new color
                    await page.click('#select-display');
                    await page.waitForSelector('.select-options li', { visible: true });

                    const newHoverStyles = await page.evaluate(() => {
                        const style = document.getElementById('program-select-hover-styles');
                        return style ? style.textContent : 'No styles found';
                    });

                    console.log('New hover styles:', newHoverStyles);

                    const menuItem2 = await page.$('.select-options li:nth-child(3)');
                    if (menuItem2) {
                        await menuItem2.hover();
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const newHoveredBgColor = await page.evaluate(() => {
                            const hoveredItem = document.querySelector('.select-options li:hover');
                            if (hoveredItem) {
                                return window.getComputedStyle(hoveredItem).backgroundColor;
                            }
                            return 'No hovered item found';
                        });

                        console.log('🎯 New hovered menu item background:', newHoveredBgColor);
                    }
                }
            }
        }

        console.log('✅ Hover test completed!');

        // Keep browser open for 5 seconds to see results
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testSelectHover().catch(console.error);