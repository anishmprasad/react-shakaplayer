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

// goog.provide('shaka.util.ManifestParserUtils');

// goog.require('goog.Uri');
// goog.require('shaka.util.Functional');

import Functional from '../util/functional';
import Uri from '../../third_party/closure/goog/uri/uri';

var shaka = window.shaka;
var goog = window.goog;

/**
 * @summary Utility functions for manifest parsing.
 */
export default class ManifestParserUtils {
	/**
	 * Resolves an array of relative URIs to the given base URIs. This will result
	 * in M*N number of URIs.
	 *
	 * @param {!Array.<string>} baseUris
	 * @param {!Array.<string>} relativeUris
	 * @return {!Array.<string>}
	 */
	static resolveUris(baseUris, relativeUris) {
		// const Functional = shaka.util.Functional;
		if (relativeUris.length == 0) {
			return baseUris;
		}

		const relativeAsGoog = relativeUris.map(uri => new Uri(uri));
		// Resolve each URI relative to each base URI, creating an Array of Arrays.
		// Then flatten the Arrays into a single Array.
		return baseUris
			.map(uri => new Uri(uri))
			.map(base => relativeAsGoog.map(i => base.resolve(i)))
			.reduce(Functional.collapseArrays, [])
			.map(uri => uri.toString());
	}

	/**
	 * Creates a DrmInfo object from the given info.
	 *
	 * @param {string} keySystem
	 * @param {Array.<shaka.extern.InitDataOverride>} initData
	 * @return {shaka.extern.DrmInfo}
	 */
	static createDrmInfo(keySystem, initData) {
		return {
			keySystem: keySystem,
			licenseServerUri: '',
			distinctiveIdentifierRequired: false,
			persistentStateRequired: false,
			audioRobustness: '',
			videoRobustness: '',
			serverCertificate: null,
			initData: initData || [],
			keyIds: []
		};
	}
}

/**
 * @enum {string}
 */
ManifestParserUtils.ContentType = {
	VIDEO: 'video',
	AUDIO: 'audio',
	TEXT: 'text',
	APPLICATION: 'application'
};

/**
 * @enum {string}
 */
ManifestParserUtils.TextStreamKind = {
	SUBTITLE: 'subtitle',
	CLOSED_CAPTION: 'caption'
};

/**
 * Specifies how tolerant the player is of inaccurate segment start times and
 * end times within a manifest. For example, gaps or overlaps between segments
 * in a SegmentTimeline which are greater than or equal to this value will
 * result in a warning message.
 *
 * @const {number}
 */
ManifestParserUtils.GAP_OVERLAP_TOLERANCE_SECONDS = 1 / 15;
