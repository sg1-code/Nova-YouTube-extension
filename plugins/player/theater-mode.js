// for test:
// https://www.youtube.com/watch?v=ICpzoZozwCU - [player-unavailable] offensive video

window.nova_plugins.push({
   id: 'theater-mode',
   title: 'Auto wide player (Theater mode)',
   // 'title:zh': '播放器全模式',
   // 'title:ja': 'プレーヤーフル-モード付き',
   // 'title:ko': '플레이어 풀-위드 모드',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': 'Reproductor completo con modo',
   // 'title:pt': 'Modo de jogador completo',
   // 'title:fr': 'Mode lecteur complet avec',
   // 'title:it': '',
   // 'title:tr': 'Oyuncu tam mod',
   // 'title:de': 'Player full-with-modus',
   'title:pl': 'Tryb kinowy',
   // 'title:ua': 'Режим кінотеарту',
   run_on_pages: 'watch, -mobile',
   section: 'player',
   // desc: '',
   // 'plugins-conflict': 'player-fullscreen-mode, embed-popup, player-control-below',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/10523-youtube-always-theater-mode
      // alt2 - https://chromewebstore.google.com/detail/dgognhgbpdoeidccnbfhohblklhbbomh
      // alt3 - https://greasyfork.org/en/scripts/480701-youtube-fullpage-theater
      // alt4 - https://chromewebstore.google.com/detail/gdkadbhiemijfpoochcieonikoaciapi
      // alt5 - https://greasyfork.org/en/scripts/497131-youtube-auto-theater-mode

      if (user_settings.player_full_viewport_mode == 'redirect_watch_to_embed') {
         return location.assign(`https://www.youtube.com/embed/` + NOVA.queryURL.get('v'));
      }

      if (user_settings.theater_mode_ignore_playlist && location.search.includes('list=')) return;

      // Solution 1
      NOVA.waitSelector('.ytd-page-manager[video-id]:not([player-unavailable])')
         .then(el => {
            if (isTheaterMode()) return;

            NOVA.waitUntil(() => isTheaterMode() || toggleTheater(), 1000);

            function isTheaterMode() {
               return (
                  (NOVA.getPlayerState.visibility() == 'THEATER')
                  || el.hasAttribute('theater')
                  || (typeof el.isTheater_ === 'function' && el.isTheater_())
                  // || approximatelyEqual(movie_player.clientWidth, window.innerWidth, .05)
                  // || (NOVA.cookies.get('wide') === '1') // unreliable inert method
               );

               // function approximatelyEqual(num1 = required(), num2 = required(), tolerance_pt = .05) {
               //    // Calculate the absolute difference between the numbers
               //    const absDiff = Math.abs(num1 - num2);
               //    // Get the larger number's absolute value
               //    const largerAbs = Math.max(Math.abs(num1), Math.abs(num2));
               //    // Check if the absolute difference is less than the tolerance (5%) times the larger number
               //    return absDiff < (tolerance_pt * largerAbs);
               // }
            }

            function toggleTheater() {
               // Solution 1 (API)
               // document.body.querySelector('.ytd-page-manager[video-id]').setPlayerTheaterMode_(); // Doesn't work
               // el.updateTheaterModeState_(true);

               // Solution 2 (Emulate button press)
               if (btn = document.body.querySelector('.ytp-chrome-bottom .ytp-size-button')) {
                  btn.click();
               }
               else {
                  // Solution 3 (Hotkey)
                  (typeof movie_player === 'object' ? movie_player : document) // window.dispatchEvent - Doesn't work!
                     .dispatchEvent(
                        // Keyboard code - https://docs.microsoft.com/en-us/dotnet/api/android.views.keycode?view=xamarin-android-sdk-12
                        new KeyboardEvent(
                           'keydown',
                           {
                              keyCode: 84,
                              key: 't',
                              code: 'KeyT',
                              which: 84,
                              // target: document.body,
                              bubbles: true,
                              cancelable: false,
                           }
                        )
                     );
               }
               // Solution 4 (Cookie) (Doesn't work without refreshing the page)
               // if (navigator.cookieEnabled)  document.cookie = 'wide=1;domain=.youtube.com';
               // NOVA.cookie.set('wide', 1, 99);
            }

            // fix blocked the wrapper offensive video
            if (!user_settings['video-unblock-warn-content']) {
               NOVA.waitSelector('.ytd-page-manager[video-id][player-unavailable] yt-player-error-message-renderer #button.yt-player-error-message-renderer button', { destroy_after_page_leaving: true })
                  .then(btn => btn.click()); // click "I understand and wish to proceed"
            }
         });

      // function alwaysTheaterMode() {
      //    let clickBtnRepeatly = setInterval(() => {
      //       if (isTheaterMode()) {
      //          clearInterval(clickBtnRepeatly);
      //       } else {
      //          document.body.querySelectorAll('.ytp-chrome-bottom .ytp-size-button')?.forEach(e => e.click());
      //          clearInterval(clickBtnRepeatly);
      //       }
      //    }, 500);
      //    setTimeout(() => clearInterval(clickBtnRepeatly), 10000);
      // };

      // Solution 2. Doesn't work
      // NOVA.waitSelector('video')
      //    .then(video => {
      //       video.addEventListener('playing', setTheater, { capture: true, once: true });

      //       function setTheater() {
      //          // document.cookie = 'wide=1;';
      //          document.body.querySelector('.ytd-page-manager[video-id]:not([theater]) #movie_player .ytp-chrome-bottom button.ytp-size-button')
      //             ?.click();
      //       }
      //    });

      if (user_settings.player_full_viewport_mode == '') return; // for optimization

      // fix conflict with [player-fullscreen-mode] plugin
      if (user_settings['player-fullscreen-mode']
         && !user_settings.player_fullscreen_mode_embed
         && user_settings.player_full_viewport_mode != 'cinema'
      ) {
         return;
      }

      NOVA.waitSelector('#movie_player')
         .then(movie_player => {
            // movie_player.addEventListener('SIZE_CLICKED', () => console.debug('SIZE_CLICKED'));
            const
               // the "#ytd-player" is more versatile than "#player-wide-container" or "#player-container",
               PLAYER_CONTAINER_SELECTOR = '.ytd-page-manager[video-id][theater]:not([fullscreen]) #ytd-player', // fix for "player-pin-scroll" plugin
               PINNED_SELECTOR = '.nova-player-pin', // fix for "player-pin-scroll" plugin
               PLAYER_SCROLL_LOCK_CLASS_NAME = 'nova-lock-scroll',
               // fixOnSeeking = 'nova-lock-theater',
               _PLAYER_SELECTOR = `#movie_player:not(${PINNED_SELECTOR}):not(.${PLAYER_SCROLL_LOCK_CLASS_NAME})`, // fix for [player-pin-scroll] plugin
               PLAYER_SELECTOR = `${PLAYER_CONTAINER_SELECTOR} ${_PLAYER_SELECTOR}`, // fix for [player-pin-scroll] plugin
               zIndex = Math.max(getComputedStyle(movie_player)['z-index'], 2020); // remember update pkugin [player-control-below]

            addScrollDownBehavior(movie_player);

            switch (user_settings.player_full_viewport_mode) {
               case 'offset':
                  // alt1 - https://greasyfork.org/en/scripts/436667-better-youtube-theatre-mode
                  // alt2 - https://greasyfork.org/en/scripts/16323-youtube-player-controls
                  // alt3 - https://greasyfork.org/en/scripts/500946-youtube-theater-mode-zoom-in
                  NOVA.css.push(
                     // `${user_settings.player_full_viewport_mode_exit ? `${PLAYER_CONTAINER_SELECTOR}:has(${_PLAYER_SELECTOR}.paused-mode.ytp-progress-bar-hover.${fixOnSeeking}),` : ''}
                     `${PLAYER_CONTAINER_SELECTOR}${user_settings.player_full_viewport_mode_exit ? `:has(${_PLAYER_SELECTOR}.playing-mode)` : ''} {
                        min-height: calc(100vh - ${user_settings['header-compact']
                        ? '36px'
                        : NOVA.css.get('#masthead-container', 'height') || '56px'
                     // : document.body.querySelector('#masthead-container')?.offsetHeight || 56
                     }) !important;
                     }`
                     + // ${user_settings.player_full_viewport_mode_exit ? `.ytd-page-manager[video-id][theater]:not([fullscreen]) *:has(${_PLAYER_SELECTOR}.paused-mode.ytp-progress-bar-hover.${fixOnSeeking}) ~ #columns,` : ''}
                     `.ytd-page-manager[video-id][theater]:not([fullscreen]) ${user_settings.player_full_viewport_mode_exit ? `*:has(${_PLAYER_SELECTOR}.playing-mode) ~` : ''} #columns {
                        position: absolute;
                        top: 100vh;
                     }
                     ${PLAYER_SELECTOR} {
                        background-color: black;
                     }`);

                  fixOnPause();
                  break;

               case 'force':
                  // alt1 - https://greasyfork.org/en/scripts/434075-youtube-fullscreen-mode
                  // alt2 - https://chromewebstore.google.com/detail/gkkmiofalnjagdcjheckamobghglpdpm
                  // alt3 - https://greasyfork.org/en/scripts/454092-youtube-theater-fill-up-window
                  // alt4 - https://greasyfork.org/en/scripts/33243-maximizer-for-youtube
                  // alt5 - https://greasyfork.org/en/scripts/442089-pkga-youtube-theater-mode
                  // alt6 - https://greasyfork.org/en/scripts/487233-youtube-true-theater-mode

                  setPlayerFullViewport(user_settings.player_full_viewport_mode_exit);
                  break;

               case 'smart':
                  // exclude shorts page #1
                  if (user_settings.player_full_viewport_mode_exclude_shorts && NOVA.currentPage == 'shorts') {
                     return;
                  }

                  NOVA.waitSelector('video')
                     .then(video => {
                        video.addEventListener('loadeddata', function () {
                           // exclude shorts page #2
                           if (user_settings.player_full_viewport_mode_exclude_shorts && this.videoWidth < this.videoHeight) {
                              return;
                           }
                           const miniSize = NOVA.aspectRatio.sizeToFit({
                              'src_Width': this.videoWidth,
                              'src_Height': this.videoHeight,
                              'max_Width': window.innerWidth,
                              'max_Height': window.innerHeight,
                           });
                           // out of viewport
                           if (miniSize.width < window.innerWidth) {
                              setPlayerFullViewport('player_full_viewport_mode_exit');
                           }
                        });
                     });
                  break;

               case 'cinema':
                  // alt1 - https://greasyfork.org/en/scripts/419359-youtube-simple-cinema-mode
                  // alt2 - https://chromewebstore.google.com/detail/bfbmjmiodbnnpllbbbfblcplfjjepjdn
                  NOVA.css.push(
                     `${PLAYER_SELECTOR} { z-index: ${zIndex}; }

                     ${PLAYER_SELECTOR}:before {
                        content: '';
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, ${+user_settings.cinema_mode_opacity});
                        opacity: 0;
                        transition: opacity 400ms ease-in-out;
                        pointer-events: none;
                     }

                     /*#movie_player.paused-mode:before,*/
                     ${PLAYER_SELECTOR}.playing-mode:before { opacity: 1; }

                     /* fix */
                     .ytp-ad-player-overlay,
                     #playlist:hover,
                     #masthead-container:hover,
                     iframe, /*search result box*/
                     #guide,
                     [class*="popup"],
                     [role="navigation"],
                     [role="dialog"] {
                        z-index: ${zIndex + 1};
                     }
                     #playlist:hover { position: relative; }`);

                  addHideScrollbarCSS();
                  break;
            }

            function setPlayerFullViewport(exclude_pause) {
               // Solution 1
               NOVA.css.push(
                  `${PLAYER_SELECTOR}.paused-mode${exclude_pause ? `.ytp-progress-bar-hover.${fixOnSeeking}` : ``},
                  ${PLAYER_SELECTOR}.playing-mode {
                     width: 100vw;
                     height: 100vh;
                     position: fixed;
                     bottom: 0 !important;
                     z-index: ${zIndex};
                     background-color: black;
                  }`);

               // show searchbar on hover. To above v105 https://developer.mozilla.org/en-US/docs/Web/CSS/:has
               if (CSS.supports('selector(:has(*))')) {
                  NOVA.css.push(
                     `#masthead-container:has( ~ #page-manager .ytd-page-manager[video-id][theater]) {
                        position: fixed;
                        z-index: ${zIndex + 1};
                        opacity: 0;
                     }
                     #masthead-container:has( ~ #page-manager .ytd-page-manager[video-id][theater]):hover,
                     #masthead-container:has( ~ #page-manager .ytd-page-manager[video-id][theater]):focus {
                        opacity: 1;
                     }`);
               }

               addHideScrollbarCSS();

               // Solution 2
               // const CLASS_NAME = '';
               // video.addEventListener('playing', () => {
               //    movie_player.classList.add(CLASS_NAME)
               // });
               // if (user_settings.player_full_viewport_mode_exit) {
               //    video.addEventListener('pause', () => movie_player.classList.remove(CLASS_NAME));
               // }

               fixOnPause();
            }

            // alt1 - https://greasyfork.org/en/scripts/436168-youtube-exit-fullscreen-on-video-end
            // alt2 - https://greasyfork.org/en/scripts/469750-youtube-exit-fullscreen-on-video-end-modified
            function fixOnPause() {
               if (!user_settings.player_full_viewport_mode_exit) return

               NOVA.waitSelector('video')
                  .then(video => {
                     // let timeoutId;
                     // fix restore video size
                     video.addEventListener('pause', () => {
                        // fix overlapped ".paused-mode" after you seeking the time in the player with the mouse
                        if (!document.body.querySelector('.ytp-progress-bar')?.contains(document.activeElement)) {
                           window.dispatchEvent(new Event('resize'));
                        }
                        // movie_player.classList.add(fixOnSeeking);
                        // // if (typeof timeoutId === 'number') clearTimeout(timeoutId); // reset fade
                        // timeoutId = setTimeout(() => movie_player.classList.remove(fixOnSeeking), 1000);
                     });
                     // fix overwrite video height after pause
                     video.addEventListener('play', () => window.dispatchEvent(new Event('resize')));
                     // video.addEventListener('playing', () => window.dispatchEvent(new Event('resize')));
                     // video.addEventListener('pause', () => window.dispatchEvent(new Event('resize')));

                     // fix overlapped ".paused-mode" after you seeking the time in the player with the mouse
                     // video.addEventListener('seeking', () => movie_player.classList.add(fixOnSeeking), { capture: true });
                     // document.addEventListener('click', evt => {
                     //    if (evt.isTrusted && document.body.querySelector('.ytp-progress-bar')?.contains(document.activeElement)) {
                     //       movie_player.classList.add(fixOnSeeking)
                     //    }
                     // }, { capture: true });
                     // video.addEventListener('seeking', () => movie_player.classList.add(fixOnSeeking));
                     // video.addEventListener('seeked', () => movie_player.classList.remove(fixOnSeeking));
                     // video.addEventListener('play', () => movie_player.classList.add(fixOnSeeking));

                  });
            }

            // add scroll-down behavior on player control panel
            function addScrollDownBehavior(movie_player = required()) {
               // exept .ytp-volume-area
               document.body.querySelector('.ytp-chrome-controls')
                  ?.addEventListener('wheel', evt => {
                     switch (Math.sign(evt.wheelDelta)) {
                        case 1: // Up
                           if (window.scrollY === 0 && movie_player.classList.contains(PLAYER_SCROLL_LOCK_CLASS_NAME)) {
                              movie_player.classList.remove(PLAYER_SCROLL_LOCK_CLASS_NAME);
                              triggerPlayerLayoutUpdate();
                           }
                           break;

                        case -1: // Down
                           if (!movie_player.classList.contains(PLAYER_SCROLL_LOCK_CLASS_NAME)) {
                              movie_player.classList.add(PLAYER_SCROLL_LOCK_CLASS_NAME);
                              triggerPlayerLayoutUpdate();
                           }
                           break;
                     }
                  });

               async function triggerPlayerLayoutUpdate() {
                  await NOVA.delay(200);
                  window.dispatchEvent(new Event('resize'));
               }
            }

            function addHideScrollbarCSS() {
               if (user_settings['scrollbar-hide']) return;

               NOVA.css.push(`html body:has(${PLAYER_SELECTOR})::-webkit-scrollbar { display: none }`);
            }
         });

   },
   options: {
      player_full_viewport_mode: {
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
         options: [
            {
               label: 'default', /* value: '', */ selected: true, // fill value if no "selected" mark another option
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
               // 'label:ua': 'за замовчуванням',
            },
            {
               label: 'cinema', value: 'cinema',
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
               // 'label:ua': 'кінотеатр',
            },
            {
               label: 'full-viewport', value: 'force',
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
               // 'label:ua': 'повноекранний',
            },
            {
               label: 'full-viewport (auto)', value: 'smart',
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
               // 'label:ua': 'повноекранний (авто)',
            },
            {
               label: 'full-viewport+searchBar', value: 'offset',
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
               label: 'redirect to embedded', value: 'redirect_watch_to_embed',
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
               // 'label:ua': 'передавати на вбудований',
            },
         ],
      },
      player_full_viewport_mode_exit: {
         _tagName: 'input',
         // label: 'Exit Fullscreen on Video End',
         // label: 'Full-viewport exit if video ends/pause',
         // label: 'Exit Fullscreen on video end/pause',
         label: 'Switch on end/pause',
         // 'label:zh': '视频结束/暂停时退出',
         // 'label:ja': 'ビデオが終了/一時停止したら終了します',
         // 'label:ko': '동영상이 종료/일시 중지되면 종료',
         // 'label:vi': '',
         // 'label:id': 'Keluar dari viewport penuh jika video berakhir/jeda',
         // 'label:es': 'Salir si el video termina/pausa',
         // 'label:pt': 'Sair se o vídeo terminar/pausar',
         // 'label:fr': 'Quitter si la vidéo se termine/pause',
         // 'label:it': 'Uscita dalla visualizzazione completa se il video termina/mette in pausa',
         // 'label:tr': 'Video biterse/duraklatılırsa çıkın',
         // 'label:de': 'Beenden, wenn das Video endet/pausiert',
         'label:pl': 'Wyjdź, gdy film się kończy/pauzuje',
         // 'label:ua': 'Вихід із повного вікна перегляду, якщо відео закінчується/призупиняється',
         type: 'checkbox',
         // title: '',
         'data-dependent': { 'player_full_viewport_mode': ['force', 'smart', 'offset'] },
      },
      player_full_viewport_mode_exclude_shorts: {
         _tagName: 'input',
         label: 'Full-viewport exclude shorts',
         // 'label:zh': '全视口不包括短裤',
         // 'label:ja': 'フルビューポートはショートパンツを除外します',
         // 'label:ko': '전체 뷰포트 제외 반바지',
         // 'label:vi': '',
         // 'label:id': 'Area pandang penuh tidak termasuk celana pendek',
         // 'label:es': 'Vista completa excluir pantalones cortos',
         // 'label:pt': 'Shorts de exclusão da janela de visualização completa',
         // 'label:fr': 'La fenêtre complète exclut les shorts',
         // 'label:it': 'La visualizzazione completa esclude i cortometraggi',
         // 'label:tr': 'Tam görünüm alanı şortları hariç tutar',
         // 'label:de': 'Vollbildansicht schließt Shorts aus',
         'label:pl': 'Pełny ekran wyklucza krótkie filmy',
         // 'label:ua': 'Повне вікно перегляду без прев`ю',
         type: 'checkbox',
         // title: '',
         'data-dependent': { 'player_full_viewport_mode': 'smart' },
      },
      cinema_mode_opacity: {
         _tagName: 'input',
         label: 'Opacity',
         // 'label:zh': '不透明度',
         // 'label:ja': '不透明度',
         // 'label:ko': '불투명',
         // 'label:vi': '',
         // 'label:id': 'Kegelapan',
         // 'label:es': 'Opacidad',
         // 'label:pt': 'Opacidade',
         // 'label:fr': 'Opacité',
         // 'label:it': 'Opacità',
         // 'label:tr': 'Opaklık',
         // 'label:de': 'Opazität',
         'label:pl': 'Przezroczystość',
         // 'label:ua': 'Прозорість',
         type: 'number',
         title: '0-1',
         placeholder: '0-1',
         step: .05,
         min: 0,
         max: 1,
         value: .75,
         'data-dependent': { 'player_full_viewport_mode': 'cinema' },
      },
      theater_mode_ignore_playlist: {
         _tagName: 'input',
         label: 'Ignore in playlist',
         // 'label:zh': '忽略播放列表',
         // 'label:ja': 'プレイリストを無視する',
         // 'label:ko': '재생목록 무시',
         // 'label:vi': '',
         // 'label:id': 'Abaikan daftar putar',
         // 'label:es': 'Ignorar lista de reproducción',
         // 'label:pt': 'Ignorar lista de reprodução',
         // 'label:fr': 'Ignorer la liste de lecture',
         // 'label:it': 'Ignora playlist',
         // 'label:tr': 'Oynatma listesini yoksay',
         // 'label:de': 'Wiedergabeliste ignorieren',
         'label:pl': 'Zignoruj listę odtwarzania',
         // 'label:ua': 'Ігнорувати список відтворення',
         type: 'checkbox',
         // title: '',
      },
      // theater_mode_ignore_playlist: {
      //    _tagName: 'select',
      //    label: 'Ignore in playlist',
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
      //    type: 'checkbox',
      //    options: [
      //       {
      //          label: 'false', /* value: '', */ selected: true, // fill value if no "selected" mark another option
      //          // 'label:zh': '',
      //          // 'label:ja': '',
      //          // 'label:ko': '',
      //          // 'label:id': '',
      //          // 'label:es': '',
      //          // 'label:pt': '',
      //          // 'label:fr': '',
      //          // 'label:it': '',
      //          // 'label:tr': '',
      //          // 'label:de': '',
      //          // 'label:pl': '',
      //          // 'label:ua': '',
      //       },
      //       {
      //          label: 'all', value: 'all',
      //          // 'label:zh': '',
      //          // 'label:ja': '',
      //          // 'label:ko': '',
      //          // 'label:id': '',
      //          // 'label:es': '',
      //          // 'label:pt': '',
      //          // 'label:fr': '',
      //          // 'label:it': '',
      //          // 'label:tr': '',
      //          // 'label:de': '',
      //          // 'label:pl': '',
      //          // 'label:ua': '',
      //       },
      //       {
      //          label: 'only music', value: 'music',
      //          // 'label:zh': '',
      //          // 'label:ja': '',
      //          // 'label:ko': '',
      //          // 'label:id': '',
      //          // 'label:es': '',
      //          // 'label:pt': '',
      //          // 'label:fr': '',
      //          // 'label:it': '',
      //          // 'label:tr': '',
      //          // 'label:de': '',
      //          // 'label:pl': '',
      //          // 'label:ua': '',
      //       },
      //    ],
      // },
   }
});
