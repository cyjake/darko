var path = require('path')
var fs = require('fs')
var Site = require('..').Site
var util = require('..').util
var should = require('should')


var site = new Site({
  cwd: path.resolve(__dirname, '../test/fixture')
})


describe('Site', function() {

  it('should parse posts, pages, and static files', function() {
    site.parse()
    site.posts.should.not.be.empty
    site.pages.should.not.be.empty
  })

  it('should write posts, pages, and static files', function(done) {
    site.write()
      .fail(function(err) {
        util.error('Generation failed because of:')
        util.error(err.stack)
      })
      .done(function() {
        util.log('Generating', '... done')
        fs.existsSync(site.dest).should.be.ok
        done()
      })
  })
})
