
'use strict';
// Preserve Benchpress's stream contract while using a maintained browser bundler.
const esbuild = require('esbuild');
const {PassThrough} = require('node:stream');
module.exports = function bundle(entry) {
  return {bundle() {
    const output = new PassThrough();
    esbuild.build({entryPoints:[entry], bundle:true, write:false, platform:'browser', format:'iife', target:'es5', define:{global:'window'}})
      .then(result => output.end(result.outputFiles[0].contents), error => output.destroy(error));
    return output;
  }};
};
