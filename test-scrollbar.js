const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Set mobile viewport
  await page.setViewport({ width: 375, height: 812 });

  await page.goto('http://localhost:5500/program.html');
  await page.waitForSelector('.artist-box', { timeout: 5000 });

  // Find first artist box with scrollbar
  const artistBox = await page.$('.artist-box');

  if (artistBox) {
    const scrollbar = await artistBox.$('.box-scrollbar');
    const thumb = await artistBox.$('.custom-scrollbar-thumb');
    const scrollEl = await artistBox.$('.box-scroll');

    if (scrollbar && thumb && scrollEl) {
      // Get dimensions
      const scrollbarRect = await scrollbar.evaluate(el => el.getBoundingClientRect());
      const thumbRect = await thumb.evaluate(el => el.getBoundingClientRect());

      console.log('Mobile viewport (375x812):');
      console.log('Scrollbar width:', scrollbarRect.width);
      console.log('Thumb width:', thumbRect.width);
      console.log('Thumb width as % of scrollbar:', Math.round((thumbRect.width / scrollbarRect.width) * 100) + '%');

      const scrollInfo = await scrollEl.evaluate(el => ({
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        scrollLeft: el.scrollLeft
      }));

      console.log('ScrollEl clientWidth:', scrollInfo.clientWidth);
      console.log('ScrollEl scrollWidth:', scrollInfo.scrollWidth);
      console.log('Has scrollable content:', scrollInfo.scrollWidth > scrollInfo.clientWidth);

      // Test scrolling to the end
      await scrollEl.evaluate(el => el.scrollLeft = el.scrollWidth);
      await new Promise(resolve => setTimeout(resolve, 200));

      const newThumbRect = await thumb.evaluate(el => el.getBoundingClientRect());
      const afterScrollInfo = await scrollEl.evaluate(el => ({
        scrollLeft: el.scrollLeft,
        maxScroll: el.scrollWidth - el.clientWidth
      }));

      console.log('\nAfter scrolling to end:');
      console.log('Max scroll:', afterScrollInfo.maxScroll);
      console.log('Current scroll:', afterScrollInfo.scrollLeft);
      console.log('Thumb position from left:', newThumbRect.left - scrollbarRect.left);
      console.log('Thumb position from right:', scrollbarRect.right - newThumbRect.right);
      console.log('Can scroll to end?', Math.abs(afterScrollInfo.scrollLeft - afterScrollInfo.maxScroll) < 5);

    } else {
      console.log('Could not find scrollbar elements');
    }
  } else {
    console.log('Could not find artist box');
  }

  await browser.close();
})();