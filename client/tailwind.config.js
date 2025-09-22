// tailwind.config.js
const path = require("path");
const defaultTheme = require("tailwindcss/defaultTheme");
const twColors = require("tailwindcss/colors");
// Using our updated tokens
const tokens = require(path.resolve(__dirname, "src/tokens/index.ts"));

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // the datepicker ships ESM, include it so JIT sees its classes
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    // Screens: start from Tailwind defaults, override with your tokens as needed
    screens: {
      ...defaultTheme.screens,
      ...(tokens?.tokens?.breakpoint || {}),
    },
    
    // Font family configuration
    fontFamily: {
      sans: ['Inter', 'Poppins', ...defaultTheme.fontFamily.sans],
      display: ['Poppins', ...defaultTheme.fontFamily.sans],
    },
    
    // Leave root theme minimal; put customizations in extend
    extend: {
      // Keep Tailwind's built-in palette so 3rd-party components style correctly
      colors: {
        // Merge in Tailwind's colors so bg-white / text-gray-700 keep working
        ...twColors,
        
        // Updated color names to match Tailwind CSS v3.0+
        // Replacing deprecated color names with their new equivalents
        lightBlue: twColors.sky,
        warmGray: twColors.stone,
        trueGray: twColors.neutral,
        coolGray: twColors.gray,
        blueGray: twColors.slate,
        
        // New eco-friendly color palette
        'eco-green': {
          DEFAULT: '#16a34a',
          light: '#22c55e',
          dark: '#15803d',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'eco-beige': '#f5f5dc',
        'eco-red': {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        'eco-yellow': {
          DEFAULT: '#facc15',
          light: '#fde047',
          dark: '#eab308',
        },
        'eco-beige': {
          DEFAULT: '#f5f5dc',
          light: '#f8f8e8',
          dark: '#e6e6c3',
        },
        
        // Your design tokens (names create classes like bg-background-primary)
        background: {
          primary: '#ffffff',
          secondary: '#f9fafb',
          tertiary: '#f5f5dc',
        },
        primary: {
          base: '#16a34a',
          dark: '#15803d',
          light: '#22c55e',
        },
        accent: { 
          gold: '#facc15',
          yellow: '#facc15',
        },
        text: {
          primary: '#111827',
          secondary: '#4b5563',
          light: '#ffffff',
          onPrimary: '#ffffff',
        },
        border: {
          base: tokens.tokens.color.border.base,
          subtle: tokens.tokens.color.border.subtle,
          primary: tokens.tokens.color.border.primary,
        },
        feedback: {
          success: tokens.tokens.color.feedback.success,
          error: tokens.tokens.color.feedback.error,
          warning: tokens.tokens.color.feedback.warning,
          info: tokens.tokens.color.feedback.info,
          successBg: tokens.tokens.color.feedback.successBg,
          errorBg: tokens.tokens.color.feedback.errorBg,
          warningBg: tokens.tokens.color.feedback.warningBg,
          infoBg: tokens.tokens.color.feedback.infoBg,
        },
        overlay: {
          dark: "rgba(0, 0, 0, 0.5)",
          light: "rgba(255, 255, 255, 0.6)",
        },
      },

      fontFamily: {
        sans: Array.isArray(tokens.tokens.font.family?.base)
          ? tokens.tokens.font.family.base
          : [tokens.tokens.font.family.base, ...defaultTheme.fontFamily.sans],
        heading: tokens.tokens.font.family.heading,
        display: tokens.tokens.font.family.display,
      },

      fontSize: {
        base: tokens.tokens.font.size.base,
        sm: tokens.tokens.font.size.sm,
        md: tokens.tokens.font.size.md,
        lg: tokens.tokens.font.size.lg,
        hero: tokens.tokens.font.size.heading.hero,
        h1: tokens.tokens.font.size.heading.h1,
        h2: tokens.tokens.font.size.heading.h2,
        h3: tokens.tokens.font.size.heading.h3,
        h4: tokens.tokens.font.size.heading.h4,
        h5: tokens.tokens.font.size.heading.h5,
        h6: tokens.tokens.font.size.heading.h6,
      },

      fontWeight: tokens.tokens.font.weight,

      lineHeight: {
        base: tokens.tokens.font.lineHeight.base,
        heading: tokens.tokens.font.lineHeight.heading,
      },

      spacing: tokens.tokens.spacing,

      borderRadius: {
        none: tokens.tokens.radius.none,
        sm: tokens.tokens.radius.sm,
        md: tokens.tokens.radius.md,
        lg: tokens.tokens.radius.lg,
        full: tokens.tokens.radius.full,
      },

      boxShadow: {
        ...defaultTheme.boxShadow,
        sm: tokens.tokens.shadow.sm,
        md: tokens.tokens.shadow.md,
        lg: tokens.tokens.shadow.lg,
        hover: tokens.tokens.shadow.hover,
      },

      zIndex: {
        ...(tokens.tokens.zIndex || {}),
      },

      maxWidth: {
        ...(tokens.tokens.maxWidth || {}),
        full: "100%",
      },

      keyframes: {
        fadeIn: tokens.tokens.keyframes.fadeIn,
        slideUp: tokens.tokens.keyframes.slideUp,
        bounce: tokens.tokens.keyframes.bounce,
        pulse: tokens.tokens.keyframes.pulse,
      },
      animation: {
        fadeIn: tokens.tokens.animations.fadeIn,
        slideUp: tokens.tokens.animations.slideUp,
        bounce: tokens.tokens.animations.bounce,
        pulse: tokens.tokens.animations.pulse,
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};