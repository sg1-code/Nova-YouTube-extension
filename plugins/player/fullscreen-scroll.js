window.nova_plugins.push({
   id: 'player-disable-fullscreen-scroll',
   title: 'Disable scrolling for fullscreen player',
   // 'title:zh': '禁用全屏滚动',
   // 'title:ja': 'フルスクリーンスクロールを無効にする',
   // 'title:ko': '전체 화면 스크롤 비활성화',
   // 'title:vi': '',
   // 'title:id': 'Nonaktifkan pengguliran pemain dalam mode layar penuh',
   // 'title:es': 'Desactivar el desplazamiento a pantalla completa',
   // 'title:pt': 'Desabilitar rolagem em tela cheia',
   // 'title:fr': 'Désactiver le défilement plein écran',
   // 'title:it': 'Disabilita lo scorrimento del lettore in modalità a schermo intero',
   // 'title:tr': 'Tam ekran kaydırmayı devre dışı bırak',
   // 'title:de': 'Deaktivieren Sie das Scrollen im Vollbildmodus',
   'title:pl': 'Wyłącz przewijanie w trybie pełnoekranowym',
   // 'title:ua': 'Вимкнути прокрутку у повноекранному режимі',
   run_on_pages: 'watch, -mobile',
   section: 'player',
   // desc: '',
   _runtime: user_settings => {

      // alt - https://greasyfork.org/en/scripts/407475-youtube-disable-fullscreen-scroll

      // hide "Scroll for details" button
      NOVA.css.push(`.ytp-chrome-controls button.ytp-fullerscreen-edu-button { display: none !important; }`);

      document.addEventListener('fullscreenchange', () => {
         document.fullscreenElement
            ? document.addEventListener('wheel', lockscroll, { passive: false })
            : document.removeEventListener('wheel', lockscroll);
      });

      function lockscroll(evt) {
         // console.debug('fullscreenElement:', document.fullscreenElement);
         evt.preventDefault();
      }

      // document.addEventListener('wheel', evt => {
      //    if (document.fullscreenElement) {
      //       // console.debug('fullscreenElement:', document.fullscreenElement);
      //       evt.preventDefault();
      //       // movie_player.scrollIntoView({behavior: 'instant', block: 'end', inline: 'nearest'});
      //    }
      // }, { passive: false });

   },
});
