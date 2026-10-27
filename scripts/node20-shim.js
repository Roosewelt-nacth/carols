// Node 20.9 lacks URL.parse (added in Node 22). Expo's dev server needs it, so add a tiny stand-in.
// Use it with:  NODE_OPTIONS="--require ./scripts/node20-shim.js" npx expo start --web
// Upgrading to Node 22 makes this file unnecessary.
if (typeof URL.parse !== 'function') {
  URL.parse = (input, base) => {
    try {
      return new URL(input, base);
    } catch {
      return null;
    }
  };
}
if (typeof URL.canParse !== 'function') {
  URL.canParse = (input, base) => {
    try {
      new URL(input, base);
      return true;
    } catch {
      return false;
    }
  };
}

// util.parseEnv arrived in Node 20.12. Expo uses it to read .env.local.
const util = require('util');
if (typeof util.parseEnv !== 'function') {
  util.parseEnv = (text) => {
    const out = {};
    String(text).split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*?)\s*$/);
      if (!m || m[1].startsWith('#')) return;
      let v = m[2];
      if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
      out[m[1]] = v;
    });
    return out;
  };
}
