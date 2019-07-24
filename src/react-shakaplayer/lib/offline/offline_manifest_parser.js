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

// goog.provide('OfflineManifestParser');

// goog.require('goog.asserts');
// goog.require('shaka.log');
// goog.require('shaka.media.ManifestParser');
// goog.require('ManifestConverter');
// goog.require('OfflineUri');
// goog.require('StorageMuxer');
// goog.require('shaka.util.Error');

import ManifestParser from '../media/manifest_parser';
import ManifestConverter from '../offline/manifest_converter';
import OfflineUri from '../offline/offline_uri';
import StorageMuxer from '../offline/storage_muxer';

var shaka = window.shaka;
var goog = window.goog;

/**
 * @summary Creates a new offline manifest parser.
 * @implements {shaka.extern.ManifestParser}
 */
class OfflineManifestParser {
	constructor() {
		/** @private {OfflineUri} */
		this.uri_ = null;
	}

	/** @override */
	configure(config) {
		// No-op
	}

	/** @override */
	async start(uriString, playerInterface) {
		/** @type {OfflineUri} */
		const uri = OfflineUri.parse(uriString);
		this.uri_ = uri;

		if (uri == null || !uri.isManifest()) {
			throw new shaka.util.Error(
				shaka.util.Error.Severity.CRITICAL,
				shaka.util.Error.Category.NETWORK,
				shaka.util.Error.Code.MALFORMED_OFFLINE_URI,
				uriString
			);
		}

		/** @type {!StorageMuxer} */
		const muxer = new StorageMuxer();

		try {
			await muxer.init();

			const cell = await muxer.getCell(uri.mechanism(), uri.cell());

			const manifests = await cell.getManifests([uri.key()]);
			const manifest = manifests[0];

			const converter = new ManifestConverter(uri.mechanism(), uri.cell());

			return converter.fromManifestDB(manifest);
		} finally {
			await muxer.destroy();
		}
	}

	/** @override */
	stop() {
		return Promise.resolve();
	}

	/** @override */
	update() {
		// No-op
	}

	/** @override */
	async onExpirationUpdated(sessionId, expiration) {
		window.asserts.assert(this.uri_, 'Should not get update event before start has been called');

		/** @type {!OfflineUri} */
		const uri = this.uri_;

		/** @type {!StorageMuxer} */
		const muxer = new StorageMuxer();

		try {
			await muxer.init();

			const cell = await muxer.getCell(uri.mechanism(), uri.cell());

			const manifests = await cell.getManifests([uri.key()]);
			const manifest = manifests[0];

			const foundSession = manifest.sessionIds.includes(sessionId);
			const newExpiration = manifest.expiration == undefined || manifest.expiration > expiration;

			if (foundSession && newExpiration) {
				shaka.log.debug('Updating expiration for stored content');
				await cell.updateManifestExpiration(uri.key(), expiration);
			}
		} catch (e) {
			// Ignore errors with update.
			shaka.log.error('There was an error updating', uri, e);
		} finally {
			await muxer.destroy();
		}
	}
}

ManifestParser.registerParserByMime('application/x-offline-manifest', OfflineManifestParser);

export default OfflineManifestParser;
