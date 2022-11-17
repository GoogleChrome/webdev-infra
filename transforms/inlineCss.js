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
const path = require('path');
const fg = require('fast-glob');

const PurgeCSS = require('purgecss').PurgeCSS;
const csso = require('csso');

const {pagesInlineCss} = require('../shortcodes/InlineCss');
const isTransformable = require('./utils/isTransformable');

class InlineCssTransform {
  constructor() {
    this.config = {};
    this.force = false;
    this.cssBasePath = '';
    this.css = new Map();
    this.js = '';
  }

  /**
   *
   * @param {{
   *   cssBasePath: string,
   *   jsPaths: string[],
   *   insert: function,
   *   force: boolean,
   * }} config
   * @returns
   */
  configure(config) {
    this.config = config || {};
    this.force = config.force === undefined ? false : config.force;
    // Initing is off-loaded as configuring eleventy is not allowed
    // to be async, though bootstrapping this transform involves
    // some async work (reading files, minifying CSS, ...)
    this.ready = this.init();
    return this.transform.bind(this);
  }

  /**
   * Performs all async init work, like reading all JS files upfront
   */
  init() {
    const work = [this._getJs()];
    return Promise.all(work);
  }

  /**
   * Parses <link rel=stylesheet> elements from the rendered output
   * tries to read the file linked in href from the local disk,
   * minifies it and stores it in a Map
   * @param {string} outputPath
   */
  async _getCss(outputPath) {
    const cssPaths = pagesInlineCss.get(outputPath);
    if (!cssPaths) {
      console.warn(
        '[InlineCssTransformer]',
        outputPath,
        'does not use any CSS?'
      );
      return '';
    }

    const usedCss = [];
    for (const cssPath of cssPaths) {
      let css = this.css.get(cssPath);
      if (css) {
        usedCss.push(css);
        continue;
      }

      const originalCss = await fs.readFile(
        path.join(this.config.cssBasePath, cssPath),
        {
          encoding: 'utf-8',
        }
      );
      css = csso.minify(originalCss).css;

      this.css.set(cssPath, css);
      usedCss.push(css);
    }

    return usedCss.join('');
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
        'The glob you passed to InlineCssTransformer to scan for JavaScript files did not match any files.'
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
        'The JavaScript passed to InlineCssTransformer is empty. Has it been built?'
      );
    }
  }

  /**
   *
   * @param {string} output
   * @param {string} outputPath
   * @returns
   */
  async transform(output, outputPath) {
    await this.ready;

    if (!this.force && !isTransformable(output, outputPath)) {
      return output;
    }

    const css = await this._getCss(outputPath);

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
          raw: css,
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

module.exports = {InlineCssTransform};
