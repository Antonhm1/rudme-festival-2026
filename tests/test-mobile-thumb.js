const puppeteer = require('puppeteer');

const PORT = 5500;
const BASE_URL = `http://localhost:${PORT}`;

// Helper for delays (waitForTimeout is deprecated in newer Puppeteer)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function testMobileTouchDrag() {
  console.log('\n Testing Mobile Touch Drag on Scrollbar Thumb\n');
  console.log(`Connecting to server at ${BASE_URL}...\n`);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 375, height: 667 }, // iPhone SE viewport
    devtools: false
  });

  const page = await browser.newPage();

  // Enable touch events
  await page.emulate({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('Page loaded successfully');

    // Wait for gallery and scrollbar to be ready
    await page.waitForSelector('#gallery', { timeout: 5000 });
    await page.waitForSelector('.custom-scrollbar-thumb', { timeout: 5000 });
    console.log('Gallery and scrollbar thumb found');

    // Wait a bit for images to load and layout to stabilize
    await delay(1500);

    // Get initial gallery scroll position
    const initialScroll = await page.$eval('#gallery', el => el.scrollLeft);
    console.log(`Initial gallery scroll position: ${initialScroll}`);

    // Get thumb position
    const thumbBounds = await page.$eval('.custom-scrollbar-thumb', el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    console.log(`Thumb bounds: x=${thumbBounds.x}, y=${thumbBounds.y}, w=${thumbBounds.width}, h=${thumbBounds.height}`);

    // Create a touchscreen reference
    const touchscreen = page.touchscreen;

    // Calculate touch positions
    const startX = thumbBounds.x + thumbBounds.width / 2;
    const startY = thumbBounds.y + thumbBounds.height / 2;
    const endX = startX + 100; // Drag 100px to the right

    console.log(`\nSimulating touch drag from (${startX}, ${startY}) to (${endX}, ${startY})...`);

    // Perform touch drag using CDP directly for more control
    const client = await page.createCDPSession();

    // First, trigger activity to make the scrollbar active (higher z-index)
    // Touch somewhere on the page to activate the scrollbar
    console.log('Activating scrollbar by triggering touch activity...');
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 100, y: 300 }]
    });
    await delay(50);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await delay(200);

    // Check if scrollbar is now active
    const isActive = await page.$eval('.custom-scrollbar', el => el.classList.contains('active'));
    console.log(`Scrollbar active: ${isActive}`);

    // Method 1: Try using JavaScript to simulate the drag directly
    // This bypasses potential CDP touch event issues
    console.log('\nMethod 1: Direct JS simulation of drag...');
    const jsResult = await page.evaluate((startX, startY, endX) => {
      const thumb = document.querySelector('.custom-scrollbar-thumb');
      const gallery = document.getElementById('gallery');
      if (!thumb || !gallery) return { error: 'Elements not found' };

      // Create and dispatch touchstart
      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({
          identifier: 0,
          target: thumb,
          clientX: startX,
          clientY: startY
        })]
      });
      thumb.dispatchEvent(touchStart);

      // Create and dispatch touchmove events
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const currentX = startX + (endX - startX) * (i / steps);
        const touchMove = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [new Touch({
            identifier: 0,
            target: thumb,
            clientX: currentX,
            clientY: startY
          })]
        });
        document.dispatchEvent(touchMove);
      }

      // Create and dispatch touchend
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [new Touch({
          identifier: 0,
          target: thumb,
          clientX: endX,
          clientY: startY
        })]
      });
      document.dispatchEvent(touchEnd);

      return {
        scrollBefore: gallery.scrollLeft,
        success: true
      };
    }, startX, startY, endX);

    console.log('JS simulation result:', jsResult);
    await delay(300);

    // Check final scroll position
    const finalScroll = await page.$eval('#gallery', el => el.scrollLeft);
    console.log(`\nFinal gallery scroll position: ${finalScroll}`);

    const scrollDelta = finalScroll - initialScroll;
    console.log(`Scroll delta: ${scrollDelta}`);

    if (scrollDelta > 0) {
      console.log('\n SUCCESS: Gallery scrolled via thumb touch drag!');
    } else {
      console.log('\n WARNING: Gallery did not scroll. Touch drag may not be working.');
    }

    // Additional test: check if scrollbar has proper touch-action CSS
    const touchAction = await page.$eval('.custom-scrollbar-thumb', el => {
      return window.getComputedStyle(el).touchAction;
    });
    console.log(`\nThumb touch-action CSS: "${touchAction}"`);

    if (touchAction === 'none') {
      console.log('Touch-action properly set to "none"');
    } else {
      console.log('Warning: touch-action should be "none" for proper drag support');
    }

    console.log('\n--- Test complete ---\n');

    await browser.close();
    process.exit(scrollDelta > 0 ? 0 : 1);

  } catch (error) {
    console.error('Test error:', error.message);
    console.log('\nMake sure the server is running on port 5500!');
    console.log('You can start it with: npx serve -p 5500');
    await browser.close();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing browser...');
  process.exit(0);
});

testMobileTouchDrag();
