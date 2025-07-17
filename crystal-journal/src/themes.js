// src/themes.js

// This array holds the definitions for all our beautiful, pre-designed themes.
export const themes = [
  {
    name: "Starry Night",
    bgClass: "bg-starry-night",
    colors: {
      '--bg-color': '#0d1b2a',
      '--primary-accent': '#e0e1dd',
      '--secondary-accent': '#778da9',
      '--font-color': '#e0e1dd',
      '--font-color-muted': '#778da9',
      '--glass-bg': 'rgba(27, 38, 59, 0.6)',
      '--glass-border': 'rgba(224, 225, 221, 0.2)',
    }
  },
  {
    name: "Galaxy",
    bgClass: "bg-galaxy",
    colors: {
      '--bg-color': '#000000',
      '--primary-accent': '#c77dff',
      '--secondary-accent': '#7f5af0',
      '--font-color': '#fffffe',
      '--font-color-muted': '#a7a9be',
      '--glass-bg': 'rgba(46, 49, 72, 0.5)',
      '--glass-border': 'rgba(199, 125, 255, 0.3)',
    }
  },
  {
    name: "Ocean Depths",
    bgClass: "bg-ocean-depths",
    colors: {
      '--bg-color': '#001219',
      '--primary-accent': '#94d2bd',
      '--secondary-accent': '#0a9396',
      '--font-color': '#e9d8a6',
      '--font-color-muted': '#0a9396',
      '--glass-bg': 'rgba(0, 82, 87, 0.5)',
      '--glass-border': 'rgba(148, 210, 189, 0.3)',
    }
  },
  {
    name: "Sunset",
    bgClass: "bg-sunset",
    colors: {
      '--bg-color': '#231942',
      '--primary-accent': '#f42b03',
      '--secondary-accent': '#e85d04',
      '--font-color': '#ffffff',
      '--font-color-muted': '#be95c4',
      '--glass-bg': 'rgba(88, 60, 121, 0.5)',
      '--glass-border': 'rgba(244, 43, 3, 0.4)',
    }
  },
  {
    name: "Enchanted Forest",
    bgClass: "bg-enchanted-forest",
    colors: {
      '--bg-color': '#081c15',
      '--primary-accent': '#b7e4c7',
      '--secondary-accent': '#52b788',
      '--font-color': '#d8f3dc',
      '--font-color-muted': '#74c69d',
      '--glass-bg': 'rgba(23, 62, 50, 0.6)',
      '--glass-border': 'rgba(183, 228, 199, 0.3)',
    }
  },
  {
    name: "Synthwave",
    bgClass: "bg-synthwave",
    colors: {
      '--bg-color': '#1a1a2e',
      '--primary-accent': '#e94560',
      '--secondary-accent': '#00f5d4',
      '--font-color': '#f8f8f2',
      '--font-color-muted': '#bd93f9',
      '--glass-bg': 'rgba(26, 26, 46, 0.6)',
      '--glass-border': 'rgba(0, 245, 212, 0.3)',
    }
  },
  {
    name: "Cotton Candy",
    bgClass: "bg-cotton-candy",
    colors: {
      '--bg-color': '#f7cad0',
      '--primary-accent': '#c1121f',
      '--secondary-accent': '#003049',
      '--font-color': '#003049',
      '--font-color-muted': '#669bbc',
      '--glass-bg': 'rgba(255, 255, 255, 0.5)',
      '--glass-border': 'rgba(0, 48, 73, 0.3)',
    }
  },
  {
    name: "Plain",
    bgClass: "bg-plain",
    colors: { // Same as Synthwave but with no background animation
      '--bg-color': '#1a1a2e',
      '--primary-accent': '#e94560',
      '--secondary-accent': '#00f5d4',
      '--font-color': '#f8f8f2',
      '--font-color-muted': '#bd93f9',
      '--glass-bg': 'rgba(26, 26, 46, 0.6)',
      '--glass-border': 'rgba(0, 245, 212, 0.3)',
    }
  }
];