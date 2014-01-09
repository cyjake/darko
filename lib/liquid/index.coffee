Q = require('q')
Liquid = require('liquid-node')
md = require('../markdown')


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

Liquid.Template.registerFilter
  date: (input, format) ->
    WEEKDAY_ABBRS = 'Sun Mon Tue Wed Thu Fri Sat'.split ' '
    WEEKDAYS = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split ' '
    MONTH_ABBRS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split ' '
    MONTHS = 'January Feburary March April May June July August September October November December'.split ' '

    pad = (str, chr, width) ->
      str = '' + str
      len = Math.max(0, width - str.length)
      Array(len).join(chr) + str

    # Liquid StandFilters:
    # > http://liquid.rubyforge.org/classes/Liquid/StandardFilters.html#M000012
    #
    # But there's more to implement:
    # > http://ruby-doc.org/stdlib-2.1.0/libdoc/date/rdoc/Date.html#method-i-strftime
    #
    return format.replace /%(\w+?)/g, (m, f) ->
      switch f
        when 'a' then WEEKDAY_ABBRS[input.getDay()]
        when 'A' then WEEKDAYS[input.getDay()]
        when 'b' then MONTN_ABBRS[input.getMonth()]
        when 'B' then MONTHS[input.getMonth()]
        # To be implemented 'd'
        when 'd' then pad(input.getDate(), '0', 2)
        when 'e' then input.getDate()
        when 'H' then pad(input.getHours(), '0', 2)
        when 'I' then pad(input.getHours() % 12, '0', 2)
        when 'j'
          days = (+input - (new Date(input.getFullYear(), 0, 1))) / 1000 / 60 / 60 / 24
          pad(days, '0', 3)
        when 'm' then pad(input.getMonth(), '0', 2)
        when 'M' then pad(input.getMinutes(), '0', 2)
        when 'p' then input.getHours() >= 12 ? 'PM' : 'AM'
        when 'S' then pad(input.getSeconds(), '0', 2)
        # To be implemented 'U' and 'W'
        when 'w' then input.getDay()
        # To be implemented 'x' and 'X'
        when 'y' then input.getFullYear() / 100
        when 'Y' then input.getFullYear()
        # To be implemented 'z'
        else f

  markdownify: (input) ->
    md(input)

module.exports = Liquid
