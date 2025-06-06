// for test:
// thanks button
// https://www.youtube.com/watch?v=b7zBJNmdImo
// https://www.youtube.com/watch?v=muxq5sQVdlc
// https://www.youtube.com/watch?v=Pf8YTpp7B2I
// https://www.youtube.com/watch?v=uvNkdAggUGU
// https://www.youtube.com/watch?v=Eb7al22iNPc

window.nova_plugins.push({
   id: 'player-hide-elements',
   title: 'Hide some player buttons/elements',
   // 'title:zh': '隐藏一些播放器按钮/元素',
   // 'title:ja': '一部のプレーヤーのボタン/要素を非表示にする',
   // 'title:ko': '',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': '',
   // 'title:pt': 'Ocultar alguns botões/elementos do player',
   // 'title:fr': 'Masquer certains boutons/éléments du lecteur',
   // 'title:it': '',
   // 'title:tr': '',
   // 'title:de': '',
   'title:pl': 'Ukryj niektóre przyciski/elementy odtwarzacza',
   // 'title:ua': '',
   run_on_pages: 'watch, embed, -mobile',
   section: 'player-control',
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/463204-youtube-player-controls-edited
      // alt2 - https://greasyfork.org/en/scripts/486936-youtube-video-player-bar-simplified
      // alt3 - https://greasyfork.org/en/scripts/488224-control-panel-for-youtube

      const SELECTORS = {
         // 'country_code': '#masthead #country-code',
         // 'voice_search_button': '#masthead #voice-search-button',
         'ambient': '#cinematics-container',
         // player ends
         // alt - https://greasyfork.org/en/scripts/466195-remove-youtube-video-end-screen-thumbnails
         'videowall_endscreen': '.videowall-endscreen',
         'card_endscreen': '[class^="ytp-ce-"]',
         // player control top (embed)
         'watch_later_button': '.ytp-chrome-top-buttons button.ytp-watch-later-button',
         // player control top (embed, fullscreen)
         'info_button': '.ytp-chrome-top-buttons button.ytp-cards-button',
         // 'more_videos': '.ytp-pause-overlay', // (embed) conflict with "card-switch" [player-quick-buttons] plugin and duplicate  [pages-clear] plugin
         // player control left
         'prev_button': '.ytp-chrome-bottom .ytp-prev-button',
         'play_button': '.ytp-chrome-bottom .ytp-play-button',
         'next_button': '.ytp-chrome-bottom .ytp-next-button',
         'volume_area': '.ytp-chrome-bottom .ytp-volume-area',
         'time_display': '.ytp-chrome-bottom .ytp-time-display'
            + (user_settings['time-remaining'] ? ' span > span:not([id])' : ''),
         'time_duration_display': '.ytp-chrome-bottom .ytp-time-duration, .ytp-chrome-bottom .ytp-time-separator',
         'chapter_container': '.ytp-chrome-bottom .ytp-chapter-container', // duplicate "player_indicator_chapter_default_container_hide" [player-indicator] plugin
         // player control right
         'autonav_toggle_button': '.ytp-chrome-bottom button.ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"]',
         'subtitles_button': '.ytp-chrome-bottom button.ytp-subtitles-button',
         'settings_button': '.ytp-chrome-bottom button.ytp-settings-button',
         'cast_button': '.ytp-chrome-bottom button.ytp-remote-button',
         'size_button': '.ytp-chrome-bottom button.ytp-size-button',
         'miniplayer_button': '.ytp-chrome-bottom button.ytp-miniplayer-button',
         'logo_button': '.ytp-chrome-bottom .yt-uix-sessionlink',
         'fullscreen_button': '.ytp-chrome-bottom button.ytp-fullscreen-button',
         // for brave browser
         // hide: "Seek backwards 10 seconds. (←)" and "Seek forward 10 seconds. (→)"
         'brave_jump_button': '.ytp-chrome-bottom button.ytp-jump-button',
      };

      // const SELECTOR_CONTAINER = '#movie_player1 .ytp-chrome-bottom';
      const SELECTOR_CONTAINER = '#movie_player';
      const toArray = a => Array.isArray(a) ? a : [a];
      // function checkIsList(el, idx, array) {
      //    if (data = SELECTORS[el]) {
      //       list.push(data);
      //       return true;
      //    }
      // }

      let list = [];

      toArray(user_settings.player_hide_elements)
         .forEach(el => (data = SELECTORS[el]) && list.push(`${SELECTOR_CONTAINER} ${data}`));

      // final
      // if (toArray(user_settings.player_hide_elements).every(checkIsList) && list.length) {
      // if ((list = toArray(user_settings.player_hide_elements).map(el => SELECTORS[el]).filter(Boolean)) && list.length) {
      if (list.length) {
         NOVA.css.push(
            list.join(',\n') + ` {
               display: none !important;
            }`);
         // NOVA.css.push({
         //    'display': 'none !important',
         // }, list.join(',\n'));
      }

   },
   options: {
      // player_hide_elements_items: {
      player_hide_elements: {
         _tagName: 'select',
         label: 'Items',
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
         title: '[Ctrl+Click] to select several',
         // 'title:zh': '[Ctrl+Click] 选择多个',
         // 'title:ja': '「Ctrl+Click」して、いくつかを選択します',
         // 'title:ko': '[Ctrl+Click] 여러 선택',
         // 'title:vi': '',
         // 'title:id': '[Ctrl+Klik] untuk memilih beberapa',
         // 'title:es': '[Ctrl+Click] para seleccionar varias',
         // 'title:pt': '[Ctrl+Click] para selecionar vários',
         // 'title:fr': '[Ctrl+Click] pour sélectionner plusieurs',
         // 'title:it': '[Ctrl+Clic] per selezionarne diversi',
         // 'title:tr': 'Birkaç tane seçmek için [Ctrl+Tıkla]',
         // 'title:de': '[Ctrl+Click] um mehrere auszuwählen',
         'title:pl': 'Ctrl+kliknięcie, aby zaznaczyć kilka',
         // 'title:ua': '[Ctrl+Click] щоб обрати декілька',
         multiple: null, // don't use - selected: true
         required: true, // don't use - selected: true
         size: 10, // = options.length
         options: [
            // {
            //    label: 'header: country_code', value: 'country_code',
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
            // {
            //    label: 'header: voice_search', value: 'voice_search_button',
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
               label: 'ambient', value: 'ambient',
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
               label: 'videowall (thumbs)', value: 'videowall_endscreen',
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
               label: 'card', value: 'card_endscreen',
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
               label: 'watch-later', value: 'watch_later_button',
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
               label: 'info (embed)', value: 'info_button',
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
               label: 'prev', value: 'prev_button',
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
               label: 'play/stop live', value: 'play_button',
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
               label: 'next', value: 'next_button',
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
               label: 'jump (for Brave)', value: 'brave_jump_button',
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
               title: 'Seek backwards/forward 10 seconds'
            },
            {
               label: 'volume', value: 'volume_area',
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
               label: 'time', value: 'time_display',
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
               label: 'time duration', value: 'time_duration_display',
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
               label: 'chapter', value: 'chapter_container',
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
               label: 'autoplay next', value: 'autonav_toggle_button',
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
               label: 'subtitles', value: 'subtitles_button',
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
               label: 'settings', value: 'settings_button',
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
               // label: 'Play on TV', value: 'cast_button',
               label: 'cast', value: 'cast_button',
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
               label: 'size', value: 'size_button',
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
               label: 'miniplayer', value: 'miniplayer_button',
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
               label: 'logo (embed)', value: 'logo_button',
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
               label: 'fullscreen', value: 'fullscreen_button',
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
