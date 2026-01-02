const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:5500/program.html');
  await page.waitForSelector('.artist-box', { timeout: 5000 });

  const contentInfo = await page.evaluate(() => {
    const artistBox = document.querySelector('.artist-box');
    const scrollEl = artistBox.querySelector('.box-scroll');
    const items = scrollEl.querySelectorAll('.box-item');

    return {
      itemCount: items.length,
      scrollWidth: scrollEl.scrollWidth,
      clientWidth: scrollEl.clientWidth,
      isScrollable: scrollEl.scrollWidth > scrollEl.clientWidth,
      itemWidths: Array.from(items).map((item, i) => ({
        index: i,
        width: item.offsetWidth,
        textContent: item.textContent?.trim() || 'No text'
      })),
      scrollElStyles: {
        overflowX: getComputedStyle(scrollEl).overflowX,
        display: getComputedStyle(scrollEl).display,
        gap: getComputedStyle(scrollEl).gap
      }
    };
  });

  console.log('Content Structure Analysis:');
  console.log(JSON.stringify(contentInfo, null, 2));

  // Try manual scrolling with mouse simulation
  console.log('\nTrying manual scroll simulation...');

  const manualScrollTest = await page.evaluate(() => {
    const scrollEl = document.querySelector('.box-scroll');

    // Try different scroll approaches
    const results = [];

    // Method 1: Direct scrollLeft assignment
    scrollEl.scrollLeft = 100;
    results.push({ method: 'direct', scrollLeft: scrollEl.scrollLeft });

    // Method 2: scrollBy
    scrollEl.scrollBy(50, 0);
    results.push({ method: 'scrollBy', scrollLeft: scrollEl.scrollLeft });

    // Method 3: scrollTo
    scrollEl.scrollTo(200, 0);
    results.push({ method: 'scrollTo', scrollLeft: scrollEl.scrollLeft });

    return results;
  });

  console.log('Manual scroll test results:');
  manualScrollTest.forEach(result => {
    console.log(`${result.method}: scrollLeft = ${result.scrollLeft}`);
  });

  await browser.close();
})();