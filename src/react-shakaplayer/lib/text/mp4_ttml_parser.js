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

// goog.provide('shaka.text.Mp4TtmlParser');

// goog.require('shaka.text.TextEngine');
// goog.require('shaka.text.TtmlTextParser');
// goog.require('shaka.util.Error');
// goog.require('shaka.util.Mp4Parser');

import TextEngine from '../text/text_engine';
import TtmlTextParser from '../text/ttml_text_parser';
import error from '../util/error';
import Mp4Parser from '../util/mp4_parser';

var shaka = window.shaka;
// var goog = window.goog;

/**
 * @implements {shaka.extern.TextParser}
 */
class Mp4TtmlParser {
	constructor() {
		/**
		 * @type {!shaka.extern.TextParser}
		 * @private
		 */
		this.parser_ = new TtmlTextParser();
	}

	/** @override **/
	parseInit(data) {
		// const Mp4Parser = Mp4Parser;

		let sawSTPP = false;

		new Mp4Parser()
			.box('moov', Mp4Parser.children)
			.box('trak', Mp4Parser.children)
			.box('mdia', Mp4Parser.children)
			.box('minf', Mp4Parser.children)
			.box('stbl', Mp4Parser.children)
			.fullBox('stsd', Mp4Parser.sampleDescription)
			.box('stpp', box => {
				sawSTPP = true;
				box.parser.stop();
			})
			.parse(data);

		if (!sawSTPP) {
			throw new error(error.Severity.CRITICAL, error.Category.TEXT, error.Code.INVALID_MP4_TTML);
		}
	}

	/** @override **/
	parseMedia(data, time) {
		const Mp4Parser = shaka.util.Mp4Parser;

		let sawMDAT = false;
		let payload = [];

		new Mp4Parser()
			.box(
				'mdat',
				Mp4Parser.allData(data => {
					sawMDAT = true;
					// Join this to any previous payload, in case the mp4 has multiple
					// mdats.
					payload = payload.concat(this.parser_.parseMedia(data, time));
				})
			)
			.parse(data);

		if (!sawMDAT) {
			throw new error(error.Severity.CRITICAL, error.Category.TEXT, error.Code.INVALID_MP4_TTML);
		}

		return payload;
	}
}

TextEngine.registerParser('application/mp4; codecs="stpp"', Mp4TtmlParser);
TextEngine.registerParser('application/mp4; codecs="stpp.TTML.im1t"', Mp4TtmlParser);

export default Mp4TtmlParser;
