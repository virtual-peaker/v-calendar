import { execSync } from 'child_process';
import fs from 'fs';
import { type BuildFormat } from './configs/vite.common';

const formats: BuildFormat[] = ['es', 'mjs', 'cjs', 'iife'];

async function executeBuild() {
  // Build types
  execSync('vue-tsc --declaration --emitDeclarationOnly --outDir dist/types', {
    stdio: 'inherit',
  });

  // Build lib with formats
  for (const format of formats) {
    execSync(`vite build --config ./build/configs/vite.${format}.ts`, {
      stdio: 'inherit',
    });
  }

  // Copy css to root
  fs.copyFileSync('dist/es/style.css', 'dist/style.css');

  // Mark the CommonJS build as CommonJS. This package sets "type": "module" at
  // its root, which makes every plain .js file under it resolve as an ES module
  // — including dist/cjs, which is genuinely CommonJS, so bundlers and Node
  // throw "ReferenceError: exports is not defined" on it. A nested package.json
  // overrides "type" for its own subtree, which is Node's supported fix.
  fs.writeFileSync('dist/cjs/package.json', `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);
}

executeBuild();
