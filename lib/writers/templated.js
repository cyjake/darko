'use strict'

const path = require('path')
const yaml = require('yaml-js')
const mkdirp = require('mkdirp')
const debug = require('debug')('darko')
const fs = require('fs/promises')

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

const _layouts = {}

async function layout(page, data) {
  const site = page.site
  const { layout: layoutName } = data || page;
  if (!layoutName || layoutName == 'nil') {
    return page
  }

  // support .html layouts only, for now.
  const lpath = path.join(site.cwd, '_layouts', layoutName) + '.html'
  let lcache = _layouts[lpath]

  if (!lcache) {
    let lsource = await fs.readFile(lpath, site.encoding)
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
    page: {...page, ...data},
    content: page.output
  })
  page.output = res
  if (lcache.matter) return layout(page, lcache.matter)
  return page
}

async function render(page) {
  await fs.writeFile(page.dest, page.output)
  debug('Generated ' + page.path)
}

function getDefaults(page) {
  const { site } = page;
  if (!site.defaults) return;
  
  const defaults = site.defaults.filter(function({ scope }) {
    if (!scope) return true;
    let match = true;
    if (scope.path) {
      if (scope.path.includes('*')) {
        match = new RegExp(`^${scope.path.replace('*', '.*?')}`).test(page.path);
      } else {
        match = page.path.startsWith(scope.path);
      }
    }
    if (scope.type && match) {
      match = scope.type === page.type;
    }
    return match;
  })
  return Object.assign({}, ...defaults.map(d => d.values));
}

module.exports = async function writeTemplated(page) {
  debug('Generating ' + page.path)
  try {
    await mkdirpAsync(path.dirname(page.dest))
    const template = await liquid(page.content, page.site)
    const res = await template.render({
      site: page.site,
      page: page
    })
    let content = page.content;
    page.content = res;
    await markup(page)
    await layout(page, getDefaults(page))
    await render(page)
    page.content = content;
    return page
  } catch (err) {
    console.error('Failed to generate ' + page.path + ':')
    throw err
  }
}
