# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a website for the Rudme Festival (July 16-18, 2026), built as a static HTML site with dynamic JavaScript functionality. The site features a horizontal scrolling gallery on the homepage, dynamic navigation, and program pages with artist information.

## Key Commands

- `npm start` - Start the local Express server for development (requires server.js to be created)
- `node scripts/generate_slides.js` - Regenerate the gallery slides in index.html from images in the pictures/ directory
- `npm test` - Run all UI tests with Puppeteer
- `npm run test:ui` - Run only UI tests (Gallery, Navigation, Responsive)
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Generate test coverage report

## Architecture

### File Structure

- `index.html` - Homepage with horizontal scrolling gallery
- `*.html` - Additional pages (about, program, tickets, volunteer, camp, association, contact, info, skurvognen)
- `css/` - All stylesheets (styles.css, page-specific CSS, component CSS)
- `scripts/` - All JavaScript files (page scripts, components, utilities, build scripts)
- `database/` - JSON data files (artists.json, volunteers.json, posters.json, etc.)
- `pictures/` - All images organized by category:
  - `artists/` - Artist profile images
  - `icons/` - SVG icons and logos
  - `Forsiden/` - Homepage gallery images
  - Other subdirectories for page-specific images
- `assets/` - HTML fragments only (header.html, footer.html)
- `tests/` - Puppeteer UI tests for gallery, navigation, and responsive design

### Core JavaScript Architecture

#### Main Gallery System (`scripts/script.js`)

- **Dynamic slide generation**: Gallery slides are generated from `pictures/` directory using filename conventions
- **Image naming convention**: `Name#HEXCOLOR&ORDER.ext` where:
  - Name becomes the alt text
  - HEXCOLOR sets the background color for that slide
  - ORDER determines slide sequence (optional)
- **Auto-advance carousel**: 4-second intervals with pause on user interaction
- **Custom scrollbar**: Interactive thumb with live slide descriptions
- **Dynamic background**: Interpolates between slide colors based on scroll position
- **Logo color adaptation**: Logo and date text automatically adjust color based on background

#### Header System (`scripts/header-insert.js`)

- Dynamically injects shared header content from `assets/header.html`
- Creates custom navigation dropdown with fallback native select
- Handles page-specific styling (black text on subpages, dynamic colors on homepage)
- **IMPORTANT**: The header has its own dedicated CSS and styling infrastructure
- **DO NOT** manipulate header styles on sub-sites unless absolutely necessary
- Header styling should be self-contained and consistent across all pages

#### Program Page (`scripts/program.js`)

- Custom scrollbars for individual artist boxes
- Color-coordinated with CSS custom properties

#### Section Component (`scripts/section-component.js` + `css/section-component.css`)

- Reusable component for content sections (used on volunteer and info pages)
- Creates consistent layout: header outside content box, extended images, description, optional button
- Usage: `SectionComponent.create({ id, title, image, imageCrop, content, buttonText, color, container })`
- Content can be HTML string or array of paragraphs
- Includes `updateButtonStyles(bgColor)` for dynamic button coloring

### CSS Architecture (`css/styles.css`)

- CSS custom properties for slide-specific colors (--bg-color-1, --bg-color-2, etc.)
- Responsive design with mobile-specific behaviors
- Custom scrollbar styling with hover/active states
- Dynamic logo and navigation styling

### Build Process

The `scripts/generate_slides.js` tool:

1. Scans the `pictures/` directory for images
2. Parses filenames for color and ordering information
3. Updates the gallery section in `index.html` between `<!-- SLIDES-START -->` and `<!-- SLIDES-END -->` markers
4. Generates properly encoded image paths and alt text

### Data Sources

- `database/artists.json` - Artist information for the program page
- `database/volunteers.json` - Volunteer role information
- `database/posters.json` - Volunteer position posters
- `database/history.json` - Festival history data
- `database/info-sections.json` - Info page content
- `scripts/load-from-sheet.js` - Google Sheets integration for dynamic content loading

### Test

When testing, use Puppeteer on port 5500 (the visual stidio live server) to see the changes. Do this when making UI changes. When I make a prompt that says test with Puppeteer, this is what you should do.
