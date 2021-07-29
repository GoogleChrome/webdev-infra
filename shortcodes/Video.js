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

const mime = require('browser-media-mime-type');
const {html} = require('common-tags');
const path = require('path');
const url = require('url');
const {imgix} = require('../filters/imgix');

const GCS_URL = 'https://storage.googleapis.com';

/**
 * @param {string} bucket GCP bucket name
 * @param {string} src Prefix for video src
 * @return {string} Video URL
 */
const generateSource = (bucket, src) => {
  const extname = path.extname(src);
  let type = mime(extname);
  if (type === 'video/quicktime') {
    type = 'video/mp4';
  }
  src = new url.URL(path.join(bucket, src), GCS_URL).href;
  return html`
    <source src="${src}" ${type ? `type="${type}"` : ''} />
  `.replace(/\n/g, '');
};

/**
 * @param {string} bucket GCP nucket name
 * @param {string} domain imgix domain
 * @returns {(args: import('types').VideoArgs) => string} Video shortcode.
 */
const Video = function (bucket, domain) {
  /**
   * @param {import('types').VideoArgs} args Named arguments
   * @returns {string}
   */
  const returnedFunction = function (args) {
    const checkHereIfError = `ERROR IN ${
      // @ts-ignore: `this` has type of `any`
      this.page ? this.page.inputPath : 'UNKNOWN'
    }`;

    if (typeof args.src === 'string') {
      args.src = [args.src];
    }

    if (args.src.length === 0) {
      throw new Error(`${checkHereIfError}: no src provided`);
    }

    const {
      autoplay,
      autoPictureInPicture,
      class: className,
      controls,
      disablePictureInPicture,
      height,
      id,
      loop,
      linkTo,
      muted,
      playsinline,
      poster,
      preload,
      src,
      width,
    } = args;

    let videoTag = html`<video
      ${autoplay ? 'autoplay' : ''}
      ${autoPictureInPicture ? 'autoPictureInPicture' : ''}
      ${className ? `class="${className}"` : ''}
      ${controls ? 'controls' : ''}
      ${disablePictureInPicture ? 'disablePictureInPicture' : ''}
      ${height ? `height="${height}"` : ''}
      ${id ? `id="${id}"` : ''}
      ${loop ? 'loop' : ''}
      ${muted || autoplay ? 'muted' : ''}
      ${playsinline ? 'playsinline' : ''}
      ${poster ? `poster="${imgix(domain)(poster)}"` : ''}
      ${preload ? `preload="${preload}"` : ''}
      ${width ? `width="${width}"` : ''}
    >
      ${src.map(s => generateSource(bucket, s))}
    </video>`;

    if (linkTo) {
      videoTag = html`<a
        href="${new url.URL(path.join(bucket, src[0]), GCS_URL).href}"
        >${videoTag}</a
      >`;
    }

    return videoTag.replace(/\n/g, '');
  };

  return returnedFunction;
};

module.exports = {Video};
