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

const PurgeCSS = require('purgecss').PurgeCSS;

/**
 * The functionality to purge unused CSS from the markup isolated
 * as a standalone function to also be usuable in a stateless worker
 * @param {{
 *  html: string,
 *  css: string,
 *  js: string,
 * }} payload The stringified assets making up a page
 * @returns
 */
async function purgeCss(payload) {
  const {html, css, js} = payload;

  const result = await new PurgeCSS().purge({
    content: [
      {
        raw: html,
        extension: 'html',
      },
      {
        raw: js,
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

  return result[0].css;
}

module.exports = purgeCss;
