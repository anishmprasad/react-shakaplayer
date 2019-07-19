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

goog.provide('shaka.util.MultiMap');


/**
 * @summary A simple multimap template.
 * @template T
 */
shaka.util.MultiMap = class {
  constructor() {
    /** @private {!Object.<string, !Array.<T>>} */
    this.map_ = {};
  }


  /**
   * Add a key, value pair to the map.
   * @param {string} key
   * @param {T} value
   */
  push(key, value) {
    if (this.map_.hasOwnProperty(key)) {
      this.map_[key].push(value);
    } else {
      this.map_[key] = [value];
    }
  }


  /**
   * Get a list of values by key.
   * @param {string} key
   * @return {Array.<T>} or null if no such key exists.
   */
  get(key) {
    const list = this.map_[key];
    // slice() clones the list so that it and the map can each be modified
    // without affecting the other.
    return list ? list.slice() : null;
  }


  /**
   * Get a list of all values.
   * @return {!Array.<T>}
   */
  getAll() {
    const list = [];
    for (const key in this.map_) {
      list.push(...this.map_[key]);
    }
    return list;
  }


  /**
   * Remove a specific value, if it exists.
   * @param {string} key
   * @param {T} value
   */
  remove(key, value) {
    const list = this.map_[key];
    if (!list) {
      return;
    }
    for (let i = 0; i < list.length; ++i) {
      if (list[i] == value) {
        list.splice(i, 1);
        --i;
      }
    }
  }


  /**
   * Clear all keys and values from the multimap.
   */
  clear() {
    this.map_ = {};
  }


  /**
   * @param {function(string, !Array.<T>)} callback
   */
  forEach(callback) {
    for (const key in this.map_) {
      callback(key, this.map_[key]);
    }
  }
};
