const puppeteer = require('puppeteer');

async function testSimpleDirectional() {
    console.log('🧪 Testing simplified directional scroll (column-only)...');

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 1000
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 800 }); // Wide screen

        console.log('📡 Loading program page...');
        await page.goto('http://localhost:5500/program.html');
        await page.waitForSelector('.artist-box', { timeout: 10000 });

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get column information
        const columnInfo = await page.evaluate(() => {
            const system = window.programColorSystem;
            if (!system) return { error: 'System not initialized' };

            // Access internal state (for testing)
            return {
                leftColumn: window.programColorSystem.leftColumnArtists || [],
                rightColumn: window.programColorSystem.rightColumnArtists || [],
                viewportWidth: window.innerWidth
            };
        });

        if (columnInfo.error) {
            console.error('❌', columnInfo.error);
            return;
        }

        console.log('📊 Column structure:');
        console.log('LEFT COLUMN (down scroll targets):');
        columnInfo.leftColumn.forEach((artist, i) => {
            console.log(`  ${i + 1}. ${artist.name} - ${artist.color}`);
        });
        console.log('RIGHT COLUMN (up scroll targets):');
        columnInfo.rightColumn.forEach((artist, i) => {
            console.log(`  ${i + 1}. ${artist.name} - ${artist.color}`);
        });

        // Test downward scrolling (should only show left column colors)
        console.log('\n⬇️ Testing DOWNWARD scroll (LEFT column only)...');

        // Start at top
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(resolve => setTimeout(resolve, 1000));

        const initialBg = await page.evaluate(() => document.body.style.background);
        console.log(`  Initial: ${initialBg}`);

        // Scroll down through each left column artist
        for (let i = 0; i < Math.min(3, columnInfo.leftColumn.length); i++) {
            const artist = columnInfo.leftColumn[i];
            console.log(`\n  Scrolling to LEFT ${i + 1}: ${artist.name}`);

            await page.evaluate((target) => {
                window.scrollTo({
                    top: target - window.innerHeight / 2,
                    behavior: 'smooth'
                });
            }, artist.center);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const currentBg = await page.evaluate(() => document.body.style.background);
            console.log(`    Result: ${currentBg}`);
            console.log(`    Expected: ${artist.color}`);
        }

        // Test upward scrolling (should only show right column colors)
        console.log('\n⬆️ Testing UPWARD scroll (RIGHT column only)...');

        // Start from bottom and scroll up
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Scroll up through each right column artist
        const reversedRight = [...columnInfo.rightColumn].reverse();
        for (let i = 0; i < Math.min(3, reversedRight.length); i++) {
            const artist = reversedRight[i];
            console.log(`\n  Scrolling to RIGHT ${i + 1}: ${artist.name}`);

            await page.evaluate((target) => {
                window.scrollTo({
                    top: target - window.innerHeight / 2,
                    behavior: 'smooth'
                });
            }, artist.center);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const currentBg = await page.evaluate(() => document.body.style.background);
            console.log(`    Result: ${currentBg}`);
            console.log(`    Expected: ${artist.color}`);
        }

        // Test direction changes
        console.log('\n🔄 Testing direction changes...');

        // Go to middle artist and test commitment
        const middleArtist = columnInfo.leftColumn[1];
        if (middleArtist) {
            console.log(`\n  Testing commitment with ${middleArtist.name}`);

            // Scroll to middle left artist
            await page.evaluate((target) => {
                window.scrollTo({
                    top: target - window.innerHeight / 2,
                    behavior: 'smooth'
                });
            }, middleArtist.center);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const commitedBg = await page.evaluate(() => document.body.style.background);
            console.log(`    Committed to: ${commitedBg}`);

            // Scroll slightly up (should stay committed)
            await page.evaluate((currentCenter) => {
                const currentScrollTop = currentCenter - window.innerHeight / 2;
                window.scrollTo({
                    top: currentScrollTop - 100,
                    behavior: 'smooth'
                });
            }, middleArtist.center);

            await new Promise(resolve => setTimeout(resolve, 1500));

            const stuckBg = await page.evaluate(() => document.body.style.background);
            console.log(`    After small scroll up: ${stuckBg}`);
            console.log(`    Should match previous: ${commitedBg === stuckBg ? '✅' : '❌'}`);
        }

        console.log('\n✅ Simplified directional test completed!');
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

testSimpleDirectional().catch(console.error);