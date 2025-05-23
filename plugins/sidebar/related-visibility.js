window.nova_plugins.push({
   id: 'related-visibility',
   title: 'Collapse related section',
   // 'title:zh': '收起相关栏目',
   // 'title:ja': '関連セクションを折りたたむ',
   // 'title:ko': '관련 섹션 축소',
   // 'title:vi': '',
   // 'title:id': 'Ciutkan bagian terkait',
   // 'title:es': 'Ocultar sección relacionada',
   // 'title:pt': 'Recolher seção relacionada',
   // 'title:fr': 'Réduire la section associée',
   // 'title:it': 'Comprimi la sezione relativa',
   // 'title:tr': 'İlgili bölümü daralt',
   // 'title:de': 'Zugehörigen Abschnitt minimieren',
   'title:pl': 'Zwiń powiązaną sekcję',
   // 'title:ua': 'Згорнути розділ "пов`язано"',
   run_on_pages: 'watch, -mobile',
   section: 'sidebar',
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://chromewebstore.google.com/detail/fcchghcgfeadhdmkmpkedplecikkajnp
      // alt2 - https://chromewebstore.google.com/detail/mlaigmdigmkhpbnljmhajhleifegcchb
      // alt3 - https://greasyfork.org/en/scripts/472081-youtube-hide-tool
      // alt4 - https://greasyfork.org/en/scripts/467029-youtube-collapse-sidebar

      NOVA.collapseElement({
         selector: '#secondary #related',
         label: 'related',
         remove: (user_settings.related_visibility_mode == 'disable') ? true : false,
      });

   },
   options: {
      related_visibility_mode: {
         _tagName: 'select',
         label: 'Mode',
         // 'label:zh': '模式',
         // 'label:ja': 'モード',
         // 'label:ko': '방법',
         // 'label:vi': '',
         // 'label:id': 'Mode',
         // 'label:es': 'Modo',
         // 'label:pt': 'Modo',
         // 'label:fr': 'Mode',
         // 'label:it': 'Mode',
         // 'label:tr': 'Mod',
         // 'label:de': 'Modus',
         'label:pl': 'Tryb',
         // 'label:ua': 'Режим',
         options: [
            {
               label: 'collapse', value: 'hide', selected: true,
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
               'label:pl': 'zwiń',
               // 'label:ua': 'приховати',
            },
            {
               label: 'remove', value: 'disable',
               // 'label:zh': '消除',
               // 'label:ja': '削除',
               // 'label:ko': '제거하다',
               // 'label:vi': '',
               // 'label:id': 'menghapus',
               // 'label:es': 'eliminar',
               // 'label:pt': 'remover',
               // 'label:fr': 'retirer',
               // 'label:it': 'rimuovere',
               // 'label:tr': '',
               // 'label:de': 'entfernen',
               'label:pl': 'usunąć',
               // 'label:ua': 'видалити',
            },
         ],
      },
   }
});
