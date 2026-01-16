import { User } from '../services/djangoAuth';

/**
 * Generate a random color (excluding white and very light colors)
 * Returns a hex color string
 */
const generateRandomColor = (seed?: string): string => {
  // If seed is provided (like username), use it to generate consistent colors
  // Otherwise, generate a truly random color
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate hue (0-360) from hash, excluding very light hues (whites)
    const hue = Math.abs(hash % 360);
    
    // Use medium saturation (50-100%) and medium-light brightness (40-70%)
    // This ensures we don't get white or very light colors
    const saturation = 50 + (Math.abs(hash >> 8) % 50); // 50-100%
    const lightness = 40 + (Math.abs(hash >> 16) % 30); // 40-70%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  
  // Fallback: random color with constraints
  const hue = Math.floor(Math.random() * 360);
  const saturation = 50 + Math.floor(Math.random() * 50); // 50-100%
  const lightness = 40 + Math.floor(Math.random() * 30); // 40-70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Generate an avatar data URL (SVG) for a user
 * Returns a circle with random background color and white first initial
 */
export const getUserAvatar = (user: User | null, size: number = 128): string => {
  let initial = 'U';
  let color = generateRandomColor();
  
  if (user) {
    // Get first letter of first_name (case-sensitive)
    if (user.first_name && user.first_name.length > 0) {
      initial = user.first_name[0];
    } else if (user.email && user.email.length > 0) {
      // Fallback to email first letter if no first_name
      initial = user.email[0].toUpperCase();
    }
    
    // Generate consistent color based on email for the same user
    color = generateRandomColor(user.email || user.first_name || 'default');
  }
  
  // Create SVG as data URL
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}"/>
      <text 
        x="${size / 2}" 
        y="${size / 2}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${size * 0.5}" 
        font-weight="600"
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central"
      >${initial}</text>
    </svg>
  `.trim();
  
  // Convert to data URL
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml,${encodedSvg}`;
};
