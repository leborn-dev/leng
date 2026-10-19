'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),acorn=require('acorn');
for(const filename of ['jquery-2.1/dist/jquery.min.js','jquery-2.2/dist/jquery.min.js','bootstrap/dist/js/bootstrap.min.js','sprintf-js/dist/sprintf.min.js','validate.js/validate.min.js']) {
 assert.doesNotThrow(()=>acorn.parse(fs.readFileSync('vendor/security/'+filename,'utf8'),{ecmaVersion:5}),filename+' must retain legacy ES5 browser syntax');
}
console.log('All patched legacy browser distributions parse as ES5');
