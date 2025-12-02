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
- `*.html` - Additional pages (about, program, tickets, volunteer, camp, association, contact)
- `assets/` - Shared resources including CSS, JavaScript, and images
- `pictures/` - Gallery images for the homepage slider
- `scripts/` - Build and utility scripts
- `tests/` - Puppeteer UI tests for gallery, navigation, and responsive design

### Core JavaScript Architecture

#### Main Gallery System (`assets/script.js`)
- **Dynamic slide generation**: Gallery slides are generated from `pictures/` directory using filename conventions
- **Image naming convention**: `Name#HEXCOLOR&ORDER.ext` where:
  - Name becomes the alt text
  - HEXCOLOR sets the background color for that slide
  - ORDER determines slide sequence (optional)
- **Auto-advance carousel**: 4-second intervals with pause on user interaction
- **Custom scrollbar**: Interactive thumb with live slide descriptions
- **Dynamic background**: Interpolates between slide colors based on scroll position
- **Logo color adaptation**: Logo and date text automatically adjust color based on background

#### Header System (`assets/header-insert.js`)
- Dynamically injects shared header content from `assets/header.html`
- Creates custom navigation dropdown with fallback native select
- Handles page-specific styling (black text on subpages, dynamic colors on homepage)

#### Program Page (`assets/program.js`)
- Custom scrollbars for individual artist boxes
- Color-coordinated with CSS custom properties

### CSS Architecture (`assets/styles.css`)
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

- `assets/artists.json` - Artist information for the program page
- `assets/load-from-sheet.js` - Google Sheets integration for dynamic content loading

## Development Notes

- The gallery slides are embedded directly in `index.html` and regenerated via the build script
- Logo SVG is loaded dynamically and styled with `currentColor` for theme adaptation
- Social links and navigation use inline color adjustments on mobile for dynamic theming
- The custom scrollbar system provides visual feedback about current slide position
- Auto-advance respects user interaction, page visibility, and focus states

## Testing

The project includes comprehensive UI tests using Puppeteer and Jest:

### Test Coverage
- **Gallery functionality**: Horizontal scrolling, auto-advance, background color changes, custom scrollbar
- **Navigation**: Header injection, dropdown menu, logo adaptation, page-specific styling
- **Responsive design**: Mobile, tablet, and desktop viewports with functionality validation

### Running Tests
Use `npm test` to run all tests, or `npm run test:ui` for UI-specific tests. Tests run against local HTML files and validate both visual and functional behavior across different screen sizes.