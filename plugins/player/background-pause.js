// http://babruisk.com/ - test embed page

window.nova_plugins.push({
   id: 'pause-background-tab',
   // title: 'Autopause when switching tabs',
   title: 'Pauses playing videos in other tabs',
   // title: 'Autopause all background tabs except the active one',
   // title: 'Only one player instance playing',
   // 'title:zh': '自动暂停除活动选项卡以外的所有选项卡',
   // 'title:ja': 'アクティブなタブを除くすべてのタブを自動一時停止',
   // 'title:ko': '활성 탭을 제외한 모든 탭 자동 일시 중지',
   // 'title:vi': '',
   // 'title:id': 'Jeda otomatis semua tab latar belakang kecuali yang aktif',
   // 'title:es': 'Pausar automáticamente todas las pestañas excepto la activa',
   // 'title:pt': 'Pausar automaticamente todas as guias, exceto a ativa',
   // 'title:fr': "Interrompt la lecture des vidéos dans d'autres onglets",
   // 'title:it': 'Metti automaticamente in pausa tutte le schede in background tranne quella attiva',
   // 'title:tr': 'Etkin olan dışındaki tüm sekmeleri otomatik duraklat',
   // 'title:de': 'Alle Tabs außer dem aktiven automatisch pausieren',
   // 'title:pl': 'Zatrzymanie kart w tle oprócz aktywnej',
   // 'title:ua': 'Автопауза усіх фонових вкладок окрім активної',
   run_on_pages: 'watch, embed',
   section: 'player',
   desc: 'Autopause all background tabs except the active one',
   // desc: 'Supports iframes and other windows',
   // 'desc:zh': '支持 iframe 和其他窗口',
   // 'desc:ja': 'iframeやその他のウィンドウをサポート',
   // 'desc:ko': 'iframe 및 기타 창 지원',
   // 'desc:vi': '',
   // 'desc:id': 'Mendukung iframe dan jendela lainnya',
   // 'desc:es': 'Soporta iframes y otras ventanas',
   // 'desc:pt': 'Suporta iframes e outras janelas',
   // 'desc:fr': 'Prend en charge les iframes et autres fenêtres',
   // 'desc:it': 'Supporta iframe e altre finestre',
   // // 'desc:tr': "iframe'leri ve diğer pencereleri destekler",
   // 'desc:de': 'Unterstützt iframes und andere Fenster',
   // 'desc:pl': 'Obsługa ramek iframe i innych okien',
   // 'desc:ua': 'Автоматично призупинити всі фонові вкладки, крім активної. Підтримує iframe та інші вікна',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/444330-youtube-autoplay-mutex
      // alt2 - https://greasyfork.org/en/scripts/463632-youtube-pause-background-videos
      // alt3 - https://greasyfork.org/en/scripts/30344-pause-mute-html5-audio-video-on-leaving-tab

      // redirect for localStorage common storage space.
      if (location.hostname.includes('youtube-nocookie.com')) {
         // Warning broken the reddit.com (ex - https://www.reddit.com/r/gaming/comments/1gevihy/xenoblade_chronicles_x_definitive_edition_coming/)
         // location.hostname = 'youtube.com';
         return;
      }

      // fix - Failed to read the 'localStorage' property from 'Window': Access is denied for this document.
      if (!window?.localStorage) return;

      const
         storeName = 'nova-playing-instanceIDTab',
         // instanceID = crypto.randomUUID(), // 91.07 % slower. Generate a random script instance ID
         instanceID = String(Math.random()), // Generate a random script instance ID
         removeStorage = () => localStorage.removeItem(storeName);

      // Solution 1. Working but dangerous method. Significant delay
      // // HTMLMediaElement.prototype.play = function (c) {
      // HTMLVideoElement.prototype.play = function (c) {
      //    return function () {
      //       if (localStorage.hasOwnProperty(storeName) && localStorage.getItem(storeName) !== instanceID) {
      //          console.debug('instanceID:', instanceID);
      //          this.pause();
      //       }
      //       else {
      //          const continuePlayingFn = c.apply(this, arguments);
      //          localStorage.setItem(storeName, instanceID, NOVA.queryURL.get('v') || movie_player.getVideoData().video_id);
      //          return continuePlayingFn;
      //       }
      //    }
      // }(HTMLVideoElement.prototype.play);

      // Solution 2. Working but dangerous method. Significant delay
      // https://stackoverflow.com/questions/6877403/how-to-tell-if-a-video-element-is-currently-playing
      // Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
      //    get: function () {
      //       return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
      //    }
      // })
      // checks if element is playing right now
      // if (NOVA.videoElement?.playing) {
      //    // Do anything you want to
      // }

      NOVA.waitSelector('video')
         .then(video => {
            // Solution 3. on start playing
            video.addEventListener('playing', () => {
               // Pause this if another tab is playing
               if (localStorage.hasOwnProperty(storeName) && localStorage.getItem(storeName) !== instanceID // other tab active
                  && !document.pictureInPictureElement
                  && !user_settings.pause_background_tab_autoplay_onfocus
               ) {
                  // console.debug('video pause', localStorage[storeName]);
                  video.pause();
               }
               else {
                  localStorage.setItem(storeName, instanceID); // Mark this tab as active playing
               }
            });

            // Remove mark if the video stops playing
            ['pause', /*'suspend',*/ 'ended'].forEach(evt => video.addEventListener(evt, removeStorage)); // BUG - "suspend" in Google Drive

            // Remove mark if tab is closed
            window.addEventListener('beforeunload', removeStorage);

            // Pause when the tab loses focus
            window.addEventListener('storage', store => {
               if ((!document.hasFocus() || NOVA.currentPage == 'embed') // Tab unfocused
                  && store.key === storeName && store.storageArea === localStorage // Check if storage event is intended for this key and area
                  && localStorage.hasOwnProperty(storeName) && localStorage.getItem(storeName) !== instanceID // Other tab active
                  && 'PLAYING' == NOVA.getPlayerState.playback()
                  && !document.pictureInPictureElement
               ) {
                  // console.debug('video pause', localStorage[storeName]);
                  video.pause();
               }
            });

            // autoplay on tab focused
            if (user_settings.pause_background_tab_autoplay_onfocus) {
               window.addEventListener('focus', () => {
                  if (['UNSTARTED', 'PAUSED'].includes(NOVA.getPlayerState.playback()) // Ensure the video is not playing or paused
                     // && video.paused  // Ensure the video is not ended
                  ) {
                     // console.debug('focus', 'hidden:', document.hidden, 'visibilityState:', document.visibilityState, 'hasFocus:', document.hasFocus());
                     // console.debug('play video on tab focus');
                     video.play();

                     // Fix for "video.addEventListener('playing')"
                     if (user_settings.pause_background_tab_autoplay_onfocus === true) {
                        user_settings.pause_background_tab_autoplay_onfocus = false;
                     }
                  }
               }, { capture: true, once: user_settings.pause_background_tab_autoplay_onfocus === true });
            }

            // pause on tab unfocused
            // document.visibilityState update afterwindow.blur event (https://github.com/raingart/Nova-YouTube-extension/issues/100)
            switch (user_settings.pause_background_tab_autopause_unfocus) {
               case 'focus':
                  window.addEventListener('blur', () => {
                     if ('PLAYING' == NOVA.getPlayerState.playback()
                        && !document.pictureInPictureElement
                     ) {
                        // console.debug('blur', 'hidden:', document.hidden, 'visibilityState:', document.visibilityState, 'hasFocus:', document.hasFocus());
                        // console.debug('pause video on tab lost focus');
                        video.pause();
                     }
                  });
                  break;

               case 'visibility':
                  document.addEventListener('visibilitychange', () => {
                     // document.hidden
                     switch (document.visibilityState) {
                        case 'hidden':
                           video.pause();
                           break;
                        // case 'visible':
                        //    if (user_settings.pause_background_tab_autoplay_onfocus == 'force') {
                        //       video.play();
                        //    }
                        //    break;
                     }
                  });
                  break;
            }

         });

      // Solution 4. YouTube API
      // replaced with generic HTML5 method
      // const onPlayerStateChange = state => ('PLAYING' == NOVA.getPlayerState.playback(state)) ? localStorage.setItem(storeName, instanceID) : removeStorage();

      // NOVA.waitSelector('#movie_player')
      //    .then(movie_player => {
      //       movie_player.addEventListener('onStateChange', onPlayerStateChange);

      //       // remove storage if this tab closed
      //       window.addEventListener('beforeunload', removeStorage);

      //       window.addEventListener('storage', store => {
      //          if (
      //             // checking the right item
      //             store.key === storeName && store.storageArea === localStorage
      //             // has storage
      //             && localStorage[storeName] && localStorage[storeName] !== instanceID
      //             // this player is playing
      //             && 'PLAYING' == NOVA.getPlayerState.playback()
      //          ) {
      //             console.debug('pause player', localStorage[storeName]);
      //             movie_player.pauseVideo();
      //          }
      //       });

      //    });

   },
   options: {
      pause_background_tab_autoplay_onfocus: {
         _tagName: 'select',
         label: 'Autoplay on tab focus',
         // 'label:zh': '在标签焦点上自动播放',
         // 'label:ja': 'タブフォーカスでの自動再生',
         // 'label:ko': '탭 포커스에서 자동 재생',
         // 'label:vi': '',
         // 'label:id': 'Putar otomatis pada fokus tab',
         // 'label:es': 'Reproducción automática en el enfoque de la pestaña',
         // 'label:pt': 'Reprodução automática no foco da guia',
         // 'label:fr': "Lecture automatique sur le focus de l'onglet",
         // 'label:it': 'Riproduzione automatica su tab focus',
         // 'label:tr': 'Sekme odağında otomatik oynatma',
         // 'label:de': 'Autoplay bei Tab-Fokus',
         'label:pl': 'Autoodtwarzanie po wybraniu karty',
         // 'label:ua': 'Автовідтворення при виборі вкладки',
         options: [
            {
               label: 'none', /* value: false, */ selected: true, // fill value if no "selected" mark another option
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
               label: 'once', value: true,
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
               label: 'always', value: 'force',
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
      },
      pause_background_tab_autopause_unfocus: {
         _tagName: 'select',
         label: 'Autopause if tab loses on',
         // 'label:zh': '如果选项卡失去焦点，则自动暂停视频',
         // 'label:ja': 'タブがフォーカスを失った場合にビデオを自動一時停止',
         // 'label:ko': '탭이 초점을 잃으면 비디오 자동 일시 중지',
         // 'label:vi': '',
         // 'label:id': 'Jeda otomatis video jika tab kehilangan fokus',
         // 'label:es': 'Pausa automática del video si la pestaña pierde el foco',
         // 'label:pt': 'Pausar automaticamente o vídeo se a guia perder o foco',
         // 'label:fr': "Pause automatique de la vidéo si l'onglet perd le focus",
         // 'label:it': 'Metti automaticamente in pausa il video se la scheda perde la messa a fuoco',
         // 'label:tr': 'Sekme odağı kaybederse videoyu otomatik duraklat',
         // 'label:de': 'Video automatisch pausieren, wenn der Tab den Fokus verliert',
         'label:pl': 'Automatycznie wstrzymaj wideo, jeśli karta straci ostrość',
         // 'label:ua': 'Автопауза при зміні вкладки',
         options: [
            {
               label: 'disable', /* value: false, */ selected: true, // fill value if no "selected" mark another option
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
               label: 'visibility', value: 'visibility',
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
               label: 'focus', value: 'focus',
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
      },
   }
});
