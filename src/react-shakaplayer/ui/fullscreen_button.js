/**
 * @license
 * Copyright 2019 Anish M Prasad
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

// goog.provide('shaka.ui.FullscreenButton');

// goog.require('shaka.ui.Element');
// goog.require('shaka.ui.Enums');
// goog.require('shaka.ui.Locales');
// goog.require('shaka.ui.Localization');
// goog.require('shaka.util.Dom');

import Locales from '../dist/locales';
import Localization from './localization';
import Dom from '../lib/util/dom_utils';
import Element from './element';
import { Controls } from './controls';
import Enums from './enums';
import Constants from '../ui/constants';

/*eslint-disable*/
window.shaka = window.shaka || {};
var shaka = window.shaka;
window.goog = window.goog || {};
var goog = window.goog;

/**
 * @extends {Element}
 * @final
 * @export
 */
class FullscreenButton extends Element {
	/**
	 * @param {!HTMLElement} parent
	 * @param {!Controls} controls
	 */
	constructor(parent, controls) {
		super(parent, controls);

		this.button_ = Dom.createHTMLElement('button');
		this.button_.classList.add('shaka-fullscreen-button');
		this.button_.classList.add('material-icons');

		// Don't show the button if fullscreen is not supported
		if (!document.fullscreenEnabled) {
			this.button_.classList.add('shaka-hidden');
		}

		this.button_.textContent = Enums.MaterialDesignIcons.FULLSCREEN;
		this.parent.appendChild(this.button_);
		this.updateAriaLabel_();

		/** @private {!HTMLElement} */
		this.videoContainer_ = this.controls.getVideoContainer();

		this.eventManager.listen(this.localization, Localization.LOCALE_UPDATED, () => {
			this.updateAriaLabel_();
		});

		this.eventManager.listen(this.localization, Localization.LOCALE_CHANGED, () => {
			this.updateAriaLabel_();
		});

		this.eventManager.listen(this.button_, 'click', () => {
			this.toggleFullScreen_();
		});

		if (screen.orientation) {
			this.eventManager.listen(screen.orientation, 'change', () => {
				this.onScreenRotation_();
			});
		}

		this.eventManager.listen(document, 'fullscreenchange', () => {
			this.updateIcon_();
			this.updateAriaLabel_();
		});
	}

	/**
	 * @private
	 */
	updateAriaLabel_() {
		const LocIds = Locales.Ids;
		const label = document.fullscreenElement ? LocIds.EXIT_FULL_SCREEN : LocIds.FULL_SCREEN;

		this.button_.setAttribute(Constants.ARIA_LABEL, this.localization.resolve(label));
	}

	/**
	 * @private
	 */
	updateIcon_() {
		this.button_.textContent = document.fullscreenElement
			? Enums.MaterialDesignIcons.EXIT_FULLSCREEN
			: Enums.MaterialDesignIcons.FULLSCREEN;
	}

	/**
	 * @private
	 */
	async toggleFullScreen_() {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			// If you are in PiP mode, leave PiP mode first.
			try {
				if (document.pictureInPictureElement) {
					await document.exitPictureInPicture();
				}
			} catch (error) {
				this.controls.dispatchEvent(
					new FakeEvent('error', {
						detail: error
					})
				);
			}
			await this.videoContainer_.requestFullscreen();
		}
	}

	/**
	 * When a mobile device is rotated to landscape layout, and the video is
	 * loaded, make the demo app go into fullscreen.
	 * Similarly, exit fullscreen when the device is rotated to portrait layout.
	 * @private
	 */
	onScreenRotation_() {
		if (!this.video || this.video.readyState == 0 || this.controls.getCastProxy().isCasting()) {
			return;
		}

		if (screen.orientation.type.includes('landscape') && !document.fullscreenElement) {
			this.videoContainer_.requestFullscreen();
		} else if (screen.orientation.type.includes('portrait') && document.fullscreenElement) {
			document.exitFullscreen();
		}
	}
}

/**
 * @implements {shaka.extern.IUIElement.Factory}
 * @final
 */
FullscreenButton.Factory = class {
	/** @override */
	create(rootElement, controls) {
		return new FullscreenButton(rootElement, controls);
	}
};

Controls.registerElement('fullscreen', new FullscreenButton.Factory());
