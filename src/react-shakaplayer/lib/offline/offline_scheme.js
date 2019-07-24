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

// goog.provide('OfflineScheme');

// goog.require('goog.asserts');
// goog.require('shaka.net.NetworkingEngine');
// goog.require('OfflineUri');
// goog.require('StorageMuxer');
// goog.require('shaka.util.AbortableOperation');
// goog.require('shaka.util.Error');

import NetworkingEngine from '../net/networking_engine';
import OfflineUri from '../offline/offline_uri';
import StorageMuxer from '../offline/storage_muxer';
import AbortableOperation from '../util/abortable_operation';
import Error from '../util/error';

var shaka = window.shaka;
var goog = window.goog;

/**
 * @summary A plugin that handles requests for offline content.
 * @export
 */
class OfflineScheme {
	/**
	 * @param {string} uri
	 * @param {shaka.extern.Request} request
	 * @param {shaka.net.NetworkingEngine.RequestType} requestType
	 * @param {shaka.extern.ProgressUpdated} progressUpdated Called when a
	 *   progress event happened.
	 * @return {!shaka.extern.IAbortableOperation.<shaka.extern.Response>}
	 * @export
	 */
	static plugin(uri, request, requestType, progressUpdated) {
		const offlineUri = OfflineUri.parse(uri);

		if (offlineUri && offlineUri.isManifest()) {
			return OfflineScheme.getManifest_(uri);
		}

		if (offlineUri && offlineUri.isSegment()) {
			return OfflineScheme.getSegment_(offlineUri.key(), offlineUri);
		}

		return AbortableOperation.failed(
			new Error(Error.Severity.CRITICAL, Error.Category.NETWORK, Error.Code.MALFORMED_OFFLINE_URI, uri)
		);
	}

	/**
	 * @param {string} uri
	 * @return {!shaka.extern.IAbortableOperation.<shaka.extern.Response>}
	 * @private
	 */
	static getManifest_(uri) {
		/** @type {shaka.extern.Response} */
		const response = {
			uri: uri,
			originalUri: uri,
			data: new ArrayBuffer(0),
			headers: { 'content-type': 'application/x-offline-manifest' }
		};

		return AbortableOperation.completed(response);
	}

	/**
	 * @param {number} id
	 * @param {!OfflineUri} uri
	 * @return {!shaka.extern.IAbortableOperation.<shaka.extern.Response>}
	 * @private
	 */
	static getSegment_(id, uri) {
		window.asserts.assert(uri.isSegment(), "Only segment uri's should be given to getSegment");

		/** @type {!StorageMuxer} */
		const muxer = new StorageMuxer();

		return AbortableOperation.completed(undefined)
			.chain(() => muxer.init())
			.chain(() => muxer.getCell(uri.mechanism(), uri.cell()))
			.chain(cell => cell.getSegments([uri.key()]))
			.chain(segments => {
				const segment = segments[0];

				return {
					uri: uri,
					data: segment.data,
					headers: {}
				};
			})
			.finally(() => muxer.destroy());
	}
}

NetworkingEngine.registerScheme('offline', OfflineScheme.plugin);
