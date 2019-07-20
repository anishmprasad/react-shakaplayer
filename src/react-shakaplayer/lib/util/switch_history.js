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

// goog.provide('shaka.util.SwitchHistory');

var shaka = window.shaka;
var goog = window.goog;

/**
 * This class is used to track changes in variant and text selections. This
 * class will make sure that redundant switches are not recorded in the history.
 *
 * @final
 */
shaka.util.SwitchHistory = class {
	constructor() {
		/** @private {?shaka.extern.Variant} */
		this.currentVariant_ = null;

		/** @private {?shaka.extern.Stream} */
		this.currentText_ = null;

		/** @private {!Array.<shaka.extern.TrackChoice>} */
		this.history_ = [];
	}

	/**
	 * Update the history to show that we are currently playing |newVariant|. If
	 * we are already playing |newVariant|, this update will be ignored.
	 *
	 * @param {shaka.extern.Variant} newVariant
	 * @param {boolean} fromAdaptation
	 */
	updateCurrentVariant(newVariant, fromAdaptation) {
		if (this.currentVariant_ == newVariant) {
			return;
		}

		this.currentVariant_ = newVariant;
		this.history_.push({
			timestamp: this.getNowInSeconds_(),
			id: newVariant.id,
			type: 'variant',
			fromAdaptation: fromAdaptation,
			bandwidth: newVariant.bandwidth
		});
	}

	/**
	 * Update the history to show that we are currently playing |newText|. If we
	 * are already playing |newText|, this update will be ignored.
	 *
	 * @param {shaka.extern.Stream} newText
	 * @param {boolean} fromAdaptation
	 */
	updateCurrentText(newText, fromAdaptation) {
		if (this.currentText_ == newText) {
			return;
		}

		this.currentText_ = newText;
		this.history_.push({
			timestamp: this.getNowInSeconds_(),
			id: newText.id,
			type: 'text',
			fromAdaptation: fromAdaptation,
			bandwidth: null
		});
	}

	/**
	 * Get a copy of the switch history. This will make sure to expose no internal
	 * references.
	 *
	 * @return {!Array.<shaka.extern.TrackChoice>}
	 */
	getCopy() {
		const copy = [];

		for (const entry of this.history_) {
			copy.push(this.clone_(entry));
		}

		return copy;
	}

	/**
	 * Get the system time in seconds.
	 *
	 * @return {number}
	 * @private
	 */
	getNowInSeconds_() {
		return Date.now() / 1000;
	}

	/**
	 * @param {shaka.extern.TrackChoice} entry
	 * @return {shaka.extern.TrackChoice}
	 * @private
	 */
	clone_(entry) {
		return {
			timestamp: entry.timestamp,
			id: entry.id,
			type: entry.type,
			fromAdaptation: entry.fromAdaptation,
			bandwidth: entry.bandwidth
		};
	}
};
