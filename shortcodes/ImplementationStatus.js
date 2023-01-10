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

const fs = require('fs');
const EleventyFetch = require('@11ty/eleventy-fetch');
const Nunjucks = require('nunjucks');

const {i18n} = require('../utils/dictionary');

const CHROME_STATUS_API_URL = 'https://chromestatus.com/api/v0/features/';

const ORIGIN_TRIAL_LIST_URL =
  'https://developer.chrome.com/origintrials/#/trials/active';
const ORIGIN_TRIAL_VIEW_URL =
  'https://developer.chrome.com/origintrials/#/view_trial';

const STATUS_KEY_IN_PROGRESS = 'in-progress';
const STATUS_KEY_COMPLETED = 'completed';

class ImplementationStatus {
  /**
   * Configures the shortcode for use and returns the render
   * function that can be used by 11ty
   * @param {{
   *   templatePath: string,
   *   eleventyConfig: any,
   *   cacheTimeout: string,
   * }} config
   * @returns
   */
  configure(config) {
    if (!config.templatePath) {
      throw new Error(
        '[ImplementationSstatus shortcode] No valid template path given'
      );
    }
    this.templatePath = config.templatePath;
    this.template = fs.readFileSync(this.templatePath, {encoding: 'utf-8'});
    if (!config.eleventyConfig) {
      throw new Error(
        '[ImplementationSstatus shortcode] eleventyConfig required.'
      );
    }

    this.eleventyConfig = config.eleventyConfig;
    this.eleventyConfig.on('eleventy.extensionmap', map => {
      this.extensionMap = map;
    });

    this.cacheTimeout = config.cacheTimeout || '3h';

    const self = this;
    /**
     * The actual render function that is called by 11ty and
     * with 11ty's render context passed via this
     * @param {string} feature
     * @returns
     */
    const render = function (featureId, originTrialId) {
      // @ts-ignore: `this` has type of `any`
      return self.render.bind(self)(this, featureId, originTrialId);
    };

    return render;
  }

  /**
   * @param {string} featureId
   * @returns {{aria: string, compatProperty: string, icon: string}}}
   */
  async fetchFeatureDetails(featureId) {
    let data = await EleventyFetch(`${CHROME_STATUS_API_URL}/${featureId}`, {
      duration: this.cacheTimeout,
      type: 'text',
    });

    // EleventyFetch would actually support parsing JSON, but
    // the Chrome Status API protects their responses by prepending
    // )]}'.
    data = data.replace(")]}'", '');
    data = JSON.parse(data);

    return data;
  }

  getRenderContext(locale, featureDetails, originTrialId) {
    const context = {
      name: featureDetails.name,
      motivation: featureDetails.motivation,
    };

    // Add information about a potential explainer doc. This
    // step in the process is either started or not started
    context.explainer = {
      label: i18n('i18n.implementation_status.create_explainer', locale),
      status: i18n('i18n.implementation_status.not_started', locale),
    };

    if (
      featureDetails.explainer_links &&
      featureDetails.explainer_links.length
    ) {
      context.explainer.url = featureDetails.explainer_links[0];
      context.explainer.statusKey = STATUS_KEY_COMPLETED;
      context.explainer.status = i18n(
        'i18n.implementation_status.completed',
        locale
      );
    }

    // Add initial draft or spec information, there is another key
    // standards with a list of spec docs rated by maturity that could
    // be used here alternatively
    context.spec = {
      label: i18n('i18n.implementation_status.create_spec', locale),
      status: i18n('i18n.implementation_status.not_started', locale),
    };
    if (featureDetails.spec_link) {
      context.explainer.statusKey = STATUS_KEY_COMPLETED;
      context.spec.status = i18n(
        'i18n.implementation_status.completed',
        locale
      );
      context.spec.url = featureDetails.spec_link;
    }

    // Link to feedback section - assume the feature is ready for feedback
    // as soon as there is a explainer and a spec
    context.feedback = {
      label: i18n('i18n.implementation_status.gather_feedback', locale),
      status: i18n('i18n.implementation_status.not_started', locale),
    };
    if (context.explainer.url && context.spec.url) {
      context.explainer.statusKey = STATUS_KEY_IN_PROGRESS;
      context.feedback.status = i18n(
        'i18n.implementation_status.in_progress',
        locale
      );
    }

    // Check for a planned Chrome Status entry for an origin trial. As it is
    // currently (1/2023) not possible to retrieve the link from an API,
    // only link to the detail view if an ID is provided
    context.origin_trial = {
      label: i18n('i18n.implementation_status.origin_trial', locale),
      status: i18n('i18n.implementation_status.not_started', locale),
    };
    if (featureDetails.ot_milestone_desktop_start) {
      context.explainer.statusKey = STATUS_KEY_IN_PROGRESS;
      context.origin_trial.status = i18n(
        'i18n.implementation_status.in_progress',
        locale
      );
      context.origin_trial.url = ORIGIN_TRIAL_LIST_URL;
      if (originTrialId) {
        context.origin_trial.url = `${ORIGIN_TRIAL_VIEW_URL}/${originTrialId}`;
      }
    }

    context.launch = {
      label: i18n('i18n.implementation_status.launch', locale),
      status: i18n('i18n.implementation_status.not_started', locale),
    };
    if (featureDetails.intent_stage === 'Prepare to ship') {
      context.explainer.statusKey = STATUS_KEY_IN_PROGRESS;
      context.launch.status = i18n(
        'i18n.implementation_status.in_progress',
        locale
      );
    } else if (featureDetails.intent_stage === 'Shipped') {
      context.explainer.statusKey = STATUS_KEY_COMPLETED;
      context.launch.status = i18n(
        'i18n.implementation_status.completed',
        locale
      );
    }

    return context;
  }

  /**
   *
   * @param {ShortcodeContext} context
   */
  async render(context, featureId, originTrialId) {
    let featureDetails = null;
    try {
      featureDetails = await this.fetchFeatureDetails(featureId);
    } catch (e) {
      console.error(e);
      throw new Error(
        '[Implementation Status shortcode] ' +
          `Failed to fetch details for feature ${featureId}`
      );
    }

    const locale = context.ctx.locale;
    const renderContext = this.getRenderContext(
      locale,
      featureDetails,
      originTrialId
    );

    try {
      const templateEngine = this.extensionMap.engineManager.getEngine('njk');
      const template = new Nunjucks.Template(
        this.template,
        templateEngine.njkEnv,
        null,
        true
      );

      return template.render({implementationStatus: renderContext});
    } catch (e) {
      console.error(e);
      throw new Error('[ImplementationStatus shortcode] Could not render.');
    }
  }
}

module.exports = {ImplementationStatus};
