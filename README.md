# react-shakaplayer

Shaka Player is an open-source JavaScript library for adaptive media.  It plays
adaptive media formats (such as [DASH][] and [HLS][]) in a browser, without
using plugins or Flash.  Instead, Shaka Player uses the open web standards
[MediaSource Extensions][] and [Encrypted Media Extensions][].

Shaka Player also supports [offline storage and playback][] of media using
[IndexedDB][].  Content can be stored on any browser.  Storage of licenses
depends on browser support.

Our main goal is to make it as easy as possible to stream adaptive bitrate
video and audio using modern browser technologies. We try to keep the library
light, simple, and free from third-party dependencies. Everything you need to
build and deploy is in the sources.

For details on what's coming next, see our [development roadmap](roadmap.md).

[DASH]: http://dashif.org/
[HLS]: https://developer.apple.com/streaming/
[MediaSource Extensions]: https://www.w3.org/TR/media-source/
[Encrypted Media Extensions]: https://www.w3.org/TR/encrypted-media/
[IndexedDB]: https://www.w3.org/TR/IndexedDB-2/
[offline storage and playback]: https://shaka-player-demo.appspot.com/docs/api/tutorial-offline.html


## Platform and browser support matrix

|Browser    |Windows   |Mac      |Linux    |Android  |iOS       |ChromeOS|Other|
|:---------:|:--------:|:-------:|:-------:|:-------:|:--------:|:------:|:---:|
|Chrome¹    |**Y**     |**Y**    |**Y**    |**Y**    |**Native**|**Y**   | -   |
|Firefox¹   |**Y**     |**Y**    |**Y**    |untested⁵|**Native**| -      | -   |
|Edge¹      |**Y**     | -       | -       | -       | -        | -      | -   |
|IE ≤ 10    | N        | -       | -       | -       | -        | -      | -   |
|IE 11      |**Y** ⁴   | -       | -       | -       | -        | -      | -   |
|Safari¹    | -        |**Y**    | -       | -       |**Native**| -      | -   |
|Opera¹     |untested⁵ |untested⁵|untested⁵|untested⁵|**Native**| -      | -   |
|Chromecast²| -        | -       | -       | -       | -        | -      |**Y**|
|Tizen TV³  | -        | -       | -       | -       | -        | -      |**Y**|

NOTES:
 - ¹: Only the latest stable version is tested and supported. Older releases may still be usable, and we will accept pull requests for them, but they will not be officially tested or supported.
 - ²: Latest stable Chromecast firmware is tested. Both sender and receiver can be implemented with Shaka Player.
 - ³: Tizen 2017 model is actively tested and supported by the Shaka Player team. Tizen 2016 model is community-supported and untested by us.
 - ⁴: IE 11 offers PlayReady support on Windows 8.1 and Windows 10 only. IE 11 can play clear content on Windows 8.0. IE 11 does not support adaptive playback on Windows 7 and under.
 - ⁵: These are expected to work, but are not actively tested by the Shaka Player team.

We support iOS through Apple's native HLS player.  We provide the same top-level
API, but we just set the video's `src` element to the manfiest/media.  So we are
dependent on the browser supporting the manifests.



## Manifest format support matrix

|Format|Video On-Demand|Live |Event|In-Progress Recording|
|:----:|:-------------:|:---:|:---:|:-------------------:|
|DASH  |**Y**          |**Y**| -   |**Y**                |
|HLS   |**Y**          |**Y**|**Y**| -                   |



## DASH features

DASH features supported:
 - VOD, Live, and In-Progress Recordings (dynamic VOD content)
 - MPD@timeShiftBufferDepth for seeking backward in Live streams
 - Multi-period content (static and dynamic)
 - Xlink elements (actuate=onLoad only, resolve-to-zero, fallback content)
 - All forms of segment index info: SegmentBase@indexRange, SegmentTimeline, SegmentTemplate@duration, SegmentTemplate@index, SegmentList
 - Multi-codec/multi-container manifests (we will negotiate support with the browser and choose the best ones)
 - Encrypted content (including custom ContentProtection schemas, PSSH in the manifest)
 - Key rotation
 - Trick mode tracks

DASH features **not** supported:
 - Xlink with actuate=onRequest
 - Manifests without any segment info
 - Changing codecs during a presentation (unsupported by MSE)
 - Multiple trick mode tracks for the same resolution at varying framerates or bitrates
 - Timescales so large that timestamps cannot be represented as integers in JavaScript (2^53)


## HLS features

HLS features supported:
 - VOD, Live, and Event types
 - Encrypted content with Widevine
 - ISO-BMFF / MP4 / CMAF support
 - MPEG-2 TS support (transmuxing provided by [mux.js][] v5.1.3+, must be separately included)
 - WebVTT and TTML
 - CEA-608/708 captions
 - Encrypted content with FairPlay (Safari on macOS and iOS only)

HLS features **not** supported:
 - Encrypted content with PlayReady
 - Key rotation
 - I-frame-only playlists
 - Raw AAC (without an MP4 container)

[mux.js]: https://github.com/videojs/mux.js/releases


## DRM support matrix

|Browser   |Widevine  |PlayReady|FairPlay |ClearKey⁶ |
|:--------:|:--------:|:-------:|:-------:|:--------:|
|Chrome¹   |**Y**     | -       | -       |**Y**     |
|Firefox²  |**Y**     | -       | -       |**Y**     |
|Edge³     | -        |**Y**    | -       | -        |
|IE 11⁴    | -        |**Y**    | -       | -        |
|Safari    | -        | -       |**Y**    | -        |
|Opera     |untested⁵ | -       | -       |untested⁵ |
|Chromecast|**Y**     |**Y**    | -       |untested⁵ |
|Tizen TV  |**Y**     |**Y**    | -       |untested⁵ |

Other DRM systems should work out of the box if they are interoperable and compliant to the EME spec.

NOTES:
 - ¹: Only official Chrome builds contain the Widevine CDM.  Chromium built from source does not support DRM.
 - ²: DRM must be enabled by the user.  The first time a Firefox user visits a site with encrypted media, the user will be prompted to enable DRM.
 - ³: PlayReady in Edge does not seem to work on a VM or over Remote Desktop.
 - ⁴: IE 11 offers PlayReady support on Windows 8.1 and Windows 10 only.
 - ⁵: These are expected to work, but are not actively tested by the Shaka Player team.
 - ⁶: ClearKey is a useful tool for debugging, and does not provide actual content security.


## Media container and subtitle support

Shaka Player supports:
  - ISO-BMFF / CMAF / MP4
    - Depends on browser support for the container via MediaSource
    - Can parse "sidx" box for DASH's SegmentBase@indexRange and SegmentTemplate@index
    - Can find and parse "tfdt" box to find segment start time in HLS
  - WebM
    - Depends on browser support for the container via MediaSource
    - Can parse [cueing data][] elements for DASH's SegmentBase@indexRange and SegmentTemplate@index
    - Not supported in HLS
  - MPEG-2 TS
    - With help from [mux.js][] v5.1.3+, can be played on any browser which supports MP4
    - Can find and parse timestamps to find segment start time in HLS
  - WebVTT
    - Supported in both text form and embedded in MP4
  - TTML
    - Supported in both XML form and embedded in MP4

Subtitles are rendered by the browser by default.  Applications can create a
[text display plugin][] for customer rendering to go beyond browser-supported
attributes.

<!-- TODO: replace with a link to a TextDisplayer tutorial -->


## FAQ ##

For general help and before filing any bugs, please read the
[FAQ](docs/tutorials/faq.md).

## UNDER ACTIVE DEVELOPMENT

Apache-2.0

