window.nova_plugins.push({
   id: 'player-progress-bar-color',
   title: 'Player progress bar color',
   // 'title:zh': '播放器进度条颜色',
   // 'title:ja': 'プレーヤーのプログレスバーの色',
   // 'title:ko': '',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': '',
   // 'title:pt': 'Cor da barra de progresso do jogador',
   // 'title:fr': 'Couleur de la barre de progression du joueur',
   // 'title:it': '',
   // 'title:tr': '',
   // 'title:de': 'Farbe des Spielerfortschrittsbalkens',
   'title:pl': 'Kolor paska postępu gracza',
   // 'title:ua': 'Колір індикатора прогресу програвача',
   run_on_pages: 'watch, embed, -mobile',
   section: 'player-control',
   _runtime: user_settings => {

      if (user_settings.player_progress_bar_gradient) {
         // Solution 1. CSS
         NOVA.css.push(
            `.ytp-play-progress, .ytp-swatch-background-color {
               background: var(--yt-spec-static-brand-red, #f03) !important;
            }`);

         // Solution 2. JS
         // NOVA.waitSelector('.ytp-play-progress')
         //    .then(el => {
         //       setSolidBgColor(el);
         //       function setSolidBgColor(el = required()) {
         //          // const style = window.getComputedStyle(el);
         //          // const background = style.backgroundImage;
         //          const background = NOVA.css.get(el, 'background-image');

         //          if (background.startsWith('linear-gradient')) {
         //             const colors = background.match(/rgba?\([^)]+\)/g);
         //             if (colors.length) {
         //                // Use the first color in the gradient as the solid color
         //                const solidColor = colors[0];
         //                el.style.background = solidColor;
         //             }
         //          }
         //       }
         //    });
      }
      else if (user_settings.player_progress_bar_color) {
         // alt - https://chromewebstore.google.com/detail/nbkomboflhdlliegkaiepilnfmophgfg
         NOVA.css.push(
            `.ytp-swatch-background-color {
               background-color: ${user_settings.player_progress_bar_color || '#f00'} !important;
            }`);
      }

   },
   options: {
      player_progress_bar_color: {
         _tagName: 'input',
         type: 'color',
         // value: '#ff0000', // red
         value: '#0089ff', // blue
         label: 'Color',
         // 'label:zh': '颜色',
         // 'label:ja': '色',
         // 'label:ko': '색깔',
         // 'label:vi': '',
         // 'label:id': 'Warna',
         // 'label:es': 'Color',
         // 'label:pt': 'Cor',
         // 'label:fr': 'Couleur',
         // 'label:it': 'Colore',
         // 'label:tr': 'Renk',
         // 'label:de': 'Farbe',
         'label:pl': 'Kolor',
         // 'label:ua': 'Колір',
         // title: 'default - #ff0000',
         'data-dependent': { 'player_progress_bar_gradient': '!true' },
      },
      player_progress_bar_gradient: {
         _tagName: 'input',
         // label: 'Pink progress bar remover',
         label: 'No gradient',
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
         // title: 'Replace gradient red-pink color',
      },
      // move to here??
      // time_jump_title_offset: {
      //    _tagName: 'input',
      //    label: 'Show time offset on progress bar',
      //    type: 'checkbox',
      //    // title: 'When you hover offset current playback time',
      //    title: 'Time offset from current playback time',
      // },
   }
});
