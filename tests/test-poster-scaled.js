const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto('http://localhost:5500/frivillig.html');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Testing scaled poster boxes (500x500):\n');

    // Scroll to poster section
    await page.evaluate(() => {
        const posterSection = document.querySelector('.poster-section');
        if (posterSection) {
            posterSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check poster box dimensions and styles
    const boxInfo = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        const firstBox = boxes[0];

        if (!firstBox) return null;

        const boxRect = firstBox.getBoundingClientRect();
        const image = firstBox.querySelector('.poster-image');
        const title = firstBox.querySelector('.poster-title');
        const button = firstBox.querySelector('.poster-button');
        const content = firstBox.querySelector('.poster-content');

        const imageRect = image ? image.getBoundingClientRect() : null;
        const titleStyles = title ? window.getComputedStyle(title) : null;
        const buttonStyles = button ? window.getComputedStyle(button) : null;
        const buttonRect = button ? button.getBoundingClientRect() : null;
        const contentStyles = content ? window.getComputedStyle(content) : null;

        return {
            box: {
                width: boxRect.width,
                height: boxRect.height,
                backgroundColor: window.getComputedStyle(firstBox).backgroundColor
            },
            image: imageRect ? {
                width: imageRect.width,
                height: imageRect.height
            } : null,
            title: titleStyles ? {
                fontSize: titleStyles.fontSize,
                text: title.textContent
            } : null,
            button: {
                fontSize: buttonStyles ? buttonStyles.fontSize : null,
                padding: buttonStyles ? buttonStyles.padding : null,
                width: buttonRect ? buttonRect.width : null,
                height: buttonRect ? buttonRect.height : null,
                text: button ? button.textContent : null
            },
            content: {
                padding: contentStyles ? contentStyles.padding : null
            }
        };
    });

    console.log('First poster box dimensions:');
    console.log(`  Box: ${boxInfo.box.width}px × ${boxInfo.box.height}px`);
    console.log(`  Background: ${boxInfo.box.backgroundColor}`);

    if (boxInfo.image) {
        console.log(`  Image: ${boxInfo.image.width}px × ${boxInfo.image.height}px`);
    }

    if (boxInfo.title) {
        console.log(`  Title: "${boxInfo.title.text}" (${boxInfo.title.fontSize})`);
    }

    console.log(`  Button: "${boxInfo.button.text}" (${boxInfo.button.fontSize})`);
    console.log(`  Button size: ${boxInfo.button.width}px × ${boxInfo.button.height}px`);
    console.log(`  Content padding: ${boxInfo.content.padding}`);

    // Test clicking on the box itself (not the button)
    console.log('\nTesting box click expansion:');

    await page.evaluate(() => {
        const firstBox = document.querySelector('.poster-box');
        const image = firstBox.querySelector('.poster-image');
        // Click on the image area, not the button
        if (image) {
            image.click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const afterBoxClick = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        const expandedBoxes = document.querySelectorAll('.poster-box.expanded');
        const firstBox = boxes[0];
        const firstButton = firstBox ? firstBox.querySelector('.poster-button') : null;

        return {
            totalBoxes: boxes.length,
            expandedCount: expandedBoxes.length,
            firstBoxExpanded: firstBox ? firstBox.classList.contains('expanded') : false,
            firstButtonText: firstButton ? firstButton.textContent : null,
            firstBoxHeight: firstBox ? firstBox.getBoundingClientRect().height : null
        };
    });

    console.log(`  Expanded boxes after clicking box: ${afterBoxClick.expandedCount}`);
    console.log(`  First box expanded: ${afterBoxClick.firstBoxExpanded}`);
    console.log(`  Button text: "${afterBoxClick.firstButtonText}"`);
    console.log(`  Box height: ${afterBoxClick.firstBoxHeight}px`);

    // Test clicking the button to collapse
    console.log('\nTesting button click to collapse:');

    await page.evaluate(() => {
        const firstButton = document.querySelector('.poster-box .poster-button');
        if (firstButton) {
            firstButton.click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const afterButtonClick = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        const expandedBoxes = document.querySelectorAll('.poster-box.expanded');
        const firstBox = boxes[0];
        const firstButton = firstBox ? firstBox.querySelector('.poster-button') : null;

        return {
            expandedCount: expandedBoxes.length,
            firstBoxExpanded: firstBox ? firstBox.classList.contains('expanded') : false,
            firstButtonText: firstButton ? firstButton.textContent : null,
            firstBoxHeight: firstBox ? firstBox.getBoundingClientRect().height : null
        };
    });

    console.log(`  Expanded boxes after button click: ${afterButtonClick.expandedCount}`);
    console.log(`  First box expanded: ${afterButtonClick.firstBoxExpanded}`);
    console.log(`  Button text: "${afterButtonClick.firstButtonText}"`);
    console.log(`  Box height: ${afterButtonClick.firstBoxHeight}px`);

    // Test clicking a different box
    console.log('\nTesting clicking second box:');

    await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        if (boxes[1]) {
            boxes[1].click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const afterSecondBox = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        const expandedBoxes = document.querySelectorAll('.poster-box.expanded');

        return {
            expandedCount: expandedBoxes.length,
            firstExpanded: boxes[0] ? boxes[0].classList.contains('expanded') : false,
            secondExpanded: boxes[1] ? boxes[1].classList.contains('expanded') : false
        };
    });

    console.log(`  Expanded boxes: ${afterSecondBox.expandedCount}`);
    console.log(`  First box expanded: ${afterSecondBox.firstExpanded}`);
    console.log(`  Second box expanded: ${afterSecondBox.secondExpanded}`);

    console.log('\n✅ All poster box scaling and click tests complete!');

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();