'use strict';

var path = require('path')
var fs = require('fs')
var Promise = require('bluebird')
var mkdirp = require('mkdirp')
var debug = require('debug')('darko')


function mkdirpAsync(dir) {
  return new Promise(function(resolve, reject) {
    mkdirp(dir, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

module.exports =  function writeAsset(asset) {
  var site = asset.site
  var rpath = asset.path
  var fpath = path.join(site.cwd, rpath)
  var dest = path.resolve(site.dest, site.baseurl.slice(1), rpath)

  debug('Coping file ' + rpath)

  return mkdirpAsync(path.dirname(dest)).then(function() {
    return new Promise(function(resolve, reject) {
      fs.createReadStream(fpath)
        .pipe(fs.createWriteStream(dest))
        .on('error', function(err) {
          // create an Error instance hence we can capture the stack trace here.
          reject(new Error(err))
        })
        .on('finish', function() {
          debug('Copied file ' + rpath)
          resolve()
        })
    })
  })
}
