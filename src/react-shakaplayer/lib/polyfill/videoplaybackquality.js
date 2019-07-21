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

// goog.provide('shaka.polyfill.VideoPlaybackQuality');

// goog.require('shaka.polyfill');

import polyfill from './all';
var shaka = window.shaka;
// var goog = window.goog;

/**
 * @summary A polyfill to provide MSE VideoPlaybackQuality metrics.
 * Many browsers do not yet provide this API, and Chrome currently provides
 * similar data through individual prefixed attributes on HTMLVideoElement.
 */
class VideoPlaybackQuality {
	/**
	 * Install the polyfill if needed.
	 */
	static install() {
		if (!window.HTMLVideoElement) {
			// Avoid errors on very old browsers.
			return;
		}

		// eslint-disable-next-line no-restricted-syntax
		const proto = HTMLVideoElement.prototype;
		if (proto.getVideoPlaybackQuality) {
			// No polyfill needed.
			return;
		}

		if ('webkitDroppedFrameCount' in proto) {
			proto.getVideoPlaybackQuality = VideoPlaybackQuality.webkit_;
		}
	}

	/**
	 * @this {HTMLVideoElement}
	 * @return {!VideoPlaybackQuality}
	 * @private
	 */
	static webkit_() {
		return {
			droppedVideoFrames: this.webkitDroppedFrameCount,
			totalVideoFrames: this.webkitDecodedFrameCount,
			// Not provided by this polyfill:
			corruptedVideoFrames: 0,
			creationTime: NaN,
			totalFrameDelay: 0
		};
	}
}

polyfill.register(VideoPlaybackQuality.install);

export default VideoPlaybackQuality;
