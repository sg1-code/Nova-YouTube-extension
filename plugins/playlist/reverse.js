// for test:
// https://www.youtube.com/watch?v=lt2otCCtDZA&list=OLAK5uy_kDx6ubTnuS4mYHCPyyX1NpXyCtoQN08M4&index=2

window.nova_plugins.push({
   id: 'playlist-reverse',
   // title: 'Enable reverse playlist control',
   title: 'Add playlist reverse order button',
   // 'title:zh': '添加按钮反向播放列表顺序',
   // 'title:ja': 'ボタンの逆プレイリストの順序を追加',
   // 'title:ko': '버튼 역 재생 목록 순서 추가',
   // 'title:vi': '',
   // 'title:id': 'Tambahkan tombol urutan terbalik daftar putar',
   // 'title:es': 'Agregar orden de lista de reproducción inverso',
   // 'title:pt': 'Adicionar ordem inversa da lista de reprodução',
   // 'title:fr': 'Ajouter un ordre de lecture inversé',
   // 'title:it': "Aggiungi il pulsante dell'ordine inverso della playlist",
   // 'title:tr': 'Ekle düğmesi ters çalma listesi sırası',
   // 'title:de': 'Umgekehrte Playlist-Reihenfolge hinzufügen',
   'title:pl': 'Dodaj przycisk odtwarzania w odwrotnej kolejności',
   // 'title:ua': 'Кнопка додавання списку відтворення у зворотному порядку',
   run_on_pages: 'watch, -mobile',
   // restart_on_location_change: true,
   section: 'playlist',
   // desc: '',
   _runtime: user_settings => {

      // alt - https://greasyfork.org/en/scripts/404986-play-youtube-playlist-in-reverse-order

      const
         SELECTOR_ID = 'nova-playlist-reverse-btn',
         SELECTOR = '#' + SELECTOR_ID, // for css
         CLASS_NAME_ACTIVE = 'nova-playlist-reverse-on';

      window.nova_playlistReversed; // global for other plugin [playlist-reverse]

      // init reverseBtn style
      NOVA.css.push(
         `${SELECTOR} {
            background: none;
            border: 0;
         }
         yt-icon-button {
            width: 40px;
            height: 40px;
            padding: 10px;
         }
         ${SELECTOR} svg {
            fill: white;
            fill: var(--yt-spec-text-secondary);
         }
         ${SELECTOR}:hover svg { fill: #66afe9; }

         ${SELECTOR}:active svg,
         ${SELECTOR}.${CLASS_NAME_ACTIVE} svg { fill: #2196f3; }`);

      if (user_settings.playlist_reverse_auto_enabled && !window.nova_playlistReversed) {
         window.nova_playlistReversed = true;
      }

      NOVA.runOnPageLoad(async () => {
         if (NOVA.currentPage == 'watch' && location.search.includes('list=')) {
            // if (!NOVA.queryURL.has('list')/* || !movie_player?.getPlaylistId()*/) return;
            reverseControl(); // set event

            // Solution 1 (Stupid hack)
            // await NOVA.waitUntil(() => !document.getElementById(SELECTOR_ID), 500); // Stupid hack await when yt remove this button
            // await NOVA.delay(1000);
            // insertButton();
            // Solution 2 (API)
            document.addEventListener('yt-page-data-updated', insertButton, { capture: true, once: true });
         }
      });

      function insertButton() {
         NOVA.waitSelector('.ytd-page-manager[video-id] #playlist #playlist-action-menu .top-level-buttons:not([hidden]), #secondary #playlist #playlist-action-menu #top-level-buttons-computed', { destroy_after_page_leaving: true })
            .then(el => createButton(el));

         async function createButton(container = required()) {
            if (!(container instanceof HTMLElement)) {
               console.error('Container is not an HTMLElement:', container);
               return;
            }
            await NOVA.delay(500);

            document.getElementById(SELECTOR_ID)?.remove(); // clear old

            const
               reverseBtn = document.createElement('div'),
               updateTitle = () => reverseBtn.title = `Reverse playlist order is ${window.nova_playlistReversed ? 'ON' : 'OFF'}`;

            if (window.nova_playlistReversed) reverseBtn.className = CLASS_NAME_ACTIVE;
            reverseBtn.id = SELECTOR_ID;
            updateTitle(); // refresh only after page transitionend
            // reverseBtn.innerHTML = NOVA.createSafeHTML(
            //    `<yt-icon-button>
            //       <svg viewBox="0 0 381.399 381.399" height="100%" width="100%">
            //          <g>
            //             <path d="M233.757,134.901l-63.649-25.147v266.551c0,2.816-2.286,5.094-5.104,5.094h-51.013c-2.82,0-5.099-2.277-5.099-5.094 V109.754l-63.658,25.147c-2.138,0.834-4.564,0.15-5.946-1.669c-1.389-1.839-1.379-4.36,0.028-6.187L135.452,1.991 C136.417,0.736,137.91,0,139.502,0c1.576,0,3.075,0.741,4.041,1.991l96.137,125.061c0.71,0.919,1.061,2.017,1.061,3.109 c0,1.063-0.346,2.158-1.035,3.078C238.333,135.052,235.891,135.735,233.757,134.901z M197.689,378.887h145.456v-33.62H197.689 V378.887z M197.689,314.444h145.456v-33.622H197.689V314.444z M197.689,218.251v33.619h145.456v-33.619H197.689z"/>
            //          </g>
            //       </svg>
            //    </yt-icon-button>`;
            // `<yt-icon-button>
            //    <svg class="pl-reverse" viewBox="0 0 16 20">
            //          <polygon points="7,8 3,8 3,14 0,14 5,20 10,14 7,14"></polygon>
            //          <polygon points="11,0 6,6 9,6 9,12 13,12 13,6 16,6"></polygon>
            //    </svg>
            // </yt-icon-button>`);
            // fix - This document requires 'TrustedHTML' assignment.
            reverseBtn.append((function createSvgIcon() {
               const iconBtn = document.createElement('yt-icon-button');

               const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
               svg.setAttribute('viewBox', '0 0 381.399 381.399');
               svg.setAttribute('height', '100%');
               svg.setAttribute('width', '100%');

               const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

               const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

               path.setAttribute('d', 'M233.757,134.901l-63.649-25.147v266.551c0,2.816-2.286,5.094-5.104,5.094h-51.013c-2.82,0-5.099-2.277-5.099-5.094 V109.754l-63.658,25.147c-2.138,0.834-4.564,0.15-5.946-1.669c-1.389-1.839-1.379-4.36,0.028-6.187L135.452,1.991 C136.417,0.736,137.91,0,139.502,0c1.576,0,3.075,0.741,4.041,1.991l96.137,125.061c0.71,0.919,1.061,2.017,1.061,3.109 c0,1.063-0.346,2.158-1.035,3.078C238.333,135.052,235.891,135.735,233.757,134.901z M197.689,378.887h145.456v-33.62H197.689 V378.887z M197.689,314.444h145.456v-33.622H197.689V314.444z M197.689,218.251v33.619h145.456v-33.619H197.689z');

               g.append(path);
               svg.append(g);
               iconBtn.append(svg);

               return iconBtn;
            })());

            reverseBtn.addEventListener('click', () => {
               reverseBtn.classList.toggle(CLASS_NAME_ACTIVE);
               window.nova_playlistReversed = !window.nova_playlistReversed;

               if (window.nova_playlistReversed) {
                  reverseControl();
                  // movie_player.updatePlaylist();
                  updateTitle(); // refresh before page transition
                  fixConflictPlugins();
               }
               else location.reload(); // disable reverse
            });
            container.append(reverseBtn);
         }
      }

      function fixConflictPlugins() {
         if (user_settings['playlist-duration']) {
            // button visibility state
            document.getElementById('nova-playlist-duration')
               // .remove();
               .textContent = '';
         }

         if (user_settings['playlist-toggle-autoplay'] && (autoplayBtn = document.getElementById('nova-playlist-autoplay-btn'))) {
            autoplayBtn.disabled = true; // disabled button
            autoplayBtn.title = 'out of reach';
         }
      }

      // Solution 1 (API)
      async function reverseControl() {
         if (!window.nova_playlistReversed) return;

         if ((ytdWatch = await NOVA.waitSelector('.ytd-page-manager[video-id]', { destroy_after_page_leaving: true }))
            && (data = await NOVA.waitUntil(() => ytdWatch.data?.contents?.twoColumnWatchNextResults, 100)) // 100ms
            && (playlist = data.playlist?.playlist)
            && (autoplay = data.autoplay?.autoplay)
         ) {
            // const { playlist, autoplay } = data;
            playlist.contents.reverse();

            playlist.currentIndex = (playlist.totalVideos - playlist.currentIndex) - 1;
            playlist.localCurrentIndex = (playlist.contents.length - playlist.localCurrentIndex) - 1;

            for (const i of autoplay.sets) {
               i.autoplayVideo = i.previousButtonVideo;
               i.previousButtonVideo = i.nextButtonVideo;
               i.nextButtonVideo = i.autoplayVideo;
            }

            if (ytdWatch.updatePageData_) ytdWatch.updatePageData_(data);
            else throw new Error('updatePageData_ is ' + updatePageData_);

            if ((manager = document.body.querySelector('yt-playlist-manager'))
               // && 'updatePlayerComponents_' in manager
               && (ytdPlayer = document.getElementById('ytd-player'))
               // && 'updatePlayerPlaylist_' in ytdPlayer
            ) {
               ytdPlayer.updatePlayerComponents(null, autoplay, null, playlist);
               manager.autoplayData = autoplay;
               manager.setPlaylistData(playlist);
               ytdPlayer.updatePlayerPlaylist_(playlist);
            }
         }

         scrollToElement(document.body.querySelector('#secondary #playlist-items[selected], ytm-playlist .item[selected=true]'));
      }

      // Solution 2 (HTML)
      // function reverseControl() {
      //    if (!window.nova_playlistReversed) return;

      //    // auto next click
      //    NOVA.videoElement?.addEventListener('ended', () => {
      //       window.nova_playlistReversed && movie_player.previousVideo();
      //    }, { capture: true, once: true });

      //    // update UI
      //    // Solution 1 (JS hack). Emulate scroll
      //    reverseElement(document.body.querySelector('#secondary #playlist #items.playlist-items, ytm-playlist lazy-list'));
      //    scrollToElement(document.body.querySelector('#secondary #playlist-items[selected], ytm-playlist .item[selected=true]'));
      //    // Solution 2 (CSS). Scroll doesn't work
      //    // NOVA.css.push(
      //    //    `#playlist #items.playlist-items {
      //    //       display: flex;
      //    //       flex-direction: column-reverse;
      //    //    }`);

      //    // updateNextButton();


      //    // function updateNextButton() {
      //    //    // if ((nextItem = document.body.querySelector('#secondary #playlist [selected] + * a'))
      //    //    //    && (nextURL = nextItem?.href)
      //    //    // ) {
      //    //    if (nextURL = document.body.querySelector('#secondary #playlist [selected] + * a')?.href) {
      //    //       if (next_button = document.body.querySelector('.ytp-next-button')) {
      //    //          next_button.href = nextURL;
      //    //          next_button.dataset.preview = '';
      //    //          next_button.dataset.tooltipText = '';
      //    //          // next_button.dataset.preview = nextItem.querySelector('img').src;
      //    //          // next_button.dataset.tooltipText = nextItem.querySelector('#video-title').textContent;
      //    //       }
      //    //       if (manager = document.body.querySelector('yt-playlist-manager')?.autoplayData.sets[0].nextButtonVideo) {
      //    //          manager.commandMetadata.webCommandMetadata.url = nextURL.replace(location.origin, '');
      //    //          manager.watchEndpoint.videoId = NOVA.queryURL.get('v', nextURL);
      //    //       }
      //    //    }
      //    // }

      //    function reverseElement(container = required()) {
      //       if (!(container instanceof HTMLElement)) return console.error('container not HTMLElement:', container);
      //       container.append(...Array.from(container.childNodes).reverse());
      //    }
      // }

      function scrollToElement(target_el = required()) {
         if (!(target_el instanceof HTMLElement)) return console.error('target_el not HTMLElement:', target_el);
         const container = target_el.parentElement;
         container.scrollTop = target_el.offsetTop - container.offsetTop;
      }

   },
   options: {
      playlist_reverse_auto_enabled: {
         _tagName: 'input',
         label: 'Default enabled state',
         // 'label:zh': '默认启用',
         // 'label:ja': 'デフォルトで有効になっています',
         // 'label:ko': '기본적으로 활성화됨',
         // 'label:vi': '',
         // 'label:id': '',
         // 'label:es': '',
         // 'label:pt': 'Ativado por padrão',
         // 'label:fr': 'Activé par défaut',
         // 'label:it': '',
         // 'label:tr': '',
         // 'label:de': 'Standardmäßig aktiviert',
         'label:pl': 'Domyślnie włączone',
         // 'label:ua': 'За замовчуванням увімкнено',
         type: 'checkbox',
         // title: '',
      },
   },
});
