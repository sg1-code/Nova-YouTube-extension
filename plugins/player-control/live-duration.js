// for test
// https://www.youtube.com/watch?v=jfKfPfyJRdk

window.nova_plugins.push({
   id: 'player-live-duration',
   title: 'Show duration on live video',
   // 'title:zh': '显示直播视频的时长',
   // 'title:ja': 'ライブビデオの表示時間',
   // 'title:ko': '',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': '',
   // 'title:pt': 'Mostrar a duração da transmissão',
   // 'title:fr': '',
   // 'title:it': '',
   // 'title:tr': '',
   // 'title:de': 'Dauer im Live-Video anzeigen',
   'title:pl': 'Pokaż czas trwania wideo na żywo',
   // 'title:ua': 'Показувати тривалість трансляції',
   run_on_pages: 'watch, embed, -mobile',
   section: 'player-control',
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/453367-youtube-live-clock
      // alt2 - https://greasyfork.org/en/scripts/470937-youtube-live-datetime-tooltip
      // alt3 - https://chromewebstore.google.com/detail/cnllmiliafeacdmlngaofjpjaljoolpc

      // new Date(document.head.querySelector('meta[itemprop="startDate"][content]')?.content);
      // new Date(document.head.querySelector('meta[itemprop="endDate"][content]')?.content);

      // Solution 1. UnHide default
      NOVA.waitSelector('#movie_player video')
         .then(video => {
            video.addEventListener('canplay', () => {
               if (movie_player.getVideoData().isLive
                  && (el = document.body.querySelector('#movie_player .ytp-chrome-controls .ytp-live .ytp-time-current'))
               ) {
                  el.style.cssText = 'display: block !important; margin-right: 5px;';
               }

               // meta[itemprop="isLiveBroadcast"][content="True"]
               // if (// movie_player.getVideoData().isLive  // Doesn't work if the video is not running
               //    movie_player.getPlayerResponse()?.videoDetails?.isLiveContent
               // ) {
               //    NOVA.waitSelector('#movie_player .ytp-chrome-controls .ytp-live .ytp-time-current', { destroy_after_page_leaving: true })
               //       .then(el => {
               //          el.style.cssText = 'display: block !important; margin-right: 5px;';
               //       });
               // }
            });

            // fix container
            NOVA.css.push(
               `#movie_player .ytp-chrome-controls .ytp-time-display.ytp-live {
                  display: flex !important;
               }`);
         });

      // Solution 2. if ".ytp-time-current" don't update
      // const SELECTOR_ID = 'nova-player-live-duration';

      // NOVA.waitSelector('#movie_player .ytp-chrome-controls .ytp-live')
      //    .then(container => {
      //       NOVA.waitSelector('#movie_player video')
      //          .then(video => {
      //             // video.addEventListener('loadeddata', resetBar);

      //             video.addEventListener('timeupdate', function () {
      //                if (document.visibilityState == 'hidden' || !movie_player.getVideoData().isLive && movie_player.classList.contains('ytp-autohide')) return;

      //                insertToHTML({
      //                   // movie_player.getCurrentTime() == '#ytd-player .ytp-chrome-bottom  .ytp-time-current'
      //                   'text': NOVA.formatTime.HMS.abbr(movie_player.getCurrentTime()),
      //                   'container': container,
      //                });
      //             });
      //          });
      //    });

      // function insertToHTML({ text = '', container = required() }) {
      //    // console.debug('insertToHTML', ...arguments);
      //    if (!(container instanceof HTMLElement)) {
      //       console.error('Container is not an HTMLElement:', container);
      //       return;
      //    }

      //    (document.getElementById(SELECTOR_ID) || (function () {
      //       const el = document.createElement('span');
      //       el.id = SELECTOR_ID;
      //       // el.className = '';
      //       // el.style.cssText = '';
      //       container.after(el);
      //       // container.insertAdjacentElement('afterend', el);
      //       return el;
      //       // container.insertAdjacentHTML('afterend', NOVA.createSafeHTML(
      //       //    `<span id="${SELECTOR_ID}" class="" style="">${text}</span>`));
      //       // return document.getElementById(SELECTOR_ID);
      //    })())
      //       .textContent = text;
      // }

   },
});
