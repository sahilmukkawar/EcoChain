# Design Tokens

This folder contains the design tokens for the EcoChain application. These tokens define the visual design language including colors, typography, spacing, and other design values.

## Structure

- [index.js](file:///c%3A/Users/soham/OneDrive/Desktop/EcoChain/client/src/tokens/index.js) - JavaScript object containing all design tokens
- [tokens.css](file:///c%3A/Users/soham/OneDrive/Desktop/EcoChain/client/src/tokens/tokens.css) - CSS custom properties version of the tokens
- [tokens.utils.ts](file:///c%3A/Users/soham/OneDrive/Desktop/EcoChain/client/src/tokens/tokens.utils.ts) - Utility functions for accessing tokens in JavaScript/TypeScript

## Usage

### In CSS/Tailwind Classes

Tokens are integrated into Tailwind CSS and can be used directly as classes:

```html
<!-- Background colors -->
<div class="bg-background-primary">Primary background</div>
<div class="bg-background-secondary">Secondary background</div>

<!-- Text colors -->
<h1 class="text-primary-base">Primary text</h1>
<h2 class="text-secondary-base">Secondary text</h2>

<!-- Typography -->
<h1 class="font-heading text-h1">Heading 1</h1>
<p class="font-base text-base">Body text</p>
```

### As CSS Custom Properties

Tokens are also available as CSS custom properties:

```css
.my-component {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
  padding: var(--space-16);
  border-radius: var(--radius-md);
}
```

### In JavaScript/TypeScript

Use the utility functions to access tokens programmatically:

```typescript
import { getColor, getFontFamily } from './tokens.utils';

const primaryColor = getColor('primary-base');
const headingFont = getFontFamily('heading');
```

## Available Tokens

### Colors
- Background: primary, secondary, tertiary, quaternary, quinary
- Primary: base, dark, light, subtle
- Secondary: base, light
- Accent: gold
- Text: primary, secondary, light, onPrimary
- Border: base, subtle, primary
- Feedback: success, error, warning, info (and their background variants)

### Typography
- Font families: base, heading, display
- Font sizes: base, sm, md, lg, hero, h1-h6
- Font weights: light, normal, medium, semibold, bold
- Line heights: base, heading

### Spacing
- Values from 0 to 64 (in 4px increments)

### Radius
- none, sm, md, lg, full

### Shadows
- sm, md, lg, hover

### Breakpoints
- sm, md, lg, xl, xxl