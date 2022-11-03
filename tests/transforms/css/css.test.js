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

const test = require('ava').default;
const fs = require('fs');
const path = require('path');

const {CssTransform} = require('../../../transforms/css');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), {
  encoding: 'utf8',
});

test.beforeEach(t => {
  const transform = new CssTransform().configure({
    cssPath: path.join(__dirname, 'main.css'),
    jsPaths: [path.join(__dirname, 'bundle.*.js')],
    insert: (content, result) => {
      return content.replace('/* CSS */', result);
    },
  });

  t.context = {
    transform,
  };
});

test('css gets inserted', async t => {
  const result = await t.context.transform(html, 'tmp/index.html');

  t.assert(result.includes('color:red'));
});

test('css is minified', async t => {
  const result = await t.context.transform(html, 'tmp/index.html');

  t.assert(!result.includes('/** CSS comment **/'));
});

test('unused classes are purged', async t => {
  const result = await t.context.transform(html, 'tmp/index.html');

  t.assert(result.includes('.red'));
  t.assert(!result.includes('.blue'));
});

test('classes used by js are not purged', async t => {
  const result = await t.context.transform(html, 'tmp/index.html');
  console.log(result);

  t.assert(result.includes('js-blue'));
  t.assert(result.includes('js-red'));
});

test('non-html pages are skipped', async t => {
  const result = await t.context.transform(html, 'tmp/feed.xml');

  t.assert(result.includes('/* CSS */'));
});

test('pages marked with data-style-override are skipped', async t => {
  const result = await t.context.transform(
    html.replace('<html>', '<html data-style-override>'),
    'tmp/feed.xml'
  );

  t.assert(result.includes('/* CSS */'));
});
