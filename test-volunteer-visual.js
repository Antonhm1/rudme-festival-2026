const puppeteer = require('puppeteer');

async function testVolunteerVisual() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1920, height: 1080 }
        });

        const page = await browser.newPage();

        console.log('📷 Opening volunteer page for visual inspection...');

        await page.goto('http://localhost:5500/volunteer.html', {
            waitUntil: 'networkidle2',
            timeout: 10000
        });

        // Wait for content to load
        await page.waitForSelector('.volunteer-tabs', { timeout: 5000 });

        // Get current styles
        const styles = await page.evaluate(() => {
            const body = document.body;
            const tabs = document.querySelector('.volunteer-tabs');
            const content = document.querySelector('.volunteer-content');
            const activeTab = document.querySelector('.volunteer-tab.active');

            return {
                bodyBg: window.getComputedStyle(body).backgroundColor,
                bodyOverflow: window.getComputedStyle(body).overflow,
                tabsBg: tabs ? window.getComputedStyle(tabs).backgroundColor : 'not found',
                contentBg: content ? window.getComputedStyle(content).backgroundColor : 'not found',
                activeTabBg: activeTab ? window.getComputedStyle(activeTab).backgroundColor : 'not found',
                canScroll: document.body.scrollHeight > window.innerHeight
            };
        });

        console.log('\n📊 Current Page Styles:');
        console.log('Body Background:', styles.bodyBg);
        console.log('Body Overflow:', styles.bodyOverflow);
        console.log('Tabs Container Background:', styles.tabsBg);
        console.log('Content Area Background:', styles.contentBg);
        console.log('Active Tab Background:', styles.activeTabBg);
        console.log('Page Scrollable:', styles.canScroll ? 'Yes ✅' : 'No ❌');

        // Test scrolling
        console.log('\n🔄 Testing page scroll...');
        await page.evaluate(() => {
            window.scrollBy(0, 500);
        });

        const scrollPosition = await page.evaluate(() => window.scrollY);
        console.log('Scroll position after scrolling:', scrollPosition + 'px');

        // Test volunteer grid scroll
        console.log('\n🔄 Testing volunteer grid horizontal scroll...');
        await page.evaluate(() => {
            const grid = document.querySelector('.volunteer-grid');
            if (grid) {
                grid.scrollLeft = 200;
                return grid.scrollLeft;
            }
            return 0;
        });

        // Take a screenshot
        await page.screenshot({
            path: 'volunteer-page-screenshot.png',
            fullPage: true
        });
        console.log('\n📸 Screenshot saved as volunteer-page-screenshot.png');

        console.log('\n👀 Page will remain open for manual inspection...');
        console.log('Check if:');
        console.log('1. Tab container has lighter background');
        console.log('2. Active tab is visible with lighter background');
        console.log('3. Content area has lighter background');
        console.log('4. Info boxes have lighter background');
        console.log('5. Page is scrollable vertically');
        console.log('6. Volunteer grid scrolls horizontally');

        // Keep browser open for inspection
        await new Promise(resolve => setTimeout(resolve, 15000));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testVolunteerVisual();