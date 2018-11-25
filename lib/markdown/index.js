'use strict'

// Shamelessly copied from nico:
// https://github.com/lepture/nico/blob/master/lib/sdk/markdown/marked.js
var markit = require('markit')
var format = require('util').format
var encode = require('../encode')
var hl = require('../highlight')


var hlRenderer = new markit.Renderer()

hlRenderer.header = function header(text, level) {
  var id = encode.uri(text);
  return format('<h%d id="%s">%s</h%d>', level, id, text, level);
}

hlRenderer.blockcode = function blockcode(code, language) {
  return hl.render(code, language)
}

module.exports = function md(src) {
  return markit(src, {
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: true,
    sanitize: false,
    smartLists: true,
    renderer: hlRenderer
  })
}
