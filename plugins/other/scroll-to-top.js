window.nova_plugins.push({
   id: 'scroll-to-top',
   title: 'Add "Scroll to top" button',
   // 'title:zh': '滚动到顶部按钮',
   // 'title:ja': 'トップボタンまでスクロール',
   // 'title:ko': '맨 위로 스크롤 버튼',
   // 'title:vi': '',
   // 'title:id': 'Gulir ke tombol atas',
   // 'title:es': 'Desplazarse al botón superior',
   // 'title:pt': 'Role para o botão superior',
   // 'title:fr': 'Faites défiler vers le haut',
   // 'title:it': 'Scorri fino al pulsante in alto',
   // 'title:tr': 'Üst düğmeye kaydır',
   // 'title:de': 'Nach oben scrollen',
   'title:pl': 'Przycisk przewijania do góry',
   // 'title:ua': 'Прокрутити до гори',
   run_on_pages: '*, -embed, -mobile, -live_chat',
   section: 'other',
   desc: 'Displayed on long pages',
   'desc:zh': '出现在长页面上',
   'desc:ja': '長いページに表示されます',
   // 'desc:ko': '긴 페이지에 표시됨',
   // 'desc:vi': '',
   // 'desc:id': 'Ditampilkan di halaman panjang',
   // 'desc:es': 'Mostrado en páginas largas',
   // 'desc:pt': 'Exibido em páginas longas',
   // 'desc:fr': 'Affiché sur de longues pages',
   // 'desc:it': 'Visualizzato su pagine lunghe',
   // 'desc:tr': 'Uzun sayfalarda görüntüleniyor',
   // 'desc:de': 'Wird auf langen Seiten angezeigt',
   'desc:pl': 'Wyświetlaj na długich stronach',
   // 'desc:ua': 'Відображається на довгих сторінках',
   _runtime: user_settings => {

      document.addEventListener('scroll', insertButton, { capture: true, once: true });

      function insertButton() {
         const SELECTOR_ID = 'nova-scrollTop-btn';

         const btn = document.createElement('button');
         btn.id = SELECTOR_ID;
         // btn.style.cssText = '';
         Object.assign(btn.style, {
            position: 'fixed',
            cursor: 'pointer',
            bottom: 0,
            left: '20%',
            // display: 'none',
            visibility: 'hidden',
            opacity: .5,
            width: '40%',
            height: '40px',
            border: 'none',
            // transition: 'opacity 200ms ease-in',
            outline: 'none',
            'z-index': 1,
            'border-radius': '100% 100% 0 0',
            'font-size': '16px',
            'background-color': 'rgba(0,0,0,.3)',
            'box-shadow': '0 16px 24px 2px rgba(0, 0, 0, .14), 0 6px 30px 5px rgba(0, 0, 0, .12), 0 8px 10px -5px rgba(0, 0, 0, .4)',
         });
         btn.addEventListener('click', () => {
            window.scrollTo({
               top: 0,
               // left: window.pageXOffset,
               behavior: user_settings.scroll_to_top_smooth ? 'smooth' : 'instant',
            });
            if (user_settings.scroll_to_top_autoplay && NOVA.currentPage == 'watch'
               // && NOVA.videoElement?.paused // restart ENDED
               && ['UNSTARTED', 'PAUSED'].includes(NOVA.getPlayerState.playback())
            ) {
               movie_player.playVideo();
               // NOVA.videoElement?.play();
            }
         });

         // create arrow
         const arrow = document.createElement('span');
         // arrow.style.cssText = '';
         Object.assign(arrow.style, {
            border: 'solid white',
            'border-width': '0 3px 3px 0',
            display: 'inline-block',
            padding: '4px',
            'vertical-align': 'middle',
            transform: 'rotate(-135deg)',
         });
         btn.append(arrow);
         document.body.append(btn);

         // btn hover style
         NOVA.css.push(
            `#${SELECTOR_ID}:hover {
               opacity: 1 !important;
               background-color: rgba(0,0,0,.6) !important;
            }`);

         // scroll event
         const scrollTop_btn = document.getElementById(SELECTOR_ID);
         let sOld;
         window.addEventListener('scroll', () => {
            // trigger if (current scroll > 50% viewport)
            const sCurr = document.documentElement.scrollTop > (window.innerHeight / 2);
            if (sCurr == sOld) return;
            sOld = sCurr;
            scrollTop_btn.style.visibility = sCurr ? 'visible' : 'hidden';
            // console.debug('visibility:', scrollTop_btn.style.visibility);
         });
      }

   },
   options: {
      scroll_to_top_smooth: {
         _tagName: 'input',
         label: 'Smooth',
         // 'label:zh': '光滑的',
         // 'label:ja': 'スムーズ',
         // 'label:ko': '매끄러운',
         // 'label:vi': '',
         // 'label:id': 'Mulus',
         // 'label:es': 'Suave',
         // 'label:pt': 'Suave',
         // 'label:fr': 'Lisse',
         // 'label:it': 'Scorrimento fluido',
         // 'label:tr': 'Düz',
         // 'label:de': 'Glatt',
         'label:pl': 'Płynnie',
         // 'label:ua': 'Плавно',
         type: 'checkbox',
      },
      scroll_to_top_autoplay: {
         _tagName: 'input',
         label: 'Unpause a video',
         // 'label:zh': '视频取消暂停',
         // 'label:ja': 'ビデオの一時停止解除',
         // 'label:ko': '비디오 일시 중지 해제',
         // 'label:vi': '',
         // 'label:id': 'Video batalkan Jeda',
         // 'label:es': 'Reanudar video',
         // 'label:pt': 'Retomar vídeo',
         // 'label:fr': 'Annuler la pause de la vidéo',
         // 'label:it': 'Annulla pausa video',
         // 'label:tr': 'Videoyu Duraklat',
         // 'label:de': 'Video wieder anhalten',
         'label:pl': 'Wyłącz wstrzymanie odtwarzania filmu',
         // 'label:ua': 'Продовжити програвання відео',
         type: 'checkbox',
      },
   }
});
