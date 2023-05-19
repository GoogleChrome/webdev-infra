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

/**
 * @fileoverview A class that makes translations, maintained in distinct,
 * feature scoped YAML files, available via simple JSON path notation, so
 * a string that is maintained in a file called _data/i18n/foo/bar/baz.yml
 * can be translated by calling: dictionary.get('foo.bar.baz', 'de')
 */

const fs = require('fs');
const path = require('path');

const fg = require('fast-glob');
const yaml = require('js-yaml');
const get = require('lodash.get');
const set = require('lodash.set');

const DEFAULT_PATH = path.join(__dirname, '../data/i18n');

class I18nDictionary {
  constructor(defaultPath = DEFAULT_PATH) {
    this.data = {};

    if (defaultPath) {
      this.loadEntries(path.join(defaultPath));
    }
  }

  /**
   * Recursively reads YAML files from a directory and creates a
   * nested object out of the file tree, including the file contents
   * For example: _data/i18n/foo/bar/baz.yml would produce:
   * {foo: {bar: baz: { <baz.yml contents> }}}
   *
   * Can be called multiple times to load translations from various
   * sources. The latest call overwrites potentially existing keys.
   *
   * @param {string} dir The directory to walk
   */
  loadEntries(dir) {
    // I am a test. Remove me.
    const files = fg.sync(path.join(dir, '/**/*.{yml,yaml}'));

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
      set(this.data, keyPath, yaml.load(fs.readFileSync(file, 'utf-8')));
    }
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

const i18nDictionary = new I18nDictionary();

module.exports = {
  I18nDictionary,
  i18nDictionary,
  i18n: (keyPath, locale, defaultLocale = 'en') => {
    return i18nDictionary.get(keyPath, locale, defaultLocale);
  },
};
