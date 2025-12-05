const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:5500/program.html');
  await page.waitForSelector('.artist-box', { timeout: 5000 });

  // Debug: Check if scrollbar elements exist and get their properties
  const debugInfo = await page.evaluate(() => {
    const artistBox = document.querySelector('.artist-box');
    if (!artistBox) return { error: 'No artist box found' };

    const scrollbar = artistBox.querySelector('.box-scrollbar');
    const thumb = artistBox.querySelector('.custom-scrollbar-thumb');
    const scrollEl = artistBox.querySelector('.box-scroll');

    return {
      hasScrollbar: !!scrollbar,
      hasThumb: !!thumb,
      hasScrollEl: !!scrollEl,
      scrollbarStyles: scrollbar ? {
        display: getComputedStyle(scrollbar).display,
        width: getComputedStyle(scrollbar).width,
        clientWidth: scrollbar.clientWidth,
        offsetWidth: scrollbar.offsetWidth
      } : null,
      thumbStyles: thumb ? {
        display: getComputedStyle(thumb).display,
        width: getComputedStyle(thumb).width,
        clientWidth: thumb.clientWidth,
        offsetWidth: thumb.offsetWidth,
        left: getComputedStyle(thumb).left
      } : null,
      scrollInfo: scrollEl ? {
        clientWidth: scrollEl.clientWidth,
        scrollWidth: scrollEl.scrollWidth,
        scrollLeft: scrollEl.scrollLeft
      } : null
    };
  });

  console.log('Debug Info:');
  console.log(JSON.stringify(debugInfo, null, 2));

  await browser.close();
})();