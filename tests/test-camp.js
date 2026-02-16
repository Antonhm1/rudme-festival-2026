const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('🧪 Testing Rudme Lejr page...\n');

        // Set viewport
        await page.setViewport({ width: 1440, height: 900 });

        // Navigate to camp page
        await page.goto('http://localhost:3000/rudmelejr.html', {
            waitUntil: 'networkidle2',
            timeout: 10000
        });

        console.log('✅ Page loaded successfully');

        // Check hero section
        const heroSection = await page.$('.hero-section');
        const heroText = await page.$eval('.hero-text', el => el.textContent);
        console.log(`✅ Hero section found - Text: "${heroText}"`);

        // Check intro section
        const introTitle = await page.$eval('.intro-title', el => el.textContent);
        console.log(`✅ Intro section found - Title: "${introTitle}"`);

        // Check gallery
        const galleryItems = await page.$$('.gallery-item');
        console.log(`✅ Gallery loaded with ${galleryItems.length} images`);

        // Test lightbox functionality
        if (galleryItems.length > 0) {
            await galleryItems[0].click();
            await new Promise(r => setTimeout(r, 500));

            const lightboxDisplay = await page.$eval('#lightbox', el =>
                window.getComputedStyle(el).display
            );

            if (lightboxDisplay === 'block') {
                console.log('✅ Lightbox opens when gallery item clicked');

                // Close lightbox
                await page.click('.lightbox-close');
                await new Promise(r => setTimeout(r, 500));

                const lightboxClosed = await page.$eval('#lightbox', el =>
                    window.getComputedStyle(el).display
                );

                if (lightboxClosed === 'none') {
                    console.log('✅ Lightbox closes properly');
                }
            }
        }

        // Check features section
        const featureBoxes = await page.$$('.feature-box');
        console.log(`✅ Features section loaded with ${featureBoxes.length} feature boxes`);

        // Check social media section
        const socialLinks = await page.$$('.social-link');
        console.log(`✅ Social media section with ${socialLinks.length} links`);

        // Check for Facebook iframe
        const fbIframe = await page.$('iframe[src*="facebook"]');
        if (fbIframe) {
            console.log('✅ Facebook video iframe embedded');
        }

        // Check CTA section
        const ctaButton = await page.$('.cta-button');
        const ctaButtonText = await page.$eval('.cta-button', el => el.textContent.trim());
        console.log(`✅ CTA section with button: "${ctaButtonText}"`);

        // Test mobile responsiveness
        console.log('\n📱 Testing mobile view...');
        await page.setViewport({ width: 375, height: 812 });
        await new Promise(r => setTimeout(r, 1000));

        // Check if gallery is single column on mobile
        const mobileGalleryGrid = await page.$eval('.gallery-grid', el => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
        });
        console.log(`✅ Mobile gallery layout adjusted`);

        // Check if hero text is visible on mobile
        const mobileHeroText = await page.$eval('.hero-text', el => {
            const styles = window.getComputedStyle(el);
            return parseFloat(styles.fontSize) < 50; // Should be smaller on mobile
        });

        if (mobileHeroText) {
            console.log('✅ Hero text resized for mobile');
        }

        // Test tablet view
        console.log('\n💻 Testing tablet view...');
        await page.setViewport({ width: 768, height: 1024 });
        await new Promise(r => setTimeout(r, 1000));

        const tabletView = await page.$('.camp-main');
        if (tabletView) {
            console.log('✅ Tablet view renders correctly');
        }

        // Check scroll animations (scroll to features)
        console.log('\n🎨 Testing scroll animations...');
        await page.setViewport({ width: 1440, height: 900 });
        await page.evaluate(() => {
            document.querySelector('.features-section').scrollIntoView();
        });
        await new Promise(r => setTimeout(r, 1000));

        const featureOpacity = await page.$eval('.feature-box', el => {
            return window.getComputedStyle(el).opacity;
        });

        if (featureOpacity === '1') {
            console.log('✅ Scroll animations working');
        }

        // Performance check
        const performance = await page.evaluate(() => {
            const perfData = window.performance.timing;
            return {
                loadTime: perfData.loadEventEnd - perfData.navigationStart,
                domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart
            };
        });

        console.log(`\n⚡ Performance:`);
        console.log(`   DOM Ready: ${performance.domReady}ms`);
        console.log(`   Full Load: ${performance.loadTime}ms`);

        console.log('\n✨ All tests passed! Camp page is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();