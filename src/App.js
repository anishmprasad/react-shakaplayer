/*eslint-disable */
import React from 'react';
import ReactShakaPlayer from './react-shakaplayer';
import './App.css';
window.goog = {};
window.shaka = {};
// import './react-shakaplayer/js/load';

import './react-shakaplayer/lib/util/fake_event_target.js';
// console.log(window.shaka);
import './react-shakaplayer/lib/deprecate/deprecate';
// console.log(window.shaka);
import './react-shakaplayer/lib/player';
import './react-shakaplayer/lib/abr/simple_abr_manager';
import './react-shakaplayer/lib/cast/cast_proxy';
import './react-shakaplayer/lib/cast/cast_receiver';
import './react-shakaplayer/lib/dash/dash_parser';
import './react-shakaplayer/lib/hls/hls_parser';
import './react-shakaplayer/lib/debug/log';
import './react-shakaplayer/lib/media/adaptation_set_criteria';
import './react-shakaplayer/lib/media/segment_reference';
import './react-shakaplayer/lib/media/manifest_parser';
import './react-shakaplayer/lib/media/adaptation_set_criteria';
import './react-shakaplayer/lib/media/presentation_timeline';
import './react-shakaplayer/lib/media/segment_index';
import './react-shakaplayer/lib/media/segment_reference';
import './react-shakaplayer/lib/net/data_uri_plugin';
import './react-shakaplayer/lib/net/http_fetch_plugin';
import './react-shakaplayer/lib/net/http_xhr_plugin';
import './react-shakaplayer/lib/offline/offline_manifest_parser';
import './react-shakaplayer/lib/offline/offline_scheme';
import './react-shakaplayer/lib/offline/storage';
import './react-shakaplayer/lib/offline/indexeddb/storage_mechanism';
import './react-shakaplayer/lib/polyfill/fullscreen';
import './react-shakaplayer/lib/polyfill/indexed_db';
import './react-shakaplayer/lib/polyfill/input_event';
import './react-shakaplayer/lib/polyfill/mathround';
import './react-shakaplayer/lib/polyfill/mediasource';
import './react-shakaplayer/lib/polyfill/patchedmediakeys_apple';
import './react-shakaplayer/lib/polyfill/patchedmediakeys_ms';
import './react-shakaplayer/lib/polyfill/patchedmediakeys_nop';
import './react-shakaplayer/lib/polyfill/patchedmediakeys_webkit';
import './react-shakaplayer/lib/polyfill/pip_webkit';
import './react-shakaplayer/lib/polyfill/vttcue';
import './react-shakaplayer/lib/polyfill/video_play_promise';
import './react-shakaplayer/lib/polyfill/videoplaybackquality';
import './react-shakaplayer/lib/polyfill/all';
import './react-shakaplayer/lib/routing/walker';
import './react-shakaplayer/lib/text/cue';
import './react-shakaplayer/lib/text/mp4_ttml_parser';
import './react-shakaplayer/lib/text/mp4_vtt_parser';
import './react-shakaplayer/lib/text/text_engine';
import './react-shakaplayer/lib/text/ttml_text_parser';
import './react-shakaplayer/lib/text/vtt_text_parser';
import './react-shakaplayer/ui/controls';
import './react-shakaplayer/ui/overflow_menu';
import './react-shakaplayer/ui/audio_language_selection';
import './react-shakaplayer/ui/cast_button';
import './react-shakaplayer/ui/element';
import './react-shakaplayer/ui/fast_forward_button';
import './react-shakaplayer/ui/fullscreen_button';
import './react-shakaplayer/ui/localization';
import './react-shakaplayer/ui/mute_button';
import './react-shakaplayer/ui/ui';
import './react-shakaplayer/ui/pip_button';
import './react-shakaplayer/ui/play_pause_button';
import './react-shakaplayer/ui/presentation_time';
import './react-shakaplayer/ui/resolution_selection';
import './react-shakaplayer/ui/rewind_button';
import './react-shakaplayer/ui/spacer';
import './react-shakaplayer/ui/text_selection';
import './react-shakaplayer/ui/volume_bar';
import './react-shakaplayer/lib/util/dom_utils';
import './react-shakaplayer/lib/util/error';
import './react-shakaplayer/lib/util/iterables';

function App() {
	return (
		<div className='App'>
			<ReactShakaPlayer />
		</div>
	);
}

export default App;
