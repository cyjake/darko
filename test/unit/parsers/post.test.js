'use strict';

const { Site } = require('../../..');
const expect = require('expect.js');
const path = require('path');

describe('test/unit/parsers/post.test.js', function() {
  let site;
  before(function() {
    site = new Site({ cwd: path.resolve(__dirname, '../../fixture/basic') });
    site.parse();
  });

  describe('post.type', function() {
    it('should be "posts" for posts', function() {
      const post = site.posts.find(p => p.slug === 'ham');
      if (!post) throw new Error('Post "ham" not found');
      expect(post.type).to.equal('posts');
    });
  });

  describe('post.url', function() {
    it('should generate correct url for posts', function() {
      expect(site.posts).not.to.be.empty()

      const postLinks = site.posts.map(function(post) {
        return post.url
      })

      expect(postLinks).to.contain('/catus/ham.html')
      expect(postLinks).to.contain('/felis/egg.html')

      // _posts/baz should not be published because it has the published property
      // set to false in the YAML front mattter.
      expect(postLinks).to.not.contain('/baz.html')

      // _drafts/bad should not be published because it is in the drafts folder.
      expect(postLinks).to.not.contain('/bad.html')
    });
  });
});