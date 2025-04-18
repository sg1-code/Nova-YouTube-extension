// for test:
// https://www.youtube.com/watch?v=J07l-Qe9xgs - thanks button

window.nova_plugins.push({
   id: 'download-video',
   title: 'Download video',
   // 'title:zh': '下载视频',
   // 'title:ja': 'ビデオをダウンロードする',
   // 'title:ko': '',
   // 'title:id': '',
   // 'title:es': '',
   // 'title:pt': '',
   // 'title:fr': '',
   // 'title:it': '',
   // 'title:tr': '',
   // 'title:de': '',
   // 'title:pl': '',
   // 'title:ua': '',
   run_on_pages: 'watch, -mobile',
   section: 'player-control',
   // desc: '',
   _runtime: user_settings => {

      // alt - https://greasyfork.org/en/scripts/496975-gaston-s-video-image-downloader

      NOVA.waitSelector('#movie_player .ytp-right-controls')
         .then(container => {
            const
               // container <a>
               SELECTOR_BTN_CONTAINER_CLASS_NAME = 'nova-video-download',
               SELECTOR_BTN_CONTAINER = '.' + SELECTOR_BTN_CONTAINER_CLASS_NAME,
               containerBtn = document.createElement('button'),
               // list <ul>
               SELECTOR_BTN_LIST_ID = SELECTOR_BTN_CONTAINER_CLASS_NAME + '-list',
               SELECTOR_BTN_LIST = '#' + SELECTOR_BTN_LIST_ID,
               dropdownMenu = document.createElement('ul'),
               // btn <span>
               SELECTOR_BTN_LABEL_ID = SELECTOR_BTN_CONTAINER_CLASS_NAME + '-label',
               SELECTOR_BTN_LABEL = '#' + SELECTOR_BTN_LABEL_ID,
               labelBtn = document.createElement('span');

            NOVA.runOnPageLoad(() => {
               if (NOVA.currentPage == 'watch') {
                  // clear old
                  containerBtn.removeEventListener('click', generateMenu);
                  dropdownMenu.textContent = ''; // clear
                  // button ready
                  containerBtn.addEventListener('click', generateMenu, { capture: true, once: true });
               }
            });

            // custon tooltip (with animation)
            // NOVA.css.push(
            //    `${SELECTOR_BTN_LABEL}[tooltip]::before {
            //       content: attr(tooltip);
            //       position: absolute;
            //       top: -3em;
            //       line-height: normal;
            //       background-color: rgba(28,28,28,.9);
            //       border-radius: 2px;
            //       padding: 5px 9px;
            //       color: white;
            //       font-weight: bold;
            //       white-space: nowrap;

            //       /*animation*/
            //       --scale: 0;
            //       transform: translateX(-25%) scale(var(--scale));
            //       transition: 50ms transform;
            //       transform-origin: bottom center;
            //    }
            //    ${SELECTOR_BTN_LABEL}[tooltip]:hover::before {
            //       --scale: 1
            //    }`);
            NOVA.css.push(
               `${SELECTOR_BTN_LABEL}[tooltip]:hover::before {
                  content: attr(tooltip);
                  position: absolute;
                  top: -3em;
                  transform: translateX(-30%);
                  line-height: normal;
                  background-color: rgba(28,28,28,.9);
                  border-radius: .3em;
                  padding: 5px 9px;
                  color: white;
                  font-size: initial;
                  font-weight: bold;
                  white-space: nowrap;
               }
               /* for embed */
               html[data-cast-api-enabled] ${SELECTOR_BTN_LABEL}[tooltip]:hover::before {
                  font-weight: normal;
               }`);

            NOVA.css.push(
               `${SELECTOR_BTN_CONTAINER} {
                  overflow: visible !important;
                  position: relative;
                  text-align: center !important;
                  vertical-align: top;
                  font-weight: bold;
               }

               ${SELECTOR_BTN_CONTAINER}:hover { color: #66afe9 !important; }
               ${SELECTOR_BTN_CONTAINER}:active { color: #2196f3 !important; }

               ${SELECTOR_BTN_LABEL} {
                  /* display: block; */
                  display: inline;
                  height: inherit;
                  line-height: 1.7;
                  font-size: 2em;
                  vertical-align: bottom;
               }

               ${SELECTOR_BTN_LIST} {
                  position: absolute;
                  bottom: 2.5em !important;
                  left: -2.2em;
                  list-style: none;
                  padding-bottom: 1.5em !important;
                  z-index: ${1 + Math.max(NOVA.css.get('.ytp-progress-bar', 'z-index'), 31)};
               }

               /* for embed */
               html[data-cast-api-enabled] ${SELECTOR_BTN_LIST} {
                  margin: 0;
                  padding: 0;
                  bottom: 3.3em;
                  /* --yt-spec-brand-button-background: #c00; */
               }

               ${SELECTOR_BTN_CONTAINER}:not(:hover) ${SELECTOR_BTN_LIST} {
                  display: none;
               }

               ${SELECTOR_BTN_LIST} li {
                  cursor: pointer;
                  white-space: nowrap;
                  line-height: 1.4;
                  background-color: rgba(28, 28, 28, .9);
                  margin: .1em 0;
                  padding: .5em 2em;
                  border-radius: .3em;
                  color: white;
               }

               /* ${SELECTOR_BTN_LIST} li .menu-item-label-badge {
                  position: absolute;
                  right: .5em;
                  font-size: .1em;
               } */

               ${SELECTOR_BTN_LIST} li:hover { background-color: #c00; }`);

            containerBtn.classList.add('ytp-button', SELECTOR_BTN_CONTAINER_CLASS_NAME, 'nova-right-custom-button');
            // btn <span>
            labelBtn.id = SELECTOR_BTN_LABEL_ID;
            // labelBtn.title = 'Nova video download';
            labelBtn.setAttribute('tooltip', 'Nova video download');
            // labelBtn.textContent = '🡇'; // '🖫'
            // // labelBtn.innerHTML =  NOVA.createSafeHTML(
            // //    `<svg viewBox="0 0 120 120" width="100%" height="100%" style="scale:.6;">
            // //       <g fill="currentColor">
            // //          <path d="M96.215 105h-72.18c-3.33 0-5.94-2.61-5.94-5.94V75.03c0-3.33 2.61-5.94 5.94-5.94 3.33 0 5.94 2.61 5.94 5.94v18h60.03v-18c0-3.33 2.61-5.94 5.94-5.94 3.33 0 5.94 2.61 5.94 5.94v24.03c.27 3.33-2.34 5.94-5.67 5.94Zm-32.4-34.47c-2.07 1.89-5.4 1.89-7.56 0l-18.72-17.19c-2.07-1.89-2.07-4.86 0-6.84 2.07-1.98 5.4-1.89 7.56 0l8.91 8.19V20.94c0-3.33 2.61-5.94 5.94-5.94 3.33 0 5.94 2.61 5.94 5.94V54.6l8.91-8.19c2.07-1.89 5.4-1.89 7.56 0 2.07 1.89 2.07 4.86 0 6.84l-18.54 17.28Z" />
            // //       </g>
            // //    </svg>`);
            // // // `<svg viewBox="-140 -140 500 500" width="100%" height="100%" style="scale: .9;">
            // // //    <g fill="currentColor">
            // // //       <path d="M198.5,0h-17v83h-132V0h-49v231h230V32.668L198.5,0z M197.5,199h-165v-83h165V199z" />
            // // //       <rect width="33" x="131.5" height="66" />
            // // //    </g>
            // // // </svg>`);
            // // fix - This document requires 'TrustedHTML' assignment.
            // labelBtn.append((function createSvgIcon() {
            //    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            //    svg.setAttribute('width', '100%');
            //    svg.setAttribute('height', '100%');
            //    svg.setAttribute('viewBox', '0 0 120 120');
            //    svg.style.scale = .6;

            //    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            //    g.setAttribute('fill', 'currentColor');

            //    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            //    path.setAttribute('d', 'M96.215 105h-72.18c-3.33 0-5.94-2.61-5.94-5.94V75.03c0-3.33 2.61-5.94 5.94-5.94 3.33 0 5.94 2.61 5.94 5.94v18h60.03v-18c0-3.33 2.61-5.94 5.94-5.94 3.33 0 5.94 2.61 5.94 5.94v24.03c.27 3.33-2.34 5.94-5.67 5.94Zm-32.4-34.47c-2.07 1.89-5.4 1.89-7.56 0l-18.72-17.19c-2.07-1.89-2.07-4.86 0-6.84 2.07-1.98 5.4-1.89 7.56 0l8.91 8.19V20.94c0-3.33 2.61-5.94 5.94-5.94 3.33 0 5.94 2.61 5.94 5.94V54.6l8.91-8.19c2.07-1.89 5.4-1.89 7.56 0 2.07 1.89 2.07 4.86 0 6.84l-18.54 17.28Z');

            //    g.append(path);
            //    svg.append(g);

            //    return svg;
            // })());
            // labelBtn.innerHTML =  NOVA.createSafeHTML(
            //    `<svg viewBox="0 0 582.207 582.207" width="100%" height="100%" style="scale:.7;">
            //       <g fill="currentColor">
            //          <path d="M389.752,324.006V125.105c0-6.249-5.066-11.316-11.316-11.316H203.771c-6.249,0-11.316,5.067-11.316,11.316v198.893 h-53.672c-15.618,0-19.327,8.955-8.28,20L271.11,484.605c11.047,11.047,28.955,11.047,40,0L451.711,344 c11.047-11.047,7.338-20.002-8.279-20.002h-53.68V324.006z" />
            //       </g>
            //    </svg>`);
            // fix - This document requires 'TrustedHTML' assignment.
            labelBtn.append((function createSvgIcon() {
               const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
               svg.setAttribute('width', '100%');
               svg.setAttribute('height', '100%');
               svg.setAttribute('viewBox', '0 0 582.207 582.207');
               svg.style.scale = .7;

               const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
               g.setAttribute('fill', 'currentColor');

               const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
               path.setAttribute('d', 'M389.752,324.006V125.105c0-6.249-5.066-11.316-11.316-11.316H203.771c-6.249,0-11.316,5.067-11.316,11.316v198.893 h-53.672c-15.618,0-19.327,8.955-8.28,20L271.11,484.605c11.047,11.047,28.955,11.047,40,0L451.711,344 c11.047-11.047,7.338-20.002-8.279-20.002h-53.68V324.006z');

               g.append(path);
               svg.append(g);

               return svg;
            })());

            // list <ul>
            dropdownMenu.id = SELECTOR_BTN_LIST_ID;

            containerBtn.append(labelBtn, dropdownMenu);
            container.prepend(containerBtn);

            async function generateMenu() {
               if (menuList = document.getElementById(SELECTOR_BTN_LIST_ID)) {
                  // menuList.textContent = ''; // clear

                  APIs.videoId = NOVA.queryURL.get('v') || movie_player.getVideoData().video_id;
                  // save original icon
                  const labelBtnCloned = labelBtn.cloneNode(true);
                  // icon "wait" state
                  // containerBtn.textContent = '⏱';
                  labelBtn.textContent = '🕓';
                  labelBtn.cursor = 'wait';

                  let downloadVideoList = [];
                  switch (user_settings.download_video_mode) {
                     // default:
                     case 'cobalt':
                        downloadVideoList = APIs.Cobalt();
                        // downloadVideoList = [{ label: 'Cobalt mp4', url: await APIs.Cobalt() }];
                        break;

                     case 'loader.to':
                        downloadVideoList = APIs.loaderTo();
                        break;

                     case 'poketube':
                        downloadVideoList = APIs.Poketube();
                        break;

                     case 'tubenightly':
                        downloadVideoList = APIs.TubeNightly();
                        break;

                     case 'third_party_methods':
                        downloadVideoList = APIs.third_party();
                        break;

                     case 'direct':
                        downloadVideoList = await APIs.getInternalListUrls()
                        break;

                     default:
                        alert('Error APIs miss:\n' + user_settings.download_video_mode);
                        break;
                  }

                  // console.debug('downloadVideoList', downloadVideoList);

                  downloadVideoList
                     .filter(i => i?.codec)
                     .forEach((item, idx) => {
                        const menuItem = document.createElement('li');

                        if (item.quality) {
                           menuItem.textContent = `${item.codec} / ${item.quality}`;
                           // menuItem.insertAdjacentHTML('beforeend', NOVA.createSafeHTML(
                           //    // `<span class="menu-item-label-badge">${++idx}</span>` + item.quality));
                           //    `<span class="menu-item-label-badge">${item.format}</span>` + item.quality));
                        }
                        else menuItem.textContent = item.codec;

                        menuItem.addEventListener('click', () => {
                           if (item.custom_fn && typeof item.custom_fn === 'function') {
                              item.custom_fn(item);
                           }
                           else if (item.link_new_tab) {
                              window.open(item.link_new_tab, '_blank');
                           }
                           else {
                              downloadFile(item.link);
                           }
                        }, { capture: true });

                        menuList.append(menuItem);
                     });

                  // downloadVideoList.forEach((item, idx) => {
                  //    const option = document.createElement('option');
                  //    option.setAttribute('value', item.link);
                  //    // option.textContent = (++idx) + '.' + item.label;
                  //    option.textContent = `${++idx}.${item.label}`;
                  //    select.append(option);
                  // });

                  // container.append(saveDownloadVideoButton, select);

                  // restore icon
                  labelBtn.replaceWith(labelBtnCloned);
                  // fix - This document requires 'TrustedHTML' assignment.
                  // if (parentElement = labelBtn.parentNode) {
                  //    parentElement.append(clonedElement);
                  //    parentElement.removeChild(originalElement);
                  // }
                  labelBtn.style.cursor = '';
               }
            }
         });

      const APIs = {
         // videoId,

         getQualityAvailableList() {
            const qualityList = {
               highres: 4320,
               hd2880: 2880,
               hd2160: 2160,
               hd1440: 1440,
               hd1080: 1080,
               hd720: 720,
               large: 480,
               medium: 360,
               small: 240,
               tiny: 144,
               // auto, skiping
            };
            return movie_player.getAvailableQualityData().map(i => qualityList[i.quality]);
         },

         // alt1 - https://greasyfork.org/en/scripts/479944-youtube-downloader/
         // alt2 - https://greasyfork.org/en/scripts/483370-simple-youtube-downloader
         // alt3 - https://greasyfork.org/en/scripts/481954-youtube-direct-downloader
         // alt4 - https://greasyfork.org/en/scripts/515230-cobalt-tools-youtube-direct-downloader
         /**
          * @param  {void}
          * @return {@object array} {codec, quality, data, custom_fn}
         */
         Cobalt() {
            const qualityAvailableList = this.getQualityAvailableList();
            let vidlist = [];

            ['h264', /*'av1',*/ 'vp9']
               .forEach(codec => {
                  qualityAvailableList.forEach(quality => {
                     vidlist.push(...[
                        {
                           codec: codec,
                           quality: quality,
                           data: { 'vCodec': codec, 'vQuality': String(quality) },
                           custom_fn: CobaltAPI,
                        },
                        // { label: `${i} (max)`, data: { vCodec: i, codec: 'max' }, custom_fn: CobaltAPI },
                     ]);
                  });
               });
            return [
               // video
               ...vidlist,
               //  Audio
               { codec: 'mp3', data: { isAudioOnly: true, cCodec: 'mp3' }, custom_fn: CobaltAPI },
               { codec: 'ogg', data: { isAudioOnly: true, cCodec: 'ogg' }, custom_fn: CobaltAPI },
               { codec: 'wav', data: { isAudioOnly: true, cCodec: 'wav' }, custom_fn: CobaltAPI },
               { codec: 'opus', data: { isAudioOnly: true, cCodec: 'opus' }, custom_fn: CobaltAPI },
               // { label: 'best', data: { isAudioOnly: true, cCodec: 'best' }, custom_fn: CobaltAPI },
            ];

            async function CobaltAPI(item) {
               // https://github.com/imputnet/cobalt (https://cobalt.tools/)
               // https://github.com/wukko/cobalt/blob/current/docs/api.md
               // const dlink = await NOVA.fetch('https://co.wuk.sh/api/json',
               const dlink = await NOVA.fetch('https://api.cobalt.tools/api/json',
                  {
                     method: 'POST', // *GET, POST, PUT, DELETE, etc.
                     // mode: 'no-cors', // no-cors, *cors, same-origin
                     headers: {
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                     },
                     body: JSON.stringify({
                        url: encodeURI('https://www.youtube.com/watch?v=' + APIs.videoId), // video url
                        // vQuality: 'max', // always max quality
                        // vCodec: h264 / av1 / vp9
                        filenamePattern: 'basic', // classic / pretty / basic / nerdy
                        // isAudioOnly: Boolean(),
                        // cCodec: best / mp3 / ogg / wav / opus
                        disableMetadata: true, // privacy
                        isNoTTWatermark: true,
                        ...item.data,
                     }),
                  })
                  .then(response => response.json())
                  // {
                  //    "status": "stream",
                  //    "url": "https://us3-co.wuk.sh/api/stream?t=XXX"
                  // }
                  .then(json => json.url)
                  .catch(error => {
                     throw new Error(`Cobalt API: failed fetching: ${error}`);
                  });

               if (!dlink) return console.error('CobaltAPI empty dlink:', dlink);
               downloadFile(dlink);
            }
         },

         // alt1 - https://greasyfork.org/en/scripts/453911-youtube-download-button
         // alt2 - https://greasyfork.org/en/scripts/498037-yt-downloader
         /**
          * @param  {void}
          * @return {@object array} {codec, quality, url, custom_fn}
         */
         // loaderTo() {
         //    // download.php
         //    // const genLink = format => `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=${format}&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + APIs.videoId)}`;

         //    // button
         //    const genLink = format => NOVA.queryURL.set({
         //       // https://loader.to/api/button/?url=YOUR_YOUTUBE_VIDEO_URL&f=FORMAT_VALUE&color=COLOR_VALUE&linkUrl=AD_URL&css=CSS_URL
         //       url: 'https://www.youtube.com/watch?v=' + APIs.videoId,
         //       f: format,
         //       color: '0af' // COLOR_VALUE
         //       // linkUrl: '',// AD_URL
         //       // css: '',// CSS_URL
         //    }, 'https://loader.to/api/button/');


         //    const qualityAvailableList = this.getQualityAvailableList()?.filter(i => i > 240);
         //    let vidlist = [];

         //    ['h264']
         //       .forEach(codec => {
         //          qualityAvailableList.forEach(quality => {
         //             vidlist.push({
         //                'codec': codec,
         //                'quality': quality,
         //                'url': genLink(quality),
         //                'custom_fn': openPopup,
         //             });
         //          });
         //       });
         //    return [
         //       // video
         //       ...vidlist,
         //       // { codec: 'h264', quality: '360', url: genlink(360), custom_fn: openpopup },
         //       // { codec: 'h264', quality: '480', url: genlink(480), custom_fn: openpopup },
         //       // { codec: 'h264', quality: '720', url: genlink(720), custom_fn: openpopup },
         //       // { codec: 'h264', quality: '1080', url: genlink(1080), custom_fn: openpopup },
         //       // { codec: 'h264', quality: '1440', url: genLink(1440), custom_fn: openPopup },
         //       { codec: 'webm', quality: '4K', url: genLink('4k'), custom_fn: openPopup },
         //       { codec: 'webm', quality: '8K', url: genLink('8k'), custom_fn: openPopup },
         //       //  Audio
         //       { codec: 'mp3', url: genLink('mp3'), custom_fn: openPopup },
         //       { codec: 'm4a', url: genLink('m4a'), custom_fn: openPopup },
         //       { codec: 'webm', url: genLink('webm'), custom_fn: openPopup },
         //       { codec: 'aac', url: genLink('aac'), custom_fn: openPopup },
         //       { codec: 'flac', url: genLink('flac'), custom_fn: openPopup },
         //       { codec: 'opus', url: genLink('opus'), custom_fn: openPopup },
         //       { codec: 'ogg', url: genLink('ogg'), custom_fn: openPopup },
         //       { codec: 'wav', url: genLink('wav'), custom_fn: openPopup },
         //    ];


         //    function openPopup(item) {
         //       NOVA.openPopup({ 'url': item.url, width: 420, height: 80 });
         //    }
         // },

         // alt - https://github.com/lighttube-org/lighttube
         /**
          * @param  {void}
          * @return {@object array} {codec, quality, url}
         */
         // TubeNightly() {
         //    const genLink = format => `https://tube-nightly.kuylar.dev/proxy/media/${APIs.videoId}/${format}`;

         //    const qualityAvailableList = this.getQualityAvailableList()?.filter(i => i <= 1080);
         //    let vidlist = [];

         //    // Available Format with IDs are: 18, 137, 248, 136, 247, 135, 244, 134, 243, 133, 242, 160, 278, 139, 140
         //    const availableFormatsList = {
         //       h264: {
         //          '1080': 137,
         //          '720': 136,
         //          '480': 135,
         //          '360': 134,
         //          // '360':18,
         //          '240': 133,
         //          '144': 160,
         //       },
         //       vp9: {
         //          '1080': 248,
         //          '720': 247,
         //          '480': 244,
         //          '360': 243,
         //          '240': 242,
         //          '144': 278,
         //       },
         //    };

         //    ['h264', /*'av1',*/ 'vp9']
         //       .forEach(codec => {
         //          qualityAvailableList.forEach(quality => {
         //             if (!availableFormatsList[codec]?.[quality]) return;
         //             vidlist.push({
         //                'codec': codec,
         //                'quality': quality,
         //                'link': genLink(availableFormatsList[codec][quality]),
         //             });
         //          });
         //       });

         //    return [
         //       // video
         //       ...vidlist,
         //       // mp4
         //       // { codec: 'h264', quality: '1080', link: genlink(137) },
         //       // { codec: 'h264', quality: '720', link: genlink(136) },
         //       // { codec: 'h264', quality: '480', link: genlink(135) },
         //       // // { codec: 'h264', quality: '360', link: genlink(134) }, // duplicate with worse quality
         //       // { codec: 'h264', quality: '360', link: genlink(18) },
         //       // { codec: 'h264', quality: '240', link: genlink(133) },
         //       // { codec: 'h264', quality: '144', link: genLink(160) },
         //       // vp9
         //       // { codec: 'vp9', quality: '1080', link: genLink(248) },
         //       // { codec: 'vp9', quality: '720', link: genLink(247) },
         //       // { codec: 'vp9', quality: '480', link: genLink(244) },
         //       // { codec: 'vp9', quality: '360', link: genLink(243) },
         //       // { codec: 'vp9', quality: '240', link: genLink(242) },
         //       // { codec: 'vp9', quality: '144', link: genLink(278) },
         //       //  Audio
         //       { codec: 'aac', quality: '127 kbps', link: genLink(140) },
         //       { codec: 'aac', quality: '48 kbps', link: genLink(139) },
         //    ];
         // },

         // alt - https://github.com/ashley0143/poke
         /**
          * @param  {void}
          * @return {@object array} {codec, quality, url, custom_fn}
         */
         // Poketube() {
         //    // const genLink = format => `https://poketube.fun/api/video/download?v=${APIs.videoId}${format}`;
         //    const genLink = format => NOVA.queryURL.set({
         //       v: APIs.videoId + format,
         //    }, 'https://poketube.fun/api/video/download');

         //    const qualityAvailableList = this.getQualityAvailableList()?.filter(i => i > 240 && i <= 720);
         //    let vidlist = [];

         //    const availableFormatsList = {
         //       h264: {
         //          // '1080': '',
         //          '720': 136,
         //          '480': 135,
         //          '360': 134,
         //          // '240': '',
         //          // '144': '',
         //       },
         //    };

         //    ['h264']
         //       .forEach(codec => {
         //          qualityAvailableList.forEach(quality => {
         //             if (!availableFormatsList[codec]?.[quality]) return;
         //             vidlist.push({
         //                'codec': codec,
         //                'quality': quality,
         //                'url': genLink(availableFormatsList[codec][quality]),
         //                'custom_fn': openPopup,
         //             });
         //          });
         //       });

         //    // https://poketube.fun/api/video/download?q=17&v= - 3GPP. Now error: "Format with ID 17 not found."
         //    // https://poketube.fun/api/video/download?q=18&v= - MP4 (480p)
         //    // https://poketube.fun/api/video/download?v= - MP4 (720p)
         //    // https://poketube.fun/api/video/download?q=249&f=webm&v= - webm (low)
         //    // https://poketube.fun/api/video/download?q=251&f=webm&v= - webm (HIGH)
         //    return [
         //       // video
         //       // { codec: '3gpp', quality: '???', url: genLink('q=17'), custom_fn: openPopup },
         //       ...vidlist,
         //       // { codec: 'h264', quality: '480', url: genlink('q=18'), custom_fn: openpopup },
         //       // { codec: 'h264', quality: '720', url: genLink(''), custom_fn: openPopup },
         //       //  Audio
         //       { codec: 'low', url: genLink('q=249&f=webm'), custom_fn: openPopup },
         //       { codec: 'high', url: genLink('q=251&f=webm'), custom_fn: openPopup },
         //    ];

         //    function openPopup(item) {
         //       NOVA.openPopup({ 'url': item.url, width: 420, height: 80 });
         //    }
         // },

         third_party() {
            return [
               // alt - https://greasyfork.org/en/scripts/387200
               {
                  quality: 'mp3,mp4,m4a,aac,3gp,avi,mov,mkv',
                  codec: 'clipconverter.cc',
                  link_new_tab: 'https://www.clipconverter.cc/3/?url=https://www.youtube.com/watch?v=' + APIs.videoId,
               },
               {
                  quality: 'mp3,mp4,m4a,webp,acc,flac,opus,ogg,wav',
                  codec: 'loader.to',
                  // link_new_tab: 'https://loader.to/api/card/?url=https://www.youtube.com/watch?v=' + APIs.videoId,
                  custom_fn: () =>
                     NOVA.openPopup({
                        // url: 'https://loader.to/api/card/?url=https://www.youtube.com/watch?v=' + APIs.videoId,
                        url: 'https://loader.to/api/card2/?url=https://www.youtube.com/watch?v=' + APIs.videoId,
                        width: 960, height: 350,
                     }),
               },
               {
                  quality: 'mp3,mp4,3gp,M4A',
                  codec: 'tomp3.cc',
                  link_new_tab: 'https://tomp3.cc/youtube-downloader/' + APIs.videoId,
                  // 'https://tomp3.cc/youtube-to-mp3/' + APIs.videoId
                  // 'https://tomp3.cc/youtube-converter/' + APIs.videoId
                  // 'https://tomp3.cc/youtube-downloader/' + APIs.videoId
               },
               // alt - // https://greasyfork.org/en/scripts/475514-youtube-multi-downloader-sfrom-net-shift-d
               {
                  quality: 'mp4,m4a,webm,opus',
                  codec: 'savefrom.net',
                  link_new_tab: 'https://savefrom.net/https://www.youtube.com/watch?v=' + APIs.videoId,
                  // link_new_tab: 'https://sfrom.net/https://www.youtube.com/watch?v=' + APIs.videoId,
                  // link_new_tab: 'https://ssyoutube.com/watch?v=' + APIs.videoId,
               },
               // alt1 - https://greasyfork.org/en/scripts/459232-y2mate-tools
               // alt2 - https://greasyfork.org/en/scripts/22108-bajar-mp3-youtube
               // alt3 - https://greasyfork.org/en/scripts/483485-youtube-css-downloader-reload-page
               {
                  quality: 'mp3,mp4,3gp',
                  codec: 'Y2Mate', // https://Y2Mate.tools
                  link_new_tab: 'https://www.y2mate.com/youtube/' + APIs.videoId,
                  // link_new_tab: 'https://www.y2mate.com/youtube-mp3/' + APIs.videoId,
                  // https://www.youtubepp.com/watch?v=
               },
               // alt1 - https://greasyfork.org/en/scripts/486702
               // alt2 - https://greasyfork.org/en/scripts/483950
               // alt3 - https://greasyfork.org/en/scripts/473086-youtube-downloader
               {
                  quality: 'mp3,mp4,3gp',
                  codec: 'yt1s.ltd',
                  // codec: 'yt1s.com',
                  link_new_tab: 'https://www.yt1s.com/en?q=https://www.youtube.com/watch?v=' + APIs.videoId,
               },
               // alt - https://greasyfork.org/en/scripts/483289-youtube-video-downloader
               {
                  quality: 'mp3,mp4,ogg,3gp',
                  codec: 'yt5s', // youtube5s (yt5s.win, yt5s.io, yt5s.biz)
                  link_new_tab: 'https://yt5s.com/watch?v=' + APIs.videoId,
               },
               // alt - https://greasyfork.org/en/scripts/469769-youtube-downloader
               {
                  quality: 'mp3,mp4,ogg,3gp',
                  codec: 'snapsave.io',
                  link_new_tab: 'https://snapsave.io/?q=' + APIs.videoId,
               },
               {
                  quality: 'mp3,mp4,ogg,3gp',
                  codec: 'x2download.app',
                  link_new_tab: 'https://x2download.app/?q=' + APIs.videoId,
                  // link_new_tab: 'https://x2download.app/watch?v=' + APIs.videoId,
               },
               // alt - https://greasyfork.org/en/scripts/8426-download-youtube-videos-and-subtitles
               {
                  quality: 'mp3,mp4,webp',
                  codec: 'addyoutube.com',
                  link_new_tab: 'https://addyoutube.com/watch?v=' + APIs.videoId,
               },
               // alt - https://greasyfork.org/en/scripts/475299-youtube-multi-downloader-10downloader-com-mp3-fhd-mp4-hd-sd-3gp-no-ads
               {
                  quality: 'mp4,webp',
                  codec: '10downloader.com',
                  link_new_tab: 'https://10downloader.com/download?v=https://www.youtube.com/watch?v=' + APIs.videoId,
               },
               // {
               //    quality: 'mp3,mp4,ogg',
               //    codec: 'yt2conv.org',
               //    link_new_tab: 'https://yt2conv.org?https://www.youtube.com/watch?v=' + APIs.videoId,
               // },
               // alt - https://greasyfork.org/en/scripts/481649-download-video-audio-from-youtube-quickly-via-userscript-menu
               {
                  quality: 'mp3,mp4',
                  codec: 'YtbSave.com',
                  link_new_tab: 'https://ytbsave.com/https://www.youtube.com/watch?v=' + APIs.videoId,
               },
               // manual - https://github.com/ashley0143/poke
               // {
               //    quality: 'mp3,mp4',
               //    codec: 'Poketube.fun',
               //    link_new_tab: 'https://poketube.fun/download?v=' + APIs.videoId,
               // },
               // alt1 - https://greasyfork.org/en/scripts/455314-youtube-to-mp3-converter-video-downloader-tubemp3-to
               // alt2 - https://greasyfork.org/en/scripts/34613
               {
                  quality: 'mp3,mp4(360p)',
                  codec: 'TubeMP3.to',
                  link_new_tab: 'https://tubemp3.to/' + APIs.videoId,
               },
               // alt - https://greasyfork.org/en/scripts/464959-youtube-mp3-conv
               {
                  quality: 'mp3',
                  codec: 'conv2.be',
                  link_new_tab: 'https://conv2.be/watch?v=' + APIs.videoId,
                  // link_new_tab: 'https://www.rcyoutube.com/watch?v=' + APIs.videoId,
               },
               {
                  quality: 'mp3',
                  codec: 'onlymp3.app',
                  link_new_tab: 'https://onlymp3.app/convert/' + APIs.videoId,
               },
               // {
               //    quality: 'mp3',
               //    codec: 'freemp3.tube',
               //    link_new_tab: 'https://freemp3.tube?' + APIs.videoId,
               // },
            ];
         },

         // alt1 - https://greasyfork.org/en/scripts/452979-youtube-links
         // alt2 - https://greasyfork.org/en/scripts/471103-youtubedl
         // alt3 - https://greasyfork.org/en/scripts/484735-local-youtube-downloader

         // alt4 - https://greasyfork.org/en/scripts/406994
         // alt5 - https://greasyfork.org/en/scripts/483626-youtube-pro
         /**
          * @param  {void}
          * @return {@object array} {codec, quality, url}
         */
         // async getInternalListUrls() {
         //    let decryptSigFn;
         //    const
         //       URL = NOVA.queryURL.set({ 'pbj': 1 }),
         //       headers = {
         //          'x-youtube-client-name': 1,
         //          'x-youtube-client-version': window.ytcfg.data_.INNERTUBE_CONTEXT_CLIENT_VERSION,
         //       };
         //    if (token = window.ytcfg?.data_?.ID_TOKEN) {
         //       headers['x-youtube-identity-token'] = token;
         //    };

         //    return await fetch(URL, { 'headers': headers })
         //       .then(res => res.json())
         //       .then(data => data?.find(i => i.playerResponse?.streamingData)?.playerResponse.streamingData)
         //       .then(async streamingData => {
         //          console.debug('streamingData', streamingData);

         //          // https://tyrrrz.me/blog/reverse-engineering-youtube
         //          // console.debug(`stream:`, streamArr);
         //          // [
         //          //    "itag": 12
         //          //    "url": "https://xx.googlevideo.com/videoplayback",
         //          //    "mimeType": "video/mp4; codecs=\"avc1.64001F, mp4a.40.2\"",
         //          //    "fps": 30,
         //          //    "qualityLabel": "720p"
         //          // ]
         //          // console.debug(`adaptive:`, streamArr);
         //          // [
         //          //    "itag": 18
         //          //    "url": "https://xx.googlevideo.com/videoplayback",
         //          //    "mimeType": "video/webm; codecs=\"vp9\"",
         //          //    "fps": 60,
         //          //    "qualityLabel": "2160p60"
         //          // ]

         //          const vidListData = [...streamingData.formats, ...streamingData.adaptiveFormats];
         //          decryptSigFn = vidListData.find(o => (o.cipher || o.signatureCipher)) && await getDecryptSigFn();

         //          // adaptiveFormats - Adaptive (No Sound)
         //          // return [...streamingData.formats]
         //          return vidListData
         //             .map(obj => {
         //                if (dict = parseQuery(obj.cipher || obj.signatureCipher)) {
         //                   obj.url = `${dict.url}&${dict.sp}=${encodeURIComponent(decsig(dict.s))}`;
         //                }

         //                if (obj.url) {
         //                   let label = obj.mimeType?.match(/codecs="(.*?)"/i)[1].split('.')[0];
         //                   if (!obj.mimeType?.includes('mp4a') && !obj.mimeType?.includes('audio')) {
         //                      label += ' / No Sound';
         //                   }

         //                   obj.mimeType?.includes('audio')
         //                      ? obj.qualityLabel = fmtBitrate(obj.bitrate)
         //                      : obj.qualityLabel += ' ' + fmtSize(obj.contentLength);

         //                   return {
         //                      // 'title': obj.mimeType,
         //                      'codec': label,
         //                      'quality': obj.qualityLabel,
         //                      'link_new_tab': obj.url,
         //                   };
         //                }
         //             })
         //          // skip audio  sort
         //          // .sort((a, b) => {
         //          //    return a.title?.includes('audio')
         //          //       ? 0
         //          //       : a.codec?.localeCompare(b.codec, undefined, { numeric: true, sensitivity: 'base' })
         //          // });
         //       })
         //       .catch(error => {
         //          throw new Error(`Error get vids: ${error}`);
         //       });

         //    // NOVA.cookie.parseQueryToObj
         //    // 69.97 % slower
         //    // function parseQuery(str) {
         //    //    return str && [...new URLSearchParams(str).entries()]
         //    //       .reduce((acc, [k, v]) => ((acc[k] = v), acc), {});
         //    // }
         //    function parseQuery(str) {
         //       return str && Object.fromEntries(
         //          str
         //             .split(/&/)
         //             .map(c => {
         //                const [key, ...v] = c.split('=');
         //                return [key, decodeURIComponent(v.join('='))];
         //             }) || []
         //       );
         //    }
         //    // DecryptBySignatureCipher
         //    // info https://stackoverflow.com/a/76461414
         //    // for test: https://www.youtube.com/watch?v=tas39WI3Mi8
         //    async function getDecryptSigFn() {
         //       const
         //          basejsUrl = getBasejs() || document.querySelector('script[src$="/base.js"]')?.src, // #base-js
         //          basejsBlob = await fetch(basejsUrl);

         //       return parseDecSig(await basejsBlob.text());

         //       function getBasejs() {
         //          if (typeof ytplayer === 'object'
         //             && (endpoint = ytplayer.config?.assets?.js
         //                || ytplayer.web_player_context_config?.jsUrl)
         //             // NOTE: the 'yt' object is only accessible when using 'unsafeWindow'
         //             // yt.config_.PLAYER_JS_URL // diff ver
         //          ) {
         //             return 'https://' + location.host + endpoint;
         //          }
         //       }

         //       function parseDecSig(text_content) {
         //          // console.debug('parseDecSig:', ...arguments);
         //          const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         //          try {
         //             if (text_content.startsWith('var script')) {
         //                // inject the script via script tag
         //                const obj = {};
         //                eval(text_content);
         //                text_content = obj.innerHTML;
         //             }
         //             const fnNameResult = /=([a-zA-Z0-9\$_]+?)\(decodeURIComponent/.exec(text_content);
         //             const fnName = fnNameResult[1];
         //             const _argNameFnBodyResult = new RegExp(escapeRegExp(fnName) + '=function\\((.+?)\\){((.+)=\\2.+?)}')
         //                .exec(text_content);
         //             const [_, argname, fnBody] = _argNameFnBodyResult;
         //             const helperNameResult = /;([a-zA-Z0-9$_]+?)\..+?\(/.exec(fnBody);
         //             const helperName = helperNameResult[1];
         //             const helperResult = new RegExp('var ' + escapeRegExp(helperName) + '={[\\s\\S]+?};').exec(text_content);
         //             const helper = helperResult[0];
         //             // console.info(`parseDecSig result: (%s)=>{%s\n%s}`, argname, helper, fnBody);
         //             return new Function([argname], helper + '\n' + fnBody);
         //          } catch (error) {
         //             console.error('parseDecSig', error);
         //          }
         //       }
         //    }
         //    function decsig(_sig) {
         //       const sig = eval(`(${decryptSigFn}) ('${_sig}')`);
         //       // console.debug('sig:', sig);
         //       return sig;
         //    }
         // },

      };

      function downloadFile(url = required()) {
         // console.debug('downloadFile:', ...arguments);
         const d = document.createElement('a');
         d.style.display = 'none';
         d.download = (movie_player.getVideoData().title
            .replace(/[\\/:*?"<>|]+/g, '')
            .replace(/\s+/g, ' ').trim()) + '.mp4';
         d.href = url;
         document.body.append(d);
         d.click();
         d.remove();
      }

      // function fmtBitrate(size) {
      //    return fmtSize(size, ['kbps', 'Mbps', 'Gbps'], 1000);
      // }

      // function fmtSize(size, units = ['kB', 'MB', 'GB'], divisor = 1024) {
      //    size = Math.abs(+size);
      //    if (size === 0) return 'n/a';
      //    size /= divisor;
      //    for (let i = 0; i < units.length; ++i) {
      //       if (size < 10) return Math.round(size * 100) / 100 + units[i];
      //       else if (size < 100) return Math.round(size * 10) / 10 + units[i];
      //       else if (size < 1000 || i == (units.length - 1)) return Math.round(size) + units[i];
      //    }
      // }

      // function convertSizeToBytes(size) {
      //    const units = {
      //       B: 1,
      //       KB: 1024,
      //       MB: 1024 * 1024,
      //       GB: 1024 * 1024 * 1024,
      //    };

      //    const regex = /^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i;
      //    const match = size.match(regex);

      //    if (!match) return 0;

      //    const value = parseFloat(match[1]);
      //    const unit = match[2].toUpperCase();

      //    if (!units.hasOwnProperty(unit)) return 0;

      //    return value * units[unit];
      // }

      // // function bytesToSize(bytes, sizes = ['Bytes', 'kB', 'MB', 'GB', 'TB'], divisor = 1024) {
      // //    bytes = Math.abs(+bytes);
      // //    if (bytes === 0 || isNaN(num)) return 'n/a';
      // //    const i = Math.floor(Math.log(bytes) / Math.log(divisor));
      // //    return (i === 0 ? bytes : round(bytes / Math.pow(divisor, i))) + sizes[i];

      // //    function round(n, sig = 2) {
      // //       const prec = Math.pow(10, sig);
      // //       return Math.round(n * prec) / prec;
      // //    }
      // // }

   },
   options: {
      download_video_mode: {
         _tagName: 'select',
         label: 'Mode',
         // 'label:zh': '模式',
         // 'label:ja': 'モード',
         // 'label:ko': '방법',
         // 'label:vi': '',
         // 'label:id': 'Mode',
         // 'label:es': 'Modo',
         // 'label:pt': 'Modo',
         // 'label:fr': 'Mode',
         // 'label:it': 'Modalità',
         // 'label:tr': 'Mod',
         // 'label:de': 'Modus',
         'label:pl': 'Tryb',
         // 'label:ua': 'Режим',
         // title: '',
         options: [
            // https://savetube.io/
            {
               label: 'cobalt', value: 'cobalt', selected: true,
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
            },
            // {
            //    label: 'loader.to', value: 'loader.to',
            //    // 'label:zh': '',
            //    // 'label:ja': '',
            //    // 'label:ko': '',
            //    // 'label:id': '',
            //    // 'label:es': '',
            //    // 'label:pt': '',
            //    // 'label:fr': '',
            //    // 'label:it': '',
            //    // 'label:tr': '',
            //    // 'label:de': '',
            //    // 'label:pl': '',
            //    // 'label:ua': '',
            // },
            // {
            //    label: 'tubenightly', value: 'tubenightly',
            //    // 'label:zh': '',
            //    // 'label:ja': '',
            //    // 'label:ko': '',
            //    // 'label:id': '',
            //    // 'label:es': '',
            //    // 'label:pt': '',
            //    // 'label:fr': '',
            //    // 'label:it': '',
            //    // 'label:tr': '',
            //    // 'label:de': '',
            //    // 'label:pl': '',
            //    // 'label:ua': '',
            // },
            // {
            //    label: 'poketube', value: 'poketube',
            //    // 'label:zh': '',
            //    // 'label:ja': '',
            //    // 'label:ko': '',
            //    // 'label:id': '',
            //    // 'label:es': '',
            //    // 'label:pt': '',
            //    // 'label:fr': '',
            //    // 'label:it': '',
            //    // 'label:tr': '',
            //    // 'label:de': '',
            //    // 'label:pl': '',
            //    // 'label:ua': '',
            // },
            {
               label: 'multi 3rd party', value: 'third_party_methods',
               // label: 'links to external', value: 'third_party',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
            },
            // {
            //    label: 'direct', value: 'direct',
            //    // 'label:zh': '',
            //    // 'label:ja': '',
            //    // 'label:ko': '',
            //    // 'label:id': '',
            //    // 'label:es': '',
            //    // 'label:pt': '',
            //    // 'label:fr': '',
            //    // 'label:it': '',
            //    // 'label:tr': '',
            //    // 'label:de': '',
            //    // 'label:pl': '',
            //    // 'label:ua': '',
            // },
         ],
      },
   }
});
