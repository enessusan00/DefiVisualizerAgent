/**
 * Utility functions for visualization generation
 */

/**
 * Color schemes for visualizations
 */
export const ColorSchemes = {
  blue: {
    primary: 'rgb(75, 192, 192)',
    secondary: 'rgb(54, 162, 235)',
    accent: 'rgb(153, 225, 255)',
    text: '#333333',
    background: '#ffffff',
    gradient: ['rgba(75, 192, 192, 0.8)', 'rgba(54, 162, 235, 0.8)']
  },
  green: {
    primary: 'rgb(75, 192, 75)',
    secondary: 'rgb(54, 162, 54)',
    accent: 'rgb(153, 255, 153)',
    text: '#333333',
    background: '#ffffff',
    gradient: ['rgba(75, 192, 75, 0.8)', 'rgba(54, 162, 54, 0.8)']
  },
  red: {
    primary: 'rgb(255, 99, 99)',
    secondary: 'rgb(225, 69, 69)',
    accent: 'rgb(255, 153, 153)',
    text: '#333333',
    background: '#ffffff',
    gradient: ['rgba(255, 99, 99, 0.8)', 'rgba(225, 69, 69, 0.8)']
  },
  purple: {
    primary: 'rgb(153, 102, 255)',
    secondary: 'rgb(123, 72, 225)',
    accent: 'rgb(180, 153, 255)',
    text: '#333333',
    background: '#ffffff',
    gradient: ['rgba(153, 102, 255, 0.8)', 'rgba(123, 72, 225, 0.8)']
  },
  dark: {
    primary: 'rgb(75, 192, 192)',
    secondary: 'rgb(54, 162, 235)',
    accent: 'rgb(153, 225, 255)',
    text: '#ffffff',
    background: '#333333',
    gradient: ['rgba(75, 192, 192, 0.8)', 'rgba(54, 162, 235, 0.8)']
  }
};

/**
 * Generate a set of colors for charts
 * @param count Number of colors needed
 * @param scheme Color scheme name
 * @returns Array of colors
 */
export function generateChartColors(count: number, scheme: string = 'blue'): string[] {
  // Base colors for different schemes
  const colorPalettes: { [key: string]: string[] } = {
    blue: [
      'rgba(75, 192, 192, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(75, 142, 192, 0.7)',
      'rgba(54, 120, 235, 0.7)',
      'rgba(121, 161, 187, 0.7)',
      'rgba(75, 103, 150, 0.7)'
    ],
    green: [
      'rgba(75, 192, 75, 0.7)',
      'rgba(54, 162, 54, 0.7)',
      'rgba(75, 142, 75, 0.7)',
      'rgba(54, 120, 54, 0.7)',
      'rgba(121, 187, 121, 0.7)',
      'rgba(30, 100, 30, 0.7)',
      'rgba(41, 171, 135, 0.7)'
    ],
    red: [
      'rgba(255, 99, 99, 0.7)',
      'rgba(225, 69, 69, 0.7)',
      'rgba(255, 129, 129, 0.7)',
      'rgba(225, 99, 99, 0.7)',
      'rgba(195, 69, 69, 0.7)',
      'rgba(145, 39, 39, 0.7)',
      'rgba(255, 159, 64, 0.7)'
    ],
    purple: [
      'rgba(153, 102, 255, 0.7)',
      'rgba(123, 72, 225, 0.7)',
      'rgba(153, 72, 225, 0.7)',
      'rgba(123, 42, 195, 0.7)',
      'rgba(93, 12, 165, 0.7)',
      'rgba(183, 132, 255, 0.7)',
      'rgba(213, 182, 255, 0.7)'
    ],
    mixed: [
      'rgba(75, 192, 192, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 75, 0.7)',
      'rgba(153, 72, 225, 0.7)',
      'rgba(255, 99, 99, 0.7)',
      'rgba(54, 120, 235, 0.7)'
    ]
  };
  
  // Get the appropriate color palette
  const palette = colorPalettes[scheme] || colorPalettes.mixed;
  
  // Generate the requested number of colors
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(palette[i % palette.length]);
  }
  
  return result;
}

/**
 * Format a number for display
 * @param num Number to format
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (isNaN(num)) return 'N/A';
  
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  } else if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  } else if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  } else {
    return num.toFixed(decimals);
  }
}

/**
 * Format a percentage for display
 * @param value Percentage value (0-100)
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  if (isNaN(value)) return 'N/A';
  
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(decimals) + '%';
}

/**
 * Generate a CSS gradient string
 * @param colors Array of color strings
 * @param direction Direction of gradient
 * @returns CSS gradient string
 */
export function createGradient(colors: string[], direction: string = 'to right'): string {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
}

/**
 * Create a color transition between two colors
 * @param startColor Start color in hex or rgb format
 * @param endColor End color in hex or rgb format
 * @param steps Number of steps in the transition
 * @returns Array of color strings
 */
export function createColorTransition(startColor: string, endColor: string, steps: number): string[] {
  // Helper to parse color components
  const parseColor = (color: string): number[] => {
    // Handle hex colors
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return [r, g, b];
    }
    
    // Handle rgb/rgba colors
    const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    
    // Default to black if parsing fails
    return [0, 0, 0];
  };
  
  const start = parseColor(startColor);
  const end = parseColor(endColor);
  const result = [];
  
  for (let i = 0; i < steps; i++) {
    const r = Math.round(start[0] + (end[0] - start[0]) * (i / (steps - 1)));
    const g = Math.round(start[1] + (end[1] - start[1]) * (i / (steps - 1)));
    const b = Math.round(start[2] + (end[2] - start[2]) * (i / (steps - 1)));
    
    result.push(`rgb(${r}, ${g}, ${b})`);
  }
  
  return result;
}

/**
 * Generate a heatmap color based on value
 * @param value Value between 0 and 1
 * @param colorScheme Color scheme name
 * @returns Color string
 */
export function getHeatmapColor(value: number, colorScheme: string = 'blue'): string {
  // Ensure value is between 0 and 1
  const normalizedValue = Math.max(0, Math.min(1, value));
  
  // Different color schemes for heatmaps
  const heatmapSchemes: { [key: string]: [string, string] } = {
    blue: ['rgba(240, 248, 255, 1)', 'rgba(0, 0, 139, 1)'],  // AliceBlue to DarkBlue
    green: ['rgba(240, 255, 240, 1)', 'rgba(0, 100, 0, 1)'], // HoneyDew to DarkGreen
    red: ['rgba(255, 240, 240, 1)', 'rgba(139, 0, 0, 1)'],   // LavenderBlush to DarkRed
    purple: ['rgba(248, 240, 255, 1)', 'rgba(75, 0, 130, 1)'] // Lavender to Indigo
  };
  
  const scheme = heatmapSchemes[colorScheme] || heatmapSchemes.blue;
  const colors = createColorTransition(scheme[0], scheme[1], 10);
  
  // Select color based on value
  const index = Math.floor(normalizedValue * (colors.length - 1));
  return colors[index];
}

/**
 * Add a watermark to a visualization
 * @param svgElement SVG element to add watermark to
 * @param text Watermark text
 * @param options Watermark options
 */
export function addWatermark(
  svgElement: SVGElement,
  text: string = 'DeFiVisualizer',
  options: { fontSize?: number; color?: string; opacity?: number } = {}
): void {
  const fontSize = options.fontSize || 12;
  const color = options.color || '#999999';
  const opacity = options.opacity || 0.6;
  
  // Create text element
  const watermark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  watermark.setAttribute('x', '10');
  watermark.setAttribute('y', String(svgElement.clientHeight - 10));
  watermark.setAttribute('font-size', fontSize.toString());
  watermark.setAttribute('font-family', 'Arial, sans-serif');
  watermark.setAttribute('fill', color);
  watermark.setAttribute('opacity', opacity.toString());
  watermark.textContent = text;
  
  // Append to SVG
  svgElement.appendChild(watermark);
}

/**
 * Format a date for display
 * @param date Date object or string
 * @param format Format type
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'medium':
    default:
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
}

/**
 * Generate a unique ID for visualization elements
 * @param prefix ID prefix
 * @returns Unique ID string
 */
export function generateId(prefix: string = 'viz'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
