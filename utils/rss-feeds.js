/*
 * Copyright 2021 Google LLC
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

const fs = require('fs');
const jsdom = require('jsdom');
const fetch = require('node-fetch');
const authorsData = fs.readFileSync('src/site/_data/authorsData.json', 'utf8');

const getElementsByTag = (parent, target) => {
  const collections = parent.getElementsByTagName(target);

  if (!collections.length) return '';

  return collections[0].innerHTML;
}

/**
 * Grab the title, permalink, date, and content from the XML data.
 * @param {string} xmlPath A XML path.
 * @return {Promise<object>} A list of feeds after extract the XML.
 */
const extractionXML = async (xmlPath) => {
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
    postData.date = getElementsByTag(entry, 'updated');
    postData.summary = getElementsByTag(entry, 'summary');
    postData.url = entry.getElementsByTagName('link')[0].getAttribute('href');

    feeds.push(postData);
  };
    
  for (const item of itemTagCollection) {
    const postData = { source: xmlPath };

    postData.title = getElementsByTag(item, 'title');
    postData.date = getElementsByTag(item, 'pubDate');
    postData.summary = getElementsByTag(item, 'description');
    postData.url = item.querySelectorAll('link')[0].innerHTML; // TO DO: clean up link tag first

    feeds.push(postData);
  };

  return feeds;
}

const externalPosts = async () => {
  const authorData = JSON.parse(authorsData);

  for (const author in authorData) {
    const externalPath = authorData[author].external;
    authorData[author]['feeds'] = [];

    if (!externalPath?.length) break;

    for (const path of externalPath) {
      const feeds = await extractionXML(path.url);
      authorData[author].feeds = [...authorData[author].feeds, ...feeds];
    }
  };

  fs.writeFileSync(
    'src/site/_data/external-posts.json', JSON.stringify(authorData)
  );
}

module.exports = {externalPosts};
