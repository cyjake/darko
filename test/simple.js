var path = require('path')
var Site = require('..').Site


var site = new Site({
  cwd: path.resolve(__dirname, '../test/fixture')
})

site.parse()

site.write()
  .fail(function(err) {
    console.error('Generation failed:')
    console.error(err.stack)
  })
  .done()
