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

// goog.provide('shaka.hls.Utils');

// goog.require('shaka.util.ManifestParserUtils');

import ManifestParserUtils from '../util/manifest_parser_utils';

var shaka = window.shaka;
var goog = window.goog;

export default class Utils {
	/**
	 *
	 * @param {!Array.<!Tag>} tags
	 * @param {string} name
	 * @return {!Array.<!Tag>}
	 */
	static filterTagsByName(tags, name) {
		return tags.filter(tag => {
			return tag.name == name;
		});
	}

	/**
	 *
	 * @param {!Array.<!Tag>} tags
	 * @param {string} name
	 * @return {?Tag}
	 */
	static getFirstTagWithName(tags, name) {
		const tagsWithName = Utils.filterTagsByName(tags, name);
		if (!tagsWithName.length) {
			return null;
		}

		return tagsWithName[0];
	}

	/**
	 * @param {!Array.<!Tag>} tags An array of EXT-X-MEDIA tags.
	 * @param {string} type
	 * @param {string} groupId
	 * @return {!Array.<!Tag>} The first tag that has the given media
	 *   type and group id.
	 */
	static findMediaTags(tags, type, groupId) {
		return tags.filter(tag => {
			const typeAttr = tag.getAttribute('TYPE');
			const groupIdAttr = tag.getAttribute('GROUP-ID');
			return typeAttr.value == type && groupIdAttr.value == groupId;
		});
	}

	/**
	 * @param {string} parentAbsoluteUri
	 * @param {string} uri
	 * @return {string}
	 */
	static constructAbsoluteUri(parentAbsoluteUri, uri) {
		const uris = ManifestParserUtils.resolveUris([parentAbsoluteUri], [uri]);

		return uris[0];
	}

	/**
	 * Matches a string to an HLS comment format and returns the result.
	 *
	 * @param {string} line
	 * @return {boolean}
	 */
	static isComment(line) {
		return /^#(?!EXT)/m.test(line);
	}
}
