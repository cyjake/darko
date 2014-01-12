Q = require('q')
Liquid = require('liquid-node')
md = require('../markdown')
highlight = require('../highlight')


# Tags and filters to be implemented: http://jekyllrb.com/docs/templates/

WEEKDAY_ABBRS = 'Sun Mon Tue Wed Thu Fri Sat'.split ' '
WEEKDAYS = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split ' '
MONTH_ABBRS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split ' '
MONTHS = 'January Feburary March April May June July August September October November December'.split ' '

formatDate = (input, format) ->
  return input unless input?

  pad = (str, chr, width) ->
    str = '' + str
    len = Math.max(0, width - str.length)
    Array(len + 1).join(chr) + str

  # Liquid StandFilters:
  # > http://liquid.rubyforge.org/classes/Liquid/StandardFilters.html#M000012
  #
  # But there's more to implement:
  # > http://ruby-doc.org/stdlib-2.1.0/libdoc/date/rdoc/Date.html#method-i-strftime
  #
  return format.replace /%([a-zA-Z])/g, (m, f) ->
    switch f
      when 'a' then WEEKDAY_ABBRS[input.getDay()]
      when 'A' then WEEKDAYS[input.getDay()]
      when 'b' then MONTH_ABBRS[input.getMonth()]
      when 'B' then MONTHS[input.getMonth()]
      # To be implemented 'd'
      when 'd' then pad(input.getDate(), '0', 2)
      when 'e' then input.getDate()
      when 'H' then pad(input.getHours(), '0', 2)
      when 'I' then pad(input.getHours() % 12, '0', 2)
      when 'j'
        days = (+input - (new Date(input.getFullYear(), 0, 1))) / 1000 / 60 / 60 / 24
        pad(days, '0', 3)
      when 'm' then pad(input.getMonth() + 1, '0', 2)
      when 'M' then pad(input.getMinutes(), '0', 2)
      when 'p' then input.getHours() >= 12 ? 'PM' : 'AM'
      when 'S' then pad(input.getSeconds(), '0', 2)
      # To be implemented 'U' and 'W'
      when 'w' then input.getDay()
      # To be implemented 'x' and 'X'
      when 'y' then input.getFullYear() / 100
      when 'Y' then input.getFullYear()
      when 'z'
        offset = -input.getTimezoneOffset() / 60
        prefix = if offset >= 0 then '+' else '-'
        prefix + pad(offset, '0', 2) + '00'
      else f

Liquid.Template.registerTag "block", do ->
  class BlockBlock extends Liquid.Block
    Syntax = /(\w+)/
    SyntaxHelp = "Syntax Error in 'block' - Valid syntax: block [templateName]"

    constructor: (tagName, markup, tokens, template) ->
      match = Syntax.exec(markup)
      throw new Liquid.SyntaxError(SyntaxHelp) unless match

      template.exportedBlocks or= {}
      template.exportedBlocks[match[1]] = @

      super

    replace: (block) ->
      @nodelist = block.nodelist

Liquid.Template.registerTag "highlight", do ->
  class HighlightBlock extends Liquid.Block
    render: (context) ->
      highlight.render(@nodelist.join('').trim(), @markup)

Liquid.Template.registerTag "extends", do ->
  class ExtendsTag extends Liquid.Tag
    Syntax = /([a-z0-9\/\\_-]+)/i
    SyntaxHelp = "Syntax Error in 'extends' - Valid syntax: extends [templateName]"

    constructor: (tagName, markup, tokens, template) ->
      match = Syntax.exec(markup)
      throw new Liquid.SyntaxError(SyntaxHelp) unless match

      template.extends = match[1]
      super

    render: (context) ->
      ""

Liquid.Template.registerTag "include", do ->
  class IncludeTag extends Liquid.Tag
    Syntax = /([a-z0-9\/\\_-]+)/i
    SyntaxHelp = "Syntax Error in 'include' - Valid syntax: include [templateName]"

    AssignSyntax = ///
      ((?:#{Liquid.VariableSignature.source})+)
      \s*=\s*
      ((?:#{Liquid.QuotedFragment.source}))
    ///

    constructor: (tagName, markup, tokens, template) ->
      match = Syntax.exec(markup)
      throw new Liquid.SyntaxError(SyntaxHelp) unless match

      @filepath = match[1]
      deferred = Q.defer()
      @included = deferred.promise

      match = AssignSyntax.exec(markup)
      if match
        @assignTo = match[1]
        @assignFrom = match[2]

      template.importer @filepath, (err, src) ->
        subTemplate = Liquid.Template.extParse src, template.importer
        subTemplate.then (t) -> deferred.resolve t

      super

    render: (context) ->
      include = {}

      include[@assignTo] = context.get(@assignFrom) if @assignTo
      context.lastScope().include = include

      @included.then (i) -> i.render context

Liquid.Template.registerFilter
  date: formatDate

  date_to_xmlschema: (input) ->
    # 2014-01-12T00:00:00+08:00
    formatDate(input, '%Y-%m-%dT%H:%M:%S%z').replace(/00$/, ':00')

  date_to_rfc822: (input) ->
    # Sun, 12 Jan 2014 00:00:00 +0800
    formatDate(input, '%a, %d %b %Y %H:%M:%S %z')

  date_to_string: (input) ->
    # 12 Jan 2014
    formatDate(input, '%d %b %Y')

  date_to_long_string: (input) ->
    # 12 January 2014
    formatDate(input, '%d %B %Y')

  # xml_escape

  # cgi_escape

  # uri_escape

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

Liquid.Template.extParse = (src, importer) ->
  baseTemplate = new Liquid.Template
  baseTemplate.importer = importer

  deferred = Q.defer()

  Q.fcall(() ->
    baseTemplate.parse src
  ).then(() ->
    return baseTemplate unless baseTemplate.extends

    deferred = Q.defer()
    stack = [baseTemplate]
    depth = 0

    walker = (tmpl, cb) ->
      return cb() unless tmpl.extends

      tmpl.importer tmpl.extends, (err, data) ->
        return cb err if err
        return cb "too many `extends`" if depth > 100
        depth++

        Liquid.Template.extParse(data, importer)
          .then((subTemplate) ->
            stack.unshift subTemplate
            walker subTemplate, cb
          )
          .fail((err) -> cb(err ? "Failed to parse template."))

    walker stack[0], (err) =>
      return deferred.reject err if err

      [rootTemplate, subTemplates...] = stack

      # Queries should find the block of the lowest,
      # most specific child.
      #
      # query   | root.a | c1.a | c2.a | result
      # ---------------------------------------
      # a       |        | "C1" |      | "C1"
      # a       | "ROOT" | "C1" | "C2" | "C2"
      #
      subTemplates.forEach (subTemplate) ->

        # blocks
        subTemplateBlocks = subTemplate.exportedBlocks or {}
        rootTemplateBlocks = rootTemplate.exportedBlocks or {}
        rootTemplateBlocks[k]?.replace(v) for own k, v of subTemplateBlocks

      deferred.resolve rootTemplate

    deferred.promise
  )

module.exports = Liquid
