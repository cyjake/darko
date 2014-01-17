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

    var postLinks = site.posts.map(function(po) {
      return po.url
    })

    postLinks.should.contain('/catus/ham.html')
    postLinks.should.contain('/felis/egg.html')

    // _posts/baz should not be published because it has the published property
    // set to false in the YAML front mattter.
    postLinks.should.not.contain('/baz.html')

    // _drafts/bad should not be published because it is in the drafts folder.
    postLinks.should.not.contain('/bad.html')
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
