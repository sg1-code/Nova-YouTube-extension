// for test
// https://www.youtube.com/embed/u3JP5UzZbiI?enablejsapi=1&playerapiid=pljs_yt_YouTube10069&html5=1&start=0&disablekb=1&autohide=1&playsinline=1&iv_load_policy=3&controls=0&showinfo=0&modestbranding=1&rel=0&autoplay=0&loop=0&origin=https%3A%2F%2Fsmall-games.info&widgetid=1
// https://lsgamedev.itch.io/ouija-rumours
// https://www.youtube.com/embed/QQr3XlJQEgE - https://paymoneytomypain.com/
// https://galengames.itch.io/academy-carols
// https://www.youtube.com/embed/bA56gvFi878
// https://sonichits.com/video/Reanimedia/Koi_no_Mikuru_Densetsu?track=1

window.nova_plugins.push({
   // id: 'embed-redirect-watch',
   id: 'embed-popup',
   title: 'Open small embedded in Pop-ups',
   // 'title:zh': '将嵌入式视频重定向到弹出窗口',
   // 'title:ja': '埋め込まれたビデオをポップアップにリダイレクトします',
   // 'title:ko': '포함된 비디오를 팝업으로 리디렉션',
   // 'title:vi': '',
   // 'title:id': '포함된 비디오를 팝업으로 리디렉션',
   // 'title:es': 'Redirigir video incrustado a ventana emergente',
   // 'title:pt': 'Redirecionar vídeo incorporado para pop-up',
   // 'title:fr': 'Rediriger la vidéo intégrée vers une fenêtre contextuelle',
   // 'title:it': 'Reindirizza il video incorporato al popup',
   // 'title:tr': '',
   // 'title:de': 'Leiten Sie eingebettete Videos zum Popup um',
   'title:pl': 'Przekieruj osadzone wideo do wyskakującego okienka',
   // 'title:ua': 'Переспрямувати вбудоване відео у спливаюче вікно',
   run_on_pages: 'embed, -mobile',
   section: 'player',
   desc: 'if iframe width is less than 720p',
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
   'plugins-conflict': 'player-fullscreen-mode',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/466414-youtube-embed-to-watch-redirector
      // alt2 - https://greasyfork.org/en/scripts/467070-youtube-popup-window

      // Enable only in iframe
      if (window.top === window.self // is not iframe
         || location.hostname.includes('googleapis.com') // exclude Gdrive
         || NOVA.queryURL.has('popup') // self
      ) {
         return;
      }

      // Fix conflict with [theater-mode] plugin (some options)
      if (user_settings.player_full_viewport_mode == 'redirect_watch_to_embed') return;
      // Fix conflict with [player-fullscreen-mode] plugin
      if (user_settings['player-fullscreen-mode']) return;

      const minWidth = +user_settings.embed_popup_min_width || 720;
      const minHeight = 480;
      // Get iframe size
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      // Add emdeb popup only for small frame size
      if (windowWidth > minWidth && windowHeight > minHeight) return;

      NOVA.waitSelector('#movie_player video')
         .then(video => {
            // video.addEventListener('loadedmetadata', createPopup.bind(video), { capture: true, once: true });
            // video.addEventListener('loadeddata', createPopup.bind(video), { capture: true, once: true });
            video.addEventListener('playing', createPopup.bind(video), { capture: true, once: true });
            // document.addEventListener('playing', createPopup.bind(video), { capture: true, once: true });
         });

      function createPopup() {
         const videoWidth = this.videoWidth || NOVA.videoElement.videoWidth;
         const videoHeight = this.videoHeight || NOVA.videoElement.videoHeight;

         // Ensure the video dimensions are not too large relative to the window size
         if (videoWidth < windowWidth && videoHeight < windowHeight) return;

         // this == NOVA.videoElement
         const { width, height } = NOVA.aspectRatio.sizeToFit({
            'src_width': videoWidth,
            'src_height': videoHeight,
            'max_width': Math.min(screen.width, videoWidth),
            'max_height': Math.min(screen.height, videoHeight),
         });

         // Stop playing in parent tab
         movie_player.stopVideo();
         // location.assign(NOVA.queryURL.set({ 'autoplay': false }));

         // Determine the URL for the embed popup
         const embedUrl = new URL(
            document.head.querySelector('link[itemprop="embedUrl"][href]')?.href
            || (location.origin + '/embed/' + movie_player.getVideoData().video_id)
         );
         // list param ex.
         // https://www.youtube.com/embed/PBlOi5OVcKs?start=0&amp;playsinline=1&amp;controls=0&amp;fs=20&amp;disablekb=1&amp;rel=0&amp;origin=https%3A%2F%2Ftyping-tube.net&amp;enablejsapi=1&amp;widgetid=1

         // Set necessary parameters for the popup
         embedUrl.searchParams.set('autoplay', 1);
         embedUrl.searchParams.set('popup', true); // Mark for deactivate self (plugin)

         NOVA.openPopup({ 'url': embedUrl.href, 'width': width, 'height': height });
      }

   },
   options: {
      embed_popup_min_width: {
         _tagName: 'input',
         label: 'If the width iframe is smaller',
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
         type: 'number',
         title: 'in px',
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
         placeholder: '300-900',
         step: 5,
         min: 300,
         max: 900,
         value: 720,
      },
   }
});
