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

// eslint-disable-next-line no-unused-vars
const mdnBcd = require('@mdn/browser-compat-data');
const Nunjucks = require('nunjucks');

const bcd = require('../utils/browserCompat');
const {i18n} = require('../utils/dictionary');

class BrowserCompat {
  /**
   * Configures the shortcode for use and returns the render
   * function that can be used by 11ty
   * @param {{
   *   browsers: string[],
   *   templatePath: string,
   *   eleventyConfig: any,
   * }} config
   * @returns
   */
  configure(config) {
    if (!config.templatePath) {
      throw new Error('[BrowserCompat shortcode] No valid template path given');
    }
    this.templatePath = config.templatePath;
    this.template = fs.readFileSync(this.templatePath, {encoding: 'utf-8'});

    if (!config.eleventyConfig) {
      throw new Error('[BrowserCompat shortcode] eleventyConfig required.');
    }

    this.eleventyConfig = config.eleventyConfig;
    this.eleventyConfig.on('eleventy.extensionmap', map => {
      this.extensionMap = map;
    });

    this.browsers = config.browsers || ['chrome', 'firefox', 'edge', 'safari'];
    this.data = bcd();

    const self = this;
    /**
     * The actual render function that is called by 11ty and
     * with 11ty's render context passed via this
     * @param {string} feature
     * @returns
     */
    const render = function (feature) {
      // @ts-ignore: `this` has type of `any`
      return self.render.bind(self)(this, feature);
    };

    return render;
  }

  /**
   * @param {mdnBcd.SimpleSupportStatement} support
   * @param {mdnBcd.StatusBlock | undefined} status
   * @returns {{aria: string, compatProperty: string, icon: string}}}
   */
  getInfoFromSupportStatement(support, status, locale) {
    if (status && status.deprecated) {
      return {
        aria: i18n('i18n.browser_compat.deprecated', locale),
        compatProperty: 'deprecated',
        icon: '🗑',
      };
    }

    if (!support.version_removed) {
      if (support.version_added === 'preview') {
        return {
          aria: i18n('i18n.browser_compat.preview', locale),
          compatProperty: 'preview',
          icon: '👁',
        };
      }

      if (support.flags && support.flags.length > 0) {
        return {
          aria: i18n('i18n.browser_compat.flag', locale),
          compatProperty: 'flag',
          icon: '⚑',
        };
      }

      if (typeof support.version_added === 'string') {
        return {
          aria: i18n('i18n.browser_compat.supported', locale),
          compatProperty: 'yes',
          icon: support.version_added,
        };
      }

      // See https://github.com/GoogleChrome/web.dev/issues/8333
      if (support.version_added === true) {
        return {
          aria: i18n('i18n.browser_compat.supported', locale),
          compatProperty: 'yes',
          icon: '✅',
        };
      }
    }

    return {
      aria: i18n('i18n.browser_compat.not_supported', locale),
      compatProperty: 'no',
      icon: '×',
    };
  }

  /**
   *
   * @param {ShortcodeContext} context
   */
  render(context, feature) {
    const locale = context.ctx.locale;
    const data = this.data;
    if (!data) {
      throw new Error(
        '[BrowserCompat shortcode] Could not load Browser Compat data.'
      );
    }

    const shortcodeContext = {};
    if (this.browsers && data[feature] && data[feature].support) {
      shortcodeContext.browsers = this.browsers.map(browser => {
        const support = Array.isArray(data[feature].support[browser])
          ? data[feature].support[browser][0]
          : data[feature].support[browser];

        const supportInfo = this.getInfoFromSupportStatement(
          support,
          data[feature].status,
          locale
        );

        const isSupported = support.version_added && !support.version_removed;

        const ariaLabel = [
          browser,
          isSupported ? ` ${support.version_added}, ` : ', ',
          supportInfo.aria,
        ].join('');

        return {
          name: browser,
          supportInfo,
          ariaLabel,
          compat: supportInfo.compatProperty,
          icon: supportInfo.icon,
        };
      });

      shortcodeContext.source = data[feature].mdn_url;
      shortcodeContext.sourceLabel = i18n('i18n.browser_compat.source', locale);
      shortcodeContext.supportLabel = i18n(
        'i18n.browser_compat.browser_support',
        locale
      );
    }

    try {
      const templateEngine = this.extensionMap.engineManager.getEngine('njk');
      const template = new Nunjucks.Template(
        this.template,
        templateEngine.njkEnv,
        null,
        true
      );

      return template.render({browserCompat: shortcodeContext});
    } catch (e) {
      console.error(e);
      throw new Error('[BrowserCompat shortcode] Could not render.');
    }
  }
}

module.exports = {BrowserCompat};
