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

// goog.provide('shaka.media.WebmSegmentIndexParser');

// goog.require('goog.asserts');
// goog.require('shaka.log');
// goog.require('shaka.media.SegmentReference');
// goog.require('shaka.util.EbmlElement');
// goog.require('shaka.util.EbmlParser');
// goog.require('shaka.util.Error');

import { SegmentReference } from '../media/segment_reference';
import { EbmlElement, EbmlParser } from '../util/ebml_parser';
import Error from '../util/error';

var shaka = window.shaka;
var goog = window.goog;

export default class WebmSegmentIndexParser {
	/**
   * Parses SegmentReferences from a WebM container.
   * @param {!ArrayBuffer} cuesData The WebM container's "Cueing Data" section.
   * @param {!ArrayBuffer} initData The WebM container's headers.
   * @param {!Array.<string>} uris The possible locations of the WebM file that
   *   contains the segments.
   * @param {number} scaledPresentationTimeOffset

   * @return {!Array.<!SegmentReference>}
   * @throws {Error}
   * @see http://www.matroska.org/technical/specs/index.html
   * @see http://www.webmproject.org/docs/container/
   */
	static parse(cuesData, initData, uris, scaledPresentationTimeOffset) {
		const tuple = WebmSegmentIndexParser.parseWebmContainer_(initData);
		const parser = new EbmlParser(new DataView(cuesData));
		const cuesElement = parser.parseElement();
		if (cuesElement.id != WebmSegmentIndexParser.CUES_ID) {
			shaka.log.error('Not a Cues element.');
			throw new Error(Error.Severity.CRITICAL, Error.Category.MEDIA, Error.Code.WEBM_CUES_ELEMENT_MISSING);
		}

		return WebmSegmentIndexParser.parseCues_(
			cuesElement,
			tuple.segmentOffset,
			tuple.timecodeScale,
			tuple.duration,
			uris,
			scaledPresentationTimeOffset
		);
	}

	/**
	 * Parses a WebM container to get the segment's offset, timecode scale, and
	 * duration.
	 *
	 * @param {!ArrayBuffer} initData
	 * @return {{segmentOffset: number, timecodeScale: number, duration: number}}
	 *   The segment's offset in bytes, the segment's timecode scale in seconds,
	 *   and the duration in seconds.
	 * @throws {Error}
	 * @private
	 */
	static parseWebmContainer_(initData) {
		const parser = new EbmlParser(new DataView(initData));

		// Check that the WebM container data starts with the EBML header, but
		// skip its contents.
		const ebmlElement = parser.parseElement();
		if (ebmlElement.id != WebmSegmentIndexParser.EBML_ID) {
			shaka.log.error('Not an EBML element.');
			throw new Error(Error.Severity.CRITICAL, Error.Category.MEDIA, Error.Code.WEBM_EBML_HEADER_ELEMENT_MISSING);
		}

		const segmentElement = parser.parseElement();
		if (segmentElement.id != WebmSegmentIndexParser.SEGMENT_ID) {
			shaka.log.error('Not a Segment element.');
			throw new Error(Error.Severity.CRITICAL, Error.Category.MEDIA, Error.Code.WEBM_SEGMENT_ELEMENT_MISSING);
		}

		// This value is used as the initial offset to the first referenced segment.
		const segmentOffset = segmentElement.getOffset();

		// Parse the Segment element to get the segment info.
		const segmentInfo = WebmSegmentIndexParser.parseSegment_(segmentElement);
		return {
			segmentOffset: segmentOffset,
			timecodeScale: segmentInfo.timecodeScale,
			duration: segmentInfo.duration
		};
	}

	/**
	 * Parses a WebM Info element to get the segment's timecode scale and
	 * duration.
	 * @param {!EbmlElement} segmentElement
	 * @return {{timecodeScale: number, duration: number}} The segment's timecode
	 *   scale in seconds and duration in seconds.
	 * @throws {Error}
	 * @private
	 */
	static parseSegment_(segmentElement) {
		const parser = segmentElement.createParser();

		// Find the Info element.
		let infoElement = null;
		while (parser.hasMoreData()) {
			const elem = parser.parseElement();
			if (elem.id != WebmSegmentIndexParser.INFO_ID) {
				continue;
			}

			infoElement = elem;

			break;
		}

		if (!infoElement) {
			shaka.log.error('Not an Info element.');
			throw new Error(Error.Severity.CRITICAL, Error.Category.MEDIA, Error.Code.WEBM_INFO_ELEMENT_MISSING);
		}

		return WebmSegmentIndexParser.parseInfo_(infoElement);
	}

	/**
	 * Parses a WebM Info element to get the segment's timecode scale and
	 * duration.
	 * @param {!EbmlElement} infoElement
	 * @return {{timecodeScale: number, duration: number}} The segment's timecode
	 *   scale in seconds and duration in seconds.
	 * @throws {Error}
	 * @private
	 */
	static parseInfo_(infoElement) {
		const parser = infoElement.createParser();

		// The timecode scale factor in units of [nanoseconds / T], where [T] are
		// the units used to express all other time values in the WebM container.
		// By default it's assumed that [T] == [milliseconds].
		let timecodeScaleNanoseconds = 1000000;
		/** @type {?number} */
		let durationScale = null;

		while (parser.hasMoreData()) {
			const elem = parser.parseElement();
			if (elem.id == WebmSegmentIndexParser.TIMECODE_SCALE_ID) {
				timecodeScaleNanoseconds = elem.getUint();
			} else if (elem.id == WebmSegmentIndexParser.DURATION_ID) {
				durationScale = elem.getFloat();
			}
		}
		if (durationScale == null) {
			throw new Error(Error.Severity.CRITICAL, Error.Category.MEDIA, Error.Code.WEBM_DURATION_ELEMENT_MISSING);
		}

		// The timecode scale factor in units of [seconds / T].
		const timecodeScale = timecodeScaleNanoseconds / 1000000000;
		// The duration is stored in units of [T]
		const durationSeconds = durationScale * timecodeScale;

		return { timecodeScale: timecodeScale, duration: durationSeconds };
	}

	/**
	 * Parses a WebM CuesElement.
	 * @param {!EbmlElement} cuesElement
	 * @param {number} segmentOffset
	 * @param {number} timecodeScale
	 * @param {number} duration
	 * @param {!Array.<string>} uris
	 * @param {number} scaledPresentationTimeOffset
	 * @return {!Array.<!SegmentReference>}
	 * @throws {Error}
	 * @private
	 */
	static parseCues_(cuesElement, segmentOffset, timecodeScale, duration, uris, scaledPresentationTimeOffset) {
		const references = [];
		const getUris = () => uris;

		const parser = cuesElement.createParser();

		let lastTime = null;
		let lastOffset = null;

		while (parser.hasMoreData()) {
			const elem = parser.parseElement();
			if (elem.id != WebmSegmentIndexParser.CUE_POINT_ID) {
				continue;
			}

			const tuple = WebmSegmentIndexParser.parseCuePoint_(elem);
			if (!tuple) {
				continue;
			}

			// Substract the presentation time offset from the unscaled time
			const currentTime = timecodeScale * tuple.unscaledTime;
			const currentOffset = segmentOffset + tuple.relativeOffset;

			if (lastTime != null) {
				window.asserts.assert(lastOffset != null, 'last offset cannot be null');

				references.push(
					new SegmentReference(
						references.length,
						lastTime - scaledPresentationTimeOffset,
						currentTime - scaledPresentationTimeOffset,
						getUris,
						lastOffset,
						currentOffset - 1
					)
				);
			}

			lastTime = currentTime;
			lastOffset = currentOffset;
		}

		if (lastTime != null) {
			window.asserts.assert(lastOffset != null, 'last offset cannot be null');

			references.push(
				new SegmentReference(
					references.length,
					lastTime - scaledPresentationTimeOffset,
					duration - scaledPresentationTimeOffset,
					getUris,
					lastOffset,
					null
				)
			);
		}

		return references;
	}

	/**
	 * Parses a WebM CuePointElement to get an "unadjusted" segment reference.
	 * @param {EbmlElement} cuePointElement
	 * @return {{unscaledTime: number, relativeOffset: number}} The referenced
	 *   segment's start time in units of [T] (see parseInfo_()), and the
	 *   referenced segment's offset in bytes, relative to a WebM Segment
	 *   element.
	 * @throws {Error}
	 * @private
	 */
	static parseCuePoint_(cuePointElement) {
		const parser = cuePointElement.createParser();

		// Parse CueTime element.
		const cueTimeElement = parser.parseElement();
		if (cueTimeElement.id != WebmSegmentIndexParser.CUE_TIME_ID) {
			shaka.log.warning('Not a CueTime element.');
			throw new Error(Error.Severity.CRITICAL, Error.Category.MEDIA, Error.Code.WEBM_CUE_TIME_ELEMENT_MISSING);
		}
		const unscaledTime = cueTimeElement.getUint();

		// Parse CueTrackPositions element.
		const cueTrackPositionsElement = parser.parseElement();
		if (cueTrackPositionsElement.id != WebmSegmentIndexParser.CUE_TRACK_POSITIONS_ID) {
			shaka.log.warning('Not a CueTrackPositions element.');
			throw new Error(
				Error.Severity.CRITICAL,
				Error.Category.MEDIA,
				Error.Code.WEBM_CUE_TRACK_POSITIONS_ELEMENT_MISSING
			);
		}

		const cueTrackParser = cueTrackPositionsElement.createParser();
		let relativeOffset = 0;

		while (cueTrackParser.hasMoreData()) {
			const elem = cueTrackParser.parseElement();
			if (elem.id != WebmSegmentIndexParser.CUE_CLUSTER_POSITION) {
				continue;
			}

			relativeOffset = elem.getUint();
			break;
		}

		return { unscaledTime: unscaledTime, relativeOffset: relativeOffset };
	}
}

/** @const {number} */
WebmSegmentIndexParser.EBML_ID = 0x1a45dfa3;

/** @const {number} */
WebmSegmentIndexParser.SEGMENT_ID = 0x18538067;

/** @const {number} */
WebmSegmentIndexParser.INFO_ID = 0x1549a966;

/** @const {number} */
WebmSegmentIndexParser.TIMECODE_SCALE_ID = 0x2ad7b1;

/** @const {number} */
WebmSegmentIndexParser.DURATION_ID = 0x4489;

/** @const {number} */
WebmSegmentIndexParser.CUES_ID = 0x1c53bb6b;

/** @const {number} */
WebmSegmentIndexParser.CUE_POINT_ID = 0xbb;

/** @const {number} */
WebmSegmentIndexParser.CUE_TIME_ID = 0xb3;

/** @const {number} */
WebmSegmentIndexParser.CUE_TRACK_POSITIONS_ID = 0xb7;

/** @const {number} */
WebmSegmentIndexParser.CUE_CLUSTER_POSITION = 0xf1;
