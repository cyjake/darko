'use strict';

const { Site, util } = require('../../..');
const expect = require('expect.js');
const { existsSync: exists } = require('fs');
const path = require('path');

describe('test/unit/writers/templated.test.js', function() {
  let site;
  before(async function() {
    site = new Site({ cwd: path.resolve(__dirname, '../../fixture/basic') });
    site.parse();
    await site.write();
    util.log('Generating', '... done');
  });

  describe('site.dest', function() {
    it('should create destination folder', function() {
      expect(exists(site.dest)).to.be.ok();
    });
  });

  describe('site.posts', function() {
    it('should write posts', function() {
      const post = site.posts.find(p => p.slug === 'ham');
      if (!post) throw new Error('Post "ham" not found');
      expect(exists(post.dest)).to.be.ok();
    });
  });
});