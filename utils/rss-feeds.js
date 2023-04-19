/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Export a single method that grabs the title, permalink, date,
 * and content from the arbitrary XML feeds, normalised and
 * write a JSON file, containing the feed data needed for the updated author page,
 * to the specific path for both d.c.c and web.dev.
 */

const fs = require('fs');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

/**
 * Sort the feeds from all sources by date from newest to the oldest.
 * @param {Array} feeds A collection of the articles.
 * @return {Array<Object>} A collection of the articles, which are sorted by date.
 */
const sortFeeds = feeds => {
  return feeds.sort((a, b) => {
    const d1 = new Date(a.date);
    const d2 = new Date(b.date);

    return d2.getTime() - d1.getTime();
  });
};

/**
 * Extract the permalink from the entry in XML feeds.
 * @param {cheerio.CheerioAPI} $ A querying function, bound to a document created from the provided markup.
 * @param {cheerio.Element} entry A target element to extract a permalink.
 * @return {string} The permalink.
 */
const getPermalink = ($, entry) => {
  const guid = $('guid', entry).text();
  const href = $('link', entry).attr('href');

  return guid || href || '';
};

/**
 * Fetch the XML data from the specific URL. Returns the XML content,
 * or warns "Failed to fetch the XML files." and returns an empty string if there was a problem.
 * @param {string} xmlPath A XML url.
 * @return {Promise<string>} the XML content.
 */
const getXMLContent = async xmlPath => {
  try {
    const response = await fetch(xmlPath);
    const body = await response.text();
    return body;
  } catch (err) {
    console.warn('Failed to fetch the XML files.');
    return '';
  }
};

/**
 * Grab the title, permalink, date, and content from the RSS feeds.
 * @param {string} xmlPath A XML url.
 * @return {Promise<Array<Object>>} A list of feeds after extract the XML data.
 */
const extractXML = async xmlPath => {
  const body = await getXMLContent(xmlPath);

  if (!body) return [];

  const $ = await cheerio.load(body, {
    xml: {
      // @ts-ignore
      normalizeWhitespace: true,
    },
  });

  const feeds = [];
  $('entry').each((_, entry) => {
    const postData = {source: xmlPath};
    postData.url = getPermalink($, entry);

    postData.title = $('title', entry).text();
    postData.date = $('updated', entry).text();
    postData.summary = $('summary', entry).text();

    feeds.push(postData);
  });

  $('item').each((_, item) => {
    const postData = {source: xmlPath};
    postData.url = getPermalink($, item);

    postData.title = $('title', item).text();
    postData.date = $('pubDate', item).text();
    postData.summary = $('description', item).text();

    feeds.push(postData);
  });

  return feeds;
};

const externalPosts = async (authorsDataPath, exportFeedsToPath) => {
  const authorsData = fs.readFileSync(authorsDataPath, 'utf8');
  const authorData = JSON.parse(authorsData);
  const sortedFeeds = [];

  for (const author in authorData) {
    const externalPath = authorData[author].external;
    authorData[author]['feeds'] = [];

    if (!externalPath?.length) break;

    for (const path of externalPath) {
      const feeds = await extractXML(path.url);
      sortedFeeds.push(...feeds);
    }

    authorData[author].feeds = sortFeeds(sortedFeeds);
  }

  fs.writeFileSync(
    exportFeedsToPath,
    JSON.stringify(authorData)
  );
};

module.exports = {externalPosts};
