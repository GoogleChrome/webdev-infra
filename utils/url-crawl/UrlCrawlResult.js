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

const chalk = require('chalk');

module.exports = class UrlCrawlResult {
  constructor() {
    this.scannedUrls = {};
    this.scanCount = 0;
    /** @type {import('types/utils/url-crawl').ScanError[]} */
    this.errors = [];

    this.startTime = Date.now();
  }

  get errorCount() {
    return this.errors.length;
  }

  incrementScanCount() {
    this.scanCount++;
  }

  getScanDuration() {
    return `${(Date.now() - this.startTime) / 1000}s`;
  }

  summaryToConsole() {
    const errorCategories = {};
    for (const error of this.errors) {
      const key = `${error.statusCode} ${error.summary}`;
      if (errorCategories[key] === undefined) {
        errorCategories[key] = [];
      }

      errorCategories[key].push(error);
    }

    /**
     * @param {number} number
     * @returns {string}
     */
    function formatNumber(number) {
      return number.toLocaleString('en-GB');
    }

    const errorCount = this.errorCount;
    const summary = [
      '',
      '=== Summary ===',
      `Scanned ${formatNumber(
        this.scanCount
      )} URLs in ${this.getScanDuration()}`,
      '',
      'Error Summary',
      Object.entries(errorCategories)
        .map(
          ([key, errors]) =>
            `  ${chalk[errors[0].statusCode === 200 ? 'green' : 'red'].bold(
              key
            )}: ${formatNumber(errors.length)}`
        )
        .join('\n'),
      '',
      'Totals',
      `  Errors: ${formatNumber(errorCount)}`,
      `  Pass: ${formatNumber(this.scanCount - errorCount)}`,
      '',
    ];

    console.log(summary.join('\n'));
  }

  toJson(shouldPrettyPrint = false) {
    return JSON.stringify(
      {
        scanDuration: this.getScanDuration(),
        scanCount: this.scanCount,
        errorCount: this.errorCount,
        scannedUrls: this.scannedUrls,
        errors: this.errors,
      },
      null,
      shouldPrettyPrint ? 2 : 0
    );
  }
};
