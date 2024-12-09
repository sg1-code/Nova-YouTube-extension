window.nova_plugins.push({
   id: 'player-control-below',
   title: 'Control panel below the player',
   // 'title:zh': '控制面板位于播放器下方',
   // 'title:ja': 'プレーヤーの下にあるコントロールパネル',
   // 'title:ko': '',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': '',
   // 'title:pt': 'Painel de controle abaixo do player',
   // 'title:fr': 'Panneau de commande sous le lecteur',
   // 'title:it': '',
   // 'title:tr': '',
   // 'title:de': 'Bedienfeld unterhalb des Players',
   'title:pl': 'Panel sterowania pod odtwarzaczem',
   // 'title:ua': 'Панель керування під плеєром',
   run_on_pages: 'watch, -mobile',
   section: 'player-control',
   // desc: 'Move player controls down',
   // 'desc:zh': '',
   // 'desc:ja': '',
   // 'desc:ko': '',
   // 'desc:vi': '',
   // 'desc:id': '',
   // 'desc:es': '',
   // 'desc:pt': '',
   // 'desc:fr': '',
   // 'desc:it': '',
   // 'desc:tr': '',
   // 'desc:de': '',
   // 'desc:pl': '',
   // 'desc:ua': 'Перемістити елементи керування плеєром до низу',
   _runtime: user_settings => {

      // alt1 - https://chromewebstore.google.com/detail/chpodcedholiggcllnmmjlnghllddgmj
      // alt2 - https://greasyfork.org/en/scripts/469704-youtube-player-controls-below-video
      // alt3 - https://greasyfork.org/en/scripts/976-youtube-right-side-description
      // alt4 - https://greasyfork.org/en/scripts/474286-always-show-the-control-bar-below-the-video
      // alt5 - https://chromewebstore.google.com/detail/gmlbhbdkhnfhhmhdjopdbcfliajcafde

      // if (['cinema', 'force'].includes(user_settings.player_full_viewport_mode)) return; // conflict with plugin [theater-mode]
      // if (user_settings['player-float-progress-bar']) return; // conflict with plugin [player-float-progress-bar]

      NOVA.waitSelector('.ytp-chrome-bottom')
         .then(async control_panel => {

            // const { height } = window.getComputedStyle(control_panel); // can't rename a variable
            if ((heightPanel = NOVA.css.get(control_panel, 'height'))
               && (heightProgressBar = NOVA.css.get('.ytp-progress-bar-container', 'height'))
            ) {
               const height = `calc(${heightPanel} + ${heightProgressBar})` || '51px';
               let SELECTOR_CONTAINER = '.ytd-page-manager[video-id]:not([fullscreen])';

               // fix for [theater-mode] plugin
               // if (user_settings.player_full_viewport_mode) {
               //    const CLASS_OVER_PAUSED = 'nova-player-fullviewport';
               //    SELECTOR_CONTAINER += ` #movie_player:not(${CLASS_OVER_PAUSED})`;
               // }

               // fix conflict with plugin [theater-mode]
               if (['force', 'offset'].includes(user_settings.player_full_viewport_mode)) {
                  SELECTOR_CONTAINER += `:not([theater])`;
               }

               NOVA.css.push(
                  `/* fix captions */
                  ${SELECTOR_CONTAINER} .caption-window {
                     margin-bottom: 0;
                  }

                  /* convert control-gradient to background control */
                  ${SELECTOR_CONTAINER} .ytp-gradient-bottom {
                     transform: translateY(${height});
                     display: block !important;
                     opacity: 1 !important;
                     height: ${height} !important;
                     padding: 0;
                     background-color: #0f0f0f; /*--yt-spec-text-primary-inverse*/
                  }

                  /* control move below */
                  ${SELECTOR_CONTAINER} .ytp-chrome-bottom {
                     transform: translateY(${height});
                     opacity: 1 !important;
                  }

                  /* fix control (overflow-x) */
                  ${SELECTOR_CONTAINER} #movie_player {
                     overflow: visible;
                  }

                  /* fix channel avatar */
                  ${SELECTOR_CONTAINER} .ytp-player-content.ytp-iv-player-content {
                     bottom: ${NOVA.css.get('.ytp-player-content.ytp-iv-player-content', 'left') || '12px'};
                  }

                  /* fix control tooltip */
                  ${SELECTOR_CONTAINER} .ytp-tooltip,
                  ${SELECTOR_CONTAINER} .ytp-settings-menu {
                     transform: translateY(${height});
                  }

                  /* fix control collider (buttons, progress-bar), description, sidebar */
                  /*${SELECTOR_CONTAINER} #below #actions tp-yt-paper-tooltip, */
                  ${SELECTOR_CONTAINER}[theater] > #columns,
                  ${SELECTOR_CONTAINER}:not([theater]) #below {
                     margin-top: ${height} !important;
                  }

                  /* fix for rounded player (without login) */
                  #ytd-player {
                     overflow: visible !important;
                  }
                  /*#movie_player {
                     background-color: #0f0f0f;
                  }*/

                  /* fix the video moved outside the player when playback unstarted/ended */
                  /*${SELECTOR_CONTAINER} .unstarted-mode video,
                  ${SELECTOR_CONTAINER} .ended-mode video {
                     visibility: hidden;
                  }*/`);

               //  patch for [player-float-progress-bar] plugin
               if (user_settings['player-float-progress-bar']) {
                  NOVA.css.push(
                     `#movie_player.ytp-autohide .ytp-chrome-bottom .ytp-progress-bar-container {
                        display: none !important;
                     }`);
               }
               fixControlFreeze();
            }
         });

      function fixControlFreeze(ms = 2000) { // copy of the function in plugin [player-control-autohide]
         if (user_settings.player_hide_elements?.includes('time_display')
            || (user_settings['theater-mode'] && ['force', 'offset'].includes(user_settings.player_full_viewport_mode))
         ) {
            return;
         }
         setInterval(() => {
            if (user_settings['theater-mode']
               // && ['smart'].includes(user_settings.player_full_viewport_mode)
               && user_settings.player_full_viewport_mode == 'smart'
               && NOVA.css.get(movie_player, 'z-index') != '2020'
               && NOVA.css.get(movie_player, 'position') != 'fixed'
            ) {
               return;
            }

            if (NOVA.currentPage == 'watch'
               && document.visibilityState == 'visible'
               && movie_player.classList.contains('playing-mode')
               && !document.fullscreenElement // this.hasAttribute('fullscreen')
            ) {
               // console.debug('wakeUpControls');
               // movie_player.dispatchEvent(new Event('mousemove'));
               movie_player.wakeUpControls();
            }
         }, ms);
      }

   },
});
