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

// We use an incrementing count of SVG to ensure unique IDs. We could also hash
// the contents as duplicate SVGs share styles, but this is easier.
let svgIndex = 0;

/**
 * This rewrites SVGs so we can safely inline them into our pages, as well as
 * adding an optional className.
 *
 * The basic issue is that SVGs use "#foo" references for clip-paths and so on,
 * however, when inlined these become global. We rewrite all IDs so they're
 * unique.
 *
 * @param {string} raw
 * @param {string} className
 * @returns {string}
 */
const updateSvgForInclude = (raw, options = {label: '', hidden: false, className: ''}) => {
  if (!raw) {
    return '';
  }

  let {label, hidden, className} = options;

  if (hidden) {
    raw = raw.replace('<svg', `<svg aria-hidden="true"`);
  } else if (label) {
    raw = raw.replace('<svg', `<svg role="img" aria-label="${label}"`)
  } else {
    throw new Error(`SVGs must provide a label or set hidden to true.
    If you're using icon() or svg() you may have forgotten the label argument.
    A good label should be action focused: e.g. "Search" instead of "Magnifying glass".
    ${raw}`);
  }

  const localIndex = ++svgIndex;
  const suffix = '_' + localIndex.toString(36);

  if (className) {
    raw = raw.replace('<svg', `<svg class="${className}"`);
  }

  // Replace id="bar"
  raw = raw.replace(/\bid="(.+?)"/g, (_, id) => {
    return `id="${id}${suffix}"`;
  });

  // Replace href="#bar" (this will also work on xlink:href=...)
  raw = raw.replace(/\bhref="#(.+?)"/g, (_, id) => {
    return `href="#${id}${suffix}"`;
  });

  // Replace url(#bar)
  raw = raw.replace(/\burl\(#(.+?)\)/g, (_, id) => {
    return `url(#${id}${suffix})`;
  });

  return raw;
};

module.exports = {updateSvgForInclude};
