'use strict'

var path = require('path')
var expect = require('expect.js')
var fs = require('fs')

var util = require('..').util
var Site = require('..').Site

var exists = fs.existsSync


var site = new Site({
  cwd: path.join(__dirname, './fixture')
})

describe('basic attributes of Site', function() {

  it('should set cwd and dest', function() {
    expect(site.cwd).to.contain('test/fixture')
    expect(site.dest).to.contain('test/fixture/_site')
  })

  it('should parse _config.yml', function() {
    expect(site.baseurl).to.be.a('string')
  })
})


describe('posts, pages, and statics parsing of Site', function() {
  before(function() {
    site.parse()
  })

  it('should parse posts', function() {
    expect(site.posts).not.to.be.empty()

    var postLinks = site.posts.map(function(post) {
      return post.url
    })

    expect(postLinks).to.contain('/catus/ham.html')
    expect(postLinks).to.contain('/felis/egg.html')

    // _posts/baz should not be published because it has the published property
    // set to false in the YAML front mattter.
    expect(postLinks).to.not.contain('/baz.html')

    // _drafts/bad should not be published because it is in the drafts folder.
    expect(postLinks).to.not.contain('/bad.html')
  })

  it('should parse pages', function() {
    expect(site.pages).not.to.be.empty()

    var pageLinks = site.pages.map(function(page) {
      return page.url
    })

    // index.md should be parsed as the homepage. That is, a page with its url
    // set to empty string because the /index.html part is removed.
    expect(pageLinks).to.contain('')

    // felis/index.md should be parse as a page with its url set to /felis
    expect(pageLinks).to.contain('/felis')
  })
})


describe('posts, pages, and statics writing of Site', function() {
  before(function(done) {
    site.write()
      .then(function() {
        util.log('Generating', '... done')
        done()
      })
      .catch(done)
  })

  it('should create destination folder', function() {
    expect(exists(site.dest)).to.be.ok()
  })

  it('should write posts', function() {
  })

  it('should write pages', function() {
  })

  it('should write statics', function() {
  })
})
