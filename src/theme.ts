// Apple-inspired: flat surfaces, hairline edges, one accent. Christmas shows up as the berry red and holly green.
// Every screen reads `colors`, so switching Light/Dark re-dresses the whole app.

export type Palette = {
  name: string;
  tagline: string;
  light: boolean;
  skyTop: string; // page background (kept under the old names so every screen still works)
  skyMid: string;
  skyLow: string;
  gold: string; // accent
  goldSoft: string; // accent as text
  primary: string;
  onPrimary: string;
  holly: string;
  berry: string;
  cream: string;
  ink: string;
  card: string;
  cardBorder: string;
  text: string;
  textSoft: string;
  glass: string; // frosted card surface
  glassEdge: string;
  orbs: [string, string, string]; // ambient glow colours
  fill: string; // quiet grey fill for pills and segmented controls
  chipOn: string;
  inputBg: string;
  placeholder: string;
  flake: string;
  danger: string;
  ok: string;
  lights: string[];
  tree: [string, string];
};

export const palettes: Record<string, Palette> = {
  light: {
    name: 'Light',
    tagline: 'Clean white with berry red',
    light: true,
    skyTop: '#F5F5F7', skyMid: '#F5F5F7', skyLow: '#F5F5F7',
    gold: '#C8202F', goldSoft: '#C8202F', primary: '#C8202F', onPrimary: '#FFFFFF',
    holly: '#1F7A4D', berry: '#C8202F', cream: '#FFFFFF', ink: '#1D1D1F',
    card: '#FFFFFF', cardBorder: 'rgba(0,0,0,0.07)',
    text: '#1D1D1F', textSoft: '#6E6E73',
    glass: 'rgba(255,255,255,0.62)', glassEdge: 'rgba(255,255,255,0.9)', orbs: ['rgba(224,57,74,0.30)', 'rgba(46,158,106,0.24)', 'rgba(240,184,74,0.30)'],
    fill: 'rgba(120,120,128,0.12)', chipOn: '#C8202F', inputBg: '#F2F2F7', placeholder: '#AEAEB2',
    flake: 'rgba(150,176,204,0.75)', danger: '#FF3B30', ok: '#34C759',
    lights: ['#C8202F', '#1F7A4D'], tree: ['#E5E5EA', '#D1D1D6'],
  },
  dark: {
    name: 'Dark',
    tagline: 'True black, easy on the eyes at night',
    light: false,
    skyTop: '#000000', skyMid: '#000000', skyLow: '#000000',
    gold: '#FF5A61', goldSoft: '#FF6B71', primary: '#FF4650', onPrimary: '#FFFFFF',
    holly: '#30D158', berry: '#FF4650', cream: '#FFFFFF', ink: '#F5F5F7',
    card: '#1C1C1E', cardBorder: 'rgba(255,255,255,0.09)',
    text: '#F5F5F7', textSoft: '#98989D',
    glass: 'rgba(36,36,40,0.55)', glassEdge: 'rgba(255,255,255,0.14)', orbs: ['rgba(255,70,80,0.30)', 'rgba(48,209,88,0.20)', 'rgba(255,200,90,0.18)'],
    fill: 'rgba(120,120,128,0.24)', chipOn: '#FF4650', inputBg: '#2C2C2E', placeholder: '#636366',
    flake: 'rgba(255,255,255,0.7)', danger: '#FF453A', ok: '#30D158',
    lights: ['#FF4650', '#30D158'], tree: ['#1C1C1E', '#2C2C2E'],
  },
};

export const themeNames = Object.keys(palettes);
export const DEFAULT_THEME = 'light';

// Mutable on purpose: applyTheme() swaps the values and the app re-renders.
export const colors: Palette = { ...palettes[DEFAULT_THEME] };
export const applyTheme = (name: string) => Object.assign(colors, palettes[name] || palettes[DEFAULT_THEME]);

export const radius = { s: 10, m: 14, l: 18 };
export const space = (n: number) => n * 4;

// Inter is the closest free match to Apple's San Francisco. Headings and controls are italic, paragraphs stay upright.
export const fonts = {
  display: 'Inter_700Bold_Italic',
  displayBlack: 'Inter_700Bold_Italic',
  displayItalic: 'Inter_400Regular_Italic',
  script: 'Inter_700Bold_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium_Italic',
  bodyBold: 'Inter_600SemiBold_Italic',
};
