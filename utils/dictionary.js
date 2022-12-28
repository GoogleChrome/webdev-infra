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
const set = require('lodash.set');

class Dictionary {
  constructor() {
    this.data = {};

    this.load(path.join(__dirname, '../data/i18n'));
  }

  /**
   * Recursively reads YAML files from a directory and creates a
   * nested object out of the file tree, including the file contents
   * For example: _data/i18n/foo/bar/baz.yml would produce:
   * {foo: {bar: baz: { <baz.yml contents> }}}
   * @param {string} dir The directory to walk
   */
  load(dir) {
    const files = fg.sync(path.join(dir, '/**/*.{yml,yaml}'));
    const entries = {};

    const baseDir = path.dirname(dir);
    for (const file of files) {
      const dir = path.dirname(file);
      const ext = path.extname(file);
      const name = path.basename(file, ext);

      // The dir is an absolute path that needs to be transformed in
      // a key path that can be used to set a value in a nested object
      const keyPath = `${dir
        .replace(baseDir, '')
        .slice(1)
        .split('/')
        .join('.')}.${name}`;
      set(entries, keyPath, yaml.load(fs.readFileSync(file, 'utf-8')));
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
  get(keyPath, locale, defaultLocale = 'en') {
    const value = get(this.data, keyPath);
    if (!value) {
      throw new Error(`No translations for: ${keyPath}`);
    }

    if (value[locale]) {
      return value[locale];
    }

    if (value[defaultLocale]) {
      return value[defaultLocale];
    }

    throw new Error(`No default translation for: ${keyPath}`);
  }
}

const dictionary = new Dictionary();

module.exports = {
  Dictionary,
  dictionary,
  i18n: (keyPath, locale, defaultLocale = 'en') => {
    return dictionary.get(keyPath, locale, defaultLocale);
  },
};
