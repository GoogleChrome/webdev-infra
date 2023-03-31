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

class AnnouncementBanner extends HTMLElement {
  constructor() {
    super();
    this.setAttribute('hidden', '');
  }

  connectedCallback() {
    if (!this.isBannerDisabled()) {
      this.removeAttribute('hidden');
      this.setAttribute('active', '');
      this.addEventListener('click', e => {
        if (
          /** @type {HTMLElement} */ (e.target).closest(
            '[data-banner-close-btn]'
          )
        ) {
          this.savePreference();
          this.close();
        }
      });
    }
  }

  isBannerDisabled() {
    const storageKey = this.getAttribute('storage-key');
    const bannerCtaElement = this.querySelector('a[href]');

    let bannerCtaUrl;
    let savedBannerCtaUrl;

    if(bannerCtaElement){
      bannerCtaUrl = bannerCtaElement.getAttribute('href');
    }
    if(storageKey){
      savedBannerCtaUrl = localStorage.getItem(storageKey);
    }

    return savedBannerCtaUrl === bannerCtaUrl;
  }

  savePreference() {
    const storageKey = this.getAttribute('storage-key') || '';
    const cta = this.querySelector('a[href]');
    if (cta) {
      const ctaUrl = cta.getAttribute('href') || '';
      localStorage.setItem(storageKey, ctaUrl);
    }
  }

  close() {
    this.setAttribute('hidden', 'true');
  }
}

customElements.define('announcement-banner', AnnouncementBanner);
