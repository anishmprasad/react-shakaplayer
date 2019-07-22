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

// goog.provide('shaka.polyfill.PatchedMediaKeysNop');

// goog.require('goog.asserts');
// goog.require('shaka.log');
// goog.require('shaka.polyfill');

import polyfill from './all';

var shaka = window.shaka;
var goog = window.goog;

/**
 * @summary A polyfill to stub out
 * {@link https://bit.ly/EmeMar15 EME draft 12 March 2015} on browsers without
 * EME.
 * All methods will fail.
 */
class PatchedMediaKeysNop {
	/**
	 * Installs the polyfill if needed.
	 */
	static install() {
		if (
			!window.HTMLVideoElement ||
			(navigator.requestMediaKeySystemAccess &&
				// eslint-disable-next-line no-restricted-syntax
				MediaKeySystemAccess.prototype.getConfiguration)
		) {
			return;
		}
		shaka.log.info('EME not available.');

		// Alias.
		const PatchedMediaKeysNop = shaka.polyfill.PatchedMediaKeysNop;

		// Install patches.
		navigator.requestMediaKeySystemAccess = PatchedMediaKeysNop.requestMediaKeySystemAccess;
		// Delete mediaKeys to work around strict mode compatibility issues.
		// eslint-disable-next-line no-restricted-syntax
		delete HTMLMediaElement.prototype['mediaKeys'];
		// Work around read-only declaration for mediaKeys by using a string.
		// eslint-disable-next-line no-restricted-syntax
		HTMLMediaElement.prototype['mediaKeys'] = null;
		// eslint-disable-next-line no-restricted-syntax
		HTMLMediaElement.prototype.setMediaKeys = PatchedMediaKeysNop.setMediaKeys;
		// These are not usable, but allow Player.isBrowserSupported to pass.
		window.MediaKeys = PatchedMediaKeysNop.MediaKeys;
		window.MediaKeySystemAccess = PatchedMediaKeysNop.MediaKeySystemAccess;
	}

	/**
	 * An implementation of navigator.requestMediaKeySystemAccess.
	 * Retrieves a MediaKeySystemAccess object.
	 *
	 * @this {!Navigator}
	 * @param {string} keySystem
	 * @param {!Array.<!MediaKeySystemConfiguration>} supportedConfigurations
	 * @return {!Promise.<!MediaKeySystemAccess>}
	 */
	static requestMediaKeySystemAccess(keySystem, supportedConfigurations) {
		shaka.log.debug('PatchedMediaKeysNop.requestMediaKeySystemAccess');
		window.asserts.assert(this == navigator, 'bad "this" for requestMediaKeySystemAccess');

		return Promise.reject(new Error('The key system specified is not supported.'));
	}

	/**
	 * An implementation of HTMLMediaElement.prototype.setMediaKeys.
	 * Attaches a MediaKeys object to the media element.
	 *
	 * @this {!HTMLMediaElement}
	 * @param {MediaKeys} mediaKeys
	 * @return {!Promise}
	 */
	static setMediaKeys(mediaKeys) {
		shaka.log.debug('PatchedMediaKeysNop.setMediaKeys');
		window.asserts.assert(this instanceof HTMLMediaElement, 'bad "this" for setMediaKeys');

		if (mediaKeys == null) {
			return Promise.resolve();
		}

		return Promise.reject(new Error('MediaKeys not supported.'));
	}
}

/**
 * An unusable constructor for MediaKeys.
 * @implements {MediaKeys}
 */
PatchedMediaKeysNop.MediaKeys = class {
	constructor() {
		throw new TypeError('Illegal constructor.');
	}

	/** @override */
	createSession() {}

	/** @override */
	setServerCertificate() {}
};

/**
 * An unusable constructor for MediaKeySystemAccess.
 * @implements {MediaKeySystemAccess}
 */
PatchedMediaKeysNop.MediaKeySystemAccess = class {
	constructor() {
		/** @override */
		this.keySystem = ''; // For the compiler.

		throw new TypeError('Illegal constructor.');
	}

	/** @override */
	getConfiguration() {}

	/** @override */
	createMediaKeys() {}
};

// A low priority ensures this is the last and acts as a fallback.
polyfill.register(PatchedMediaKeysNop.install, -10);

export default PatchedMediaKeysNop;
