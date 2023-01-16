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

const browserCompat = require('../../utils/browserCompat');

test.beforeEach(async t => {
  const data = await browserCompat();
  delete data.browsers;

  t.context = {
    data,
  };
});

test('every entry has a support value', async t => {
  for (const value of Object.values(t.context.data)) {
    t.assert(value.support);
  }
});

test('includes a nested entry', async t => {
  t.assert(t.context.data['api.EventTarget.EventTarget']);
});

test('includes an entry with dashes', async t => {
  t.assert(t.context.data['css.properties.-webkit-border-before']);
});
