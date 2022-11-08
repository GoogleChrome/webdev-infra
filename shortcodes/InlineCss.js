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

// Stores arrays of file paths keyed by page output paths
// to be consumed by the CSS transformer
const pagesInlineCss = new Map();

/**
 * Adds a CSS file path to a map in production or inserts
 * a <link> element to that file during development
 * @this ShortcodeContext
 * @param {string} cssPath Path to a CSS file in dist
 */
function InlineCss(cssPath) {
  const css = pagesInlineCss.get(this.ctx.page.outputPath) || [];
  css.push(cssPath);
  pagesInlineCss.set(this.ctx.page.outputPath, css);

  // For non-production environments we never want to inline,
  // but link the CSS instead to enable hot-reloading et. al.
  if (process.env.NODE_ENV !== 'production') {
    return `<link rel="stylesheet" href=${cssPath}>`;
  }

  return '';
}

module.exports = {InlineCss, pagesInlineCss};
