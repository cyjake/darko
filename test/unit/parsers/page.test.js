'use strict';

const { Site } = require('../../..');
const expect = require('expect.js');
const path = require('path');

describe('test/unit/parsers/page.test.js', function() {
  let site;
  before(function() {
    site = new Site({ cwd: path.resolve(__dirname, '../../fixture/basic') });
    site.parse();
  });

  describe('page.url', function() {
    it('should generate correct url for pages', function() {
      expect(site.pages).not.to.be.empty()

      const pageLinks = site.pages.map(function(page) {
        return page.url
      })

      // index.md should be parsed as the homepage. That is, a page with its url
      // set to empty string because the /index.html part is removed.
      expect(pageLinks).to.contain('')

      // felis/index.md should be parse as a page with its url set to /felis
      expect(pageLinks).to.contain('/felis')
    });
  });
});