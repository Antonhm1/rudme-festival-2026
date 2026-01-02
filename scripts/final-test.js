const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:5500/program.html');
  await page.waitForSelector('.artist-box', { timeout: 5000 });

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 200));

  const finalTest = await page.evaluate(() => {
    const artistBox = document.querySelector('.artist-box');
    const scrollEl = artistBox.querySelector('.box-scroll');
    const thumb = artistBox.querySelector('.custom-scrollbar-thumb');
    const scrollbar = artistBox.querySelector('.box-scrollbar');

    const results = [];

    // Test 1: Initial state and dimensions
    results.push({
      test: 'Initial State',
      scrollbarWidth: scrollbar.clientWidth,
      thumbWidth: parseInt(getComputedStyle(thumb).width),
      thumbPercentage: Math.round((parseInt(getComputedStyle(thumb).width) / scrollbar.clientWidth) * 100),
      thumbPosition: parseInt(getComputedStyle(thumb).left),
      scrollLeft: scrollEl.scrollLeft
    });

    // Test 2: Scroll to the last item
    const items = scrollEl.querySelectorAll('.box-item');
    if (items.length > 1) {
      items[items.length - 1].scrollIntoView({ behavior: 'auto', inline: 'start' });

      results.push({
        test: 'Scrolled to Last Item',
        scrollLeft: scrollEl.scrollLeft,
        thumbPosition: parseInt(getComputedStyle(thumb).left),
        thumbPositionFromRight: scrollbar.clientWidth - parseInt(getComputedStyle(thumb).left) - parseInt(getComputedStyle(thumb).width),
        canScrollToEnd: scrollEl.scrollLeft > 0
      });
    }

    return results;
  });

  console.log('Final Test Results:');
  finalTest.forEach(result => {
    console.log(`\n${result.test}:`);
    Object.entries(result).forEach(([key, value]) => {
      if (key !== 'test') {
        console.log(`  ${key}: ${value}`);
      }
    });
  });

  await browser.close();
})();