'use strict'

const path = require('path')
const yaml = require('yaml-js')
const mkdirp = require('mkdirp')
const debug = require('debug')('darko')
const util = require('util')
const fs = require('fs')

const md = require('../markdown')
const engine = require('../liquid')
const FileSystem = require('../liquid/FileSystem')

const mkdirpAsync = function(dir) {
  return new Promise(function(resolve, reject) {
    mkdirp(dir, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}


function liquid(tpl, site) {
  if (!engine.site) {
    engine.registerFileSystem(
      new FileSystem(path.join(site.cwd, '_includes'), site.encoding, '.html', '.md')
    )
    engine.site = site
  }
  return engine.parse(tpl)
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
      if (lcache.matter) Object.assign(page, lcache.matter)

      return layout(page)
    })
}

function render(page) {
  fs.writeFileSync(page.dest, page.output)
  debug('Generated ' + page.path)
}


module.exports = function writeTemplated(page) {
  debug('Generating ' + page.path)

  return mkdirpAsync(path.dirname(page.dest))
    .then(function() {
      return liquid(page.content, page.site)
    })
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
      throw err
    })
}
