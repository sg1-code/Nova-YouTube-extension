// for test
// https://www.youtube.com/@TheGoodLiferadio/streams

window.nova_plugins.push({
   id: 'move-to-sidebar',
   title: 'Move to sidebar',
   // 'title:zh': '转移到侧边栏',
   // 'title:ja': 'サイドバーに転送',
   // 'title:ko': '',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': '',
   // 'title:pt': 'Transferir para a barra lateral',
   // 'title:fr': 'Transférer vers la barre latérale',
   // 'title:it': '',
   // 'title:tr': '',
   // 'title:de': 'Zur Seitenleiste übertragen',
   'title:pl': 'Przenieś na pasek boczny',
   // 'title:ua': 'Перенести на бічну панель',
   run_on_pages: 'watch, -mobile',
   // restart_on_location_change: true,
   section: 'sidebar',
   // desc: '',
   // 'plugins-conflict': 'description-dropdown',
   // 'plugins-conflict': 'playlist-extended',
   _runtime: user_settings => {

      // Exclude playlists
      if (user_settings.move_to_sidebar_target != 'info' && location.search.includes('list=')) return;

      const
         SELECTOR_CONTAINER = '.ytd-page-manager[video-id]:not([fullscreen])',
         SELECTOR_BELOW = `${SELECTOR_CONTAINER} #below`,
         SELECTOR_SECONDARY = `${SELECTOR_CONTAINER} #secondary`;

      switch (user_settings.move_to_sidebar_target) {
         case 'info':
            moveChannelInfo();
            break;

         // Move description on the right
         // alt - https://greasyfork.org/en/scripts/452405-youtube-scrollable-right-side-description
         case 'description':
            // fix conflict with plugin [description-dropdown]
            if (user_settings['description-dropdown']) return;

            NOVA.waitSelector(`${SELECTOR_BELOW} #description.ytd-watch-metadata`, { destroy_after_page_leaving: true })
               .then(description => {
                  // move to the right
                  NOVA.waitSelector(`${SELECTOR_SECONDARY}-inner`, { destroy_after_page_leaving: true })
                     .then(async secondary => {
                        if (document.body.querySelector('#chat:not([collapsed])')) return; // exclude opened chat

                        secondary.prepend(description);

                        // views and date
                        const infoContainer = document.body.querySelector(`${SELECTOR_SECONDARY} #info-container`);
                        if (infoContainer) {
                           if (!user_settings['description-dropdown'] && !user_settings['video-date-format']) {
                              const title = document.body.querySelector(`${SELECTOR_BELOW} ytd-watch-metadata #title`);
                              title?.append(infoContainer);
                           }
                           else {
                              infoContainer.remove();
                           }
                        }

                        NOVA.css.push(
                           `${SELECTOR_SECONDARY} #owner { margin: 0; }
                           /* make the description scrollable */
                           ${SELECTOR_SECONDARY} #description.ytd-watch-metadata {
                              height: fit-content !important;
                              max-height: 80vh !important;
                              overflow-y: auto;
                           }
                           /* hide collapse label */
                           ${SELECTOR_SECONDARY} #description #collapse,
                           /* hide info tags */
                           #ytd-watch-info-text, #info-container a {
                              display: none;
                           `);
                        document.body.querySelector(`${SELECTOR_SECONDARY} #description #expand`)?.click();
                     });
               });

            moveChannelInfo();
            moveSidebarBelow();
            break;

         // Move conmments in the sidebar
         case 'comments':
            // alt1 - https://github.com/yakisova41/move-youtube-comments-to-sidebar
            if (user_settings.comments_visibility_mode == 'disable' || user_settings['comments-dropdown']) return;

            NOVA.waitSelector(`${SELECTOR_BELOW} #comments`, { destroy_after_page_leaving: true })
               .then(comments => {
                  if (document.body.querySelector('#chat:not([collapsed])')) return; // exclude opened chat

                  document.body.querySelector(`${SELECTOR_SECONDARY}`)?.append(comments);
                  // make the conmments scrollable
                  comments.style.cssText = 'height:100vh; overflow-y:auto;';
                  // Object.assign(comments.style, {
                  //    height: '100vh',
                  //    'overflow-y': 'auto',
                  // });
               });

            moveSidebarBelow();
            break;
      }

      // move related on below the video
      function moveSidebarBelow() {
         NOVA.waitSelector(`${SELECTOR_SECONDARY} #related`, { destroy_after_page_leaving: true })
            .then(related => {
               if (document.body.querySelector('#chat:not([collapsed])')) return; // exclude opened chat
               document.body.querySelector('#below')?.append(related);
            });
      }

      function moveChannelInfo() {
         NOVA.waitSelector(`${SELECTOR_SECONDARY}-inner`, { destroy_after_page_leaving: true })
            .then(secondary => {
               // without the subscribe button
               // NOVA.waitSelector(`${SELECTOR_BELOW} ytd-watch-metadata ytd-video-owner-renderer`, { destroy_after_page_leaving: true })
               // with the subscribe button
               NOVA.waitSelector(`${SELECTOR_BELOW} ytd-watch-metadata #owner`, { destroy_after_page_leaving: true })
                  .then(channelInfo => {
                     secondary.prepend(channelInfo);
                     // channelInfo.style.margin = 0; // remove padding
                  });
            });

      }

   },
   options: {
      move_to_sidebar_target: {
         _tagName: 'select',
         label: 'Target of movement',
         // 'label:zh': '运动目标',
         // 'label:ja': '移動の対象',
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
         // title: '',
         options: [
            { label: 'info', value: 'info' },
            { label: 'info + description', value: 'description', selected: true },
            { label: 'comments', value: 'comments' },
         ],
      },
   },
});
