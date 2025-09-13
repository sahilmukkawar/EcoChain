// tailwind.config.js
const path = require("path");
const defaultTheme = require("tailwindcss/defaultTheme");
const twColors = require("tailwindcss/colors");
const tokens = require(path.resolve(__dirname, "src/tokens/index.ts"));

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // the datepicker ships ESM, include it so JIT sees its classes
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    // ✅ Screens: start from Tailwind defaults, override with your tokens as needed
    screens: {
      ...defaultTheme.screens,
      ...(tokens?.tokens?.breakpoint || {}),
    },

    // ✅ Leave root theme minimal; put customizations in extend
    extend: {
      // Keep Tailwind’s built-in palette so 3rd-party components style correctly
      colors: {
        // Merge in Tailwind’s colors so bg-white / text-gray-700 keep working
        ...twColors,

        // Your design tokens (names create classes like bg-background-primary)
        background: {
          primary: tokens.tokens.color.background.primary,
          secondary: tokens.tokens.color.background.secondary,
          tertiary: tokens.tokens.color.background.tertiary,
          quaternary: tokens.tokens.color.background.quaternary,
          quinary: tokens.tokens.color.background.quinary,
        },
        primary: {
          base: tokens.tokens.color.primary.base,
          dark: tokens.tokens.color.primary.dark,
          light: tokens.tokens.color.primary.light,
          subtle: tokens.tokens.color.primary.subtle,
        },
        secondary: {
          base: tokens.tokens.color.secondary.base,
          light: tokens.tokens.color.secondary.light,
        },
        accent: { gold: tokens.tokens.color.accent.gold },
        text: {
          primary: tokens.tokens.color.text.primary,
          secondary: tokens.tokens.color.text.secondary,
          light: tokens.tokens.color.text.light,
          onPrimary: tokens.tokens.color.text.onPrimary,
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