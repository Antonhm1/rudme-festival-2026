const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('http://localhost:5500/frivillig.html');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Testing poster box expansion:\n');

    // Scroll to poster section
    await page.evaluate(() => {
        const posterSection = document.querySelector('.poster-section');
        if (posterSection) {
            posterSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get initial state of all poster boxes
    const initialState = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        return Array.from(boxes).map((box, i) => ({
            index: i,
            expanded: box.classList.contains('expanded'),
            hasDescription: !!box.querySelector('.poster-description'),
            descriptionVisible: box.querySelector('.poster-description')?.style.display !== 'none',
            buttonText: box.querySelector('.poster-button')?.textContent,
            title: box.querySelector('.poster-title')?.textContent,
            backgroundColor: window.getComputedStyle(box).backgroundColor,
            height: box.getBoundingClientRect().height
        }));
    });

    console.log('Initial state:');
    console.log(`Found ${initialState.length} poster boxes`);
    console.log('First 3 boxes:', initialState.slice(0, 3).map(b => ({
        title: b.title,
        expanded: b.expanded,
        buttonText: b.buttonText,
        height: b.height
    })));

    // Click the first button
    console.log('\nClicking first poster button...');
    await page.evaluate(() => {
        const firstButton = document.querySelector('.poster-box .poster-button');
        if (firstButton) {
            firstButton.click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check state after clicking
    const afterFirstClick = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        return Array.from(boxes).map((box, i) => ({
            index: i,
            expanded: box.classList.contains('expanded'),
            buttonText: box.querySelector('.poster-button')?.textContent,
            title: box.querySelector('.poster-title')?.textContent,
            height: box.getBoundingClientRect().height,
            descriptionDisplay: window.getComputedStyle(box.querySelector('.poster-description')).display,
            descriptionOpacity: window.getComputedStyle(box.querySelector('.poster-description')).opacity
        }));
    });

    console.log('\nAfter clicking first button:');
    const expandedBoxes = afterFirstClick.filter(b => b.expanded);
    console.log(`Number of expanded boxes: ${expandedBoxes.length}`);

    if (expandedBoxes.length > 0) {
        console.log('Expanded boxes:', expandedBoxes.map(b => ({
            index: b.index,
            title: b.title,
            buttonText: b.buttonText,
            height: b.height
        })));
    }

    // Also check description visibility
    console.log('\nDescription visibility for first 3 boxes:');
    afterFirstClick.slice(0, 3).forEach(box => {
        console.log(`  ${box.title}: display=${box.descriptionDisplay}, opacity=${box.descriptionOpacity}`);
    });

    // Try clicking the second button
    console.log('\nClicking second poster button...');
    await page.evaluate(() => {
        const buttons = document.querySelectorAll('.poster-box .poster-button');
        if (buttons[1]) {
            buttons[1].click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const afterSecondClick = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        return Array.from(boxes).map((box, i) => ({
            index: i,
            expanded: box.classList.contains('expanded'),
            title: box.querySelector('.poster-title')?.textContent,
            buttonText: box.querySelector('.poster-button')?.textContent,
            height: box.getBoundingClientRect().height
        }));
    });

    console.log('\nAfter clicking second button:');
    const expandedAfterSecond = afterSecondClick.filter(b => b.expanded);
    console.log(`Number of expanded boxes: ${expandedAfterSecond.length}`);

    if (expandedAfterSecond.length > 0) {
        console.log('Expanded boxes:', expandedAfterSecond.map(b => ({
            index: b.index,
            title: b.title,
            buttonText: b.buttonText
        })));
    }

    // Check CSS rules
    const cssInfo = await page.evaluate(() => {
        const expandedBox = document.querySelector('.poster-box.expanded');
        const description = expandedBox?.querySelector('.poster-description');

        if (expandedBox && description) {
            const styles = window.getComputedStyle(description);
            return {
                display: styles.display,
                opacity: styles.opacity,
                transition: styles.transition,
                visibility: styles.visibility
            };
        }
        return null;
    });

    if (cssInfo) {
        console.log('\nCSS for expanded description:', cssInfo);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();