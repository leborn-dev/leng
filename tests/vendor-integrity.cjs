'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const packages={braces:['index.js','lib/parse.js','lib/compile.js','lib/expand.js','lib/stringify.js','lib/limits.js'], 'validate.js':['validate.js','validate.min.js'], 'sprintf-js':['src/sprintf.js','dist/sprintf.min.js'],bootstrap:['js/button.js','js/carousel.js','js/tooltip.js','dist/js/bootstrap.js','dist/js/bootstrap.min.js'], 'jquery-2.1':['dist/jquery.js','dist/jquery.min.js','src/core.js','src/ajax.js'], 'jquery-2.2':['dist/jquery.js','dist/jquery.min.js','src/core.js','src/ajax.js'], 'angular-benchpress':['lib/cli.js','lib/node/bundle.js'], 'sauce-connect':['adapter.cjs','bin/sc']};
for(const [name,entries] of Object.entries(packages))for(const entry of entries){assert.deepEqual(fs.readFileSync(path.join(root,'node_modules',name,entry)),fs.readFileSync(path.join(root,'vendor/security',name,entry)),`${name}/${entry}: installed and reviewed fork must match`);}
console.log('All installed fork runtime/browser/minified entrypoints match reviewed vendor sources');
