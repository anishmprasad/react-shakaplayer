import React from 'react';

import './css/demo.css';
import './css/controls.css';

// transmuxing support is enabled by including this:
import 'mux.js/dist/mux.min.js';
// MDL is enabled by including this:
import 'material-design-lite/dist/material.min.js';
// MDL modal dialogs are enabled by including these:
import 'dialog-polyfill/dist/dialog-polyfill.js';
// Datalist - like fields are enabled by including these:
import 'awesomplete/awesomplete.min.js';
// tippy.js requires popper.js to work properly:
import 'popper.js/dist/umd/popper.min.js';
// Tooltips are made using tippy.js:
import 'tippy.js/umd/index.min.js';

// <script defer src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js"></script>

// The compiled library, with UI.
// import '../dist/shaka-player.ui.js';
// The compiled demo.
import '../dist/demo.compiled.js';

// The compiled library, with UI, debug mode.
import '../dist/shaka-player.ui.debug.js';
// The compiled demo.
import '../dist/demo.compiled.debug.js';

// Bootstrap the Shaka Player library through the Closure library.
import './third_party/closure/goog/base.js';
import './dist/deps.js';
// This is required for goog.asserts.
import '../lib/debug/asserts.js';
// This file contains goog.require calls for all exported library classes.
import '../shaka-player.uncompiled.js';
// Enable less, the CSS pre-processor.
import 'less/dist/less.js';
// These are the individual parts of the demo app.
import './js/common/asset.js';
import './js/common/assets.js';
import './js/demo_utils.js';
import './js/asset_card.js';
import './js/close_button.js';
import './js/input.js';
import './js/input_container.js';
import './js/tooltip.js';
import './js/main.js';
import './js/front.js';
import './js/search.js';
import './js/custom.js';
import './js/config.js';

export default function ReactShakaPlayer(props) {
	return <div>react shaka player</div>;
}
