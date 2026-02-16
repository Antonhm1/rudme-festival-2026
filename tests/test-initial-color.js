const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to volunteer page on port 5500
    await page.goto('http://localhost:5500/frivillig.html');

    // Wait for initial load and color setup
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Testing initial background color:\n');

    // Get initial colors
    const initialColors = await page.evaluate(() => {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const menuBg = document.querySelector('.menu-container')
            ? window.getComputedStyle(document.querySelector('.menu-container')).backgroundColor
            : null;
        const logo = document.querySelector('#logo-inner');
        const logoColor = logo ? window.getComputedStyle(logo).color : null;

        // Convert rgb to hex for easier comparison
        function rgbToHex(rgb) {
            const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (!match) return rgb;
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return '#' + r + g + b;
        }

        return {
            bodyBg: bodyBg,
            bodyBgHex: rgbToHex(bodyBg),
            menuBg: menuBg,
            menuBgHex: menuBg ? rgbToHex(menuBg) : null,
            logoColor: logoColor,
            logoColorHex: logoColor ? rgbToHex(logoColor) : null,
            expectedGreen: '#90EE90',
            expectedGreenRgb: 'rgb(144, 238, 144)'
        };
    });

    console.log('Initial state (should be green #90EE90):');
    console.log(`  Body background: ${initialColors.bodyBg}`);
    console.log(`  Body background (hex): ${initialColors.bodyBgHex}`);
    console.log(`  Menu background: ${initialColors.menuBg}`);
    console.log(`  Logo color: ${initialColors.logoColor}`);
    console.log(`  Expected green: ${initialColors.expectedGreen} / ${initialColors.expectedGreenRgb}`);
    console.log('');

    // Check if colors match expected green
    if (initialColors.bodyBg === initialColors.expectedGreenRgb) {
        console.log('  ✓ Body background is green');
    } else {
        console.log('  ✗ Body background is NOT green');
    }

    if (initialColors.menuBg === initialColors.expectedGreenRgb) {
        console.log('  ✓ Menu background is green');
    } else {
        console.log('  ✗ Menu background is NOT green');
    }

    if (initialColors.logoColor === initialColors.expectedGreenRgb) {
        console.log('  ✓ Logo color is green');
    } else {
        console.log('  ✗ Logo color is NOT green');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();