// Maps the small set of theme color names actually used as a dynamic (non-Tailwind-class)
// value — i.e. passed into inline styles for components like MathText that need a plain
// CSS color string to share across recursively-sized child nodes. Everything else uses
// Tailwind utility classes (bg-accent, text-text-secondary, ...) backed by the CSS
// variables defined in app/globals.css.
export type ThemeColorName = 'text' | 'textSecondary' | 'accent' | 'good';

export const THEME_COLOR_VAR: Record<ThemeColorName, string> = {
  text: 'var(--color-text)',
  textSecondary: 'var(--color-text-secondary)',
  accent: 'var(--color-accent)',
  good: 'var(--color-good)',
};
