'use strict'

var expect = require('expect.js')
var engine = require('..').Liquid


function liquid(tpl, data) {
  return engine.parseAndRender(tpl, data)
}

describe('Liquid', function() {
  const timezoneOffset = new Date().getTimezoneOffset();
  const timezone = [
    timezoneOffset > 0 ? '-' : '+',
    String(Math.abs(Math.floor(timezoneOffset / 60))).padStart(2, '0'),
    ':',
    String(Math.abs(timezoneOffset % 60)).padStart(2, '0')
  ].join('');

  it('has filter date_to_xmlschema', async function() {
    const result = await liquid('{{ date | date_to_xmlschema }}', {
      date: new Date(2014, 0, 12)
    });
    expect(result).to.equal(`2014-01-12T00:00:00${timezone}`);
  });

  it('has filter date_to_rfc822', async function() {
    const result = await liquid('{{ date | date_to_rfc822 }}', {
      date: new Date(2014, 0, 12)
    });
    expect(result).to.equal(`Sun, 12 Jan 2014 00:00:00 ${timezone.replace(':', '')}`);
  });

  it('has filter date_to_string', async function() {
    const result = await liquid('{{ date | date_to_string }}', {
      date: new Date(2014, 0, 12)
    });
    expect(result).to.equal('12 Jan 2014');
  });

  it('has filter date_to_long_string', async function() {
    const result = await liquid('{{ date | date_to_long_string }}', {
      date: new Date(2014, 0, 12)
    });
    expect(result).to.equal('12 January 2014')
  })

  it('has filter array_to_sentence_string', async function() {
    const result = await liquid('{{ tags | array_to_sentence_string }}', {
      tags: [ 'life', 'rails', 'conf' ]
    })
    expect(result).to.equal('life, rails, and conf');
  })

  it('has filter markdownify', async function() {
    const result = await liquid('{{ excerpt | markdownify }}', {
      excerpt: '## Excerpt'
    });
    expect(result).to.contain('<h2 id="excerpt">Excerpt</h2>');
  });

  it('has filter jsonify', async function() {
    const result = await liquid('{{ data | jsonify }}', {
      data: { foo: 'bar' }
    });
    expect(result).to.equal('{"foo":"bar"}');
  });

  it('has filter xml_escape', async function() {
    const result = await liquid('{{ data | xml_escape }}', {
      data: 'How to go home? Taxi -> Train -> Taxi'
    });
    expect(result).to.equal('How to go home? Taxi -&gt; Train -&gt; Taxi');
  });

  it('has filter cgi_escape', async function() {
    const result = await liquid('{{ data | cgi_escape }}', {
      data: 'http://google.com/foo?bar=at#anchor&title=My Blog & Your Blog'
    });
    expect(result).to.equal('http%3A%2F%2Fgoogle.com%2Ffoo%3Fbar%3Dat%23anchor%26title%3DMy+Blog+%26+Your+Blog');
  });

  it('has filter uri_escape', async function() {
    const result = await liquid('{{ data | uri_escape }}', {
      data: 'http://google.com/foo?bar=at#anchor&title=My Blog & Your Blog'
    });
    expect(result).to.equal('http://google.com/foo?bar=at%23anchor&title=My%20Blog%20&%20Your%20Blog');
  });
});
