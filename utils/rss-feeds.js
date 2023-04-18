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
 * @fileoverview A single method that grabs the title, permalink, date,
 * and content from the arbitrary XML feeds, normalised and 
 * write a JSON file, containing the feed data needed for the updated author page,
 * to the src/site/_data/ path for both d.c.c and web.dev.
 */

const fs = require('fs');
const jsdom = require('jsdom');
const fetch = require('node-fetch');

/**
 * Grab the content from the target HTML tag
 * @param {HTMLElement} parent the HTMLElement of the article.
 * @param {string} target A name of the target HTML tag in the article.
 * @return {string} The content in the target HTML tag.
 */
const getElementsByTag = (parent, target) => {
  const collections = parent.getElementsByTagName(target);

  if (!collections.length) return '';

  return collections[0].innerHTML;
}

/**
 * Sort the feeds from all sources by date from newest to the oldest.
 * @param {Array} feeds A collection of the articles.
 * @return {Array} A collection of the articles, which are sorted by date.
 */
const sortFeeds = (feeds) => {
  return feeds.sort((a, b) => {
    const d1 = new Date(a.date);
    const d2 = new Date(b.date);
    
    return d2.valueOf() - d1.valueOf();
  });
}

/**
 * Grab the title, permalink, date, and content from the XML data.
 * @param {HTMLElement} entry A XML path.
 * @return {string} The permalink
 */
const getPermalink = (entry) => {
  const guid = getElementsByTag(entry, 'guid');
  const href = entry.getElementsByTagName('link')[0].getAttribute('href');

  return guid || href || '';
}

/**
 * Grab the title, permalink, date, and content from the XML data.
 * @param {string} xmlPath A XML path.
 * @return {Promise<object>} A list of feeds after extract the XML.
 */
const extractXML = async (xmlPath) => {
  const response = await fetch(xmlPath);
  const body = await response.text();
  const dom = await new jsdom.JSDOM(body);
  const feeds = [];

  const entryTagCollection = Array.from(
    dom.window.document.getElementsByTagName('entry')
  );
  const itemTagCollection = Array.from(
    dom.window.document.getElementsByTagName('item')
  );

  for (const entry of entryTagCollection) {
    const postData = { source: xmlPath };

    postData.title = getElementsByTag(entry, 'title');
    postData.summary = getElementsByTag(entry, 'summary');
    postData.date = getElementsByTag(entry, 'updated');

    postData.url = getPermalink(entry);
  
    feeds.push(postData);
  };

  for (const item of itemTagCollection) {
    const postData = { source: xmlPath };

    postData.title = getElementsByTag(item, 'title');
    postData.summary = getElementsByTag(item, 'description');
    postData.date = getElementsByTag(item, 'pubDate');

    postData.url = getPermalink(item);

    feeds.push(postData);
  };

  return feeds;
}

const externalPosts = async (authorsData) => {
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
  };

  fs.writeFileSync(
    'src/site/_data/external-posts.json', JSON.stringify(authorData)
  );
}

module.exports = {externalPosts};
