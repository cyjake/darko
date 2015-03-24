'use strict';

var fs = require('fs')
var yaml = require('yaml-js')
var path = require('path')
var _ = require('lodash')
var util = require('../util')


var PAGE_FORMATS = ['.md', '.html', '.xml']


function Page(attrs) {
  var fpath = attrs.fpath

  this.site = attrs.site
  this.ext = path.extname(fpath)

  this.slug = path.basename(fpath, this.ext)
  this.path = path.relative(this.site.cwd, fpath)
  this.title = util.capitalize(this.slug)

  if (this.validFormat && fs.existsSync(fpath)) {
    var content = fs.readFileSync(fpath, this.site.encoding)
    var parts = content.split('---')

    if (parts.length >= 3) {
      _.extend(this, yaml.load(parts[1]))
      this.content = parts.slice(2).join('---')
      this.excerpt = this.content.slice(0, this.content.indexOf('\n\n'))
    }
    else {
      this.content = content
    }
  }

  this.url = path.resolve('/', this.path).replace(/\/index\.(?:md|html)$/, '')

  this.dest = path.join(this.site.dest, this.site.baseurl.slice(1),
    this.path.replace(/\.\w+$/, this.ext == '.md' ? '.html' : this.ext))
}

Object.defineProperties(Page.prototype, {
  validFormat: {
    get: function() {
      return PAGE_FORMATS.indexOf(this.ext) >= 0
    }
  },

  valid: {
    get: function() {
      return this.validFormat
    }
  },

  publishable: {
    get: function() {
      return this.valid
    }
  }
})

module.exports = Page
