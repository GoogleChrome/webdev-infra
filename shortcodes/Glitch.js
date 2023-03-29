/*
 * Copyright 2023 Google LLC
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

const {html} = require('common-tags');
const IFrame = require('./IFrame');

const DEFAULT_ALLOW = [
  'camera',
  'clipboard-read',
  'clipboard-write',
  'encrypted-media',
  'geolocation',
  'microphone',
  'midi',
];

/**
 * Validates allow sources are an array and lower case.
 * If allow sources are a string, it will be split by the `;` character.
 *
 * @param {string|string[]} s
 * @returns {string[]}
 */
function expandAllowSource(s) {
  if (typeof s === 'string') {
    s = s.split(/;\s*/g);
  }
  return s.map(a => a.toLowerCase());
}

/**
 * Generates HTML for a Glitch embed as a string.
 *
 * @param {string|GlitchParam} param
 * @return {string}
 */
module.exports = param => {
  /** @type GlitchParam */
  let glitchProps = {
    allow: [],
    height: 420,
    id: '',
    path: '',
    highlights: '',
    previewSize: 100,
  };

  if (typeof param === 'string') {
    glitchProps.id = param;
  } else if (param.constructor === {}.constructor) {
    glitchProps = {...glitchProps, ...param};
  }

  if (!glitchProps.id) {
    throw new Error('No `id` provided to Glitch shortcode.');
  }

  const url = new URL(`https://glitch.com/embed/#!/embed/${glitchProps.id}`);
  const searchParams = new URLSearchParams();
  searchParams.set('attributionHidden', 'true');
  searchParams.set('sidebarCollapsed', 'true');

  if (glitchProps.path) {
    searchParams.set('path', glitchProps.path);
  }
  if (glitchProps.highlights) {
    searchParams.set('highlights', glitchProps.highlights);
  }
  if (typeof glitchProps.previewSize === 'number') {
    searchParams.set('previewSize', String(glitchProps.previewSize));
  }

  let allow = Array.from(new Set([...DEFAULT_ALLOW])).join('; ');
  if (glitchProps.allow) {
    allow = Array.from(
      new Set([...DEFAULT_ALLOW, ...expandAllowSource(glitchProps.allow)])
    ).join('; ');
  }

  const src = `${url.toString()}?${searchParams.toString()}`;

  return html`
    <div
      class="glitch-embed-wrap"
      style="height: ${glitchProps.height}px; width: 100%;"
    >
      ${IFrame({src, title: `${glitchProps.id} on Glitch`, allow})}
    </div>
  `.replace(/\s\s+/g, ' ');
};
