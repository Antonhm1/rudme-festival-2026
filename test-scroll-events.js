const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:5500/program.html');
  await page.waitForSelector('.artist-box', { timeout: 5000 });

  // Test with manual scroll and event triggering
  const scrollTest = await page.evaluate(async () => {
    const artistBox = document.querySelector('.artist-box');
    const scrollEl = artistBox.querySelector('.box-scroll');
    const thumb = artistBox.querySelector('.custom-scrollbar-thumb');

    const results = [];

    // Helper to wait for scroll update
    const waitAndCheck = async (label, scrollValue) => {
      scrollEl.scrollLeft = scrollValue;

      // Trigger scroll event manually
      const scrollEvent = new Event('scroll');
      scrollEl.dispatchEvent(scrollEvent);

      // Wait a bit for updates
      await new Promise(resolve => setTimeout(resolve, 100));

      results.push({
        step: label,
        scrollLeft: scrollEl.scrollLeft,
        thumbLeft: parseFloat(getComputedStyle(thumb).left),
        scrollValue: scrollValue
      });
    };

    // Initial state
    await waitAndCheck('initial', 0);

    // Try different scroll values
    await waitAndCheck('scroll-81', 81);  // 25% of 324
    await waitAndCheck('scroll-162', 162); // 50% of 324
    await waitAndCheck('scroll-324', 324); // 100% of 324

    return results;
  });

  console.log('Scroll Event Test Results:');
  scrollTest.forEach(result => {
    console.log(`${result.step}:`, JSON.stringify(result, null, 2));
  });

  await browser.close();
})();