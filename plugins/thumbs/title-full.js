window.nova_plugins.push({
   // id: 'thumbs_title_show_full',
   id: 'thumbs-title-show-full',
   title: 'Show full title',
   'title:zh': '显示完整标题',
   'title:ja': '完全なタイトルを表示',
   // 'title:ko': '전체 제목 표시',
   // 'title:vi': '',
   // 'title:id': 'Tampilkan judul lengkap',
   // 'title:es': 'Mostrar título completo',
   // 'title:pt': 'Mostrar título completo',
   // 'title:fr': 'Afficher le titre complet',
   // 'title:it': 'Mostra il titolo completo',
   // 'title:tr': 'Tam başlığı göster',
   // 'title:de': 'Vollständigen Titel anzeigen',
   'title:pl': 'Pokaż pełny tytuł',
   // 'title:ua': 'Показати повну назву',
   run_on_pages: 'home, feed, channel, watch',
   // run_on_pages: '*, -embed, -results, -live_chat',
   section: 'thumbs',
   // desc: '',
   _runtime: user_settings => {

      // alt - https://chromewebstore.google.com/detail/pgpdaocammeipkkgaeelifgakbhjoiel

      const
         VIDEO_TITLE_SELECTOR = [
            '#video-title', // results
            // 'ytm-media-item a > [class$="media-item-headline"]', // mobile /subscriptions
            // 'ytm-rich-item-renderer a > [class$="media-item-headline"]', // mobile /channel
            'a > [class*="media-item-headline"]', // mobile
            // for title in watch page
            // 'h2.slim-video-information-title', // mobile
            // 'ytd-watch-metadata #title h1' // watch
         ]
            .map(i => i + ':not(:empty)');

      NOVA.css.push(
         VIDEO_TITLE_SELECTOR.join(',') + `{
            display: block !important;
            max-height: unset !important;
         }`);

   },
});
