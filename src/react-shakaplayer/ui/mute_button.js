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

// goog.provide('shaka.ui.MuteButton');

// goog.require('shaka.ui.Element');
// goog.require('shaka.ui.Enums');
// goog.require('shaka.ui.Locales');
// goog.require('shaka.ui.Localization');
// goog.require('shaka.util.Dom');

import Localization from './localization';
import Dom from '../lib/util/dom_utils';
import Element from './element';
import { Controls } from './controls';
import Enums from './enums';

/*eslint-disable*/
window.shaka = window.shaka || {};
var shaka = window.shaka;
window.goog = window.goog || {};
var goog = window.goog;

/**
 * @extends {shaka.ui.Element}
 * @final
 * @export
 */
class MuteButton extends Element {
	/**
	 * @param {!HTMLElement} parent
	 * @param {!shaka.ui.Controls} controls
	 */
	constructor(parent, controls) {
		super(parent, controls);

		/** @private {!HTMLElement} */
		this.button_ = Dom.createHTMLElement('button');
		this.button_.classList.add('shaka-mute-button');
		this.button_.classList.add('material-icons');
		this.button_.textContent = Enums.MaterialDesignIcons.MUTE;
		this.parent.appendChild(this.button_);
		this.updateAriaLabel_();

		this.eventManager.listen(this.localization, Localization.LOCALE_UPDATED, () => {
			this.updateAriaLabel_();
		});

		this.eventManager.listen(this.localization, Localization.LOCALE_CHANGED, () => {
			this.updateAriaLabel_();
		});

		this.eventManager.listen(this.button_, 'click', () => {
			this.video.muted = !this.video.muted;
		});

		this.eventManager.listen(this.video, 'volumechange', () => {
			this.updateAriaLabel_();
			this.updateIcon_();
		});
	}

	/**
	 * @private
	 */
	updateAriaLabel_() {
		const LocIds = Locales.Ids;
		const label = this.video.muted ? LocIds.UNMUTE : LocIds.MUTE;

		this.button_.setAttribute(Constants.ARIA_LABEL, this.localization.resolve(label));
	}

	/**
	 * @private
	 */
	updateIcon_() {
		this.button_.textContent = this.video.muted ? Enums.MaterialDesignIcons.UNMUTE : Enums.MaterialDesignIcons.MUTE;
	}
}

/**
 * @implements {shaka.extern.IUIElement.Factory}
 * @final
 */
MuteButton.Factory = class {
	/** @override */
	create(rootElement, controls) {
		return new MuteButton(rootElement, controls);
	}
};

Controls.registerElement('mute', new MuteButton.Factory());
