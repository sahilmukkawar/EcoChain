// Type definitions for design tokens
export interface Tokens {
  color: {
    background: {
      primary: string;
      secondary: string;
      Pink: string;
      Green: string;
      gradient: {
        start: string;
        end: string;
      };
      accent: {
        gold: string;
      };
      tertiary: string;
      quaternary: string;
      quinary: string;
    };
    feedback: {
      success: string;
      error: string;
      warning: string;
      info: string;
      successBg: string;
      errorBg: string;
      warningBg: string;
      infoBg: string;
    };
    primary: {
      base: string;
      dark: string;
      light: string;
      subtle: string;
    };
    secondary: {
      base: string;
      light: string;
    };
    accent: {
      gold: string;
    };
    text: {
      primary: string;
      secondary: string;
      light: string;
      onPrimary: string;
    };
    border: {
      base: string;
      subtle: string;
      primary: string;
    };
    ui: {
      paper: string;
      tape: string;
    };
  };
  font: {
    family: {
      base: string;
      heading: string;
      display: string;
    };
    size: {
      base: string;
      sm: string;
      md: string;
      lg: string;
      heading: {
        hero: string;
        h1: string;
        h2: string;
        h3: string;
        h4: string;
        h5: string;
        h6: string;
      };
    };
    weight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      base: number;
      heading: number;
    };
  };
  // ... other token types
}

export const tokens: Tokens;