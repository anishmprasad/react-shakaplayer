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

// goog.provide('shaka.util.OperationManager');

// goog.require('shaka.util.ArrayUtils');
// goog.require('shaka.util.IDestroyable');

import ArrayUtils from '../util/array_utils';
import IDestroyable from '../util/i_destroyable';

var shaka = window.shaka;
var goog = window.goog;

/**
 * A utility for cleaning up AbortableOperations, to help simplify common
 * patterns and reduce code duplication.
 *
 * @implements {shaka.util.IDestroyable}
 */
class OperationManager {
	constructor() {
		/** @private {!Array.<!shaka.extern.IAbortableOperation>} */
		this.operations_ = [];
	}

	/**
	 * Manage an operation.  This means aborting it on destroy() and removing it
	 * from the management set when it complete.
	 *
	 * @param {!shaka.extern.IAbortableOperation} operation
	 */
	manage(operation) {
		this.operations_.push(
			operation.finally(() => {
				ArrayUtils.remove(this.operations_, operation);
			})
		);
	}

	/** @override */
	destroy() {
		const cleanup = [];
		for (const op of this.operations_) {
			// Catch and ignore any failures.  This silences error logs in the
			// JavaScript console about uncaught Promise failures.
			op.promise.catch(() => {});

			// Now abort the operation.
			cleanup.push(op.abort());
		}

		this.operations_ = [];
		return Promise.all(cleanup);
	}
}

export default OperationManager;
