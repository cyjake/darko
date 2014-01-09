var fs = require('fs')
var yaml = require('js-yaml')
var _ = require('lodash')
var Q = require('q')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var debug = require('debug')('darko')


var Post = require('./parsers/post')
var Page = require('./parsers/page')
var Data = require('./parsers/data')
var util = require('./util')


var writeStatic = require('./writers/static')
var writeTemplated = require('./writers/templated')


var PERMALINK_ABBRS = {
  date: '/:categories/:year/:month/:day/:title.html',
  pretty: '/:categories/:year/:month/:day/:title/',
  none: '/:categories/:title.html'
}

function Site(attrs) {
  var site = this

  this.cwd = path.resolve(process.cwd(), attrs.cwd || './')
  this.dest = path.resolve(this.cwd, attrs.dest || './_site')
  this.includeDrafts = attrs.includeDrafts

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
      _.extend(this, yaml.safeLoad(fs.readFileSync(config, site.encoding)))
    }
  })

  this.posts = []
  this.pages = []
  this.staticFiles = []
  this.categories = []

  this.drafts = []

  if (PERMALINK_ABBRS[this.permalink]) {
    this.permalink = PERMALINK_ABBRS[this.permalink]
  }
}

_.extend(Site.prototype, {

  parse: function() {
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
        else if (/\.(md|html)$/.test(fpath)) {
          page = new Page({ fpath: fpath, site: site })
          if (page.valid) site.pages.push(page)
        }
        else {
          site.staticFiles.push(fpath)
        }
      }
    }

    debug('Walking around ' + this.cwd)
    walk(this.cwd)
    debug('Found ' + this.posts.length + ' posts, ' +
      this.pages.length + ' pages, and ' +
      this.staticFiles.length + ' static files.')

    if (this.includeDrafts) {
      this.posts = this.posts.concat(this.drafts)
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
  },

  write: function() {
    // Clear destination folder up by removing then re-creating it
    rimraf.sync(this.dest)
    mkdirp.sync(this.dest)

    return Q.all(writeStatic(this))
      .then(Q.all(writeTemplated(this)))
  }
})


module.exports = Site
