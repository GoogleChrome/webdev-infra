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

declare global {
  export interface ImplementationStatusStep {
    label?: string;
    status?: string;
    url?: string;
  }

  export interface ImplementationStatusSteps {
    explainer?: ImplementationStatusStep;
    spec?: ImplementationStatusStep;
    feedback?: ImplementationStatusStep;
    originTrial?: ImplementationStatusStep;
    launch?: ImplementationStatusStep;
  }

  export interface ChromeStatusFeature {
    accurate_as_of: string;
    activation_risks: string;
    all_platforms: boolean;
    all_platforms_descr: string;
    anticipated_spec_changes: string;
    api_spec: boolean;
    breaking_change: boolean;
    category: string;
    created: {
      by: string;
      when: string;
    };
    debuggability: string;
    deleted: boolean;
    ergonomics_risks: string;
    feature_type: string;
    flag_name: string;
    intent_stage: string;
    interop_compat_risks: string;
    measurement: string;
    motivation: string;
    name: string;
    non_oss_deps: string;
    ongoing_constraints: string;
    prefixed: boolean;
    privacy_review_status: string;
    requires_embedder_support: boolean;
    security_review_status: string;
    security_risks: string;
    star_count: number;
    summary: string;
    tag_review: string;
    tag_review_status: string;
    unlisted: boolean;
    updated: {
      by: string;
      when: string;
    };
    webview_risks: string;
    wpt: boolean;
    wpt_descr: string;
    id: number;
    spec_link: string;
    explainer_links: Array<string>;
    stages: Array<{
      id: number;
      feature_id: number;
      stage_type: number;
      intent_stage: number;
      pm_emails: Array<any>;
      tl_emails: Array<any>;
      ux_emails: Array<any>;
      te_emails: Array<any>;
      intent_thread_url: any;
      intent_to_implement_url: any;
      ready_for_trial_url: any;
      dt_milestone_desktop_start: any;
      desktop_first?: number;
      dt_milestone_android_start: any;
      android_first?: number;
      dt_milestone_ios_start: any;
      ios_first: any;
      dt_milestone_webview_start: any;
      webview_first?: number;
      intent_to_experiment_url: any;
      experiment_goals?: string;
      experiment_risks?: string;
      origin_trial_feedback_url: any;
      experiment_extension_reason?: string;
      intent_to_extend_experiment_url: any;
      ot_milestone_desktop_start?: number;
      ot_milestone_desktop_end?: number;
      desktop_last?: number;
      ot_milestone_android_start?: number;
      ot_milestone_android_end?: number;
      android_last?: number;
      ot_milestone_webview_start?: number;
      ot_milestone_webview_end?: number;
      webview_last?: number;
      extensions?: Array<{
        id: number;
        feature_id: number;
        stage_type: number;
        intent_stage: number;
        experiment_extension_reason: string;
        intent_to_extend_experiment_url: any;
        ot_stage_id: number;
        extension_desktop_last: number;
        desktop_last: number;
        extension_android_last: number;
        android_last: number;
        extension_webview_last: number;
        webview_last: number;
        pm_emails: Array<string>;
        tl_emails: Array<string>;
        ux_emails: Array<string>;
        te_emails: Array<string>;
        intent_thread_url: any;
      }>;
      intent_to_ship_url: any;
      finch_url: any;
      shipped_milestone: any;
      shipped_android_milestone: any;
      shipped_ios_milestone: any;
      shipped_webview_milestone: any;
    }>;
    ot_milestone_desktop_start: number;
    ot_milestone_android_start: number;
    ot_milestone_webview_start: number;
    ot_milestone_desktop_end: number;
    ot_milestone_android_end: number;
    ot_milestone_webview_end: number;
    experiment_goals: string;
    experiment_risks: string;
    experiment_extension_reason: string;
    is_released: boolean;
    category_int: number;
    feature_type_int: number;
    intent_stage_int: number;
    standards: {
      maturity: {
        short_text: string;
        val: number;
      };
    };
    tag_review_status_int: number;
    security_review_status_int: number;
    privacy_review_status_int: number;
    resources: {};
    creator: string;
    comments: string;
    browsers: {
      chrome: {
        blink_components: Array<string>;
        owners: Array<string>;
        origintrial: boolean;
        intervention: boolean;
        prefixed: boolean;
        flag: boolean;
        status: {
          text: string;
          val: number;
          milestone_str: string;
        };
      };
      ff: {
        view: {
          text: string;
          val: number;
          notes: string;
        };
      };
      safari: {
        view: {
          text: string;
          val: number;
          notes: string;
        };
      };
      webdev: {
        view: {
          text: string;
          val: number;
          notes: string;
        };
      };
      other: {
        view: {
          notes: string;
        };
      };
    };
    updated_display: string;
    new_crbug_url: string;
  }
}

// empty export to keep file a module
export {};
