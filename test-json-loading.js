const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Browser console error:', msg.text());
        }
    });

    await page.goto('http://localhost:5500/volunteer.html');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Testing JSON loading for poster section:\n');

    // Check if JSON was loaded successfully
    const jsonLoadStatus = await page.evaluate(() => {
        return new Promise((resolve) => {
            // Check if poster boxes exist
            setTimeout(() => {
                const posterBoxes = document.querySelectorAll('.poster-box');
                const posterSection = document.querySelector('.poster-section');

                resolve({
                    hasPostersSection: !!posterSection,
                    posterCount: posterBoxes.length,
                    uniquePosters: posterBoxes.length / 2 // Since we duplicate for infinite scroll
                });
            }, 1000);
        });
    });

    console.log('JSON Load Status:');
    console.log(`  Poster section exists: ${jsonLoadStatus.hasPostersSection}`);
    console.log(`  Total poster boxes: ${jsonLoadStatus.posterCount}`);
    console.log(`  Unique posters: ${jsonLoadStatus.uniquePosters}`);

    // Scroll to poster section
    await page.evaluate(() => {
        const posterSection = document.querySelector('.poster-section');
        if (posterSection) {
            posterSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get poster data
    const posterData = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        const firstFewBoxes = Array.from(boxes).slice(0, 8);

        return firstFewBoxes.map((box, index) => {
            const title = box.querySelector('.poster-title')?.textContent;
            const backgroundColor = window.getComputedStyle(box).backgroundColor;
            const borderColor = window.getComputedStyle(box).borderColor;

            // Click to expand and get role data
            box.click();
            const rolesSection = box.querySelector('.poster-roles-section');
            const roles = rolesSection ?
                Array.from(box.querySelectorAll('.poster-role-badge')).map(badge => ({
                    text: badge.textContent,
                    color: window.getComputedStyle(badge).backgroundColor
                })) : [];

            return {
                index,
                title,
                backgroundColor,
                borderColor,
                hasRoles: roles.length > 0,
                roles
            };
        });
    });

    console.log('\nPoster data loaded from JSON:');
    posterData.forEach(poster => {
        console.log(`  ${poster.index + 1}. ${poster.title}:`);
        console.log(`     Background: ${poster.backgroundColor}`);
        console.log(`     Border: ${poster.borderColor}`);
        if (poster.hasRoles) {
            console.log(`     Roles:`);
            poster.roles.forEach(role => {
                console.log(`       - ${role.text}: ${role.color}`);
            });
        }
    });

    // Verify role colors are from JSON
    console.log('\nVerifying role colors match JSON definition:');
    const roleColorCheck = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        const roleColorMap = {};

        // Expand a few boxes to get all role colors
        for (let i = 0; i < Math.min(3, boxes.length); i++) {
            boxes[i].click();
            const badges = boxes[i].querySelectorAll('.poster-role-badge');
            badges.forEach(badge => {
                const roleName = badge.textContent;
                if (!roleColorMap[roleName]) {
                    roleColorMap[roleName] = window.getComputedStyle(badge).backgroundColor;
                }
            });
        }

        return roleColorMap;
    });

    const expectedColors = {
        'Frivillige': 'rgb(144, 238, 144)',
        'Afviklere': 'rgb(135, 206, 235)',
        'Arrangører': 'rgb(255, 182, 193)'
    };

    Object.entries(roleColorCheck).forEach(([role, color]) => {
        const expected = expectedColors[role];
        const match = color === expected;
        console.log(`  ${role}: ${color} ${match ? '✓' : '✗ (expected: ' + expected + ')'}`);
    });

    console.log('\n✅ JSON loading test complete!');

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();