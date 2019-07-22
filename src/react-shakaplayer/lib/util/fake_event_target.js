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

// goog.provide('shaka.util.FakeEventTarget');

// goog.require('goog.asserts');
// goog.require('shaka.log');
// goog.require('shaka.util.FakeEvent');
// goog.require('shaka.util.MultiMap');

import FakeEvent from '../util/fake_event';
import MultiMap from '../util/multi_map';

/*eslint-disable*/
window.shaka = window.shaka || {};
var shaka = window.shaka;
var util = shaka.util || {};
window.goog = window.goog || {};
var goog = window.goog;

// console.log(window.shaka);

/**
 * @summary A work-alike for EventTarget.  Only DOM elements may be true
 * EventTargets, but this can be used as a base class to provide event dispatch
 * to non-DOM classes.  Only FakeEvents should be dispatched.
 *
 * @implements {EventTarget}
 * @exportInterface
 */
export default class FakeEventTarget {
	constructor() {
		/**
		 * @private {!shaka.util.MultiMap.<shaka.util.FakeEventTarget.ListenerType>}
		 */
		this.listeners_ = new MultiMap();

		/**
		 * The target of all dispatched events.  Defaults to |this|.
		 * @type {EventTarget}
		 */
		this.dispatchTarget = this;
	}

	/**
	 * Add an event listener to this object.
	 *
	 * @param {string} type The event type to listen for.
	 * @param {shaka.util.FakeEventTarget.ListenerType} listener The callback or
	 *   listener object to invoke.
	 * @param {(!AddEventListenerOptions|boolean)=} options Ignored.
	 * @override
	 * @exportInterface
	 */
	addEventListener(type, listener, options) {
		this.listeners_.push(type, listener);
	}

	/**
	 * Remove an event listener from this object.
	 *
	 * @param {string} type The event type for which you wish to remove a
	 *   listener.
	 * @param {shaka.util.FakeEventTarget.ListenerType} listener The callback or
	 *   listener object to remove.
	 * @param {(EventListenerOptions|boolean)=} options Ignored.
	 * @override
	 * @exportInterface
	 */
	removeEventListener(type, listener, options) {
		this.listeners_.remove(type, listener);
	}

	/**
	 * Dispatch an event from this object.
	 *
	 * @param {!Event} event The event to be dispatched from this object.
	 * @return {boolean} True if the default action was prevented.
	 * @override
	 * @exportInterface
	 */
	dispatchEvent(event) {
		// In many browsers, it is complex to overwrite properties of actual Events.
		// Here we expect only to dispatch FakeEvents, which are simpler.
		window.asserts.assert(event instanceof FakeEvent, 'FakeEventTarget can only dispatch FakeEvents!');

		const listeners = this.listeners_.get(event.type) || [];

		// Execute this event on listeners until the event has been stopped or we
		// run out of listeners.
		for (const listener of listeners) {
			// Do this every time, since events can be re-dispatched from handlers.
			event.target = this.dispatchTarget;
			event.currentTarget = this.dispatchTarget;

			try {
				// Check for the |handleEvent| member to test if this is a
				// |EventListener| instance or a basic function.
				if (listener.handleEvent) {
					listener.handleEvent(event);
				} else {
					// eslint-disable-next-line no-restricted-syntax
					listener.call(this, event);
				}
			} catch (exception) {
				// Exceptions during event handlers should not affect the caller,
				// but should appear on the console as uncaught, according to MDN:
				// https://mzl.la/2JXgwRo
				shaka.log.error(
					'Uncaught exception in event handler',
					exception,
					exception ? exception.message : null,
					exception ? exception.stack : null
				);
			}

			if (event.stopped) {
				break;
			}
		}

		return event.defaultPrevented;
	}
}

/**
 * These are the listener types defined in the closure extern for EventTarget.
 * @typedef {EventListener|function(!Event):*}
 * @exportInterface
 */
// shaka.util.FakeEventTarget.ListenerType;

// export { FakeEventTarget, ListenerType };
