0.3.4 / 2015-04-17
==================

 * Fix `Content-Type` of `.html`
 * Turn on `--watch` by default
 * Append `site.baseurl` onto the server logged in console


0.3.3 / 2015-04-13
==================

 * Fix yaml front matter parsing.


0.3.2 / 2015-04-09
==================

 * Specify license in package.json


0.3.1 / 2015-04-08
==================

 * Bumped patch version to publish the real 0.3.0
 * The version 0.3.0 was unpublished accidentally


0.3.0 / 2015-04-08
==================

 * Re-implement `--watch` with chokidar
 * Add `post.previous` and `post.next`
 * Add `post_url`
 * Remove unnecessary engine methods, embrace FileSystem api
 * Fix log color


0.2.2 / 2015-03-24
==================

 * Fix `page.url` to support both `/felis/index.html` and `/felis/foo.html`


0.2.1 / 2015-01-22
==================

 * Remove homebrewed date filter
 * Update liquid-node to `1.0.x`
 * Change default port to 4000, the same as Jekyll
 * Fix `darko-serve --watch` error on Windows


0.2.0 / 2014-06-21
==================

 * Update liquid-node to `0.3.x`


0.1.2 / 2014-05-20
==================

 * Fix `include`
 * Fix date in YAML front matter
 * Support date formatted like `2014-5-20`


0.1.1 / 2014-04-11
==================

 * Tribute to liquid-node, update it to `0.2.0`
 * Switch from Q to bluebird


0.1.0 / 2014-01-19
==================

 * Fix excerpt extraction bug
 * Add _layouts, _includes, _data changes detection
 * Change from js-yaml to yaml-js, for less dependencies
 * Fix site.baseurl related issue


0.0.2 / 2014-01-16
==================

 * Fix bugs under Windows, mostly `path.sep` related
 * Add tribute to @lepture and @visionmedia
 * Add liquid specific filters, namely xml_escape, uri_escape, and cgi_escape


0.0.1 / 2014-01-12
==================

 * Support liquid specific filters
 * Add highlight tag
 * --watch
 * --drafts
 * --verbose
 * serve
 * build
