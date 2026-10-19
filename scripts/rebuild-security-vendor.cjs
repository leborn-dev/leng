'use strict';
// Regenerate all shipped/minified browser artifacts with the legacy syntax contract.
const fs=require('node:fs'),path=require('node:path'),uglify=require('uglify-js');
const base=path.resolve(__dirname,'../vendor/security');
function minify(sourceFile,destination,mapFile) {
 const source=fs.readFileSync(path.join(base,sourceFile),'utf8');
 const result=uglify.minify({[path.basename(sourceFile)]:source},{ie:true,compress:{arrows:false,objects:false,templates:false,optional_chains:false},output:{comments:/^!/},sourceMap:{filename:path.basename(destination),url:path.basename(mapFile),includeSources:true}});
 if(result.error)throw result.error;
 fs.writeFileSync(path.join(base,destination),result.code+'\n');fs.writeFileSync(path.join(base,mapFile),result.map+'\n');
}
for(const version of ['2.1','2.2'])minify(`jquery-${version}/dist/jquery.js`,`jquery-${version}/dist/jquery.min.js`,`jquery-${version}/dist/jquery.min.map`);
minify('validate.js/validate.js','validate.js/validate.min.js','validate.js/validate.min.map');
minify('sprintf-js/src/sprintf.js','sprintf-js/dist/sprintf.min.js','sprintf-js/dist/sprintf.min.js.map');
fs.copyFileSync(path.join(base,'sprintf-js/src/sprintf.js'),path.join(base,'sprintf-js/dist/sprintf.js'));
const order=['transition','alert','button','carousel','collapse','dropdown','modal','tooltip','popover','scrollspy','tab','affix'];
fs.writeFileSync(path.join(base,'bootstrap/dist/js/bootstrap.js'),order.map(name=>fs.readFileSync(path.join(base,'bootstrap/js',name+'.js'),'utf8')).join('\n'));
minify('bootstrap/dist/js/bootstrap.js','bootstrap/dist/js/bootstrap.min.js','bootstrap/dist/js/bootstrap.min.js.map');
