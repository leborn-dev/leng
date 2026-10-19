module.exports = function(config) {
  config.set({
    basePath: 'benchpress-build',
    plugins: [
        require('karma-benchpress'),
        require('karma-jasmine'),
        require('karma-chrome-launcher')
    ],
    frameworks: ['jasmine', 'benchpress'],
    files: [
      '*',
      '../test/benchpress/*.js'
    ],
    exclude: [
      '**/bp.conf.js'
    ],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browserNoActivityTimeout: 90000,
    browsers: ['ChromeCanaryPerf'],
    customLaunchers: {
        ChromeCanaryPerf: {
            base: 'ChromeCanary',
            flags: [
                '--enable-memory-info ',
                '--enable-precise-memory-info ',
                '--enable-memory-benchmarking ',
                '--js-flags="--expose-gc"',
                '-incognito'
            ]
        }
    },
    singleRun: true
  });
};
