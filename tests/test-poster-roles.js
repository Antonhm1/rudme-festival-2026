const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto('http://localhost:5500/frivillig.html');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Testing poster roles display:\n');

    // Scroll to poster section
    await page.evaluate(() => {
        const posterSection = document.querySelector('.poster-section');
        if (posterSection) {
            posterSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Click first poster to expand
    console.log('Expanding first poster (Baren)...');
    await page.evaluate(() => {
        const firstBox = document.querySelector('.poster-box');
        if (firstBox) {
            firstBox.click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check role badges in first poster
    const firstPosterRoles = await page.evaluate(() => {
        const firstBox = document.querySelector('.poster-box.expanded');
        if (!firstBox) return null;

        const rolesSection = firstBox.querySelector('.poster-roles-section');
        const heading = rolesSection ? rolesSection.querySelector('.poster-roles-heading') : null;
        const badges = rolesSection ? Array.from(rolesSection.querySelectorAll('.poster-role-badge')) : [];

        return {
            title: firstBox.querySelector('.poster-title')?.textContent,
            hasRolesSection: !!rolesSection,
            headingText: heading ? heading.textContent : null,
            headingStyles: heading ? {
                fontSize: window.getComputedStyle(heading).fontSize,
                color: window.getComputedStyle(heading).color
            } : null,
            roles: badges.map(badge => ({
                text: badge.textContent,
                backgroundColor: window.getComputedStyle(badge).backgroundColor,
                fontSize: window.getComputedStyle(badge).fontSize,
                padding: window.getComputedStyle(badge).padding
            }))
        };
    });

    console.log('\nFirst poster (Baren) roles:');
    console.log(`  Title: ${firstPosterRoles.title}`);
    console.log(`  Has roles section: ${firstPosterRoles.hasRolesSection}`);
    console.log(`  Heading: "${firstPosterRoles.headingText}" (${firstPosterRoles.headingStyles?.fontSize})`);
    console.log(`  Roles found: ${firstPosterRoles.roles.length}`);

    firstPosterRoles.roles.forEach(role => {
        console.log(`    - ${role.text}: ${role.backgroundColor} (${role.fontSize})`);
    });

    // Click second poster
    console.log('\n\nExpanding second poster (Ma\'teltet)...');
    await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        if (boxes[1]) {
            boxes[1].click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check role badges in second poster
    const secondPosterRoles = await page.evaluate(() => {
        const expandedBox = document.querySelector('.poster-box.expanded');
        if (!expandedBox) return null;

        const rolesSection = expandedBox.querySelector('.poster-roles-section');
        const badges = rolesSection ? Array.from(rolesSection.querySelectorAll('.poster-role-badge')) : [];

        return {
            title: expandedBox.querySelector('.poster-title')?.textContent,
            roles: badges.map(badge => ({
                text: badge.textContent,
                backgroundColor: window.getComputedStyle(badge).backgroundColor
            }))
        };
    });

    console.log(`\nSecond poster (Ma'teltet) roles:`);
    console.log(`  Title: ${secondPosterRoles.title}`);
    console.log(`  Roles found: ${secondPosterRoles.roles.length}`);

    secondPosterRoles.roles.forEach(role => {
        console.log(`    - ${role.text}: ${role.backgroundColor}`);
    });

    // Test third poster (Team Clean - only Frivillige)
    console.log('\n\nExpanding third poster (Team Clean)...');
    await page.evaluate(() => {
        const boxes = document.querySelectorAll('.poster-box');
        if (boxes[2]) {
            boxes[2].click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const thirdPosterRoles = await page.evaluate(() => {
        const expandedBox = document.querySelector('.poster-box.expanded');
        if (!expandedBox) return null;

        const rolesSection = expandedBox.querySelector('.poster-roles-section');
        const badges = rolesSection ? Array.from(rolesSection.querySelectorAll('.poster-role-badge')) : [];

        return {
            title: expandedBox.querySelector('.poster-title')?.textContent,
            roles: badges.map(badge => badge.textContent)
        };
    });

    console.log(`\nThird poster (Team Clean) roles:`);
    console.log(`  Title: ${thirdPosterRoles.title}`);
    console.log(`  Roles: ${thirdPosterRoles.roles.join(', ')}`);

    // Verify color mappings
    console.log('\n\nVerifying role color mappings:');
    const colorMappings = await page.evaluate(() => {
        // Expand different boxes to check all role colors
        const results = {};
        const boxes = document.querySelectorAll('.poster-box');

        // Helper to get unique role colors
        const checkBox = (box) => {
            box.click();
            const badges = box.querySelectorAll('.poster-role-badge');
            badges.forEach(badge => {
                const role = badge.textContent;
                if (!results[role]) {
                    results[role] = window.getComputedStyle(badge).backgroundColor;
                }
            });
        };

        // Check first few boxes
        for (let i = 0; i < Math.min(4, boxes.length); i++) {
            checkBox(boxes[i]);
        }

        return results;
    });

    console.log('  Role colors found:');
    Object.entries(colorMappings).forEach(([role, color]) => {
        console.log(`    ${role}: ${color}`);
    });

    console.log('\n✅ Role display test complete!');

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
})();