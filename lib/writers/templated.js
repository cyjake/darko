'use strict'

const path = require('path')
const yaml = require('yaml-js')
const mkdirp = require('mkdirp')
const debug = require('debug')('darko')
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

async function layout(page, data) {
  const { layout: layoutName } = data || page;
  if (!layoutName || layoutName == 'nil') {
    return page
  }

  const site = page.site
  // support .html layouts only, for now.
  const lpath = path.join(site.cwd, '_layouts', layoutName) + '.html'
  let lcache = _layouts[lpath]

  if (!lcache) {
    let lsource = fs.readFileSync(lpath, site.encoding)
    const parts = lsource.split('---')
    let matter

    if (parts.length >= 3) {
      matter = yaml.load(parts[1])
      lsource = parts.slice(2).join('---')
    }

    lcache = _layouts[lpath] = {
      promise: liquid(lsource, site),
      matter: matter
    }
  }

  const template = await lcache.promise
  const res = await template.render({
    site: site,
    page: page,
    content: page.output
  })
  page.output = res
  if (lcache.matter) return layout(page, lcache.matter)
  return page
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
      console.error('Failed to generate ' + page.path + ':')
      throw err
    })
}
