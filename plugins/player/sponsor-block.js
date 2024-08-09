// for  test
// https://www.youtube.com/watch?v=q45jxjne3BU - many ad
// https://www.youtube.com/watch?v=3eJZcpoSpKY
// https://www.youtube.com/watch?v=pf9WOuzeWhw
// https://www.youtube.com/watch?v=KboTw3NBuuk - ad in multi chaprtes
// https://youtu.be/cQUlbFmjDcM?t=190 - filler category
// https://youtu.be/5S-tTDeFZfY?t=237 - many filler category
// https://www.youtube.com/watch?v=50yz_BFL7ao- a lot filler category

window.nova_plugins.push({
   id: 'sponsor-block',
   title: 'SponsorBlock',
   // 'title:zh': '',
   // 'title:ja': '',
   // 'title:ko': '',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': '',
   // 'title:pt': '',
   // 'title:fr': '',
   // 'title:it': '',
   // 'title:tr': '',
   // 'title:de': '',
   // 'title:pl': '',
   // 'title:ua': '',
   run_on_pages: 'watch, embed',
   // restart_on_location_change: true,
   section: 'player',
   // desc: '',
   _runtime: user_settings => {

      // there is a small conflict with the [player-resume-playback] plugin. It has higher priority

      // alt1 - https://github.com/afreakk/greasemonkeyscripts/blob/master/youtube_sponsorblock.js
      // alt2 - https://codeberg.org/mthsk/userscripts/src/branch/master/simple-sponsor-skipper
      // alt3 - https://github.com/mchangrh/sb.js/blob/main/docs/sb.user.js
      // alt4 - https://chromewebstore.google.com/detail/mnjggcdmjocbbbhaepdhchncahnbgone
      // alt5 - https://chromewebstore.google.com/detail/gimgmkmpmjfjdnlmolehpabbehcflhpc

      NOVA.waitSelector('#movie_player video')
         .then(video => {
            const categoryNameLabel = {
               sponsor: 'Ad', // 'Sponsor'
               selfpromo: 'Self Promotion',
               interaction: 'Reminder Subscribe',
               intro: 'Intro',
               outro: 'Credits',
               preview: 'Recap',
               music_offtopic: 'Non-music section',
               exclusive_access: 'Full Video Label Only',
               // poi_highlight: 'Highlight',
               filler: 'Off-topic', // 'Filler'
            };

            let segmentsList = [];
            let muteState;
            let videoId; // share for console

            // reset chapterList
            // video.addEventListener('loadeddata', async () => segmentsList = await getSkipSegments(videoId) || []);
            video.addEventListener('loadeddata', init.bind(video));

            async function init() {
               videoId = NOVA.queryURL.get('v') || movie_player.getVideoData().video_id;
               segmentsList = await getSkipSegments(videoId) || [];
               // console.debug('segmentsList', segmentsList);

               // render marks for [player-float-progress-bar] plugin
               if (user_settings['player-float-progress-bar'] && segmentsList.length) {
                  const SELECTOR = '#nova-player-float-progress-bar-chapters > span[time]';
                  const deflectionSec = 5;

                  // wait chapters
                  await NOVA.waitSelector(SELECTOR, { destroy_after_page_leaving: true });

                  document.body.querySelectorAll(SELECTOR)
                     .forEach((chapterEl, idx, chaptersEls) => {
                        if (idx === chaptersEls.length - 1) return; // if last chapter

                        const
                           chapterStart = Math.trunc(NOVA.formatTimeOut.hmsToSec(chapterEl.getAttribute('time'))),
                           chapterNextStart = Math.trunc(NOVA.formatTimeOut.hmsToSec(chaptersEls[idx + 1].getAttribute('time')));

                        for (const [i, value] of segmentsList.entries()) {
                           const [segmentStart, segmentEnd, category] = value;

                           // console.debug('chapter', segmentStart, segmentEnd);
                           // console.debug('chapterStart', chapterStart);
                           // console.debug('chapterNextStart', chapterNextStart);

                           // if ((Math.trunc(segmentStart) <= chapterNextStart) && (Math.trunc(segmentEnd) >= chapterStart)) {
                           if (((Math.trunc(segmentStart) + deflectionSec) <= chapterNextStart)
                              && ((Math.trunc(segmentEnd) - deflectionSec) >= chapterStart)
                           ) {
                              let color = user_settings[`sponsor_block_color_${category}`];
                              if (color) {
                                 color = convertColor.hex2rgb(color).join(',');
                              }
                              // default colors
                              else {
                                 switch (category) {
                                    case 'sponsor': color = '255, 231, 0'; break; // '#ffe700'
                                    case 'interaction': color = '255, 127, 80'; break; // '#ff7f50'
                                    case 'selfpromo': color = '255, 99, 71'; break; // '#ff6347'
                                    case 'intro': color = '255, 165, 0'; break; // '#ffa500'
                                    case 'outro': color = '255, 165, 0'; break; // '#ffa500'
                                    default: color = '0, 255, 107'; break; // '#00ff6b'
                                 }
                              }
                              // simple chapter coloring
                              // chapterEl.style.background = `rgb(${color}, .4`;
                              // chapterEl.title = [chapterEl.title, categoryNameLabel[category]].join(', ');

                              const
                                 newChapter = document.createElement('span'),
                                 startPoint = Math.max(segmentStart, chapterStart),
                                 sizeChapter = chapterNextStart - chapterStart,
                                 getPt = d => (d * 100 / sizeChapter) + '%';

                              newChapter.title = category;
                              // el.style.cssText = '';
                              Object.assign(newChapter.style, {
                                 // position: 'absolute',
                                 // display: 'block',
                                 width: getPt(Math.min(segmentEnd, chapterNextStart) - startPoint),
                                 left: getPt(startPoint - chapterStart),
                                 'background-color': `rgb(${color}, .4`,
                              });
                              // chapterEl.style.position = 'relative';
                              chapterEl.append(newChapter);
                           }
                        }
                     });
               }
            }
            // apply a skip method
            video.addEventListener('timeupdate', function () {
               // if (!isNaN(video.duration))

               let segmentStart, segmentEnd, category;

               // for (const [i, value] of segmentsList.entries()) {
               //    console.debug('>>', value, i);
               //    const [segmentStart, segmentEnd] = value;
               for (let i = 0; i < segmentsList.length; i++) {
                  // console.debug('>>', segmentsList, i);
                  [segmentStart, segmentEnd, category] = segmentsList[i];
                  segmentStart = Math.trunc(segmentStart);
                  segmentEnd = Math.ceil(segmentEnd);

                  const inSegment = (this.currentTime > segmentStart && this.currentTime < segmentEnd);

                  switch (user_settings.sponsor_block_action) {
                     // case 'full': break;
                     // case 'poi': break;
                     case 'mute':
                        // set Mute
                        // movie_player.isMuted() == this.muted
                        if (inSegment && !muteState && !this.muted) {
                           muteState = true;
                           movie_player.mute(true);

                           return novaNotification('muted');
                        }
                        // unMute
                        else if (!inSegment && muteState && this.muted) {
                           muteState = false;
                           movie_player.unMute();
                           segmentsList.splice(i, 1); // for optimization use segment once

                           return novaNotification('unMuted');
                        }
                        break;

                     // default:
                     case 'skip':
                        if (inSegment) {
                           this.currentTime = segmentEnd;
                           segmentsList.splice(i, 1); // for optimization use segment once

                           // return novaNotification('skipped');
                           return novaNotification();
                        }
                        break;
                  }
               }

               function novaNotification(prefix = '') {
                  if (!user_settings.sponsor_block_notification) return;

                  const msg = `${prefix} ${NOVA.formatTimeOut.HMS.digit(segmentEnd - segmentStart)}「${categoryNameLabel[category]}」• ${NOVA.formatTimeOut.HMS.digit(segmentStart)} - ${NOVA.formatTimeOut.HMS.digit(segmentEnd)}`;
                  console.info(videoId, msg); // user log
                  NOVA.showOSD(msg); // trigger default indicator
               }

            });
         });


      async function getSkipSegments(videoId = required()) {
         const CACHE_PREFIX = 'nova-sponsor-block:';

         if (
            navigator.cookieEnabled // fix - Failed to read the 'sessionStorage' property from 'Window': Access is denied for this document.
            && (storage = sessionStorage.getItem(CACHE_PREFIX + videoId))
         ) {
            // console.debug('get from cache:', storage);
            return JSON.parse(storage);
         }
         else {
            const
               actionTypes = (Array.isArray(user_settings.sponsor_block_action)
                  ? user_settings.sponsor_block_action : [user_settings.sponsor_block_action])
                  || ['skip', 'mute'], // ['skip', 'mute', 'full', 'poi'],
               // https://wiki.sponsor.ajay.app/w/Guidelines
               categories = user_settings.sponsor_block_category || [
                  'sponsor',
                  'interaction',
                  'selfpromo',
                  'intro',
                  'outro',
                  // 'preview',
                  // 'music_offtopic',
                  // 'exclusive_access',

                  // I do not know what is this:
                  // 'poi_highlight',
                  // 'filler',
                  // 'chapter',
               ],
               // https://wiki.sponsor.ajay.app/w/API_Docs
               params = {
                  'videoID': videoId,
                  'actionTypes': JSON.stringify(actionTypes),
                  'categories': JSON.stringify(categories),
               },
               query = Object.keys(params)
                  .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
                  .join('&');

            // [{
            //    "category": "sponsor",
            //    "actionType": "skip",
            //    "segment": [
            //       293.74,
            //       398.035
            //    ],
            //    "UUID": "8b14bb76323da6901da331a05df14ee9575e762f41365eee378b7ea249f664f07",
            //    "videoDuration": 1299.161,
            //    "locked": 0,
            //    "votes": 1,
            //    "description": ""
            // }]
            const fetchAPI = () => fetch((user_settings.sponsor_block_url || 'https://sponsor.ajay.app')
               + `/api/skipSegments?${query}`,
               {
                  method: 'GET', // *GET, POST, PUT, DELETE, etc.
                  // mode: 'no-cors', // no-cors, *cors, same-origin
                  headers: { 'Content-Type': 'application/json' }, // 'Content-Type': 'application/x-www-form-urlencoded',
               }
            )
               // .then(response => response.text())
               // .then(text => {
               //    if (text == 'Not Found') {
               //       const error = new Error('promise chain cancelled');
               //       error.name = 'CancelPromiseChainError';
               //       throw error;
               //    }
               // })
               .then(response => response.json()) // text "Not Found"
               .then(json => json
                  // .filter(i => i.actionType === 'skip')
                  // .map(a => a.segment)
                  .map(a => [...a.segment, a.category])
               )
               .catch(error => {
                  // mute console warn
                  // console.warn(`Sponsorblock: failed fetching skipSegments for ${videoId}, reason: ${error}`);
               });

            if (result = await fetchAPI()) {
               // console.debug('result sponsor', result
               //    // , (user_settings.sponsor_block_url || 'https://sponsor.ajay.app') + `/api/skipSegments?${query}`
               // );
               if (navigator.cookieEnabled) {
                  sessionStorage.setItem(CACHE_PREFIX + videoId, JSON.stringify(result));
               }
               return result;
            }
         }
      }

      // alt
      // test https://www.youtube.com/watch?v=9Yhc6mmdJC4
      // async function getSkipSegments(videoId = required()) {
      //    const fetchAPI = () => fetch(`https://model.sponsor-skipper.com/getSponsorChaptersFor?videoID=${videoId}`,
      //       {
      //          method: 'GET', // *GET, POST, PUT, DELETE, etc.
      //          mode: 'no-cors', // no-cors, *cors, same-origin
      //          headers: { 'Content-Type': 'application/json' }, // 'Content-Type': 'application/x-www-form-urlencoded',
      //       }
      //    )
      //       .then(response => response.json())
      //       // {
      //       //    "sponsored_chapters":[
      //       //       {"end_time_sec":146.4,"start_time_sec":104.56}
      //       //    ],"videoID":""
      //       // }
      //       .then(json => json?.sponsored_chapters.map(o => ({
      //          'segmentStart': o.start_time_sec,
      //          'segmentEnd': o.end_time_sec,
      //       }))
      //       )
      //       .catch(error => {
      //          // mute console warn
      //          console.warn(`sponsor-skipper: failed fetching skipSegments for ${videoId}, reason: ${error}`);
      //       });

      //    if (result = await fetchAPI()) {
      //       // console.debug('result sponsor', result
      //       //    // , (user_settings.sponsor_block_url || 'https://sponsor.ajay.app') + `/api/skipSegments?${query}`
      //       // );
      //       if (navigator.cookieEnabled) {
      //          sessionStorage.setItem(CACHE_PREFIX + videoId, JSON.stringify(result));
      //       }
      //       return result;
      //    }
      // }

      const convertColor = {
         /**
          * @param  {string} hex
          * @return {array}
         */
         hex2rgb(hex = required()) {
            return ['0x' + hex[1] + hex[2] | 0, '0x' + hex[3] + hex[4] | 0, '0x' + hex[5] + hex[6] | 0];
         },
         // rgbToHex(r = 0, g = 0, b = 0) {
         //    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
         // },
      };

   },
   options: {
      sponsor_block_category: {
         _tagName: 'select',
         label: 'Category',
         // 'label:zh': '',
         // 'label:ja': '',
         // 'label:ko': '',
         // 'label:vi': '',
         // 'label:id': '',
         // 'label:es': '',
         // 'label:pt': '',
         // 'label:fr': '',
         // 'label:it': '',
         // 'label:tr': '',
         // 'label:de': '',
         // 'label:pl': '',
         // 'label:ua': '',
         title: '[Ctrl+Click] to select several',
         'title:zh': '[Ctrl+Click] 选择多个',
         'title:ja': '「Ctrl+Click」して、いくつかを選択します',
         // 'title:ko': '[Ctrl+Click] 여러 선택',
         // 'title:vi': '',
         // 'title:id': '[Ctrl+Klik] untuk memilih beberapa',
         // 'title:es': '[Ctrl+Click] para seleccionar varias',
         // 'title:pt': '[Ctrl+Click] para selecionar vários',
         // 'title:fr': '[Ctrl+Click] pour sélectionner plusieurs',
         // 'title:it': '[Ctrl+Clic] per selezionarne diversi',
         // 'title:tr': 'Birkaç tane seçmek için [Ctrl+Tıkla]',
         // 'title:de': '[Ctrl+Click] um mehrere auszuwählen',
         'title:pl': 'Ctrl+kliknięcie, aby zaznaczyć kilka',
         // 'title:ua': '[Ctrl+Click] щоб обрати декілька',
         multiple: null, // don't use - selected: true
         required: true, // don't use - selected: true
         size: 7, // = options.length
         options: [
            {
               label: 'Ads/Sponsor', value: 'sponsor',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               title: 'Paid promotion, paid referrals and direct advertisements',
            },
            {
               label: 'Unpaid/Self promotion', value: 'selfpromo',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               // title: 'Similar to sponsor except for unpaid or self promotion. This includes sections about merchandise, donations, or information about who they collaborated with',
            },
            {
               // label: 'Interaction Reminder (Subscribe)', value: 'interaction',
               label: 'Reminder subscribe', value: 'interaction',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               // title: 'When there is a short reminder to like, subscribe or follow them in the middle of content',
            },
            {
               // label: 'Intermission/Intro Animation', value: 'intro',
               label: 'Intro', value: 'intro',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               // title: 'An interval without actual content. Could be a pause, static frame, repeating animation',
            },
            {
               label: 'Endcards/Credits', value: 'outro',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               // title: 'Credits or when the YouTube endcards appear. Not spoken conclusions',
            },
            // {
            //    label: 'Highlight', value: 'poi_highlight',
            //    // 'label:zh': '',
            //    // 'label:ja': '',
            //    // 'label:ko': '',
            //    // 'label:vi': '',
            //    // 'label:id': '',
            //    // 'label:es': '',
            //    // 'label:pt': '',
            //    // 'label:fr': '',
            //    // 'label:it': '',
            //    // 'label:tr': '',
            //    // 'label:de': '',
            //    // 'label:pl': '',
            //    // 'label:ua': '',
            //    // title: '',
            // },
            {
               label: 'Preview/Recap', value: 'preview',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               // title: 'Quick recap of previous episodes, or a preview of what's coming up later in the current video. Meant for edited together clips, not for spoken summaries.',
            },
            {
               // label: 'Music: Non-Music Section', value: 'music_offtopic',
               label: 'Non-music section of clip', value: 'music_offtopic',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               // title: 'Only for use in music videos. This includes introductions or outros in music videos',
            },
            {
               label: 'Full Video Label Only', value: 'exclusive_access',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               // title: '',
            },
            {
               label: 'Off-topic/Filler', value: 'filler',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
               // 'label:id': '',
               // 'label:es': '',
               // 'label:pt': '',
               // 'label:fr': '',
               // 'label:it': '',
               // 'label:tr': '',
               // 'label:de': '',
               // 'label:pl': '',
               // 'label:ua': '',
               // title: '',
            },
         ],
      },
      sponsor_block_action: {
         _tagName: 'select',
         label: 'Mode',
         'label:zh': '模式',
         'label:ja': 'モード',
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
         // title: '',
         // 'label:ua': 'Режим',
         options: [
            {
               label: 'skip', value: 'skip', selected: true,
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
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
            {
               label: 'mute', value: 'mute',
               // 'label:zh': '',
               // 'label:ja': '',
               // 'label:ko': '',
               // 'label:vi': '',
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
            //    label: 'full', value: 'full',
            //    // 'label:zh': '',
            //    // 'label:ja': '',
            //    // 'label:ko': '',
            //    // 'label:vi': '',
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
            //    label: 'poi', value: 'poi',
            //    // 'label:zh': '',
            //    // 'label:ja': '',
            //    // 'label:ko': '',
            //    // 'label:vi': '',
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
      sponsor_block_url: {
         _tagName: 'input',
         label: 'URL',
         type: 'url',
         pattern: "https://.*",
         // title: '',
         placeholder: 'https://domain.com',
         value: 'https://sponsor.ajay.app',
         required: true,
      },
      sponsor_block_notification: {
         _tagName: 'input',
         label: 'Show OSD notification',
         // 'label:zh': '',
         // 'label:ja': '',
         // 'label:ko': '',
         // 'label:vi': '',
         // 'label:id': '',
         // 'label:es': '',
         // 'label:pt': '',
         // 'label:fr': '',
         // 'label:it': '',
         // 'label:tr': '',
         // 'label:de': '',
         // 'label:pl': '',
         // 'label:ua': '',
         type: 'checkbox',
         // title: '',
         // 'data-dependent': { 'player-indicator': true },
      },
      // colors
      sponsor_block_color_sponsor: {
         _tagName: 'input',
         type: 'color',
         value: '#08D00B',
         label: 'Color - Ads/Sponsor',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['sponsor'] },
      },
      sponsor_block_color_selfpromo: {
         _tagName: 'input',
         type: 'color',
         value: '#F8FA00',
         label: 'Color - Unpaid/Self Promotion',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['selfpromo'] },
      },
      sponsor_block_color_interaction: {
         _tagName: 'input',
         type: 'color',
         value: '#C900FB',
         label: 'Color - Reminder Subscribe',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['interaction'] },
      },
      sponsor_block_color_intro: {
         _tagName: 'input',
         type: 'color',
         value: '#00F4F3',
         label: 'Color - intro',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['intro'] },
      },
      sponsor_block_color_outro: {
         _tagName: 'input',
         type: 'color',
         value: '#0102F3',
         label: 'Color - Endcards/Credits',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['outro'] },
      },
      // sponsor_block_color_poi_highlight: {
      //    _tagName: 'input',
      //    type: 'color',
      //    value: '#00ff6b', // '0, 255, 107'
      //    label: 'Color - Highlight',
      //    // 'label:zh': '颜色',
      //    // 'label:ja': '色',
      //    // 'label:ko': '색깔',
      //    // 'label:vi': '',
      //    // 'label:id': 'Warna',
      //    // 'label:es': 'Color',
      //    // 'label:pt': 'Cor',
      //    // 'label:fr': 'Couleur',
      //    // 'label:it': 'Colore',
      //    // 'label:tr': 'Renk',
      //    // 'label:de': 'Farbe',
      //    // 'label:pl': 'Kolor',
      //    // 'label:ua': 'Колір',
      //    'data-dependent': { 'sponsor_block_category': ['poi_highlight'] },
      // },
      sponsor_block_color_preview: {
         _tagName: 'input',
         type: 'color',
         value: '#0B85C8',
         label: 'Color - Preview/Recap',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['preview'] },
      },
      sponsor_block_color_music_offtopic: {
         _tagName: 'input',
         type: 'color',
         value: '#FF9D04',
         // label: 'Color - Music: Non-Music Section',
         label: 'Color - Non-Music Section',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['music_offtopic'] },
      },
      sponsor_block_color_exclusive_access: {
         _tagName: 'input',
         type: 'color',
         value: '#F2177B',
         label: 'Color - Full Video Label Only',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['exclusive_access'] },
      },
      sponsor_block_color_filler: {
         _tagName: 'input',
         type: 'color',
         value: '#7E00FF',
         label: 'Color - Off-topic/Filler',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         // 'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         'data-dependent': { 'sponsor_block_category': ['filler'] },
      },
   }
});
