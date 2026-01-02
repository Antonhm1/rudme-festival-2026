/**
 * Transform history sheet data to history.json format
 *
 * Expected columns:
 * - year: Year number (e.g., 2016)
 * - image_path: Full path or just filename
 * - description: Year description
 * - afterMovieUrl: URL to after movie (optional)
 * - picturesUrl: URL to pictures (optional)
 * - attendees: Number of attendees
 * - budgetResult: Budget result (can be negative)
 * - revenue: Total revenue
 * - organizers: Number of organizers
 * - coordinators: Number of coordinators
 * - volunteers: Number of volunteers
 * - color: Hex color
 */

function transformHistory(rows) {
  const years = rows.map(row => {
    // Handle image path
    let imagePath = row.image_path || row.image || '';
    if (imagePath && !imagePath.includes('/')) {
      imagePath = `pictures/om/historie/${imagePath}`;
    }

    return {
      year: parseInt(row.year, 10) || 0,
      image: imagePath,
      description: row.description || '',
      afterMovieUrl: row.afterMovieUrl || row.after_movie_url || '',
      picturesUrl: row.picturesUrl || row.pictures_url || '',
      attendees: parseInt(row.attendees, 10) || 0,
      budgetResult: parseInt(row.budgetResult || row.budget_result, 10) || 0,
      revenue: parseInt(row.revenue, 10) || 0,
      organizers: parseInt(row.organizers, 10) || 0,
      coordinators: parseInt(row.coordinators, 10) || 0,
      volunteers: parseInt(row.volunteers, 10) || 0,
      color: row.color || '#FFFFFF'
    };
  }).filter(year => year.year > 0);

  // Sort by year
  years.sort((a, b) => a.year - b.year);

  return { years };
}

module.exports = transformHistory;
