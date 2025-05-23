// for  test
// https://www.youtube.com/embed/668nUCeBHyY?autoplay=1 - skip stoped embed

window.nova_plugins.push({
   // id: 'video-stop-preload',
   id: 'video-autostop',
   title: 'Stop video preload',
   // 'title:zh': '停止视频预加载',
   // 'title:ja': 'ビデオのプリロードを停止します',
   // 'title:ko': '비디오 미리 로드 중지',
   // 'title:vi': '',
   // 'title:id': 'Hentikan pramuat video',
   // 'title:es': 'Detener la precarga de video',
   // 'title:pt': 'Parar o pré-carregamento de vídeo',
   // 'title:fr': 'Arrêter le préchargement de la vidéo',
   // 'title:it': 'Interrompi il precaricamento del video',
   // 'title:tr': 'Video önyüklemesini durdur',
   // 'title:de': 'Beenden Sie das Vorladen des Videos',
   'title:pl': 'Zatrzymaj ładowanie wideo',
   // 'title:ua': 'Зупинити передзавантаження відео',
   run_on_pages: 'watch, embed',
   // restart_on_location_change: true,
   section: 'player',
   // desc: 'Prevent the player from buffering video before playing',
   desc: 'Prevent auto-buffering',
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
   // 'desc:ua': '',
   // 'plugins-conflict': 'video-autopause',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/448590-youtube-autoplay-disable
      // alt2 - https://chromewebstore.google.com/detail/afgfpcfjdgakemlmlgadojdfnejkpegd

      // if (user_settings['video-autopause']) return; // conflict with [video-autopause] plugin. This plugin has a higher priority. that's why it's disabled/commented

      // fix bug in google drive
      if (location.hostname.includes('youtube.googleapis.com')) return;

      // conflict with plugin [user_settings.player_buttons_custom_items?.indexOf('popup')], [embed-redirect-popup]
      if (NOVA.queryURL.has('popup')) return;

      if (user_settings.video_autostop_embed && NOVA.currentPage != 'embed'
         // pass to block if url has a comment link
         && (!user_settings.video_autostop_comment_link
            || (user_settings.video_autostop_comment_link && !NOVA.queryURL.has('lc')) //!location.search.includes('$lc=')
         )
      ) {
         return;
      }

      // skip stoped embed - https://www.youtube.com/embed/668nUCeBHyY?autoplay=1
      if (NOVA.currentPage == 'embed'
         && window.self !== window.top // is iframe
         && ['0', 'false'].includes(NOVA.queryURL.get('autoplay'))
      ) {
         return;
      }
      // works. But annoying iframe reload
      // else location.assign(NOVA.queryURL.set({ 'autoplay': false }));

      // Solution 1
      // NOVA.waitSelector('#movie_player')
      //    .then(movie_player => {
      //       // save backup
      //       const backupFn = HTMLVideoElement.prototype.play;
      //       // patch fn
      //       HTMLVideoElement.prototype.play = movie_player.stopVideo;
      //       // restore fn
      //       document.addEventListener('click', restoreFn);
      //       document.addEventListener('keyup', ({ code }) => (code == 'Space') && restoreFn());
      //       function restoreFn() {
      //          HTMLVideoElement.prototype.play = backupFn;
      //       }
      //    });

      if (user_settings.video_autostop_peview_thumbnail && NOVA.currentPage == 'watch') {
         NOVA.css.push(
            // `.ended-mode {
            // `.paused-mode:not(:hover) {
            `.unstarted-mode {
               background: url("https://i.ytimg.com/vi/${NOVA.queryURL.get('v')}/maxresdefault.jpg") center center / contain no-repeat content-box;
            }
            .unstarted-mode video { visibility: hidden; }`);
      }

      let disableStop;

      // Solution 2
      NOVA.waitSelector('#movie_player')
         .then(async movie_player => {
            // reset disableStop (before on page change)
            document.addEventListener('yt-navigate-start', () => disableStop = false);

            await NOVA.waitUntil(() => typeof movie_player === 'object' && typeof movie_player.stopVideo === 'function', 100); // fix specific error for firefox

            movie_player.stopVideo(); // init before update onStateChange
            movie_player.addEventListener('onStateChange', onPlayerStateChange.bind(this));

            addCancelEvents(movie_player);

            function onPlayerStateChange(state) {
               // video_autostop_comment_link has high priority
               if (!user_settings.video_autostop_comment_link
                  || (user_settings.video_autostop_comment_link && !NOVA.queryURL.has('lc'))
               ) {
                  // console.debug('onStateChange', NOVA.getPlayerState.playback(state), document.visibilityState);
                  if (user_settings.video_autostop_ignore_playlist && location.search.includes('list=')) return;
                  // if (user_settings.video_autostop_ignore_playlist && (NOVA.queryURL.has('list')/* || !movie_player?.getPlaylistId()*/)) return;
                  // // stop inactive tab
                  // if (user_settings.video_autostop_ignore_active_tab && document.visibilityState == 'visible') {
                  //    // console.debug('cancel stop in active tab');
                  //    return;
                  // }

                  if (user_settings.video_autostop_ignore_live && movie_player.getVideoData().isLive) return;
               }

               // -1: unstarted
               // 0: ended
               // 1: playing
               // 2: paused
               // 3: buffering
               // 5: cued
               // if (!disableStop && ['BUFFERING', 'PAUSED', 'PLAYING'].includes(NOVA.getPlayerState.playback(state))) {
               if (!disableStop && state > 0 && state < 5) {
                  movie_player.stopVideo();
               }
            }
         });

      function addCancelEvents(movie_player) {
         document.addEventListener('keyup', evt => {
            if (NOVA.currentPage != 'watch' && NOVA.currentPage != 'embed') return;
            if (NOVA.editableFocused(evt.target)) return;
            if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;

            switch (evt.code) {
               // Keyboard code - https://docs.microsoft.com/en-us/dotnet/api/android.views.keycode?view=xamarin-android-sdk-12
               case 'KeyK':
               case 'Space':
               case 'MediaPlay':
               case 'MediaPlayPause':
                  disableHoldStop();
                  break;
            }
         });

         // Media hotkeys support
         navigator.mediaSession.setActionHandler('play', disableHoldStop);

         // Click event listener to trigger autopause on trusted clicks within the player area
         document.addEventListener('click', evt => {
            if (evt.isTrusted
               // Solution 1 (Universal), click is inside the player
               && evt.target.closest('#movie_player') // movie_player.contains(document.activeElement)
               // Solution 2. Click from some elements
               // && ['button[class*="play-button"]',
               //    '.ytp-cued-thumbnail-overlay-image',
               //    '.ytp-player-content'
               // ].some(s => evt.srcElement.matches(s))
               && !disableStop
            ) {
               // fix. stop pause
               evt.preventDefault();
               // evt.stopPropagation();
               evt.stopImmediatePropagation();

               disableHoldStop();
            }
         }, { capture: true });

         function disableHoldStop() {
            if (!disableStop) {
               disableStop = true;
               movie_player.playVideo(); // dirty fix. onStateChange starts before click/keyup
            }
         }
      }

   },
   options: {
      video_autostop_embed: {
         _tagName: 'select',
         label: 'Apply to video type',
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
         // 'label:ua': 'Застосувати до відео',
         options: [
            {
               label: 'all', value: false, selected: true,
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
               // 'label:ua': 'всіх',
            },
            {
               label: 'embed', value: 'on',
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
               // 'label:ua': 'вбудованих',
            },
         ],
      },
      video_autostop_ignore_playlist: {
         _tagName: 'input',
         label: 'Ignore playlist',
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
         'data-dependent': { 'video_autostop_embed': false },
      },
      video_autostop_ignore_live: {
         _tagName: 'input',
         label: 'Ignore live',
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
         // 'label:ua': 'Ігнорувати живі трансляції',
         type: 'checkbox',
         // title: '',
         'data-dependent': { 'video_autostop_embed': false },
      },
      // video_autostop_embed: {
      //    _tagName: 'input',
      //    label: 'Only for embedded videos',
      //    'label:zh': '仅适用于嵌入式视频',
      //    'label:ja': '埋め込みビデオのみ',
      //    'label:ko': '삽입된 동영상에만 해당',
      //    'label:vi': '',
      //    'label:id': 'Hanya untuk video tersemat',
      //    'label:es': 'Solo para videos incrustados',
      //    // 'label:pt': 'Apenas para vídeos incorporados',
      //    // 'label:fr': 'Uniquement pour les vidéos intégrées',
      //    'label:it': 'Solo per i video incorporati',
      //    'label:tr': 'Yalnızca gömülü videolar için',
      //    // 'label:de': 'Nur für eingebettete Videos',
      //    'label:pl': 'Tylko dla osadzonych filmów',
      //    // 'label:ua': 'Тільки для вбудованих відео',
      //    type: 'checkbox',
      // },
      video_autostop_peview_thumbnail: {
         _tagName: 'input',
         label: 'Display preview thumbnail on video',
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
         title: 'Instead black-screen',
         // 'title:zh': '',
         // 'title:ja': '',
         // 'title:ko': '',
         // 'label:vi': '',
         // 'label:id': '',
         // 'title:es': '',
         // 'title:pt': '',
         // 'title:fr': '',
         // 'title:it': '',
         // 'title:tr': '',
         // 'title:de': '',
         // 'title:pl': '',
         // 'label:ua': '',
         'data-dependent': { 'video_autostop_embed': false },
         // 'data-dependent': { 'video_autostop_comment_link': false },
      },
      // video_autostop_ignore_active_tab: {
      //    _tagName: 'input',
      //    label: 'Only in inactive tab', // inactive - background
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
      //    title: 'Ignore active tab',
      //    // 'title:zh': '',
      //    // 'title:ja': '',
      //    // 'title:ko': '',
      //    // 'label:vi': '',
      //    // 'label:id': '',
      //    // 'title:es': '',
      //    // 'title:pt': '',
      //    // 'title:fr': '',
      //    // 'title:it': '',
      //    // 'title:tr': '',
      //    // 'title:de': '',
      //    // 'title:pl': '',
      //    // 'label:ua': '',
      // },
      video_autostop_comment_link: {
         _tagName: 'input',
         label: 'Apply if URL references a comment',
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
         title: 'Stop playback if you have opened the url with link to comment',
         // 'title:zh': '',
         // 'title:ja': '',
         // 'title:ko': '',
         // 'label:vi': '',
         // 'label:id': '',
         // 'title:es': '',
         // 'title:pt': '',
         // 'title:fr': '',
         // 'title:it': '',
         // 'title:tr': '',
         // 'title:de': '',
         // 'title:pl': '',
         // 'label:ua': '',
         // 'data-dependent': { 'video_autostop_embed': false && 'video_autostop_ignore_playlist': true && 'video_autostop_ignore_live': true },
      },
   }
});
