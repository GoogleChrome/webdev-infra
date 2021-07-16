/*
 * Copyright 2021 Google LLC
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
 * @fileoverview A select for choosing language option.
 *
 * It uses the list of hreflangs in <link rel="alternate" hreflang="..."> tags
 * in the <head> to display only available language versions for
 * the current document.
 *
 * Optional attributes:
 * current - current language of the document. If not present, <html lang="">
 *   tag is used to determine the current language.
 * supported - comma-separated list of language codes the element should display
 * onChange - a callback for reacting to the language change
 *
 * Example usage:
 *
 * <language-select current="en" supported="en,ja" onChange="doSomething();"></language-select>
 */

import {html} from 'lit-element';
import {BaseElement} from './BaseElement';

/**
 * A map of supported language codes to their full names.
 * @const
 */
const languageNames = {
  en: 'English',
  pl: 'Polski',
  es: 'Español',
  ko: '한국어',
  zn: 'Chinese',
  ru: 'Rусский',
  pt: 'Português',
  ja: '日本語',
};

export class LanguageSelect extends BaseElement {
  static get properties() {
    return {
      current: {type: String}, // Current language of the document.
      supported: {type: String}, // Comma-separated list of language codes.
    };
  }

  constructor() {
    super();
    this.supported = Object.keys(languageNames).join(',') || '';
    this.supportedLanguages = [];
  }

  onChange() {
    // To be optionally implemented by an inheriting class.
  }

  connectedCallback() {
    super.connectedCallback();
    /* eslint-disable no-undef */
    this.current = document.documentElement.lang;
    this.supportedLanguages = this.supported.split(',');
  }

  renderOption(language) {
    let languageName = languageNames[language];
    if (!languageName) {
      return '';
    }
    languageName = languageName.toUpperCase();
    return this.current === language
      ? html`
          <option value="${language}" selected>
            ${languageName} (${language})
          </option>
        `
      : html`
          <option value="${language}">${languageName} (${language})</option>
        `;
  }

  render() {
    const languageVersions = Array.from(
      /* eslint-disable no-undef */
      document.querySelectorAll('link[rel="alternate"]')
    )
      .filter(link => link['hreflang'])
      .map(link => link['hreflang']);
    /* eslint-disable no-undef */
    const currentLang = document.documentElement.lang;
    const langList = this.supportedLanguages.filter(language => {
      return languageVersions.includes(language) || language === currentLang;
    });
    return html`
      <div class="language-select">
        <label class="w-visually-hidden" for="preferred-language">
          Choose language
        </label>
        <select id="preferred-language" @change="${this.onChange}">
          ${langList.map(language => this.renderOption(language))}
        </select>
      </div>
    `;
  }
}
