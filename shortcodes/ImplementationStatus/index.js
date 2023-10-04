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
const path = require('path');
const EleventyFetch = require('@11ty/eleventy-fetch');
const Nunjucks = require('nunjucks');

const {i18n} = require('../../utils/i18nDictionary');

const CACHE_TIMEOUT = '3h';

const CHROME_STATUS_API_URL = 'https://chromestatus.com/api/v0/features/';
const CHROME_STATUS_ORIGIN_TRIAL = 8;
const CHROME_STATUS_BEHIND_FLAG = 4;
const CHROME_STATUS_ENABLED_BY_DEFAULT = 5;
const CHROME_STATUS_STAGE_ORIGIN_TRIAL = 150;

const ORIGIN_TRIAL_LIST_URL =
  'https://developer.chrome.com/origintrials/#/trials/active';
const ORIGIN_TRIAL_VIEW_URL =
  'https://developer.chrome.com/origintrials/#/view_trial';

const STATUS_KEY_SKIPPED = 'skipped';
const STATUS_KEY_IN_PROGRESS = 'in_progress';
const STATUS_KEY_BEHIND_FLAG = 'skipped';
const STATUS_KEY_COMPLETED = 'completed';

const TEMPLATE = new Nunjucks.Template(
  fs.readFileSync(path.join(__dirname, 'template.njk'), {encoding: 'utf-8'})
);

/**
 * @param {string} featureId
 * @returns {Promise<ChromeStatusFeature>}
 */
async function fetchFeature(featureId) {
  let data = await EleventyFetch(`${CHROME_STATUS_API_URL}/${featureId}`, {
    duration: CACHE_TIMEOUT,
    type: 'text',
  });

  // EleventyFetch would actually support parsing JSON, but
  // the Chrome Status API protects their responses by prepending
  // )]}'.
  data = data.replace(")]}'", '');
  data = JSON.parse(data);

  return data;
}

/**
 *
 * @param {ImplementationStatusSteps} steps
 * @param {ChromeStatusFeature} feature
 */
function getSpecStatus(steps, feature) {
  const spec = {
    label: 'i18n.implementation_status.create_spec',
  };

  if (feature.spec_link) {
    spec.url = feature.spec_link;

    // Is there already a spec, but no explainer? Then the
    // explainer step has likely been skipped.
    if (steps.explainer) {
      steps.explainer.status = STATUS_KEY_SKIPPED;
    }
  }

  return spec;
}

/**
 *
 * @param {ImplementationStatusSteps} steps
 * @param {ChromeStatusFeature} feature
 */
function getExplainerStatus(steps, feature) {
  const explainer = {
    label: 'i18n.implementation_status.create_explainer',
  };

  if (feature.explainer_links && feature.explainer_links.length) {
    explainer.url = feature.explainer_links[0];
    explainer.status = STATUS_KEY_COMPLETED;
  }

  return explainer;
}

/**
 *
 * @param {ImplementationStatusSteps} steps
 * @param {ChromeStatusFeature} feature
 */
function getOriginTrialStatus(steps, feature) {
  const originTrial = {
    label: 'i18n.implementation_status.origin_trial',
  };



  return originTrial;
}

/**
 *
 * @param {ShortcodeContext['ctx']} pageContext The full render context of the 11ty page
 * @param {ChromeStatusFeature} feature Feature details from Chrome Status API
 * @param {string} originTrialId A valid origin trial ID
 * @returns {ImplementationStatusSteps}
 */
function getRenderContext(pageContext, feature, originTrialId) {
  // Note, name and motivation will never be localized as they are
  // coming from the Chrome Status API, which is English only
  const context = {
    name: feature.name,
    motivation: feature.motivation,
  };

  const steps = {};
  steps.spec = getSpecStatus(steps, feature);
  steps.explainer = getExplainerStatus(steps, feature);
  // Feedback is simple: it's always in progress, as long as the feature
  // has not yet fully launched
  steps.feedback = {
    label: 'i18n.implementation_status.feedback',
    status: STATUS_KEY_IN_PROGRESS,
  };
  steps.originTrial = getOriginTrialStatus(steps, feature);

  // Actually translate labels and status keys to human readable strings
  // in the locale of the surrounding page
  const locale = pageContext.locale;
  for (const [stepName, step] of Object.entries(steps)) {
    const label = step.label;
    const status = step.status;
    steps[stepName].label = i18n(label, locale);
    steps[stepName].status = i18n(
      `i18n.implementation_status.${status}`,
      locale
    );
  }

  context.steps = steps;
  return context;

  // Link to feedback section - assume the feature is ready for feedback
  // as soon as there is a explainer and a spec
  context.steps.feedback = {
    label: i18n('i18n.implementation_status.gather_feedback', locale),
    status: i18n('i18n.implementation_status.not_started', locale),
  };
  if (context.steps.explainer.url && context.steps.spec.url) {
    setStatus(context.steps.feedback, STATUS_KEY_IN_PROGRESS, locale);
  }

  // Check for a planned Chrome Status entry for an origin trial. As it is
  // currently (1/2023) not possible to retrieve the link from an API,
  // only link to the detail view if an ID is provided
  context.steps.origin_trial = {
    label: i18n('i18n.implementation_status.origin_trial', locale),
    status: i18n('i18n.implementation_status.not_started', locale),
  };
  if (feature.browsers?.chrome?.status?.val === CHROME_STATUS_ORIGIN_TRIAL) {
    setStatus(context.steps.origin_trial, STATUS_KEY_IN_PROGRESS, locale);
    context.steps.origin_trial.url = ORIGIN_TRIAL_LIST_URL;
    if (originTrialId) {
      context.steps.origin_trial.url = `${ORIGIN_TRIAL_VIEW_URL}/${originTrialId}`;
    }
  } else if (originTrialId || feature.ot_milestone_desktop_end) {
    // If the author explicitly gave an origin trial id, but that's not
    // the browser status anymore, it probably means the OT is over
    setStatus(context.steps.origin_trial, STATUS_KEY_COMPLETED, locale);
  }

  context.steps.launch = {
    label: i18n('i18n.implementation_status.launch', locale),
    status: i18n('i18n.implementation_status.not_started', locale),
  };
  if (feature.intent_stage === 'Prepare to ship') {
    setStatus(context.steps.launch, STATUS_KEY_IN_PROGRESS, locale);
  } else if (
    feature.browsers?.chrome?.status?.val === CHROME_STATUS_BEHIND_FLAG
  ) {
    setStatus(context.steps.launch, STATUS_KEY_COMPLETED, locale);
    context.steps.launch.status = i18n(
      'i18n.implementation_status.developer_trial',
      locale
    );
  } else if (
    feature.browsers?.chrome?.status?.val === CHROME_STATUS_ENABLED_BY_DEFAULT
  ) {
    setStatus(context.steps.launch, STATUS_KEY_COMPLETED, locale);

    // If a feature has launched, there is no point in asking for more
    // feedback and origin trials have auto-completed
    setStatus(context.steps.feedback, STATUS_KEY_COMPLETED, locale);
    setStatus(context.steps.origin_trial, STATUS_KEY_COMPLETED, locale);

    console.warn(
      '[ImplementationStatus]',
      feature.name,
      'has launched and might be replaced by a BrowserCompat widget.'
    );
  }

  return context;
}

/**
 * @this ShortcodeContext
 * @param {string} featureId
 * @param {string} originTrialId
 */
async function ImplementationStatus(featureId, originTrialId) {
  let feature = null;
  try {
    feature = await fetchFeature(featureId);
  } catch (e) {
    console.error(e);
    throw new Error(
      '[Implementation Status shortcode] ' +
        `Failed to fetch details for feature ${featureId}`
    );
  }

  const renderContext = getRenderContext(this.ctx, feature, originTrialId);

  return TEMPLATE.render({implStatus: renderContext});
}

module.exports = {ImplementationStatus};
