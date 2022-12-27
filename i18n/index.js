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

const fs = require('fs');
const path = require('path');

const fg = require('fast-glob');
const yaml = require('js-yaml');
const get = require('lodash.get');

class Dictionary {
  constructor() {
    this.data = {};

    this.load(path.join(__dirname, 'data'));
  }

  /**
   * Recursively walks a directory and creates an object out of the file tree.
   * For example: _data/i18n/foo/bar/baz.yml would produce:
   * {foo: {bar: baz: { ... }}}
   * @param {string} dir The directory to walk
   */
  load(dir) {
    const files = fg.sync(path.join(dir, '/**/*.{yml,yaml}'));
    const entries = {};

    for (const file of files) {
      const ext = path.extname(file);
      const name = path.basename(file, ext);
      entries[name] = yaml.load(fs.readFileSync(file, 'utf-8'));
    }

    Object.assign(this.data, entries);
  }

  /**
   * Gets a value out of a nested object using JSON path notation
   * @param {string} keyPath For example: browserCompat.unsupported
   * @param {string} locale The requested locale
   * @param {string} defaultLocale A fallback, if there is no translation for locale
   *
   */
  get(keyPath, locale, defaultLocale) {
    try {
      const out =
        get(this.data, keyPath)[locale] ??
        get(this.data, keyPath)[defaultLocale];
      if (out !== undefined) {
        return out;
      }
    } catch (err) {
      // Ignore potential key and index errors, throw below
    }
    throw new Error(`Could not find i18n result for: ${keyPath}`);
  }
}

module.exports = {
  Dictionary,
};
