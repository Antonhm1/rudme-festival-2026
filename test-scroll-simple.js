const puppeteer = require('puppeteer');

async function testScrollSimple() {
    console.log('🧪 Simple scroll test on Live Server...');

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 1000
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        // Navigate to Live Server
        await page.goto('http://localhost:5500/program.html');
        await page.waitForSelector('.artist-box', { timeout: 10000 });

        console.log('✅ Program page loaded');

        // Enable console logging
        page.on('console', msg => {
            console.log('🌐 BROWSER:', msg.text());
        });

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get initial state
        let state = await page.evaluate(() => {
            return {
                scrollY: window.scrollY,
                viewportHeight: window.innerHeight,
                viewportCenter: window.scrollY + window.innerHeight / 2,
                bodyBg: document.body.style.background,
                artistCount: document.querySelectorAll('.artist-box').length
            };
        });

        console.log('📊 Initial state:', state);

        // Try manual scrolling
        console.log('\n📜 Testing manual scroll...');

        await page.evaluate(() => {
            console.log('Before scroll - scrollY:', window.scrollY);
            window.scrollBy(0, 500);
            console.log('After scrollBy(500) - scrollY:', window.scrollY);
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        state = await page.evaluate(() => {
            return {
                scrollY: window.scrollY,
                viewportCenter: window.scrollY + window.innerHeight / 2,
                bodyBg: document.body.style.background
            };
        });

        console.log('📊 After scroll:', state);

        // Test keyboard scrolling
        console.log('\n⌨️ Testing keyboard scroll...');

        await page.keyboard.press('PageDown');
        await new Promise(resolve => setTimeout(resolve, 1000));

        state = await page.evaluate(() => {
            return {
                scrollY: window.scrollY,
                viewportCenter: window.scrollY + window.innerHeight / 2,
                bodyBg: document.body.style.background
            };
        });

        console.log('📊 After PageDown:', state);

        // Test wheel scrolling
        console.log('\n🖱️ Testing wheel scroll...');

        await page.mouse.wheel({ deltaY: 300 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        state = await page.evaluate(() => {
            return {
                scrollY: window.scrollY,
                viewportCenter: window.scrollY + window.innerHeight / 2,
                bodyBg: document.body.style.background
            };
        });

        console.log('📊 After wheel scroll:', state);

        console.log('\n✅ Test completed! Browser will stay open for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

testScrollSimple().catch(console.error);