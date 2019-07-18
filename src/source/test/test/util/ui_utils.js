/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


goog.provide('shaka.test.UiUtils');


shaka.test.UiUtils = class {
  /**
   * @param {!HTMLElement} videoContainer
   * @param {!HTMLMediaElement} video
   * @param {!Object=} config
   * @return {!shaka.ui.Overlay}
   */
  static createUIThroughAPI(videoContainer, video, config) {
    const player = new shaka.Player(video);
    // Create UI
    config = config || {};
    const ui = new shaka.ui.Overlay(player, videoContainer, video);
    ui.configure(config);
    return ui;
  }


  /**
   * @param {!Array.<!Element>} containers
   * @param {!Array.<!Element>} videos
   * @suppress {visibility}
   */
  static createUIThroughDOMAutoSetup(containers, videos) {
    for (const container of containers) {
      container.setAttribute('data-shaka-player-container', '');
    }

    for (const video of videos) {
      video.setAttribute('data-shaka-player', '');
    }

    // Call UI's private method to scan the page for shaka
    // elements and create the UI.
    shaka.ui.Overlay.scanPageForShakaElements_();
  }

  /**
   * @param {!HTMLElement} parent
   * @param {string} className
   */
  static confirmElementFound(parent, className) {
    const elements = parent.getElementsByClassName(className);
    expect(elements.length).toBe(1);
  }

  /**
   * @param {!HTMLElement} parent
   * @param {string} className
   */
  static confirmElementMissing(parent, className) {
    const elements = parent.getElementsByClassName(className);
    expect(elements.length).toBe(0);
  }


  /**
   * Thoroughly clean up after UI-related tests.
   *
   * The UI tests can create lots of DOM elements (including videos) that are
   * easy to lose track of.  This is a universal cleanup system to avoid leaving
   * anything behind.
   */
  static async cleanupUI() {
    // If we don't clean up the UI, these tests could pollute the environment
    // for other tests that run later, causing failures in unrelated tests.
    // This is causing particular issues on Tizen.
    const containers =
        document.querySelectorAll('[data-shaka-player-container]');

    const destroys = [];
    for (const container of containers) {
      const ui = /** @type {shaka.ui.Overlay} */(container['ui']);

      // Destroying the UI destroys the controls and player inside.
      destroys.push(ui.destroy());
    }
    await Promise.all(destroys);

    // Now remove all the containers from the DOM.
    for (const container of containers) {
      container.parentElement.removeChild(container);
    }
  }


  /**
   * @param {!Element} cssLink
   */
  static async setupCSS(cssLink) {
    const head = document.head;
    cssLink.type = 'text/css';
    cssLink.rel = 'stylesheet/less';
    cssLink.href ='/base/ui/controls.less';
    head.appendChild(cssLink);

    // LESS script has been added at the beginning of the test pass
    // (in test/test/boot.js). This tells it that we've added a new
    // stylesheet, so LESS can process it.
    less.registerStylesheetsImmediately();
    await less.refresh(/* reload */ true,
        /* modifyVars*/ false, /* clearFileCache */ false);
  }
};
