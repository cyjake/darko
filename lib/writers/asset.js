'use strict'

const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const debug = require('debug')('darko')
const writeSass = require('./sass')

function mkdirpAsync(dir) {
  return new Promise(function(resolve, reject) {
    mkdirp(dir, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

module.exports =  function writeAsset(asset) {
  switch (path.extname(asset.path).toLowerCase()) {
    case '.scss':
    case '.sass':
      return writeSass(asset)
    default:
      return copyFile(asset)
  }
}

function copyFile(asset) {
  const site = asset.site
  const rpath = asset.path
  const fpath = path.join(site.cwd, rpath)
  const dest = path.resolve(site.dest, site.baseurl.slice(1), rpath)

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
