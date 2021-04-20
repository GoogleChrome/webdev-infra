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

const ImgixClient = require('@imgix/js-core');
const {isSimpleImg} = require('../utils/is-simple-img');

const DEFAULT_PARAMS = {auto: 'format'};

/**
 * Generates src URL of image from imgix path or URL.
 *
 * @param {string} domain imgix domain
 * @param {string} src Path (or URL) for image.
 * @param {Object} [params] Imgix API params.
 * @return {string}
 */
const imgix = (domain, src, params = {}) => {
  const client = new ImgixClient({domain, includeLibraryParam: false});

  params = {...DEFAULT_PARAMS, ...params};

  // Check if image is an SVG, if it is we don't need or want to process it
  // If we do imgix will rasterize the image.
  const doNotUseParams = isSimpleImg(src, params);

  return client.buildURL(src, doNotUseParams ? {} : params);
};

module.exports = {imgix};
