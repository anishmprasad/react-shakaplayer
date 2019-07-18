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

goog.provide('shaka.test.Dash');


/** @summary Utilities for working with the DASH parser. */
shaka.test.Dash = class {
  /**
   * Constructs and configures a very simple DASH parser.
   * @return {!shaka.dash.DashParser}
   */
  static makeDashParser() {
    const parser = new shaka.dash.DashParser();
    const config = shaka.util.PlayerConfiguration.createDefault().manifest;
    parser.configure(config);
    return parser;
  }

  /**
   * Tests the segment index produced by the DASH manifest parser.
   *
   * @param {string} manifestText
   * @param {!Array.<shaka.media.SegmentReference>} references
   * @return {!Promise}
   */
  static async testSegmentIndex(manifestText, references) {
    const buffer = shaka.util.StringUtils.toUTF8(manifestText);
    const dashParser = shaka.test.Dash.makeDashParser();

    const networkingEngine = new shaka.test.FakeNetworkingEngine()
        .setResponseValue('dummy://foo', buffer);

    const playerInterface = {
      networkingEngine: networkingEngine,
      filterNewPeriod: () => {},
      filterAllPeriods: () => {},
      onTimelineRegionAdded: fail,  // Should not have any EventStream elements.
      onEvent: fail,
      onError: fail,
    };
    const manifest = await dashParser.start('dummy://foo', playerInterface);
    const stream = manifest.periods[0].variants[0].video;
    await stream.createSegmentIndex();
    shaka.test.ManifestParser.verifySegmentIndex(stream, references);
  }

  /**
   * Tests that the DASH manifest parser fails to parse the given manifest.
   *
   * @param {string} manifestText
   * @param {!shaka.util.Error} expectedError
   * @return {!Promise}
   */
  static async testFails(manifestText, expectedError) {
    const manifestData = shaka.util.StringUtils.toUTF8(manifestText);
    const dashParser = shaka.test.Dash.makeDashParser();

    const networkingEngine = new shaka.test.FakeNetworkingEngine()
        .setResponseValue('dummy://foo', manifestData);

    const playerInterface = {
      networkingEngine: networkingEngine,
      filterNewPeriod: () => {},
      filterAllPeriods: () => {},
      onTimelineRegionAdded: fail,  // Should not have any EventStream elements.
      onEvent: fail,
      onError: fail,
    };
    const p = dashParser.start('dummy://foo', playerInterface);
    await expectAsync(p).toBeRejectedWith(
        shaka.test.Util.jasmineError(expectedError));
  }

  /**
   * Makes a simple manifest with the given representation contents.
   *
   * @param {!Array.<string>} lines
   * @param {number=} duration
   * @param {number=} startTime
   * @return {string}
   */
  static makeSimpleManifestText(lines, duration, startTime) {
    let periodAttr = '';
    let mpdAttr = 'type="dynamic" availabilityStartTime="1970-01-01T00:00:00Z"';
    if (duration) {
      periodAttr = 'duration="PT' + duration + 'S"';
      mpdAttr = 'type="static"';
    }
    if (startTime) {
      periodAttr += ' start="PT' + startTime + 'S"';
    }

    const start = [
      '<MPD ' + mpdAttr + '>',
      '  <Period ' + periodAttr + '>',
      '    <AdaptationSet mimeType="video/mp4">',
      '      <Representation bandwidth="500">',
      '        <BaseURL>http://example.com</BaseURL>',
    ];
    const end = [
      '      </Representation>',
      '    </AdaptationSet>',
      '  </Period>',
      '</MPD>',
    ];
    return start.concat(lines, end).join('\n');
  }

  /**
   * Makes a simple manifest object for jasmine.toEqual; this does not do any
   * checking.  This only constructs one period with the given stream sets.
   *
   * @param {!Array.<shaka.extern.Variant>} variants
   * @return {shaka.extern.Manifest}
   */
  static makeManifestFromVariants(variants) {
    return /** @type {shaka.extern.Manifest} */ (jasmine.objectContaining({
      periods: [
        jasmine.objectContaining({
          variants: variants,
        }),
      ],
    }));
  }

  /**
   * Makes a simple manifest object for jasmine.toEqual; this does not do any
   * checking.  This only constructs one period with one stream with the given
   * initialization segment data.
   *
   * @param {string} uri The URI of the initialization segment.
   * @param {number} startByte
   * @param {?number} endByte
   * @param {number=} pto The presentationTimeOffset of the stream.
   * @return {shaka.extern.Manifest}
   */
  static makeManifestFromInit(uri, startByte, endByte, pto) {
    return shaka.test.Dash.makeManifestFromVariants([jasmine.objectContaining({
      video: jasmine.objectContaining({
        presentationTimeOffset: (pto || 0),
        createSegmentIndex: jasmine.any(Function),
        initSegmentReference: new shaka.media.InitSegmentReference(
            () => ['http://example.com/' + uri], startByte, endByte),
      }),
    })]);
  }

  /**
   * Calls the createSegmentIndex function of the manifest.  Because we are
   * returning fake data, the parser will fail to parse the segment index; we
   * swallow the error and return a promise that will resolve.
   *
   * @param {shaka.extern.Manifest} manifest
   * @return {!Promise}
   */
  static async callCreateSegmentIndex(manifest) {
    const stream = manifest.periods[0].variants[0].video;
    await expectAsync(stream.createSegmentIndex()).toBeRejected();
  }

  /**
   * Makes a set of tests for SegmentTimeline.  This is used to test
   * SegmentTimeline within both SegmentList and SegmentTemplate.
   *
   * @param {string} type The type of manifest being tested; either
   *   'SegmentTemplate' or 'SegmentList'.
   * @param {string} extraAttrs
   * @param {!Array.<string>} extraChildren
   */
  static makeTimelineTests(type, extraAttrs, extraChildren) {
    describe('SegmentTimeline', () => {
      const Dash = shaka.test.Dash;
      const ManifestParser = shaka.test.ManifestParser;
      const baseUri = 'http://example.com/';

      /**
       * @param {!Array.<string>} timeline
       * @param {string} testAttrs
       * @param {number=} dur
       * @param {number=} startTime
       * @return {string}
       */
      function makeManifestText(timeline, testAttrs, dur, startTime) {
        const start = '<' + type + ' ' + extraAttrs + ' ' + testAttrs + '>';
        const end = '</' + type + '>';
        const lines = [].concat(start, extraChildren, timeline, end);
        return Dash.makeSimpleManifestText(lines, dur, startTime);
      }

      // All tests should have 5 segments and have the relative URIs:
      // s1.mp4  s2.mp4  s3.mp4  s4.mp4  s5.mp4
      it('basic support', async () => {
        const timeline = [
          '<SegmentTimeline>',
          '  <S d="12" t="34" />',
          '  <S d="21" />',
          '  <S d="44" />',
          '  <S d="10" />',
          '  <S d="10" />',
          '</SegmentTimeline>',
        ];
        const source = makeManifestText(timeline, '');
        const references = [
          ManifestParser.makeReference('s1.mp4', 1, 34, 46, baseUri),
          ManifestParser.makeReference('s2.mp4', 2, 46, 67, baseUri),
          ManifestParser.makeReference('s3.mp4', 3, 67, 111, baseUri),
          ManifestParser.makeReference('s4.mp4', 4, 111, 121, baseUri),
          ManifestParser.makeReference('s5.mp4', 5, 121, 131, baseUri),
        ];
        await Dash.testSegmentIndex(source, references);
      });

      it('supports repetitions', async () => {
        const timeline = [
          '<SegmentTimeline>',
          '  <S d="12" t="34" />',
          '  <S d="10" r="2" />',
          '  <S d="44" />',
          '</SegmentTimeline>',
        ];
        const source = makeManifestText(timeline, '');
        const references = [
          ManifestParser.makeReference('s1.mp4', 1, 34, 46, baseUri),
          ManifestParser.makeReference('s2.mp4', 2, 46, 56, baseUri),
          ManifestParser.makeReference('s3.mp4', 3, 56, 66, baseUri),
          ManifestParser.makeReference('s4.mp4', 4, 66, 76, baseUri),
          ManifestParser.makeReference('s5.mp4', 5, 76, 120, baseUri),
        ];
        await Dash.testSegmentIndex(source, references);
      });

      it('supports negative repetitions', async () => {
        const timeline = [
          '<SegmentTimeline>',
          '  <S d="8" t="22" />',
          '  <S d="10" r="-1" />',
          '  <S d="12" t="50" />',
          '  <S d="10" />',
          '</SegmentTimeline>',
        ];
        const source = makeManifestText(timeline, '');
        const references = [
          ManifestParser.makeReference('s1.mp4', 1, 22, 30, baseUri),
          ManifestParser.makeReference('s2.mp4', 2, 30, 40, baseUri),
          ManifestParser.makeReference('s3.mp4', 3, 40, 50, baseUri),
          ManifestParser.makeReference('s4.mp4', 4, 50, 62, baseUri),
          ManifestParser.makeReference('s5.mp4', 5, 62, 72, baseUri),
        ];
        await Dash.testSegmentIndex(source, references);
      });

      it('supports negative repetitions at end', async () => {
        const timeline = [
          '<SegmentTimeline>',
          '  <S d="5" t="5" />',
          '  <S d="10" r="-1" />',
          '</SegmentTimeline>',
        ];
        const source = makeManifestText(timeline, '', 50 /* duration */);
        const references = [
          ManifestParser.makeReference('s1.mp4', 1, 5, 10, baseUri),
          ManifestParser.makeReference('s2.mp4', 2, 10, 20, baseUri),
          ManifestParser.makeReference('s3.mp4', 3, 20, 30, baseUri),
          ManifestParser.makeReference('s4.mp4', 4, 30, 40, baseUri),
          ManifestParser.makeReference('s5.mp4', 5, 40, 50, baseUri),
        ];
        await Dash.testSegmentIndex(source, references);
      });

      it('gives times relative to period', async () => {
        const timeline = [
          '<SegmentTimeline>',
          '  <S t="0" d="10" r="-1" />',
          '</SegmentTimeline>',
        ];
        const source =
            makeManifestText(timeline, '', 50 /* duration */, 30 /* start */);
        const references = [
          ManifestParser.makeReference('s1.mp4', 1, 0, 10, baseUri),
          ManifestParser.makeReference('s2.mp4', 2, 10, 20, baseUri),
          ManifestParser.makeReference('s3.mp4', 3, 20, 30, baseUri),
          ManifestParser.makeReference('s4.mp4', 4, 30, 40, baseUri),
          ManifestParser.makeReference('s5.mp4', 5, 40, 50, baseUri),
        ];
        await Dash.testSegmentIndex(source, references);
      });

      it('supports @timescale', async () => {
        const timeline = [
          '<SegmentTimeline>',
          '  <S d="4500" t="18000" />',
          '  <S d="9000" />',
          '  <S d="31500" />',
          '  <S d="9000" />',
          '  <S d="9000" />',
          '</SegmentTimeline>',
        ];
        const source = makeManifestText(timeline, 'timescale="9000"');
        const references = [
          ManifestParser.makeReference('s1.mp4', 1, 2, 2.5, baseUri),
          ManifestParser.makeReference('s2.mp4', 2, 2.5, 3.5, baseUri),
          ManifestParser.makeReference('s3.mp4', 3, 3.5, 7, baseUri),
          ManifestParser.makeReference('s4.mp4', 4, 7, 8, baseUri),
          ManifestParser.makeReference('s5.mp4', 5, 8, 9, baseUri),
        ];
        await Dash.testSegmentIndex(source, references);
      });
    });
  }
};
