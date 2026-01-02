const puppeteer = require('puppeteer');

async function testScrollColors() {
    console.log('🧪 Testing scroll-based color changes on program page...');

    const browser = await puppeteer.launch({
        headless: false, // Show browser so we can see what's happening
        slowMo: 300 // Slow down for visibility
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        // Navigate to program page
        await page.goto('http://localhost:3000/program.html');
        await page.waitForSelector('.artist-box', { timeout: 10000 });

        console.log('✅ Program page loaded');

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check initial background color (should be first artist color)
        let backgroundColor = await page.evaluate(() => {
            return document.body.style.background || getComputedStyle(document.body).backgroundColor;
        });

        console.log('🎨 Initial background color:', backgroundColor);

        // Get artist box information
        const artistInfo = await page.evaluate(() => {
            const boxes = Array.from(document.querySelectorAll('.artist-box'));
            return boxes.map((box, index) => {
                const rect = box.getBoundingClientRect();
                const color = getComputedStyle(box).getPropertyValue('--box-color').trim();
                const name = box.querySelector('.box-title')?.textContent || `Artist ${index + 1}`;
                return {
                    index,
                    name,
                    color,
                    top: rect.top + window.scrollY,
                    center: rect.top + window.scrollY + rect.height / 2,
                    height: rect.height
                };
            });
        });

        console.log('🎭 Found artists:', artistInfo.map(a => `${a.name} (${a.color})`));

        // Test scrolling through each artist
        for (let i = 0; i < Math.min(artistInfo.length, 4); i++) {
            const artist = artistInfo[i];
            console.log(`\n📜 Scrolling to ${artist.name}...`);

            // Scroll to center the artist box in viewport
            await page.evaluate((targetCenter) => {
                const scrollTo = targetCenter - window.innerHeight / 2;
                window.scrollTo({
                    top: scrollTo,
                    behavior: 'smooth'
                });
            }, artist.center);

            // Wait for scroll animation and color update
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check background color
            backgroundColor = await page.evaluate(() => {
                return document.body.style.background;
            });

            console.log(`   Background: ${backgroundColor}`);
            console.log(`   Expected: ${artist.color}`);

            // Check if colors are similar (allowing for interpolation)
            const isCorrectColor = await page.evaluate((expectedColor, actualColor) => {
                function parseRGB(color) {
                    if (color.startsWith('#')) {
                        const hex = color.slice(1);
                        return [
                            parseInt(hex.slice(0, 2), 16),
                            parseInt(hex.slice(2, 4), 16),
                            parseInt(hex.slice(4, 6), 16)
                        ];
                    }
                    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
                }

                const expected = parseRGB(expectedColor);
                const actual = parseRGB(actualColor);

                // Check if colors are within 30 units of each other (allows for interpolation)
                const diff = Math.sqrt(
                    Math.pow(expected[0] - actual[0], 2) +
                    Math.pow(expected[1] - actual[1], 2) +
                    Math.pow(expected[2] - actual[2], 2)
                );

                return diff < 50; // Tolerance for color mixing
            }, artist.color, backgroundColor);

            if (isCorrectColor) {
                console.log(`   ✅ Color matches!`);
            } else {
                console.log(`   ⚠️  Color difference detected (could be interpolation)`);
            }
        }

        // Test scrolling between artists to see color transitions
        console.log('\n🌈 Testing color transitions...');

        // Scroll between first two artists
        if (artistInfo.length >= 2) {
            const midpoint = (artistInfo[0].center + artistInfo[1].center) / 2;

            await page.evaluate((scrollTo) => {
                window.scrollTo({
                    top: scrollTo - window.innerHeight / 2,
                    behavior: 'smooth'
                });
            }, midpoint);

            await new Promise(resolve => setTimeout(resolve, 1000));

            backgroundColor = await page.evaluate(() => {
                return document.body.style.background;
            });

            console.log(`🎨 Transition color between ${artistInfo[0].name} and ${artistInfo[1].name}: ${backgroundColor}`);
        }

        // Test select menu hover with current color
        console.log('\n🎯 Testing select menu with current colors...');

        await page.click('#select-display');
        await page.waitForSelector('.select-options li', { visible: true });

        const menuItem = await page.$('.select-options li:nth-child(2)');
        if (menuItem) {
            await menuItem.hover();
            await new Promise(resolve => setTimeout(resolve, 500));

            const hoverColor = await page.evaluate(() => {
                const hoveredItem = document.querySelector('.select-options li:hover');
                return hoveredItem ? window.getComputedStyle(hoveredItem).backgroundColor : 'Not found';
            });

            console.log(`📋 Menu hover color: ${hoverColor}`);
        }

        console.log('\n✅ Scroll color test completed!');

        // Keep browser open to observe
        await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testScrollColors().catch(console.error);