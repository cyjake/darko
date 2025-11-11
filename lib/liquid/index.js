'use strict'

const Liquid = require('liquid')

const md = require('../markdown')
const highlight = require('../highlight')

const engine = new Liquid.Engine()

engine.registerTag('highlight', class HighlightBlock extends Liquid.Block {
  render(context) {
    return highlight.render(this.nodelist.join('').trim(), this.markup)
  }
})

engine.registerTag('post_url', class PostUrl extends Liquid.Tag {
  constructor(template, tagName, markup) {
    super(template, tagName, markup)
    this.postPath = markup.trim()
  }

  render(context) {
    for (const post of engine.site.posts) {
      if (post.path.split('_posts/').pop().replace(/\.\w+/, '') === this.postPath) {
        return post.url
      }
    }
  }
})

engine.registerTag('link', class LinkTag extends Liquid.Tag {
  constructor(template, tagName, markup) {
    super(template, tagName, markup)
    this.linkPath = markup.trim()
  }

  render(context) {
    for (const page of [...engine.site.pages, ...engine.site.posts]) {
      if (page.path === this.linkPath) {
        return page.url
      }
    }
  }
})

engine.registerTag('feed_meta', class FeedMetaTag extends Liquid.Tag {
  constructor(template, tagName) {
    super(template, tagName)
    this.markup = '<link type="application/atom+xml" rel="alternate" title="{{ title }}" href="{{ url }}" />';
  }

  async render(context) {
    const site = engine.site;
    const subTemplate = await this.template.engine.parse(this.markup);
    return subTemplate.render({
      title: site.config.title,
      url: new URL(site.feed.path, site.url).toString(),
    });
  }
})

engine.registerFilters({
  date_to_xmlschema(input) {
    return this.date(input, '%Y-%m-%dT%H:%M:%S%z').replace(/00$/, ':00')
  },

  date_to_rfc822(input) {
    return this.date(input, '%a, %d %b %Y %H:%M:%S %z')
  },

  date_to_string(input) {
    return this.date(input, '%d %b %Y')
  },

  date_to_long_string(input) {
    return this.date(input, '%d %B %Y')
  },

  xml_escape(input) {
    if (input == null) {
      return input
    }
    return input.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  },

  cgi_escape(input) {
    input || (input = '')
    return encodeURIComponent(input).replace(/%20/g, '+')
  },

  uri_escape(input) {
    input || (input = '')
    return encodeURI(input).replace(/#/g, '%23')
  },

  array_to_sentence_string(input) {
    return `${input.slice(0, -1).join(', ')}, and ${input[input.length - 1]}`
  },

  markdownify(input) {
    return md(input)
  },

  jsonify(input) {
    return JSON.stringify(input)
  }
})

module.exports = engine

