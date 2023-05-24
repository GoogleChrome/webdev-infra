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
 * and content from the arbitrary XML feeds, normalise and return the feeds
 * which contain data needed for the updated author page.
 */

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const striptags = require('striptags');
const excerpt = require('excerpt-html');

/**
 * Sort the feeds from all sources by date from the newest to the oldest.
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
 * or warns `Failed to fetch ${url}` and returns an empty string if there was a problem.
 * @param {string} url A XML url.
 * @return {Promise<string>} the XML content.
 */
const getFeed = async url => {
  try {
    const response = await fetch(url);
    const body = await response.text();
    return body;
  } catch (err) {
    console.warn(`Failed to fetch ${url}`);
    return '';
  }
};

/**
 * Grab the title, permalink, date, and content from the RSS feeds.
 * @param {{url: string, label: string}} external An author external data.
 * @return {Promise<Array<Object>>} A list of feeds after extract the XML data.
 */
const extractPosts = async external => {
  const body = await getFeed(external.url);

  if (!body) return [];

  const $ = await cheerio.load(body, {
    xml: {
      // @ts-ignore
      normalizeWhitespace: true,
    },
  });

  const feeds = [];
  $('item, entry').each((_, post) => {
    const postData = {source: external.label};
    postData.url = getPermalink($, post);
    postData.title = $('title', post).text();

    if (post.name === 'entry') {
      postData.date = $('updated', post).text();
      postData.summary = $('summary', post).text();
    } else {
      postData.date = $('pubDate', post).text();
      postData.summary = $('description', post).text();
    }

    if (!postData.summary) {
      let content = $('content', post).text();
      if (!content) content = $('content\\:encoded', post).text();
      if (content) {
        content = striptags(content);
        // Replace all line-break characters with a single space, as excerpt-html
        // would otherwise stop after the first break.
        content = content.replace(/(?:\r\n|\r|\n)/g, ' ');
        postData.summary = excerpt(content);
      }
    }

    feeds.push(postData);
  });

  return feeds;
};

/**
 * @param {import('types').Feeds} feeds
 * @returns {Promise<import('types').AuthorsFeedData>}
 */
const rssFeeds = async feeds => {
  const authorFeeds = [];

  for (const author in feeds) {
    const allPosts = [];
    const feedPaths = feeds[author];

    if (!feedPaths?.length) break;

    for (const path of feedPaths) {
      const posts = await extractPosts(path);
      allPosts.push(...posts);
    }

    const /** @type {import('types').AuthorFeedData} */ feedsObject = {};
    feedsObject[author] = sortFeeds(allPosts);
    authorFeeds.push(feedsObject);
  }

  return authorFeeds;
};

module.exports = {rssFeeds};
