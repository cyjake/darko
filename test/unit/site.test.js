'use strict'

const path = require('path')
const expect = require('expect.js')
const Site = require('../..').Site



describe('test/unit/site.test.js', function() {

  describe('basic site', function() {
    const cwd = path.resolve(__dirname, '../fixture/basic');
    let site;
    before(function() {
      site = new Site({ cwd: cwd });
      site.parse();
    });

    it('should set cwd and dest', function() {
      expect(site.cwd).to.equal(cwd);
      expect(site.dest).to.equal(path.resolve(cwd, '_site'));
    });

    it('should parse _config.yml', function() {
      expect(site.baseurl).to.be.a('string');
    });
  });

  describe('defaults', function() {
    const cwd = path.resolve(__dirname, '../fixture/defaults');
    let site;
    before(function() {
      site = new Site({ cwd: cwd });
      site.parse();
    });

    it('should hold default values from _config.yml', function() {
      expect(Array.isArray(site.defaults)).to.be(true);
      expect(site.defaults.length).to.be(2);
    });
  });
});
