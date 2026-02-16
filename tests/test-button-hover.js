/**
 * Test for button hover random color effect
 * Tests the random color hover effect on black buttons across the site
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:5500';

// Pages to test with their button selectors
const testCases = [
    {
        page: '/rudmelejr.html',
        buttons: ['.intro-button', '.cta-button'],
        description: 'Camp page buttons'
    },
    {
        page: '/frivillig.html',
        buttons: ['.content-section-button'],
        description: 'Volunteer page section buttons'
    },
    {
        page: '/frivillig.html',
        buttons: ['.footer-buy-ticket-btn'],
        description: 'Footer button on volunteer page',
        waitForFooter: true
    }
];

async function testButtonHover() {
    const browser = await puppeteer.launch({ headless: 'new' });
    let allPassed = true;

    try {
        for (const testCase of testCases) {
            console.log(`\nTesting: ${testCase.description}`);
            console.log(`URL: ${BASE_URL}${testCase.page}`);

            const page = await browser.newPage();
            await page.goto(`${BASE_URL}${testCase.page}`, { waitUntil: 'networkidle0' });

            // Wait for footer if needed
            if (testCase.waitForFooter) {
                await page.waitForSelector('.site-footer', { timeout: 5000 });
                // Extra wait for the footer content to fully load
                await new Promise(r => setTimeout(r, 1000));
            }

            for (const buttonSelector of testCase.buttons) {
                try {
                    // Wait for button to appear
                    await page.waitForSelector(buttonSelector, { timeout: 5000 });

                    // Get initial button styles
                    const initialStyles = await page.evaluate((selector) => {
                        const button = document.querySelector(selector);
                        if (!button) return null;
                        const styles = window.getComputedStyle(button);
                        return {
                            backgroundColor: styles.backgroundColor,
                            color: styles.color
                        };
                    }, buttonSelector);

                    if (!initialStyles) {
                        console.log(`  ❌ ${buttonSelector}: Button not found`);
                        allPassed = false;
                        continue;
                    }

                    console.log(`  Initial styles for ${buttonSelector}:`);
                    console.log(`    Background: ${initialStyles.backgroundColor}`);
                    console.log(`    Color: ${initialStyles.color}`);

                    // Hover over the button
                    await page.hover(buttonSelector);

                    // Wait a moment for the effect to apply
                    await new Promise(r => setTimeout(r, 100));

                    // Get styles after hover
                    const hoverStyles = await page.evaluate((selector) => {
                        const button = document.querySelector(selector);
                        if (!button) return null;
                        const styles = window.getComputedStyle(button);
                        return {
                            backgroundColor: styles.backgroundColor,
                            color: styles.color
                        };
                    }, buttonSelector);

                    console.log(`  Hover styles for ${buttonSelector}:`);
                    console.log(`    Background: ${hoverStyles.backgroundColor}`);
                    console.log(`    Color: ${hoverStyles.color}`);

                    // Check if colors changed
                    const bgChanged = initialStyles.backgroundColor !== hoverStyles.backgroundColor;
                    const colorChanged = initialStyles.color !== hoverStyles.color;

                    if (bgChanged || colorChanged) {
                        console.log(`  ✅ ${buttonSelector}: Colors changed on hover`);
                    } else {
                        console.log(`  ❌ ${buttonSelector}: Colors did NOT change on hover`);
                        allPassed = false;
                    }

                } catch (err) {
                    console.log(`  ❌ ${buttonSelector}: Error - ${err.message}`);
                    allPassed = false;
                }
            }

            await page.close();
        }
    } finally {
        await browser.close();
    }

    console.log('\n' + '='.repeat(50));
    if (allPassed) {
        console.log('✅ All button hover tests PASSED');
    } else {
        console.log('❌ Some button hover tests FAILED');
    }

    return allPassed;
}

testButtonHover()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(err => {
        console.error('Test error:', err);
        process.exit(1);
    });
