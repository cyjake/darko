'use strict'


exports.capitalize = function capitalize(str) {
  return str.replace(/-?\b([a-z])/g, function(m, chr) {
    return ' ' + chr.toUpperCase()
  }).trim()
}


function pad(str, chr, width) {
  str = '' + str
  var len = Math.max(0, width - str.length)

  return (new Array(len + 1)).join(chr) + str
}

exports.pad = pad


/*
 * log utilities
 *
 * References:
 * - https://github.com/componentjs/console.js/blob/master/index.js
 */

/**
 * Output fatal error message and exit.
 *
 * @param {String} msg
 * @api private
 */

exports.fatal = function(){
  console.error()
  exports.error.apply(null, arguments)
  console.error()
  process.exit(1)
}


/**
 * Log the given `type` with `msg`.
 *
 * @param {String} type
 * @param {String} msg
 * @api public
 */

exports.log = function(type, msg, color){
  color = color || '36'
  console.log('  \u001b[' + color + 'm%s\u001b[0m : \u001b[32m%s\u001b[0m', pad(type, ' ', 18), msg)
}


/**
 * Output error message.
 *
 * @param {String} msg
 * @api private
 */

exports.error = function(msg){
  var type = 'error'
  console.error('  \u001b[31m%s\u001b[0m : \u001b[0;32m%s\u001b[0m', pad(type, ' ', 18), msg)
}
