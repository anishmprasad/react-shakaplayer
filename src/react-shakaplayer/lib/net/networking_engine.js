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

// goog.provide('shaka.net.NetworkingEngine');
// goog.provide('shaka.net.NetworkingEngine.PendingRequest');

// goog.require('goog.Uri');
// goog.require('goog.asserts');
// goog.require('shaka.net.Backoff');
// goog.require('shaka.util.AbortableOperation');
// goog.require('shaka.util.Error');
// goog.require('shaka.util.FakeEvent');
// goog.require('shaka.util.FakeEventTarget');
// goog.require('shaka.util.IDestroyable');
// goog.require('shaka.util.ObjectUtils');
// goog.require('shaka.util.OperationManager');
import OperationManager from '../util/operation_manager';
import ObjectUtils from '../util/object_utils';
import FakeEventTarget from '../util/fake_event_target';
import FakeEvent from '../util/fake_event';
import AbortableOperation from '../util/abortable_operation';
import Backoff from '../net/backoff';
import Error from '../util/error';
import Uri from '../../third_party/closure/goog/uri/uri';

const ErrorUtil = new Error();

var shaka = window.shaka;
var goog = window.goog;

/**
 * @event NetworkingEngine.RetryEvent
 * @description Fired when the networking engine receives a recoverable error
 *   and retries.
 * @property {string} type
 *   'retry'
 * @property {?Error} error
 *   The error that caused the retry. If it was a non-Shaka error, this is set
 *   to null.
 * @exportDoc
 */

/**
 * NetworkingEngine wraps all networking operations.  This accepts plugins that
 * handle the actual request.  A plugin is registered using registerScheme.
 * Each scheme has at most one plugin to handle the request.
 *
 * @implements {IDestroyable}
 * @export
 */
class NetworkingEngine extends FakeEventTarget {
	/**
	 * @param {function(number, number)=} onProgressUpdated Called when a progress
	 *   event is triggered. Passed the duration, in milliseconds, that the
	 *   request took, and the number of bytes transferred.
	 */
	constructor(onProgressUpdated) {
		super();

		/** @private {boolean} */
		this.destroyed_ = false;

		/** @private {!OperationManager} */
		this.operationManager_ = new OperationManager();

		/** @private {!Set.<shaka.extern.RequestFilter>} */
		this.requestFilters_ = new Set();

		/** @private {!Set.<shaka.extern.ResponseFilter>} */
		this.responseFilters_ = new Set();

		/** @private {?function(number, number)} */
		this.onProgressUpdated_ = onProgressUpdated || null;
	}

	/**
	 * Registers a scheme plugin.  This plugin will handle all requests with the
	 * given scheme.  If a plugin with the same scheme already exists, it is
	 * replaced, unless the existing plugin is of higher priority.
	 * If no priority is provided, this defaults to the highest priority of
	 * APPLICATION.
	 *
	 * @param {string} scheme
	 * @param {shaka.extern.SchemePlugin} plugin
	 * @param {number=} priority
	 * @export
	 */
	static registerScheme(scheme, plugin, priority) {
		window.asserts.assert(priority == undefined || priority > 0, 'explicit priority must be > 0');
		priority = priority || NetworkingEngine.PluginPriority.APPLICATION;
		const existing = NetworkingEngine.schemes_[scheme];
		if (!existing || priority >= existing.priority) {
			NetworkingEngine.schemes_[scheme] = {
				priority: priority,
				plugin: plugin
			};
		}
	}

	/**
	 * Removes a scheme plugin.
	 *
	 * @param {string} scheme
	 * @export
	 */
	static unregisterScheme(scheme) {
		delete NetworkingEngine.schemes_[scheme];
	}

	/**
	 * Registers a new request filter.  All filters are applied in the order they
	 * are registered.
	 *
	 * @param {shaka.extern.RequestFilter} filter
	 * @export
	 */
	registerRequestFilter(filter) {
		this.requestFilters_.add(filter);
	}

	/**
	 * Removes a request filter.
	 *
	 * @param {shaka.extern.RequestFilter} filter
	 * @export
	 */
	unregisterRequestFilter(filter) {
		this.requestFilters_.delete(filter);
	}

	/**
	 * Clears all request filters.
	 *
	 * @export
	 */
	clearAllRequestFilters() {
		this.requestFilters_.clear();
	}

	/**
	 * Registers a new response filter.  All filters are applied in the order they
	 * are registered.
	 *
	 * @param {shaka.extern.ResponseFilter} filter
	 * @export
	 */
	registerResponseFilter(filter) {
		this.responseFilters_.add(filter);
	}

	/**
	 * Removes a response filter.
	 *
	 * @param {shaka.extern.ResponseFilter} filter
	 * @export
	 */
	unregisterResponseFilter(filter) {
		this.responseFilters_.delete(filter);
	}

	/**
	 * Clears all response filters.
	 *
	 * @export
	 */
	clearAllResponseFilters() {
		this.responseFilters_.clear();
	}

	/**
	 * Gets a copy of the default retry parameters.
	 *
	 * @return {shaka.extern.RetryParameters}
	 *
	 * NOTE: The implementation moved to Backoff to avoid a circular
	 * dependency between the two classes.
	 */
	static defaultRetryParameters() {
		return Backoff.defaultRetryParameters();
	}

	/**
	 * Makes a simple network request for the given URIs.
	 *
	 * @param {!Array.<string>} uris
	 * @param {shaka.extern.RetryParameters} retryParams
	 * @return {shaka.extern.Request}
	 */
	static makeRequest(uris, retryParams) {
		return {
			uris: uris,
			method: 'GET',
			body: null,
			headers: {},
			allowCrossSiteCredentials: false,
			retryParameters: retryParams,
			licenseRequestType: null
		};
	}

	/**
	 * @override
	 * @export
	 */
	destroy() {
		this.destroyed_ = true;
		this.requestFilters_.clear();
		this.responseFilters_.clear();
		return this.operationManager_.destroy();
	}

	/**
	 * Makes a network request and returns the resulting data.
	 *
	 * @param {NetworkingEngine.RequestType} type
	 * @param {shaka.extern.Request} request
	 * @return {!NetworkingEngine.PendingRequest}
	 * @export
	 */
	request(type, request) {
		// const ObjectUtils = ObjectUtils;
		const numBytesRemainingObj = new NetworkingEngine.NumBytesRemainingClass();

		// Reject all requests made after destroy is called.
		if (this.destroyed_) {
			const p = Promise.reject(
				new Error(Error.Severity.CRITICAL, Error.Category.PLAYER, Error.Code.OPERATION_ABORTED)
			);
			// Silence uncaught rejection errors, which may otherwise occur any place
			// we don't explicitly handle aborted operations.
			p.catch(() => {});
			return new NetworkingEngine.PendingRequest(p, () => Promise.resolve(), numBytesRemainingObj);
		}

		window.asserts.assert(request.uris && request.uris.length, 'Request without URIs!');

		// If a request comes from outside the library, some parameters may be left
		// undefined.  To make it easier for application developers, we will fill
		// them in with defaults if necessary.
		//
		// We clone retryParameters and uris so that if a filter modifies the
		// request, it doesn't contaminate future requests.
		request.method = request.method || 'GET';
		request.headers = request.headers || {};
		request.retryParameters = request.retryParameters
			? ObjectUtils.cloneObject(request.retryParameters)
			: NetworkingEngine.defaultRetryParameters();
		request.uris = ObjectUtils.cloneObject(request.uris);

		// Apply the registered filters to the request.
		const requestFilterOperation = this.filterRequest_(type, request);
		const requestOperation = requestFilterOperation.chain(() =>
			this.makeRequestWithRetry_(type, request, numBytesRemainingObj)
		);
		const responseFilterOperation = requestOperation.chain(responseAndGotProgress =>
			this.filterResponse_(type, responseAndGotProgress)
		);

		// Keep track of time spent in filters.
		const requestFilterStartTime = Date.now();
		let requestFilterMs = 0;
		requestFilterOperation.promise.then(
			() => {
				requestFilterMs = Date.now() - requestFilterStartTime;
			},
			() => {}
		); // Silence errors in this fork of the Promise chain.

		let responseFilterStartTime = 0;
		requestOperation.promise.then(
			() => {
				responseFilterStartTime = Date.now();
			},
			() => {}
		); // Silence errors in this fork of the Promise chain.

		const op = responseFilterOperation.chain(
			responseAndGotProgress => {
				const responseFilterMs = Date.now() - responseFilterStartTime;
				const response = responseAndGotProgress.response;
				response.timeMs += requestFilterMs;
				response.timeMs += responseFilterMs;
				if (
					!responseAndGotProgress.gotProgress &&
					this.onProgressUpdated_ &&
					!response.fromCache &&
					type == NetworkingEngine.RequestType.SEGMENT
				) {
					this.onProgressUpdated_(response.timeMs, response.data.byteLength);
				}
				return response;
			},
			e => {
				// Any error thrown from elsewhere should be recategorized as CRITICAL
				// here.  This is because by the time it gets here, we've exhausted
				// retries.
				if (e) {
					window.asserts.assert(e instanceof Error, 'Wrong error type');
					e.severity = ErrorUtil.severity.CRITICAL;
				}

				throw e;
			}
		);

		// Return the pending request, which carries the response operation, and the
		// number of bytes remaining to be downloaded, updated by the progress
		// events.  Add the operation to the manager for later cleanup.
		const pendingRequest = new NetworkingEngine.PendingRequest(op.promise, op.onAbort_, numBytesRemainingObj);
		this.operationManager_.manage(pendingRequest);
		return pendingRequest;
	}

	/**
	 * @param {NetworkingEngine.RequestType} type
	 * @param {shaka.extern.Request} request
	 * @return {!shaka.extern.IAbortableOperation.<undefined>}
	 * @private
	 */
	filterRequest_(type, request) {
		let filterOperation = AbortableOperation.completed(undefined);

		for (const requestFilter of this.requestFilters_) {
			// Request filters are run sequentially.
			filterOperation = filterOperation.chain(() => requestFilter(type, request));
		}

		// Catch any errors thrown by request filters, and substitute
		// them with a Shaka-native error.
		return filterOperation.chain(undefined, e => {
			if (e && e.code == Error.Code.OPERATION_ABORTED) {
				// Don't change anything if the operation was aborted.
				throw e;
			}

			throw new Error(Error.Severity.CRITICAL, Error.Category.NETWORK, Error.Code.REQUEST_FILTER_ERROR, e);
		});
	}

	/**
	 * @param {NetworkingEngine.RequestType} type
	 * @param {shaka.extern.Request} request
	 * @param {NetworkingEngine.NumBytesRemainingClass}
	 *            numBytesRemainingObj
	 * @return {!shaka.extern.IAbortableOperation.<
	 *            NetworkingEngine.ResponseAndGotProgress>}
	 * @private
	 */
	makeRequestWithRetry_(type, request, numBytesRemainingObj) {
		const backoff = new Backoff(request.retryParameters, /* autoReset */ false);
		const index = 0;
		return this.send_(type, request, backoff, index, /* lastError */ null, numBytesRemainingObj);
	}

	/**
	 * Sends the given request to the correct plugin and retry using Backoff.
	 *
	 * @param {NetworkingEngine.RequestType} type
	 * @param {shaka.extern.Request} request
	 * @param {!Backoff} backoff
	 * @param {number} index
	 * @param {?Error} lastError
	 * @param {NetworkingEngine.NumBytesRemainingClass}
	 *     numBytesRemainingObj
	 * @return {!shaka.extern.IAbortableOperation.<
	 *               NetworkingEngine.ResponseAndGotProgress>}
	 * @private
	 */
	send_(type, request, backoff, index, lastError, numBytesRemainingObj) {
		const uri = new Uri(request.uris[index]);
		let scheme = uri.getScheme();
		// Whether it got a progress event.
		let gotProgress = false;
		if (!scheme) {
			// If there is no scheme, infer one from the location.
			scheme = NetworkingEngine.getLocationProtocol_();
			window.asserts.assert(scheme[scheme.length - 1] == ':', 'location.protocol expected to end with a colon!');
			// Drop the colon.
			scheme = scheme.slice(0, -1);

			// Override the original URI to make the scheme explicit.
			uri.setScheme(scheme);
			request.uris[index] = uri.toString();
		}

		const object = NetworkingEngine.schemes_[scheme];
		const plugin = object ? object.plugin : null;
		if (!plugin) {
			return AbortableOperation.failed(
				new Error(Error.Severity.CRITICAL, Error.Category.NETWORK, Error.Code.UNSUPPORTED_SCHEME, uri)
			);
		}

		// Every attempt must have an associated backoff.attempt() call so that the
		// accounting is correct.
		const backoffOperation = AbortableOperation.notAbortable(backoff.attempt());

		let startTimeMs;
		const sendOperation = backoffOperation
			.chain(() => {
				if (this.destroyed_) {
					return AbortableOperation.aborted();
				}

				startTimeMs = Date.now();
				const segment = NetworkingEngine.RequestType.SEGMENT;

				return plugin(
					request.uris[index],
					request,
					type,
					// The following function is passed to plugin.
					(time, bytes, numBytesRemaining) => {
						if (this.onProgressUpdated_ && type == segment) {
							this.onProgressUpdated_(time, bytes);
							gotProgress = true;
							numBytesRemainingObj.setBytes(numBytesRemaining);
						}
					}
				);
			})
			.chain(
				response => {
					if (response.timeMs == undefined) {
						response.timeMs = Date.now() - startTimeMs;
					}
					const responseAndGotProgress = {
						response: response,
						gotProgress: gotProgress
					};

					return responseAndGotProgress;
				},
				error => {
					if (this.destroyed_) {
						return AbortableOperation.aborted();
					}

					if (error.code == Error.Code.OPERATION_ABORTED) {
						// Don't change anything if the operation was aborted.
						throw error;
					} else if (error.code == Error.Code.ATTEMPTS_EXHAUSTED) {
						window.asserts.assert(lastError, 'Should have last error');
						throw lastError;
					}

					if (error.severity == Error.Severity.RECOVERABLE) {
						// Don't pass in a non-shaka error, even if one is somehow thrown;
						// instead, call the listener with a null error.
						const errorOrNull = error instanceof Error ? error : null;
						const event = new FakeEvent('retry', { error: errorOrNull });
						this.dispatchEvent(event);

						// Move to the next URI.
						index = (index + 1) % request.uris.length;
						const shakaError = /** @type {Error} */ (error);
						return this.send_(type, request, backoff, index, shakaError, numBytesRemainingObj);
					}

					// The error was not recoverable, so do not try again.
					throw error;
				}
			);

		return sendOperation;
	}

	/**
	 * @param {NetworkingEngine.RequestType} type
	 * @param {NetworkingEngine.ResponseAndGotProgress}
	 *        responseAndGotProgress
	 * @return {!shaka.extern.IAbortableOperation.<
	 *               NetworkingEngine.ResponseAndGotProgress>}
	 * @private
	 */
	filterResponse_(type, responseAndGotProgress) {
		let filterOperation = AbortableOperation.completed(undefined);
		for (const responseFilter of this.responseFilters_) {
			// Response filters are run sequentially.
			filterOperation = filterOperation.chain(() => responseFilter(type, responseAndGotProgress.response));
		}
		// If successful, return the filtered response with whether it got
		// progress.
		return filterOperation.chain(
			() => {
				return responseAndGotProgress;
			},
			e => {
				// Catch any errors thrown by request filters, and substitute
				// them with a Shaka-native error.

				if (e && e.code == Error.Code.OPERATION_ABORTED) {
					// Don't change anything if the operation was aborted.
					throw e;
				}

				// The error is assumed to be critical if the original wasn't a Shaka
				// error.
				let severity = Error.Severity.CRITICAL;
				if (e instanceof Error) {
					severity = e.severity;
				}

				throw new Error(severity, Error.Category.NETWORK, Error.Code.RESPONSE_FILTER_ERROR, e);
			}
		);
	}

	/**
	 * This is here only for testability.  We can't mock location in our tests on
	 * all browsers, so instead we mock this.
	 *
	 * @return {string} The value of location.protocol.
	 * @private
	 */
	static getLocationProtocol_() {
		return window.location.protocol;
	}
}

/**
 * A wrapper class for the number of bytes remaining to be downloaded for the
 * request.
 * Instead of using PendingRequest directly, this class is needed to be sent to
 * plugin as a parameter, and a Promise is returned, before PendingRequest is
 * created.
 *
 * @export
 */
NetworkingEngine.NumBytesRemainingClass = class {
	/**
	 * Constructor
	 */
	constructor() {
		/** @private {number} */
		this.bytesToLoad_ = 0;
	}

	/**
	 * @param {number} bytesToLoad
	 */
	setBytes(bytesToLoad) {
		this.bytesToLoad_ = bytesToLoad;
	}

	/**
	 * @return {number}
	 */
	getBytes() {
		return this.bytesToLoad_;
	}
};

/**
 * A pending network request. This can track the current progress of the
 * download, and allows the request to be aborted if the network is slow.
 *
 * @implements {shaka.extern.IAbortableOperation.<shaka.extern.Response>}
 * @extends {AbortableOperation}
 * @export
 */
NetworkingEngine.PendingRequest = class extends AbortableOperation {
	/**
	 * @param {!Promise} promise
	 *   A Promise which represents the underlying operation.  It is resolved
	 *   when the operation is complete, and rejected if the operation fails
	 *   or is aborted.  Aborted operations should be rejected with a
	 *   Error object using the error code OPERATION_ABORTED.
	 * @param {function():!Promise} onAbort
	 *   Will be called by this object to abort the underlying operation.
	 *   This is not cancelation, and will not necessarily result in any work
	 *   being undone.  abort() should return a Promise which is resolved when
	 *   the underlying operation has been aborted.  The returned Promise
	 *   should never be rejected.
	 * @param {NetworkingEngine.NumBytesRemainingClass}
	 *   numBytesRemainingObj
	 */
	constructor(promise, onAbort, numBytesRemainingObj) {
		super(promise, onAbort);

		/** @private {NetworkingEngine.NumBytesRemainingClass} */
		this.bytesRemaining_ = numBytesRemainingObj;
	}

	/**
	 * @return {number}
	 */
	getBytesRemaining() {
		return this.bytesRemaining_.getBytes();
	}
};

/**
 * Request types.  Allows a filter to decide which requests to read/alter.
 *
 * @enum {number}
 * @export
 */
NetworkingEngine.RequestType = {
	MANIFEST: 0,
	SEGMENT: 1,
	LICENSE: 2,
	APP: 3,
	TIMING: 4
};

/**
 * Priority level for network scheme plugins.
 * If multiple plugins are provided for the same scheme, only the
 * highest-priority one is used.
 *
 * @enum {number}
 * @export
 */
NetworkingEngine.PluginPriority = {
	FALLBACK: 1,
	PREFERRED: 2,
	APPLICATION: 3
};

/**
 * @typedef {{
 *   plugin: shaka.extern.SchemePlugin,
 *   priority: number
 * }}
 * @property {shaka.extern.SchemePlugin} plugin
 *   The associated plugin.
 * @property {number} priority
 *   The plugin's priority.
 */
NetworkingEngine.SchemeObject = {};

/**
 * Contains the scheme plugins.
 *
 * @private {!Object.<string, NetworkingEngine.SchemeObject>}
 */
NetworkingEngine.schemes_ = {};

/**
 * @typedef {{
 *   response: shaka.extern.Response,
 *   gotProgress: boolean
 * }}
 *
 * @description
 * Defines a response wrapper object, including the response object and whether
 * progress event is fired by the scheme plugin.
 *
 * @property {shaka.extern.Response} response
 * @property {boolean} gotProgress
 * @private
 */
NetworkingEngine.ResponseAndGotProgress = {};

export default NetworkingEngine;
