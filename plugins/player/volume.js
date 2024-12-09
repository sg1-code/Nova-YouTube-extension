// for test
// the adjustment area depends on the video size. Problems are visible at non-standard aspect ratio
// https://www.youtube.com/watch?v=e8ODm-F9-IM - stereo test
// https://www.youtube.com/watch?v=mco3UX9SqDA - audio loudness normalization

window.nova_plugins.push({
   id: 'video-volume',
   title: 'Volume',
   // 'title:zh': '体积',
   // 'title:ja': '音量',
   // 'title:ko': '용량',
   // 'title:vi': '',
   // 'title:id': 'Volume',
   // 'title:es': 'Volumen',
   // 'title:pt': 'Volume',
   // 'title:fr': 'Le volume',
   // 'title:it': 'Volume',
   // 'title:tr': 'Hacim',
   // 'title:de': 'Volumen',
   'title:pl': 'Głośność',
   // 'title:ua': 'Гучність',
   run_on_pages: 'watch, embed, -mobile',
   section: 'player',
   // desc: 'Use mouse wheel to change volume of video',
   desc: 'With mouse wheel',
   'desc:zh': '带鼠标滚轮',
   'desc:ja': 'マウスホイール付き',
   // 'desc:ko': '마우스 휠로',
   // 'desc:vi': '',
   // 'desc:id': 'Dengan roda mouse',
   // 'desc:es': 'Con rueda de ratón',
   // 'desc:pt': 'Com roda do mouse',
   // 'desc:fr': 'Avec molette de la souris',
   // 'desc:it': 'Con rotellina del mouse',
   // 'desc:tr': 'Fare tekerleği ile',
   // 'desc:de': 'Mit mausrad',
   'desc:pl': 'Za pomocą kółka myszy',
   // 'desc:ua': 'З допомогою колеса мишки',
   _runtime: user_settings => {

      // wheel
      // alt1 - https://github.com/wdwind/YouTubeVolumeMouseController
      // alt2 - https://greasyfork.org/en/scripts/376155-youtube-scroll-volume
      // alt3 - https://greasyfork.org/en/scripts/376002-youtube-volume-mouse-controller
      // alt4 - https://greasyfork.org/en/scripts/381929-youtube-mousewheel-volume-control
      // alt5 - https://chromewebstore.google.com/detail/agadcopafaojndinhloilcanpfpbonbk
      // alt6 - https://chromewebstore.google.com/detail/piklelgilkpgdfohojnbkfheigoglokn
      // alt7 - https://greasyfork.org/en/scripts/376002-youtube-volume-mouse-controller

      // hotkey
      // alt - https://greasyfork.org/en/scripts/418121-yt-fixed

      // volume curve
      // alt1 - https://greasyfork.org/en/scripts/404756-youtube-volume-curve-designer
      // alt2 - https://greasyfork.org/en/scripts/426684-youtube-music-logarithmic-exponential-volume
      // alt3 - https://greasyfork.org/en/scripts/397686-youtube-music-fix-volume-ratio

      // max level
      // alt1 - https://chromewebstore.google.com/detail/nnocenjojjcnlijjjikhehebkbgbmmep
      // alt2 - https://chromewebstore.google.com/detail/oggiagogblgafoilijjdhcmflgekfmja
      // alt3 - https://greasyfork.org/en/scripts/427173-maximum-audio-output-for-youtube

      class PlayerState {
         constructor() { }

         addEventListeners(video) {
            // update UI and mute state in session
            video.addEventListener('volumechange', function () {
               // demonstration of different values
               // console.debug('volumechange', movie_player.getVolume(), this.volume);
               // const level = Math.round(this.volume * 100);
               const level = movie_player.getVolume();
               const isMuted = video.muted; // movie_player.isMuted();
               NOVA.showOSD({
                  message: isMuted ? `Muted` : `${level}%`,
                  ui_value: isMuted ? 0 : level,
                  // ui_max: 100,
                  source: 'volume',
               });

               playerVolume.renderVolumeTextSlot();

               if (user_settings.volume_mute_unsave) {
                  playerVolume.saveInSession(movie_player.getVolume());
               }
            });

            if (user_settings.volume_loudness_normalization) {
               this.disableLoudnessNormalization(movie_player);
            }

            this.setDefaultVolume(video);

            if (user_settings.volume_hotkey) {
               this.addHotkeys();
            }
         }

         setDefaultVolume(video) {
            const setDefault = level => video.addEventListener('playing', () => {
               (level > 100 /*&& user_settings.volume_unlimit*/)
                  ? playerVolume.unlimit(level)
                  : playerVolume.set(level);
            }, { capture: true, once: true });

            // init volume_default
            if (+user_settings.volume_default) {
               setDefault(+user_settings.volume_default);
            }

            // custom volume from [save-channel-state] plugin
            if (user_settings['save-channel-state']) {
               NOVA.runOnPageLoad(async () => {
                  if (NOVA.currentPage != 'watch' && NOVA.currentPage != 'embed') return;

                  const customVolume = await NOVA.storage_obj_manager.getParam('volume');
                  if (customVolume) {
                     setDefault(customVolume);
                  }
               });
            }
         }

         addHotkeys() {
            // keyboard
            if (user_settings.volume_hotkey == 'keyboard') {
               document.addEventListener('keydown', evt => {
                  if (NOVA.currentPage != 'watch' && NOVA.currentPage != 'embed') return;
                  if (NOVA.editableFocused(evt.target)) return;
                  if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;

                  let delta = 0;
                  switch (user_settings.volume_hotkey_custom_up.length === 1 ? evt.key : evt.code) {
                     case user_settings.volume_hotkey_custom_up: delta = 1; break;
                     case user_settings.volume_hotkey_custom_down: delta = -1; break;
                  }
                  if (delta) {
                     evt.preventDefault();
                     evt.stopPropagation();
                     // evt.stopImmediatePropagation();

                     playerVolume.adjust(+user_settings.volume_step * Math.sign(delta));
                  }
               }, { capture: true });
            }
            // mousewheel in player area
            else if (user_settings.volume_hotkey) {
               // NOVA.waitSelector('#movie_player') // broken, don't use
               NOVA.waitSelector('.html5-video-container')
                  .then(container => {
                     container.addEventListener('wheel', evt => {
                        evt.preventDefault();

                        if (evt[user_settings.volume_hotkey]
                           || (user_settings.volume_hotkey == 'wheel' && !evt.ctrlKey && !evt.altKey && !evt.shiftKey && !evt.metaKey)
                        ) {
                           const step = +user_settings.volume_step * Math.sign(evt.wheelDelta);
                           if (step) {
                              const volume = playerVolume.adjust(step);
                              // console.debug('current volume:', volume);
                           }
                        }
                     }, { capture: true });
                  });
            }
         }

         // alt1 - https://gist.github.com/WouterG/acf1e901324aed77f466626fb5d6611f
         // alt2 - https://gist.github.com/abec2304/2782f4fc47f9d010dfaab00f25e69c8a
         // alt3 - https://gist.github.com/fa7ad/fa995474f5cb9fe91fb209686881373d
         // alt4 - https://greasyfork.org/en/scripts/513352-no-volume-normalization-4-youtube
         disableLoudnessNormalization(movie_player) {
            // original fn
            const { set } = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');
            // patch fn
            Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
               enumerable: true,
               configurable: true,
               set(new_value) {
                  new_value = movie_player.getVolume() / 100; // normalize
                  // console.debug('volume normalized:', new_value);
                  set.call(this, new_value); // forward to native code
               }
            });
         }
      }

      // alt - https://greasyfork.org/en/scripts/420723-youtube-better-player
      const playerVolume = {
         get() {
            return this.node?.gain.value > 1
               ? movie_player.getVolume() * this.node.gain.value
               : movie_player.getVolume();
         },

         adjust(delta) {
            const level = movie_player?.getVolume() + +delta;
            if (user_settings.volume_unlimit && level > 100) {
               this.unlimit(level);
            }
            else {
               this.set(level);
            }
            // return (user_settings.volume_unlimit && (level > 100)) ? this.unlimit(level) : this.set(level);
         },

         set(level = 50) {
            if (typeof movie_player !== 'object' || typeof movie_player.getVolume !== 'function') {
               console.error('Error: getVolume is not a function');
               return;
            }

            const newLevel = Math.min(100, Math.max(0, +level));

            if (newLevel !== movie_player.getVolume()) {
               if (movie_player.isMuted()) movie_player.unMute();

               movie_player.setVolume(newLevel); // 0 - 100

               // reset gain
               if (this.audioCtx && this.node.gain.value !== 1) {
                  this.node.gain.value = 1; // reset
               }
            }

            return newLevel;
         },

         unlimit(level = 300) {
            // console.debug('unlimit:', level);
            if (level <= 100) {
               console.error('unlimit level less than or equal to 100:', level);
            }

            if (!this.audioCtx) {
               this.audioCtx = new AudioContext();
               const sourceNode = this.audioCtx.createMediaElementSource(NOVA.videoElement);
               this.node = this.audioCtx.createGain();
               this.node.gain.value = Math.trunc(level / 100);
               sourceNode.connect(this.node);
               this.node.connect(this.audioCtx.destination);
            }

            if (this.node.gain.value < 6) { // max 600%
               // this.node.gain.value += .5; // add 50%
               this.node.gain.value += 1; // add 100%
            }

            level = this.get();
            NOVA.showOSD({
               message: `${level}%`,
               ui_value: level,
               ui_max: 600,
               source: 'volume',
            });

            // return `${level}%`;
         },

         // alt - https://greasyfork.org/en/scripts/429143-auto-set-youtube-volume
         saveInSession(level = required()) {
            if (!window?.sessionStorage) return;
            if (typeof level !== 'number') throw new Error('Level must be provided');

            const storageData = {
               creation: Date.now(),
               data: { volume: +level, muted: (level ? 'false' : 'true') },
               // data: { 'volume': +level, 'muted': ((level || user_settings.volume_mute_unsave) ? 'false' : 'true') },
            };

            try {
               // https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API/Using
               localStorage['yt-player-volume'] = JSON.stringify({
                  expiration: Date.now() + 2592e6,
                  ...storageData,
               });
               sessionStorage['yt-player-volume'] = JSON.stringify(storageData);
            } catch (err) {
               console.warn(`${err.name}: save "volume" in sessionStorage failed. It seems that "Block third-party cookies" is enabled`, err.message);
            }
         },

         // alt - https://greasyfork.org/en/scripts/479475-youtube-display-current-volume
         renderVolumeTextSlot(timeout_ms = 800) {
            const defaultVolumeBar = movie_player?.querySelector('.ytp-volume-area');
            if (defaultVolumeBar) {
               // Reset hide timeout
               if (typeof this.timeoutId === 'number') clearTimeout(this.timeoutId);

               // Show volume bar
               defaultVolumeBar.dispatchEvent(new Event('mouseover', { bubbles: true }));

               // Hide volume bar after timeout
               this.timeoutId = setTimeout(() => {
                  defaultVolumeBar.dispatchEvent(new Event('mouseout', { bubbles: true }));
               }, timeout_ms);

               insertToHTML({
                  // createVolumeTextSlot({
                  // 'text': this.get(),
                  'text': movie_player.getVolume(),
                  'container': defaultVolumeBar,
               });
            }

            // function createVolumeTextSlot({ text = '', container = required() }) {
            //    if (!(container instanceof HTMLElement)) {
            //       console.error('Container is not an HTMLElement:', container);
            //       return;
            //    }

            //    const shadowRoot = container.attachShadow({ mode: 'open' });
            //    const slot = document.createElement('slot');
            //    slot.addEventListener('slotchange', () => {
            //       insertToHTML({
            //          text,
            //          container: slot.assignedNodes()[0],
            //       });
            //    });

            //    shadowRoot.append(slot);
            // }

            function insertToHTML({ text = '', container = required() }) {
               // console.debug('insertToHTML', ...arguments);
               if (!(container instanceof HTMLElement)) {
                  console.error('Container is not an HTMLElement:', container);
                  return;
               }

               const SELECTOR_ID = 'nova-volume-text';

               // const shadowRoot = container.shadowRoot || container.attachShadow({ mode: 'open' });
               // const shadowHost = document.createElement('div');
               // const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

               // (document.getElementById(SELECTOR_ID).shadowRoot || (function () {
               (document.getElementById(SELECTOR_ID) || (function () {
                  const SELECTOR = '#' + SELECTOR_ID; // for css
                  NOVA.css.push(
                     `${SELECTOR} {
                        display: none;
                        text-indent: 2px;
                        font-size: 110%;
                        text-shadow: 0 0 2px rgba(0, 0, 0, .5);
                        cursor: default;
                     }
                     ${SELECTOR}:after { content: '%'; }

                     .ytp-volume-control-hover:not([aria-valuenow="0"])+${SELECTOR} {
                        display: block;
                     }`);

                  // const shadowHost = document.createElement('span');
                  // const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
                  // shadowHost.id = SELECTOR_ID;
                  // return container.appendChild(shadowHost);
                  const el = document.createElement('span');
                  el.id = SELECTOR_ID;
                  return container.appendChild(el);
                  // container.insertAdjacentElement('beforeend', shadowHost);
                  // return shadowHost;
                  // 62.88 % slower
                  // container.insertAdjacentHTML('beforeend', NOVA.createSafeHTML(`<span id="${SELECTOR_ID}">${text}</span>`));
                  // return document.getElementById(SELECTOR_ID);
               })())
                  .textContent = text;

               container.title = `${text} %`;
            }
         }
      };

      const player_state = new PlayerState();

      NOVA.waitSelector('#movie_player video')
         .then(video => {
            player_state.addEventListeners(video);
         });

      return
      insertSettingButton()

      function insertElementWithShadowIntoDOM(/*target,*/ shadowContent, css) {
         console.debug('insertElementWithShadowIntoDOM', ...arguments);
         const shadowHost = document.createElement('div');
         const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

         // shadowRoot.innerHTML = NOVA.createSafeHTML(shadowContent);
         if (css) shadowRoot.append(css);
         shadowRoot.append(shadowContent);

         return shadowHost;
         // target.prepend(shadowHost);
      }

      function insertSettingButton() {
         NOVA.waitSelector('#masthead #end')
            .then(menu => {
               const
                  btn = document.createElement('span'),
                  title = 'Nova Settings',
                  SETTING_BTN_ID = 'nova_settings_button';

               // const shadowRoot = btn.attachShadow({ mode: 'open' });

               btn.id = SETTING_BTN_ID;
               // btn.href = configPage + '?tabs=tab-plugins';
               // btn.href = configPage;
               // btn.target = '_blank';
               // btn.textContent = '►';
               // btn.textContent = '▷'; // fix - This document requires 'TrustedHTML' assignment.
               // shadowRoot.innerHTML = NOVA.createSafeHTML(
               btn.innerHTML = NOVA.createSafeHTML(
                  `<yt-icon-button class="style-scope ytd-button-renderer style-default size-default">
                     <svg viewBox="-4 0 20 16">
                        <radialGradient id="nova-gradient" gradientUnits="userSpaceOnUse" cx="6" cy="22" r="18.5">
                           <stop class="nova-gradient-start" offset="0"/>
                           <stop class="nova-gradient-stop" offset="1"/>
                        </radialGradient>
                        <g fill="deepskyblue">
                           <polygon points="0,16 14,8 0,0"/>
                        </g>
                     </svg>
                  </yt-icon-button>`);
               // `<yt-icon-button class="style-scope ytd-button-renderer style-default size-default">
               //    <svg viewBox="-4 0 20 16">
               //       <polygon points="0,16 14,8 0,0" fill="deepskyblue" />
               //    </svg>
               // </yt-icon-button>`);
               // btn.style.cssText = '';
               Object.assign(btn.style, {
                  'font-size': '24px',
                  color: 'deepskyblue',
                  'text-decoration': 'none',
                  padding: '0 10px',
               });
               btn.addEventListener('click', null, { capture: true }); // fix hide <tp-yt-iron-dropdown>

               // insert tooltip
               // btn.setAttribute('tooltip', title); // css (ahs bug on hover search buttom)
               // yt-api
               btn.title = title;
               const tooltip = document.createElement('tp-yt-paper-tooltip');
               tooltip.classList.add('style-scope', 'ytd-topbar-menu-button-renderer');
               // tooltip.setAttribute('role', 'tooltip');
               tooltip.textContent = title;
               // shadowRoot.append(tooltip);
               btn.append(tooltip);

               // const style = document.createElement('style');
               // style.innerHTML += `#${SETTING_BTN_ID} button {display: contents;}`;
               // style.innerHTML += (
               NOVA.css.push(
                  `#${SETTING_BTN_ID}[tooltip]:hover:after {
                     position: absolute;
                     top: 50px;
                     transform: translateX(-50%);
                     content: attr(tooltip);
                     text-align: center;
                     min-width: 3em;
                     max-width: 21em;
                     white-space: nowrap;
                     overflow: hidden;
                     text-overflow: ellipsis;
                     padding: 1.8ch 1.2ch;
                     border-radius: .6ch;
                     background-color: #616161;
                     box-shadow: 0 1em 2em -0.5em rgb(0 0 0 / 35%);
                     color: white;
                     z-index: 1000;
                  }

                  #${SETTING_BTN_ID} {
                     position: relative;
                     opacity: .3;
                     transition: opacity 300ms ease-out;
                  }

                  #${SETTING_BTN_ID}:hover {
                     opacity: 1;
                  }

                  /*
                  #${SETTING_BTN_ID} polygon {
                     fill: deepskyblue;
                     transition: fill 600ms;
                  }

                  #${SETTING_BTN_ID}:hover polygon {
                     fill: #0095ff;
                  }
                  */

                  #${SETTING_BTN_ID} path,
                  #${SETTING_BTN_ID} polygon {
                     fill: url(#nova-gradient);
                  }

                  #${SETTING_BTN_ID} .nova-gradient-start,
                  #${SETTING_BTN_ID} .nova-gradient-stop {
                     transition: 600ms;
                     stop-color: #7a7cbd;
                  }

                  #${SETTING_BTN_ID}:hover .nova-gradient-start {
                     stop-color: #0ff;
                  }

                  #${SETTING_BTN_ID}:hover .nova-gradient-stop {
                     stop-color: #0095ff;
                     /*stop-color: #fff700;*/
                  }`);

               // btn.append(style);
               // menu.attachShadow({ mode: 'open' });
               // menu.shadowRoot.prepend(btn);
               // menu.prepend(btn);

               insertElementWithShadowIntoDOM(menu, btn);

               // const btn = document.createElement('button');
               // btn.className = 'ytd-topbar-menu-button-renderer';
               // btn.title = 'Nova Settings';
               // btn.innerHTML =
               //    `<svg width="24" height="24" viewBox="0 0 24 24">
               //       <g fill="deepskyblue">
               //          <polygon points='21 12 3,1.8 3 22.2' />
               //          <path d='M3 1.8v20.4L21 12L3 1.8z M6 7l9 5.1l-9 5.1V7z' />
               //       </g>
               //    </svg>`;
               // btn.style.cssText = '';
               // Object.assign(btn.style, {
               //    // color: 'var(--yt-spec-text-secondary)',
               //    padding: '0 24px',
               //    border: 0,
               //    outline: 0,
               //    cursor: 'pointer',
               // });
               // btn.addEventListener('click', () => parent.open(configPage + '?tabs=tab-plugins'));
               // // menu.insertBefore(btn, menu.lastElementChild);
               // menu.prepend(btn);
            });
      }

   },
   options: {
      volume_default: {
         _tagName: 'input',
         // label: 'Level at startup',
         label: 'Default level',
         // 'label:zh': '默认音量',
         // 'label:ja': 'デフォルトのボリューム',
         // 'label:ko': '기본 볼륨',
         // 'label:vi': '',
         // 'label:id': 'Tingkat default',
         // 'label:es': 'Volumen predeterminado',
         // 'label:pt': 'Volume padrão',
         // 'label:fr': 'Volume par défaut',
         // 'label:it': 'Livello predefinito',
         // 'label:tr': 'Varsayılan ses',
         // 'label:de': 'Standardlautstärke',
         'label:pl': 'Poziom domyślny',
         // 'label:ua': 'Базовий рівень',
         type: 'number',
         title: '0 - auto',
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
         min: 0,
         // max: 100,
         max: 600, // from playerVolume.unlimit
         value: 100,
      },
      volume_hotkey: {
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
            { label: 'none', value: false },
            { label: 'wheel', value: 'wheel', selected: true },
            { label: 'shift+wheel', value: 'shiftKey' },
            { label: 'ctrl+wheel', value: 'ctrlKey' },
            { label: 'alt+wheel', value: 'altKey' },
            { label: 'keyboard', value: 'keyboard' },
         ],
      },
      volume_step: {
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
         min: 1,
         // step: 5,
         // min: 5,
         max: 30,
         value: 10,
         'data-dependent': { 'volume_hotkey': ['!false'] },
      },
      volume_hotkey_custom_up: {
         _tagName: 'select',
         label: 'Hotkey up',
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
            // https://css-tricks.com/snippets/javascript/javascript-keycodes/
            // { label: 'ShiftL', value: 'ShiftLeft' },
            // { label: 'ShiftR', value: 'ShiftRight' },
            // { label: 'CtrlL', value: 'ControlLeft' },
            // { label: 'CtrlR', value: 'ControlRight' },
            // { label: 'AltL', value: 'AltLeft' },
            // { label: 'AltR', value: 'AltRight' },
            { label: 'ArrowUp', value: 'ArrowUp', selected: true },
            { label: 'ArrowDown', value: 'ArrowDown' },
            { label: 'ArrowLeft', value: 'ArrowLeft' },
            { label: 'ArrowRight', value: 'ArrowRight' },
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
            /*']',*/ '[', '+', '-', ',', '.', '/', '<', ';', '\\',
         ],
         'data-dependent': { 'volume_hotkey': ['keyboard'] },
      },
      volume_hotkey_custom_down: {
         _tagName: 'select',
         label: 'Hotkey down',
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
            // https://css-tricks.com/snippets/javascript/javascript-keycodes/
            // { label: 'ShiftL', value: 'ShiftLeft' },
            // { label: 'ShiftR', value: 'ShiftRight' },
            // { label: 'CtrlL', value: 'ControlLeft' },
            // { label: 'CtrlR', value: 'ControlRight' },
            // { label: 'AltL', value: 'AltLeft' },
            // { label: 'AltR', value: 'AltRight' },
            { label: 'ArrowUp', value: 'ArrowUp' },
            { label: 'ArrowDown', value: 'ArrowDown', selected: true },
            { label: 'ArrowLeft', value: 'ArrowLeft' },
            { label: 'ArrowRight', value: 'ArrowRight' },
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
            /*']',*/ '[', '+', '-', ',', '.', '/', '<', ';', '\\',
         ],
         'data-dependent': { 'volume_hotkey': ['keyboard'] },
      },
      volume_unlimit: {
         _tagName: 'input',
         label: 'Hotkey allow above 100%',
         // 'label:zh': '允许超过 100%',
         // 'label:ja': '100％以上を許可する',
         // 'label:ko': '100% 이상 허용',
         // 'label:vi': '',
         // 'label:id': 'Izinkan di atas 100%',
         // 'label:es': 'Permitir por encima del 100%',
         // 'label:pt': 'Permitir acima de 100%',
         // 'label:fr': 'Autoriser au-dessus de 100 %',
         // 'label:it': 'Consenti oltre il 100%',
         // 'label:tr': "%100'ün üzerinde izin ver",
         // 'label:de': 'Über 100 % zulassen',
         // 'label:pl': 'Zezwól powyżej 100%',
         // 'label:ua': 'Дозволити більше 100%',
         type: 'checkbox',
         title: 'With sound distortion',
         // title: 'allow set volume above 100%',
         // 'title:zh': '允许设定音量高于 100%',
         // 'title:ja': '100％を超える設定ボリュームを許可する',
         // 'title:ko': '100% 이상의 설정 볼륨 허용',
         // 'title:vi': '',
         // 'title:id': 'izinkan volume yang disetel di atas 100%',
         // 'title:es': 'permitir el volumen establecido por encima del 100%',
         // 'title:pt': 'permitir volume definido acima de 100%',
         // 'title:fr': 'autoriser le réglage du volume au-dessus de 100 %',
         // 'title:it': 'consentire volume impostato superiore al 100%',
         // 'title:tr': "%100'ün üzerinde ses ayarına izin ver",
         // 'title:de': 'eingestellte Lautstärke über 100% zulassen',
         // 'title:pl': 'zezwala ustawić powyżej 100%',
         // 'title:ua': 'Дозволити встановити звук більше 100%',
         'data-dependent': { 'volume_hotkey': ['!false'] },
      },
      volume_mute_unsave: {
         _tagName: 'input',
         // Force unmute for videos opened in new tabs while another video is muted
         label: 'Not keep muted state',
         // label: 'disable mute save state',
         // label: 'disable mute memory state',
         // 'label:zh': '不保存静音模式',
         // 'label:ja': 'マナーモードを保存しない',
         // 'label:ko': '무음 모드를 저장하지 않음',
         // 'label:vi': '',
         // 'label:id': 'Jangan simpan mode senyap',
         // 'label:es': 'No guarde el modo silencioso',
         // 'label:pt': 'Não salve o modo silencioso',
         // 'label:fr': 'Ne pas enregistrer le mode silencieux',
         // 'label:it': 'Non salvare la modalità silenziosa',
         // 'label:tr': 'Ne pas enregistrer le mode silencieux',
         // 'label:de': 'Silent-Modus nicht speichern',
         'label:pl': 'Nie zachowuj wyciszonego stanu',
         // 'label:ua': 'Не зберігати беззвучний режим',
         type: 'checkbox',
         title: 'Only affects new tabs',
         // 'title:zh': '只影响新标签',
         // 'title:ja': '新しいタブにのみ影響します',
         // 'title:ko': '새 탭에만 영향',
         // 'title:vi': '',
         // 'title:id': 'Hanya memengaruhi tab baru',
         // 'title:es': 'Solo afecta a las pestañas nuevas',
         // 'title:pt': 'Afeta apenas novas guias',
         // 'title:fr': "N'affecte que les nouveaux onglets",
         // 'title:it': 'Riguarda solo le nuove schede',
         // 'title:tr': 'Yalnızca yeni sekmeleri etkiler',
         // 'title:de': 'Wirkt sich nur auf neue Registerkarten aus',
         'title:pl': 'Dotyczy tylko nowych kart',
         // 'title:ua': 'Діє лише на нові вкладки',
      },
      volume_loudness_normalization: {
         _tagName: 'input',
         // label: 'Disable YouTube's audio loudness normalization',
         // label: 'Stable volume level',
         // label: 'Disable audio loudness normalization',
         label: 'Disable loudness normalization',
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
         title: 'Boost volume level',
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
