// Import tokens directly
import { tokens } from './index';

// Utility functions to access tokens directly
export const getColor = (path: string): string => {
  const parts = path.split('-');
  let current: any = tokens.color;
  
  for (const part of parts) {
    if (current[part] === undefined) return '';
    current = current[part];
  }
  
  return typeof current === 'string' ? current : '';
};

export const getFontFamily = (name: string): string => {
  return tokens.font.family[name] || '';
};

export const getFontSize = (name: string): string => {
  if (name.startsWith('h') && name.length === 2) {
    return tokens.font.size.heading[name] || '';
  }
  return tokens.font.size[name] || '';
};

export const getSpacing = (name: string): string => {
  return tokens.space[name] || '';
};

export const getRadius = (name: string): string => {
  return tokens.radius[name] || '';
};

// Function to get a tailwind class based on token type and value
export const getTailwindClass = (type: string, value: string): string => {
  const classMap: Record<string, string> = {
    'color': 'bg',
    'text': 'text',
    'spacing': 'p',
    'radius': 'rounded',
    'fontFamily': 'font',
    'fontSize': 'text',
  };
  
  return `${classMap[type] || type}-${value}`;
};