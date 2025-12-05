const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:5500/program.html');
  await page.waitForSelector('.artist-box', { timeout: 5000 });

  // Test what the actual scrollable positions are
  const actualScrollTest = await page.evaluate(async () => {
    const artistBox = document.querySelector('.artist-box');
    const scrollEl = artistBox.querySelector('.box-scroll');

    const positions = [];

    // Test by scrolling through all items
    const items = scrollEl.querySelectorAll('.box-item');

    for (let i = 0; i < items.length; i++) {
      // Scroll to each item
      items[i].scrollIntoView({ behavior: 'auto', inline: 'start' });
      await new Promise(resolve => setTimeout(resolve, 50));

      positions.push({
        item: i,
        scrollLeft: scrollEl.scrollLeft
      });
    }

    // Also try scrolling to the very end manually
    scrollEl.scrollLeft = 999999; // Very large number
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      itemPositions: positions,
      maxAttemptedScroll: scrollEl.scrollLeft,
      scrollWidth: scrollEl.scrollWidth,
      clientWidth: scrollEl.clientWidth,
      calculatedMax: scrollEl.scrollWidth - scrollEl.clientWidth,
      itemCount: items.length
    };
  });

  console.log('Actual Scroll Test:');
  console.log(JSON.stringify(actualScrollTest, null, 2));

  await browser.close();
})();