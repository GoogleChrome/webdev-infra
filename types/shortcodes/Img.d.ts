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

import {TODOObject} from '../utils/todo';

export type ImgArgs = {
  /**
   * Defines an alternative text description of the image.
   */
  alt: string;
  /**
   * A space-separated list of the classes of the element.
   */
  class?: string;
  /**
   * Provides an image decoding hint to the browser. `'async'` by default.
   */
  decoding?: 'sync' | 'async' | 'auto';
  /**
   * The intrinsic height of the image, in pixels. Must be an integer without a unit.
   */
  height: string;
  /**
   * Often used with CSS to style a specific element. The value of this attribute must be unique.
   */
  id?: string;
  /**
   * Flag to wrap image in `a` tag pointing to the image. `false` by default.
   */
  linkTo?: boolean;
  /**
   * Indicates how the browser should load the image. `'lazy'` by default.
   */
  loading?: 'eager' | 'lazy';
  /**
   * One or more strings separated by commas, indicating a set of source sizes. If value is not provided one is generated dynamically.
   */
  sizes?: string;
  /**
   * Pathname of image hosted by imgix.
   */
  src: string;
  /**
   * A string containing CSS styling declarations to be applied to the element.
   */
  style?: string;
  /**
   * The intrinsic width of the image in pixels. Must be an integer without a unit.
   */
  width: string;
  /**
   * Params directly passed to the imgix API. This can be used to make specific overrides, use with caution.
   */
  params?: TODOObject;
  /**
   * Options passed when generating an imgix srcset.
   */
  options?: ImgixOptions;
};

export type ImgixOptions = {
  widths?: number[];
  widthTolerance?: number;
  minWidth?: number;
  maxWidth?: number;
  disableVariableQuality?: boolean;
};
