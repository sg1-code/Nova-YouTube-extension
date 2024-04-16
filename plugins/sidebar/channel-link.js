window.nova_plugins.push({
   id: 'sidebar-thumbs-channel-link-patch',
   title: 'Fix channel links in sidebar',
   'title:zh': '修复侧边栏中的频道链接',
   'title:ja': 'サイドバーのチャネルリンクを修正',
   // 'title:ko': '사이드바에서 채널 링크 수정',
   // 'title:vi': '',
   // 'title:id': 'Perbaiki tautan saluran di bilah sisi',
   // 'title:es': 'Arreglar enlaces de canales en la barra lateral',
   // 'title:pt': 'Corrigir links de canais na barra lateral',
   // 'title:fr': 'Correction des liens de chaîne dans la barre latérale',
   // 'title:it': 'Correggi i collegamenti ai canali nella barra laterale',
   // 'title:tr': 'Kenar çubuğunda kanal bağlantılarını düzeltin',
   // 'title:de': 'Korrigieren Sie die Kanallinks in der Seitenleiste',
   'title:pl': 'Napraw linki do kanałów na pasku bocznym',
   // 'title:ua': 'Виправити посилання на канали на бічній панелі',
   run_on_pages: 'watch, -mobile',
   section: 'sidebar',
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/376510-youtube-fix-channel-links-in-sidebar-recommendations/discussions/124290
      // alt2 - https://greasyfork.org/en/scripts/452335-enter-the-commenter-s-channel-by-youtube-chat

      document.addEventListener('click', evt => patchLink(evt), { capture: true });
      // mouse middle click
      document.addEventListener('auxclick', evt => evt.button === 1 && patchLink(evt), { capture: true });

      function patchLink(evt) {
         if (evt.isTrusted
            && NOVA.currentPage == 'watch'
            && evt.target.closest('#channel-name')
            && (link = evt.target.closest('a'))
         ) {
            // evt.preventDefault();
            // // evt.stopPropagation();
            // evt.stopImmediatePropagation();

            if ((data = evt.target.closest('ytd-compact-video-renderer, ytd-video-meta-block')?.data)
               && (res = NOVA.seachInObjectBy.key({
                  'obj': data,
                  'keys': 'navigationEndpoint',
                  'match_fn': val => {
                     // console.debug('match_fn:', val);
                     return val?.commandMetadata?.webCommandMetadata?.webPageType == 'WEB_PAGE_TYPE_CHANNEL';
                  },
               })?.data)
            ) {
               // console.debug('res:', res);
               const
                  urlOrigData = link.data,
                  urlOrig = link.href; // '/watch?v=' + link.data.watchEndpoint.videoId

               // patch
               link.data = res;
               link.href = link.data.commandMetadata.webCommandMetadata.url += (user_settings['channel-default-tab'] && user_settings.channel_default_tab) || '/videos';
               // link.data.commandMetadata.webCommandMetadata.url += (user_settings['channel-default-tab'] && user_settings.channel_default_tab) || '/videos';
               // link.href = link.data.commandMetadata.webCommandMetadata.url;

               // restore
               evt.target.addEventListener('mouseout', ({ target }) => {
                  link.data = urlOrigData;
                  link.href = urlOrig;
                  // console.debug('restore link:', link.data);
               }, { capture: true, once: true });

               // const url = res.commandMetadata.webCommandMetadata.url + '/videos';

               // // patch
               // link.href = url;
               // link.data.commandMetadata.webCommandMetadata.url = url;
               // link.data.commandMetadata.webCommandMetadata.webPageType = 'WEB_PAGE_TYPE_CHANNEL';
               // link.data.browseEndpoint = res.browseEndpoint;
               // link.data.browseEndpoint.params = encodeURIComponent(btoa(String.fromCharCode(0x12, 0x06) + 'videos'));
            }
         }
      }

   },
});
