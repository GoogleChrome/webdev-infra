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
 * @fileoverview Transformer to minify HTML generated
 * from templates by 11ty
 */

const swcMinifier = require('@swc/html');

const isTransformable = require('./utils/isTransformable');

class MinifyHtmlTransform {
  constructor() {
    this.config = {};
    this.force = false;
  }

  /**
   *
   * @param {{
   *   swcOptions: import("@swc/html").Options,
   *   force: boolean,
   * }} config
   * @returns
   */
  configure(config) {
    this.config = config || {};
    this.force = config.force === undefined ? false : config.force;

    return this.transform.bind(this);
  }

  /**
   *
   * @param {string} output
   * @param {string} outputPath
   * @returns
   */
  async transform(output, outputPath) {
    if (!this.force && !isTransformable(output, outputPath)) {
      return output;
    }

    try {
      const result = await swcMinifier.minify(Buffer.from(output), {
        collapseWhitespaces: 'smart',
        removeEmptyMetadataElements: true,
        removeComments: true,
        preserveComments: [],
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        collapseBooleanAttributes: true,
        normalizeAttributes: true,
        minifyJs: true,
        minifyCss: true,
        sortAttributes: true,
        tagOmission: false,
        selfClosingVoidElements: true,
      });
      return result.code;
    } catch (err) {
      console.error(
        '[MinifyHtmlTransform]',
        outputPath,
        'could not be minified'
      );
    }

    return output;
  }
}

module.exports = {MinifyHtmlTransform};
