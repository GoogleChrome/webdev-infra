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

const ImgixClient = require('@imgix/js-core');
const {html, safeHtml} = require('common-tags');
const path = require('path');
const {imgix} = require('../filters/imgix');
const {isSimpleImg} = require('../utils/is-simple-img');

const MIN_WIDTH = 200;
const MAX_WIDTH = 800;
// The highest device pixel ratio we'll generate srcsets for.
const MAX_DPR = 2; // @2x

/**
 * Validates that in image is in our storage bucket so that users do not
 * try to use local images with the shortcodes.
 *
 * @param {string} src
 * @returns {boolean}
 */
const IS_UPLOADED_IMG = src => {
  const extname = path.extname(src);
  if (extname.length === 0 && extname === '.') {
    return false;
  }
  return /^image\/[A-Za-z0-9]*\/[A-Za-z0-9-_]*\.(gif|jpe?g|tiff?|png|webp|bmp|svg|ico)$/.test(
    src.toLowerCase()
  );
};

/**
 * Takes an imgix url or path and generates an `<img>` element with `srcset`.
 *
 * @param {string} domain imgix domain
 * @return {(args: wd.ImgArgs) => string} Img shortcode
 */
function Img(domain) {
  const client = new ImgixClient({domain, includeLibraryParam: false});

  /**
   * Takes an imgix url or path and generates an `<img>` element with `srcset`.
   *
   * @param {wd.ImgArgs} args Named arguments
   * @return {string}
   */
  const returnedFunction = function (args) {
    const {
      alt,
      class: className,
      height,
      id,
      linkTo,
      src,
      style,
      width,
      params,
    } = args;
    let {decoding, loading, sizes, options} = args;

    const checkHereIfError = `ERROR IN ${
      // @ts-ignore: `this` has type of `any`
      this.page ? this.page.inputPath : 'UNKNOWN'
    }, IMG ${src}`;

    if (src === undefined || typeof src !== 'string') {
      throw new Error(`${checkHereIfError}: src is a required argument`);
    }

    if (!IS_UPLOADED_IMG(src)) {
      throw new Error(
        `${checkHereIfError}: invalid src provided (was this added via the uploader?)`
      );
    }

    if (alt === undefined || typeof alt !== 'string') {
      throw new Error(
        `${checkHereIfError}: alt text must be a string, received a ${typeof alt}`
      );
    }

    if (height === undefined || isNaN(Number(height))) {
      throw new Error(`${checkHereIfError}: height must be a number`);
    }
    const heightAsNumber = parseInt(height, 10);

    if (width === undefined || isNaN(Number(width))) {
      throw new Error(`${checkHereIfError}: width must be a number`);
    }
    const widthAsNumber = parseInt(width, 10);

    if (decoding === undefined) {
      decoding = 'async';
    }

    if (loading === undefined) {
      loading = 'lazy';
    }

    const doNotUseSrcset = isSimpleImg(src, params);

    // https://github.com/imgix/imgix-core-js#imgixclientbuildsrcsetpath-params-options
    options = {
      // Use the image width as the lower bound.
      // Note this may be smaller than MIN_WIDTH.
      minWidth: Math.min(MIN_WIDTH, widthAsNumber),
      // Use image width * dpr as the upper bound, maxed out at 1,600px.
      maxWidth: Math.min(MAX_WIDTH * MAX_DPR, widthAsNumber * MAX_DPR),
      widthTolerance: 0.07,
      ...options,
    };
    // https://docs.imgix.com/apis/rendering
    const fullSrc = imgix(domain)(src, params);
    const srcset = client.buildSrcSet(src, params, options);
    if (sizes === undefined) {
      if (widthAsNumber >= MAX_WIDTH) {
        sizes = `(min-width: ${MAX_WIDTH}px) ${MAX_WIDTH}px, calc(100vw - 48px)`;
      } else {
        sizes = `(min-width: ${widthAsNumber}px) ${widthAsNumber}px, calc(100vw - 48px)`;
      }
    }

    const hasValidAlt = alt !== undefined;

    let imgTag = html` <img
      ${hasValidAlt ? `alt="${safeHtml`${alt}`}"` : ''}
      ${className ? `class="${className}"` : ''}
      ${decoding ? `decoding="${decoding}"` : ''}
      height="${heightAsNumber}"
      ${id ? `id="${id}"` : ''}
      ${loading ? `loading="${loading}"` : ''}
      ${doNotUseSrcset ? '' : `sizes="${sizes}"`}
      src="${fullSrc}"
      ${doNotUseSrcset ? '' : `srcset="${srcset}"`}
      ${style ? `style="${style}"` : ''}
      width="${widthAsNumber}"
    />`;

    if (linkTo) {
      imgTag = html`<a href="${fullSrc}">${imgTag}</a>`;
    }

    return imgTag.replace(/\n/g, '');
  };

  return returnedFunction;
}

module.exports = {Img};
