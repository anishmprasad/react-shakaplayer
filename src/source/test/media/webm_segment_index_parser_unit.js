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

describe('WebmSegmentIndexParser', () => {
  const indexSegmentUri = '/base/test/test/assets/index-segment.webm';
  const initSegmentUri = '/base/test/test/assets/init-segment.webm';

  let indexSegment;
  let initSegment;

  beforeAll(async () => {
    const responses = await Promise.all([
      shaka.test.Util.fetch(indexSegmentUri),
      shaka.test.Util.fetch(initSegmentUri),
    ]);
    indexSegment = responses[0];
    initSegment = responses[1];
  });

  it('rejects a non-index segment ', () => {
    const error = shaka.test.Util.jasmineError(new shaka.util.Error(
        shaka.util.Error.Severity.CRITICAL,
        shaka.util.Error.Category.MEDIA,
        shaka.util.Error.Code.WEBM_CUES_ELEMENT_MISSING));
    expect(() => shaka.media.WebmSegmentIndexParser.parse(
        initSegment, initSegment, [], 0)).toThrow(error);
  });

  it('rejects an invalid init segment ', () => {
    const error = shaka.test.Util.jasmineError(new shaka.util.Error(
        shaka.util.Error.Severity.CRITICAL,
        shaka.util.Error.Category.MEDIA,
        shaka.util.Error.Code.WEBM_EBML_HEADER_ELEMENT_MISSING));
    expect(() => shaka.media.WebmSegmentIndexParser.parse(
        indexSegment, indexSegment, [], 0))
        .toThrow(error);
  });

  it('parses index segment ', () => {
    const result = shaka.media.WebmSegmentIndexParser.parse(
        indexSegment, initSegment, [], 0);
    const references =
        [
          {startTime: 0, endTime: 12, startByte: 281, endByte: 95911},
          {startTime: 12, endTime: 24, startByte: 95912, endByte: 209663},
          {startTime: 24, endTime: 36, startByte: 209664, endByte: 346545},
          {startTime: 36, endTime: 48, startByte: 346546, endByte: 458817},
          {startTime: 48, endTime: 60, startByte: 458818, endByte: null},
        ];

    expect(result).toEqual(references.map((o) => jasmine.objectContaining(o)));
  });

  it('takes a scaled presentationTimeOffset in seconds', () => {
    const result = shaka.media.WebmSegmentIndexParser.parse(
        indexSegment, initSegment, [], 2);
    const references =
        [
          {startTime: -2, endTime: 10},
          {startTime: 10, endTime: 22},
          {startTime: 22, endTime: 34},
          {startTime: 34, endTime: 46},
          {startTime: 46, endTime: 58},
        ];

    expect(result).toEqual(references.map((o) => jasmine.objectContaining(o)));
  });
});
