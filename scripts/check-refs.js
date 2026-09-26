#!/usr/bin/env node
/**
 * Finds identifiers that are used but never defined or imported.
 *
 * Babel compiles a reference to a deleted variable perfectly happily — the failure only shows up
 * as a ReferenceError on the device. That is how a removed `narrationLanguage` survived a clean
 * compile and would have crashed the video screen, so this runs in CI alongside the other checks.
 *
 *   npm run check:refs
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const root = path.join(__dirname, '..');
const roots = ['app', 'App.js'];

// Globals the bundler or runtime provides.
const GLOBALS = new Set([
  '__DEV__', 'require', 'module', 'exports', 'process', 'console', 'globalThis', 'global',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame',
  'cancelAnimationFrame', 'fetch', 'Promise', 'JSON', 'Math', 'Date', 'Object', 'Array', 'String',
  'Number', 'Boolean', 'Set', 'Map', 'WeakMap', 'Error', 'RegExp', 'Intl', 'URL', 'URLSearchParams',
  'Buffer', 'TextEncoder', 'TextDecoder', 'AbortController', 'React', 'undefined', 'NaN', 'Infinity',
]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) yield full;
  }
}

const files = [];
for (const r of roots) {
  const full = path.join(root, r);
  if (!fs.existsSync(full)) continue;
  if (fs.statSync(full).isDirectory()) files.push(...walk(full));
  else files.push(full);
}

let problems = 0;
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
  } catch (error) {
    console.log(`  parse error  ${path.relative(root, file)}: ${error.message.split('\n')[0]}`);
    problems += 1;
    continue;
  }

  traverse(ast, {
    Program(programPath) {
      for (const [name, refs] of Object.entries(programPath.scope.globals ?? {})) {
        if (GLOBALS.has(name)) continue;
        const line = refs.loc?.start?.line ?? '?';
        console.log(`  undefined    ${path.relative(root, file)}:${line}  "${name}"`);
        problems += 1;
      }
    },
  });
}

console.log(
  problems
    ? `\n${problems} undefined reference(s) — these throw at runtime, not at build time.`
    : `No undefined references in ${files.length} files.`
);
process.exit(problems ? 1 : 0);
