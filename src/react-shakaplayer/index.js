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

export default function ReactShakaPlayer(props) {
	return <div>react shaka player</div>;
}
