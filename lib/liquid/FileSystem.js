'use strict'

const Liquid = require('liquid-node')
const fs = require('fs')
const path = require('path')

const { readFile } = fs.promises
const PathPattern =  /^[^.\/][a-zA-Z0-9-_\/]+$/

class FileSystem extends Liquid.BlankFileSystem {
  constructor(root, encoding = 'utf-8', ...extensions) {
    super(root, encoding, ...extensions)
    this.root = root
    this.encoding = encoding
    this.extensions = extensions
  }

  readTemplateFile(templatePath) {
    return new Promise((resolve, reject) => {
      if (!PathPattern.test(templatePath)) {
        reject(new Liquid.ArgumentError("Illegal template name '" + templatePath + "'"))
      }
      return resolve(this.readTemplateFiles(templatePath))
    }).catch((err) => {
      throw new Liquid.FileSystemError('Error loading template: ' + err.message)
    })
  }

  readTemplateFiles(templatePath) {
    return new Promise((resolve, reject) => {
      const { encoding, extensions, root } = this
      let count = 0
      const onReject = err => {
        if (++count === extensions.length) {
          reject(new Error(`unable to find ${templatePath} ${extensions}`))
        }
      }

      for (const ext of this.extensions) {
        readFile(path.resolve(root, templatePath + ext), encoding).then(resolve, onReject)
      }
    })
  }
}

module.exports = FileSystem
