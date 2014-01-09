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


var writeStatic = require('./writers/static')
var writeTemplated = require('./writers/templated')


var PERMALINK_ABBRS = {
  date: '/:categories/:year/:month/:day/:title.html',
  pretty: '/:categories/:year/:month/:day/:title/',
  none: '/:categories/:title.html'
}

function Site(attrs) {

  this.cwd = path.resolve(process.cwd(), attrs.cwd || './')
  this.dest = path.resolve(this.cwd, attrs.dest || './_site')

  this.encoding = 'utf-8'
  this.baseurl = ''
  this.permalink = 'date'

  this.posts = []
  this.pages = []
  this.staticFiles = []
  this.categories = []

  var configPath = path.join(this.cwd, '_config.yml')

  if (fs.existsSync(configPath)) {
    _.extend(this, yaml.safeLoad(fs.readFileSync(configPath, this.encoding)))
  }

  if (PERMALINK_ABBRS[this.permalink]) {
    this.permalink = PERMALINK_ABBRS[this.permalink]
  }
}

_.extend(Site.prototype, {

  parse: function() {
    var site = this

    function walk(fpath) {
      var fbase = path.basename(fpath)

      if (fbase.charAt(0) === '.') return
      if (fbase.charAt(0) === '_' && fbase !== '_posts') return
      if (fbase === 'node_modules') return

      var stats = fs.statSync(fpath)

      if (stats.isDirectory()) {
        fs.readdirSync(fpath).forEach(function(entry) {
          walk(path.join(fpath, entry))
        })
      }
      else if (stats.isFile()) {
        if (/_posts/.test(path.dirname(fpath))) {
          var post = new Post({ fpath: fpath, site: site })
          if (post.valid) site.posts.push(post)
        }
        else if (/\.(md|html)$/.test(fpath)) {
          var page = new Page({ fpath: fpath, site: site })
          if (page.valid) site.pages.push(page)
        }
        else {
          site.staticFiles.push(fpath)
        }
      }
    }

    debug('Walking around ' + site.cwd)
    walk(this.cwd)
    debug('Found ' + site.posts.length + ' posts, ' +
      site.pages.length + ' pages, and ' +
      site.staticFiles.length + ' static files.')

    site.posts.sort(function(a, b) {
      return b.date - a.date
    })

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

    // Not running in local mode
    if (!this.local) {
      this.posts = _.remove(this.posts, 'published')
    }

    // Clear destination folder up by removing then re-creating it
    rimraf.sync(this.dest)
    mkdirp.sync(this.dest)

    return Q.all(writeStatic(this))
      .then(Q.all(writeTemplated(this)))
  }
})


module.exports = Site
