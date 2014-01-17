var should = require('should')
var path = require('path')
var Site = require('..').Site


describe('Site', function() {

  var site

  before(function() {
    site = new Site({
      cwd: path.join(__dirname, './fixture')
    })
  })

  it('should set cwd and dest', function() {
    site.cwd.should.contain('test/fixture')
    site.dest.should.contain('test/fixture/_site')
  })

  it('should parse _config.yml', function() {
    site.baseurl.should.be.String
  })
})
