const puppeteer = require('puppeteer');
const path = require('path');

class ManualTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: false, // Show browser window
      defaultViewport: { width: 1200, height: 800 },
      devtools: true // Open dev tools for debugging
    });
    this.page = await this.browser.newPage();
    console.log('🚀 Browser launched - Ready for testing!');
  }

  getFileUrl(filename) {
    return `file://${path.resolve(__dirname, filename)}`;
  }

  async loadPage(filename = 'index.html') {
    const url = this.getFileUrl(filename);
    console.log(`📄 Loading: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle0' });
    console.log('✅ Page loaded');
  }

  async testGallery() {
    console.log('🖼️  Testing Gallery...');

    // Wait for gallery to load
    await this.page.waitForSelector('#gallery', { timeout: 10000 });
    console.log('  ✓ Gallery container found');

    // Check slides exist
    const slideCount = await this.page.$$eval('.slide', slides => slides.length);
    console.log(`  ✓ Found ${slideCount} slides`);

    // Test scrolling
    const initialScroll = await this.page.$eval('#gallery', el => el.scrollLeft);
    await this.page.$eval('#gallery', el => el.scrollLeft = 500);
    await this.page.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
    const newScroll = await this.page.$eval('#gallery', el => el.scrollLeft);
    console.log(`  ✓ Scroll test: ${initialScroll} → ${newScroll}`);

    // Test auto-advance (if implemented)
    await this.page.$eval('#gallery', el => el.scrollLeft = 0);
    await this.page.waitForFunction(() => true, { timeout: 2000 }).catch(() => {});
    const autoScroll = await this.page.$eval('#gallery', el => el.scrollLeft);
    console.log(`  ✓ Auto-advance check: ${autoScroll > 0 ? 'Working' : 'Not detected'}`);
  }

  async testNavigation() {
    console.log('🧭 Testing Navigation...');

    // Check if header was injected
    try {
      await this.page.waitForSelector('#logo-container', { timeout: 5000 });
      console.log('  ✓ Header injected successfully');
    } catch (e) {
      console.log('  ⚠️  Header injection timeout');
    }

    // Check navigation dropdown
    try {
      await this.page.waitForSelector('#custom-select', { timeout: 5000 });
      console.log('  ✓ Navigation dropdown found');

      // Test dropdown interaction
      await this.page.click('#custom-select');
      await this.page.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
      const isOpen = await this.page.$eval('#custom-select', el => el.classList.contains('open'));
      console.log(`  ✓ Dropdown interaction: ${isOpen ? 'Opens' : 'Issue detected'}`);

      // Close dropdown
      await this.page.click('body');
      await this.page.waitForFunction(() => true, { timeout: 300 }).catch(() => {});
    } catch (e) {
      console.log('  ⚠️  Navigation dropdown timeout');
    }
  }

  async testResponsive() {
    console.log('📱 Testing Responsive Design...');

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1200, height: 800 }
    ];

    for (const viewport of viewports) {
      console.log(`  📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      await this.page.setViewport(viewport);
      await this.page.waitForFunction(() => true, { timeout: 1000 }).catch(() => {});

      // Check that gallery is still functional
      const galleryVisible = await this.page.$eval('#gallery', el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).catch(() => false);

      console.log(`    ✓ Gallery visible: ${galleryVisible ? 'Yes' : 'No'}`);
    }

    // Reset to default viewport
    await this.page.setViewport({ width: 1200, height: 800 });
  }

  async testCustomScrollbar() {
    console.log('📜 Testing Custom Scrollbar...');

    try {
      // Wait for scrollbar to be created (it's JS generated)
      await this.page.waitForFunction(() => {
        return document.querySelector('.custom-scrollbar') !== null ||
               document.querySelector('#scrollbar-thumb') !== null;
      }, { timeout: 5000 });
      console.log('  ✓ Custom scrollbar found');
    } catch (e) {
      console.log('  ⚠️  Custom scrollbar not found (may still be loading)');
    }
  }

  async takeScreenshot(filename) {
    await this.page.screenshot({
      path: `screenshots/${filename}`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: screenshots/${filename}`);
  }

  async runFullTest() {
    console.log('\n🎯 Running Full Manual Test Suite\n');

    await this.loadPage();
    await this.testGallery();
    await this.testNavigation();
    await this.testCustomScrollbar();
    await this.testResponsive();

    console.log('\n✨ Test complete! Browser will stay open for manual inspection.');
    console.log('   Press Ctrl+C to close when done.\n');

    // Keep browser open for manual testing
    await new Promise(() => {});
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const tester = new ManualTester();

  try {
    await tester.init();
    await tester.runFullTest();
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    process.on('SIGINT', async () => {
      console.log('\n🔄 Closing browser...');
      await tester.close();
      process.exit(0);
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = ManualTester;