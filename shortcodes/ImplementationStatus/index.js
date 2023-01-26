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

const ORIGIN_TRIAL_LIST_URL =
  'https://developer.chrome.com/origintrials/#/trials/active';
const ORIGIN_TRIAL_VIEW_URL =
  'https://developer.chrome.com/origintrials/#/view_trial';

const STATUS_KEY_IN_PROGRESS = 'in-progress';
const STATUS_KEY_COMPLETED = 'completed';

const TEMPLATE = new Nunjucks.Template(
  fs.readFileSync(path.join(__dirname, 'template.njk'), {encoding: 'utf-8'})
);

/**
 * @param {string} featureId
 * @returns {Promise<{aria: string, compatProperty: string, icon: string}>}}
 */
async function fetchFeatureDetails(featureId) {
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

function setStatus(step, statusKey, locale) {
  step.statusKey = statusKey;
  if (statusKey === STATUS_KEY_COMPLETED) {
    step.status = i18n('i18n.implementation_status.completed', locale);
  } else if (statusKey === STATUS_KEY_IN_PROGRESS) {
    step.status = i18n('i18n.implementation_status.in_progress', locale);
  }
}

function getRenderContext(locale, featureDetails, originTrialId) {
  const context = {
    name: featureDetails.name,
    motivation: featureDetails.motivation,
    steps: {},
  };

  // Add information about a potential explainer doc. This
  // step in the process is either started or not started
  context.steps.explainer = {
    label: i18n('i18n.implementation_status.create_explainer', locale),
    status: i18n('i18n.implementation_status.not_started', locale),
  };
  if (featureDetails.explainer_links && featureDetails.explainer_links.length) {
    context.steps.explainer.url = featureDetails.explainer_links[0];
    setStatus(context.steps.explainer, STATUS_KEY_COMPLETED, locale);
  }

  // Add initial draft or spec information, there is another key
  // standards with a list of spec docs rated by maturity that could
  // be used here alternatively
  context.steps.spec = {
    label: i18n('i18n.implementation_status.create_spec', locale),
    status: i18n('i18n.implementation_status.not_started', locale),
  };
  if (featureDetails.spec_link) {
    setStatus(context.steps.spec, STATUS_KEY_COMPLETED, locale);
    context.steps.spec.url = featureDetails.spec_link;
  }

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
  if (
    featureDetails.browsers?.chrome?.status?.val === CHROME_STATUS_ORIGIN_TRIAL
  ) {
    setStatus(context.steps.origin_trial, STATUS_KEY_IN_PROGRESS, locale);
    context.steps.origin_trial.url = ORIGIN_TRIAL_LIST_URL;
    if (originTrialId) {
      context.steps.origin_trial.url = `${ORIGIN_TRIAL_VIEW_URL}/${originTrialId}`;
    }
  } else if (originTrialId || featureDetails.ot_milestone_desktop_end) {
    // If the author explicitly gave an origin trial id, but that's not
    // the browser status anymore, it probably means the OT is over
    setStatus(context.steps.origin_trial, STATUS_KEY_COMPLETED, locale);
  }

  context.steps.launch = {
    label: i18n('i18n.implementation_status.launch', locale),
    status: i18n('i18n.implementation_status.not_started', locale),
  };
  if (featureDetails.intent_stage === 'Prepare to ship') {
    setStatus(context.steps.launch, STATUS_KEY_IN_PROGRESS, locale);
  } else if (
    featureDetails.browsers?.chrome?.status?.val === CHROME_STATUS_BEHIND_FLAG
  ) {
    setStatus(context.steps.launch, STATUS_KEY_COMPLETED, locale);
    context.steps.launch.status = i18n(
      'i18n.implementation_status.developer_trial',
      locale
    );
  } else if (
    featureDetails.browsers?.chrome?.status?.val ===
    CHROME_STATUS_ENABLED_BY_DEFAULT
  ) {
    setStatus(context.steps.launch, STATUS_KEY_COMPLETED, locale);

    // If a feature has launched, there is no point in asking for more
    // feedback and origin trials have auto-completed
    setStatus(context.steps.feedback, STATUS_KEY_COMPLETED, locale);
    setStatus(context.steps.origin_trial, STATUS_KEY_COMPLETED, locale);

    console.warn(
      '[ImplementationStatus]',
      featureDetails.name,
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
  let featureDetails = null;
  try {
    featureDetails = await fetchFeatureDetails(featureId);
  } catch (e) {
    console.error(e);
    throw new Error(
      '[Implementation Status shortcode] ' +
        `Failed to fetch details for feature ${featureId}`
    );
  }

  const locale = this.ctx.locale;
  const renderContext = getRenderContext(locale, featureDetails, originTrialId);

  return TEMPLATE.render({implStatus: renderContext});
}

module.exports = {ImplementationStatus};
