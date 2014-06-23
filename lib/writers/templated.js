'use strict';

var path = require('path')
var yaml = require('yaml-js')
var mkdirp = require('mkdirp').sync
var engine = require('../liquid')
var md = require('../markdown')
var _ = require('lodash')
var debug = require('debug')('darko')
var util = require('util')
var Promise = require('bluebird')

var fs = Promise.promisifyAll(require('fs'))


function liquid(tpl, site) {
  // console.log('fda', tpl)
  // https://github.com/sirlantis/grunt-liquid/blob/master/tasks/liquid.js#L34
  var promise = engine.extParse(tpl, function(subFilepath, done) {
    var includePath = path.join(site.cwd, '_includes', subFilepath)

    Promise.some([
      fs.readFileAsync(includePath, site.encoding),
      fs.readFileAsync(includePath + '.md', site.encoding),
      fs.readFileAsync(includePath + '.html', site.encoding)
    ], 1)
      .then(function(results) {
        done(null, results[0])
      })
      .catch(done)
  })

  return promise
}

function markup(page) {
  page.output = page.ext === '.md' ? md(page.content) : page.content
  debug('Marked up ' + page.path)
  return page
}

var _layouts = {}

function layout(page) {
  if (!page.layoutWas) page.layoutWas = page.layout
  if (!page.layout || page.layout == 'nil' || page.layout_ == page.layout) {
    // Finished layout renderring, restore the original layout of current page
    page.layout = page.layoutWas
    page.layout_ = ''
    return page
  }
  page.layout_ = page.layout

  var site = page.site
  // support .html layouts only, for now.
  var lpath = path.join(site.cwd, '_layouts', page.layout) + '.html'
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
        page: page,
        content: page.output
      })
    })
    .then(function(res) {
      page.output = res
      if (lcache.matter) _.extend(page, lcache.matter)

      return layout(page)
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
      page.contentWas = page.content
      page.content = res
      return page
    })
    .then(markup)
    .then(layout)
    .then(render)
    .then(function() {
      page.content = page.contentWas
      return page
    })
    .catch(function(err) {
      util.error('Failed to generate ' + page.path + ':')
      if (process.argv.indexOf('--trace') > 0)
        util.error(err.stack)
      else
        util.error(err.message)

      throw err
    })
}
