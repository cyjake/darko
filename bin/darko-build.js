#!/usr/bin/env node


var program = require('commander')


program
  .option('-s --source [source]', 'Source directory (default to ./)', './')
  .option('-d --destination [dest]', 'Destination directory (default to ./_site)', './_site')
  .option('-t --trace', 'Display backtrace when an error occurs', false)
  .parse(process.argv)


if (program.trace) {
  process.env.DEBUG = 'darko,' + (process.env.DEBUG || '')
}

// We need to alter process.env to set DEBUG environment variable **before**
// requiring the site module.
var Site = require('../lib/site')

var site = new Site({
  cwd: program.source,
  dest: program.destination
})

site.parse()

site.write()
  .fail(function(err) {
    console.error(err.stack)
  })
  .done(function() {
    console.log('Generation succeeded')
  })

