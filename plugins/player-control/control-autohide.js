window.nova_plugins.push({
   id: 'player-control-autohide',
   // title: 'Hide controls on player',
   // title: 'Hide player controls panel',
   title: 'Hide player control panel if not hovered',
   // 'title:zh': '播放器上的自动隐藏控件',
   // 'title:ja': 'プレーヤーのコントロールを自動非表示',
   // 'title:ko': '플레이어의 자동 숨기기 컨트롤',
   // 'title:vi': '',
   // 'title:id': 'Sembunyikan kontrol pada pemutar',
   // 'title:es': 'Ocultar automáticamente los controles en el reproductor',
   // 'title:pt': 'Auto-ocultar controles no player',
   // 'title:fr': 'Masque le panneau de contrôle du lecteur',
   // 'title:it': 'Nascondi i controlli sul giocatore',
   // 'title:tr': 'Oynatıcıdaki kontrolleri otomatik gizle',
   // 'title:de': 'Blendet das Player-Bedienfeld aus',
   'title:pl': 'Ukrywaj elementy w odtwarzaczu',
   // 'title:ua': 'Приховати панель керування у відтворювачі',
   run_on_pages: 'watch, embed, -mobile',
   section: 'player-control',
   desc: 'Hover controls to display it',
   'desc:zh': '将鼠标悬停在它上面以显示它',
   'desc:ja': 'カーソルを合わせると表示されます',
   // 'desc:ko': '그것을 표시하려면 그 위로 마우스를 가져갑니다',
   // 'desc:vi': '',
   // 'desc:id': 'Arahkan kontrol untuk menampilkannya',
   // 'desc:es': 'Coloca el cursor sobre él para mostrarlo',
   // 'desc:pt': 'Passe o mouse sobre ele para exibi-lo',
   // 'desc:fr': "Survolez-le pour l'afficher",
   // 'desc:it': 'Passa il mouse sui controlli per visualizzarlo',
   // 'desc:tr': 'Görüntülemek için üzerine gelin',
   // 'desc:de': 'Bewegen Sie den Mauszeiger darüber, um es anzuzeigen',
   'desc:pl': 'Najedź, aby wyświetlić',
   // 'desc:ua': 'Наведіть мишкою щоб показати',
   'plugins-conflict': 'player-control-below',
   _runtime: user_settings => {

      if (user_settings['player-control-below']) return; // conflict with [player-control-below] plugin

      // alt1 - https://greasyfork.org/en/scripts/435487-youtube-always-hoverable-progressbar
      // alt2 - https://greasyfork.org/en/scripts/446045-youtube-hide-controls-until-hover

      let selectorHover, selectorGradientHide;

      switch (user_settings.player_control_autohide_container) {
         case 'player':
            selectorHover = '.ytd-page-manager[video-id]:not([fullscreen]) #movie_player:hover .ytp-chrome-bottom';
            selectorGradientHide = '#movie_player:not(:hover) .ytp-gradient-bottom';

            // fixControlFreeze on hover
            // NOVA.waitSelector('#movie_player') // for some reason it doesn't work
            NOVA.waitSelector('#ytd-player')
               .then(movie_player => {
                  let waiting;
                  // movie_player.addEventListener('mouseenter', fixControlFreeze);
                  movie_player.addEventListener('mouseover', function () {
                     if (waiting) return;
                     waiting = true;
                     fixControlFreeze();
                  });
                  movie_player.addEventListener('mouseout', function () {
                     clearInterval(fixControlFreeze.intervalId);
                     waiting = false;
                  });
               });

            break;

         // case 'subtitle':
         //    if (user_settings['subtitle-style']
         //       && user_settings.subtitle_fixed
         //       && document.body.querySelector('.caption-window')
         //    ) {
         //       return;
         //    }
         //    break;

         // case 'control':
         default:
            selectorHover = '.ytp-chrome-bottom:hover';
            selectorGradientHide = '#movie_player:not(.ytp-progress-bar-hover) .ytp-gradient-bottom';
            // selectorGradientHide = '#movie_player:has(.ytp-chrome-bottom:not(:hover)) .ytp-gradient-bottom';
            break;
      }
      // Do not forget check selector name in "player-float-progress-bar"
      NOVA.css.push(
         // `${selectorGradientHide}
         `.ytp-chrome-bottom {
            opacity: 0;
         }
         ${selectorHover} {
            opacity: 1;
         }`);

      // To above v105 https://developer.mozilla.org/en-US/docs/Web/CSS/:has
      NOVA.css.push(
         `${selectorGradientHide} {
            opacity: 0;
         }`);

      if (user_settings.player_control_autohide_show_on_seek) {
         // NOVA.waitSelector('#movie_player video')
         //    .then(video => {
         let timeoutId;

         // video.addEventListener('seeked', () => {
         document.addEventListener('seeked', ({ target }) => {
            if (NOVA.currentPage != 'watch' && NOVA.currentPage != 'embed') return;

            if (el = document.body.querySelector('#movie_player .ytp-chrome-bottom')) {
               clearTimeout(timeoutId);
               el.style.opacity = 1;
               timeoutId = setTimeout(() => el.style.removeProperty('opacity'), 1500); // 1.5s
               // el.removeAttribute('hidden');
               // timeoutId = setTimeout(() => el.setAttribute('hidden', true), 1500); // 1.5s
            }
         });
         // });
      }

      // moveMousePeriodic
      function fixControlFreeze(ms = 2000) { // copy of the function in plugin [player-control-below]
         // console.debug('fixControlFreeze', ms);
         // reset timeout
         if (typeof fixControlFreeze.intervalId === 'number') clearTimeout(fixControlFreeze.intervalId);
         fixControlFreeze.intervalId = setInterval(() => {
            if (NOVA.currentPage != 'watch' && NOVA.currentPage != 'embed') return;

            if (document.visibilityState == 'visible'
               && movie_player.classList.contains('playing-mode')
               && !document.fullscreenElement // Doesn't work in fullscreen mode
            ) {
               // console.debug('wakeUpControls');
               // movie_player.dispatchEvent(new Event('mousemove'));
               movie_player.wakeUpControls();
            }
         }, ms);
      }

   },
   options: {
      player_control_autohide_container: {
         _tagName: 'select',
         label: 'Hover container',
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
         // 'label:ua': 'Відображати вміст при наведенні',
         options: [
            {
               label: 'player', value: 'player', selected: true,
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
               // 'label:ua': 'програвач',
            },
            {
               label: 'control', value: 'control',
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
               // 'label:ua': 'панель керування',
            },
            // {
            //    label: 'on subtitle', value: 'subtitle',
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
            //    title: 'if enable "Fixed from below"',
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
            // },
         ],
      },
      player_control_autohide_show_on_seek: {
         _tagName: 'input',
         label: 'Show on seeked',
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
