var yaml = require('js-yaml')
var path = require('path')
var fs = require('fs')


exports.load = function(site) {
  var dir = path.join(site.cwd, '_data')
  var obj = {}

  if (!fs.existsSync(dir)) return obj

  fs.readdirSync(dir).forEach(function(entry) {
    if (path.extname(entry) === '.yml') {
      obj[path.basename(entry, '.yml')] = yaml.safeLoad(
        fs.readFileSync(path.join(dir, entry), site.encoding)
      )
    }
  })

  return obj
}
