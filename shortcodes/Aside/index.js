/* global __basedir */

/*
 * Copyright 2023 Google LLC
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

const {html} = require('common-tags');
const fs = require('fs');
// We need html: true since folks embed HTML inside of {% Aside %}.
// See https://markdown-it.github.io/markdown-it/#MarkdownIt.new
const md = require('markdown-it')({html: true});
const path = require('path');
const {I18nFilter} = require('../../filters/i18n');

const DEFAULT_LOCALE = 'en';

// If an icon is required, it grabs the SVG source with fs
// because in a shortcode, we have no access to includes etc
const getIcon = (icon) => {
  if (!icon.length) {
    return '';
  }

  return fs.readFileSync(
      path.join(__dirname, 'icons', icon),
      'utf8',
  );
};

const i18n = new I18nFilter().configure({
  defaultLocale: DEFAULT_LOCALE,
  dictPaths: [path.join(__dirname, '..', '_data', 'i18n')],
});

/**
 * @this {EleventyPage}
 */
function Aside(content, type = 'note') {
  const locale = this.ctx.locale;

  // These two get populated based on type
  let title = '';
  let icon = '';

  // Generate all the configurations per aside type
  switch (type) {
    case 'caution':
      icon = 'error.svg';
      title = i18n(`i18n.aside.${type}`, locale);
      break;

    case 'warning':
      icon = 'warning.svg';
      title = i18n(`i18n.aside.${type}`, locale);
      break;

    case 'success':
      icon = 'done.svg';
      title = i18n(`i18n.aside.${type}`, locale);
      break;

    case 'objective':
      icon = 'done.svg';
      title = i18n(`i18n.aside.${type}`, locale);
      break;

    case 'gotchas':
      icon = 'lightbulb.svg';
      title = i18n(`i18n.aside.gotchas`, locale);
      break;

    case 'important':
      icon = 'lightbulb.svg';
      title = i18n(`i18n.aside.important`, locale);
      break;

    case 'key-term':
      icon = 'highlighter.svg';
      title = i18n(`i18n.aside.key_term`, locale);
      break;

    case 'codelab':
      icon = 'code.svg';
      title = i18n(`i18n.aside.try_it`, locale);
      break;

    case 'celebration':
      icon = 'celebration.svg';
      title = i18n(`i18n.aside.${type}`, locale);
      break;

    case 'update':
      icon = 'update.svg';
      title = i18n(`i18n.aside.${type}`, locale);
      break;

    case 'tip':
      icon = 'lightbulb.svg';
      title = i18n(`i18n.aside.${type}`, locale);
      break;
  }

  // Make sure that we don't insert multiple newlines when this component is
  // used, as it can break the parent Markdown rendering.
  // See https://github.com/GoogleChrome/web.dev/issues/7640
  const renderedContent = md.renderInline(content);
  const titleHTML = title.length
      ? `<p class="cluster">
      <span class="aside__icon box-block">${getIcon(icon)}</span>
      <strong>${title}</strong></p>`
      : '';
  const asideHTML =
      `<aside class="aside aside--${type} flow">
      ${titleHTML}
      <div class="flow">${renderedContent}</div></aside>`;

  return html`${asideHTML}`;
}

module.exports = Aside;
