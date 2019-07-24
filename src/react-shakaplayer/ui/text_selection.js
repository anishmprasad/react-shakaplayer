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

// goog.provide('shaka.ui.TextSelection');

// goog.require('shaka.ui.Element');
// goog.require('shaka.ui.Enums');
// goog.require('shaka.ui.LanguageUtils');
// goog.require('shaka.ui.Locales');
// goog.require('shaka.ui.Localization');
// goog.require('shaka.ui.OverflowMenu');
// goog.require('shaka.util.Dom');

import Locales from '../dist/locales';
import Localization from './localization';
import Dom from '../lib/util/dom_utils';
import Element from './element';
import { Controls } from './controls';
import Enums from './enums';
import OverflowMenu from './overflow_menu';
import LanguageUtils from '../ui/language_utils';
import Utils from '../ui/ui_utils';
import FakeEvent from '../lib/util/fake_event';
import Constants from '../ui/constants';

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
export default class TextSelection extends Element {
	/**
	 * @param {!HTMLElement} parent
	 * @param {!shaka.ui.Controls} controls
	 */
	constructor(parent, controls) {
		super(parent, controls);

		this.addCaptionButton_();

		this.addTextLangMenu_();

		this.eventManager.listen(this.localization, Localization.LOCALE_UPDATED, () => {
			this.updateLocalizedStrings_();
			// If captions/subtitles are off, this string needs localization.
			// TODO: is there a more efficient way of updating just the strings
			// we need instead of running the whole language update?
			this.updateTextLanguages_();
		});

		this.eventManager.listen(this.localization, Localization.LOCALE_CHANGED, () => {
			this.updateLocalizedStrings_();
			// If captions/subtitles are off, this string needs localization.
			// TODO: is there a more efficient way of updating just the strings
			// we need instead of running the whole language update?
			this.updateTextLanguages_();
		});

		this.eventManager.listen(this.player, 'texttrackvisibility', () => {
			this.onCaptionStateChange_();
		});

		this.eventManager.listen(this.captionButton_, 'click', () => {
			this.onCaptionClick_();
		});

		this.eventManager.listen(this.player, 'textchanged', () => {
			this.updateTextLanguages_();
		});

		this.eventManager.listen(this.player, 'trackschanged', () => {
			this.onTracksChanged_();
		});

		// Initialize caption state with a fake event.
		this.onCaptionStateChange_();

		// Set up all the strings in the user's preferred language.
		this.updateLocalizedStrings_();

		this.updateTextLanguages_();
	}

	/**
	 * @private
	 */
	addCaptionButton_() {
		/** @private {!HTMLElement} */
		this.captionButton_ = Dom.createHTMLElement('button');
		this.captionButton_.classList.add('shaka-caption-button');

		/** @private {!HTMLElement} */
		this.captionIcon_ = Dom.createHTMLElement('i');
		this.captionIcon_.classList.add('material-icons');
		this.captionIcon_.textContent = Enums.MaterialDesignIcons.CLOSED_CAPTIONS;

		if (this.player && this.player.isTextTrackVisible()) {
			this.captionButton_.setAttribute('aria-pressed', 'true');
		} else {
			this.captionButton_.setAttribute('aria-pressed', 'false');
		}
		this.captionButton_.appendChild(this.captionIcon_);

		const label = Dom.createHTMLElement('label');
		label.classList.add('shaka-overflow-button-label');

		/** @private {!HTMLElement} */
		this.captionsNameSpan_ = Dom.createHTMLElement('span');

		label.appendChild(this.captionsNameSpan_);

		/** @private {!HTMLElement} */
		this.currentCaptions_ = Dom.createHTMLElement('span');
		this.currentCaptions_.classList.add('shaka-current-selection-span');
		label.appendChild(this.currentCaptions_);
		this.captionButton_.appendChild(label);
		this.parent.appendChild(this.captionButton_);
	}

	/**
	 * @private
	 */
	addTextLangMenu_() {
		/** @private {!HTMLElement} */
		this.textLangMenu_ = Dom.createHTMLElement('div');
		this.textLangMenu_.classList.add('shaka-text-languages');
		this.textLangMenu_.classList.add('shaka-no-propagation');
		this.textLangMenu_.classList.add('shaka-show-controls-on-mouse-over');
		this.textLangMenu_.classList.add('shaka-settings-menu');

		/** @private {!HTMLElement} */
		this.backFromCaptionsButton_ = Dom.createHTMLElement('button');
		this.backFromCaptionsButton_.classList.add('shaka-back-to-overflow-button');
		this.textLangMenu_.appendChild(this.backFromCaptionsButton_);

		const backIcon = Dom.createHTMLElement('i');
		backIcon.classList.add('material-icons');
		backIcon.textContent = Enums.MaterialDesignIcons.BACK;
		this.backFromCaptionsButton_.appendChild(backIcon);

		/** @private {!HTMLElement} */
		this.backFromCaptionsSpan_ = Dom.createHTMLElement('span');
		this.backFromCaptionsButton_.appendChild(this.backFromCaptionsSpan_);

		// Add the off option
		const off = Dom.createHTMLElement('button');
		off.setAttribute('aria-selected', 'true');
		this.textLangMenu_.appendChild(off);

		off.appendChild(Utils.checkmarkIcon());

		/** @private {!HTMLElement} */
		this.captionsOffSpan_ = Dom.createHTMLElement('span');

		this.captionsOffSpan_.classList.add('shaka-auto-span');
		off.appendChild(this.captionsOffSpan_);

		const controlsContainer = this.controls.getControlsContainer();
		controlsContainer.appendChild(this.textLangMenu_);
	}

	/** @private */
	onCaptionClick_() {
		this.controls.dispatchEvent(new FakeEvent('submenuopen'));
		Utils.setDisplay(this.textLangMenu_, true);
		// Focus on the currently selected language button.
		Utils.focusOnTheChosenItem(this.textLangMenu_);
	}

	/** @private */
	onCaptionStateChange_() {
		if (this.player.isTextTrackVisible()) {
			this.captionIcon_.classList.add('shaka-captions-on');
			this.captionIcon_.classList.remove('shaka-captions-off');
			this.captionButton_.setAttribute('aria-pressed', 'true');
		} else {
			this.captionIcon_.classList.add('shaka-captions-off');
			this.captionIcon_.classList.remove('shaka-captions-on');
			this.captionButton_.setAttribute('aria-pressed', 'false');
		}

		// TODO: document this event
		this.controls.dispatchEvent(new FakeEvent('captionselectionupdated'));
	}

	/** @private */
	updateTextLanguages_() {
		const tracks = this.player.getTextTracks();

		const languagesAndRoles = this.player.getTextLanguagesAndRoles();
		const languages = languagesAndRoles.map(langAndRole => {
			return langAndRole.language;
		});

		LanguageUtils.updateLanguages(
			tracks,
			this.textLangMenu_,
			languages,
			lang => this.onTextLanguageSelected_(lang),

			// Don't mark current text language as chosen unless captions are
			// enabled
			this.player.isTextTrackVisible(),
			this.currentCaptions_,
			this.localization
		);

		// Add the Off button
		const offButton = Dom.createHTMLElement('button');
		offButton.classList.add('shaka-turn-captions-off-button');
		this.eventManager.listen(offButton, 'click', () => {
			const p = this.player.setTextTrackVisibility(false);
			p.catch(() => {}); // TODO(#1993): Handle possible errors.
			this.updateTextLanguages_();
		});

		offButton.appendChild(this.captionsOffSpan_);

		this.textLangMenu_.appendChild(offButton);

		if (!this.player.isTextTrackVisible()) {
			offButton.setAttribute('aria-selected', 'true');
			offButton.appendChild(Utils.checkmarkIcon());
			this.captionsOffSpan_.classList.add('shaka-chosen-item');
			this.currentCaptions_.textContent = this.localization.resolve(Locales.Ids.OFF);
		}

		Utils.focusOnTheChosenItem(this.textLangMenu_);

		// TODO: document this event
		this.controls.dispatchEvent(new FakeEvent('captionselectionupdated'));
	}

	/**
	 * @param {string} language
	 * @return {!Promise}
	 * @private
	 */
	async onTextLanguageSelected_(language) {
		await this.player.setTextTrackVisibility(true);
		if (this.player) {
			// May have become null while awaiting
			this.player.selectTextLanguage(language);
		}
	}

	/**
	 * @private
	 */
	updateLocalizedStrings_() {
		const LocIds = Locales.Ids;

		this.captionButton_.setAttribute(Constants.ARIA_LABEL, this.localization.resolve(LocIds.CAPTIONS));
		this.backFromCaptionsButton_.setAttribute(Constants.ARIA_LABEL, this.localization.resolve(LocIds.BACK));
		this.captionsNameSpan_.textContent = this.localization.resolve(LocIds.CAPTIONS);
		this.backFromCaptionsSpan_.textContent = this.localization.resolve(LocIds.CAPTIONS);
		this.captionsOffSpan_.textContent = this.localization.resolve(LocIds.OFF);
	}

	/** @private */
	onTracksChanged_() {
		const hasText = this.player.getTextTracks().length > 0;
		Utils.setDisplay(this.captionButton_, hasText);
		this.updateTextLanguages_();
	}
}

/**
 * @implements {shaka.extern.IUIElement.Factory}
 * @final
 */
TextSelection.Factory = class {
	/** @override */
	create(rootElement, controls) {
		return new TextSelection(rootElement, controls);
	}
};

OverflowMenu.registerElement('captions', new TextSelection.Factory());
