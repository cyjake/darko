# Darko

A Node.js port of popular site generator Jekyll.

## Status

Works:

- darko build
- darko serve
- darko serve --watch

Will be working shortly, stay tuned:

- darko new

Liquid filters to be added:

- Well, most of Jekyll special filters are not implemented in Darko yet.
- See [this list](http://jekyllrb.com/docs/templates/).
- I've got markdownify working though, yay.

## Try

```bash
$ git clone git@github.com:dotnil/darko.git
$ cd darko ; npm link
$ z thx.github.io   # cd into a jekyll site.
$ darko serve
```

Now point your browser to <http://localhost:4100>.

## Why?

Jekyll is an awesome tool. It is the de facto static site generator for it
being the generator of github pages. I've been using it for long. Most of
my web sites are developed with Jekyll, such as:

- [Everything Jake](http://cyj.me)
- [THX](http://thx.github.io)
- [Brix Core](http://thx.github.io/brix-core)

But when I tried introducing this wonderful tool to my colleagues I was a bit
out of luck. Mac users were bothered by Ruby, Python, and Pygments installation.
Windows users encountered more issues, mostly encoding related.

Hence I create Darko to address those issues. It should:

- have less requirements, which makes it easier to install.
- works just like Jekyll, which makes the use of it transparent to servers that
  support Jekyll currently.

Windows 下安装、使用 Jekyll 诸多不便，尤其是不了解 Ruby 的同学。早前的版本还要人肉修补
[编码问题](http://stormtea123.github.io/convertible.av/)，在随 github-pages gem
中指定的 jekyll 版本中已经修复，但目前仍有如下不便：

- 需要安装 Ruby
- 需要安装 Python
- 需要安装 pygments

可以看到，有不少学习成本，为了写点文档竟然要装这么多东西，有点不好接受。

所以有了 Darko ，它有如下目标：

- 减少依赖，Node.js 就够了。
- 兼容 Jekyll ，对服务端透明，使用 Darko 开发的网站代码，推送到 gh-pages 效果不变。

### About the Name

The name of this project, Darko, is a tribute to one of my favorite movies
called [Donnie Darko](http://www.imdb.com/title/tt0246578/).

Darko 来自电影《[Donnie Darko](http://movie.douban.com/subject/1306662/)》，
我扮文艺青年的时候，喜欢说这是我最喜欢的电影，因为它够小众，剧情初看复杂实际简单，我的
英文名字就取自这部电影的主演 Jake Gyllenhaal。

我本想取名 Jekyll.js ，但是要做到 100% 与 Jekyll 保持一致太难了，而且对追求 100% 的人
来说，他们应该不介意直接用 Jekyll 本身。我搞定 80% 就好。
