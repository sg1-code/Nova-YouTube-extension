window.nova_plugins.push({
   id: 'search-filter',
   // id: 'thumbs-channels-filter',
   // title: 'Channel deny list',
   title: 'Blocked channels',
   // 'title:zh': '屏蔽频道列表',
   // 'title:ja': 'ブロックされたチャネルのリスト',
   // 'title:ko': '차단된 채널 목록',
   // 'title:vi': '',
   // 'title:id': 'Saluran yang diblokir',
   // 'title:es': 'Lista de canales bloqueados',
   // 'title:pt': 'Lista de canais bloqueados',
   // 'title:fr': 'Liste des chaînes bloquées',
   // 'title:it': 'Canali bloccati',
   // 'title:tr': 'Engellenen kanalların listesi',
   // 'title:de': 'Liste der gesperrten Kanäle',
   'title:pl': 'Zablokowane kanały',
   // 'title:ua': 'Заблоковані канали',
   run_on_pages: 'results, feed, watch, -mobile',
   section: 'thumbs',
   // desc: 'A list of blocked channels',
   desc: 'Hide channels on the search page',
   'desc:zh': '在搜索页面上隐藏频道',
   'desc:ja': '検索ページでチャンネルを非表示にする',
   // 'desc:ko': '검색 페이지에서 채널 숨기기',
   // 'desc:vi': '',
   // 'desc:id': 'Sembunyikan saluran di halaman pencarian',
   // 'desc:es': 'Ocultar canales en la página de búsqueda',
   // 'desc:pt': 'Ocultar canais na página de pesquisa',
   // 'desc:fr': 'Masquer les chaînes sur la page de recherche',
   // 'desc:it': 'Nascondi i canali nella pagina di ricerca',
   // 'desc:tr': 'Arama sayfasında kanalları gizle',
   // 'desc:de': 'Kanäle auf der Suchseite ausblenden',
   'desc:pl': 'Ukryj kanały na stronie wyszukiwania',
   // 'desc:ua': 'Приховує канали на сторінці пошуку',
   _runtime: user_settings => {

      // alt1 - https://github.com/amitbl/blocktube
      // alt2 - https://greasyfork.org/en/scripts/443529
      // alt3 - https://greasyfork.org/en/scripts/405325-youtube-search-filter
      // alt4 - https://greasyfork.org/en/scripts/505880-hide-specific-youtube-channels

      // textarea to array
      const
         SELECTOR_THUMBS_HIDE_CLASS_NAME = 'nova-thumbs-hide',
         BLOCK_KEYWORDS = NOVA.strToArray(user_settings.search_filter_channels_blocklist?.toLowerCase()),
         // keywords_exception = NOVA.strToArray(user_settings.thumbs_hide_live_channels_exception),
         // BLOCK_KEYWORDS = NOVA.strToArray(user_settings.search_filter_channels_blocklist)
         //    .filter(e => !keywords_exception || !keywords_exception.includes(e));
         thumbsSelectors = [
            'ytd-rich-item-renderer', // home, channel, feed
            'ytd-video-renderer', // results
            'ytd-playlist-renderer', // results
            // 'ytd-grid-video-renderer', // feed (old)
            // 'ytd-compact-video-renderer', // sidepanel in watch
            // 'yt-append-continuation-items-action', // sidepanel insert in watch
            'ytm-compact-video-renderer', // mobile /results page (ytm-rich-item-renderer)
            // 'ytm-item-section-renderer' // mobile /subscriptions page
            '.ytp-videowall-still' // videowall
         ]
            .join(',');

      if (!user_settings['thumbs-hide']
         // && !user_settings['search-filter'] // self
         && !user_settings['thumbs-title-filter']
      ) { // avoiding re-append
         // switch grid/list mode
         document.addEventListener('yt-navigate-finish', () => NOVA.queryURL.has('flow') && NOVA.insertFIlterButton());

         NOVA.insertFIlterButton();
      }

      // button css-switch
      NOVA.css.push(
         `body.nova-thumbs-unhide .${SELECTOR_THUMBS_HIDE_CLASS_NAME} {
            border: 2px dashed red;
         }
         body:not(.nova-thumbs-unhide) .${SELECTOR_THUMBS_HIDE_CLASS_NAME} {
            display: none;
         }`);

      if (NOVA.isMobile) {
         // Solution 1. Slowdown but work in mobile and desktop
         NOVA.watchElements({
            selectors: ['#channel-name'],
            // selectors: [
            //    // '#channel-name', // for pc
            //    '.subhead > [class*="media-item-byline"]' // mobile /subscriptions page
            // ]
            //    .map(i => i + ':not(:empty)'),
            attr_mark: 'nova-thumb-channel-filtered',
            callback: channel_name => {
               if (BLOCK_KEYWORDS.includes(channel_name.textContent.trim().toLowerCase())
                  && (thumb = channel_name.closest(thumbsSelectors))
               ) {
                  thumb.remove();
                  // thumb.style.display = 'none';

                  // thumb.style.border = '2px solid red'; // mark for test
                  // console.log('filter removed', thumb);
               }
            }
         });
      }

      else {
         // Solution 1 (HTML5). page update event
         document.addEventListener('scroll', () => {
            requestAnimationFrame(hideThumb);
         });

         document.addEventListener('visibilitychange', () => !document.hidden && hideThumb());

         // Solution 2 (API). page update event
         // Solution 2 (optimized but doesn't work in mobile)
         // page update event
         document.addEventListener('yt-action', evt => {
            // console.debug(evt.detail?.actionName);
            switch (evt.detail?.actionName) {
               case 'yt-append-continuation-items-action': // home, results, feed, channel, watch
               case 'ytd-update-grid-state-action': // feed, channel
               // case 'yt-rich-grid-layout-refreshed': // feed. Warning! loads too early
               // case 'ytd-rich-item-index-update-action': // home, channel
               case 'yt-store-grafted-ve-action': // results, watch
                  // case 'ytd-update-elements-per-row-action': // feed

                  // universal
                  // case 'ytd-update-active-endpoint-action':
                  // case 'yt-window-scrolled':
                  // case 'yt-service-request': // results, watch

                  // console.debug(evt.detail?.actionName); // flltered
                  hideThumb();
                  break;
            }
         });

         NOVA.waitSelector('#movie_player video')
            .then(video => {
               video.addEventListener('ended', () => hideThumb('.ytp-videowall-still-info-author'));
            });

         // if (true) { // for test
         if (typeof GM_info === 'object') {
            let activeThumb;
            document.addEventListener('click', evt => {
               // activeThumb = evt.isTrusted && (el = evt.target.closest('#menu #button')) ? el.closest('#meta, #details') : null; // only feed, result
               // activeThumb = evt.isTrusted && (el = evt.target.closest('#dismissible')) ? el : null; // + watch page
               activeThumb = evt.isTrusted && (el = evt.target.closest('#menu #button')) ? el.closest('#dismissible') : null; // universal
            });
            // }, { capture: true }); // before all events

            // NOVA.waitSelector('#menu [menu-active] [role="menuitem"]')
            // NOVA.waitSelector('tp-yt-iron-dropdown[focused]')
            NOVA.waitSelector('tp-yt-iron-dropdown:not([aria-hidden="true"]) ytd-menu-popup-renderer[slot="dropdown-content"] [role="menuitem"]')
               .then(container => {
                  // container.style.outline = '1px solid red'; // for test
                  // add :hover css
                  NOVA.css.push(`div.ytd-menu-service-item-renderer:hover { background-color: var(--yt-spec-10-percent-layer); }`);

                  const btn = document.createElement('div');
                  btn.classList = 'style-scope ytd-menu-service-item-renderer';
                  // `<yt-formatted-string class="style-scope ytd-menu-service-item-renderer">Block</yt-formatted-string>`;
                  // btn.style.cssText = '';
                  Object.assign(btn.style, {
                     'font-size': '14px',
                     padding: '9px 15px 9px 56px',
                     cursor: 'pointer',
                  });
                  // btn.innerHTML = NOVA.createSafeHTML('<b>Nova block channel</b>');
                  // // btn.textContent = 'Nova block channel';
                  // // btn.innerHTML = NOVA.createSafeHTML(
                  // //    `<svg viewBox="0 0 24 24" height="100%" width="100%">
                  // //       <g fill="currentColor">
                  // //          <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zM3 12c0 2.31.87 4.41 2.29 6L18 5.29C16.41 3.87 14.31 3 12 3c-4.97 0-9 4.03-9 9zm15.71-6L6 18.71C7.59 20.13 9.69 21 12 21c4.97 0 9-4.03 9-9 0-2.31-.87-4.41-2.29-6z" />
                  // //       </g>
                  // //    </svg>Nova block channel`);
                  // fix - This document requires 'TrustedHTML' assignment.
                  const boldText = document.createElement('strong');
                  boldText.textContent = 'Nova block channel';
                  btn.append(boldText);
                  btn.title = 'Nova block channel';

                  btn.addEventListener('click', () => {
                     // console.debug('search_filter_channels_blocklist', user_settings.search_filter_channels_blocklist);
                     const currentCannelName = activeThumb?.querySelector('#channel-name a, #channel-name #text')?.textContent;
                     // const currentCannelName = document.querySelector('#title-container #menu [menu-active]')
                     //    .closest('#details, #meta')
                     //    .querySelector('#channel-name a')?.textContent;
                     console.debug('currentCannelName', currentCannelName, activeThumb);

                     // if (currentCannelName && confirm(`Add channel「${currentCannelName}」to the blacklist?`)) {
                     if (currentCannelName && confirm(`Add channel【${currentCannelName}】to the blacklist?`)) {
                        user_settings.search_filter_channels_blocklist += '\n' + currentCannelName;
                        GM_setValue(configStoreName, user_settings);
                     }
                     document.body.click(); // close expanded menu
                  });
                  // }, { capture: true }); // before all events

                  container.after(btn);

                  // new IntersectionObserver(([entry]) => {
                  //    if (entry.isIntersecting) {
                  //       container.style.display = 'block';
                  //    }
                  // }, {
                  //    // https://github.com/raingart/Nova-YouTube-extension/issues/28
                  //    // threshold: (+user_settings.player_float_scroll_sensivity_range / 100) || .5, // set offset 0.X means trigger if atleast X0% of element in viewport
                  //    threshold: .5, // set offset 0.X means trigger if atleast X0% of element in viewport
                  // })
                  //    .observe(container);
               });
         }

         function hideThumb(selector) {
            document.body.querySelectorAll(selector ||
               // '#channel-name' // without @url_name
               '#channel-name a[href]:first-child', // exclude "Playlist" link
               // #avatar-link[title*="${channelName}"] // alt way
               // .subhead > [class*="media-item-byline"] // mobile /subscriptions page
            )
               .forEach(channel_name => {
                  // console.debug('channel_name:', channel_name);
                  BLOCK_KEYWORDS.forEach(keyword => {
                     // url
                     if (keyword.startsWith('@')
                        && channel_name.href.includes(keyword)
                        // && channel_name.querySelector(`a[href$="${keyword}"]`)
                        && (thumb = channel_name.closest(thumbsSelectors))
                     ) {
                        thumb.remove();
                        // thumb.style.border = '2px solid green'; // mark for test
                     }
                     // title
                     // else if ((channel_name.textContent.trim().toLowerCase() == keyword) // equals
                     else if ((channel_name.textContent.trim().toLowerCase().includes(keyword)) // partially equal
                        && (thumb = channel_name.closest(thumbsSelectors))
                     ) {
                        // thumb.remove();
                        // thumb.style.display = 'none'; // dependency for "thumbs_hide_live_channels_exception" in [thumbs-hide] plugin
                        thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);

                        // console.log('filter removed', keyword, thumb);
                        // thumb.style.border = '2px dashed red'; // mark for test
                     }
                  });
               });
         }
      }

   },
   options: {
      search_filter_channels_blocklist: {
         _tagName: 'textarea',
         label: 'List',
         // 'label:zh': '频道列表',
         // 'label:ja': 'チャンネルリスト',
         // 'label:ko': '채널 목록',
         // 'label:vi': '',
         // 'label:id': 'Daftar',
         // 'label:es': 'Lista',
         // 'label:pt': 'Lista',
         // 'label:fr': 'Liste',
         // 'label:it': 'Elenco',
         // 'label:tr': 'Listesi',
         // 'label:de': 'Liste',
         'label:pl': 'Lista',
         // 'label:ua': 'Список',
         title: 'separator: "," or ";" or "new line"',
         // 'title:zh': '分隔器： "," 或 ";" 或 "新队"',
         // 'title:ja': 'セパレータ： "," または ";" または "改行"',
         // 'title:ko': '구분 기호: "," 또는 ";" 또는 "새 줄"',
         // 'title:vi': '',
         // 'title:id': 'pemisah: "," atau ";" atau "baris baru"',
         // 'title:es': 'separador: "," o ";" o "new line"',
         // 'title:pt': 'separador: "," ou ";" ou "new line"',
         // 'title:fr': 'séparateur : "," ou ";" ou "nouvelle ligne"',
         // 'title:it': 'separatore: "," o ";" o "nuova linea"',
         // 'title:tr': 'ayırıcı: "," veya ";" veya "new line"',
         // 'title:de': 'separator: "," oder ";" oder "new line"',
         'title:pl': 'separator: "," lub ";" lub "now linia"',
         // 'title:ua': 'розділювач: "," або ";" або "новий рядок"',
         placeholder: 'channel1\nchannel2',
         required: true,
      },
   }
});
