# EcoChain Design System

This document explains how to use the design system in the EcoChain application.

## Setup

The design system is configured with Tailwind CSS and custom design tokens. The tokens are defined in `client/src/tokens/index.js` and integrated with Tailwind through `client/tailwind.config.js`.

## Color Palette

### Primary Colors
- Primary Base: `#22875b` (Deep green)
- Primary Dark: `#1b6b49`
- Primary Light: `#4a9c6f`
- Primary Subtle: `#d6eaea`

### Secondary Colors
- Secondary Base: `#b58473`
- Secondary Light: `#d4a99d`

### Background Colors
- Background Primary: `#22875b`
- Background Secondary: `#f4f7fa`
- Background Tertiary: `#fae7e0`
- Background Quaternary: `#F9F9F9`
- Background Quinary: `#F0F0F0`

### Text Colors
- Text Primary: `#2f3e3f`
- Text Secondary: `#6c8182`
- Text Light: `#fbf7f0`
- Text on Primary: `#fbf7f0`

### Feedback Colors
- Success: `#22C55E`
- Error: `#EF4444`
- Warning: `#F59E0B`
- Info: `#3B82F6`

## Typography

### Font Families
- Base: `Inter, "Helvetica Neue", Arial, sans-serif`
- Heading: `Montserrat, "Helvetica Neue", Arial, sans-serif`
- Display: `Playfair Display, serif`

### Font Sizes
- Base: `1rem`
- Small: `0.875rem`
- Medium: `1.125rem`
- Large: `1.25rem`

### Heading Sizes
- Hero: `3.5rem`
- H1: `2.5rem`
- H2: `2rem`
- H3: `1.75rem`
- H4: `1.5rem`
- H5: `1.25rem`
- H6: `1rem`

## Spacing

The spacing scale follows a consistent 4px base unit:
- 0: 0px
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 8: 32px
- 10: 40px
- 12: 48px
- 16: 64px
- 20: 80px
- 24: 96px
- 32: 128px
- 40: 160px
- 48: 192px
- 56: 224px
- 64: 256px

## Border Radius

- None: 0px
- Small: 4px
- Medium: 8px
- Large: 16px
- Full: 50%

## Shadows

- Small: `0 0 2px 1px rgba(0, 0, 0, 0.05)`
- Medium: `0 0 6px 2px rgba(0, 0, 0, 0.08)`
- Large: `0 0 12px 3px rgba(0, 0, 0, 0.12)`
- Hover: `0 0 10px 2px rgba(0, 0, 0, 0.1)`

## Breakpoints

- Small: 480px
- Medium: 768px
- Large: 1024px
- Extra Large: 1280px
- XXL: 1440px

## Usage Examples

### Background Colors
```jsx
<div className="bg-background-primary">Primary background</div>
<div className="bg-background-secondary">Secondary background</div>
```

### Text Colors
```jsx
<h1 className="text-text-primary">Primary text</h1>
<p className="text-text-secondary">Secondary text</p>
```

### Typography
```jsx
<h1 className="text-h1 font-heading">Heading 1</h1>
<p className="text-base">Base text</p>
```

### Spacing
```jsx
<div className="p-4 m-6">Element with padding and margin</div>
```

### Buttons (Custom Components)
```jsx
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
```

## Custom Components

### Card
```jsx
<div className="card">Card content</div>
```

### Text Gradient
```jsx
<h1 className="text-gradient">Gradient text</h1>
```