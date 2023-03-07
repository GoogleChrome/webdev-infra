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
const {createMocks} = require('node-mocks-http');
const EventEmitter = require('events');
const response = require('express/lib/response');
const fs = require('fs');
const UrlCrawlResult = require('./UrlCrawlResult');

// matches <body>...</body>
const HTML_BODY_REGEX = /<body(?:\s+[^>]+)?>(.*)<\/body>/is;

// matches <a ...> or <area ...>
const HTML_HREF_ELEMENT_REGEX = /<(a|area)\s.+?>.+?(?=>)\/?>/gi;

// matches href="..."/'...' (backslash escape aware) or href=...
const HTML_HREF_ATTRIBUTE_REGEX = /href=("(?:\\["\\]|[^"\\]+)*"|'(?:\\['\\]|[^'\\]+)*'|[^\s>]+)/gi;

module.exports = class UrlCrawl {
  /**
   * @param {import('types/utils/url-crawl').UrlCrawlOptions?} options
   */
  constructor(options) {
    this.shouldNormalizeTrailingSlash =
      options?.shouldNormalizeTrailingSlash ?? true;
    this.shouldDisableDuplicateUrls =
      options?.shouldDisableDuplicateUrls ?? true;
    this.onErrorOutput =
      options?.onErrorOutput ?? this._defaultErrorOutputHandler;
    this.handlers = options?.handlers ?? [];

    if (options?.shouldDetectSuperstatic !== false) {
      // disabled eslint-rule because superstatic is read from the executing package
      // eslint-disable-next-line node/no-missing-require
      const superstaticModulePath = require.resolve('superstatic', {
        paths: [process.cwd()],
      });

      if (superstaticModulePath !== null) {
        this.debug(
          'Detected firebase (can be disabled with `shouldDetectSuperstatic: false`)'
        );

        const superstatic = require(superstaticModulePath);
        const firebaseConfigPath = `${process.cwd()}/firebase.json`;
        let config = {};
        if (fs.existsSync(firebaseConfigPath)) {
          config =
            JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'))?.hosting ??
            {};
        } else {
          this.debug('No firebase.json found');
        }

        this.handlers.unshift(
          superstatic({
            config,
          })
        );
      }
    }
  }

  /**
   * If no error output handler is provided, this one is used
   *
   * @param {ScanError} error
   * @returns {string}
   */
  _defaultErrorOutputHandler(error) {
    return `${chalk[error.statusCode === 200 ? 'green' : 'red'].bold(
      `${error.statusCode} ${error.summary}`
    )} ${error.tag}[href="${chalk.red(error.path)}"] @ ${error.parent}`;
  }

  /**
   * Prints debug message to the console
   *
   * @param {any} content The content to print
   */
  debug(...content) {
    if (process.env.DEBUG) {
      console.debug('DEBUG', ...content);
    }
  }

  /**
   * Simulates a network request to the express webserver.
   *
   * @param {string} urlPath The URL path to simulate
   * @returns {Promise<import('express').Response>}
   */
  simulateExpressPath(urlPath) {
    const {req, res} = createMocks(
      {
        method: 'GET',
        url: urlPath,
      },
      {
        eventEmitter: EventEmitter,
      }
    );

    // as data is written to the stream, store it in body to be used by the crawler
    let body = '';
    Object.assign(res, response, {
      req,
      write(data) {
        body += data.toString();
      },
    });

    return new Promise(resolve => {
      // the stream has been signaled there's no more data, time to give all the collected data to
      // the crawler
      res.on('end', () => {
        res.content = body;
        resolve(res);
      });

      /**
       * Call the next in line handler
       *
       * @param {number} handlerIndex The index of the handler to call
       */
      const callNextHandler = (handlerIndex = 0) => {
        if (this.handlers === undefined) {
          throw new Error('Handlers not initialized');
        }

        const handler = this.handlers[handlerIndex];
        if (!handler) {
          throw new Error('No more handlers to call');
        }

        handler(
          /** @type {import('express').Request} */ (req),
          /** @type {import('express').Response} */ (res),
          () => {
            callNextHandler(handlerIndex + 1);
          }
        );
      };

      callNextHandler();
    });
  }

  /**
   * @typedef {{
   *   path: string,
   *   tag: string,
   *   statusCode: number,
   *   summary: string,
   *   parent: ?string,
   * }} ScanError
   */

  /**
   * @param {UrlCrawlResult} result
   * @param {string} cachePath
   * @param {ScanError} error
   */
  handleError(result, cachePath, error) {
    if (this.onErrorOutput) {
      console.log(this.onErrorOutput(error));
    }

    result.errors.push(error);
    result.scannedUrls[cachePath] = error;
  }

  /**
   * Recursively loads a path's content and scans it for URLs
   *
   * @param {UrlCrawlResult} result
   * @param {string} urlPath
   * @param {string} tag
   * @param {?string} parent
   * @param {boolean} shouldSilentlyFail
   *
   * @returns {Promise<number>}
   */
  async scanPath(
    result,
    urlPath,
    tag,
    parent = null,
    shouldSilentlyFail = false
  ) {
    // instead of checking a URL everytime it is reused, we check it once and cache the result
    let cachePath = urlPath;
    if (this.shouldNormalizeTrailingSlash && !urlPath.endsWith('/')) {
      cachePath += '/';
    }

    const cachedResult = result.scannedUrls[cachePath];
    if (this.shouldDisableDuplicateUrls && cachedResult) {
      return 200;
    }

    result.incrementScanCount();

    if (cachedResult !== undefined) {
      if (cachedResult !== 'OK' && !shouldSilentlyFail) {
        this.handleError(result, cachePath, {
          ...cachedResult,
          parent,
          tag,
        });
      }

      return cachedResult.statusCode;
    }

    // run request simulation on the path
    const res = await this.simulateExpressPath(urlPath);
    if (res.statusCode === 404) {
      if (!shouldSilentlyFail) {
        this.handleError(result, cachePath, {
          path: urlPath,
          statusCode: res.statusCode,
          tag,
          summary: 'Not Found',
          parent,
        });
      }

      return res.statusCode;
    } else if (res.statusCode === 301 || res.statusCode === 302) {
      const location = /** @type {string} */ (res.getHeader('Location'));
      // external redirect, ignore
      if (location.startsWith('http://') || location.startsWith('https://')) {
        return 200;
      }

      const redirectResult = await this.scanPath(
        result,
        location,
        tag,
        parent,
        true
      );

      if (redirectResult !== 200 && !shouldSilentlyFail) {
        this.handleError(result, cachePath, {
          path: urlPath,
          tag,
          statusCode: redirectResult,
          summary: 'Redirected',
          parent,
        });
      }

      return redirectResult;
    }

    // if the content is not HTML, we don't need to scan it
    const contentType = /** @type {string} */ (res.getHeader('Content-Type'));
    if (contentType === null || !contentType.startsWith('text/html')) {
      return 200;
    }

    // will contain the ... in <body>...</body>
    const bodyContent = HTML_BODY_REGEX.exec(res.content)?.[1];
    if (bodyContent === undefined) {
      this.handleError(result, cachePath, {
        path: urlPath,
        tag,
        statusCode: res.statusCode,
        summary: 'No <body>',
        parent,
      });

      return res.statusCode;
    }

    result.scannedUrls[cachePath] = 'OK';
    await this.detectUrls(bodyContent, urlPath, async (url, elTag) => {
      if (url.hostname !== 'internal') {
        return;
      }

      await this.scanPath(result, url.pathname, elTag, urlPath);
    });

    return 200;
  }

  /**
   * @returns {Promise<UrlCrawlResult>}
   */
  async go() {
    const result = new UrlCrawlResult();

    // initiate the scan
    await this.scanPath(result, '/', 'root');

    return result;
  }

  /**
   * Detect URLs in a HTML string and call onUrl for each one
   *
   * @param {string} html The HTML to search for URLs
   * @param {string} pageUrl The URL of the page that contains the HTML
   * @param {(url: URL, elTag: string) => void} onUrl A callback that is called for each URL found
   */
  async detectUrls(html, pageUrl, onUrl) {
    HTML_HREF_ELEMENT_REGEX.lastIndex = 0;
    // find all <a ...> or <area ...> matches
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const match = HTML_HREF_ELEMENT_REGEX.exec(html);

      if (match === null) {
        break;
      }

      // find the href attribute
      HTML_HREF_ATTRIBUTE_REGEX.lastIndex = 0;
      const hrefMatch = HTML_HREF_ATTRIBUTE_REGEX.exec(match[0]);
      if (hrefMatch === null) {
        continue;
      }

      let url = hrefMatch[1];
      // to cheaply support quote attributes, we can convert it using JSON.parse
      if (url.charAt(0) === '"') {
        try {
          url = JSON.parse(
            url
              .replace(/\t/g, '\\t')
              .replace(/\r/g, '\\r')
              .replace(/\n/g, '\\n')
              .replace(/\f/g, '\\f')
          );
        } catch (e) {
          this.debug('Failed to parse attribute value', url, e);

          continue;
        }
      } else if (url.charAt(0) === "'") {
        // TODO, future improvement could be to support escaped quotes if required
        url = url.slice(1, -1);
      }

      const parsedUrl = new URL(url, `http://internal${pageUrl ?? ''}`);

      await onUrl(parsedUrl, match[1]);
    }
  }
};
