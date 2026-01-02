const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Test hero section layouts on all pages with hero sections
 * Desktop: absolute positioning with hero at top (behind header)
 * Mobile: relative positioning with natural document flow (no overlap)
 */
class HeroSectionTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1200, height: 800 }
    });
    this.page = await this.browser.newPage();
    console.log('Browser launched');
  }

  getFileUrl(filename) {
    return `file://${path.resolve(__dirname, filename)}`;
  }

  async testPage(filename, contentSelector, pageName) {
    console.log(`\n Testing ${pageName} (${filename})`);

    // Desktop viewports expect absolute positioning
    const desktopViewports = [
      { name: 'Desktop', width: 1200, height: 800 },
      { name: 'Tablet Landscape', width: 1024, height: 768 }
    ];

    // Mobile viewports expect relative positioning
    const mobileViewports = [
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Mobile (iPhone 14)', width: 390, height: 844 },
      { name: 'Mobile (Pixel 7)', width: 412, height: 915 },
      { name: 'Mobile Small', width: 375, height: 667 }
    ];

    const url = this.getFileUrl(filename);

    // Test desktop viewports (expect absolute positioning)
    console.log('  Desktop (absolute positioning expected):');
    for (const viewport of desktopViewports) {
      await this.page.setViewport({ width: viewport.width, height: viewport.height });
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await this.page.evaluate(() => {
        const heroSection = document.querySelector('.hero-section');
        const heroImage = document.querySelector('.hero-image');

        if (!heroSection || !heroImage) {
          return { error: 'Hero section or image not found' };
        }

        const heroRect = heroSection.getBoundingClientRect();
        const heroStyle = window.getComputedStyle(heroSection);

        return {
          position: heroStyle.position,
          top: heroRect.top,
          left: heroRect.left,
          right: window.innerWidth - heroRect.right,
          isAtTop: heroRect.top >= 25 && heroRect.top <= 35, // Should be around 30px from top
          hasCorrectMargins: heroRect.left >= 25 && heroRect.left <= 35 // Should be around 30px from left
        };
      });

      const passed = !result.error &&
                     result.position === 'absolute' &&
                     result.isAtTop &&
                     result.hasCorrectMargins;

      console.log(`    ${viewport.name} (${viewport.width}x${viewport.height}): ${passed ? 'PASS' : 'FAIL'}`);
      console.log(`      Position: ${result.position} (expect: absolute)`);
      console.log(`      Top: ${Math.round(result.top)}px (expect: ~30px)`);
      console.log(`      Left margin: ${Math.round(result.left)}px (expect: ~30px)`);

      this.results.push({
        page: pageName,
        viewport: viewport.name,
        type: 'desktop',
        passed,
        details: result
      });
    }

    // Test mobile viewports (expect relative positioning, no overlap)
    console.log('  Mobile (relative positioning expected):');
    for (const viewport of mobileViewports) {
      await this.page.setViewport({ width: viewport.width, height: viewport.height });
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await this.page.evaluate((contentSel) => {
        const heroSection = document.querySelector('.hero-section');
        const heroImage = document.querySelector('.hero-image');
        const contentElement = document.querySelector(contentSel);

        if (!heroSection || !heroImage) {
          return { error: 'Hero section or image not found' };
        }

        const heroRect = heroSection.getBoundingClientRect();
        const heroStyle = window.getComputedStyle(heroSection);

        let contentRect = null;
        let overlap = false;
        let overlapAmount = 0;

        if (contentElement) {
          contentRect = contentElement.getBoundingClientRect();
          overlap = contentRect.top < heroRect.bottom;
          overlapAmount = Math.max(0, heroRect.bottom - contentRect.top);
        }

        return {
          position: heroStyle.position,
          heroBottom: heroRect.bottom,
          contentTop: contentRect ? contentRect.top : null,
          overlap,
          overlapAmount
        };
      }, contentSelector);

      const passed = !result.error &&
                     result.position === 'relative' &&
                     !result.overlap;

      console.log(`    ${viewport.name} (${viewport.width}x${viewport.height}): ${passed ? 'PASS' : 'FAIL'}`);
      console.log(`      Position: ${result.position} (expect: relative)`);
      console.log(`      Hero bottom: ${Math.round(result.heroBottom)}px`);
      if (result.contentTop !== null) {
        console.log(`      Content top: ${Math.round(result.contentTop)}px`);
        if (result.overlap) {
          console.log(`      OVERLAP: ${Math.round(result.overlapAmount)}px`);
        }
      }

      this.results.push({
        page: pageName,
        viewport: viewport.name,
        type: 'mobile',
        passed,
        details: result
      });
    }
  }

  async runAllTests() {
    console.log('\n=== Hero Section Layout Tests ===\n');
    console.log('Desktop: Should use absolute positioning (hero at top behind header)');
    console.log('Mobile: Should use relative positioning (natural flow, no overlap)\n');

    // Test each page with hero sections
    const pages = [
      { file: 'volunteer.html', selector: '.hero-text', name: 'Volunteer Page' },
      { file: 'info.html', selector: '#info-sections-container', name: 'Info Page' },
      { file: 'camp.html', selector: '.hero-text', name: 'Camp Page' },
      { file: 'tickets.html', selector: '.scrolling-banner', name: 'Tickets Page' }
    ];

    for (const page of pages) {
      await this.testPage(page.file, page.selector, page.name);
    }

    // Print summary
    console.log('\n=== Test Summary ===\n');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`Total: ${this.results.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.page} @ ${r.viewport} (${r.type})`);
        if (r.details.position) {
          console.log(`    Position: ${r.details.position}`);
        }
      });
    }

    return failed === 0;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const tester = new HeroSectionTester();

  try {
    await tester.init();
    const success = await tester.runAllTests();
    await tester.close();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Error during testing:', error);
    await tester.close();
    process.exit(1);
  }
}

main();
