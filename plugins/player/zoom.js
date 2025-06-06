// for test
// https://www.youtube.com/watch?v=SDjbK8JWA_Y - (1:1)
// https://www.youtube.com/watch?v=OV27taeR4LA - (4:3)
// https://www.youtube.com/watch?v=KOCZaxzZE34 - (91:90)
// https://www.youtube.com/watch?v=z-2w7eAL-98 - (121:120)
// https://www.youtube.com/watch?v=TaQwW5eQZeY - (121:120)
// https://www.youtube.com/watch?v=U9mUwZ47z3E - (mega-wide) - now broken
// https://www.youtube.com/watch?v=I-ekcFSdke8 - (21:9)
// https://www.youtube.com/watch?v=mco3UX9SqDA - (16:9) horizontal black bars
// https://www.youtube.com/watch?v=EqYYmQVs36I - (16:9) horizontal black bars
// https://www.youtube.com/watch?v=EIVgSuuUTwQ - (4:3) horizontal black bars

window.nova_plugins.push({
   id: 'video-zoom',
   title: 'Zoom video',
   // 'title:zh': '缩放视频',
   // 'title:ja': 'ズームビデオ',
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
   run_on_pages: 'watch, embed, -mobile',
   section: 'player',
   desc: 'Remove horizontal black bars',
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
   // 'desc:ua': '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/484376-youtube-video-zoomer
      // alt2 - https://chromewebstore.google.com/detail/zoom-to-fill-ultrawide-vi/adpjimagbfpknkodpofjphpbdlfkeiho
      // alt3 - https://greasyfork.org/en/scripts/16323-youtube-player-controls

      // similar plugins:
      // - "aspect-ratio" - [player-quick-buttons]
      // - [player-resize-ratio]

      const ZOOM_CLASS_NAME = 'nova-zoom';
      const ZOOM_MAX = 250;

      NOVA.waitSelector('.html5-video-container')
         .then(container => {
            let zoomPercent = 100;

            // keyboard (+/-)
            if (user_settings.zoom_hotkey == 'keyboard') {

               document.addEventListener('keydown', evt => {
                  if (!filteredEvent(evt)) return;

                  let delta;
                  switch (user_settings.zoom_hotkey_custom_in.length === 1 ? evt.key : evt.code) {
                     case user_settings.zoom_hotkey_custom_in: delta = 1; break;
                     case user_settings.zoom_hotkey_custom_out: delta = -1; break;
                  }

                  if (delta) {
                     evt.preventDefault();
                     evt.stopPropagation();
                     // evt.stopImmediatePropagation();

                     if (step = +user_settings.zoom_step * Math.sign(delta)) {
                        setScale(zoomPercent + step);
                     }
                  }
               }, { capture: true });
            }
            // mousewheel in player area
            else if (user_settings.zoom_hotkey) {
               // mousewheel in player area
               container.addEventListener('wheel', evt => {
                  evt.preventDefault();
                  evt.stopPropagation();
                  // evt.stopImmediatePropagation();

                  if (evt[user_settings.zoom_hotkey]
                     || (user_settings.zoom_hotkey == 'wheel' && !evt.ctrlKey && !evt.altKey && !evt.shiftKey && !evt.metaKey)
                  ) {
                     const step = +user_settings.zoom_step * Math.sign(evt.wheelDelta);
                     if (step) setScale(zoomPercent + step);
                  }
               }, { capture: true });
            }

            // hotkey max width
            if (hotkey = user_settings.zoom_auto_max_width_hotkey_toggle) {
               document.addEventListener('keyup', evt => {
                  if (!filteredEvent(evt)) return;

                  if ((hotkey.length === 1 ? evt.key : evt.code) === hotkey) {
                     const zoomMax = +user_settings.zoom_auto_max_width || geVideoMaxWidthPercent();
                     setScale(zoomPercent === zoomMax ? 100 : zoomMax);
                  }
               }, { capture: true });
            }

            let customZoom;
            // custom zoom from [save-channel-state] plugin
            if (user_settings['save-channel-state']) {
               NOVA.runOnPageLoad(async () => {
                  if ((NOVA.currentPage == 'watch' || NOVA.currentPage == 'embed')
                     && (customZoom = await NOVA.storage_obj_manager.getParam('zoom')) // returns a fractional value
                  ) {
                     setScale(customZoom * 100); // fractional to pt
                  }
               });
            }

            function setScale(zoom_pt = 100) {
               // console.debug('setScale', ...arguments);
               // limit zoom
               // zoom_pt = Math.max(100, Math.min(geVideoMaxWidthPercent(), +zoom_pt));
               zoom_pt = Math.max(100, Math.min(ZOOM_MAX, Math.trunc(zoom_pt)));

               // disable
               if (zoom_pt === 100 && container.classList.contains(ZOOM_CLASS_NAME)) {
                  container.classList.remove(ZOOM_CLASS_NAME);
                  container.style.removeProperty('transform');
               }
               // enable
               else if (zoom_pt !== 100 && !container.classList.contains(ZOOM_CLASS_NAME)) {
                  container.classList.add(ZOOM_CLASS_NAME);
               }

               // show UI notification
               NOVA.showOSD({
                  'message': `Zoom:`,
                  'ui_value': zoom_pt,
                  'ui_max': ZOOM_MAX,
                  'source': 'zoom',
               });

               // For optimization, don`t update again
               if (zoom_pt === zoomPercent) return;
               // save
               zoomPercent = zoom_pt;

               // Doesn't work scale image from center
               // container.style.setProperty('scale', zoom);
               // container.style.removeProperty('scale');
               // let zoomPercent = step + (+NOVA.css.get(container, 'scale') || 1);

               container.style.setProperty('transform', `scale(${zoom_pt / 100})`);
               // container.style.setProperty('transform', `scale(${zoom_h}, ${zoom_v})`);

               // clear state for next video
               document.addEventListener('yt-navigate-start', () => {
                  container?.style.removeProperty('transform');
               }, { capture: true, once: true });
            }

            function geVideoMaxWidthPercent() {
               return Math.min(ZOOM_MAX, Math.trunc(movie_player.clientWidth / NOVA.videoElement.videoHeight * 100));
            }
            // for css scale you need a percentage and not a resolution
            // NOVA.aspectRatio.sizeToFit({
            //    src_width = 0, src_height = 0,
            //    // max_width = window.innerWidth, maxHeight = window.innerHeight // iframe size
            //    max_width = screen.width, max_height = screen.height // screen size
            // })

            function filteredEvent(evt = required()) {
               if (NOVA.currentPage != 'watch' && NOVA.currentPage != 'embed') return;
               if (NOVA.editableFocused(evt.target)) return;
               if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;

               return true;
            }

            // initStyles
            NOVA.css.push(
               // transform: scale(${zoomPercent});
               `.${ZOOM_CLASS_NAME} {
                  transition: transform 100ms linear;
                  transform-origin: center;
               }
               .${ZOOM_CLASS_NAME} video {
                  position: relative !important;
               }`);
         });

   },
   options: {
      zoom_hotkey: {
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
            { label: 'none', /* value: false */ }, // fill value if no "selected" mark another option
            { label: 'wheel', value: 'wheel' },
            { label: 'shift+wheel', value: 'shiftKey' },
            { label: 'ctrl+wheel', value: 'ctrlKey' },
            { label: 'alt+wheel', value: 'altKey' },
            { label: 'keyboard', value: 'keyboard', selected: true },
         ],
      },
      zoom_hotkey_custom_in: {
         _tagName: 'select',
         label: 'Hotkey zoom in',
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
         // title: '',
         options: [
            { label: '+', value: '+', selected: true },
            // https://css-tricks.com/snippets/javascript/javascript-keycodes/
            // { label: 'ShiftL', value: 'ShiftLeft' },
            // { label: 'ShiftR', value: 'ShiftRight' },
            // { label: 'CtrlL', value: 'ControlLeft' },
            // { label: 'CtrlR', value: 'ControlRight' },
            // { label: 'AltL', value: 'AltLeft' },
            // { label: 'AltR', value: 'AltRight' },
            // { label: 'ArrowUp', value: 'ArrowUp' },
            // { label: 'ArrowDown', value: 'ArrowDown' },
            // { label: 'ArrowLeft', value: 'ArrowLeft' },
            // { label: 'ArrowRight', value: 'ArrowRight' },
            { label: 'A', value: 'KeyA' },
            { label: 'B', value: 'KeyB' },
            { label: 'C', value: 'KeyC' },
            { label: 'D', value: 'KeyD' },
            { label: 'E', value: 'KeyE' },
            { label: 'F', value: 'KeyF' },
            { label: 'G', value: 'KeyG' },
            { label: 'H', value: 'KeyH' },
            { label: 'I', value: 'KeyI' },
            { label: 'J', value: 'KeyJ' },
            { label: 'K', value: 'KeyK' },
            { label: 'L', value: 'KeyL' },
            { label: 'M', value: 'KeyM' },
            { label: 'N', value: 'KeyN' },
            { label: 'O', value: 'KeyO' },
            { label: 'P', value: 'KeyP' },
            { label: 'Q', value: 'KeyQ' },
            { label: 'R', value: 'KeyR' },
            { label: 'S', value: 'KeyS' },
            { label: 'T', value: 'KeyT' },
            { label: 'U', value: 'KeyU' },
            { label: 'V', value: 'KeyV' },
            { label: 'W', value: 'KeyW' },
            { label: 'X', value: 'KeyX' },
            { label: 'Y', value: 'KeyY' },
            { label: 'Z', value: 'KeyZ' },
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
            ']', '[', /*'+',*/ '-', ',', '.', '/', '<', ';', '\\',
         ],
         'data-dependent': { 'zoom_hotkey': ['keyboard'] },
      },
      zoom_hotkey_custom_out: {
         _tagName: 'select',
         label: 'Hotkey zoom out',
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
         // title: '',
         options: [
            { label: '-', value: '-', selected: true },
            // https://css-tricks.com/snippets/javascript/javascript-keycodes/
            { label: 'ShiftL', value: 'ShiftLeft' },
            { label: 'ShiftR', value: 'ShiftRight' },
            { label: 'CtrlL', value: 'ControlLeft' },
            { label: 'CtrlR', value: 'ControlRight' },
            { label: 'AltL', value: 'AltLeft' },
            { label: 'AltR', value: 'AltRight' },
            // { label: 'ArrowUp', value: 'ArrowUp' },
            // { label: 'ArrowDown', value: 'ArrowDown' },
            // { label: 'ArrowLeft', value: 'ArrowLeft' },
            // { label: 'ArrowRight', value: 'ArrowRight' },
            { label: 'A', value: 'KeyA' },
            { label: 'B', value: 'KeyB' },
            { label: 'C', value: 'KeyC' },
            { label: 'D', value: 'KeyD' },
            { label: 'E', value: 'KeyE' },
            { label: 'F', value: 'KeyF' },
            { label: 'G', value: 'KeyG' },
            { label: 'H', value: 'KeyH' },
            { label: 'I', value: 'KeyI' },
            { label: 'J', value: 'KeyJ' },
            { label: 'K', value: 'KeyK' },
            { label: 'L', value: 'KeyL' },
            { label: 'M', value: 'KeyM' },
            { label: 'N', value: 'KeyN' },
            { label: 'O', value: 'KeyO' },
            { label: 'P', value: 'KeyP' },
            { label: 'Q', value: 'KeyQ' },
            { label: 'R', value: 'KeyR' },
            { label: 'S', value: 'KeyS' },
            { label: 'T', value: 'KeyT' },
            { label: 'U', value: 'KeyU' },
            { label: 'V', value: 'KeyV' },
            { label: 'W', value: 'KeyW' },
            { label: 'X', value: 'KeyX' },
            { label: 'Y', value: 'KeyY' },
            { label: 'Z', value: 'KeyZ' },
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
            ']', '[', '+', /*'-',*/ ',', '.', '/', '<', ';', '\\',
         ],
         'data-dependent': { 'zoom_hotkey': ['keyboard'] },
      },
      zoom_step: {
         _tagName: 'input',
         label: 'Hotkey step',
         // 'label:zh': '步',
         // 'label:ja': 'ステップ',
         // 'label:ko': '단계',
         // 'label:vi': '',
         // 'label:id': 'Melangkah',
         // 'label:es': 'Paso',
         // 'label:pt': 'Degrau',
         // 'label:fr': 'Étape',
         // 'label:it': 'Fare un passo',
         // 'label:tr': 'Adım',
         // 'label:de': 'Schritt',
         'label:pl': 'Krok',
         // 'label:ua': 'Крок',
         type: 'number',
         title: 'in %',
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
         placeholder: '%',
         step: 5,
         min: 5,
         max: 50,
         value: 10,
      },
      zoom_auto_max_width_hotkey_toggle: {
         _tagName: 'select',
         label: 'Hotkey toggle fit to width',
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
         title: 'exception square video',
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
         options: [
            // { label: 'none', /* value: false, */ }, // fill value if no "selected" mark another option
            { label: 'none', value: false },
            // https://css-tricks.com/snippets/javascript/javascript-keycodes/
            { label: 'ShiftL', value: 'ShiftLeft' },
            { label: 'ShiftR', value: 'ShiftRight' },
            { label: 'CtrlL', value: 'ControlLeft' },
            { label: 'CtrlR', value: 'ControlRight' },
            { label: 'AltL', value: 'AltLeft' },
            { label: 'AltR', value: 'AltRight' },
            // { label: 'ArrowUp', value: 'ArrowUp' },
            // { label: 'ArrowDown', value: 'ArrowDown' },
            // { label: 'ArrowLeft', value: 'ArrowLeft' },
            // { label: 'ArrowRight', value: 'ArrowRight' },
            { label: 'A', value: 'KeyA' },
            { label: 'B', value: 'KeyB' },
            { label: 'C', value: 'KeyC' },
            { label: 'D', value: 'KeyD' },
            { label: 'E', value: 'KeyE' },
            { label: 'F', value: 'KeyF' },
            { label: 'G', value: 'KeyG' },
            { label: 'H', value: 'KeyH' },
            { label: 'I', value: 'KeyI' },
            { label: 'J', value: 'KeyJ' },
            { label: 'K', value: 'KeyK' },
            { label: 'L', value: 'KeyL' },
            { label: 'M', value: 'KeyM' },
            { label: 'N', value: 'KeyN' },
            { label: 'O', value: 'KeyO' },
            { label: 'P', value: 'KeyP' },
            { label: 'Q', value: 'KeyQ' },
            { label: 'R', value: 'KeyR' },
            { label: 'S', value: 'KeyS' },
            { label: 'T', value: 'KeyT' },
            { label: 'U', value: 'KeyU' },
            { label: 'V', value: 'KeyV' },
            { label: 'W', value: 'KeyW' },
            { label: 'X', value: 'KeyX' },
            { label: 'Y', value: 'KeyY' },
            { label: 'Z', value: 'KeyZ', selected: true },
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
            ']', '[', '+', '-', ',', '.', '/', '<', ';', '\\',
         ],
         // 'data-dependent': { 'player_buttons_custom_items': ['toggle-'] },
      },
      zoom_auto_max_width: {
         _tagName: 'input',
         label: 'Hotkey max width',
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
         title: 'in %',
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
         placeholder: '%',
         step: 1,
         min: 0,
         max: 200,
         value: 130,
         // title: '',
         'data-dependent': { 'zoom_auto_max_width_hotkey_toggle': '!false' },
      },
   }
});
