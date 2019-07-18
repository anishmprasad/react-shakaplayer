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

describe('StreamUtils', () => {
  const filterStreamsByLanguageAndRole =
      shaka.util.StreamUtils.filterStreamsByLanguageAndRole;
  const filterVariantsByAudioChannelCount =
      shaka.util.StreamUtils.filterVariantsByAudioChannelCount;

  let manifest;

  describe('filterStreamsByLanguageAndRole', () => {
    it('chooses text streams in user\'s preferred language', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(1)
              .language('en')
            .addTextStream(2)
              .language('es')
            .addTextStream(3)
              .language('en')
          .build();
      /* eslint-enable indent */

      const chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          '');
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].textStreams[0]);
      expect(chosen[1]).toBe(manifest.periods[0].textStreams[2]);
    });

    it('chooses primary text streams', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(1)
            .addTextStream(2)
              .primary()
            .addTextStream(3)
              .primary()
          .build();
      /* eslint-enable indent */

      const chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          '');
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].textStreams[1]);
      expect(chosen[1]).toBe(manifest.periods[0].textStreams[2]);
    });

    it('chooses text streams in preferred language and role', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(1)
              .language('en')
              .roles(['main', 'commentary'])
            .addTextStream(2)
              .language('es')
            .addTextStream(3)
              .language('en')
              .roles(['caption'])
          .build();
      /* eslint-enable indent */

      const chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          'main');
      expect(chosen.length).toBe(1);
      expect(chosen[0]).toBe(manifest.periods[0].textStreams[0]);
    });

    it('prefers no-role streams if there is no preferred role', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(0)
              .language('en')
              .roles(['commentary'])
            .addTextStream(1)
              .language('en')
            .addTextStream(2)
              .language('en')
              .roles(['secondary'])
          .build();
      /* eslint-enable indent */

      const chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          '');
      expect(chosen.length).toBe(1);
      expect(chosen[0].roles.length).toBe(0); // Pick a stream with no role.
    });

    it('ignores no-role streams if there is a preferred role', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(0)
              .language('en')
              .roles(['commentary'])
            .addTextStream(1)
              .language('en')
            .addTextStream(2)
              .language('en')
              .roles(['secondary'])
          .build();
      /* eslint-enable indent */

      const chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          'main'); // A role that is not present.
      expect(chosen.length).toBe(1);
      expect(chosen[0].roles.length).toBe(1); // Pick a stream with a role.
    });

    it('chooses only one role, even if none is preferred', () => {
      // Regression test for https://github.com/google/shaka-player/issues/949
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(0)
              .language('en')
              .roles(['commentary'])
            .addTextStream(1)
              .language('en')
              .roles(['commentary'])
            .addTextStream(2)
              .language('en')
              .roles(['secondary'])
            .addTextStream(3)
              .language('en')
              .roles(['secondary'])
            .addTextStream(4)
              .language('en')
              .roles(['main'])
            .addTextStream(5)
              .language('en')
              .roles(['main'])
          .build();
      /* eslint-enable indent */

      const chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'en',
          '');
      // Which role is chosen is an implementation detail.
      // Each role is found on two text streams, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].roles[0]).toBe(chosen[1].roles[0]);
    });

    it('chooses only one role, even if all are primary', () => {
      // Regression test for https://github.com/google/shaka-player/issues/949
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(0)
              .language('en').primary()
              .roles(['commentary'])
            .addTextStream(1)
              .language('en').primary()
              .roles(['commentary'])
            .addTextStream(2)
              .language('en').primary()
              .roles(['secondary'])
            .addTextStream(3)
              .language('en').primary()
              .roles(['secondary'])
            .addTextStream(4)
              .language('en').primary()
              .roles(['main'])
            .addTextStream(5)
              .language('en').primary()
              .roles(['main'])
          .build();
      /* eslint-enable indent */

      const chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'zh',
          '');
      // Which role is chosen is an implementation detail.
      // Each role is found on two text streams, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].roles[0]).toBe(chosen[1].roles[0]);
    });

    it('chooses only one language, even if all are primary', () => {
      // Regression test for https://github.com/google/shaka-player/issues/918
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(0)
              .language('en').primary()
            .addTextStream(1)
              .language('en').primary()
            .addTextStream(2)
              .language('es').primary()
            .addTextStream(3)
              .language('es').primary()
          .build();
      /* eslint-enable indent */

      const chosen = filterStreamsByLanguageAndRole(
          manifest.periods[0].textStreams,
          'zh',
          '');
      // Which language is chosen is an implementation detail.
      // Each role is found on two variants, so we should have two.
      expect(chosen.length).toBe(2);
      expect(chosen[0].language).toBe(chosen[1].language);
    });

    it('chooses a role from among primary streams without language match',
        () => {
          /* eslint-disable indent */
          manifest = new shaka.test.ManifestGenerator()
              .addPeriod(0)
                .addTextStream(0)
                  .language('en').primary()
                  .roles(['commentary'])
                .addTextStream(1)
                  .language('en').primary()
                  .roles(['commentary'])
                .addTextStream(2)
                  .language('en')
                  .roles(['secondary'])
                .addTextStream(3)
                  .language('en')
                  .roles(['secondary'])
                .addTextStream(4)
                  .language('en').primary()
                  .roles(['main'])
                .addTextStream(5)
                  .language('en').primary()
                  .roles(['main'])
              .build();
          /* eslint-enable indent */

          const chosen = filterStreamsByLanguageAndRole(
              manifest.periods[0].textStreams,
              'zh',
              '');
          // Which role is chosen is an implementation detail.
          // Each role is found on two text streams, so we should have two.
          expect(chosen.length).toBe(2);
          expect(chosen[0].roles[0]).toBe(chosen[1].roles[0]);

          // Since nothing matches our language preference, we chose primary
          // text streams.
          expect(chosen[0].primary).toBe(true);
          expect(chosen[1].primary).toBe(true);
        });

    it('chooses a role from best language match, in spite of primary',
        () => {
          /* eslint-disable indent */
          manifest = new shaka.test.ManifestGenerator()
              .addPeriod(0)
                .addTextStream(0)
                  .language('en').primary()
                  .roles(['commentary'])
                .addTextStream(1)
                  .language('en').primary()
                  .roles(['commentary'])
                .addTextStream(2)
                  .language('zh')
                  .roles(['secondary'])
                .addTextStream(3)
                  .language('zh')
                  .roles(['secondary'])
                .addTextStream(4)
                  .language('en').primary()
                  .roles(['main'])
                .addTextStream(5)
                  .language('en').primary()
                  .roles(['main'])
              .build();
          /* eslint-enable indent */

          const chosen = filterStreamsByLanguageAndRole(
              manifest.periods[0].textStreams,
              'zh',
              '');
          expect(chosen.length).toBe(2);
          expect(chosen[0].language).toBe('zh');
          expect(chosen[1].language).toBe('zh');
          expect(chosen[0].primary).toBe(false);
          expect(chosen[1].primary).toBe(false);
        });
  });

  describe('filterVariantsByAudioChannelCount', () => {
    it('chooses variants with preferred audio channels count', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addVariant(0)
              .addAudio(0).channelsCount(2)
            .addVariant(1)
              .addAudio(1).channelsCount(6)
            .addVariant(2)
              .addAudio(2).channelsCount(2)
          .build();
      /* eslint-enable indent */

      const chosen = filterVariantsByAudioChannelCount(
          manifest.periods[0].variants, 2);
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].variants[0]);
      expect(chosen[1]).toBe(manifest.periods[0].variants[2]);
    });

    it('chooses variants with largest audio channel count less than config' +
        ' when no exact audio channel count match is possible', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addVariant(0)
              .addAudio(0).channelsCount(2)
            .addVariant(1)
              .addAudio(1).channelsCount(8)
            .addVariant(2)
              .addAudio(2).channelsCount(2)
          .build();
      /* eslint-enable indent */

      const chosen = filterVariantsByAudioChannelCount(
          manifest.periods[0].variants, 6);
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].variants[0]);
      expect(chosen[1]).toBe(manifest.periods[0].variants[2]);
    });

    it('chooses variants with fewest audio channels when none fit in the ' +
        'config', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addVariant(0)
              .addAudio(0).channelsCount(6)
            .addVariant(1)
              .addAudio(1).channelsCount(8)
            .addVariant(2)
              .addAudio(2).channelsCount(6)
          .build();
      /* eslint-enable indent */

      const chosen = filterVariantsByAudioChannelCount(
          manifest.periods[0].variants, 2);
      expect(chosen.length).toBe(2);
      expect(chosen[0]).toBe(manifest.periods[0].variants[0]);
      expect(chosen[1]).toBe(manifest.periods[0].variants[2]);
    });
  });

  describe('filterNewPeriod', () => {
    let fakeDrmEngine;

    beforeAll(() => {
      fakeDrmEngine = new shaka.test.FakeDrmEngine();
    });

    it('filters text streams with the full MIME type', () => {
      /* eslint-disable indent */
      manifest = new shaka.test.ManifestGenerator()
          .addPeriod(0)
            .addTextStream(1).mime('text/vtt')
            .addTextStream(2).mime('application/mp4', 'wvtt')
            .addTextStream(3).mime('text/bogus')
            .addTextStream(4).mime('application/mp4', 'bogus')
          .build();
      /* eslint-enable indent */

      const noAudio = null;
      const noVideo = null;
      shaka.util.StreamUtils.filterNewPeriod(
          fakeDrmEngine, noAudio, noVideo, manifest.periods[0]);

      // Covers a regression in which we would remove streams with codecs.
      // The last two streams should be removed because their full MIME types
      // are bogus.
      expect(manifest.periods[0].textStreams.length).toBe(2);
      const textStreams = manifest.periods[0].textStreams;
      expect(textStreams[0].id).toBe(1);
      expect(textStreams[1].id).toBe(2);
    });
  });
});
