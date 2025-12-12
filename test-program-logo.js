const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to program page
    await page.goto('http://localhost:3000/program.html');
    await page.waitForSelector('.header-logo svg');

    // Get computed styles for logo
    const logoStyles = await page.evaluate(() => {
        const logo = document.querySelector('.header-logo svg');
        const date = document.querySelector('.header-date');
        const body = document.body;
        const computed = window.getComputedStyle(logo);
        const dateComputed = window.getComputedStyle(date);
        const bodyComputed = window.getComputedStyle(body);

        return {
            logoColor: computed.color,
            logoFilter: computed.filter,
            dateColor: dateComputed.color,
            dateFilter: dateComputed.filter,
            backgroundColor: bodyComputed.backgroundColor,
            bodyClasses: body.className,
            logoElement: logo.outerHTML.substring(0, 100)
        };
    });

    console.log('Program page styles:', logoStyles);

    // Check if our CSS rule is applied
    const cssRules = await page.evaluate(() => {
        const rules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText && rule.selectorText.includes('.program-page')) {
                        rules.push({
                            selector: rule.selectorText,
                            style: rule.style.cssText
                        });
                    }
                }
            } catch (e) {}
        }
        return rules;
    });

    console.log('\nCSS rules with .program-page:', cssRules);

    await browser.close();
})();