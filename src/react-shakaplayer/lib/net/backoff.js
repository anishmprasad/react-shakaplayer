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

// goog.provide('shaka.net.Backoff');

// goog.require('goog.asserts');
// goog.require('shaka.util.Timer');

import Timer from '../util/timer';

var shaka = window.shaka;
var goog = window.goog;

/**
 * Backoff represents delay and backoff state.  This is used by NetworkingEngine
 * for individual requests and by StreamingEngine to retry streaming failures.
 *
 * @final
 */
export default class Backoff {
	/**
	 * @param {shaka.extern.RetryParameters} parameters
	 * @param {boolean=} autoReset  If true, start at a "first retry" state and
	 *   and auto-reset that state when we reach maxAttempts.
	 *   Default set to false.
	 */
	constructor(parameters, autoReset = false) {
		// Set defaults as we unpack these, so that individual app-level requests in
		// NetworkingEngine can be missing parameters.

		const defaults = Backoff.defaultRetryParameters();

		/**
		 * @const
		 * @private {number}
		 */
		this.maxAttempts_ = parameters.maxAttempts == null ? defaults.maxAttempts : parameters.maxAttempts;

		window.asserts.assert(this.maxAttempts_ >= 1, 'maxAttempts should be >= 1');

		/**
		 * @const
		 * @private {number}
		 */
		this.baseDelay_ = parameters.baseDelay == null ? defaults.baseDelay : parameters.baseDelay;

		window.asserts.assert(this.baseDelay_ >= 0, 'baseDelay should be >= 0');

		/**
		 * @const
		 * @private {number}
		 */
		this.fuzzFactor_ = parameters.fuzzFactor == null ? defaults.fuzzFactor : parameters.fuzzFactor;

		window.asserts.assert(this.fuzzFactor_ >= 0, 'fuzzFactor should be >= 0');

		/**
		 * @const
		 * @private {number}
		 */
		this.backoffFactor_ = parameters.backoffFactor == null ? defaults.backoffFactor : parameters.backoffFactor;

		window.asserts.assert(this.backoffFactor_ >= 0, 'backoffFactor should be >= 0');

		/** @private {number} */
		this.numAttempts_ = 0;

		/** @private {number} */
		this.nextUnfuzzedDelay_ = this.baseDelay_;

		/** @private {boolean} */
		this.autoReset_ = autoReset;

		if (this.autoReset_) {
			// There is no delay before the first attempt.  In StreamingEngine (the
			// intended user of auto-reset mode), the first attempt was implied, so we
			// reset numAttempts to 1.  Therefore maxAttempts (which includes the
			// first attempt) must be at least 2 for us to see a delay.
			window.asserts.assert(this.maxAttempts_ >= 2, 'maxAttempts must be >= 2 for autoReset == true');
			this.numAttempts_ = 1;
		}
	}

	/**
	 * @return {!Promise} Resolves when the caller may make an attempt, possibly
	 *   after a delay.  Rejects if no more attempts are allowed.
	 */
	async attempt() {
		if (this.numAttempts_ >= this.maxAttempts_) {
			if (this.autoReset_) {
				this.reset_();
			} else {
				throw new Error(Error.Severity.CRITICAL, Error.Category.PLAYER, Error.Code.ATTEMPTS_EXHAUSTED);
			}
		}

		const currentAttempt = this.numAttempts_;
		this.numAttempts_++;

		if (currentAttempt == 0) {
			window.asserts.assert(!this.autoReset_, 'Failed to delay with auto-reset!');
			return;
		}

		// We've already tried before, so delay the Promise.

		// Fuzz the delay to avoid tons of clients hitting the server at once
		// after it recovers from whatever is causing it to fail.
		const fuzzedDelayMs = Backoff.fuzz_(this.nextUnfuzzedDelay_, this.fuzzFactor_);

		await new Promise(resolve => {
			Backoff.defer(fuzzedDelayMs, resolve);
		});

		// Update delay_ for next time.
		this.nextUnfuzzedDelay_ *= this.backoffFactor_;
	}

	/**
	 * Gets a copy of the default retry parameters.
	 *
	 * @return {shaka.extern.RetryParameters}
	 */
	static defaultRetryParameters() {
		// Use a function rather than a constant member so the calling code can
		// modify the values without affecting other call results.
		return {
			maxAttempts: 2,
			baseDelay: 1000,
			backoffFactor: 2,
			fuzzFactor: 0.5,
			timeout: 0
		};
	}

	/**
	 * Fuzz the input value by +/- fuzzFactor.  For example, a fuzzFactor of 0.5
	 * will create a random value that is between 50% and 150% of the input value.
	 *
	 * @param {number} value
	 * @param {number} fuzzFactor
	 * @return {number} The fuzzed value
	 * @private
	 */
	static fuzz_(value, fuzzFactor) {
		// A random number between -1 and +1.
		const negToPosOne = Math.random() * 2.0 - 1.0;

		// A random number between -fuzzFactor and +fuzzFactor.
		const negToPosFuzzFactor = negToPosOne * fuzzFactor;

		// The original value, fuzzed by +/- fuzzFactor.
		return value * (1.0 + negToPosFuzzFactor);
	}

	/**
	 * Reset state in autoReset mode.
	 * @private
	 */
	reset_() {
		window.asserts.assert(this.autoReset_, 'Should only be used for auto-reset!');
		this.numAttempts_ = 1;
		this.nextUnfuzzedDelay_ = this.baseDelay_;
	}

	/**
	 * This method is only public for testing. It allows us to intercept the
	 * time-delay call.
	 *
	 * @param {number} delayInMs
	 * @param {function()} callback
	 */
	static defer(delayInMs, callback) {
		const timer = new Timer(callback);
		timer.tickAfter(delayInMs / 1000);
	}
}
