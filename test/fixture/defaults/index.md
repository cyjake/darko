hunter x hunter

<ul>
{% for page in site.pages %}
  <li><a href="{{ page.url }}">{{ page.title }}</a></li>
{% endfor %}
</ul>