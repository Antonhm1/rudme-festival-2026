const puppeteer = require('puppeteer');

async function testDirectionalScroll() {
    console.log('🧪 Testing directional scroll algorithm...');

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 800
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 800 }); // Wide screen for two-column layout

        console.log('📡 Loading program page...');
        await page.goto('http://localhost:5500/program.html');
        await page.waitForSelector('.artist-box', { timeout: 10000 });

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get artist box layout information
        const layoutInfo = await page.evaluate(() => {
            const boxes = Array.from(document.querySelectorAll('.artist-box'));
            return {
                artistCount: boxes.length,
                layout: boxes.map((box, i) => {
                    const rect = box.getBoundingClientRect();
                    const color = getComputedStyle(box).getPropertyValue('--box-color').trim();
                    const name = box.querySelector('.box-title')?.textContent;
                    return {
                        index: i,
                        name,
                        color,
                        left: rect.left,
                        top: rect.top + window.scrollY,
                        center: rect.top + window.scrollY + rect.height / 2
                    };
                }),
                viewportWidth: window.innerWidth
            };
        });

        console.log('🎭 Layout info:', {
            artistCount: layoutInfo.artistCount,
            viewportWidth: layoutInfo.viewportWidth,
            columns: layoutInfo.viewportWidth > 1200 ? '2-column' : '1-column'
        });

        console.log('📋 Artists layout:');
        layoutInfo.layout.forEach((artist, i) => {
            const column = i % 2 === 0 ? 'LEFT' : 'RIGHT';
            console.log(`  ${artist.name} (${column}): ${artist.color} - top: ${Math.round(artist.top)}`);
        });

        // Test downward scrolling (should prioritize left column)
        console.log('\n⬇️ Testing downward scroll (left column priority)...');

        // Scroll to first row
        const firstRowArtists = layoutInfo.layout.slice(0, 2);
        if (firstRowArtists.length >= 2) {
            const leftArtist = firstRowArtists[0];
            const rightArtist = firstRowArtists[1];

            console.log(`\n🎯 Scrolling to first row (${leftArtist.name} vs ${rightArtist.name})`);

            // Scroll to beginning of row
            await page.evaluate((target) => {
                window.scrollTo({
                    top: target - window.innerHeight / 2,
                    behavior: 'smooth'
                });
            }, leftArtist.center - 100);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const firstHalfBg = await page.evaluate(() => document.body.style.background);
            console.log(`  First half of row: ${firstHalfBg}`);
            console.log(`  Expected left: ${leftArtist.color}`);

            // Scroll to second half of row
            await page.evaluate((target) => {
                window.scrollTo({
                    top: target - window.innerHeight / 2 + 100,
                    behavior: 'smooth'
                });
            }, leftArtist.center);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const secondHalfBg = await page.evaluate(() => document.body.style.background);
            console.log(`  Second half of row: ${secondHalfBg}`);
            console.log(`  Expected transition to right: ${rightArtist.color}`);
        }

        // Test upward scrolling (should prioritize right column)
        console.log('\n⬆️ Testing upward scroll (right column priority)...');

        // Scroll to second row first
        const secondRowArtists = layoutInfo.layout.slice(2, 4);
        if (secondRowArtists.length >= 2) {
            const leftArtist = secondRowArtists[0];
            const rightArtist = secondRowArtists[1];

            console.log(`\n🎯 Scrolling to second row (${leftArtist.name} vs ${rightArtist.name})`);

            // Start at end of second row
            await page.evaluate((target) => {
                window.scrollTo({
                    top: target - window.innerHeight / 2 + 150,
                    behavior: 'smooth'
                });
            }, rightArtist.center);

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Now scroll UP (this should prioritize right column first)
            await page.evaluate((target) => {
                window.scrollTo({
                    top: target - window.innerHeight / 2,
                    behavior: 'smooth'
                });
            }, rightArtist.center - 50);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const upwardScrollBg = await page.evaluate(() => document.body.style.background);
            console.log(`  Upward scroll result: ${upwardScrollBg}`);
            console.log(`  Expected right priority: ${rightArtist.color}`);
        }

        console.log('\n✅ Directional test completed! Browser staying open for inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

testDirectionalScroll().catch(console.error);