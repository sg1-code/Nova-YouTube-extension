window.nova_plugins.push({
   id: 'copy-url',
   title: 'Copy URL to clipboard',
   // 'title:zh': '将 URL 复制到剪贴板',
   // 'title:ja': 'URLをクリップボードにコピー',
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
   run_on_pages: 'results, channel, playlist, watch, embed',
   section: 'other',
   // desc: 'use「Ctrl+C」',
   _runtime: user_settings => {

      const SELECTOR_ID = 'nova-copy-notification';

      document.addEventListener('keydown', evt => {
         const hotkeyMod = user_settings.copy_url_hotkey || 'ctrlKey';
         // on selected text
         if (hotkeyMod == 'ctrlKey' && window.getSelection && window.getSelection().toString()) return;

         if (NOVA.editableFocused(evt.target)) return;

         // if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;
         if (evt[hotkeyMod] && evt.code === 'KeyC') {
            evt.preventDefault();
            evt.stopPropagation();
            // evt.stopImmediatePropagation();

            // const url = (NOVA.currentPage == 'watch')
            //    ? 'https://youtu.be/' + (NOVA.queryURL.get('v') || movie_player.getVideoData().video_id)
            //    : location.href;
            let url;
            switch (NOVA.currentPage) {
               case 'watch':
               case 'embed':
                  url = 'https://youtu.be/' + (NOVA.queryURL.get('v') || movie_player.getVideoData().video_id);
                  break;

               case 'channel':
                  url = (channelId = NOVA.getChannelId(user_settings['user-api-key']))
                     ? user_settings['channel-play-all']
                        ? `https://${location.host}/playlist?list=UULF` + channelId.slice(2)
                        : `https://${location.host}/channel/` + channelId
                     : location.href;
                  break

               case 'results':
               case 'playlist':
                  url = location.href;
                  break
            }
            if (url) {
               navigator.clipboard.writeText(url);
               // showNotification('Shortened URL copied to clipboard\n' + url);
               showNotification('URL copied');
            }
         }
      });

      function showNotification(msg) {
         // reset timeout
         if (typeof showNotification.fadeTimeout === 'number') {
            clearTimeout(showNotification.fadeTimeout);
            clearTimeout(showNotification.hideTimeout);
         }

         const notify = (document.getElementById(SELECTOR_ID) || (function () {
            const el = document.createElement('div');
            el.id = SELECTOR_ID;

            let initcss = {
               position: 'fixed',
               // top: '75px',
               // right: '20px',
               'z-index': 9999,
               'border-radius': '2px',
               'background-color': user_settings.copy_url_color || '#e85717',
               'box-shadow': 'rgb(0 0 0 / 50%) 0px 0px 3px',
               'border-radius': user_settings['square-avatars'] ? 'inherit' : '12px',
               'font-size': `${+user_settings.copy_url_font_size || 1.7}em`,
               color: 'var(--yt-spec-text-primary, white)',
               padding: '.5em .8em',
               cursor: 'pointer',
            };
            switch (user_settings.copy_url_position) {
               case 'top-left':
                  // initcss.top = user_settings['header-unfixed'] ? 0
                  // : (document.getElementById('masthead-container')?.offsetHeight || 0) + 'px';
                  initcss.top = '60px';
                  initcss.left = '20px';
                  break;
               case 'bottom-left':
                  initcss.bottom = '20px';
                  initcss.left = '20px';
                  break;
               case 'bottom-right':
                  initcss.bottom = '20px';
                  initcss.right = '20px';
                  break;
               // case 'top-right':
               default:
                  // initcss.top = user_settings['header-unfixed'] ? 0
                  // : (document.getElementById('masthead-container')?.offsetHeight || 0) + 'px';
                  initcss.top = '60px';
                  initcss.right = '20px';
                  break;
            }
            // el.style.cssText = '';
            Object.assign(el.style, initcss);
            return document.body.appendChild(el);
         })());

         notify.textContent = msg;
         // notify.innerText = msg;
         notify.style.opacity = +user_settings.copy_url_opacity || 1;
         notify.style.visibility = 'visible';

         // notify.addEventListener('click', notify.remove);
         // setTimeout(notify.remove, 3000);

         showNotification.fadeTimeout = setTimeout(() => {
            notify.style.transition = 'opacity 200ms ease-out';
            notify.style.opacity = 0;
            showNotification.hideTimeout = setTimeout(() => notify.style.visibility = 'hidden', 5000); // completely hide after 5s
         }, 600); // 600ms
      }

   },
   options: {
      copy_url_hotkey: {
         _tagName: 'select',
         label: 'Hotkey',
         // 'label:zh': '热键',
         // 'label:ja': 'ホットキー',
         // 'label:ko': '단축키',
         // 'label:vi': '',
         // 'label:id': 'Tombol pintas',
         // 'label:es': 'Tecla de acceso rápido',
         // 'label:pt': 'Tecla de atalho',
         // 'label:fr': 'Raccourci',
         // 'label:it': 'Tasto di scelta rapida',
         // 'label:tr': 'Kısayol tuşu',
         // 'label:de': 'Schnelltaste',
         'label:pl': 'Klawisz skrótu',
         // 'label:ua': 'Гаряча клавіша',
         options: [
            { label: 'shift+c', value: 'shiftKey', selected: true },
            { label: 'ctrl+c', value: 'ctrlKey' },
            // { label: 'alt+c', value: 'altKey' },
         ],
      },
      copy_url_position: {
         _tagName: 'select',
         // label: 'Position in the corner',
         label: 'Notification position',
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
         options: [
            // https://unicode.org/charts/nameslist/n_2190.html
            {
               // label: 'Top left', value: 'top-left',
               label: '↖', value: 'top-left',
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
               // label: 'Top right', value: 'top-right', selected: true,
               label: '↗', value: 'top-right', selected: true,
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
               // label: 'Bottom left', value: 'bottom-left',
               label: '↙', value: 'bottom-left',
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
               // label: 'Bottom right', value: 'bottom-right',
               label: '↘', value: 'bottom-right',
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
      copy_url_opacity: {
         _tagName: 'input',
         label: 'Opacity',
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
         type: 'number',
         // title: '',
         placeholder: '0.1-1',
         step: .1,
         min: .1,
         max: 1,
         value: .8,
      },
      copy_url_font_size: {
         _tagName: 'input',
         label: 'Font size',
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
         type: 'number',
         title: 'in em',
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
         placeholder: '0.5-3',
         step: .1,
         min: .5,
         max: 3,
         value: 1.7,
      },
      copy_url_color: {
         _tagName: 'input',
         type: 'color',
         // value: '#DC143C',
         value: '#e85717',
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
         title: 'default - #e85717',
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
   }
});
