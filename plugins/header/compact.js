window.nova_plugins.push({
   id: 'header-compact',
   title: 'Header compact',
   // 'title:zh': '标题紧凑',
   // 'title:ja': 'ヘッダーコンパクト',
   // 'title:ko': '헤더 컴팩트',
   // 'title:vi': '',
   // 'title:id': 'Kompak tajuk',
   // 'title:es': 'Encabezado compacto',
   // 'title:pt': 'Cabeçalho compacto',
   // 'title:fr': 'En-tête compact',
   // 'title:it': 'Testata compatta',
   // 'title:tr': 'Başlık kompakt',
   // 'title:de': 'Header kompakt',
   'title:pl': 'Kompaktowy nagłówek',
   // 'title:ua': 'Компактна шапка сайту',
   run_on_pages: '*, -embed, -mobile, -live_chat',
   section: 'header',
   // desc: '',
   _runtime: user_settings => {

      const height = '36px'; // patch [theater-mode] plugin (player_full_viewport_mode == 'offset')

      NOVA.css.push(
         `#masthead #container.ytd-masthead {
            max-height: ${height} !important;
         }

         /* fix for [player-indicator] plugin */
         #masthead #background {
            max-height: ${height} !important;
         }

         #search-form, #search-icon-legacy {
            max-height: ${height} !important;
         }

         body,
         html:not(:fullscreen) #page-manager {
            --ytd-masthead-height: ${height};
         }

         #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
            --ytd-rich-grid-chips-bar-top: ${height};
         }`);

   },
});
