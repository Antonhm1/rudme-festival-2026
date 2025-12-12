const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 375, height: 667 } // iPhone SE size
    });
    const page = await browser.newPage();

    await page.goto('http://localhost:5500/info.html');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get positions of elements
    const positions = await page.evaluate(() => {
        const hero = document.querySelector('.hero-section');
        const firstSection = document.querySelector('.info-section:first-child');
        const sections = document.querySelectorAll('.info-section');

        const heroRect = hero ? hero.getBoundingClientRect() : null;
        const firstRect = firstSection ? firstSection.getBoundingClientRect() : null;

        return {
            hero: heroRect ? {
                top: heroRect.top,
                height: heroRect.height,
                bottom: heroRect.bottom
            } : null,
            firstSection: firstRect ? {
                top: firstRect.top,
                height: firstRect.height
            } : null,
            sectionsCount: sections.length,
            allSections: Array.from(sections).map((s, i) => ({
                index: i,
                top: s.getBoundingClientRect().top,
                height: s.getBoundingClientRect().height
            }))
        };
    });

    console.log('Element positions on mobile:');
    console.log('Hero section:', positions.hero);
    console.log('First info section:', positions.firstSection);
    console.log('All sections:', positions.allSections);

    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
})();