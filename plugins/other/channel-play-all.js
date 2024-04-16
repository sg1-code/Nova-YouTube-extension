window.nova_plugins.push({
   id: 'channel-play-all',
   // title: 'Add "Play All" button to channel page',
   title: 'Add "Play All" button',
   'title:zh': '在频道页面添加“Play All”按钮',
   'title:ja': 'チャンネルページに「Play All」ボタンを追加',
   // 'title:ko': '채널 페이지에 "Play All" 버튼 추가',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': 'Agregar el botón "Play All" a la página del canal',
   // 'title:pt': 'Adicione o botão "Play All" à página do canal',
   // 'title:fr': 'Ajouter le bouton "Play All" à la page de la chaîne',
   // 'title:it': '',
   // 'title:tr': 'Kanal sayfasına "Play All" düğmesini ekleyin',
   // 'title:de': 'Fügen Sie der Kanalseite die Schaltfläche "Play All" hinzu',
   // 'title:pl': '',
   // 'title:ua': '',
   run_on_pages: 'channel, watch, -mobile',
   restart_on_location_change: true,
   section: 'channel',
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/490557-youtube-play-all
      // alt2 - https://greasyfork.org/en/scripts/454215-bring-back-youtube-channel-playlists
      // alt3 - https://greasyfork.org/en/scripts/490842-youtube-play-all-from-channel
      // alt4 - https://greasyfork.org/en/scripts/492119-youtube-all-videos-playlists-yavp

      const
         SELECTOR_ID = 'nova-play-all-channel-btn',
         // SELECTOR_BTN = '.' + SELECTOR_ID;
         // endpoint = '/playlist?list=' + (user_settings.channel_play_all_mode || 'UU');
         endpoint = '/playlist?list=';

      // NOVA.css.push(
      //    `${SELECTOR_BTN}:hover {
      //       color: deepskyblue;
      //       outline: 1px solid var(--yt-spec-call-to-action);
      //    }`);

      switch (NOVA.currentPage) {
         case 'watch':
            if (!user_settings.channel_play_all_in_watch) return;

            // mobile view 'ytm-feed-filter-chip-bar-renderer > div'
            NOVA.waitSelector('#owner.ytd-watch-metadata')
               .then(container => {
                  if (channelId = NOVA.getChannelId()) {
                     const btnList = user_settings.channel_play_all_mode
                        ? { id: 'UULF', title: 'All' }
                        : { id: 'UULP', title: 'MOST POPULAR' };

                     insertToHTML({
                        'container': container,
                        'url': endpoint + btnList.id + channelId.substring(2),
                     });

                     function insertToHTML({ url = required(), container = required() }) {
                        console.debug('insertToHTML', ...arguments);
                        if (!(container instanceof HTMLElement)) return console.error('container not HTMLElement:', container);

                        (document.getElementById(SELECTOR_ID) || (function () {
                           const el = document.createElement('a');
                           el.id = SELECTOR_ID;
                           el.className = 'style-scope yt-formatted-string bold yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m';
                           el.style.cssText = 'margin-left:5px; flex: .6;';
                           // Object.assign(el.style, {
                           //    flex: .6,
                           //    cursor: 'pointer',
                           // });
                           el.textContent = `► Play ${btnList.title}`;
                           el.title = 'Play all uploads videos from the channel';
                           return container.appendChild(el);

                           // container.insertAdjacentElement('beforeend', el);
                           // return el;
                           // 62.88 % slower
                           // container.insertAdjacentHTML('beforeend',
                           //    `<span id="${SELECTOR_ID}" yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading" style=margin-left:5px; flex: .6;" id="${SELECTOR_ID}" title="Nova play all channel videos">Play All</a>`);
                           // return document.getElementById(SELECTOR_ID);
                        })())
                           .href = url;
                     }

                  }
               });
            break;

         case 'channel':
            // if (!location.pathname.endsWith('/videos')) return;

            // https://github.com/RobertWesner/YouTube-Play-All/blob/main/documentation/available-lists.md

            let btnList;
            switch (NOVA.channelTab) {
               case 'videos':
                  btnList = user_settings.channel_play_all_mode
                     ? { id: 'UULF', title: 'All Videos' }
                     : { id: 'UULP', title: 'Popular Videos' };
                  break;

               case 'shorts':
                  btnList = user_settings.channel_play_all_mode
                     ? { id: 'UUSH', title: 'All Shorts' }
                     : { id: 'UUPS', title: 'Popular Shorts' };
                  break;

               case 'streams':
                  btnList = user_settings.channel_play_all_mode
                     ? { id: 'UULV', title: 'All Streams' }
                     : { id: 'UUPV', title: 'Popular Streams' };
                  break;
            }

            if (!btnList) return;

            // NOVA.waitSelector('#header #chips') // beside to the buttons
            NOVA.waitSelector('#header #chips-wrapper') // alongside of right
               .then(container => {
                  // if (document.body.querySelector(`#${SELECTOR_ID} a[href*="list=UU"]`)) return;
                  container.querySelector(`.${SELECTOR_ID}`)?.remove(); // remove old

                  const btn = document.createElement('tp-yt-paper-button');
                  // const btn = document.createElement('a');
                  btn.className = 'style-scope yt-formatted-string bold yt-chip-cloud-chip-renderer 1yt-spec-button-shape-next';
                  btn.classList.add(SELECTOR_ID);
                  // btn.style.cssText = 'color: var(--yt-spec-text-primary); text-wrap: nowrap;';
                  btn.style.cssText = 'color: wheat; text-wrap: nowrap;';
                  // Object.assign(btn.style, {
                  //    color: 'wheat',
                  //    // color: 'var(--yt-spec-text-primary)',
                  //    cursor: 'pointer',
                  //    padding: var(--yt-button-padding-minus-border),
                  // });
                  btn.textContent = `► Play ${btnList.title}`;
                  // btn.title = 'Play all uploads videos from the channel';

                  // if (channelId = NOVA.getChannelId()) {
                  //    btn.href = '/playlist?list=UU' + channelId.substring(2);
                  // }
                  btn.addEventListener('click', () => {
                     if (channelId = NOVA.getChannelId()) {
                        // list=UU<ID> adds shorts into the playlist
                        // list=UULF<ID> videos without shorts
                        // list=UULP<ID> videos sorted by popular
                        location.href = endpoint + btnList.id + channelId.substring(2);
                     }
                  });

                  container.append(btn);

                  // (sort:newest)
                  // btn.title = 'Newest';
                  // // btn.addEventListener('click', () => location.href = location.href + "?view=57");
                  // btn.addEventListener('click', () => location.href = NOVA.queryURL.set({ 'view': 57 }));
                  // // btn.addEventListener('click', () => {
                  // //    if (channelId = NOVA.getChannelId()) {
                  // //       // vidId = NOVA.queryURL.get('v',document.body.querySelector('a#thumbnail[href]:first-child').href);
                  // //       location.href = `/playlist?list=UU` + channelId;
                  // //    }
                  // (sort:most)
                  // btn2.textContent = '► Play MOST POPULAR';
                  // btn2.addEventListener('click', () => {
                  //    if (channelId = NOVA.getChannelId()) {
                  //       location.href = `/playlist?v=${vidId}&list=PU` + channelId.substring(2);
                  //    }
                  // });


                  // const ul = document.createElement('selector');
                  // vidId = NOVA.queryURL.get('v', document.body.querySelector('a#thumbnail[href]:first-child').href);
                  // // ul.className = '';
                  // [
                  //    // list=UU<ID> adds shorts into the playlist
                  //    // list=UULF<ID> videos without shorts
                  //    // list=UULP<ID> videos sorted by popular
                  //    { label: 'All', list: `v=${vidId}&list=UU` },
                  //    { label: 'without shorts', list: 'list=UULF' },
                  //    { label: 'by popular', list: 'list=UULP' },
                  // ]
                  //    .forEach(item => {
                  //       const li = document.createElement('li');

                  //       const a = document.createElement('a');
                  //       li.className = 'style-scope yt-formatted-string bold';
                  //       // a.href = `/playlist?${item.list}` + channelId.substring(2);
                  //       a.target = '_blank';
                  //       a.textContent = item.label;
                  //       a.title = 'Open with ' + item.label;

                  //       li.append(a); // append
                  //       ul.append(li); // append
                  //    });

                  // container.append(ul);

               });
            break;
      }

   },
   options: {
      channel_play_all_mode: {
         _tagName: 'select',
         label: 'Mode',
         'label:zh': '模式',
         'label:ja': 'モード',
         // 'label:ko': '방법',
         // 'label:vi': '',
         // 'label:id': 'Mode',
         // 'label:es': 'Modo',
         // 'label:pt': 'Modo',
         // 'label:fr': 'Mode',
         // 'label:it': 'Modalità',
         // 'label:tr': 'Mod',
         // 'label:de': 'Modus',
         'label:pl': 'Tryb',
         // 'label:ua': 'Режим',
         options: [
            {
               label: 'all', value: true, /*value: 'UU',*/
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
            // {
            //    label: 'without shorts', value: 'UULF',
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
            // },
            {
               // label: 'by popular', value: 'UULP',
               label: 'most popular',
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
      channel_play_all_in_watch: {
         _tagName: 'input',
         label: 'Add in the "watch page" too',
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
