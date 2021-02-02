/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License t
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import test from 'ava';
import {formatCommentLine} from '../../../lib/types/comment.js';
import {resolveLink} from '../../../lib/types/resolve.js';
import * as symbolTypes from '../../../types/symbol.js';
import {parse} from './helper.js';


/** @type {symbolTypes.CommentHelper<number>} */
const failureHelper = {
  resolveExistingHref() { throw new Error('unimplemented'); },
  resolveLink() { throw new Error('unimplemented'); },
  generateHref() { throw new Error('unimplemented'); },
};


test('formatCommentLine @link', t => {
  const helper = Object.assign({}, failureHelper, {
    /** @return {number=} */
    resolveLink(id) {
      if (id === 'another.Foo') {
        return 123;
      }
      throw new Error(`unexpected arg: ${id}`);
    },
    generateHref(num) {
      if (num === 123) {
        return 'test-link.html';
      }
      throw new Error(`unexpected arg: ${num}`);
    },
  });

  t.is(
    formatCommentLine(`Hello {@link another.Foo text}`, helper),
    'Hello <a href="test-link.html">text</a>',
  );

  t.is(
    formatCommentLine(`Hello {@link another.Foo}`, helper),
    'Hello <a href="test-link.html"><code>another.Foo</code></a>',
  );
});

test('formatCommentLine rewrite', t => {
  // TODO(samthor): Test rewriting existing URLs.
});

test('formatComment', t => {
  // TODO(samthor): Ensure we end up with a <p></p> at the end of this.
});