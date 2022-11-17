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
 * that ends in HTML. Pages that are actually not emitted (because they
 * have set permalink: false for example) have an undefined outputPath
 * and hence do not need to be transformed.
 * for
 * @param {string} output
 * @param {string} outputPath
 */
module.exports = function isTransformable(output, outputPath) {
  if (!outputPath || !outputPath.endsWith('.html')) {
    return false;
  }

  if (!output) {
    return false;
  }

  return true;
};
