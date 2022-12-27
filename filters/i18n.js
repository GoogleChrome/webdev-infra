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

const {Dictionary} = require('../i18n');

/** @type {{
 *   defaultLocale: string,
 *   dictPaths: string[],
 * }} */
const DEFAULT_CONFIG = {defaultLocale: 'en', dictPaths: []};

class i18nFilter {
  constructor() {
    this.config = DEFAULT_CONFIG;
    this.dictionary = new Dictionary();
  }

  /**
   *
   * @param config
   * @returns
   */
  configure(config = DEFAULT_CONFIG) {
    this.config = config;

    if (!this.config.defaultLocale) {
      throw new Error('[i18nFilter] No default locale given.');
    }

    if (!Array.isArray(this.config.dictPaths)) {
      throw new Error('[i18nFilter] No dictPaths given.');
    }

    for (const path of this.config.dictPaths) {
      this.dictionary.load(path);
    }

    return this.dictionary.get.bind(this.dictionary);
  }

  /**
   *
   * @param {string} keyPath The dotted JSON path in the i18n tree
   * @param {string} locale The target locale
   * @returns The translation if it exists.
   */
  filter(keyPath, locale) {
    return this.dictionary.get(keyPath, locale, this.config.defaultLocale);
  }
}

module.exports = {i18nFilter};
