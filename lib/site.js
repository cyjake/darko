'use strict';

var fs = require('fs')
var yaml = require('yaml-js')
var _ = require('lodash')
var Promise = require('bluebird')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var chokidar = require('chokidar')
var strftime = require('strftime')
var debug = require('debug')('darko')

var Asset = require('./parsers/asset')
var Post = require('./parsers/post')
var Page = require('./parsers/page')
var Data = require('./parsers/data')
var util = require('./util')

var writeAsset = require('./writers/asset')
var writeTemplated = require('./writers/templated')


/*
 * Glue parsers and writers together.
 */
Post.prototype.write = Page.prototype.write = function() {
  return writeTemplated(this).then(function() {
    util.log('Regenerated', this.path + ' at ' + strftime('%F %T'))
  }.bind(this))
}

Asset.prototype.write = function() {
  return writeAsset(this)
}


var mkdirpAsync = function(dir) {
  return new Promise(function(resolve, reject) {
    mkdirp(dir, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

var rimrafAsync = function(dir) {
  return new Promise(function(resolve, reject) {
    rimraf(dir, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

var PERMALINK_ABBRS = {
  date: '/:categories/:year/:month/:day/:title.html',
  pretty: '/:categories/:year/:month/:day/:title/',
  none: '/:categories/:title.html'
}

function Site(attrs) {
  var site = this

  this.cwd = path.resolve(process.cwd(), attrs.cwd || './')
  this.dest = attrs.dest ?
    path.resolve(process.cwd(), attrs.dest) :
    path.join(this.cwd, '_site')
  this.includeDrafts = attrs.includeDrafts
  this.includeFuture = attrs.includeFuture

  this.encoding = 'utf-8'
  this.baseurl = ''
  this.permalink = 'date'

  this.config = attrs.config || []
  this.config.unshift('./_config.yml')
  this.config = this.config.map(function(config) {
    return path.join(site.cwd, config)
  })
  this.config.forEach(function(config) {
    if (fs.existsSync(config)) {
      var content = fs.readFileSync(config, site.encoding)
      _.extend(site, yaml.load(content))
    }
  })

  // Make sure baseurl is not null
  this.baseurl = this.baseurl || ''

  this.posts = []
  this.pages = []
  this.assets = []
  this.categories = []

  this.drafts = []

  if (PERMALINK_ABBRS[this.permalink]) {
    this.permalink = PERMALINK_ABBRS[this.permalink]
  }
}

Site.prototype.parse = function() {
  var site = this

  util.log('Configration file', this.config.join(','))
  util.log('Source', this.cwd)
  util.log('Destination', this.dest)

  function walk(fpath) {
    var fbase = path.basename(fpath)

    if (fbase.charAt(0) === '.') return
    if (fbase.charAt(0) === '_') {
      if (!(fbase == '_posts' || (site.includeDrafts && fbase == '_drafts')))
        return
    }
    if (fbase === 'node_modules') return

    var stats = fs.statSync(fpath)
    var post
    var page

    if (stats.isDirectory()) {
      fs.readdirSync(fpath).forEach(function(entry) {
        walk(path.join(fpath, entry))
      })
    }
    else if (stats.isFile()) {
      if (/_posts/.test(path.dirname(fpath))) {
        post = new Post({ fpath: fpath, site: site })
        if (post.valid) {
          if (post.published) site.posts.push(post)
          else site.drafts.push(post)
        }
      }
      else if (site.includeDrafts && /_drafts/.test(path.dirname(fpath))) {
        post = new Post({ fpath: fpath, site: site })
        if (post.valid) site.drafts.push(post)
      }
      else if (/\.(md|html|xml)$/.test(fpath)) {
        page = new Page({ fpath: fpath, site: site })
        if (page.valid) site.pages.push(page)
      }
      else {
        site.assets.push(new Asset({ fpath: fpath, site: site }))
      }
    }
  }

  debug('Walking around ' + this.cwd)
  walk(this.cwd)
  debug('Found ' + this.posts.length + ' posts, ' +
    this.pages.length + ' pages, and ' +
    this.assets.length + ' assets.')

  if (this.includeDrafts) {
    debug(this.includeDrafts)
    this.posts = this.posts.concat(this.drafts)
  }

  if (!this.includeFuture) {
    _.remove(this.posts, function(post) {
      return post.future
    })
  }

  this.posts.sort(function(a, b) { return b.date - a.date })

  this.posts.forEach(function(post) {
    post.categories.forEach(function(cat) {
      var category = _.find(site.categories, function(_cat) {
        return _cat[0] === cat
      })

      if (!category) {
        category = [ cat, [] ]
        site.categories.push(category)
      }

      category[1].push(post)
    })
  })

  Data.load(this)
}

function batch(arr, size, fn) {
  var offset = 0
  var length = arr.length
  var limit = size

  function _batch(offset, limit) {
    return Promise.all(arr.slice(offset, limit).map(fn))
      .then(function() {
        if (limit <= length) {
          offset = limit
          limit += size
          return _batch(offset, limit)
        }
      })
  }

  return function() {
    return _batch(offset, limit)
  }
}

Site.prototype.write = function() {
  // Clear destination folder up by removing then re-creating it
  return rimrafAsync(this.dest)
    .then(function() {
      return mkdirpAsync(this.dest)
    }.bind(this))
    .then(batch(this.assets, 10, writeAsset))
    .then(batch(this.posts, 10, writeTemplated))
    .then(batch(this.pages, 10, writeTemplated))
}


Site.prototype.watch = function watch() {
  util.log('Auto-regeneration', 'enabled')
  var cwd = this.cwd

  chokidar
    .watch(cwd, {
      ignored: [/[\/\\]\./, /_site/],
      ignoreInitial: true,
      followSymlinks: false
    })
    .on('add', this._onAddFile.bind(this))
    .on('change', this._onChangeFile.bind(this))
    .on('unlink', this._onRemoveFile.bind(this))
}

Site.prototype._writePages = function() {
  return Promise.try(batch(this.posts, 10, writeTemplated))
    .then(batch(this.pages, 10, writeTemplated))
}

Site.prototype._onAddFile = function(fpath) {
  if (/_posts/.test(fpath)) {
    this._addType(Post, { fpath: fpath })
    this.posts.sort(function(a, b) { return b.date - a.date })
    this._writePages()
  }
  else if (/_layouts|_includes|_data/.test(fpath)) {
    // added `_layouts` or `_includes`, no need to write files yet.
  }
  else if (/\.(?:md|html)$/.test(fpath)) {
    this._addType(Page, { fpath: fpath })
  }
  else {
    this._addType(Asset, { fpath: fpath })
  }
}

Site.prototype._onChangeFile = function(fpath) {
  if (/_posts/.test(fpath)) {
    this._changeType(Post, { fpath: fpath })
  }
  else if (/_layouts|_includes|_data/.test(fpath)) {
    this._writePages()
  }
  else if (/\.(?:md|html)$/.test(fpath)) {
    this._changeType(Page,  { fpath: fpath })
  }
  else {
    this._changeType(Asset, { fpath: fpath })
  }
}

Site.prototype._onRemoveFile = function(fpath) {
  if (/_posts/.test(fpath)) {
    this._removeType(Post, { fpath: fpath })
    this._writePages()
  }
  else if (/^_/.test(fpath)) {
    // `_layouts` or `_includes` removed, quite possibly can't rewrite pages
    // right away.
  }
  else if (/\.(?:md|html)$/.test(fpath)) {
    this._removeType(Page, { fpath: fpath })
  }
  else {
    this._removeType(Asset, { fpath: fpath })
  }
}

Site.prototype._changeType = function(Type, opts) {
  opts.site = this
  var type = new Type(opts)
  var arr = this[Type.name.toLowerCase() + 's']

  for (var i = 0, len = arr.length; i < len; i++) {
    if (arr[i].path == type.path) {
      debug('Changing file ' + type.path)
      arr[i] = type
      type.write()
      break
    }
  }
}

Site.prototype._addType = function(Type, opts) {
  opts.site = this
  var type = new Type(opts)
  var arr = this[Type.name.toLowerCase() + 's']

  debug('Adding file ' + type.path)
  arr.push(type)
  type.write()
}

Site.prototype._removeType = function(Type, opts) {
  var arr = this[Type.name.toLowerCase() + 's']
  var typePath = path.relative(this.cwd, opts.fpath)

  debug('Removing file ' + typePath)
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i].path == typePath) {
      arr.splice(i, 1)
    }
  }
}


module.exports = Site
