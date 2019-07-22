/*eslint-disable*/
import React from 'react';

// console.log(window.goog);

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
// import '../dist/demo.compiled.js';

// The compiled library, with UI, debug mode.
// import '../dist/shaka-player.ui.debug.js';
// The compiled demo.
// import '../dist/demo.compiled.debug.js';

// Bootstrap the Shaka Player library through the Closure library.
// import './third_party/closure/goog/base.js';
// import './dist/deps.js';
// This is required for goog.asserts.
import './lib/debug/asserts.js';
// This file contains goog.require calls for all exported library classNamees.
// import '../shaka-player.uncompiled.js';
// Enable less, the CSS pre-processor.
import 'less/dist/less.js';
// These are the individual parts of the demo app.
// import './js/common/asset.js';
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

// console.log(window.goog, window.shaka);
export default function ReactShakaPlayer(props) {
	return (
		<div id='main-layout' className='mdl-layout mdl-js-layout mdl-layout--fixed-header'>
			<header className='app-header mdl-layout__header'>
				<header className='mdl-layout__header-row' id='nav-button-container'>
					<img alt='Shaka Player Logo' src='shaka_logo_trans.png' className='logo' />
					<button
						id='nav-button-front'
						className='mdl-button mdl-js-button mdl-js-ripple-effect should-disable-on-fail'
						defaultselected
					>
						HOME
					</button>
					<button
						id='nav-button-search'
						className='mdl-button mdl-js-button mdl-js-ripple-effect should-disable-on-fail'
					>
						SEARCH
					</button>
					<button
						id='nav-button-custom'
						className='mdl-button mdl-js-button mdl-js-ripple-effect should-disable-on-fail'
					>
						CUSTOM CONTENT
					</button>
					<div className='mdl-layout-spacer' />
					<div id='version-block'>
						<span id='version-string' />
					</div>
				</header>
			</header>
			<div className='mdl-layout__drawer hamburger-menu'>
				<div id='hamburger-menu-title' className='mdl-layout-title'>
					Demo
					<div className='mdl-layout-spacer' />
					<button
						id='drawer-close-button'
						className='mdl-button mdl-js-button mdl-button--icon should-disable-on-fail'
					>
						<i className='material-icons'>close</i>
					</button>
				</div>
				<nav className='mdl-navigation' id='hamburger-menu-contents' />
			</div>
			<div id='error-display' className='hidden'>
				<div id='error-display-close-button'>x</div>
				<a id='error-display-link' href='#' />
			</div>
			<main className='mdl-layout__content' id='main-div'>
				<div id='video-bar' className='hidden'>
					<div
						data-shaka-player-container
						data-shaka-player-cast-receiver-id='7B25EC44'
						className='video-container'
					>
						<video data-shaka-player autoplay playsinline id='video' />
					</div>
				</div>
				<div id='contents' />
				<footer className='mdl-mega-footer'>
					<div className='mdl-mega-footer__middle-section'>
						<div className='mdl-mega-footer__drop-down-section'>
							<h1 className='mdl-mega-footer__heading'>PROJECT LINKS</h1>
							<ul className='mdl-mega-footer__link-list'>
								<li>
									<a rel='noopener' target='_blank' href='../docs/api/index.html'>
										Documentation
									</a>
								</li>
								<li>
									<a
										rel='noopener'
										target='_blank'
										href='https://www.apache.org/licenses/LICENSE-2.0'
									>
										Apache License
									</a>
								</li>
								<li>
									<a rel='noopener' target='_blank' href='https://github.com/google/shaka-player'>
										Source on GitHub
									</a>
								</li>
								<li>
									<a rel='noopener' target='_blank' href='https://www.npmjs.com/package/shaka-player'>
										Package on NPM
									</a>
								</li>
								<li>
									<a rel='noopener' target='_blank' href='../support.html'>
										Browser Support Test
									</a>
								</li>
							</ul>
						</div>
						<div className='mdl-mega-footer__drop-down-section'>
							<h1 className='mdl-mega-footer__heading'>CDN</h1>
							<ul className='mdl-mega-footer__link-list'>
								<li>
									<a
										rel='noopener'
										target='_blank'
										href='https://developers.google.com/speed/libraries/#shaka-player'
									>
										Google Hosted Libraries
									</a>
								</li>
								<li>
									<a
										rel='noopener'
										target='_blank'
										href='https://www.jsdelivr.com/package/npm/shaka-player'
									>
										jsDelivr
									</a>
								</li>
								<li>
									<a rel='noopener' target='_blank' href='https://cdnjs.com/libraries/shaka-player'>
										CDNJS
									</a>
								</li>
							</ul>
						</div>
						<div className='mdl-mega-footer__drop-down-section'>
							<h1 className='mdl-mega-footer__heading'>DEMO MODE</h1>
							<ul className='mdl-mega-footer__link-list' id='compiled-links'>
								<li>
									<a href='#build=compiled' id='compiled-link'>
										Compiled (Release)
									</a>
								</li>
								<li>
									<a href='#build=debug_compiled' id='debug-compiled-link'>
										Compiled (Debug)
									</a>
								</li>
								<li>
									<a href='#build=uncompiled' id='uncompiled-link'>
										Uncompiled
									</a>
								</li>
							</ul>
						</div>
					</div>
				</footer>
			</main>
		</div>
	);
}
