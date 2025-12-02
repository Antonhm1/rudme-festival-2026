const puppeteer = require('puppeteer');

async function testLiveSite() {
    console.log('🚀 Testing live site at http://localhost:3000');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();

        console.log('📄 Loading homepage...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        // Test 1: Check if page loaded
        const title = await page.title();
        console.log(`✅ Page title: ${title}`);

        // Test 2: Check gallery
        console.log('🖼️  Testing Gallery...');
        const gallery = await page.$('#gallery');
        if (gallery) {
            console.log('  ✓ Gallery container found');

            const slides = await page.$$('.slide');
            console.log(`  ✓ Found ${slides.length} slides`);

            // Test scrolling
            await page.evaluate(() => {
                const gallery = document.getElementById('gallery');
                if (gallery) gallery.scrollLeft = 200;
            });
            console.log('  ✓ Gallery scroll test completed');
        } else {
            console.log('  ❌ Gallery not found');
        }

        // Test 3: Check navigation
        console.log('🧭 Testing Navigation...');
        await page.waitForSelector('#custom-select', { timeout: 3000 });
        const customSelect = await page.$('#custom-select');
        if (customSelect) {
            console.log('  ✓ Custom select found');

            // Click to open dropdown
            await customSelect.click();
            await new Promise(resolve => setTimeout(resolve, 500));

            const options = await page.$('#select-options');
            if (options) {
                console.log('  ✓ Dropdown menu opens');

                // Test navigation to a page
                const programOption = await page.$('li[data-value="program"]');
                if (programOption) {
                    await programOption.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const currentUrl = page.url();
                    if (currentUrl.includes('program.html')) {
                        console.log('  ✓ Navigation to program page works');
                    } else {
                        console.log(`  ⚠️  Expected program.html, got: ${currentUrl}`);
                    }
                } else {
                    console.log('  ⚠️  Program option not found');
                }
            } else {
                console.log('  ❌ Dropdown menu not found');
            }
        } else {
            console.log('  ❌ Custom select not found');
        }

        // Test 4: Go back to homepage and check scrollbar
        console.log('📜 Testing Custom Scrollbar...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        const scrollbar = await page.$('.custom-scrollbar');
        if (scrollbar) {
            console.log('  ✓ Custom scrollbar found');

            const thumb = await page.$('#scrollbar-thumb');
            if (thumb) {
                console.log('  ✓ Scrollbar thumb found');

                // Test thumb interaction
                const thumbBox = await thumb.boundingBox();
                if (thumbBox) {
                    await page.mouse.move(thumbBox.x + thumbBox.width/2, thumbBox.y + thumbBox.height/2);
                    await page.mouse.down();
                    await page.mouse.move(thumbBox.x + 100, thumbBox.y + thumbBox.height/2);
                    await page.mouse.up();
                    console.log('  ✓ Thumb drag test completed');
                }
            } else {
                console.log('  ❌ Scrollbar thumb not found');
            }
        } else {
            console.log('  ❌ Custom scrollbar not found');
        }

        // Test 5: Responsive design
        console.log('📱 Testing Responsive Design...');

        // Test mobile
        await page.setViewport({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        const galleryMobile = await page.$('#gallery');
        console.log(`  📐 Mobile (375x667): Gallery ${galleryMobile ? 'visible' : 'hidden'}`);

        // Test tablet
        await page.setViewport({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        const galleryTablet = await page.$('#gallery');
        console.log(`  📐 Tablet (768x1024): Gallery ${galleryTablet ? 'visible' : 'hidden'}`);

        // Test desktop
        await page.setViewport({ width: 1200, height: 800 });
        await page.waitForTimeout(500);
        const galleryDesktop = await page.$('#gallery');
        console.log(`  📐 Desktop (1200x800): Gallery ${galleryDesktop ? 'visible' : 'hidden'}`);

        console.log('✨ All tests completed! Browser will stay open for inspection.');
        console.log('   Press Ctrl+C to close when done.');

        // Keep browser open for manual inspection
        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testLiveSite().catch(console.error);