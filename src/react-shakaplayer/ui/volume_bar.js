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

// goog.provide('shaka.ui.VolumeBar');

// goog.require('shaka.ui.Element');
// goog.require('shaka.ui.Locales');
// goog.require('shaka.ui.Localization');

import Localization from './localization';
import Dom from '../lib/util/dom_utils';
import Element from './element';
import { Controls } from './controls';
import Enums from './enums';
import OverflowMenu from './overflow_menu';
import LanguageUtils from '../ui/language_utils';
import Constants from '../ui/constants';
import Locales from '../dist/locales';

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
export default class VolumeBar extends Element {
	/**
	 * @param {!HTMLElement} parent
	 * @param {!shaka.ui.Controls} controls
	 */
	constructor(parent, controls) {
		super(parent, controls);

		// This container is to support IE 11.  See detailed notes in
		// less/range_elements.less for a complete explanation.
		// TODO: Factor this into a range-element component.
		/** @private {!HTMLElement} */
		this.container_ = Dom.createHTMLElement('div');
		this.container_.classList.add('shaka-volume-bar-container');

		this.bar_ = /** @type {!HTMLInputElement} */ (document.createElement('input'));
		this.bar_.classList.add('shaka-volume-bar');
		this.bar_.setAttribute('type', 'range');
		// NOTE: step=any causes keyboard nav problems on IE 11.
		this.bar_.setAttribute('step', 'any');
		this.bar_.setAttribute('min', '0');
		this.bar_.setAttribute('max', '1');
		this.bar_.setAttribute('value', '0');

		this.container_.appendChild(this.bar_);
		this.parent.appendChild(this.container_);
		this.updateAriaLabel_();

		this.eventManager.listen(this.video, 'volumechange', () => {
			this.onVolumeStateChange_();
		});

		this.eventManager.listen(this.bar_, 'input', () => {
			this.onVolumeInput_();
		});

		this.eventManager.listen(this.localization, Localization.LOCALE_UPDATED, () => {
			this.updateAriaLabel_();
		});

		this.eventManager.listen(this.localization, Localization.LOCALE_CHANGED, () => {
			this.updateAriaLabel_();
		});

		// Initialize volume display with a fake event.
		this.onVolumeStateChange_();
	}

	/**
	 * @private
	 */
	onVolumeStateChange_() {
		if (this.video.muted) {
			this.bar_.value = 0;
		} else {
			this.bar_.value = this.video.volume;
		}

		// TODO: Can we do this with LESS?
		const gradient = ['to right'];
		gradient.push(Constants.VOLUME_BAR_VOLUME_LEVEL_COLOR + this.bar_.value * 100 + '%');
		gradient.push(Constants.VOLUME_BAR_BASE_COLOR + this.bar_.value * 100 + '%');
		gradient.push(Constants.VOLUME_BAR_BASE_COLOR + '100%');
		this.container_.style.background = 'linear-gradient(' + gradient.join(',') + ')';
	}

	/**
	 * @private
	 */
	onVolumeInput_() {
		this.video.volume = parseFloat(this.bar_.value);
		if (this.video.volume == 0) {
			this.video.muted = true;
		} else {
			this.video.muted = false;
		}
	}

	/**
	 * @private
	 */
	updateAriaLabel_() {
		this.bar_.setAttribute(Constants.ARIA_LABEL, this.localization.resolve(Locales.Ids.VOLUME));
	}
}

/**
 * @implements {shaka.extern.IUIElement.Factory}
 * @final
 */
VolumeBar.Factory = class {
	/** @override */
	create(rootElement, controls) {
		return new VolumeBar(rootElement, controls);
	}
};

Controls.registerElement('volume', new VolumeBar.Factory());
