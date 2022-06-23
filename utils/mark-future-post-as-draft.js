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

/**
 * A helper to mark posts whose date are in the future as drafts.
 *
 * This allows authors to commit posts to GitHub and have them appear "live" at
 * a later date. It relies on the fact that our sites deploy automatically via
 * a regular cadence.
 *
 * Authors should note that because the deployment window is fairly large, it's
 * not possible to ensure a post will go live at an exact point in time; just
 * that it should go live at some point after the next periodic deployment.
 *
 * @param {EleventyCollectionItemPartial} item
 * @param {number} currentTimeInMS
 * @return {EleventyCollectionItemPartial}
 */
const markFuturePostAsDraft = (item, currentTimeInMS) => {
  if (item.date.getTime() > currentTimeInMS) {
    console.log(
      `${item.url} has a future publication date of ` +
        `${item.date.toUTCString()}, and is treated as a draft.`
    );
    item.data.draft = true;
  }
  return item;
};

module.exports = {markFuturePostAsDraft};
