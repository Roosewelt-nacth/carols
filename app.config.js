// Same settings as app.json, plus the sub-path for hosting on GitHub Pages.
// Set EXPO_PUBLIC_BASE_URL=/your-repo-name before `npx expo export --platform web`. Leave it empty for a custom domain.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...(config.experiments || {}), baseUrl: process.env.EXPO_PUBLIC_BASE_URL || undefined },
});
