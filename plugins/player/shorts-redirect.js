// for test
// https://www.youtube.com/shorts/5ndfxasp2r0

window.nova_plugins.push({
   id: 'shorts-redirect',
   // title: 'Redirect Shorts to regular (watch) URLs',
   title: 'UnShort video',
   // 'title:zh': '将 Shorts 重定向到常规（watch）URL',
   // 'title:ja': 'ショートパンツを通常の（watch）URLにリダイレクトする',
   // 'title:ko': 'Shorts를 일반(watch) URL로 리디렉션',
   // 'title:vi': '',
   // 'title:id': 'Redirect Shorts ke URL reguler (watch)',
   // 'title:es': 'Redirigir Shorts a URL normales (watch)',
   // 'title:pt': 'Redirecionar Shorts para URLs regulares (watch)',
   // 'title:fr': 'Rediriger les shorts vers des URL normales (watch)',
   // 'title:it': 'Reindirizza i cortometraggi a URL normali (watch).',
   // 'title:tr': "Shorts'ları normal (watch) URL'lerine yönlendirin",
   // 'title:de': 'Leiten Sie Shorts zu regulären (watch) URLs um',
   'title:pl': 'Przełączaj Shorts na zwykłe adresy URL',
   // 'title:ua': 'Перенаправляйте прев`ю на звичайні URL-адреси (для перегляду)',
   // run_on_pages: 'results, feed, channel, shorts',
   run_on_pages: 'shorts',
   restart_on_location_change: true,
   // section: 'other',
   section: 'player',
   desc: 'Redirect Shorts video to normal player',
   'desc:zh': '将 Shorts 视频重定向到普通播放器',
   'desc:ja': 'ショートパンツのビデオを通常のプレーヤーにリダイレクトする',
   // 'desc:ko': 'Shorts 비디오를 일반 플레이어로 리디렉션',
   // 'desc:vi': '',
   // 'desc:id': 'Redirect video Shorts ke pemutar normal',
   // 'desc:es': 'Redirigir el video de Shorts al reproductor normal',
   // 'desc:pt': 'Redirecionar o vídeo do Shorts para o player normal',
   // 'desc:fr': 'Rediriger la vidéo Short vers un lecteur normal',
   // 'desc:it': 'Reindirizza il video dei cortometraggi al lettore normale',
   // 'desc:tr': 'Shorts videosunu normal oynatıcıya yönlendir',
   // 'desc:de': 'Shorts-Video auf normalen Player umleiten',
   'desc:pl': 'Przełącza krótkie filmy do normalnego odtwarzacza',
   // 'desc:ua': 'Перенаправляйте прев`ю відео у звичайний відтворювач',
   _runtime: user_settings => {

      // Solution 1
      location.href = location.href.replace('shorts/', 'watch?v=');

      // Solution 2
      // document.addEventListener('click', evt => patchLink(evt), { capture: true });
      // // mouse middle click
      // document.addEventListener('auxclick', evt => evt.button === 1 && patchLink(evt), { capture: true });

      // function patchLink(evt) {
      //    switch (NOVA.currentPage) {
      //       case 'results':
      //       case 'feed':
      //       case 'channel':
      //       case 'shorts':
      //          if (evt.isTrusted
      //             // && (link = evt.target.closest('a[href*="/shorts/"]'))
      //             && (link = evt.target.closest('a'))
      //             && link.href.matches('/shorts/')
      //          ) {
      //             // evt.preventDefault();
      //             // // evt.stopPropagation();
      //             // evt.stopImmediatePropagation();

      //             link.href += linkQueryPatch; // fix href redirect to watch
      //             // link.href = link.href.replace('shorts/', 'watch?v=');
      //             break;
      //          }
      //    }
      // }

   },
});
