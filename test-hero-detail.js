const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 375, height: 667 }
    });
    const page = await browser.newPage();

    await page.goto('http://localhost:5500/info.html');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const details = await page.evaluate(() => {
        const header = document.querySelector('header');
        const hero = document.querySelector('.hero-section');
        const heroImage = document.querySelector('.hero-image-wrapper');
        const heroRight = document.querySelector('.hero-right');

        const headerRect = header ? header.getBoundingClientRect() : null;
        const heroRect = hero ? hero.getBoundingClientRect() : null;
        const imageRect = heroImage ? heroImage.getBoundingClientRect() : null;
        const rightRect = heroRight ? heroRight.getBoundingClientRect() : null;

        return {
            header: headerRect ? {
                top: headerRect.top,
                height: headerRect.height,
                bottom: headerRect.bottom
            } : null,
            hero: heroRect ? {
                top: heroRect.top,
                height: heroRect.height,
                position: window.getComputedStyle(hero).position
            } : null,
            heroImage: imageRect ? {
                top: imageRect.top,
                height: imageRect.height,
                position: window.getComputedStyle(heroImage).position
            } : null,
            heroRight: rightRect ? {
                top: rightRect.top,
                height: rightRect.height
            } : null
        };
    });

    console.log('Header:', details.header);
    console.log('Hero Section:', details.hero);
    console.log('Hero Image Wrapper:', details.heroImage);
    console.log('Hero Right (text):', details.heroRight);

    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
})();