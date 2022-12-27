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
const path = require('path');

const {i18nFilter} = require('../../../filters/i18n');

test.before(t => {
  const i18n = new i18nFilter().configure({
    defaultLocale: 'en',
    dictPaths: [path.join(__dirname, 'data')],
  });

  t.context = {
    i18n,
  };
});

test('built-in keys get translated to default language', async t => {
  t.assert(t.context.i18n('browser_compat.source', 'en') === 'Source');
});

test('existing keys get translated to default language', async t => {
  t.assert(t.context.i18n('test1.hello', 'en') === 'Hello');
});

test('existing keys get translated to another language', async t => {
  t.assert(t.context.i18n('test1.hello', 'de') === 'Hallo');
});

test('existing keys in sub-directories get translated to default language', async t => {
  t.assert(t.context.i18n('test2.world', 'en') === 'World');
});

test('existing keys in sub-directories get translated to another language', async t => {
  t.assert(t.context.i18n('test2.world', 'de') === 'Welt');
});

test('non-existing locales fail to get translated', async t => {
  t.throws(() => {
    t.context.i18n('test1.hello', 'es');
  });
});

test('non-existing keys fail to get translated', async t => {
  t.throws(() => {
    t.context.i18n('test3.non_existing', 'en');
  });
});
