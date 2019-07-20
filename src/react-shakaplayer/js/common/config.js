/** @enum {string} */
const Source = {
	UNKNOWN: 'Unknown',
	CUSTOM: 'Custom',
	SHAKA: 'Shaka',
	AXINOM: 'Axinom',
	UNIFIED_STREAMING: 'Unified Streaming',
	DASH_IF: 'DASH-IF',
	WOWZA: 'Wowza',
	BITCODIN: 'Bitcodin',
	NIMBLE_STREAMER: 'Nimble Streamer',
	AZURE_MEDIA_SERVICES: 'Azure Media Services',
	GPAC: 'GPAC',
	UPLYNK: 'Verizon Digital Media Services'
};

/** @enum {string} */
const KeySystem = {
	CLEAR_KEY: 'org.w3.clearkey',
	FAIRPLAY: 'com.apple.fps.1_0',
	PLAYREADY: 'com.microsoft.playready',
	WIDEVINE: 'com.widevine.alpha',
	CLEAR: 'no drm protection'
};

/** @enum {string} */
const Feature = {
	// Set if the asset has more than one drm key defined.
	MULTIKEY: 'multiple keys',
	// Set if the asset has multiple periods.
	MULTIPERIOD: 'multiple Periods',
	ENCRYPTED_WITH_CLEAR: 'mixing encrypted and unencrypted periods',
	AESCTR_16_BYTE_IV: 'encrypted with AES CTR Mode using a 16 byte IV',
	AESCTR_8_BYTE_IV: 'encrypted with AES CTR Mode using a 8 byte IV',
	// Set if the asset has a special trick mode track, for rewinding effects.
	TRICK_MODE: 'Special trick mode track',
	XLINK: 'XLink',

	// Set if the asset has any subtitle tracks.
	SUBTITLES: 'Subtitles',
	// Set if the asset has any closed caption tracks.
	CAPTIONS: 'Captions',
	EMBEDDED_TEXT: 'embedded text',
	// Set if the asset has multiple audio languages.
	MULTIPLE_LANGUAGES: 'multiple languages',
	// Set if the asset is audio-only.
	AUDIO_ONLY: 'audio only',
	OFFLINE: 'Downloadable',
	// A synthetic property used in the search tab. Should not be given to assets.
	STORED: 'Downloaded',

	// Set if the asset is a livestream.
	LIVE: 'Live',
	// Set if the asset has at least one WebM stream.
	WEBM: 'WebM',
	// Set if the asset has at least one mp4 stream.
	MP4: 'MP4',
	// Set if the asset has at least one MPEG-2 TS stream.
	MP2TS: 'MPEG-2 TS',
	// Set if the asset has at least one TTML text track.
	TTML: 'TTML',
	// Set if the asset has at least one WEBVTT text track.
	WEBVTT: 'WebVTT',

	// Set if the asset has at least one stream that is at least 720p.
	HIGH_DEFINITION: 'High definition',
	// Set if the asset has at least one stream that is at least 4k.
	ULTRA_HIGH_DEFINITION: 'Ultra-high definition',

	// Set if the asset has at least one stream that is surround sound.
	SURROUND: 'Surround sound',

	// Set if the asset is a MPEG-DASH manifest.
	DASH: 'DASH',
	// Set if the asset is an HLS manifest.
	HLS: 'HLS'
};

export { Source, KeySystem, Feature };
