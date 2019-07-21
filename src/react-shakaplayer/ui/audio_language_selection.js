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

// goog.provide('shaka.ui.AudioLanguageSelection');

// goog.require('shaka.ui.Element');
// goog.require('shaka.ui.Enums');
// goog.require('shaka.ui.LanguageUtils');
// goog.require('shaka.ui.Locales');
// goog.require('shaka.ui.Localization');
// goog.require('shaka.ui.OverflowMenu');
// goog.require('shaka.util.Dom');

import Element from './element';
import Enums from './enums';
import LanguageUtils from './language_utils';
import Locales from '../dist/locales';
import Localization from './localization';
import OverflowMenu from './overflow_menu';
import Dom from '../lib/util/dom_utils';
import Constants from '../ui/constants';
import Utils from '../ui/ui_utils';
import FakeEvent from '../lib/util/fake_event';

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
class AudioLanguageSelection extends Element {
	/**
	 * @param {!HTMLElement} parent
	 * @param {!Controls} controls
	 */
	constructor(parent, controls) {
		super(parent, controls);

		this.addLanguagesButton_();

		this.addAudioLangMenu_();

		this.eventManager.listen(this.localization, Localization.LOCALE_UPDATED, () => {
			this.updateLocalizedStrings_();
		});

		this.eventManager.listen(this.localization, Localization.LOCALE_CHANGED, () => {
			this.updateLocalizedStrings_();
		});

		this.eventManager.listen(this.player, 'trackschanged', () => {
			this.onTracksChanged_();
		});

		this.eventManager.listen(this.player, 'variantchanged', () => {
			this.updateAudioLanguages_();
		});

		this.eventManager.listen(this.languagesButton_, 'click', () => {
			this.onLanguagesClick_();
		});

		// Set up all the strings in the user's preferred language.
		this.updateLocalizedStrings_();

		this.updateAudioLanguages_();
	}

	/**
	 * @private
	 */
	addAudioLangMenu_() {
		/** @private {!HTMLElement} */
		this.audioLangMenu_ = Dom.createHTMLElement('div');
		this.audioLangMenu_.classList.add('shaka-audio-languages');
		this.audioLangMenu_.classList.add('shaka-no-propagation');
		this.audioLangMenu_.classList.add('shaka-show-controls-on-mouse-over');
		this.audioLangMenu_.classList.add('shaka-settings-menu');

		/** @private {!HTMLElement} */
		this.backFromLanguageButton_ = Dom.createHTMLElement('button');
		this.backFromLanguageButton_.classList.add('shaka-back-to-overflow-button');
		this.audioLangMenu_.appendChild(this.backFromLanguageButton_);

		const backIcon = Dom.createHTMLElement('i');
		backIcon.classList.add('material-icons');
		backIcon.textContent = Enums.MaterialDesignIcons.BACK;
		this.backFromLanguageButton_.appendChild(backIcon);

		/** @private {!HTMLElement} */
		this.backFromLanguageSpan_ = Dom.createHTMLElement('span');
		this.backFromLanguageButton_.appendChild(this.backFromLanguageSpan_);

		const controlsContainer = this.controls.getControlsContainer();
		controlsContainer.appendChild(this.audioLangMenu_);
	}

	/**
	 * @private
	 */
	addLanguagesButton_() {
		/** @private {!HTMLElement} */
		this.languagesButton_ = Dom.createHTMLElement('button');
		this.languagesButton_.classList.add('shaka-language-button');

		const icon = Dom.createHTMLElement('i');
		icon.classList.add('material-icons');
		icon.textContent = Enums.MaterialDesignIcons.LANGUAGE;
		this.languagesButton_.appendChild(icon);

		const label = Dom.createHTMLElement('label');
		label.classList.add('shaka-overflow-button-label');

		/** @private {!HTMLElement} */
		this.languageNameSpan_ = Dom.createHTMLElement('span');
		this.languageNameSpan_.classList.add('languageSpan');
		label.appendChild(this.languageNameSpan_);

		/** @private {!HTMLElement} */
		this.currentAudioLanguage_ = Dom.createHTMLElement('span');
		this.currentAudioLanguage_.classList.add('shaka-current-selection-span');
		const language = this.player.getConfiguration().preferredAudioLanguage;
		this.currentAudioLanguage_.textContent = LanguageUtils.getLanguageName(language, this.localization);
		label.appendChild(this.currentAudioLanguage_);

		this.languagesButton_.appendChild(label);

		this.parent.appendChild(this.languagesButton_);
	}

	/** @private */
	onLanguagesClick_() {
		this.controls.dispatchEvent(new FakeEvent('submenuopen'));
		Utils.setDisplay(this.audioLangMenu_, true);
		// Focus on the currently selected language button.
		Utils.focusOnTheChosenItem(this.audioLangMenu_);
	}

	/** @private */
	updateAudioLanguages_() {
		const tracks = this.player.getVariantTracks();
		const languages = this.player.getAudioLanguages();

		LanguageUtils.updateLanguages(
			tracks,
			this.audioLangMenu_,
			languages,
			lang => this.onAudioLanguageSelected_(lang),
			/* updateChosen */ true,
			this.currentAudioLanguage_,
			this.localization
		);
		Utils.focusOnTheChosenItem(this.audioLangMenu_);

		// TODO: document this event
		this.controls.dispatchEvent(new FakeEvent('languageselectionupdated'));
	}

	/** @private */
	onTracksChanged_() {
		const hasVariants = this.player.getVariantTracks().length > 0;
		Utils.setDisplay(this.languagesButton_, hasVariants);
		this.updateAudioLanguages_();
	}

	/**
	 * @param {string} language
	 * @private
	 */
	onAudioLanguageSelected_(language) {
		this.player.selectAudioLanguage(language);
	}

	/**
	 * @private
	 */
	updateLocalizedStrings_() {
		const LocIds = Locales.Ids;

		this.backFromLanguageButton_.setAttribute(Constants.ARIA_LABEL, this.localization.resolve(LocIds.BACK));
		this.languagesButton_.setAttribute(Constants.ARIA_LABEL, this.localization.resolve(LocIds.LANGUAGE));
		this.languageNameSpan_.textContent = this.localization.resolve(LocIds.LANGUAGE);
		this.backFromLanguageSpan_.textContent = this.localization.resolve(LocIds.LANGUAGE);
	}
}

/**
 * @implements {shaka.extern.IUIElement.Factory}
 * @final
 */
AudioLanguageSelection.Factory = class {
	/** @override */
	create(rootElement, controls) {
		return new AudioLanguageSelection(rootElement, controls);
	}
};

OverflowMenu.registerElement('language', new AudioLanguageSelection.Factory());
