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

// goog.provide('shaka.offline.OfflineScheme');

// goog.require('goog.asserts');
// goog.require('shaka.net.NetworkingEngine');
// goog.require('shaka.offline.OfflineUri');
// goog.require('shaka.offline.StorageMuxer');
// goog.require('shaka.util.AbortableOperation');
// goog.require('shaka.util.Error');

import NetworkingEngine from '../net/networking_engine';
import OfflineUri from '../offline/offline_uri';
import StorageMuxer from '../offline/storage_muxer';
import AbortableOperation from '../util/abortable_operation';
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

		return shaka.util.AbortableOperation.failed(
			new shaka.util.Error(
				shaka.util.Error.Severity.CRITICAL,
				shaka.util.Error.Category.NETWORK,
				shaka.util.Error.Code.MALFORMED_OFFLINE_URI,
				uri
			)
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

		return shaka.util.AbortableOperation.completed(response);
	}

	/**
	 * @param {number} id
	 * @param {!shaka.offline.OfflineUri} uri
	 * @return {!shaka.extern.IAbortableOperation.<shaka.extern.Response>}
	 * @private
	 */
	static getSegment_(id, uri) {
		goog.asserts.assert(uri.isSegment(), "Only segment uri's should be given to getSegment");

		/** @type {!shaka.offline.StorageMuxer} */
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
