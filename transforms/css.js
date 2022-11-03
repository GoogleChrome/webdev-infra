/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview The CSS pipeline used to minify and purge unused CSS
 * for both web.dev and developer.chrome.com, encapsulated in a transform
 * that can be added to 11ty
 */

const fs = require('fs/promises');
const fg = require('fast-glob');

const PurgeCSS = require('purgecss').PurgeCSS;
const csso = require('csso');

class CssTransform {
  constructor() {
    this.config = {};
    this.css = '';
    this.js = '';
  }

  /**
   *
   * @param {{
   *   cssPath: string,
   *   jsPaths: string[],
   *   insert: function,
   * }} config
   * @returns
   */
  configure(config) {
    this.config = config || {};
    // Initing is off-loaded as configuring eleventy is not allowed
    // to be async, though bootstrapping this transform involves
    // some async work (reading files, minifying CSS, ...)
    this.ready = this.init();
    return this.transform.bind(this);
  }

  /**
   * Performs all async init work, like reading and minifying the CSS
   * and reading all JS files upfront
   */
  init() {
    const work = [this._getCss(), this._getJs()];
    return Promise.all(work);
  }

  /**
   * Reads and minifies the CSS from the configured path
   */
  async _getCss() {
    const originalCss = await fs.readFile(this.config.cssPath, {
      encoding: 'utf-8',
    });

    if (!originalCss.length) {
      throw new Error(
        'The CSS passed to CssTransformer is empty. Has it already been built?'
      );
    }

    this.css = csso.minify(originalCss).css;
  }

  /**
   * Reads the contents of all files matched by a glob. As PurgeCSS
   * reads files new on every purge, this is meant to reduce fs calls
   * and by this improve build times
   * @returns A string containing all file contents
   */
  async _getJs() {
    let contents = [];
    const paths = await fg(this.config.jsPaths);

    if (!paths.length) {
      throw new Error(
        'The glob you passed to CssTransformer to scan for JavaScript files did not match any files.'
      );
    }

    for (const filePath of paths) {
      contents.push(
        fs.readFile(filePath, {
          encoding: 'utf-8',
        })
      );
    }

    contents = await Promise.all(contents);
    this.js = contents.join('');

    if (!this.js.length) {
      throw new Error(
        'The JavaScript passed to CssTransformer is empty. Has it been built?'
      );
    }
  }

  async transform(output, outputPath) {
    await this.ready;

    // For dynamic content (e.g. rendered via Eleventy Serverless),
    // outputPath is false. Also we want to skip files like XML,
    // JSON and others that might also be emitted by 11ty
    if (outputPath && !outputPath.endsWith('.html')) {
      return output;
    }

    // Empty pages or pages that use different styles than the
    // base CSS should also be skipped
    if (!output || /data-style-override/.test(output)) {
      return output;
    }

    const result = await new PurgeCSS().purge({
      content: [
        {
          raw: output,
          extension: 'html',
        },
        {
          raw: this.js,
          extension: 'js',
        },
      ],
      css: [
        {
          raw: this.css,
        },
      ],
      fontFace: true,
      defaultExtractor: content => {
        return content.match(/[A-Za-z0-9\\:_-]+/g) || [];
      },
    });

    return this.config.insert(output, result[0].css);
  }
}

module.exports = {CssTransform};
