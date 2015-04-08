Promise = require('bluebird')
Liquid = require('liquid-node')

md = require('../markdown')
highlight = require('../highlight')


# Tags and filters to be implemented: http://jekyllrb.com/docs/templates/
engine = new Liquid.Engine

engine.registerTag "highlight", do ->
  class HighlightBlock extends Liquid.Block
    render: (context) ->
      highlight.render(@nodelist.join('').trim(), @markup)

engine.registerTag "post_url", do ->
  class PostUrl extends Liquid.Tag
    constructor: (template, tagName, markup) ->
      @postPath = markup.trim()
      super

    render: (context) ->
      for post in engine.site.posts
        if post.path.split('_posts/').pop().replace(/\.\w+/, '') == @postPath
          return post.url

# The custom filters added by Jekyll
engine.registerFilters
  date_to_xmlschema: (input) ->
    # 2014-01-12T00:00:00+08:00
    @date(input, '%Y-%m-%dT%H:%M:%S%z').replace(/00$/, ':00')

  date_to_rfc822: (input) ->
    # Sun, 12 Jan 2014 00:00:00 +0800
    @date(input, '%a, %d %b %Y %H:%M:%S %z')

  date_to_string: (input) ->
    # 12 Jan 2014
    @date(input, '%d %b %Y')

  date_to_long_string: (input) ->
    # 12 January 2014
    @date(input, '%d %B %Y')

  xml_escape: (input) ->
    return input unless input?

    input.replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')


  # http://stackoverflow.com/questions/2824126/whats-the-difference-between-uri-escape-and-cgi-escape
  # What's the difference between cgi_escape and uri_escape?
  # The latter, URI.escape, is deprecated in Ruby.
  #
  # encodeURICompnent gives the closest match of the result of CGI.escape,
  # except that encodeURIComponent uses %20 to escape space but CGI.espace use
  # the + character.
  cgi_escape: (input) ->
    input or= ''
    encodeURIComponent(input).replace(/%20/g, '+')

  # same thing happens in encodeURI and URI.escape. URI.escape escapes # into
  # %23 but encodeURI ignores it.
  uri_escape: (input) ->
    input or= ''
    encodeURI(input).replace(/#/g, '%23')

  # number_of_words

  array_to_sentence_string: (input) ->
    res = ''

    for item, i in input
      if (i + 1 == input.length)
        res += 'and ' + item
      else
        res += '' + item + ', '

    res

  # should we support textilize?

  markdownify: (input) ->
    md(input)

  jsonify: (input) ->
    JSON.stringify(input)


module.exports = engine
