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

/**
 * Checks if the transformed page has indeed output and an outputPath
 * that ends in HTML. Pages that are actually not emitted have outputPath
 * false and hence do not need to be transformed. outputPath is also false
 * for
 * @param {string} output
 * @param {string} outputPath
 */
module.exports = function isTransformable(output, outputPath) {
  // For dynamic content (e.g. rendered via Eleventy Serverless),
  // and content that is not written (permalink: false)
  // outputPath is false. Also we want to skip files like XML,
  // JSON and others that might also be emitted by 11ty
  if (!outputPath || !outputPath.endsWith('.html')) {
    return false;
  }

  // Empty pages or pages that use different styles than the
  // base CSS should also be skipped
  if (!output) {
    return false;
  }

  return true;
};
