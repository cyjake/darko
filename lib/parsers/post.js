'use strict'

var yaml = require('yaml-js')
var path = require('path')
var fs = require('fs')
var util = require('../util')
var debug = require('debug')('darko')


var PTN_POST_FILE = /(\d{4}-\d{1,2}-\d{1,2})-([^\\]+?)(\.\w+)$/


function Post(attrs) {
  var fpath = attrs.fpath
  var m = fpath.match(PTN_POST_FILE)

  if (!m) {
    debug('Ignored ' + path.relative(attrs.site.cwd, attrs.fpath))
    return
  }
  var date = m[1].split('-')

  this.site = attrs.site
  this.categories = attrs.categories || []
  this.path = path.relative(this.site.cwd, fpath)
  this.slug = m[2]
  this.ext = m[3]
  this.date = new Date(
    parseInt(date[0], 10),
    parseInt(date[1], 10) - 1,  // Starts from 0
    parseInt(date[2], 10)
  )
  this.title = util.capitalize(this.slug)

  if (fs.existsSync(fpath)) {
    var content = fs.readFileSync(fpath, this.site.encoding)
    var parts = content.split('---')

    if (parts.length >= 3) {
      Object.assign(this, yaml.load(parts[1]))
      this.content = parts.slice(2).join('---').trim()
      var caret = this.content.indexOf('\n\n')
      this.excerpt = caret > 0 ? this.content.slice(0, caret) : this.content
    }
    else {
      throw new Error('Failed to parse YAML front matter from ' + fpath)
    }
  }

  if (this.categories.length === 0) {
    if (this.category) {
      this.categories = this.category
      delete this.category
    }
    else {
      var parentFolders = path.relative(this.site.cwd, path.dirname(fpath))
      this.categories = parentFolders.split(path.sep).filter(name => name !== '_posts' && name !== '_drafts')
    }
  }

  /*
   * In YAML front matters, categories and tags are specified in list or space
   * separated string. Let's make sure they are arrays now.
   */
  if (typeof this.categories === 'string') {
    this.categories = this.categories.split(' ')
  }
  if (typeof this.tags === 'string') {
    this.tags = this.tags.split(' ')
  }

  // We can specify date in YAML front matters too. Can we?
  if (typeof this.date === 'string') {
    this.date = new Date(this.date)
  }

  if (!this.hasOwnProperty('published')) {
    this.published = true
  }

  var data = {
    year: this.date.getFullYear(),
    i_month: this.date.getMonth() + 1,
    i_day: this.date.getDate(),
    title: this.slug,
    categories: this.categories ? this.categories[0] : ''
  }

  data.month = util.pad(data.i_month, '0', 2)
  data.day = util.pad(data.i_day, '0', 2)

  this.url = this.site.permalink
    .replace(/:(\w+)/g, function(m, key) {
      return data[key] || ''
    })
    .replace(/\/{2,}/g, '/')

  this.id = path.join(path.dirname(this.url), path.basename(this.url, '.html'))

  this.dest = path.join(this.site.dest, this.site.baseurl.slice(1), this.url)
  if (path.extname(this.dest) !== '.html') {
    this.dest = this.dest.replace(/\/?$/, '/index.html')
  }
}

Object.defineProperties(Post.prototype, {
  valid: {
    get: function() {
      return /(_posts|_drafts)$/.test(path.dirname(this.path)) &&
        PTN_POST_FILE.test(path.basename(this.path))
    }
  },

  future: {
    get: function() {
      var now = new Date()
      var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

      return tomorrow.getTime() <= this.date.getTime()
    }
  },

  publishable: {
    get: function() {
      return this.valid &&
        (this.published || this.site.includeDrafts) &&
        (!this.future || this.site.includeFuture)
    }
  },

  next: {
    get: function() {
      for (var i = 0, len = this.site.posts.length; i < len; i++) {
        var post = this.site.posts[i]
        if (post == this && i > 0) return this.site.posts[i - 1]
      }
    }
  },

  previous: {
    get: function() {
      for (var i = 0, len = this.site.posts.length; i < len; i++) {
        var post = this.site.posts[i]
        if (post == this && i + 1 < len) return this.site.posts[i + 1]
      }
    }
  }
})


module.exports = Post
