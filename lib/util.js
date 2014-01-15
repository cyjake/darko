
exports.capitalize = function capitalize(str) {
  return str.replace(/\b([a-z])/g, function(m, chr) { return chr.toUpperCase() })
}

exports.pad = function(str, chr, width) {
  str = '' + str
  len = Math.max(0, width - str.length)

  return Array(len).join(chr) + str
}

exports.replace = function(arr, fn) {
  for (var i = arr.length - 1; i >= 0; i--) {
    arr[i] = fn(arr[i])
  }
}

exports.remove = function(arr, fn) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (fn(arr[i])) arr.splice(i, 1)
  }
}

// Shamepless copied from component the manager:
// https://github.com/component/component/blob/master/lib/utils.js

/**
 * Output fatal error message and exit.
 *
 * @param {String} msg
 * @api private
 */

exports.fatal = function(){
  console.error();
  exports.error.apply(null, arguments);
  console.error();
  process.exit(1);
};

/**
 * Log the given `type` with `msg`.
 *
 * @param {String} type
 * @param {String} msg
 * @api public
 */

exports.log = function(type, msg, color){
  color = color || '36';
  var w = 18;
  var len = Math.max(0, w - type.length);
  var pad = Array(len + 1).join(' ');
  console.log('  \033[' + color + 'm%s\033[m : \033[90m%s\033[m', pad + type, msg);
};

/**
 * Log warning message with `type` and `msg`.
 *
 * @param {String} type
 * @param {String} msg
 * @api public
 */

exports.warn = function(type, msg){
  exports.log(type, msg, '33');
};

/**
 * Output error message.
 *
 * @param {String} msg
 * @api private
 */

exports.error = function(msg){
  var w = 18;
  var type = 'error';
  var len = Math.max(0, w - type.length);
  var pad = Array(len + 1).join(' ');
  console.error('  \033[31m%s\033[m : \033[90m%s\033[m', pad + type, msg);
};
