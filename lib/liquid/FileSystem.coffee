Liquid = require('liquid-node')
Promise = require('bluebird')
fs = require('fs')
path = require('path')


readFile = (fpath, encoding) ->
  new Promise (resolve, reject) ->
    fs.readFile fpath, encoding, (err, content) ->
      if (err)
        reject(err)
      else
        resolve(content)


class FileSystem extends Liquid.BlankFileSystem

  PathPattern = ///^[^.\/][a-zA-Z0-9-_\/]+$///

  constructor: (root, encoding = 'utf-8', extensions...) ->
    @root = root
    @encoding = encoding
    @extensions = [''].concat(extensions)

  readTemplateFile: (templatePath) ->
    new Promise((resolve, reject) =>
      reject new Liquid.ArgumentError "Illegal template name '#{templatePath}'" unless PathPattern.test templatePath
      resolve(@readTemplateFiles(templatePath))
    )
      .catch (err) ->
        throw new Liquid.FileSystemError "Error loading template: #{err.message}"

  readTemplateFiles: (templatePath) ->
    Promise.some(@extensions.map((extension) =>
      readFile(path.resolve(@root, templatePath + extension), @encoding)
    ), 1)
      .then (results) ->
        results[0]


module.exports = FileSystem
