---
layout: post
title: Welcome!
---

Let's make a front page then just sit around and wait for profit!

<ul>
{% for category in site.categories %}{% if category[0] == 'catus' %}
{% for post in category[1] %}
  <li><a href="{{ post.url }}">{{ post.title }}</a></li>
{% endfor %}
{% endif %}{% endfor %}
</ul>
