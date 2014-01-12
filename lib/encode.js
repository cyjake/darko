exports.uri = function(text) {
  text = text.replace(/<\/?[^>]*>/g, '');
  var regex = /[^,\.<>\/\?;\:'"\[\]\{\}\\\|`~!@#\$%\^\&\*\(\)\_\+\=\s]+/g;
  var bits = text.match(regex);
  if (bits) {
    text = bits.join('-').toLowerCase();
  }
  text = text.replace(/-{2,}/g, '-');
  return text;
};