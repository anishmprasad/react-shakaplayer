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

// goog.provide('shaka.polyfill');

var shaka = window.shaka;
// var goog = window.goog;

/**
 * @summary A one-stop installer for all polyfills.
 * @see http://enwp.org/polyfill
 * @exportDoc
 */
class polyfill {
	/**
	 * Install all polyfills.
	 * @export
	 */
	static installAll() {
		for (const polyfill of this.polyfills_) {
			polyfill.callback();
		}
	}

	/**
	 * Registers a new polyfill to be installed.
	 *
	 * @param {function()} polyfill
	 * @param {number=} priority An optional number priority.  Higher priorities
	 *   will be executed before lower priority ones.  Default is 0.
	 * @export
	 */
	static register(polyfill, priority) {
		priority = priority || 0;
		const item = { priority: priority, callback: polyfill };
		for (let i = 0; i < this.polyfills_.length; i++) {
			if (this.polyfills_[i].priority < priority) {
				this.polyfills_.splice(i, 0, item);
				return;
			}
		}
		this.polyfills_.push(item);
	}
	polyfills_ = [];
}

/**
 * Contains the polyfills that will be installed.
 * @private {!Array.<{priority: number, callback: function()}>}
 */
polyfill.polyfills_ = [];

// console.log(polyfill.polyfills_);

export default polyfill;
