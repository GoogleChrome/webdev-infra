/*
 * Copyright 2020 Google LLC
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

const crypto = require('crypto');

function rewriteIds(suffix, raw) {
  return (
    raw
      // Replace id="bar"
      .replace(/\bid="(.+?)"/g, (_, id) => {
        return `id="${id}${suffix}"`;
      })

      // Replace href="#bar" (this will also work on xlink:href=...)
      .replace(/\bhref="#(.+?)"/g, (_, id) => {
        return `href="#${id}${suffix}"`;
      })

      // Replace url(#bar)
      .replace(/\burl\(#(.+?)\)/g, (_, id) => {
        return `url(#${id}${suffix})`;
      })
  );
}

/**
 * This rewrites SVGs so we can safely inline them into our pages, as well as
 * adding an optional className.
 *
 * The basic issue is that SVGs use "#foo" references for clip-paths and so on,
 * however, when inlined these become global. We rewrite all IDs so they're
 * unique.
 *
 * @param {string} raw
 * @param {{ label?: string, hidden?: boolean, className?: string, id?: string }} options
 * @returns {string}
 */
const updateSvgForInclude = (raw, options = {}) => {
  if (!raw) {
    return '';
  }

  // Hash the raw SVG and use part of as suffix for IDs inside the SVG
  // to avoid clashes between different inlined SVGs
  const hash = crypto.createHash('md5').update(raw).digest('hex');
  const suffix = hash.substring(0, 10);

  let svg = rewriteIds(suffix, raw);

  const {label, hidden, className, id} = options;

  if (hidden) {
    svg = svg.replace('<svg', '<svg aria-hidden="true"');
  } else if (label) {
    svg = svg.replace('<svg', `<svg role="img" aria-label="${label}"`);
  } else {
    throw new Error(`SVGs must provide a label or set hidden to true.
    If you're using icon() or svg() you may have forgotten the label argument.
    A good label should be action focused: e.g. 'Search' instead of 'Magnifying glass'.
    ${raw}`);
  }

  if (className) {
    svg = svg.replace('<svg', `<svg class="${className}"`);
  }

  // Gives the SVG itself a valid ID. We do this last so that it's not made unique above.
  // Earlier IDs win over later ones, so if the raw file had another ID, it's ignored now.
  if (id) {
    svg = svg.replace('<svg', `<svg id="${id}"`);
  }

  return svg;
};

module.exports = {updateSvgForInclude, rewriteIds};
