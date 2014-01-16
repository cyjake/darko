#!/usr/bin/env node


var program = require('commander')


program
  .option('-s --source [source]', 'Source directory (default to ./)', './')
  .option('-d --destination [dest]', 'Destination directory (default to ./_site)', './_site')
  .option('-t --trace', 'Display backtrace when an error occurs', false)
  .option('--config [CONFIG_FILE[,CONFIG_FILE2,...]', 'Custom configuration file', function(config) {
    return config.split(',')
  })
  .option('--future', 'Publishes posts with a future date')
  .option('-D --drafts', 'Render posts in the _drafts folder')
  .option('-V --verbose', 'Print verbose output')
  .parse(process.argv)


if (program.verbose) {
  process.env.DEBUG = 'darko,' + (process.env.DEBUG || '')
}

// We need to alter process.env to set DEBUG environment variable **before**
// requiring the site module.
var Site = require('..').Site
var util = require('..').util

var site = new Site({
  cwd: program.source,
  dest: program.destination,
  includeDrafts: program.drafts,
  includeFuture: program.future
})

site.parse()

site.write()
  .fail(function(err) {
    if (program.trace) console.error(err.stack)
    else util.fatal(err.message)
  })
  .done(function() {
    util.log('Generating', '... done')
  })

