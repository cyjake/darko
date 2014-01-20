var path = require('path')
var yaml = require('yaml-js')
var fs = require('fs')
var mkdirp = require('mkdirp').sync
var Q = require('q')
var Liquid = require('../liquid')
var md = require('../markdown')
var _ = require('lodash')
var debug = require('debug')('darko')
var util = require('util')


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
var _layout

function layout(post) {
  if (!post.layoutWas) post.layoutWas = post.layout
  if (!post.layout || _layout === post.layout) {
    // Finished layout renderring, restore the original layout of current post
    post.layout = post.layoutWas
    return post
  }
  _layout = post.layout

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


module.exports = function writeTemplated(page) {
  debug('Generating ' + page.path)

  if (!fs.existsSync(path.dirname(page.dest))) {
    mkdirp(path.dirname(page.dest))
  }

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
    .fail(function(err) {
      util.error('Failed to generate ' + page.path + ' because of ')
      util.error(err.message)
      // util.error(page.content)
    })
}
