const puppeteer = require('puppeteer');

async function testSmoothTransitions() {
    console.log('🎨 Testing smooth color transitions...');

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 800 });

        console.log('📡 Loading program page...');
        await page.goto('http://localhost:5500/program.html');
        await page.waitForSelector('.artist-box', { timeout: 10000 });

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get artist positions
        const artistData = await page.evaluate(() => {
            const system = window.programColorSystem;
            return {
                left: system.leftColumnArtists,
                right: system.rightColumnArtists
            };
        });

        console.log('🎭 Testing gradual transitions between LEFT column artists...');

        // Test transition from ANIMAUX ANIMÉ to MINDS OF 99
        const artist1 = artistData.left[0]; // ANIMAUX ANIMÉ
        const artist2 = artistData.left[1]; // MINDS OF 99

        console.log(`\n🔄 Transitioning from ${artist1.name} to ${artist2.name}`);

        // Start at first artist
        await page.evaluate((center) => {
            window.scrollTo({
                top: center - window.innerHeight / 2,
                behavior: 'instant'
            });
        }, artist1.center);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const startColor = await page.evaluate(() => document.body.style.background);
        console.log(`  Start color (${artist1.name}): ${startColor}`);

        // Gradually scroll towards second artist, checking colors at multiple points
        const steps = 5;
        for (let i = 1; i <= steps; i++) {
            const progress = i / steps;
            const scrollPosition = artist1.center + (artist2.center - artist1.center) * progress;

            await page.evaluate((pos) => {
                window.scrollTo({
                    top: pos - window.innerHeight / 2,
                    behavior: 'smooth'
                });
            }, scrollPosition);

            await new Promise(resolve => setTimeout(resolve, 800));

            const currentColor = await page.evaluate(() => document.body.style.background);
            console.log(`  Step ${i}/${steps} (${Math.round(progress * 100)}%): ${currentColor}`);
        }

        const endColor = await page.evaluate(() => document.body.style.background);
        console.log(`  End color (${artist2.name}): ${endColor}`);

        console.log('\n🔄 Testing direction change...');

        // Test direction change to see right column colors
        await page.evaluate(() => {
            window.scrollBy(0, -300); // Scroll up to trigger direction change
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const directionChangeColor = await page.evaluate(() => document.body.style.background);
        console.log(`  After scrolling up (should be right column): ${directionChangeColor}`);

        console.log('\n✅ Smooth transition test completed!');
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

testSmoothTransitions().catch(console.error);