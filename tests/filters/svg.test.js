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

const test = require('ava');

const {rewriteIds} = require('../../filters/svg.js');

const TEST_SVG_A = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="25" cy="25" r="25" id="a"/>
</svg>`;

const TEST_SVG_B = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="url(#b)"/>
  <defs>
    <linearGradient id="b" x1="16" y1="73" x2="80" y2="9" gradientUnits="userSpaceOnUse">
      <stop stop-color="#188038" />
      <stop offset="1" stop-color="#188038" stop-opacity="0" />
    </linearGradient>
  </defs>
</svg>`;

const TEST_SVG_C = `<svg viewBox="0 0 30 10" xmlns="http://www.w3.org/2000/svg">
  <circle id="c" cx="5" cy="5" r="4" />
  <use href="#c" x="10" fill="blue" />
</svg>`;

test('element ids get suffix appended', async t => {
  const result = rewriteIds('_suffix', TEST_SVG_A);
  t.assert(
    result ===
      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="25" cy="25" r="25" id="a_suffix"/>
</svg>`
  );
});

test('element ids get suffix appended and url() styles get updated', async t => {
  const result = rewriteIds('_suffix', TEST_SVG_B);
  t.assert(
    result ===
      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="url(#b_suffix)"/>
  <defs>
    <linearGradient id="b_suffix" x1="16" y1="73" x2="80" y2="9" gradientUnits="userSpaceOnUse">
      <stop stop-color="#188038" />
      <stop offset="1" stop-color="#188038" stop-opacity="0" />
    </linearGradient>
  </defs>
</svg>`
  );
});

test('element ids get suffix appended and href gets updated', async t => {
  const result = rewriteIds('_suffix', TEST_SVG_C);
  t.assert(
    result ===
      `<svg viewBox="0 0 30 10" xmlns="http://www.w3.org/2000/svg">
  <circle id="c_suffix" cx="5" cy="5" r="4" />
  <use href="#c_suffix" x="10" fill="blue" />
</svg>`
  );
});
