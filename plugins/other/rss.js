// for test:
// https://www.youtube.com/@Azurestar/videos
// https://www.youtube.com/playlist?list=OLAK5uy_lGkKfcYvA7uehAIeQuLgXs6XotQkQeidA

window.nova_plugins.push({
   id: 'rss-link',
   title: 'Add RSS feed link',
   // 'title:zh': '添加 RSS 提要链接',
   // 'title:ja': 'RSSフィードリンクを追加',
   // 'title:ko': 'RSS 피드 링크 추가',
   // 'title:vi': '',
   // 'title:id': 'Tambahkan tautan Umpan RSS',
   // 'title:es': 'Agregar enlace de fuente RSS',
   // 'title:pt': 'Adicionar link de feed RSS',
   // 'title:fr': 'Ajouter un lien de flux RSS',
   // 'title:it': 'Aggiungi collegamento al feed RSS',
   // 'title:tr': 'RSS Beslemesi bağlantısı ekle',
   // 'title:de': 'RSS-Feed-Link hinzufügen',
   'title:pl': 'Dodaj kanał RSS',
   // 'title:ua': 'Додати RSS-посилання',
   run_on_pages: 'channel, playlist, -mobile',
   restart_on_location_change: true,
   section: 'channel',
   // opt_api_key_warn: true,
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/1760-youtube-rss-feed
      // alt2 - hhttps://greasyfork.org/en/scripts/412949-youtube-rss-feed
      // alt3 - hhttps://greasyfork.org/en/scripts/32384-youtube-rss
      // alt4 - hhttps://greasyfork.org/en/scripts/36357-youtube-copy-channel-rss-feed-url-to-clipboard

      const
         SELECTOR_ID = 'nova-rss-link',
         rssLinkPrefix = '/feeds/videos.xml',
         playlistURL = rssLinkPrefix + '?playlist_id=' + NOVA.queryURL.get('list'),
         genChannelURL = channelId => rssLinkPrefix + '?channel_id=' + channelId;

      switch (NOVA.currentPage) {
         case 'channel':
            // NOVA.waitSelector('#channel-header #links-holder #primary-links')
            NOVA.waitSelector('#page-header h1')
               .then(async container => {
                  await NOVA.delay(500); // dirty fix
                  // Doesn't work.
                  // // https://www.youtube.com/feeds/videos.xml?user=<username>
                  // // if ((channelName_ = document.body.querySelector('#channel-handle')?.textContent)
                  // //    && channelName_.startsWith('@')
                  // // ) {
                  // //    channelName = channelName_.slice(1);
                  // // }

                  // // fix https://github.com/raingart/Nova-YouTube-extension/issues/60
                  // if (!parseInt(NOVA.css.get('#header div.banner-visible-area', 'height'))) {
                  //    container = document.body.querySelector('#channel-header #inner-header-container #buttons');
                  // }

                  const rssLink = document.head.querySelector('link[type="application/rss+xml"][href]')?.href
                     || genChannelURL(NOVA.getChannelId(user_settings['user-api-key']));

                  if (rssLink) {
                     insertToHTML({ 'url': rssLink, 'container': container });
                  }
               });
            break;

         case 'playlist':
            NOVA.waitSelector('.page-header-sidebar h1', { destroy_after_page_leaving: true })
               .then(container => {
                  insertToHTML({ 'url': playlistURL, 'container': container, 'is_playlist': true });
               });
            break;
      }

      function insertToHTML({ url = required(), container = required(), is_playlist }) {
         // console.debug('insertToHTML', ...arguments);
         if (!(container instanceof HTMLElement)) {
            console.error('Container is not an HTMLElement:', container);
            return;
         }

         // (document.getElementById(SELECTOR_ID) || (function () { // for 1 pages
         (container.querySelector(`#${SELECTOR_ID}`) || (function () { // for 2 parallel pages - playlist, watch
            const link = document.createElement('a');
            link.id = SELECTOR_ID;
            link.target = '_blank';
            link.title = 'Nova RSS';
            link.className = `yt-spec-button-shape-next--overlay`;
            // link.innerHTML = NOVA.createSafeHTML(
            //    // `<svg viewBox="-28.364 -29.444 42.324 42.822" height="100%" width="100%">
            //    `<svg viewBox="-35 -35 55 55" height="100%" width="100%" style="width: auto;">
            //       <g fill="currentColor">
            //          <path fill="#F60" d="M-17.392 7.875c0 3.025-2.46 5.485-5.486 5.485s-5.486-2.46-5.486-5.485c0-3.026 2.46-5.486 5.486-5.486s5.486 2.461 5.486 5.486zm31.351 5.486C14.042.744 8.208-11.757-1.567-19.736c-7.447-6.217-17.089-9.741-26.797-9.708v9.792C-16.877-19.785-5.556-13.535.344-3.66a32.782 32.782 0 0 1 4.788 17.004h8.827v.017zm-14.96 0C-.952 5.249-4.808-2.73-11.108-7.817c-4.821-3.956-11.021-6.184-17.255-6.15v8.245c6.782-.083 13.432 3.807 16.673 9.774a19.296 19.296 0 0 1 2.411 9.326h8.278v-.017z"/>
            //       </g>
            //    </svg>`);
            // fix - This document requires 'TrustedHTML' assignment.
            link.append((function createSvgIcon() {
               const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
               svg.setAttribute('viewBox', '-35 -35 55 55');
               svg.setAttribute('height', '100%');
               svg.setAttribute('width', '100%');
               svg.style.width = 'auto';

               const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
               g.setAttribute('fill', 'currentColor');

               const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
               path.setAttribute('fill', '#F60');
               path.setAttribute('d', 'M-17.392 7.875c0 3.025-2.46 5.485-5.486 5.485s-5.486-2.46-5.486-5.485c0-3.026 2.46-5.486 5.486-5.486s5.486 2.461 5.486 5.486zm31.351 5.486C14.042.744 8.208-11.757-1.567-19.736c-7.447-6.217-17.089-9.741-26.797-9.708v9.792C-16.877-19.785-5.556-13.535.344-3.66a32.782 32.782 0 0 1 4.788 17.004h8.827v.017zm-14.96 0C-.952 5.249-4.808-2.73-11.108-7.817c-4.821-3.956-11.021-6.184-17.255-6.15v8.245c6.782-.083 13.432 3.807 16.673 9.774a19.296 19.296 0 0 1 2.411 9.326h8.278v-.017z');

               g.append(path);
               svg.append(g);

               return svg;
            })());

            // link.style.cssText = '';
            Object.assign(link.style, {
               height: '20px',
               display: 'inline-block',
               padding: '5px',
            });
            // if (is_playlist) {
            //    // link.style.cssText += '';
            //    Object.assign(link.style, {
            //       'margin-right': '8px',
            //       'border-radius': '20px',
            //       'background-color': 'var(--yt-spec-static-overlay-button-secondary)',
            //       // 'background-color': '#ffffff1a',
            //       color: 'var(--yt-spec-static-overlay-text-primary)',
            //       // padding: 'var(--yt-button-padding)',
            //       padding: '8px',
            //       'margin-right': '8px',
            //       'white-space': 'nowrap',
            //       'font-size': 'var(--ytd-tab-system-font-size, 1.4rem)',
            //       'font-weight': 'var(--ytd-tab-system-font-weight, 500)',
            //       'letter-spacing': 'var(--ytd-tab-system-letter-spacing, .007px)',
            //       'text-transform': 'var(--ytd-tab-system-text-transform, uppercase)',
            //    });
            // }
            // container.prepend(link);
            container.append(link);
            return link;
         })())
            .href = url;

         // addMetaLink(channel_id);

         // function addMetaLink(channelId) {
         //    channelId = channelId || NOVA.getChannelId(user_settings['user-api-key']);
         //    document.head.insertAdjacentHTML('beforeend', NOVA.createSafeHTML(
         //       `<link rel="alternate" type="application/rss+xml" title="RSS" href="${genChannelURL(channelId)}">`));
         // }
      }

   },
});
