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

// We want to use a module to make it global, so we'll suppress this warning.
/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
import * as filters from './filters';
import * as shortcodes from './shortcodes';
import * as utils from './utils';

declare global {
  module wd {
    export type ImgArgs = shortcodes.ImgArgs;
    export type ImgixOptions = shortcodes.ImgixOptions;
    export type TocNodeType = filters.TocNodeType;
    export type TODO = utils.TODO;
    export type TODOObject = utils.TODOObject;
    export type VideoArgs = shortcodes.VideoArgs;
  }
}

// empty export to keep file a module
export {};
