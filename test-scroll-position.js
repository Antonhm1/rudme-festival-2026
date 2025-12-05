const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:5500/program.html');
  await page.waitForSelector('.artist-box', { timeout: 5000 });

  // Test scrolling step by step
  const scrollTest = await page.evaluate(() => {
    const artistBox = document.querySelector('.artist-box');
    const scrollEl = artistBox.querySelector('.box-scroll');
    const thumb = artistBox.querySelector('.custom-scrollbar-thumb');
    const scrollbar = artistBox.querySelector('.box-scrollbar');

    const results = [];

    // Initial state
    results.push({
      step: 'initial',
      scrollLeft: scrollEl.scrollLeft,
      thumbLeft: parseFloat(getComputedStyle(thumb).left),
      thumbWidth: parseFloat(getComputedStyle(thumb).width),
      scrollbarWidth: scrollbar.clientWidth,
      maxScroll: scrollEl.scrollWidth - scrollEl.clientWidth,
      available: scrollbar.clientWidth - parseFloat(getComputedStyle(thumb).width)
    });

    // Scroll to 25%
    scrollEl.scrollLeft = (scrollEl.scrollWidth - scrollEl.clientWidth) * 0.25;
    results.push({
      step: '25%',
      scrollLeft: scrollEl.scrollLeft,
      thumbLeft: parseFloat(getComputedStyle(thumb).left)
    });

    // Scroll to 50%
    scrollEl.scrollLeft = (scrollEl.scrollWidth - scrollEl.clientWidth) * 0.5;
    results.push({
      step: '50%',
      scrollLeft: scrollEl.scrollLeft,
      thumbLeft: parseFloat(getComputedStyle(thumb).left)
    });

    // Scroll to 100% (maximum)
    scrollEl.scrollLeft = scrollEl.scrollWidth - scrollEl.clientWidth;
    results.push({
      step: '100%',
      scrollLeft: scrollEl.scrollLeft,
      thumbLeft: parseFloat(getComputedStyle(thumb).left),
      expectedThumbLeft: scrollbar.clientWidth - parseFloat(getComputedStyle(thumb).width)
    });

    return results;
  });

  console.log('Scroll Test Results:');
  scrollTest.forEach(result => {
    console.log(`${result.step}:`, JSON.stringify(result, null, 2));
  });

  await browser.close();
})();