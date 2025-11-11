'use strict';

const fs = require('fs').promises;
const path = require('path');
const sass = require('sass');
const { pathToFileURL } = require('url');
const debug = require('debug')('darko');

module.exports = async function writeSass(asset) {
  const { site } = asset;
  const fpath = path.join(site.cwd, asset.path);
  const dest = path.resolve(site.dest, site.baseurl.slice(1), asset.path.replace(/\.(scss|sass)$/, '.css'));

  debug('Processing SASS file ' + asset.path);

  await fs.mkdir(path.dirname(dest), { recursive: true });

  const source = await fs.readFile(fpath, site.encoding);
  const parts = source?.split('---');
  if (!parts || parts.length < 2) return;
  const result = await sass.compileStringAsync(parts.slice(2).join('---'), {
    importers: [{
      findFileUrl(url) {
        if (url.startsWith('.')) return null;
        return new URL(url, pathToFileURL(path.join(site.cwd, '_sass/') ));
      },
    }],
    syntax: path.extname(fpath).toLowerCase() === '.sass' ? 'indented' : 'scss',
    sourceMap: true,
    sourceMapIncludeSources: true,
    url: pathToFileURL(fpath),
  });
  await Promise.all([
    fs.writeFile(dest, result.css, 'utf-8'),
    fs.writeFile(dest + '.map', JSON.stringify(result.sourceMap), 'utf-8'),
  ]);

  debug('Written CSS file ' + asset.path.replace(/\.(scss|sass)$/, '.css'));
}
