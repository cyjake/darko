#!/usr/bin/env node


var program = require('commander')


program
  .option('-s --source [source]', 'Source directory (default to ./)', './')
  .option('-d --destination [dest]', 'Destination directory (default to ./_site)', './_site')
  .option('--config [CONFIG_FILE[,CONFIG_FILE2,...]]', 'Custom configuration file', function(config) {
    return config.split(',')
  })
  .option('--future', 'Publishes posts with a future date')
  .option('--limit_posts [MAX_POSTS]', 'Limits the number of posts to parse and build')
  .option('-w --watch', 'Watch for changes and rebuild')
  .option('--lsi')
  .option('-D --drafts', 'Render posts in the _drafts folder')
  .option('-V --verbose', 'Print verbose output')
  .option('-B --detach', 'Run the server in the background')
  .option('-P --port [port]', 'Port to listen on', parseInt, '4100')
  .option('-H --host [host]', 'Host to bind to', '0.0.0.0')
  .option('-b --baseurl [baseurl]', 'Base URL')

program.on('--help', function() {
  console.log('  Examples:')
  console.log('')
  console.log('    $ darko serve --watch')
  console.log('    $ darko serve -P 4000 -b docs')
  console.log('')
})

program.parse(process.argv)


if (program.verbose) {
  process.env.DEBUG = 'darko,' + (process.env.DEBUG || '')
}

var http = require('http')
var path = require('path')
var fs = require('fs')
var debug = require('debug')('darko')
var Site = require('..').Site
var util = require('..').util


var site = new Site({
  cwd: program.source,
  dest: program.destination,
  includeDrafts: program.drafts,
  includeFuture: program.future,
  baseurl: program.baseurl,
  config: program.config
})

process.stdin.resume()

site.parse()
site.write()
  .fail(function(err) {
    if (program.trace) console.error(err.stack)
    else util.fatal(err.message)
  })
  .done(serve)

function serve() {
  http.createServer(handle).listen(program.port, program.host, function() {
    util.log('Server address', 'http://127.0.0.1:' + program.port)
    util.log('Server running', 'press ctrl-c to stop')
  })
}

function handle(req, res) {

  function sendFile(fpath) {
    debug('Sending ' + fpath)
    fs.createReadStream(fpath)
      .pipe(res)
  }

  var fpath = path.join(site.dest, req.url.slice(1))

  if (!fs.existsSync(fpath)) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/html')
    res.write('<h1>404 Not Found</h1>')
    res.end()
    return
  }

  var stats = fs.statSync(fpath)

  if (stats.isFile()) {
    sendFile(fpath)
  }
  else if (stats.isDirectory()) {
    fpath = path.join(fpath, 'index.html')

    if (fs.existsSync(fpath)) sendFile(fpath)
  }
}
