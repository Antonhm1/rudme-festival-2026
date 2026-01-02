const puppeteer = require('puppeteer');

async function debugScrollSystem() {
    console.log('🔍 Debugging scroll color system on LIVE server...');

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500,
        devtools: true // Open dev tools to see console
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        // Navigate to program page on live server (port 5500)
        console.log('📡 Connecting to Live Server extension on port 5500...');
        await page.goto('http://localhost:5500/program.html');
        await page.waitForSelector('.artist-box', { timeout: 10000 });

        console.log('✅ Program page loaded from live server');

        // Enable console logging from the page
        page.on('console', msg => {
            console.log('🌐 BROWSER:', msg.text());
        });

        // Wait longer for all scripts to load and initialize
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if our scroll system was initialized
        const systemStatus = await page.evaluate(() => {
            // Check if our scroll color system exists
            const hasSystem = typeof window.programColorSystem !== 'undefined';
            const artistBoxes = document.querySelectorAll('.artist-box').length;
            const hasScrollListener = window.listeners || 'unknown';

            return {
                hasSystem,
                artistBoxes,
                bodyBackground: document.body.style.background,
                computedBackground: getComputedStyle(document.body).backgroundColor
            };
        });

        console.log('🔍 System status:', systemStatus);

        if (!systemStatus.hasSystem) {
            console.log('❌ Scroll color system not initialized!');

            // Check what scripts are loaded
            const scripts = await page.evaluate(() => {
                return Array.from(document.scripts).map(script => ({
                    src: script.src,
                    text: script.textContent ? script.textContent.slice(0, 100) + '...' : 'No content'
                }));
            });

            console.log('📜 Loaded scripts:', scripts);

            // Try to manually initialize
            console.log('🔧 Attempting manual initialization...');
            await page.evaluate(() => {
                if (typeof initializeScrollColorSystem === 'function') {
                    console.log('Found initializeScrollColorSystem function, calling it...');
                    window.programColorSystem = initializeScrollColorSystem();
                    window.programColorSystem.init();
                } else {
                    console.log('initializeScrollColorSystem function not found!');
                }
            });
        }

        // Test actual scrolling
        console.log('📜 Testing scroll behavior...');

        // Get artist box positions
        const artistData = await page.evaluate(() => {
            const boxes = Array.from(document.querySelectorAll('.artist-box'));
            return boxes.map((box, i) => {
                const rect = box.getBoundingClientRect();
                const color = getComputedStyle(box).getPropertyValue('--box-color').trim();
                const name = box.querySelector('.box-title')?.textContent || `Artist ${i + 1}`;
                return {
                    name,
                    color,
                    top: rect.top + window.scrollY,
                    center: rect.top + window.scrollY + rect.height / 2,
                    height: rect.height
                };
            });
        });

        console.log('🎭 Artist data:', artistData);

        if (artistData.length > 0) {
            // Scroll to each artist and check color change
            for (let i = 0; i < Math.min(3, artistData.length); i++) {
                const artist = artistData[i];
                console.log(`\n📜 Scrolling to ${artist.name} (${artist.color})...`);

                await page.evaluate((targetCenter) => {
                    window.scrollTo({
                        top: Math.max(0, targetCenter - window.innerHeight / 2),
                        behavior: 'smooth'
                    });
                }, artist.center);

                // Wait for scroll
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check current background
                const currentBg = await page.evaluate(() => {
                    return {
                        style: document.body.style.background,
                        computed: getComputedStyle(document.body).backgroundColor,
                        scrollY: window.scrollY,
                        viewportCenter: window.scrollY + window.innerHeight / 2
                    };
                });

                console.log(`   Current scroll: ${currentBg.scrollY}`);
                console.log(`   Viewport center: ${currentBg.viewportCenter}`);
                console.log(`   Artist center: ${artist.center}`);
                console.log(`   Background: ${currentBg.style || currentBg.computed}`);
                console.log(`   Expected: ${artist.color}`);

                // Force a scroll event to trigger our system
                await page.evaluate(() => {
                    window.dispatchEvent(new Event('scroll'));
                });

                await new Promise(resolve => setTimeout(resolve, 500));

                const afterTrigger = await page.evaluate(() => {
                    return document.body.style.background;
                });

                console.log(`   After manual trigger: ${afterTrigger}`);
            }
        }

        console.log('\n🔍 Final system check...');

        // Check if the scroll system is actually working
        const finalCheck = await page.evaluate(() => {
            // Check if scroll listener is attached
            const events = getEventListeners ? getEventListeners(window) : 'DevTools required for listener check';

            return {
                scrollEvents: events,
                currentBg: document.body.style.background,
                systemExists: typeof window.programColorSystem !== 'undefined'
            };
        });

        console.log('📊 Final check:', finalCheck);

        // Keep browser open for manual inspection
        console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await browser.close();
    }
}

debugScrollSystem().catch(console.error);