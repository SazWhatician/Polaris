const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const htmlPath = path.join(baseDir, 'src/shaders/liquid-metal-button/liquid-metal-button.html');
const tsxPath = path.join(baseDir, 'src/shaders/liquid-metal-button/LiquidMetalButton.tsx');
const outDir = path.join(baseDir, 'node_modules/@designcodeio/threeui/lib-dist/package-components');

const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
let tsxContent = fs.readFileSync(tsxPath, 'utf-8');

// Replace import with inlined raw html string
tsxContent = tsxContent.replace(
  'import liquidMetalButtonSource from "./liquid-metal-button.html?raw";',
  `const liquidMetalButtonSource = ${JSON.stringify(htmlContent)};`
);

// Transpile using official typescript compiler
const result = ts.transpileModule(tsxContent, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    removeComments: false,
  }
});

fs.writeFileSync(path.join(outDir, 'LiquidMetalButton.js'), result.outputText, 'utf-8');

console.log('Successfully transpiled LiquidMetalButton.js with ts.transpileModule!');
