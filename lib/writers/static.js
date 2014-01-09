var path = require('path')
var fs = require('fs')
var Q = require('q')
var mkdirp = require('mkdirp')
var debug = require('debug')('darko')


module.exports = function(site) {
  function writeStatic(fpath) {
    var d = Q.defer()
    var rpath = path.relative(site.cwd, fpath)
    var dest = path.resolve(site.dest, rpath)

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

  return site.staticFiles.map(writeStatic)
}
