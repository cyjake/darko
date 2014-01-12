var should = require('should')
var Liquid = require('../').Liquid


function liquid(tpl, data) {
  return Liquid.Template.extParse(tpl).then(function(template) {
    return template.render(data)
  })
}

describe('Liquid', function() {

  it('has filter date_to_xmlschema', function(done) {
    liquid('{{ date | date_to_xmlschema }}', {
      date: new Date(2014, 0, 12)
    }).done(function(res) {
      res.should.equal('2014-01-12T00:00:00+08:00')
      done()
    })
  })

  it('has filter date_to_rfc822', function(done) {
    liquid('{{ date | date_to_rfc822 }}', {
      date: new Date(2014, 0, 12)
    }).done(function(res) {
      res.should.equal('Sun, 12 Jan 2014 00:00:00 +0800')
      done()
    })
  })

  it('has filter date_to_string', function(done) {
    liquid('{{ date | date_to_string }}', {
      date: new Date(2014, 0, 12)
    }).done(function(res) {
      res.should.equal('12 Jan 2014')
      done()
    })
  })

  it('has filter date_to_long_string', function(done) {
    liquid('{{ date | date_to_long_string }}', {
      date: new Date(2014, 0, 12)
    }).done(function(res) {
      res.should.equal('12 January 2014')
      done()
    })
  })

  it('has filter array_to_sentence_string', function(done) {
    liquid('{{ tags | array_to_sentence_string }}', {
      tags: [ 'life', 'rails', 'conf' ]
    }).done(function(res) {
      res.should.equal('life, rails, and conf')
      done()
    })
  })

  it('has filter markdownify', function(done) {
    liquid('{{ excerpt | markdownify }}', {
      excerpt: '## Excerpt'
    }).done(function(res) {
      res.should.contain('<h2 id="excerpt">Excerpt</h2>')
      done()
    })
  })

  it('has filter jsonify', function(done) {
    liquid('{{ data | jsonify }}', {
      data: { foo: 'bar' }
    }).done(function(res) {
      res.should.equal('{"foo":"bar"}')
      done()
    })
  })

  it('has filter xml_escape', function(done) {
    liquid('{{ data | xml_escape }}', {
      data: 'How to go home? Taxi -> Train -> Taxi'
    }).done(function(res) {
      res.should.equal('How to go home? Taxi -&gt; Train -&gt; Taxi')
      done()
    })
  })

  it('has filter cgi_escape', function(done) {
    liquid('{{ data | cgi_escape }}', {
      data: 'http://google.com/foo?bar=at#anchor&title=My Blog & Your Blog'
    }).done(function(res) {
      res.should.equal('http%3A%2F%2Fgoogle.com%2Ffoo%3Fbar%3Dat%23anchor%26title%3DMy+Blog+%26+Your+Blog')
      done()
    })
  })

  it('has filter uri_escape', function(done) {
    liquid('{{ data | uri_escape }}', {
      data: 'http://google.com/foo?bar=at#anchor&title=My Blog & Your Blog'
    }).done(function(res) {
      res.should.equal('http://google.com/foo?bar=at%23anchor&title=My%20Blog%20&%20Your%20Blog')
      done()
    })
  })

})
