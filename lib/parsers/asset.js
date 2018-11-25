'use strict'

var path = require('path')


function Asset(attrs) {
  this.site = attrs.site
  this.path = path.relative(this.site.cwd, attrs.fpath)
}


module.exports = Asset
