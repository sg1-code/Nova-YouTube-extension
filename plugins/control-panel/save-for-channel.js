window.nova_plugins.push({
   id: 'save-channel-state',
   // title: 'Save for specific channel',
   title: 'Add button "Save params for the channel"',
   'title:zh': '특정 채널에 저장',
   'title:ja': '特定のチャンネル用に保存',
   // 'title:ko': '특정 채널에 저장',
   // 'title:vi': '',
   // 'title:id': 'Simpan untuk saluran tertentu',
   // 'title:es': 'Guardar para un canal específico',
   // 'title:pt': 'Salvar para canal específico',
   // 'title:fr': 'Enregistrer pour un canal spécifique',
   // 'title:it': 'Salva per canale specifico',
   // 'title:tr': '',
   // 'title:de': 'Speichern Sie für einen bestimmten Kanal',
   'title:pl': 'Zapisz dla określonego kanału',
   // 'title:ua': 'Зберегти для конкретного каналу',
   run_on_pages: 'watch, embed',
   section: 'control-panel',
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/454696-youtube-defaulter
      // alt2 - https://greasyfork.org/en/scripts/397614-youtube-speed-by-channel
      // alt3 - https://greasyfork.org/en/scripts/27091-youtube-speed-rememberer

      /*
         ** how export channels conf? **
         There isn't currently, but it's easy to copy it over yourself. Press F12 and open Local Storage. In Chrome it's under "Application", expand "Local storage" on the left and select "https://www.youtube.com". In Firefox it's in the "Storage" tab.
         Search for "nova" and you should see "nova-channels-state". Just copy the value from there, move it to the other PC and paste it into the same SELECTOR_BTN_ID entry.
      */

      const
         // container <a>
         SELECTOR_BTN_ID = 'nova-channels-state',
         SELECTOR_BTN = '#' + SELECTOR_BTN_ID,
         SELECTOR_BTN_CLASS_NAME = 'nova-right-custom-button', // same class in "player-buttons-custom" plugin
         // list <ul>
         SELECTOR_BTN_LIST_ID = SELECTOR_BTN_CLASS_NAME + '-list',
         SELECTOR_BTN_LIST = '#' + SELECTOR_BTN_LIST_ID,
         // btn <span>
         SELECTOR_BTN_TITLE_ID = SELECTOR_BTN_CLASS_NAME + '-title';

      // inset button + list
      // NOVA.waitSelector('#movie_player .ytp-left-controls .ytp-play-button')
      NOVA.waitSelector('#movie_player .ytp-right-controls')
         .then(container => {
            initStyles();

            NOVA.runOnPageLoad(async () => {
               if (NOVA.currentPage == 'watch' || NOVA.currentPage == 'embed') {
                  // init storage
                  await NOVA.storage_obj_manager.initStorage();
                  // const
                  //    CACHE_PREFIX = 'nova-channels-state:',
                  //    channelId = NOVA.getChannelId(user_settings['user-api-key']);
                  // // init storage
                  // NOVA.storage_obj_manager.STORAGE_NAME = CACHE_PREFIX + channelId;

                  if (btn = document.getElementById(SELECTOR_BTN_ID)) {
                     btn.append(genList());
                  }
                  else {
                     const btn = document.createElement('button');
                     btn.id = SELECTOR_BTN_ID;
                     btn.classList.add('ytp-button', SELECTOR_BTN_CLASS_NAME);
                     // empty opacity
                     // if (!NOVA.storage_obj_manager.read()) {
                     //    btn.style.opacity = .5;
                     // }
                     // btn.style.minWidth = getComputedStyle(container).width || '48px';
                     btn.title = 'Save channel state';
                     // btnPopup.setAttribute('aria-label','');
                     // btn.textContent = `save`;

                     const btnTitle = document.createElement('span');
                     btnTitle.id = SELECTOR_BTN_TITLE_ID;
                     btnTitle.style.display = 'flex';
                     // btnTitle.innerHTML = NOVA.createSafeHTML(
                     //    `<svg width="100%" height="100%" viewBox="0 0 36 36">
                     //       <g fill="currentColor">
                     //          <path d="M23.4 24.2c-.3.8-1.1 1.4-2 1.4-.9 0-1.7-.6-2-1.4H9.3c-.3 0-.6-.3-.6-.6v-.3c0-.3.3-.6.6-.6h10.1c.3-.9 1.1-1.5 2.1-1.5s1.8.6 2.1 1.5h3.2c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6h-3.4zm-7.7-5.3c-.3.9-1.1 1.5-2.1 1.5s-1.8-.6-2.1-1.5H9.3c-.3 0-.6-.3-.6-.6V18c0-.3.3-.6.6-.6h2.2c.3-.8 1.1-1.4 2.1-1.4s1.8.6 2.1 1.4h11.1c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6H15.7zm7.9-5.4c-.3.8-1.1 1.4-2.1 1.4-.9 0-1.7-.6-2.1-1.4H9.3c-.3 0-.6-.3-.6-.6v-.3c0-.3.3-.6.6-.6h10.1c.3-.9 1.1-1.6 2.1-1.6s1.9.7 2.1 1.6h3.1c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6h-3.1z" />
                     //       </g>
                     //    </svg>`;
                     // `<svg width="100%" height="100%" viewBox="-300 -300 1000 1000">
                     //    <g fill="currentColor">
                     //       <path d="M388.49,0H0.022v453.03h452.986V64.561L388.49,0z M385.017,221.834H110.68V25.691h274.337V221.834z"/>
                     //       <rect x="272.568" y="46.701" width="80.718" height="154.102" />
                     //    </g>
                     // </svg>`);
                     // fix - This document requires 'TrustedHTML' assignment.
                     btnTitle.append((function createSvgIcon() {
                        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svg.setAttribute('width', '100%');
                        svg.setAttribute('height', '100%');
                        svg.setAttribute('viewBox', '0 0 36 36');

                        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                        g.setAttribute('fill', 'currentColor');

                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', 'M23.4 24.2c-.3.8-1.1 1.4-2 1.4-.9 0-1.7-.6-2-1.4H9.3c-.3 0-.6-.3-.6-.6v-.3c0-.3.3-.6.6-.6h10.1c.3-.9 1.1-1.5 2.1-1.5s1.8.6 2.1 1.5h3.2c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6h-3.4zm-7.7-5.3c-.3.9-1.1 1.5-2.1 1.5s-1.8-.6-2.1-1.5H9.3c-.3 0-.6-.3-.6-.6V18c0-.3.3-.6.6-.6h2.2c.3-.8 1.1-1.4 2.1-1.4s1.8.6 2.1 1.4h11.1c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6H15.7zm7.9-5.4c-.3.8-1.1 1.4-2.1 1.4-.9 0-1.7-.6-2.1-1.4H9.3c-.3 0-.6-.3-.6-.6v-.3c0-.3.3-.6.6-.6h10.1c.3-.9 1.1-1.6 2.1-1.6s1.9.7 2.1 1.6h3.1c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6h-3.1z');

                        g.append(path);
                        svg.append(g);

                        return svg;
                     })());

                     btn.prepend(btnTitle);
                     btn.append(genList());
                     // container.after(btn);
                     container.prepend(btn);
                  }
                  btnTitleStateUpdate(Boolean(NOVA.storage_obj_manager.read()));
               }
            });

         });

      function btnTitleStateUpdate(state) {
         document.getElementById(SELECTOR_BTN_TITLE_ID)
            // .style.color = state ? '#27a6e5' : 'inherit';
            // .style.setProperty('color', state ? '#27a6e5' : '');
            ?.style.setProperty('opacity', state ? 1 : .3);
      }

      function genList() {
         // qualityList.textContent = '';
         const ul = document.createElement('ul');
         ul.id = SELECTOR_BTN_LIST_ID;

         // add buttons based on activated plugins
         let listItem = [];
         // if (user_settings['subtitles']) {
         listItem.push({
            // alt - https://greasyfork.org/en/scripts/479068-youtube-subtitle
            name: 'subtitles',
            // to enable on change
            get_current_state: () => {
               movie_player.toggleSubtitlesOn();
               return true;
            },
            custom_apply: () => {
               // Doesn't work
               // NOVA.waitSelector('#movie_player.playing-mode')
               //    .then(movie_player => movie_player.toggleSubtitlesOn());

               // NOVA.waitSelector('#movie_player video', { destroy_after_page_leaving: true })
               //    .then(video => {
               // video.addEventListener('playing', async () => {
               document.addEventListener('playing', () => {
                  if (NOVA.currentPage != 'watch' && NOVA.currentPage != 'embed') return;

                  // await waitMoviePlayer('toggleSubtitlesOn');
                  movie_player.toggleSubtitlesOn();
               }, { capture: true, once: true });
               // });

               // async function waitMoviePlayer(fn_name = required()) {
               //    return await NOVA.waitUntil(() => typeof movie_player === 'object' && typeof movie_player[fn_name] === 'function', 500); // 500ms
               // }
            },
         });
         // }
         // the same name as in the corresponding option inside the plugin
         if (user_settings['video-quality']) {
            listItem.push({ name: 'quality', get_current_state: movie_player.getPlaybackQuality });
         }
         if (user_settings['video-rate']) {
            // listItem.push({ name: 'speed', get_current_state: movie_player.getPlaybackRate });
            listItem.push({ name: 'speed', get_current_state: () => NOVA.videoElement.playbackRate });
         }
         if (user_settings['video-volume']) {
            listItem.push({ name: 'volume', get_current_state: () => Math.round(movie_player.getVolume()) });
         }
         if (user_settings['player-resume-playback']) {
            listItem.push({ name: 'ignore-playback', label: 'unsave playback time' });
         }
         if (user_settings['player-loop']) {
            listItem.push({ name: 'loop' });
         }
         if (user_settings['transcript']) {
            listItem.push({ name: 'transcript' });
         }
         if (user_settings['video-zoom']) {
            listItem.push({
               name: 'zoom',
               get_current_state: () => NOVA.extractAsNum.float(document.body.querySelector('.html5-video-container')?.style.transform)
            });
         }

         // input-checkbox
         listItem.forEach(async el => {
            const storage = NOVA.storage_obj_manager._getParam(el.name);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${el.name}`;
            checkbox.checked = Boolean(storage);
            checkbox.className = 'ytp-menuitem-toggle-checkbox';

            const li = document.createElement('li');
            li.innerHTML = NOVA.createSafeHTML(
               `<label for="checkbox-${el.name}">
                  ${el.label || el.name} <span>${(el.hasOwnProperty('get_current_state') && storage) || ''}</span>
               </label>`);

            // // fix - This document requires 'TrustedHTML' assignment.
            // const label = document.createElement('label');
            // label.setAttribute('for', `checkbox-${el.name}`);

            // label.append(document.createTextNode(`${el.label || el.name}`));

            // if (el.hasOwnProperty('get_current_state') && storage) {
            //    const span = document.createElement('span');
            //    span.textContent = (el.hasOwnProperty('get_current_state') && storage) || '';
            //    label.append(span);
            // }
            // li.append(label);
            // // end fix - This document requires 'TrustedHTML' assignment.

            li.title = storage ? `Currently stored value ${storage}` : 'none';

            if (Boolean(storage) && el.hasOwnProperty('custom_apply') && typeof el.custom_apply === 'function') {
               el.custom_apply();
            }

            checkbox.addEventListener('change', () => {
               let state;
               // update state
               if (checkbox.checked && (state = el.hasOwnProperty('get_current_state') ? el.get_current_state() : true)) {
                  NOVA.storage_obj_manager.save({ [el.name]: state });
               }
               else {
                  NOVA.storage_obj_manager.remove(el.name);
               }
               // show current state
               li.title = state ? `Currently stored value "${state}"` : 'none';
               if (el.hasOwnProperty('get_current_state')) li.querySelector('span').textContent = state || '';
               btnTitleStateUpdate(Boolean(state));
            });

            li.prepend(checkbox);
            ul.append(li);
         });

         // alt - https://greasyfork.org/en/scripts/392459-youtube-automatic-bs-skip
         // input-number (skip_into_sec)
         if (user_settings['time-jump']) {
            const
               SLIDER_LABEL = 'skip into',
               SLIDER_STORAGE_NAME = 'skip-into', // the same name as in the corresponding option inside the plugin [time-jump]
               storage = +NOVA.storage_obj_manager._getParam(SLIDER_STORAGE_NAME);

            const slider = document.createElement('input');
            // slider.type = 'number';
            slider.type = 'range';
            slider.min = 0;
            slider.max = 120;
            slider.step = 1;
            slider.value = storage || 0;
            // slider.placeholder = '0';
            // slider.style.width = '30px';

            const li = document.createElement('li');
            // li.innerHTML = NOVA.createSafeHTML(
            //    `<label for="checkbox-${SLIDER_STORAGE_NAME}">
            //       ${SLIDER_LABEL} <span>${storage || ''}</span>
            //    </label>`);
            // fix - This document requires 'TrustedHTML' assignment.
            const label = document.createElement('label');
            label.setAttribute('for', `checkbox-${SLIDER_STORAGE_NAME}`);

            const labelText = document.createTextNode(SLIDER_LABEL);
            label.append(labelText);

            if (storage) {
               const span = document.createElement('span');
               span.textContent = storage;
               label.append(span);
            }

            li.append(label);
            // end fix - This document requires 'TrustedHTML' assignment.

            // li.title = storage ? `Currently stored value ${storage}` : 'none';
            li.title = 'Simple alternative SponsorBlock';

            slider.addEventListener('change', sliderChange);
            slider.addEventListener('input', sliderChange);
            slider.addEventListener('wheel', evt => {
               evt.preventDefault();
               evt.target.value = +evt.target.value + Math.sign(evt.wheelDelta);
               sliderChange(evt);
            });

            // fot "slider.type = 'number'"
            // const li = document.createElement('li');
            // li.innerHTML = NOVA.createSafeHTML(`<label>${SLIDER_STORAGE_NAME}</label>`);
            // li.title = 'Use arrow to set sec.';

            li.prepend(slider);
            ul.append(li);

            function sliderChange({ target }) {
               // update state
               if (state = +target.value) {
                  NOVA.storage_obj_manager.save({ [SLIDER_STORAGE_NAME]: +target.value });
               }
               else {
                  NOVA.storage_obj_manager.remove(SLIDER_STORAGE_NAME);
               }
               // echo state
               li.title = state ? `Currently stored value ${state}` : 'none';
               li.querySelector('span').textContent = state || '';
               btnTitleStateUpdate(Boolean(state));
            }
         }

         return ul;
      }

      function initStyles() {
         NOVA.css.push(
            SELECTOR_BTN + ` {
               overflow: visible !important;
               position: relative;
               text-align: center !important;
               vertical-align: top;
               font-weight: bold;
            }

            .ytp-left-controls {
               overflow: visible !important;
            }

            ${SELECTOR_BTN_LIST} {
               position: absolute;
               bottom: 2.5em !important;
               left: -2.2em;
               list-style: none;
               padding-bottom: 1.5em !important;
               z-index: calc(${+NOVA.css.get('.ytp-progress-bar', 'z-index')} + 1);
            }

            /* for embed */
            html[data-cast-api-enabled] ${SELECTOR_BTN_LIST} {
               margin: 0;
               padding: 0;
               bottom: 3.3em;
               /* --yt-spec-brand-button-background: #c00; */
            }

            ${SELECTOR_BTN}:not(:hover) ${SELECTOR_BTN_LIST} {
               display: none;
            }
            /*
            ${SELECTOR_BTN}:hover { color: #66afe9 !important; }
            ${SELECTOR_BTN}:active { color: #2196f3 !important; }
            */

            ${SELECTOR_BTN_LIST} li {
               cursor: pointer;
               white-space: nowrap;
               line-height: 1.4;
               background-color: rgba(28, 28, 28, .9);
               margin: .3em 0;
               padding: .5em 1em;
               border-radius: .3em;
               color: white;
               text-align: left !important;
               display: grid;
               grid-template-columns: auto auto;
               align-items: center;
               justify-content: start;
            }

            ${SELECTOR_BTN_LIST} li label {
               cursor: pointer;
               padding-left: 5px;
            }

            ${SELECTOR_BTN_LIST} li.active { background-color: #720000; }
            ${SELECTOR_BTN_LIST} li.disable { color: #666; }
            ${SELECTOR_BTN_LIST} li:not(:hover) { opacity: .8; }
            /* brackets */
            ${SELECTOR_BTN_LIST} li span:not(:empty):before { content: '('; }
            ${SELECTOR_BTN_LIST} li span:not(:empty):after { content: ')'; }

            /* checkbox */
            ${SELECTOR_BTN_LIST} [type="checkbox"] {
               appearance: none;
               outline: none;
               cursor: pointer;
            }

            ${SELECTOR_BTN_LIST} [type="checkbox"]:checked {
               background-color: #f00;
            }

            ${SELECTOR_BTN_LIST} [type="checkbox"]:checked:after {
               left: 20px;
               background-color: white;
            }`);
      }

   },
});
