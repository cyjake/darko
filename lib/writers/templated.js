var path = require('path')
var yaml = require('js-yaml')
var fs = require('fs')
var mkdirp = require('mkdirp').sync
var Q = require('q')
var Liquid = require('../liquid')
var md = require('../markdown')
var _ = require('lodash')
var debug = require('debug')('darko')


function writePost(post) {
  debug('Generating ' + post.path)
  post.dest = path.join(post.site.dest, post.url)

  if (path.extname(post.dest) !== '.html') {
    post.dest = post.dest.replace(/\/?$/, '/index.html')
  }
  if (!fs.existsSync(path.dirname(post.dest))) {
    mkdirp(path.dirname(post.dest))
  }

  return liquid(post.content, post.site)
    .then(function(template) {
      return template.render({
        site: post.site,
        page: post
      })
    })
    .then(function(res) {
      post.content = res
      return post
    })
    .then(markup)
    .then(layout)
    .then(render)
    .done()
}

function writePage(page) {
  debug('Generating ' + page.path)
  page.dest = path.join(page.site.dest, page.path.replace(/\.\w+$/, '.html'))

  return liquid(page.content, page.site)
    .then(function(template) {
      return template.render({
        site: page.site,
        page: page
      })
    })
    .then(function(res) {
      page.content = res
      return page
    })
    .then(markup)
    .then(layout)
    .then(render)
    .done()
}

function liquid(tpl, site) {
  // https://github.com/sirlantis/grunt-liquid/blob/master/tasks/liquid.js#L34
  var promise = Liquid.Template.extParse(tpl, function(subFilepath, done) {
    var includePath = path.join(site.cwd, '_includes', subFilepath)

    if (path.extname(includePath) !== '.html') {
      includePath = includePath + '.html'
    }

    if (fs.existsSync(includePath)) {
      done(null, fs.readFileSync(includePath, site.encoding))
    }
    else {
      done(new Error('Can not find partial to include: ' + includePath))
    }
  })

  return promise
}

function markup(page) {
  page.output = page.ext === '.md' ? md(page.content) : page.content
  debug('Marked up ' + page.path)
  return page
}

var _layouts = {}

function layout(post) {
  if (!post.layout || post.layoutWas === post.layout) {
    return post
  }
  post.layoutWas = post.layout

  var site = post.site
  // support .html layouts only, for now.
  var lpath = path.join(site.cwd, '_layouts', post.layout) + '.html'
  var lcache = _layouts[lpath]

  if (!lcache) {
    var lsource = fs.readFileSync(lpath, site.encoding)
    var parts = lsource.split('---')
    var matter

    if (parts.length >= 3) {
      matter = yaml.load(parts[1])
      lsource = parts.slice(2).join('---')
    }

    lcache = _layouts[lpath] = {
      promise: liquid(lsource, site),
      matter: matter
    }
  }

  return lcache.promise
    .then(function(template) {
      return template.render({
        site: site,
        page: post,
        content: post.output
      })
    })
    .then(function(res) {
      post.output = res
      if (lcache.matter) _.extend(post, lcache.matter)

      return layout(post)
    })
}

function render(page) {
  fs.writeFileSync(page.dest, page.output)
  debug('Generated ' + page.path)
}

module.exports = function writeTemplated(site) {
  return Q.all(site.posts.map(writePost))
    .then(Q.all(site.pages.map(writePage)))
}
