// Utility functions to access CSS custom properties
export const getColor = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
};

export const getFontFamily = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(`--font-family-${name}`).trim();
};

export const getFontSize = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(`--font-size-${name}`).trim();
};

export const getSpacing = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(`--space-${name}`).trim();
};

export const getRadius = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(`--radius-${name}`).trim();
};

// Function to apply a token as a CSS variable
export const applyToken = (element: HTMLElement, property: string, token: string): void => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  element.style.setProperty(property, value);
};