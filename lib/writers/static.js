'use strict';

var path = require('path')
var fs = require('fs')
var Promise = require('bluebird')
var mkdirp = require('mkdirp')
var debug = require('debug')('darko')



module.exports =  function writeStatic(fpath, site) {
  var d = Promise.defer()
  var rpath = path.relative(site.cwd, fpath)
  var dest = path.resolve(site.dest, site.baseurl.slice(1), rpath)

  debug('Coping file ' + rpath)
  mkdirp(path.dirname(dest), function(err) {
    if (err) d.reject(new Error(err))

    fs.createReadStream(fpath)
      .pipe(fs.createWriteStream(dest))
      .on('error', function(err) {
        // create an Error instance hence we can capture the stack trace here.
        d.reject(new Error(err))
      })
      .on('finish', function() {
        debug('Copied file ' + rpath)
        d.resolve()
      })
  })

  return d.promise
}
