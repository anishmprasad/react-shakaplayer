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

describe('DashParser SegmentTemplate', () => {
  const Dash = shaka.test.Dash;
  const ManifestParser = shaka.test.ManifestParser;
  const baseUri = 'http://example.com/';

  /** @type {!shaka.test.FakeNetworkingEngine} */
  let fakeNetEngine;
  /** @type {!shaka.dash.DashParser} */
  let parser;
  /** @type {shaka.extern.ManifestParser.PlayerInterface} */
  let playerInterface;

  beforeEach(() => {
    fakeNetEngine = new shaka.test.FakeNetworkingEngine();
    parser = shaka.test.Dash.makeDashParser();

    playerInterface = {
      networkingEngine: fakeNetEngine,
      filterNewPeriod: () => {},
      filterAllPeriods: () => {},
      onTimelineRegionAdded: fail,  // Should not have any EventStream elements.
      onEvent: fail,
      onError: fail,
    };
  });

  shaka.test.Dash.makeTimelineTests(
      'SegmentTemplate', 'media="s$Number$.mp4"', []);

  describe('duration', () => {
    it('basic support', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="1" media="s$Number$.mp4"',
        '  duration="10" />',
      ], 60 /* duration */);
      const references = [
        ManifestParser.makeReference('s1.mp4', 0, 0, 10, baseUri),
        ManifestParser.makeReference('s2.mp4', 1, 10, 20, baseUri),
        ManifestParser.makeReference('s3.mp4', 2, 20, 30, baseUri),
        ManifestParser.makeReference('s4.mp4', 3, 30, 40, baseUri),
        ManifestParser.makeReference('s5.mp4', 4, 40, 50, baseUri),
        ManifestParser.makeReference('s6.mp4', 5, 50, 60, baseUri),
      ];
      await Dash.testSegmentIndex(source, references);
    });

    it('with @startNumber > 1', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="10" media="s$Number$.mp4"',
        '   duration="10" />',
      ], 30 /* duration */);
      const references = [
        ManifestParser.makeReference('s10.mp4', 0, 0, 10, baseUri),
        ManifestParser.makeReference('s11.mp4', 1, 10, 20, baseUri),
        ManifestParser.makeReference('s12.mp4', 2, 20, 30, baseUri),
      ];
      await Dash.testSegmentIndex(source, references);
    });

    it('honors presentationTimeOffset', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate media="s$Number$.mp4" duration="10"',
        ' presentationTimeOffset="50" />',
      ], 30 /* duration */);

      fakeNetEngine.setResponseText('dummy://foo', source);
      const manifest = await parser.start('dummy://foo', playerInterface);

      expect(manifest.periods.length).toBe(1);
      expect(manifest.periods[0].variants.length).toBe(1);

      const stream = manifest.periods[0].variants[0].video;
      expect(stream).toBeTruthy();
      await stream.createSegmentIndex();
      expect(stream.presentationTimeOffset).toBe(50);
      expect(stream.segmentIndex.get(0)).toEqual(
          ManifestParser.makeReference('s1.mp4', 0, 0, 10, baseUri));
      expect(stream.segmentIndex.get(1)).toEqual(
          ManifestParser.makeReference('s2.mp4', 1, 10, 20, baseUri));
    });

    it('handles segments larger than the period', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate media="s$Number$.mp4" duration="60" />',
      ], 30 /* duration */);
      // The first segment is number 1 and position 0.
      // Although the segment is 60 seconds long, it is clipped to the period
      // duration of 30 seconds.
      const references = [
        ManifestParser.makeReference('s1.mp4', 0, 0, 30, baseUri),
      ];
      await Dash.testSegmentIndex(source, references);
    });

    it('presentation start is parsed correctly', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate media="s$Number$.mp4" duration="60" />',
      ], 30 /* duration */, /* startTime */ 30);

      fakeNetEngine.setResponseText('dummy://foo', source);
      const manifest = await parser.start('dummy://foo', playerInterface);
      expect(manifest.presentationTimeline.getSeekRangeStart()).toBe(30);
    });
  });

  describe('index', () => {
    it('basic support', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="1" index="index-$Bandwidth$.mp4"',
        '    initialization="init-$Bandwidth$.mp4" />',
      ]);

      fakeNetEngine
          .setResponseText('dummy://foo', source)
          .setResponseText('http://example.com/index-500.mp4', '');

      const manifest = await parser.start('dummy://foo', playerInterface);
      expect(manifest).toEqual(
          Dash.makeManifestFromInit('init-500.mp4', 0, null));
      await Dash.callCreateSegmentIndex(manifest);

      expect(fakeNetEngine.request).toHaveBeenCalledTimes(2);
      fakeNetEngine.expectRangeRequest(
          'http://example.com/index-500.mp4', 0, null);
    });

    it('defaults to index with multiple segment sources', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="1" index="index-$Bandwidth$.mp4"',
        '    initialization="init-$Bandwidth$.mp4">',
        '  <SegmentTimeline>',
        '    <S t="0" d="3" r="12" />',
        '  </SegmentTimeline>',
        '</SegmentTemplate>',
      ]);

      fakeNetEngine
          .setResponseText('dummy://foo', source)
          .setResponseText('http://example.com/index-500.mp4', '');

      const manifest = await parser.start('dummy://foo', playerInterface);
      expect(manifest).toEqual(
          Dash.makeManifestFromInit('init-500.mp4', 0, null));
      await Dash.callCreateSegmentIndex(manifest);

      expect(fakeNetEngine.request).toHaveBeenCalledTimes(2);
      fakeNetEngine.expectRangeRequest(
          'http://example.com/index-500.mp4', 0, null);
    });

    it('requests init data for WebM', async () => {
      const source = [
        '<MPD mediaPresentationDuration="PT75S">',
        '  <Period>',
        '    <BaseURL>http://example.com</BaseURL>',
        '    <AdaptationSet mimeType="video/webm">',
        '      <Representation bandwidth="500">',
        '        <SegmentTemplate startNumber="1"',
        '            index="index-$Bandwidth$.webm"',
        '            initialization="init-$Bandwidth$.webm" />',
        '      </Representation>',
        '    </AdaptationSet>',
        '  </Period>',
        '</MPD>',
      ].join('\n');

      fakeNetEngine
          .setResponseText('dummy://foo', source)
          .setResponseText('http://example.com/index-500.webm', '')
          .setResponseText('http://example.com/init-500.webm', '');

      const manifest = await parser.start('dummy://foo', playerInterface);
      expect(manifest).toEqual(
          Dash.makeManifestFromInit('init-500.webm', 0, null));
      await Dash.callCreateSegmentIndex(manifest);

      expect(fakeNetEngine.request).toHaveBeenCalledTimes(3);
      fakeNetEngine.expectRangeRequest(
          'http://example.com/init-500.webm', 0, null);
      fakeNetEngine.expectRangeRequest(
          'http://example.com/index-500.webm', 0, null);
    });

    it('inherits from Period', async () => {
      const source = [
        '<MPD mediaPresentationDuration="PT75S">',
        '  <Period>',
        '    <BaseURL>http://example.com</BaseURL>',
        '    <SegmentTemplate startNumber="1" index="index-$Bandwidth$.mp4"',
        '        initialization="init-$Bandwidth$.mp4" />',
        '    <AdaptationSet mimeType="video/mp4">',
        '      <Representation bandwidth="500" />',
        '    </AdaptationSet>',
        '  </Period>',
        '</MPD>',
      ].join('\n');

      fakeNetEngine
          .setResponseText('dummy://foo', source)
          .setResponseText('http://example.com/index-500.mp4', '');

      const manifest = await parser.start('dummy://foo', playerInterface);
      expect(manifest).toEqual(
          Dash.makeManifestFromInit('init-500.mp4', 0, null));
      await Dash.callCreateSegmentIndex(manifest);

      expect(fakeNetEngine.request).toHaveBeenCalledTimes(2);
      fakeNetEngine.expectRangeRequest(
          'http://example.com/index-500.mp4', 0, null);
    });

    it('inherits from AdaptationSet', async () => {
      const source = [
        '<MPD mediaPresentationDuration="PT75S">',
        '  <Period>',
        '    <AdaptationSet mimeType="video/mp4">',
        '      <BaseURL>http://example.com</BaseURL>',
        '      <SegmentTemplate startNumber="1" index="index-$Bandwidth$.mp4"',
        '          initialization="init-$Bandwidth$.mp4" />',
        '      <Representation bandwidth="500" />',
        '    </AdaptationSet>',
        '  </Period>',
        '</MPD>',
      ].join('\n');

      fakeNetEngine
          .setResponseText('dummy://foo', source)
          .setResponseText('http://example.com/index-500.mp4', '');

      const manifest = await parser.start('dummy://foo', playerInterface);
      expect(manifest).toEqual(
          Dash.makeManifestFromInit('init-500.mp4', 0, null));
      await Dash.callCreateSegmentIndex(manifest);

      expect(fakeNetEngine.request).toHaveBeenCalledTimes(2);
      fakeNetEngine.expectRangeRequest(
          'http://example.com/index-500.mp4', 0, null);
    });
  });

  describe('media template', () => {
    it('defaults to timeline when also has duration', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="0" duration="10"',
        '    media="$Number$-$Time$-$Bandwidth$.mp4">',
        '  <SegmentTimeline>',
        '    <S t="0" d="15" r="2" />',
        '  </SegmentTimeline>',
        '</SegmentTemplate>',
      ], 45 /* duration */);
      const references = [
        ManifestParser.makeReference('0-0-500.mp4', 0, 0, 15, baseUri),
        ManifestParser.makeReference('1-15-500.mp4', 1, 15, 30, baseUri),
        ManifestParser.makeReference('2-30-500.mp4', 2, 30, 45, baseUri),
      ];
      await Dash.testSegmentIndex(source, references);
    });

    it('with @startnumber = 0', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="0" duration="10"',
        '    media="$Number$-$Time$-$Bandwidth$.mp4" />',
      ], 30 /* duration */);
      const references = [
        ManifestParser.makeReference('0-0-500.mp4', 0, 0, 10, baseUri),
        ManifestParser.makeReference('1-10-500.mp4', 1, 10, 20, baseUri),
        ManifestParser.makeReference('2-20-500.mp4', 2, 20, 30, baseUri),
      ];
      await Dash.testSegmentIndex(source, references);
    });

    it('with @startNumber = 1', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="1" duration="10"',
        '    media="$Number$-$Time$-$Bandwidth$.mp4" />',
      ], 30 /* duration */);
      const references = [
        ManifestParser.makeReference('1-0-500.mp4', 0, 0, 10, baseUri),
        ManifestParser.makeReference('2-10-500.mp4', 1, 10, 20, baseUri),
        ManifestParser.makeReference('3-20-500.mp4', 2, 20, 30, baseUri),
      ];
      await Dash.testSegmentIndex(source, references);
    });

    it('with @startNumber > 1', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="10" duration="10"',
        '    media="$Number$-$Time$-$Bandwidth$.mp4" />',
      ], 30 /* duration */);
      const references = [
        ManifestParser.makeReference('10-0-500.mp4', 0, 0, 10, baseUri),
        ManifestParser.makeReference('11-10-500.mp4', 1, 10, 20, baseUri),
        ManifestParser.makeReference('12-20-500.mp4', 2, 20, 30, baseUri),
      ];
      await Dash.testSegmentIndex(source, references);
    });

    it('with @timescale > 1', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="1" timescale="9000" duration="9000"',
        '    media="$Number$-$Time$-$Bandwidth$.mp4" />',
      ], 3 /* duration */);
      const references = [
        ManifestParser.makeReference('1-0-500.mp4', 0, 0, 1, baseUri),
        ManifestParser.makeReference('2-9000-500.mp4', 1, 1, 2, baseUri),
        ManifestParser.makeReference('3-18000-500.mp4', 2, 2, 3, baseUri),
      ];
      await Dash.testSegmentIndex(source, references);
    });

    it('across representations', async () => {
      const source = [
        '<MPD>',
        '  <Period duration="PT60S">',
        '    <AdaptationSet mimeType="video/webm">',
        '      <BaseURL>http://example.com</BaseURL>',
        '      <SegmentTemplate startNumber="1" duration="10"',
        '          media="$Number$-$Time$-$Bandwidth$.mp4" />',
        '      <Representation bandwidth="100" />',
        '      <Representation bandwidth="200" />',
        '      <Representation bandwidth="300" />',
        '    </AdaptationSet>',
        '  </Period>',
        '</MPD>',
      ].join('\n');

      fakeNetEngine.setResponseText('dummy://foo', source);
      const actual = await parser.start('dummy://foo', playerInterface);
      expect(actual).toBeTruthy();

      const variants = actual.periods[0].variants;
      expect(variants.length).toBe(3);

      await variants[0].video.createSegmentIndex();
      await variants[1].video.createSegmentIndex();
      await variants[2].video.createSegmentIndex();

      expect(variants[0].video.segmentIndex.find(0)).toBe(0);
      expect(variants[0].video.segmentIndex.get(0)).toEqual(
          ManifestParser.makeReference('1-0-100.mp4', 0, 0, 10, baseUri));
      expect(variants[0].video.segmentIndex.find(12)).toBe(1);
      expect(variants[0].video.segmentIndex.get(1)).toEqual(
          ManifestParser.makeReference('2-10-100.mp4', 1, 10, 20, baseUri));
      expect(variants[1].video.segmentIndex.find(0)).toBe(0);
      expect(variants[1].video.segmentIndex.get(0)).toEqual(
          ManifestParser.makeReference('1-0-200.mp4', 0, 0, 10, baseUri));
      expect(variants[1].video.segmentIndex.find(12)).toBe(1);
      expect(variants[1].video.segmentIndex.get(1)).toEqual(
          ManifestParser.makeReference('2-10-200.mp4', 1, 10, 20, baseUri));
      expect(variants[2].video.segmentIndex.find(0)).toBe(0);
      expect(variants[2].video.segmentIndex.get(0)).toEqual(
          ManifestParser.makeReference('1-0-300.mp4', 0, 0, 10, baseUri));
      expect(variants[2].video.segmentIndex.find(12)).toBe(1);
      expect(variants[2].video.segmentIndex.get(1)).toEqual(
          ManifestParser.makeReference('2-10-300.mp4', 1, 10, 20, baseUri));
    });
  });

  describe('rejects streams with', () => {
    it('bad container type', async () => {
      const source = [
        '<MPD mediaPresentationDuration="PT75S">',
        '  <Period>',
        '    <BaseURL>http://example.com</BaseURL>',
        '    <AdaptationSet mimeType="video/cats">',
        '      <Representation bandwidth="500">',
        '        <SegmentTemplate startNumber="1"',
        '            index="index-$Bandwidth$.webm"',
        '            initialization="init-$Bandwidth$.webm" />',
        '      </Representation>',
        '    </AdaptationSet>',
        '  </Period>',
        '</MPD>',
      ].join('\n');
      const error = new shaka.util.Error(
          shaka.util.Error.Severity.CRITICAL,
          shaka.util.Error.Category.MANIFEST,
          shaka.util.Error.Code.DASH_UNSUPPORTED_CONTAINER);
      await Dash.testFails(source, error);
    });

    it('no init data with webm', async () => {
      const source = [
        '<MPD>',
        '  <Period duration="PT30S">',
        '    <BaseURL>http://example.com</BaseURL>',
        '    <AdaptationSet mimeType="video/webm">',
        '      <Representation bandwidth="500">',
        '        <SegmentTemplate startNumber="1"',
        '            index="index-$Bandwidth$.webm" />',
        '      </Representation>',
        '    </AdaptationSet>',
        '  </Period>',
        '</MPD>',
      ].join('\n');
      const error = new shaka.util.Error(
          shaka.util.Error.Severity.CRITICAL,
          shaka.util.Error.Category.MANIFEST,
          shaka.util.Error.Code.DASH_WEBM_MISSING_INIT);
      await Dash.testFails(source, error);
    });

    it('not enough segment info', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="1" />',
      ]);
      const error = new shaka.util.Error(
          shaka.util.Error.Severity.CRITICAL,
          shaka.util.Error.Category.MANIFEST,
          shaka.util.Error.Code.DASH_NO_SEGMENT_INFO);
      await Dash.testFails(source, error);
    });

    it('no media template', async () => {
      const source = Dash.makeSimpleManifestText([
        '<SegmentTemplate startNumber="1">',
        '  <SegmentTimeline>',
        '    <S d="10" />',
        '  </SegmentTimeline>',
        '</SegmentTemplate>',
      ]);
      const error = new shaka.util.Error(
          shaka.util.Error.Severity.CRITICAL,
          shaka.util.Error.Category.MANIFEST,
          shaka.util.Error.Code.DASH_NO_SEGMENT_INFO);
      await Dash.testFails(source, error);
    });
  });
});

