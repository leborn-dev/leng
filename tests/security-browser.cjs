'use strict';
const path=require('node:path');
const {Server}=require('karma');
const variant=process.argv[2] || '2.1';
const suffix=process.argv.includes('--min')?'.min':'';
const jquery=variant==='3'?`node_modules/jquery/dist/jquery${suffix}.js`:`vendor/security/jquery-${variant}/dist/jquery${suffix}.js`;
const bootstrap=process.env.TEST_BOOTSTRAP || `vendor/security/bootstrap/dist/js/bootstrap${suffix}.js`;
function scripts() {
 return function(req,res,next) {
  if (!req.url.startsWith('/security-script-'))return next();
  res.setHeader('Content-Type','text/javascript');
  res.statusCode=req.url.startsWith('/security-script-failure')?500:200;
  res.end('window.lengScriptExecuted = true;');
 };
}
new Server({basePath:path.resolve(__dirname,'..'),frameworks:['jasmine'], files:[jquery,bootstrap,'tests/security-browser.spec.js'].concat(variant === '2.1' ? ['tests/jquery-data-identity.spec.js'] : []),
 plugins:['karma-jasmine','karma-chrome-launcher',{'middleware:security-scripts':['factory',scripts]}], middleware:['security-scripts'],
 browsers:['ChromeHeadless'],singleRun:true,reporters:['dots'],port:9887,client:{jasmine:{random:false}}},code=>process.exit(code)).start();
