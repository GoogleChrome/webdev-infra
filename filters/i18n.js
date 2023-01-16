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

const {i18nDictionary} = require('../utils/i18nDictionary');

class I18nFilter {
  /**
   *
   * @param {{
   *   defaultLocale: string,
   *   dictPaths?: string[],
   * }} config
   * @returns
   */
  configure(config) {
    if (!config.defaultLocale) {
      throw new Error('[i18nFilter] No default locale given.');
    }

    this.defaultLocale = config.defaultLocale;

    if (Array.isArray(config.dictPaths)) {
      for (const path of config.dictPaths) {
        i18nDictionary.loadEntries(path);
      }
    }

    return this.filter.bind(this);
  }

  /**
   *
   * @param {string} keyPath The dotted JSON path in the i18n tree
   * @param {string} locale The target locale
   * @returns The translation if it exists.
   */
  filter(keyPath, locale) {
    if (this.defaultLocale) {
      return i18nDictionary.get(keyPath, locale, this.defaultLocale);
    }
  }
}

module.exports = {I18nFilter};
