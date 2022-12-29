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

const {Assert} = require('../../shortcodes/Assert');

test('runs silently if value is true', async t => {
  t.assert(Assert({value: true, error: 'error'}) === '');
});

test('throws if value is false', async t => {
  t.throws(() => {
    Assert({value: false, error: 'error'});
  });
});

test('throws with specified message if value is false', async t => {
  t.throws(
    () => {
      Assert({value: false, error: 'custom error'});
    },
    {message: 'custom error'}
  );
});
