// for test:
// https://www.youtube.com/channel/UCJBpeNOjvbn9rRte3w_Kklg/videos
// https://www.youtube.com/channel/UCl7OsED7y9eavZJbTGnK0xg/playlists - select Albums & Singles
// https://www.youtube.com/c/cafemusicbgmchannel/videos - live

window.nova_plugins.push({
   id: 'thumbs-clear',
   title: 'Thumbnails preview image',
   // 'title:zh': '清除缩略图',
   // 'title:ja': 'サムネイルをクリアする',
   // 'title:ko': '썸네일 지우기',
   // 'title:vi': '',
   // 'title:id': 'Hapus gambar mini',
   // 'title:es': 'Miniaturas claras',
   // 'title:pt': 'Limpar miniaturas',
   // 'title:fr': 'Effacer les vignettes',
   // 'title:it': 'Cancella miniature',
   // 'title:tr': 'Küçük resimleri temizle',
   // 'title:de': 'Miniaturansichten löschen',
   'title:pl': 'Wyczyść miniatury',
   // 'title:ua': 'Очистити мініатюри',
   run_on_pages: 'home, feed, channel, watch',
   // run_on_pages: 'home, results, feed, channel, watch, -mobile',
   // run_on_pages: '*, -embed, -live_chat',
   section: 'thumbs',
   desc: 'Replaces the predefined clickbait thumbnails',
   'desc:zh': '替换预定义的缩略图',
   'desc:ja': '事前定義されたサムネイルを置き換えます',
   // 'desc:ko': '미리 정의된 축소판을 대체합니다',
   // 'desc:vi': '',
   // 'desc:id': 'Menggantikan gambar mini yang telah ditentukan sebelumnya',
   // 'desc:es': 'Reemplaza la miniatura predefinida',
   // 'desc:pt': 'Substitui a miniatura predefinida',
   // 'desc:fr': 'Remplace la vignette prédéfinie',
   // 'desc:it': 'Sostituisce la miniatura predefinita',
   // 'desc:tr': 'Önceden tanımlanmış küçük resmi değiştirir',
   // 'desc:de': 'Ersetzt das vordefinierte Thumbnail',
   'desc:pl': 'Zastępuje predefiniowaną miniaturkę',
   // 'desc:ua': 'Замінює попередньо визначені мініатюри клікбейти',
   _runtime: user_settings => {

      // alt1 - https://dearrow.ajay.app/
      // alt2 - https://chromewebstore.google.com/detail/omoinegiohhgbikclijaniebjpkeopip
      // alt3 - https://greasyfork.org/en/scripts/481732-youtube-blur-no-more

      const
         ATTR_MARK = 'nova-thumb-preview-cleared',
         thumbsSelectors = [
            'ytd-rich-item-renderer', // home, channel, feed
            // 'ytd-video-renderer', // results
            // 'ytd-playlist-renderer', // results
            // 'ytd-grid-video-renderer', // feed (old)
            // 'ytd-compact-video-renderer', // sidepanel in watch
            'yt-append-continuation-items-action', // adding a sidebar in watch
            'ytm-compact-video-renderer', // mobile /results page (ytm-rich-item-renderer)
            'ytm-item-section-renderer' // mobile /subscriptions page
         ];

      // alt1 - https://greasyfork.org/en/scripts/422843-youtube-remove-clickable-labels-on-watch-later-and-add-to-queue-buttons
      // alt2 - https://greasyfork.org/en/scripts/489605-youtube-watch-later-remove-button-on-hover
      if (user_settings.thumbs_clear_overlay) {
         NOVA.css.push(
            `#hover-overlays {
               visibility: hidden !important;
            }`);
      }

      // Solution 1 (HTML5). page update event
      document.addEventListener('scroll', () => {
         requestAnimationFrame(patchThumb);
      });

      document.addEventListener('visibilitychange', () => !document.hidden && patchThumb());

      // Solution 2 (API). page update event
      // when thums update
      document.addEventListener('yt-action', evt => {
         // console.debug(evt.detail?.actionName);
         switch (evt.detail?.actionName) {
            case 'yt-append-continuation-items-action': // home, results, feed, channel, watch
            case 'ytd-update-grid-state-action': // feed, channel
            // case 'yt-rich-grid-layout-refreshed': // feed. Warning! loads too early
            // case 'ytd-rich-item-index-update-action': // home, channel
            case 'yt-store-grafted-ve-action': // results, watch
            case 'ytd-update-elements-per-row-action': // feed

               // universal
               // case 'ytd-update-active-endpoint-action':
               // case 'yt-window-scrolled':
               // case 'yt-service-request': // results, watch

               // console.debug(evt.detail?.actionName); // flltered
               patchThumb();
               break;
         }
      });
      // Solution 3 (NOVA API). universal overloaded
      // NOVA.watchElements({
      //    selectors: [
      //       '#thumbnail:not(.ytd-playlist-thumbnail):not([class*=markers]):not([href*="/shorts/"]) img[src]:not([src*="_live.jpg"])',
      //       'a:not([href*="/shorts/"]) img.video-thumbnail-img[src]:not([src*="_live.jpg"])'
      //    ],
      //    attr_mark: ATTR_MARK,
      //    callback: img => passImg(img),
      // });


      // // dirty fix bug with not updating thumbnails
      // // document.addEventListener('yt-navigate-finish', () => {
      // //    document.body.querySelectorAll(`[${ATTR_MARK}]`).forEach(e => e.removeAttribute(ATTR_MARK));
      // // });

      // patch end card
      // if (user_settings.thumbs_clear_videowall && !user_settings['pages-clear']) {
      //    // force show title
      //    NOVA.css.push(
      //       `.ytp-videowall-still .ytp-videowall-still-info-content {
      //          opacity: 1 !important;
      //          text-shadow: rgb(0, 0, 0) 0 0 .1em;
      //       }
      //       .ytp-videowall-still:not(:hover) .ytp-videowall-still-info-author,
      //       .ytp-videowall-still:not(:hover) .ytp-videowall-still-info-live {
      //          opacity: 0 !important;
      //       }`);

      //    NOVA.waitSelector('#movie_player')
      //       .then(movie_player => {
      //          movie_player.addEventListener('onStateChange', state => {
      //             // console.debug('playerState', NOVA.getPlayerState.playback(state));
      //             if (NOVA.getPlayerState.playback(state) == 'ENDED') {
      //                document.body.querySelectorAll('.ytp-videowall-still-image[style*="qdefault.jpg"]')
      //                   .forEach(img => {
      //                      img.style.backgroundImage = patchImg(img.style.backgroundImage);
      //                   });
      //             }
      //          });
      //       });
      //    // Does manual change work at the end of video time
      //    // NOVA.waitSelector('video')
      //    //    .then(video => {
      //    //       video.addEventListener('ended', () => {
      //    //          document.body.querySelectorAll('.ytp-videowall-still-image[style*="qdefault.jpg"]')
      //    //             .forEach(img => {
      //    //                img.style.backgroundImage = patchImg(img.style.backgroundImage);
      //    //             });
      //    //       });
      //    //    });
      // }

      function patchThumb() {
         // console.debug(evt.detail?.actionName); // flltered
         switch (NOVA.currentPage) {
            case 'home':
            // case 'results':
            case 'feed':
            case 'channel':
            case 'watch':
               document.body.querySelectorAll(
                  `#thumbnail:not(.ytd-playlist-thumbnail):not([class*=markers]):not([href*="/shorts/"]) img[src]:not([src*="_live.jpg"]):not([${ATTR_MARK}]),
            a:not([href*="/shorts/"]) img.video-thumbnail-img[src]:not([src*="_live.jpg"]):not([${ATTR_MARK}])`
               )
                  .forEach(img => {
                     img.setAttribute(ATTR_MARK, true);
                     // img.src = patchImg(img.src);
                     passImg(img);
                  });

               // if (user_settings.thumbs_overlay_playing) {
               //    // alt - https://greasyfork.org/en/scripts/454694-disable-youtube-inline-playback-on-all-pages
               //    document.body.querySelectorAll('#mouseover-overlay')
               //       .forEach(el => el.remove());
               // }
               break;
         }
      }

      let DISABLE_YT_IMG_DELAY_LOADING_default = false; // fix conflict with yt-flags
      async function passImg(img = required()) {
         if (NOVA.currentPage == 'results') return;

         // fix conflict with yt-flags "DISABLE_YT_IMG_DELAY_LOADING"
         if (window.yt?.config_?.DISABLE_YT_IMG_DELAY_LOADING
            && DISABLE_YT_IMG_DELAY_LOADING_default !== window.yt?.config_?.DISABLE_YT_IMG_DELAY_LOADING
         ) {
            // alert('Plugin [Clear thumbnails] not available with current page config');
            DISABLE_YT_IMG_DELAY_LOADING_default = window.yt?.config_?.DISABLE_YT_IMG_DELAY_LOADING;

            await NOVA.delay(100); // dirty fix.
            // Hard reset fn
            document.body.querySelectorAll(`[${ATTR_MARK}]`).forEach(e => e.removeAttribute(ATTR_MARK));
         }

         // skip "premiere", "live now"
         if ((thumb = img.closest(thumbsSelectors))
            && thumb.querySelector(
               `#badges [class*="live-now"],
                  #overlays [aria-label="PREMIERE"],
                  #overlays [overlay-style="UPCOMING"]`)
         ) {
            // console.debug('skiped thumbnails-preview-cleared', parent);
            return;
         }

         if (url = patchImg(img.src)) img.src = url;
      }

      function patchImg(url = required()) {
         // hq1,hq2,hq3,hq720,default,sddefault,mqdefault,hqdefault,maxresdefault(excluding for thumbs)
         // /(hq(1|2|3|720)|(sd|mq|hq|maxres)?default)/i - unnecessarily exact
         // if ((re = /(\w{1}qdefault|hq\d+).jpg/i) && re.test(url)) { // for pc
         //    return url.replace(re, (user_settings.thumbs_clear_preview_timestamp || 'hq2') + '.jpg');
         // }
         // https://i.ytimg.com/vi/ir6nk2zrMG0/sddefault.jpg
         if ((re = /(\w{2}default|hq\d+)./i) && re.test(url)) { // for mobile and pc
            return url.replace(re, (user_settings.thumbs_clear_preview_timestamp || 'hq2') + '.');
         }
      }

   },
   options: {
      thumbs_clear_preview_timestamp: {
         _tagName: 'select',
         // label: 'Thumbnail timestamps moment',
         label: 'Timestamps moment',
         // 'label:zh': '缩略图时间戳',
         // 'label:ja': 'サムネイルのタイムスタンプ',
         // 'label:ko': '썸네일 타임스탬프',
         // 'label:vi': '',
         // 'label:id': 'Stempel waktu gambar mini',
         // 'label:es': 'Marcas de tiempo en miniatura',
         // 'label:pt': 'Carimbos de data e hora em miniatura',
         // 'label:fr': 'Horodatages des vignettes',
         // 'label:it': 'Timestamp in miniatura',
         // 'label:tr': 'Küçük resim zaman damgaları',
         // 'label:de': 'Thumbnail-Zeitstempel',
         'label:pl': 'Znaczniki czasowe miniatur',
         // 'label:ua': 'Мітки часу мініатюр',
         title: 'Show thumbnail from video time position',
         // 'title:zh': '从视频时间位置显示缩略图',
         // 'title:ja': 'ビデオの時間位置からサムネイルを表示',
         // 'title:ko': '비디오 시간 위치에서 썸네일 표시',
         // 'title:vi': '',
         // 'title:id': 'Tampilkan thumbnail dari posisi waktu video',
         // 'title:es': 'Mostrar miniatura de la posición de tiempo del video',
         // 'title:pt': 'Mostrar miniatura da posição no tempo do vídeo',
         // 'title:fr': 'Afficher la vignette à partir de la position temporelle de la vidéo',
         // 'title:it': "Mostra la miniatura dalla posizione dell'ora del video",
         // 'title:tr': 'Video zaman konumundan küçük resmi göster',
         // 'title:de': 'Miniaturansicht von der Videozeitposition anzeigen',
         'title:pl': 'Pokaż miniaturkę z pozycji czasu wideo',
         // 'title:ua': 'Показати мініатюру з часової позиції відео',
         options: [
            {
               label: 'start', value: 'hq1',
               // 'label:zh': '开始',
               // 'label:ja': '始まり',
               // 'label:ko': '시작',
               // 'label:vi': '',
               // 'label:id': 'awal',
               // 'label:es': 'comienzo',
               // 'label:pt': 'começar',
               // 'label:fr': 'le début',
               // 'label:it': 'inizio',
               // 'label:tr': 'başlat',
               // 'label:de': 'anfang',
               'label:pl': 'początek',
               // 'label:ua': 'початок',
            }, // often shows intro
            {
               label: 'middle', value: 'hq2', selected: true,
               // 'label:zh': '中间',
               // 'label:ja': '真ん中',
               // 'label:ko': '아니다',
               // 'label:vi': '',
               // 'label:id': 'tengah',
               // 'label:es': 'medio',
               // 'label:pt': 'meio',
               // 'label:fr': 'ne pas',
               // 'label:it': 'mezzo',
               // 'label:tr': 'orta',
               // 'label:de': 'mitte',
               'label:pl': 'środek',
               // 'label:ua': 'середина',
            },
            {
               label: 'end', value: 'hq3',
               // 'label:zh': '结尾',
               // 'label:ja': '終わり',
               // 'label:ko': '끝',
               // 'label:vi': '',
               // 'label:id': 'akhir',
               // 'label:es': 'fin',
               // 'label:pt': 'fim',
               // 'label:fr': 'finir',
               // 'label:it': 'fine',
               // 'label:tr': 'son',
               // 'label:de': 'ende',
               'label:pl': 'koniec',
               // 'label:ua': 'кінець',
            }
         ],
      },
      thumbs_clear_overlay: {
         _tagName: 'input',
         label: 'Hide overlay buttons on a thumbnail',
         // 'label:zh': '隐藏覆盖在缩略图上的按钮',
         // 'label:ja': 'サムネイルにオーバーレイされたボタンを非表示にする',
         // 'label:ko': '축소판에서 오버레이 버튼 숨기기',
         // 'label:vi': '',
         // 'label:id': 'Sembunyikan tombol overlay pada thumbnail',
         // 'label:es': 'Ocultar botones superpuestos en una miniatura',
         // 'label:pt': 'Ocultar botões de sobreposição em uma miniatura',
         // 'label:fr': 'Masquer les boutons de superposition sur une vignette',
         // 'label:it': 'Nascondi pulsanti sovrapposti su una miniatura',
         // 'label:tr': 'Küçük resimdeki bindirme düğmelerini gizle',
         // 'label:de': 'Überlagerungsschaltflächen auf einer Miniaturansicht ausblenden',
         'label:pl': 'Ukryj przyciski nakładki na miniaturce',
         // 'label:ua': 'Приховати кнопки на мініатюрі',
         type: 'checkbox',
         title: 'Hide [ADD TO QUEUE] [WATCH LATER]',
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
         // 'title:ua': '',
      },
      // thumbs_overlay_playing: {
      //    _tagName: 'input',
      //    label: 'Disable thumbnail preview on hover',
      //    'label:zh': '悬停时禁用缩略图预览',
      //    'label:ja': 'ホバー時のサムネイル プレビューを無効にする',
      //    'label:ko': '호버에서 썸네일 미리보기 비활성화',
      //    'label:vi': '',
      //    'label:id': 'Nonaktifkan pratinjau thumbnail saat melayang',
      //    'label:es': 'Deshabilitar la vista previa en miniatura al pasar el mouse',
      //    // 'label:pt': 'Desativar a visualização de miniaturas ao passar o mouse',
      //    // 'label:fr': "Désactiver l'aperçu des vignettes au survol",
      //    'label:it': "Disabilita l'anteprima in miniatura al passaggio del mouse",
      //    // 'label:tr': 'Fareyle üzerine gelindiğinde küçük resim önizlemesini devre dışı bırak',
      //    // 'label:de': 'Deaktivieren Sie die Thumbnail-Vorschau beim Hover',
      //    'label:pl': 'Wyłącz podgląd miniatur po najechaniu myszką',
      //    // 'label:ua': 'Вимкнути попередній перегляд ескізів при наведенні',
      //    type: 'checkbox',
      // },
      // thumbs_clear_videowall: {
      //    _tagName: 'input',
      //    label: 'Apply for thumbnails after video ends',
      //    'label:zh': '视频结束后申请缩略图',
      //    'label:ja': '動画終了後にサムネイルを申請する',
      //    'label:ko': '영상 종료 후 썸네일 신청',
      //    'label:vi': '',
      //    'label:id': 'Terapkan untuk thumbnail setelah video berakhir',
      //    'label:es': 'Solicitar miniaturas después de que termine el video',
      //    // 'label:pt': 'Candidate-se a miniaturas após o término do vídeo',
      //    // 'label:fr': 'Demander des vignettes après la fin de la vidéo',
      //    'label:it': 'Richiedi le miniature al termine del video',
      //    'label:tr': 'Video bittikten sonra küçük resimler için başvurun',
      //    // 'label:de': 'Bewerben Sie sich nach dem Ende des Videos für Thumbnails',
      //    'label:pl': 'Złóż wniosek o miniatury po zakończeniu filmu',
      //    // 'label:ua': 'Активувати для мініатюр після перегляду відео',
      //    type: 'checkbox',
      // },
   }
});
