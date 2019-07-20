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


goog.provide('shaka.ui.Overlay');

goog.require('goog.asserts');
goog.require('shaka.Deprecate');
goog.require('shaka.polyfill');
goog.require('shaka.ui.Controls');
goog.require('shaka.ui.TextDisplayer');
goog.require('shaka.util.Platform');


/**
 * @implements {shaka.util.IDestroyable}
 * @export
 */
shaka.ui.Overlay = class {
  /**
   * @param {!shaka.Player} player
   * @param {!HTMLElement} videoContainer
   * @param {!HTMLMediaElement} video
   */
  constructor(player, videoContainer, video) {
    /** @private {shaka.Player} */
    this.player_ = player;

    /** @private {!shaka.extern.UIConfiguration} */
    this.config_ = this.defaultConfig_();

    // Make sure this container is discoverable and that the UI can be reached
    // through it.
    videoContainer['dataset']['shakaPlayerContainer'] = '';
    videoContainer['ui'] = this;

    // Tag the container for mobile platforms, to allow different styles.
    if (this.isMobile()) {
      videoContainer.classList.add('shaka-mobile');
    }

    /** @private {shaka.ui.Controls} */
    this.controls_ = new shaka.ui.Controls(
        player, videoContainer, video, this.config_);

    // Run the initial setup so that no configure() call is required for default
    // settings.
    this.configure({});
  }


  /**
   * @override
   * @export
   */
  async destroy() {
    await this.controls_.destroy();
    this.controls_ = null;

    await this.player_.destroy();
    this.player_ = null;
  }


  /**
   * Detects if this is a mobile platform, in case you want to choose a
   * different UI configuration on mobile devices.
   *
   * @return {boolean}
   * @export
   */
  isMobile() {
    return shaka.util.Platform.isMobile();
  }


  /**
   * @return {!shaka.extern.UIConfiguration}
   * @export
   */
  getConfiguration() {
    const ret = this.defaultConfig_();
    shaka.util.ConfigUtils.mergeConfigObjects(
        ret, this.config_, this.defaultConfig_(),
        /* overrides (only used for player config)*/ {}, /* path */ '');
    return ret;
  }


  /**
   * @param {string|!Object} config This should either be a field name or an
   *   object following the form of {@link shaka.extern.UIConfiguration}, where
   *   you may omit any field you do not wish to change.
   * @param {*=} value This should be provided if the previous parameter
   *   was a string field name.
   * @export
   */
  configure(config, value) {
    goog.asserts.assert(typeof(config) == 'object' || arguments.length == 2,
        'String configs should have values!');

    // ('fieldName', value) format
    if (arguments.length == 2 && typeof(config) == 'string') {
      config = shaka.util.ConfigUtils.convertToConfigObject(config, value);
    }

    goog.asserts.assert(typeof(config) == 'object', 'Should be an object!');

    shaka.util.ConfigUtils.mergeConfigObjects(
        this.config_, config, this.defaultConfig_(),
        /* overrides (only used for player config)*/ {}, /* path */ '');

    // If a cast receiver app id has been given, add a cast button to the UI
    if (this.config_.castReceiverAppId &&
        !this.config_.overflowMenuButtons.includes('cast')) {
      this.config_.overflowMenuButtons.push('cast');
    }

    goog.asserts.assert(this.player_ != null, 'Should have a player!');

    this.controls_.configure(this.config_);

    this.controls_.dispatchEvent(new shaka.util.FakeEvent('uiupdated'));
  }


  /**
   * @return {shaka.Player}
   * @export
   * @deprecated Use getControls().getPlayer() instead.
   */
  getPlayer() {
    shaka.Deprecate.deprecateFeature(
        2, 6,
        'ui.Overlay.getPlayer()',
        'Please use getControls().getPlayer() instead.');

    return this.controls_.getPlayer();
  }


  /**
   * @return {shaka.ui.Controls}
   * @export
   */
  getControls() {
    return this.controls_;
  }


  /**
   * Enable or disable the custom controls.
   *
   * @param {boolean} enabled
   * @export
   */
  setEnabled(enabled) {
    this.controls_.setEnabledShakaControls(enabled);
  }


  /**
   * @return {!shaka.extern.UIConfiguration}
   * @private
   */
  defaultConfig_() {
    return {
      controlPanelElements: [
        'time_and_duration',
        'spacer',
        'mute',
        'volume',
        'fullscreen',
        'overflow_menu',
      ],
      overflowMenuButtons: [
        'captions',
        'quality',
        'language',
        'picture_in_picture',
        'cast',
      ],
      addSeekBar: true,
      castReceiverAppId: '',
    };
  }


  /**
   * @private
   */
  static scanPageForShakaElements_() {
    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();
    // Check to see if the browser supports the basic APIs Shaka needs.
    if (!shaka.Player.isBrowserSupported()) {
      shaka.log.error('Shaka Player does not support this browser. ' +
          'Please see https://tinyurl.com/y7s4j9tr for the list of ' +
          'supported browsers.');

      // After scanning the page for elements, fire a special "loaded" event for
      // when the load fails. This will allow the page to react to the failure.
      shaka.ui.Overlay.dispatchLoadedEvent_('shaka-ui-load-failed');
      return;
    }

    // Look for elements marked 'data-shaka-player-container'
    // on the page. These will be used to create our default
    // UI.
    const containers = document.querySelectorAll(
        '[data-shaka-player-container]');

    // Look for elements marked 'data-shaka-player'. They will
    // either be used in our default UI or with native browser
    // controls.
    const videos = document.querySelectorAll(
        '[data-shaka-player]');

    if (!videos.length && !containers.length) {
      // No elements have been tagged with shaka attributes.
    } else if (videos.length && !containers.length) {
      // Just the video elements were provided.
      for (const video of videos) {
        goog.asserts.assert(video.tagName.toLowerCase() == 'video',
            'Should be a video element!');

        const container = document.createElement('div');
        const videoParent = video.parentElement;
        videoParent.replaceChild(container, video);
        container.appendChild(video);

        let castAppId = '';

        // If cast receiver application id was provided, pass it to the
        // UI constructor.
        if (video['dataset'] && video['dataset']['shakaPlayerCastReceiverId']) {
          castAppId = video['dataset']['shakaPlayerCastReceiverId'];
        }

        const ui = shaka.ui.Overlay.createUI_(
            shaka.util.Dom.asHTMLElement(container),
            shaka.util.Dom.asHTMLMediaElement(video));

        ui.configure({castReceiverAppId: castAppId});

        if (shaka.util.Dom.asHTMLMediaElement(video).controls) {
          ui.getControls().setEnabledNativeControls(true);
        }
      }
    } else {
      for (const container of containers) {
        goog.asserts.assert(container.tagName.toLowerCase() == 'div',
            'Container should be a div!');

        let castAppId = '';

        // Cast receiver id can be specified on either container or video.
        // It should not be provided on both. If it was, we will use the last
        // one we saw.
        if (container['dataset'] &&
            container['dataset']['shakaPlayerCastReceiverId']) {
          castAppId = container['dataset']['shakaPlayerCastReceiverId'];
        }

        let currentVideo = null;
        for (const video of videos) {
          goog.asserts.assert(video.tagName.toLowerCase() == 'video',
              'Should be a video element!');
          if (video.parentElement == container) {
            currentVideo = video;
            break;
          }
        }

        if (!currentVideo) {
          currentVideo = document.createElement('video');
          currentVideo.setAttribute('playsinline', '');
          container.appendChild(currentVideo);
        }

        if (currentVideo['dataset'] &&
            currentVideo['dataset']['shakaPlayerCastReceiverId']) {
          castAppId = currentVideo['dataset']['shakaPlayerCastReceiverId'];
        }
        const ui = shaka.ui.Overlay.createUI_(
            shaka.util.Dom.asHTMLElement(container),
            shaka.util.Dom.asHTMLMediaElement(currentVideo));

        ui.configure({castReceiverAppId: castAppId});
      }
    }

    // After scanning the page for elements, fire the "loaded" event.  This will
    // let apps know they can use the UI library programmatically now, even if
    // they didn't have any Shaka-related elements declared in their HTML.
    shaka.ui.Overlay.dispatchLoadedEvent_('shaka-ui-loaded');
  }


  /**
   * @param {string} eventName
   * @private
   */
  static dispatchLoadedEvent_(eventName) {
    // "Event" is not constructable on IE, so we use this CustomEvent pattern.
    const uiLoadedEvent = /** @type {!CustomEvent} */(
      document.createEvent('CustomEvent'));
    uiLoadedEvent.initCustomEvent(eventName, false, false, null);

    document.dispatchEvent(uiLoadedEvent);
  }


  /**
   * @param {!HTMLElement} container
   * @param {!HTMLMediaElement} video
   * @return {!shaka.ui.Overlay}
   * @private
   */
  static createUI_(container, video) {
    const player = new shaka.Player(video);
    const ui = new shaka.ui.Overlay(player, container, video);

    // If the browser's native controls are disabled, use UI TextDisplayer.
    // Arrow functions cannot be used with "new", so the factory must use
    // a "function" function.
    if (!video.controls) {
      // eslint-disable-next-line no-restricted-syntax
      const textDisplayer = function() {
        return new shaka.ui.TextDisplayer(video, container);
      };
      player.configure('textDisplayFactory', textDisplayer);
    }

    container['ui'] = ui;
    video['ui'] = ui;
    return ui;
  }
};

if (document.readyState == 'complete') {
  // Don't fire this event synchronously.  In a compiled bundle, the "shaka"
  // namespace might not be exported to the window until after this point.
  Promise.resolve().then(shaka.ui.Overlay.scanPageForShakaElements_);
} else {
  window.addEventListener('load', shaka.ui.Overlay.scanPageForShakaElements_);
}

