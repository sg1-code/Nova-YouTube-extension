// for test:
// https://www.youtube.com/watch?v=d94PwdKQ3Ag
// https://www.youtube.com/watch?v=twFNTZ6Y_OI - wide
// https://www.youtube.com/watch?v=WbrSLLv0AlA - wide
// https://www.youtube.com/watch?v=lxyBamfovIs - ultra-wide
// https://www.youtube.com/watch?v=Z_ZkUROJ86Y - ultra-wide
// https://www.youtube.com/watch?v=nX2anEXG0eE - square
// https://www.youtube.com/watch?v=SDjbK8JWA_Y - square
// https://www.youtube.com/watch?v=FGBhQbmPwH8 - square
// https://www.youtube.com/watch?v=nk43m_R9IVc - 21:9

window.nova_plugins.push({
   id: 'player-pin-scroll',
   title: 'Pin player while scrolling',
   // 'title:zh': '滚动时固定播放器',
   // 'title:ja': 'スクロール中にプレイヤーを固定する',
   // 'title:ko': '스크롤하는 동안 플레이어 고정',
   // 'title:vi': '',
   // 'title:id': 'Sematkan pemutar saat menggulir',
   // 'title:es': 'Fijar jugador mientras se desplaza',
   // 'title:pt': 'Fixar jogador enquanto rola',
   // 'title:fr': 'Épingler le lecteur pendant le défilement',
   // 'title:it': 'Blocca il lettore durante lo scorrimento',
   // 'title:tr': 'Kaydırırken oynatıcıyı sabitle',
   // 'title:de': 'Pin-Player beim Scrollen',
   'title:pl': 'Przypnij odtwarzacz podczas przewijania',
   // 'title:ua': 'Закріпити відтворювач коли гортаєш сторінку',
   run_on_pages: 'watch, -mobile',
   section: 'player',
   desc: 'Show mini player when scrolling down',
   // desc: 'Player stays always visible while scrolling',
   // 'desc:zh': '滚动时播放器始终可见',
   // 'desc:ja': 'スクロール中、プレーヤーは常に表示されたままになります',
   // 'desc:ko': '스크롤하는 동안 플레이어가 항상 표시됨',
   // 'desc:vi': '',
   // 'desc:id': '',
   // // 'desc:es': 'El jugador permanece siempre visible mientras se desplaza',
   // 'desc:pt': 'O jogador fica sempre visível enquanto rola',
   // // 'desc:fr': 'Le lecteur reste toujours visible pendant le défilement',
   // 'desc:it': '',
   // 'desc:tr': 'Kaydırma sırasında oyuncu her zaman görünür kalır',
   // 'desc:de': 'Player bleibt beim Scrollen immer sichtbar',
   // 'desc:ua': 'Відтворювач завжди залишається видимим коли гортаєш',
   // 'plugins-conflict': 'player-pip',
   _runtime: user_settings => {

      // alt1 - https://chromewebstore.google.com/detail/aeilijiaejfdnbagnpannhdoaljpkbhe
      // alt2 - https://chromewebstore.google.com/detail/mcodbccegmndmnbpbgkpdkoleoagjpgk
      // alt3 - https://greasyfork.org/en/scripts/444382-youtube-mini-player
      // alt4 - https://greasyfork.org/en/scripts/472053-video-popout-and-no-scroll-on-click-timestamps
      // alt5 - https://greasyfork.org/en/scripts/484817-youtube-video-auto-pop-out

      if (!('IntersectionObserver' in window)) return alert('Nova\n\nPin player Error!\nIntersectionObserver not supported.');

      const
         CLASS_VALUE = 'nova-player-pin',
         PINNED_SELECTOR = '.' + CLASS_VALUE, // for css
         UNPIN_BTN_CLASS_VALUE = CLASS_VALUE + '-unpin-btn',
         UNPIN_BTN_SELECTOR = '.' + UNPIN_BTN_CLASS_VALUE; // for css

      let makeDraggable;

      // toggle pin state
      document.addEventListener('scroll', () => { // fix bug when initial (document.documentElement.scrollHeight != window.innerHeight) and it's running IntersectionObserver
         // NOVA.waitSelector('#player-container')
         // NOVA.waitSelector('#player-wide-container')
         NOVA.waitSelector('#ytd-player')
            .then(container => {
               makeDraggable = new NOVA.Draggable();

               // movie_player / #ytd-player
               new IntersectionObserver(([entry]) => {
                  // no horizontal scroll in page
                  // if (document.documentElement.scrollHeight < window.innerHeight) return;
                  // console.debug('', document.documentElement.scrollHeight , window.innerHeight);
                  // leave viewport
                  if (entry.isIntersecting) {
                     movie_player.classList.remove(CLASS_VALUE);
                     makeDraggable.reset(); // reset current pos (old coordinates are saved)
                     makeDraggable.disable(); // prevent unintended use
                  }
                  // enter viewport.
                  // else if (!movie_player.isFullscreen() // fix bug on scroll in fullscreen player mode
                  else if (!document.fullscreenElement // fix bug on scroll in fullscreen player mode
                     && document.documentElement.scrollTop // fix bug on exit fullscreen mode (https://github.com/raingart/Nova-YouTube-extension/issues/69)
                  ) {
                     movie_player.classList.add(CLASS_VALUE);
                     // add drag
                     makeDraggable.init(movie_player);
                     // dragElement(player); // incorrect work
                     if (makeDraggable.dragging.final) makeDraggable.moveByCoordinates(makeDraggable.dragging.final); // restore pos
                  }

                  window.dispatchEvent(new Event('resize')); // fix: restore player size on pin/unpin
               }, {
                  // https://github.com/raingart/Nova-YouTube-extension/issues/28
                  // threshold: (+user_settings.player_float_scroll_sensivity_range / 100) || .5, // set offset 0.X means trigger if atleast X0% of element in viewport
                  threshold: .5, // set offset 0.X means trigger if atleast X0% of element in viewport
               })
                  .observe(container);
            });
      }, { capture: true, once: true });

      NOVA.waitSelector(PINNED_SELECTOR)
         .then(async player => {
            // wait video size
            await NOVA.waitUntil(
               // movie_player.clientWidth && movie_player.clientHeight
               () => (NOVA.videoElement?.videoWidth && !isNaN(NOVA.videoElement.videoWidth)
                  && NOVA.videoElement?.videoHeight && !isNaN(NOVA.videoElement.videoHeight)
               )
               // && document.getElementById('masthead-container')?.offsetHeight
               , 500); // 500ms

            initMiniStyles();

            // add unpin button
            insertUnpinButton(player);

            // if player fullscreen disable float mode
            document.addEventListener('fullscreenchange', () => {
               document.fullscreenElement && movie_player.classList.remove(CLASS_VALUE)
            });
            // .ytd-page-manager[video-id]:not([fullscreen])

            // resize on video change
            NOVA.waitSelector('#movie_player video')
               .then(video => {
                  video.addEventListener('loadeddata', () => {
                     if (NOVA.currentPage != 'watch') return; // skip channel trailer

                     NOVA.waitSelector(PINNED_SELECTOR, { destroy_after_page_leaving: true })
                        .then(() => {
                           const width = NOVA.aspectRatio.calculateWidth(
                              movie_player.clientHeight,
                              // chooseAspectRatio(NOVA.videoElement.videoWidth, NOVA.videoElement.videoHeight)
                              NOVA.aspectRatio.chooseAspectRatio({
                                 'width': NOVA.videoElement.videoWidth,
                                 'height': NOVA.videoElement.videoHeight,
                                 'layout': 'landscape',
                              }),
                           );
                           player.style.setProperty('--width', `${width}px !important;`);
                           // movie_player.style.cssText = `--width: ${width}px !important;`
                           // movie_player.style.cssText = `--width: ${width}px !important; --height: ${movie_player.clientHeight}px !important`
                        });
                  });
               });

            // save scroll code part
            if (user_settings.player_float_scroll_after_fullscreen_restore_srcoll_pos) {
               let scrollPos = 0;
               // clear scroll pos
               document.addEventListener('yt-navigate-start', () => scrollPos = 0);

               // restore scroll pos
               document.addEventListener('fullscreenchange', () => {
                  if (!document.fullscreenElement
                     && scrollPos // >0
                     && (makeDraggable.dragging.final !== 0 && makeDraggable.dragging.final !== 0) // not cleared yet
                  ) {
                     window.scrollTo({
                        top: scrollPos,
                        // left: window.pageXOffset,
                        // behavior: user_settings.scroll_to_top_smooth ? 'smooth' : 'instant',
                     });
                  }
               }, { capture: false });
               // save scroll pos
               // Solution 1
               document.addEventListener('fullscreenchange', () => {
                  if (document.fullscreenElement) {
                     scrollPos = document.documentElement.scrollTop;
                     // console.debug('scrollPos:', scrollPos, document.documentElement.scrollTop);
                  }
               }, { capture: true });
               // Solution 2
               // document.addEventListener('yt-action', evt => {
               //    // console.debug(evt.detail?.actionName);
               //    switch (evt.detail?.actionName) {
               //       // case 'yt-fullscreen-change-action': // to late
               //       // case 'yt-window-scrolled':
               //       case 'yt-close-all-popups-action':
               //          // console.debug(evt.detail?.actionName); // flltered

               //          scrollPos = document.documentElement.scrollTop;
               //          // console.debug('1', scrollPos, document.documentElement.scrollTop);
               //          break;
               //    }
               // });
            }
         });

      // function chooseAspectRatio(width, height) {
      //    const ratio = width / height;
      //    // return (Math.abs(ratio - 4 / 3) < Math.abs(ratio - 16 / 9)) ? '4:3' : '16:9';
      //    return (Math.abs(ratio - 1.33333) < Math.abs(ratio - 1.7778))
      //       ? 1.33333 : 1.7778;
      // }

      function initMiniStyles() {
         const scrollbarWidth = (window.innerWidth - document.documentElement.clientWidth || 0) + 'px';
         const miniSize = NOVA.aspectRatio.sizeToFit({
            // 'src_width': movie_player.clientWidth,
            // 'src_height': movie_player.clientHeight,
            'src_width': NOVA.videoElement.videoWidth,
            'src_height': NOVA.videoElement.videoHeight,
            'max_width': (window.innerWidth / user_settings.player_float_scroll_size_ratio),
            'max_height': (window.innerHeight / user_settings.player_float_scroll_size_ratio),
         });

         let initcss = {
            // width: miniSize.width + 'px',
            width: NOVA.aspectRatio.calculateWidth(
               miniSize.height,
               // chooseAspectRatio(miniSize.width, miniSize.height)
               NOVA.aspectRatio.chooseAspectRatio({ 'width': miniSize.width, 'height': miniSize.height })
            ) + 'px',
            // width: (movie_player.clientWidth / user_settings.player_float_scroll_size_ratio) + 'px',
            height: miniSize.height + 'px',
            position: 'fixed',
            'z-index': 'var(--zIndex)',
            'box-shadow': '0 16px 24px 2px rgba(0, 0, 0, .14),' +
               '0 6px 30px 5px rgba(0, 0, 0, .12),' +
               '0 8px 10px -5px rgba(0, 0, 0, .4)',
         };

         // set pin player position
         switch (user_settings.player_float_scroll_position) {
            // if enable header-unfixed plugin. masthead-container is unfixed
            case 'top-left':
               initcss.top = user_settings['header-unfixed'] ? 0
                  : (document.getElementById('masthead-container')?.offsetHeight || 0) + 'px';
               initcss.left = 0;
               break;
            case 'top-right':
               initcss.top = user_settings['header-unfixed'] ? 0
                  : (document.getElementById('masthead-container')?.offsetHeight || 0) + 'px';
               initcss.right = scrollbarWidth; // scroll right
               break;
            case 'bottom-left':
               initcss.bottom = 0;
               initcss.left = 0;
               break;
            case 'bottom-right':
               initcss.bottom = 0;
               initcss.right = scrollbarWidth; // scroll right
               break;
         }

         // apply css
         NOVA.css.push(initcss, PINNED_SELECTOR, 'important');

         // variable declaration for fix
         NOVA.css.push(
            /* default. fix conflict with https://github.com/elliotwaite/thumbnail-rating-bar-for-youtube */
            `html[style*="ytrb-bar"] ${PINNED_SELECTOR} {
               --zIndex: 1000;
            }
            ${PINNED_SELECTOR} {
               --height: ${initcss.height} !important;
               --width: ${initcss.width} !important;

               width: var(--width) !important;
               height: var(--height) !important;

               background-color: var(--yt-spec-base-background);
               ${user_settings['square-avatars'] ? '' : 'border-radius: 12px;'}
               margin: 1em 2em;
               --zIndex: ${1 + Math.max(
               NOVA.css.get('#chat', 'z-index'),
               NOVA.css.get('.ytp-chrome-top .ytp-cards-button', 'z-index'),
               NOVA.css.get('#chat', 'z-index'),
               NOVA.css.get('ytrb-bar', 'z-index'), // update. fix conflict with https://github.com/elliotwaite/thumbnail-rating-bar-for-youtube
               // NOVA.css.get('#description.ytd-watch-metadata', 'z-index'), // consider plugin [description-dropdown]
               601)};
            }
            ${PINNED_SELECTOR} video {
               object-fit: contain !important;
            }
            /* fix for [player-quick-buttons], [player-loop], [nova-player-time-remaining] plugins */
            ${PINNED_SELECTOR} .ytp-chrome-controls .nova-right-custom-button,
            ${PINNED_SELECTOR} .ytp-chrome-controls #nova-player-time-remaining,
            ${PINNED_SELECTOR} .ytp-chrome-controls button.ytp-size-button,
            ${PINNED_SELECTOR} .ytp-chrome-controls button.ytp-subtitles-button,
            ${PINNED_SELECTOR} .ytp-chrome-controls button.ytp-settings-button,
            ${PINNED_SELECTOR} .ytp-chrome-controls .ytp-chapter-container {
               display: none !important;
            }`);

         // fix control-player panel
         NOVA.css.push(
            `${PINNED_SELECTOR} .ytp-preview,
            ${PINNED_SELECTOR} .ytp-scrubber-container,
            ${PINNED_SELECTOR} .ytp-hover-progress,
            ${PINNED_SELECTOR} .ytp-gradient-bottom { display:none !important; }
            /* ${PINNED_SELECTOR} .ytp-chrome-bottom { width: var(--width) !important; } */
            ${PINNED_SELECTOR} .ytp-chrome-bottom { width: 96% !important; }
            ${PINNED_SELECTOR} .ytp-chapters-container { display: flex; }`);

         // fix video size in pinned
         NOVA.css.push(
            `${PINNED_SELECTOR} video {
               width: var(--width) !important;
               height: var(--height) !important;
               left: 0 !important;
               top: 0 !important;
            }
            ${PINNED_SELECTOR}.ended-mode video {
               visibility: hidden;
            }`);
      }

      function insertUnpinButton(player = movie_player) {
         NOVA.css.push(
            `${UNPIN_BTN_SELECTOR} { display: none; }

            ${PINNED_SELECTOR} ${UNPIN_BTN_SELECTOR} {
               display: inherit !important;
               position: absolute;
               cursor: pointer;
               top: 10px;
               left: 10px;
               width: 28px;
               height: 28px;
               color: white;
               border: none;
               outline: none;
               opacity: .1;
               ${user_settings['square-avatars'] ? '' : 'border-radius: 100%;'}
               z-index: var(--zIndex);
               font-size: 24px;
               font-weight: bold;
               background-color: rgba(0, 0, 0, .8);
               transition: opacity 100ms linear;
               /* text-transform: uppercase; */
            }

            ${PINNED_SELECTOR}:hover ${UNPIN_BTN_SELECTOR} { opacity: .7; }
            ${UNPIN_BTN_SELECTOR}:hover { opacity: 1 !important; }`);

         // add unpin button
         const btnUnpin = document.createElement('button');
         btnUnpin.className = UNPIN_BTN_CLASS_VALUE;
         btnUnpin.title = 'Unpin player';
         btnUnpin.textContent = '×'; // ✖
         btnUnpin.addEventListener('click', () => {
            player.classList.remove(CLASS_VALUE);
            makeDraggable.reset('clear_final');
            window.dispatchEvent(new Event('resize')); // fix: restore player size if unpinned
         });
         player.append(btnUnpin);

         // unpin before on page change
         document.addEventListener('yt-navigate-start', () => {
            if (player.classList.contains(CLASS_VALUE)) {
               player.classList.remove(CLASS_VALUE);
               makeDraggable.reset(); // save storePos state
               // makeDraggable.reset('clear_final'); // storePos
            }
         });

         // window.addEventListener('resize', updatePos);
      }

   },
   options: {
      // player_pin_mode: {
      //    _tagName: 'select',
      //    label: ' mode',
      //    label: 'Mode',
      //    'label:zh': '模式',
      //    'label:ja': 'モード',
      //    'label:ko': '방법',
      //    // 'label:vi': '',
      //    // 'label:id': 'Mode',
      //    'label:es': 'Modo',
      //    // 'label:pt': 'Modo',
      //    // 'label:fr': 'Mode',
      //    'label:it': 'Modalità',
      //    'label:tr': 'Mod',
      //    // 'label:de': 'Modus',
      //    'label:pl': 'Tryb',
      //    // title: '',
      //    options: [
      //       { label: 'picture-in-picture', value: 'pip', selected: true },
      //       { label: 'float', value: 'float' },
      //    ],
      // },
      player_float_scroll_size_ratio: {
         _tagName: 'input',
         label: 'Player size',
         // 'label:zh': '播放器尺寸',
         // 'label:ja': 'プレーヤーのサイズ',
         // 'label:ko': '플레이어 크기',
         // 'label:vi': '',
         // 'label:id': 'Ukuran pemain',
         // 'label:es': 'Tamaño del jugador',
         // 'label:pt': 'Tamanho do jogador',
         // 'label:fr': 'Taille du joueur',
         // 'label:it': 'Dimensioni del giocatore',
         // 'label:tr': 'Oyuncu boyutu',
         // 'label:de': 'Spielergröße',
         'label:pl': 'Rozmiar odtwarzacza',
         // 'label:ua': 'Розмір відтворювача',
         type: 'number',
         title: 'Less value - larger size',
         // 'title:zh': '较小的值 - 较大的尺寸',
         // 'title:ja': '小さい値-大きいサイズ',
         // 'title:ko': '더 작은 값 - 더 큰 크기',
         // 'title:vi': '',
         // 'title:id': 'Nilai lebih kecil - ukuran lebih besar',
         // 'title:es': 'Valor más pequeño - tamaño más grande',
         // 'title:pt': 'Valor menor - tamanho maior',
         // 'title:fr': 'Plus petite valeur - plus grande taille',
         // 'title:it': 'Meno valore - dimensioni maggiori',
         // 'title:tr': 'Daha az değer - daha büyük boyut',
         // 'title:de': 'Kleiner Wert - größere Größe',
         'title:pl': 'Mniejsza wartość - większy rozmiar',
         // 'title:ua': 'Менше значення - більший розмір',
         placeholder: '2-5',
         step: 0.1,
         min: 2,
         max: 5,
         value: 2.5,
         // 'data-dependent': { 'player_pin_mode': ['float'] },
      },
      player_float_scroll_position: {
         _tagName: 'select',
         // label: 'Player position in the corner',
         label: 'Player position',
         // 'label:zh': '球员位置',
         // 'label:ja': 'プレイヤーの位置',
         // 'label:ko': '선수 위치',
         // 'label:vi': '',
         // 'label:id': 'Posisi pemain',
         // 'label:es': 'Posición de jugador',
         // 'label:pt': 'Posição do jogador',
         // 'label:fr': 'La position du joueur',
         // 'label:it': 'Posizione del giocatore',
         // 'label:tr': 'Oyuncu pozisyonu',
         // 'label:de': 'Spielerposition',
         'label:pl': 'Pozycja odtwarzacza',
         // 'label:ua': 'Позиція відтворювача',
         options: [
            {
               // label: 'Top left', value: 'top-left',
               label: '↖', value: 'top-left',
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
               // label: 'Top right', value: 'top-right', selected: true,
               label: '↗', value: 'top-right', selected: true,
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
               // label: 'Bottom left', value: 'bottom-left',
               label: '↙', value: 'bottom-left',
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
               // label: 'Bottom right', value: 'bottom-right',
               label: '↘', value: 'bottom-right',
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
         ],
         // 'data-dependent': { 'player_pin_mode': ['float'] },
      },
      // player_float_scroll_sensivity_range: {
      //    _tagName: 'input',
      //    label: 'Player sensitivity visibility range',
      //    'label:zh': '播放器灵敏度可见范围',
      //    'label:ja': 'プレイヤーの感度の可視範囲',
      //    'label:ko': '플레이어 감도 가시 범위',
      //    'label:vi': '',
      //    'label:id': 'Rentang visibilitas sensitivitas pemain',
      //    'label:es': 'Rango de visibilidad de la sensibilidad del jugador',
      //    // 'label:pt': 'Faixa de visibilidade da sensibilidade do jogador',
      //    // 'label:fr': 'Plage de visibilité de la sensibilité du joueur',
      //    'label:it': 'Intervallo di visibilità della sensibilità del giocatore',
      //    'label:tr': 'Oyuncu duyarlılığı görünürlük aralığı',
      //    // 'label:de': 'Sichtbarkeitsbereich der Spielerempfindlichkeit',
      //    'label:pl': 'Pozycja odtwarzacza',
      //    // 'label:ua': 'Діапазон видимості чутливості відтворювача',
      //    type: 'number',
      //    title: 'in %',
      //    // 'title:zh': '',
      //    // 'title:ja': '',
      //    // 'title:ko': '',
      //    // 'title:vi': '',
      //    // 'title:id': '',
      //    // 'title:es': '',
      //    // 'title:pt': '',
      //    // 'title:fr': '',
      //    // 'title:it': '',
      //    // 'title:tr': '',
      //    // 'title:de': '',
      //    // 'title:pl': '',
      //    // 'title:ua': '',
      //    placeholder: '%',
      //    step: 10,
      //    min: 10,
      //    max: 100,
      //    value: 80,
      //    // 'data-dependent': { 'player_pin_mode': ['float'] },
      // },
      // 'player_float_scroll_pause_video': {
      //    _tagName: 'input',
      //    label: 'Pause pinned video',
      //    type: 'checkbox',
      // },
      player_float_scroll_after_fullscreen_restore_srcoll_pos: {
         _tagName: 'input',
         label: 'Restore scrolling back there after exiting fullscreen',
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
      },
   }
});
