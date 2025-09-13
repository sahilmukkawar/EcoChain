# Design Tokens

This folder contains the design tokens for the EcoChain application. These tokens define the visual design language including colors, typography, spacing, and other design values. The tokens are integrated with Tailwind CSS for a consistent design system.

## Structure

- [index.ts](file:///d%3A/EcoChain/client/src/tokens/index.ts) - TypeScript object containing all design tokens
- [tokens.utils.ts](file:///d%3A/EcoChain/client/src/tokens/tokens.utils.ts) - Utility functions for accessing tokens in JavaScript/TypeScript
- [tokens.d.ts](file:///d%3A/EcoChain/client/src/tokens/tokens.d.ts) - TypeScript type definitions for tokens

## Usage

### In Tailwind Classes

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

<!-- Spacing -->
<div class="p-4">Small padding</div>
<div class="m-8">Medium margin</div>

<!-- Border radius -->
<div class="rounded-md">Medium rounded corners</div>
```

### In JavaScript/TypeScript

Use the utility functions to access tokens programmatically:

```typescript
import { getColor, getFontFamily, getTailwindClass } from './tokens.utils';

// Get token values directly
const primaryColor = getColor('primary-base');
const headingFont = getFontFamily('heading');

// Get Tailwind class names
const bgClass = getTailwindClass('color', 'primary-base'); // Returns 'bg-primary-base'
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