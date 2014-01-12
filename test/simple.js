var path = require('path')
var Site = require('..').Site
var util = require('..').util


var site = new Site({
  cwd: path.resolve(__dirname, '../test/fixture')
})

site.parse()

site.write()
  .fail(function(err) {
    util.error('Generation failed because of:')
    util.error(err.stack)
  })
  .done(function() {
    util.log('Generating', '... done')
  })
