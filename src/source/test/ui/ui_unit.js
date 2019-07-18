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

describe('UI', () => {
  const UiUtils = shaka.test.UiUtils;
  const Util = shaka.test.Util;
  const returnManifest = (manifest) =>
    Util.factoryReturns(new shaka.test.FakeManifestParser(manifest));

  /** @type {shaka.Player} */
  let player;
  /** @type {!Element} */
  let cssLink;

  beforeAll(async () => {
    // Add css file
    cssLink = document.createElement('link');
    await UiUtils.setupCSS(cssLink);
  });

  afterEach(async () => {
    await UiUtils.cleanupUI();
  });

  afterAll(() => {
    document.head.removeChild(cssLink);
  });

  describe('constructed through API', () => {
    /** @type {!HTMLElement} */
    let videoContainer;
    /** @type {!HTMLVideoElement} */
    let video;

    beforeEach(() => {
      videoContainer =
        /** @type {!HTMLElement} */ (document.createElement('div'));
      document.body.appendChild(videoContainer);

      video = shaka.util.Dom.createVideoElement();
      videoContainer.appendChild(video);
      UiUtils.createUIThroughAPI(videoContainer, video);
    });

    it('has all the basic elements', () => {
      checkBasicUIElements(videoContainer);
    });
  });

  describe('constructed through DOM auto-setup', () => {
    describe('set up with one container', () => {
      /** @type {!HTMLElement} */
      let container;

      beforeEach(() => {
        container =
          /** @type {!HTMLElement} */ (document.createElement('div'));
        document.body.appendChild(container);

        UiUtils.createUIThroughDOMAutoSetup([container], /* videos */ []);
      });

      it('has all the basic elements', () => {
        checkBasicUIElements(container);
      });
    });

    describe('set up with several containers', () => {
      /** @type {!HTMLElement} */
      let container1;

      /** @type {!HTMLElement} */
      let container2;

      beforeEach(() => {
        container1 =
          /** @type {!HTMLElement} */ (document.createElement('div'));
        document.body.appendChild(container1);

        container2 =
          /** @type {!HTMLElement} */ (document.createElement('div'));
        document.body.appendChild(container2);

        UiUtils.createUIThroughDOMAutoSetup([container1, container2],
            /* videos */ []);
      });

      it('has all the basic elements', () => {
        checkBasicUIElements(container1);
        checkBasicUIElements(container2);
      });
    });

    describe('set up with one video', () => {
      /** @type {!HTMLVideoElement} */
      let video;

      beforeEach(() => {
        video = shaka.util.Dom.createVideoElement();
        document.body.appendChild(video);

        UiUtils.createUIThroughDOMAutoSetup(/* containers */ [], [video]);
      });

      it('has all the basic elements', () => {
        checkBasicUIElements(
            /** @type {!HTMLVideoElement} */ (video.parentElement));
      });
    });

    describe('set up with several videos', () => {
      /** @type {!Array.<!HTMLVideoElement>} */
      const videos = [];

      beforeEach(() => {
        // Four is just a random number I (ismena) came up with to test a
        // multi-video use case. It could be replaces with any other
        // (reasonable) number.
        for (const _ of shaka.util.Iterables.range(4)) {
          shaka.util.Functional.ignored(_);
          const video = /** @type {!HTMLVideoElement} */
              (document.createElement('video'));

          document.body.appendChild(video);
          videos.push(video);
        }

        UiUtils.createUIThroughDOMAutoSetup(/* containers */ [], videos);
      });

      it('has all the basic elements', () => {
        for (const video of videos) {
          checkBasicUIElements(
              /** @type {!HTMLVideoElement} */ (video.parentElement));
        }
      });
    });

    describe('set up with a video and a container', () => {
      /** @type {!HTMLElement} */
      let container;
      /** @type {!HTMLVideoElement} */
      let video;

      beforeEach(() => {
        container =
          /** @type {!HTMLElement} */ (document.createElement('div'));
        document.body.appendChild(container);

        video = shaka.util.Dom.createVideoElement();
        container.appendChild(video);

        UiUtils.createUIThroughDOMAutoSetup([container], [video]);
      });

      it('has all the basic elements', () => {
        checkBasicUIElements(container);
      });
    });
  });

  describe('controls', () => {
    /** @type {!HTMLElement} */
    let videoContainer;
    /** @type {!HTMLVideoElement} */
    let video;

    beforeEach(() => {
      videoContainer =
        /** @type {!HTMLElement} */ (document.createElement('div'));
      document.body.appendChild(videoContainer);

      video = shaka.util.Dom.createVideoElement();
      videoContainer.appendChild(video);
    });

    describe('all the controls', () => {
      /** @type {!HTMLElement} */
      let controlsContainer;

      beforeEach(() => {
        const ui = UiUtils.createUIThroughAPI(videoContainer, video);
        player = ui.getControls().getLocalPlayer();
        const controlsContainers =
            videoContainer.getElementsByClassName('shaka-controls-container');
        expect(controlsContainers.length).toBe(1);
        controlsContainer = /** @type {!HTMLElement} */ (controlsContainers[0]);
      });

      it('stay visible if overflow menuButton is open', () => {
        const overflowMenus =
            videoContainer.getElementsByClassName('shaka-overflow-menu');
        expect(overflowMenus.length).toBe(1);
        const overflowMenu = /** @type {!HTMLElement} */ (overflowMenus[0]);

        const overflowMenuButtons =
            videoContainer.getElementsByClassName('shaka-overflow-menu-button');
        expect(overflowMenuButtons.length).toBe(1);
        const overflowMenuButton = overflowMenuButtons[0];

        overflowMenuButton.click();
        expect(overflowMenu.style.display).not.toBe('none');
        expect(controlsContainer.style.display).not.toBe('none');
      });
    });

    describe('overflow menu', () => {
      /** @type {!HTMLElement} */
      let overflowMenu;

      beforeEach(() => {
        const config = {
          controlPanelElements: [
            'overflow_menu',
          ],
        };
        const ui = UiUtils.createUIThroughAPI(videoContainer, video, config);
        player = ui.getControls().getLocalPlayer();

        const overflowMenus =
            videoContainer.getElementsByClassName('shaka-overflow-menu');
        expect(overflowMenus.length).toBe(1);
        overflowMenu = /** @type {!HTMLElement} */ (overflowMenus[0]);
      });

      it('has default buttons', () => {
        UiUtils.confirmElementFound(overflowMenu, 'shaka-caption-button');
        UiUtils.confirmElementFound(overflowMenu, 'shaka-resolution-button');
        UiUtils.confirmElementFound(overflowMenu, 'shaka-language-button');
        UiUtils.confirmElementFound(overflowMenu, 'shaka-pip-button');
      });

      it('becomes visible if overflowMenuButton was clicked', () => {
        let display = window.getComputedStyle(overflowMenu, null).display;
        expect(display).toBe('none');

        const overflowMenuButtons =
            videoContainer.getElementsByClassName('shaka-overflow-menu-button');
        expect(overflowMenuButtons.length).toBe(1);
        const overflowMenuButton = overflowMenuButtons[0];

        overflowMenuButton.click();
        display = overflowMenu.style.display;
        expect(display).not.toBe('none');
      });

      it('allows picture-in-picture only when the content has video',
          async () => {
            // Load fake content that contains only audio.
            const manifest = new shaka.test.ManifestGenerator()
                .addPeriod(/* startTime= */ 0)
                .addVariant(/* id= */ 0)
                .addAudio(/* id= */ 1)
                .build();

            await player.load(
                /* uri= */ 'fake', /* startTime= */ 0,
                returnManifest(manifest));
            const pipButtons =
            videoContainer.getElementsByClassName('shaka-pip-button');
            expect(pipButtons.length).toBe(1);
            const pipButton = pipButtons[0];

            // The picture-in-picture button should not be shown when the
            // content only has audio.
            expect(pipButton.classList.contains('shaka-hidden')).toBe(true);

            // The picture-in-picture window should not be open when the content
            // only has audio.
            expect(document.pictureInPictureElement).toBeFalsy();
          });

      it('is accessible', () => {
        for (const button of overflowMenu.childNodes) {
          expect(/** @type {!HTMLElement} */ (button)
              .hasAttribute('aria-label')).toBe(true);
        }
      });
    });


    describe('controls-button-panel', () => {
      /** @type {!HTMLElement} */
      let controlsButtonPanel;

      it('has default elements', () => {
        UiUtils.createUIThroughAPI(videoContainer, video);
        const controlsButtonPanels = videoContainer.getElementsByClassName(
            'shaka-controls-button-panel');

        expect(controlsButtonPanels.length).toBe(1);

        controlsButtonPanel =
          /** @type {!HTMLElement} */ (controlsButtonPanels[0]);

        UiUtils.confirmElementFound(controlsButtonPanel, 'shaka-current-time');
        UiUtils.confirmElementFound(controlsButtonPanel, 'shaka-mute-button');
        UiUtils.confirmElementFound(controlsButtonPanel, 'shaka-volume-bar');
        UiUtils.confirmElementFound(controlsButtonPanel,
            'shaka-fullscreen-button');
        UiUtils.confirmElementFound(controlsButtonPanel,
            'shaka-overflow-menu-button');
      });

      it('is accessible', () => {
        function confirmAriaLabel(className) {
          const elements =
              controlsButtonPanel.getElementsByClassName(className);
          expect(elements.length).toBe(1);
          expect(elements[0].hasAttribute('aria-label')).toBe(true);
        }

        const config = {
          controlPanelElements: [
            'mute',
            'volume',
            'fullscreen',
            'overflow_menu',
            'fast_forward',
            'rewind',
          ],
        };

        UiUtils.createUIThroughAPI(videoContainer, video, config);
        const controlsButtonPanels = videoContainer.getElementsByClassName(
            'shaka-controls-button-panel');
        expect(controlsButtonPanels.length).toBe(1);

        controlsButtonPanel =
          /** @type {!HTMLElement} */ (controlsButtonPanels[0]);

        confirmAriaLabel('shaka-mute-button');
        confirmAriaLabel('shaka-volume-bar');
        confirmAriaLabel('shaka-fullscreen-button');
        confirmAriaLabel('shaka-overflow-menu-button');
        confirmAriaLabel('shaka-fast-forward-button');
        confirmAriaLabel('shaka-rewind-button');
      });
    });

    describe('resolutions menu', () => {
      /** @type {!HTMLElement} */
      let resolutionsMenu;

      beforeEach(() => {
        const config = {
          controlPanelElements: [
            'overflow_menu',
          ],
          overflowMenuButtons: [
            'quality',
          ],
        };
        const ui = UiUtils.createUIThroughAPI(videoContainer, video, config);
        player = ui.getControls().getLocalPlayer();

        const resolutionsMenus =
            videoContainer.getElementsByClassName('shaka-resolutions');
        expect(resolutionsMenus.length).toBe(1);
        resolutionsMenu = /** @type {!HTMLElement} */ (resolutionsMenus[0]);
      });

      it('becomes visible if resolutionButton was clicked', () => {
        let display = window.getComputedStyle(resolutionsMenu, null).display;
        expect(display).toBe('none');

        const resolutionButtons =
            videoContainer.getElementsByClassName('shaka-resolution-button');
        expect(resolutionButtons.length).toBe(1);
        const resolutionButton = resolutionButtons[0];

        resolutionButton.click();
        display = resolutionsMenu.style.display;
        expect(display).not.toBe('none');
      });

      it('clears the buffer when changing resolutions', async () => {
        // Load fake content that has more than one quality level.
        /* eslint-disable indent */
        const manifest = new shaka.test.ManifestGenerator()
            .addPeriod(0)
              .addVariant(0)
                .addVideo(1).size(320, 240)
                .addVideo(2).size(640, 480)
            .build();
        /* eslint-enable indent */

        await player.load(
            /* uri= */ 'fake', /* startTime= */ 0, returnManifest(manifest));

        const selectVariantTrack = spyOn(player, 'selectVariantTrack');

        // There should be at least one explicit quality button.
        const qualityButton =
            videoContainer.querySelectorAll('button.explicit-resolution')[0];
        expect(qualityButton).toBeDefined();

        // Clicking this should select a track and clear the buffer.
        expect(selectVariantTrack).not.toHaveBeenCalled();
        qualityButton.click();

        // The second argument is "clearBuffer", and should be true.
        expect(selectVariantTrack).toHaveBeenCalledWith(
            jasmine.any(Object), true);
      });
    });
  });


  /**
   * @param {!HTMLElement} container
   * @suppress {visibility}
   */
  function checkBasicUIElements(container) {
    const videos = container.getElementsByTagName('video');
    expect(videos.length).not.toBe(0);
    UiUtils.confirmElementFound(container, 'shaka-play-button-container');
    UiUtils.confirmElementFound(container, 'shaka-play-button');
    UiUtils.confirmElementFound(container, 'shaka-spinner-svg');
    UiUtils.confirmElementFound(container, 'shaka-overflow-menu');
    UiUtils.confirmElementFound(container, 'shaka-controls-button-panel');
    UiUtils.confirmElementFound(container, 'shaka-seek-bar');
  }
});
