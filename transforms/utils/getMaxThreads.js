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

const os = require('os');

const maxThreadsFraction = parseFloat(
  process.env.WEBDEV_INFRA_MAX_THREADS || '0.9'
);

/**
 * Determines the number of available CPUs and uses a configured
 * fraction (defaulting to 90%) to calculate the maximum number
 * of threads that should be used for parallel work
 * @returns The number of usable threads as an integer
 */
module.exports = function getMaxThreads() {
  return Math.round(maxThreadsFraction * os.cpus().length);
};
