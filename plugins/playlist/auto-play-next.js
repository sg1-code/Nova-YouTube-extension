// for test:
// https://www.youtube.com/watch?v=9JzmYISeRMA&list=OLAK5uy_kDx6ubTnuS4mYHCPyyX1NpXyCtoQN08M4
// https://www.youtube.com/watch?v=Y07--9_sLpA&list=OLAK5uy_nMilHFKO3dZsuNgVWmEKDZirwXRXMl9yM - hidden playlist
// https://www.youtube.com/watch?v=2YV6IJLoBv4&list=PLbO4IdMhlVR4MNf0V2inF2XqVj-Ch3FeV - hidden playlist

window.nova_plugins.push({
   id: 'playlist-toggle-autoplay',
   title: 'Add playlist autoplay control button',
   'title:zh': '播放列表自动播放控制',
   'title:ja': 'プレイリストの自動再生コントロール',
   // 'title:ko': '재생 목록 자동 재생 제어',
   // 'title:vi': '',
   // 'title:id': 'Tombol kontrol putar otomatis daftar putar',
   // 'title:es': 'Control de reproducción automática de listas de reproducción',
   // 'title:pt': 'Controle de reprodução automática da lista de reprodução',
   // 'title:fr': 'Contrôle de lecture automatique de la liste de lecture',
   // 'title:it': 'Pulsante di controllo della riproduzione automatica della playlist',
   // 'title:tr': 'Oynatma listesi otomatik oynatma kontrolü',
   // 'title:de': 'Steuerung der automatischen Wiedergabe von Wiedergabelisten',
   'title:pl': 'Kontrola autoodtwarzania listy odtwarzania',
   // 'title:ua': 'Кнопка керування автовідтворенням',
   run_on_pages: 'watch, -mobile',
   // restart_on_location_change: true,
   section: 'playlist',
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/415542-youtube-prevent-playlist-autoplay
      // alt2 - https://greasyfork.org/en/scripts/375429-youtube-disable-playlist-autoplay
      // alt3 - https://greasyfork.org/en/scripts/481929-youtube-playlist-autoplay-button
      // alt4 - https://greasyfork.org/en/scripts/480708-youtube-playlist-autoplay

      // if (window.nova_playlistReversed) return; // conflict with plugin [playlist-reverse]

      const
         SELECTOR_ID = 'nova-playlist-autoplay-btn', // .switcher
         SELECTOR = '#' + SELECTOR_ID; // for css

      let sesionAutoplayState = user_settings.playlist_autoplay;

      // init autoplayCheckbox style
      NOVA.css.push(
         `#playlist-action-menu .top-level-buttons {
            align-items: center;
         }
         ${SELECTOR}[type=checkbox] {
            --height: 1em;
            width: 2.2em;
         }
         ${SELECTOR}[type=checkbox]:after {
            transform: scale(1.5);
         }
         ${SELECTOR}[type=checkbox] {
            --opacity: .7;
            --color: white;
            height: var(--height);
            line-height: 1.6em;
            border-radius: 3em;
            background-color: var(--paper-toggle-button-unchecked-bar-color, black);
            appearance: none;
            -webkit-appearance: none;
            position: relative;
            cursor: pointer;
            outline: 0;
            border: none;
         }
         ${SELECTOR}[type=checkbox]:after {
            position: absolute;
            top: 0;
            left: 0;
            content: '';
            width: var(--height);
            height: var(--height);
            border-radius: 50%;
            background-color: var(--color);
            box-shadow: 0 0 .25em rgba(0, 0, 0, .3);
            /* box-shadow: 0 .1em .25em #999; */
         }
         ${SELECTOR}[type=checkbox]:checked:after {
            left: calc(100% - var(--height));
            --color: var(--paper-toggle-button-checked-button-color, var(--primary-color));
         }
         ${SELECTOR}[type=checkbox]:focus, input[type=checkbox]:focus:after {
            transition: all 200ms ease-in-out;
         }
         ${SELECTOR}[type=checkbox]:disabled {
            opacity: .3;
         }`);

      NOVA.runOnPageLoad(() => {
         // if (window.nova_playlistReversed) return; // conflict with plugin [playlist-reverse]
         if (location.search.includes('list=') && NOVA.currentPage == 'watch') {
            // if (!NOVA.queryURL.has('list')/* || !movie_player?.getPlaylistId()*/) return;
            insertButton();
         }
      });

      function insertButton() {
         NOVA.waitSelector('.ytd-page-manager[video-id]:not([hidden]) ytd-playlist-panel-renderer:not([collapsed]) #playlist-action-menu .top-level-buttons:not([hidden]), #secondary #playlist #playlist-action-menu #top-level-buttons-computed', { destroy_after_page_leaving: true })
            .then(el => insertrCheckbox(el));

         function insertrCheckbox(container = required()) {
            if (!(container instanceof HTMLElement)) return console.error('container not HTMLElement:', container);

            document.getElementById(SELECTOR_ID)?.remove(); // clear old

            const autoplayCheckbox = document.createElement('input');
            autoplayCheckbox.id = SELECTOR_ID;
            autoplayCheckbox.type = 'checkbox';
            autoplayCheckbox.title = 'Playlist toggle autoplay';
            autoplayCheckbox.addEventListener('change', ({ target }) => {
               sesionAutoplayState = target.checked;
               setAssociatedAutoplay();
            });
            container.append(autoplayCheckbox);

            autoplayCheckbox.checked = sesionAutoplayState; // set default state
            setAssociatedAutoplay();

            function setAssociatedAutoplay() {
               // get playlist manager
               if (manager = document.body.querySelector('yt-playlist-manager')) {
                  manager.interceptedForAutoplay = true;
                  manager.canAutoAdvance_ = autoplayCheckbox.checked;
                  // let currentExpected = true
                  // manager.onYtNavigateStart_ = function () { this.canAutoAdvance_ = currentExpected = false }
                  // manager.onYtNavigateFinish_ = function () { currentExpected = true; this.canAutoAdvance_ = autoplayCheckbox.checked ? currentExpected : false }
                  // checkbox update state
                  autoplayCheckbox.checked = manager?.canAutoAdvance_;
                  autoplayCheckbox.title = `Playlist Autoplay is ${manager?.canAutoAdvance_ ? 'ON' : 'OFF'}`;

                  if (autoplayCheckbox.checked) checkHiddenVideo();
               }
               else console.error('Error playlist-autoplay. Playlist manager:', manager);

               // fix (https://github.com/raingart/Nova-YouTube-extension/issues/52)
               async function checkHiddenVideo() {
                  const watchManager = document.body.querySelector('.ytd-page-manager[video-id]');
                  let playlistItems;

                  await NOVA.waitUntil(() => (playlistItems = getPlaylistContents(watchManager)) && playlistItems.length, 1000); // 1 sec

                  const
                     currentIdx = movie_player.getPlaylistIndex(),
                     lastAvailableIdx = playlistItems.findIndex(i => i.hasOwnProperty('messageRenderer')) - 1;

                  // console.debug(currentIdx, lastAvailableIdx)

                  if (currentIdx === lastAvailableIdx) {
                     // ex: https://www.youtube.com/watch?v=-whp15J2n_M&list=FLsWT--HCC3qCRRPDqDCCGKA
                     manager.canAutoAdvance_ = false;
                     alert('Nova [playlist-toggle-autoplay]:\nPlaylist has hide video. Playlist autoplay disabled');
                     autoplayCheckbox.checked = false;
                  }

                  function getPlaylistContents(manager) {
                     return (
                        manager?.data?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents ||
                        manager?.data?.playlist?.playlist?.contents
                     );
                  }
               }
            }

         }
      }

   },
   options: {
      playlist_autoplay: {
         _tagName: 'select',
         label: 'Default state',
         'label:zh': '默认状态',
         'label:ja': 'デフォルト状態',
         // 'label:ko': '기본 상태',
         // 'label:vi': '',
         // 'label:id': 'Status default',
         // 'label:es': 'Estado predeterminado',
         // 'label:pt': 'Estado padrão',
         // 'label:fr': 'État par défaut',
         // 'label:it': 'Stato predefinito',
         // 'label:tr': 'Varsayılan',
         // 'label:de': 'Standardzustand',
         'label:pl': 'Stan domyślny',
         // 'label:ua': 'Cтан за замовчуваням',
         options: [
            {
               label: 'play', value: true, selected: true,
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
               // 'label:ua': 'грати',
            },
            {
               label: 'stop', value: false,
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
               // 'label:ua': 'зупинити',
            },
         ],
      },
   }
});
