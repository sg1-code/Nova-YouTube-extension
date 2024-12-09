window.nova_plugins.push({
   id: 'player-hotkeys-focused',
   title: 'Player shortcuts always active',
   // 'title:zh': '播放器热键始终处于活动状态',
   // 'title:ja': 'プレーヤーのホットキーは常にアクティブです',
   // 'title:ko': '플레이어 단축키는 항상 활성화되어 있습니다',
   // 'title:vi': '',
   // 'title:id': 'Tombol pintas pemain selalu aktif',
   // 'title:es': 'Teclas de acceso rápido del jugador siempre activas',
   // 'title:pt': 'Teclas de atalho do jogador sempre ativas',
   // 'title:fr': 'Les raccourcis clavier du joueur sont toujours actifs',
   // 'title:it': 'Tasti di scelta rapida del giocatore sempre attivi',
   // 'title:tr': 'Oyuncu kısayol tuşları her zaman etkin',
   // 'title:de': 'Player-Hotkeys immer aktiv',
   'title:pl': 'Klawisze skrótów dla graczy zawsze aktywne',
   // 'title:ua': 'Гарячі клавіші відтворювача завжди активні',
   run_on_pages: 'watch, embed, -mobile',
   section: 'player-control',
   // desc: 'Player hotkeys always active【SPACE/F】etc.',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/445540-youtubedisablefocusvolume
      // alt2 - https://greasyfork.org/en/scripts/38643-youtube-key-shortcuts-fix
      // alt3 - https://greasyfork.org/en/scripts/462196-auto-focus
      // alt4 - https://greasyfork.org/en/scripts/436459-remove-yt-volumebar-focus
      // alt5 - https://github.com/timmontague/youtube-disable-number-seek
      // alt6 - https://greasyfork.org/en/scripts/479994-disable-youtube-player-focus
      // alt7 - https://greasyfork.org/en/scripts/478857-youtube-spacebar-to-play-pause-videos

      document.addEventListener('keyup', evt => {
         switch (NOVA.currentPage) {
            case 'watch':
            case 'embed':
               if (NOVA.editableFocused(evt.target)) return;
               setPlayerFocus();
               break;
         }
      });

      // alt - https://greasyfork.org/en/scripts/491283-youtube-usability
      if (user_settings.hotkeys_disable_numpad) {
         document.addEventListener('keydown', evt => {
            if (evt.code.startsWith('Numpad')) {
               evt.preventDefault();
               evt.stopPropagation();
               // evt.stopImmediatePropagation();
            }
         }, { capture: true });
      }

      function setPlayerFocus(target) {
         // focus without scrolling
         // NOVA.videoElement?.focus({ preventScroll: true });
         movie_player.focus({ preventScroll: true });

         // document.activeElement.style.border = '2px solid red'; // mark for test
         // console.debug('active element', document.activeElement);
      }

   },
   options: {
      hotkeys_disable_numpad: {
         _tagName: 'input',
         // label: 'Disable numpad hotkeys',
         label: 'Disable numpad',
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
