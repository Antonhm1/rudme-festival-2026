/**
 * Transform posters sheet data to posters.json format
 *
 * Expected posters columns:
 * - id: Unique identifier (e.g., "baren")
 * - title: Position title (e.g., "Baren")
 * - image_path: Full path or just filename
 * - description: Position description
 * - color: Hex color
 * - roles: Comma-separated list (e.g., "Frivillige, Afviklere")
 *
 * Expected roleColors columns:
 * - role_name: Name of the role (e.g., "Frivillige")
 * - color: Hex color for that role
 */

function transformPosters(postersData, roleColorsData) {
  // Build roleColors object
  const roleColors = {};
  if (roleColorsData && roleColorsData.length > 0) {
    roleColorsData.forEach(row => {
      const roleName = row.role_name || row.roleName || row.name;
      const color = row.color;
      if (roleName && color) {
        roleColors[roleName] = color;
      }
    });
  } else {
    // Default role colors if sheet not provided
    roleColors['Frivillige'] = '#90EE90';
    roleColors['Afviklere'] = '#87CEEB';
    roleColors['Arrangører'] = '#FFB6C1';
  }

  const posters = postersData.map(row => {
    // Handle image path
    let imagePath = row.image_path || row.image || '';
    if (imagePath && !imagePath.includes('/')) {
      imagePath = `pictures/frivillig-siden/poster/${imagePath}`;
    }

    // Parse roles from comma-separated string
    let roles = [];
    if (row.roles) {
      roles = row.roles.split(',').map(r => r.trim()).filter(r => r);
    }

    // Convert newlines to <br> in description
    const description = (row.description || '').replace(/\n/g, '<br>');

    return {
      id: row.id || '',
      title: row.title || '',
      image: imagePath,
      description: description,
      color: row.color || '#FFFFFF',
      roles: roles
    };
  }).filter(poster => poster.id && poster.title);

  return { roleColors, posters };
}

module.exports = transformPosters;
