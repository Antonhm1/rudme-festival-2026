const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({ width: 1280, height: 720 });

    // Navigate to the info page
    await page.goto('http://localhost:3000/info.html');

    // Wait for the page to load
    await page.waitForSelector('.custom-select');

    // Get initial state
    const initialState = await page.evaluate(() => {
        const select = document.querySelector('.custom-select');
        const display = document.querySelector('.select-display');
        const bg = document.querySelector('.select-bg');
        const options = document.querySelector('.select-options');

        const selectRect = select.getBoundingClientRect();
        const displayRect = display.getBoundingClientRect();
        const bgRect = bg ? bg.getBoundingClientRect() : null;

        return {
            displayText: display.textContent.trim(),
            displayWidth: displayRect.width,
            selectWidth: selectRect.width,
            bgWidth: bgRect ? bgRect.width : 'no bg',
            bgHeight: bgRect ? bgRect.height : 'no bg'
        };
    });

    console.log('Initial state (closed):');
    console.log('Display text:', initialState.displayText);
    console.log('Display width:', initialState.displayWidth);
    console.log('Select container width:', initialState.selectWidth);
    console.log('Background width:', initialState.bgWidth);
    console.log('Background height:', initialState.bgHeight);

    // Click to open dropdown
    await page.click('.custom-select');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check open state
    const openState = await page.evaluate(() => {
        const select = document.querySelector('.custom-select');
        const bg = document.querySelector('.select-bg');
        const options = document.querySelector('.select-options');
        const optionItems = document.querySelectorAll('.select-options li');

        const bgRect = bg ? bg.getBoundingClientRect() : null;
        const optionsRect = options.getBoundingClientRect();

        // Find longest option text
        let longestOption = '';
        let longestWidth = 0;
        optionItems.forEach(li => {
            const rect = li.getBoundingClientRect();
            if (rect.width > longestWidth) {
                longestWidth = rect.width;
                longestOption = li.textContent;
            }
        });

        return {
            bgWidth: bgRect ? bgRect.width : 'no bg',
            bgHeight: bgRect ? bgRect.height : 'no bg',
            optionsWidth: optionsRect.width,
            optionsHeight: optionsRect.height,
            longestOption: longestOption,
            longestOptionWidth: longestWidth,
            allOptions: Array.from(optionItems).map(li => ({
                text: li.textContent,
                width: li.getBoundingClientRect().width,
                overflowing: li.getBoundingClientRect().right > (bgRect ? bgRect.right : 0)
            }))
        };
    });

    console.log('\nOpen state:');
    console.log('Background width:', openState.bgWidth);
    console.log('Background height:', openState.bgHeight);
    console.log('Options container width:', openState.optionsWidth);
    console.log('Longest option:', openState.longestOption);
    console.log('Longest option width:', openState.longestOptionWidth);
    console.log('\nAll options:');
    openState.allOptions.forEach(opt => {
        console.log(`  ${opt.text}: width=${opt.width}, overflowing=${opt.overflowing}`);
    });

    // Keep browser open for 5 seconds to observe
    await new Promise(resolve => setTimeout(resolve, 5000));

    await browser.close();
})();