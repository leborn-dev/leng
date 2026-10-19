'use strict';
const path=require('node:path');const {Server}=require('karma');const suffix=process.argv.includes('--min')?'.min':'';
new Server({basePath:path.resolve(__dirname,'..'),files:[`build/angular${suffix}.js`,`build/angular-sanitize${suffix}.js`,`build/angular-resource${suffix}.js`,'build/angular-mocks.js','tests/angular-dist-security.spec.js'],frameworks:['jasmine'],browsers:['ChromeHeadless'],plugins:['karma-jasmine','karma-chrome-launcher'],singleRun:true,reporters:['dots'],port:9888},code=>process.exit(code)).start();
