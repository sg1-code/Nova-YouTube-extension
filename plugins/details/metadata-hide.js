window.nova_plugins.push({
   id: 'metadata-hide',
   title: 'Hide metadata',
   // 'title:zh': '',
   // 'title:ja': '',
   // 'title:ko': '',
   // 'title:vi': '',
   // 'title:id': '',
   // 'title:es': '',
   // 'title:pt': '',
   // 'title:fr': '',
   // 'title:it': '',
   // 'title:tr': '',
   // 'title:de': '',
   // 'title:pl': '',
   // 'title:ua': 'Приховати метадані',
   run_on_pages: 'watch',
   section: 'details',
   desc: 'Cover link to games, movies, merch, etc.',
   // 'desc:zh': '',
   // 'desc:ja': '',
   // 'desc:ko': '',
   // 'desc:vi': '',
   // 'desc:id': '',
   // 'desc:es': '',
   // 'desc:pt': '',
   // 'desc:fr': '',
   // 'desc:it': '',
   // 'desc:tr': '',
   // 'desc:de': '',
   // 'desc:pl': '',
   // 'desc:ua': 'Посилання на ігри, фільми тощо.',
   _runtime: user_settings => {

      let selectorsList = [
         'ytd-watch-metadata > ytd-metadata-row-container-renderer', // meta
         // https://www.youtube.com/watch?v=uCVXqoVi6RE
         'ytd-merch-shelf-renderer, #infocards-section', // merch
      ];

      if (user_settings.description_card_list) {
         // https://www.youtube.com/watch?v=A3dRmge9XFI - key_moments
         // https://www.youtube.com/watch?v=KNtJGQkC-WI - music
         selectorsList.push('#structured-description ytd-horizontal-card-list-renderer');
      }
      if (user_settings.description_shorts_remixing) {
         // https://www.youtube.com/watch?v=KNtJGQkC-WI
         selectorsList.push('#structured-description ytd-reel-shelf-renderer');
      }
      if (user_settings.description_transcript) {
         selectorsList.push('#structured-description ytd-video-description-transcript-section-renderer');
      }

      if (selectorsList.length) {
         NOVA.css.push(
            selectorsList.join(',\n') + ` {
               display: none !important;
               background-color: red;
            }`);
         // NOVA.css.push({
         //    'display': 'none !important',
         // }, selectorsList.join(',\n'));
      }

   },
   options: {
      description_card_list: {
         _tagName: 'input',
         label: 'Chapters/Key moments/Music info',
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
      description_shorts_remixing: {
         _tagName: 'input',
         label: 'Shorts remixing this video',
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
      description_transcript: {
         _tagName: 'input',
         label: 'Transcript',
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
