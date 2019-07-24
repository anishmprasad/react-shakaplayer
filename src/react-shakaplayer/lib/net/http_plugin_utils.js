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

// goog.provide('shaka.net.HttpPluginUtils');

// goog.require('shaka.log');
// goog.require('shaka.util.Error');
// goog.require('shaka.util.StringUtils');

import StringUtils from '../util/string_utils';
import Error from '../util/error';

const ErrorUtil = new Error();

var shaka = window.shaka;
var goog = window.goog;

/**
 * @summary A set of http networking utility functions.
 * @exportDoc
 */
export default class HttpPluginUtils {
	/**
	 * @param {!Object.<string,string>} headers
	 * @param {?ArrayBuffer} data
	 * @param {number} status
	 * @param {string} uri
	 * @param {string} responseURL
	 * @param {shaka.net.NetworkingEngine.RequestType} requestType
	 * @return {!shaka.extern.Response}
	 */
	static makeResponse(headers, data, status, uri, responseURL, requestType) {
		if (status >= 200 && status <= 299 && status != 202) {
			// Most 2xx HTTP codes are success cases.
			/** @type {shaka.extern.Response} */
			const response = {
				uri: responseURL || uri,
				originalUri: uri,
				data: data,
				headers: headers,
				fromCache: !!headers['x-shaka-from-cache']
			};
			return response;
		} else {
			let responseText = null;
			try {
				responseText = StringUtils.fromBytesAutoDetect(data);
			} catch (exception) {}
			shaka.log.debug('HTTP error text:', responseText);

			const severity =
				status === 401 || status === 403 ? ErrorUtil.severity.CRITICAL : ErrorUtil.severity.RECOVERABLE;
			throw new Error(
				severity,
				ErrorUtil.category.NETWORK,
				ErrorUtil.code.BAD_HTTP_STATUS,
				uri,
				status,
				responseText,
				headers,
				requestType
			);
		}
	}
}
