// https://www.youtube.com/watch?v=9EvbqxBUG_c - great for testing
// https://www.youtube.com/watch?v=Il0S8BoucSA&t=99 - subtitle alignment bug
// https://www.youtube.com/watch?v=s1ipx-4oTKA - color (red) subtitles
// https://www.youtube.com/watch?v=nx3qbMiOTD8?t=70 - musti subs
// https://www.youtube.com/watch?v=X0ylty8OBbY - by one word
// https://www.youtube.com/watch?v=bOHxtOLfvIo - music

window.nova_plugins.push({
   // id: 'subtitle-dual',
   // title: 'Subtitles (captions) style',
   // title: 'Double language subtitle',
   // 'title:zh': '双语字幕',
   id: 'subtitle',
   title: 'Custom subtitle',
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
   run_on_pages: 'watch, embed, -mobile',
   section: 'player-control',
   // desc: '',
   _runtime: user_settings => {

      // download
      // alt - https://greasyfork.org/en/scripts/516645-youtube-enhancer-subtitle-downloader

      // alt - https://greasyfork.org/en/scripts/508005-youtube-prevent-subtitle-auto-translation
      if (user_settings.subtitle_auto_translate_disable
         && window?.localStorage
         && localStorage.hasOwnProperty('yt-player-caption-sticky-language')
      ) {
         localStorage.removeItem('yt-player-caption-sticky-language');
      }

      const LANGS = Array.isArray(user_settings.subtitle_langs)
         ? user_settings.subtitle_langs
         : [user_settings.subtitle_langs || document.documentElement.lang || navigator.language]; // follow the language used in YouTube page

      // NOVA.waitSelector('#ytd-player #container #movie_player video') // Solution 1. Placement Position
      NOVA.waitSelector('#movie_player video') // Solution 2. Placement Position
         .then(video => {
            const subtitlesWrapper = Subtitle.create();

            if (user_settings.subtitle_draggable) {
               const makeDraggable = new NOVA.Draggable(movie_player);
               makeDraggable.init(subtitlesWrapper);
            }

            // video.addEventListener('loadeddata', () => subtitlesRoot.textContent = '');

            video.addEventListener('timeupdate', () => Subtitle.update(video.currentTime));
            video.addEventListener('seeking', () => {
               Subtitle.updateLastSubtitleIdx = -1;
               Subtitle.update(video.currentTime);
            });

            // on subtitles toggle
            NOVA.waitSelector('.ytp-subtitles-button')
               .then(caption_btn => {
                  // Create a new MutationObserver instance
                  new MutationObserver((mutations) => {
                     mutations.forEach((mutation) => {
                        // console.debug('', mutation.type, mutation.attributeName);
                        if (mutation.type === 'attributes'
                           // && mutation.attributeName === 'aria-pressed'
                        ) {
                           Subtitle.updateSubtitlesVisibility();
                        }
                     });
                  })
                     .observe(caption_btn, {
                        attributes: true,
                        // attributeFilter: ['aria-pressed'],
                     });

                  // function checkCaptionState() {
                  //    const captionsBtn = document.querySelector('.ytp-subtitles-button');
                  //    return captionsBtn.classList.contains('ytp-button-active');
                  //    return captionsBtn.getAttribute('aria-pressed') === 'true';
                  // }
               });

            // function renderCue(cue, idx) {
            //    const template = createVTTCueTemplate(cue);
            //    // subtitlesRoot.append(template.cloneNode(true));
            //    const subtitleElements = document.querySelectorAll('.subtitle');
            //    // subtitleElements[idx].classList.replace('inactive', 'active');
            //    subtitleElements[idx + 1]?.remove(); // remove temp next
            //    subtitleElements[idx - 1]?.classList.add('unfocus'); // prev
            //    subtitlesRoot.append(template); // curr
            //    subtitlesRoot.append(createVTTCueTemplate(subtitlesData[idx + 1])); // temp next
            //    subtitleElements[idx + 1]?.classList.add('unfocus'); // next

            //    // hide old
            //    if (subtitleElements.length > 3) {
            //       for (let i = 0; i < subtitleElements.length - 3; i++) {
            //          //  element.removeChild(element.firstChild);
            //          subtitleElements[i]?.classList.replace('active', 'inactive');
            //       }
            //    }
            // }

            // function renderCue(cue, idx) {
            //    const template = createVTTCueTemplate(cue);
            //    const subtitlesRoot = document.querySelector('.cue-container');
            //    const subtitleElements = Array.from(subtitlesRoot.children);

            //    // Remove 'unfocus' class from current cue if it exists
            //    subtitleElements[idx]?.classList.remove('unfocus');

            //    // Add 'unfocus' class to prev and next cues, without duplicating the next cue
            //    subtitleElements[idx - 1]?.classList.add('unfocus'); // prev

            //    // Append new cue at the end of the container
            //    // subtitlesRoot.append(template);

            //    // Scroll to show current cue if it's not already visible
            //    const currentCueRect = template.getBoundingClientRect();
            //    const containerRect = subtitlesRoot.getBoundingClientRect();
            //    if (currentCueRect.top < containerRect.top || currentCueRect.bottom > containerRect.bottom) {
            //       subtitlesRoot.scrollTop = currentCueRect.top - containerRect.top;
            //       // scrollToElement(template);
            //    }

            //    // Remove old cues that are no longer visible
            //    while (subtitleElements.length > 3 && subtitleElements[0].getBoundingClientRect().top < 0) {
            //       subtitlesRoot.remove(subtitleElements.shift());
            //    }
            // }

            // function createVTTCueTemplate(cue) {
            //    // console.debug('cue', cue);
            //    const template = document.createElement('div');
            //    template.classList.add('subtitle', 'active');
            //    // template.textContent = cue.segs[0].utf8; // regular text
            //    template.innerHTML = NOVA.createSafeHTML(convertMarkdown(cue.text)); // md
            //    return template;
            // }
         });

      const Subtitle = {
         // subtitlesData:
         //    [
         //       {
         //          start, // sec
         //          duration, // sec
         //          parts: {
         //             text,
         //             offset,
         //          },
         //       },
         //       ...
         //    ],

         SELECTOR_PREFIX: 'nova-subtitle',
         SELECTOR_ID: `nova-subtitle-wrapper`, // `${Subtitle.SELECTOR_PREFIX}-wrapper`,

         create() {
            NOVA.css.push(
               `#ytp-caption-window-container {
                  display: none;
               }

               #${this.SELECTOR_ID} {
                  display: none;
                  position: absolute;
                  left: 50%;
                  transform: translate(-50%, 0);
                  bottom: ${user_settings['player-float-progress-bar'] ? +user_settings.player_float_progress_bar_height : 0}px;
                  --zIndex: ${1 + Math.max(
                  NOVA.css.get('.ytp-chrome-bottom', 'z-index'),
                  NOVA.css.get('.ytp-progress-bar', 'z-index'),
                  // NOVA.css.get('#masthead-container', 'z-index'), // on moving
                  58)};
                  z-index: var(--zIndex);
               }

               /* Solution 1. Placement Position */
               #movie_player:has(.ytp-chrome-bottom:hover) ~ #${this.SELECTOR_ID} {
                  z-index: -1;
               }
               /* Solution 2. Placement Position */
               .ytp-chrome-bottom:hover ~ #${this.SELECTOR_ID} {
                  opacity: .35;
                  z-index: calc(var(--zIndex) - 2);
               }

               .${this.SELECTOR_PREFIX}-buttons-container {
                  position: absolute;
                  right: 0;
                  top: 0;
                  transform: translate(0%, -100%);
                  display: none;
                  gap: .5em;
               }
               #${this.SELECTOR_ID}:hover .${this.SELECTOR_PREFIX}-buttons-container {
                  height: 1.6em;
               }
               #${this.SELECTOR_ID}:hover .${this.SELECTOR_PREFIX}-buttons-container,
               .${this.SELECTOR_PREFIX}-buttons-container:has(>input[type=search]:focus) {
                  display: flex;
               }
               .${this.SELECTOR_PREFIX}-buttons-container button,
               .${this.SELECTOR_PREFIX}-buttons-container span {
                  cursor: pointer;
               }
               .${this.SELECTOR_PREFIX}-buttons-container input[type=search] {
                  width: 8em;
               }

               .subtitle {
                  margin: 0 .2em;
                  transition1: transform .3s ease-in-out;
               }
               .subtitle.active {
                  display1: block;
               }
               .subtitle.inactive {
                  display1: none;
                  color: whitesmoke;
                  opacity: .6;
               }
               .subtitle.unfocus {
                  color: lightslategray;
                  /* opacity: .6; */
               }

               .subtitle i, .subtitle em {
                  color: lightskyblue;
               }
               .subtitle .mention {
                  font-style: italic;
                  color: coral;
               }
               .subtitle .music {
                  font-style: italic;
                  color: khaki;
               }
               .subtitle a {
                  color: #3ea6ff;
               }

               .nova-subtitles-text-container {
                  overflow-y: hidden;
                  max-height: 5em;

                  color: ${user_settings.subtitle_color || '#fff'};
                  background-color: rgba(0, 0, 0, ${+user_settings.subtitle_transparent || .5});
                  padding: 5px;
                  /* font-size: calc(5px * ${+user_settings.subtitle_font_size || 1}); */
                  font-size: ${+user_settings.subtitle_font_size || 1}em;
                  ${user_settings.subtitle_bold
                  ? `text-shadow: rgb(0, 0, 0) 0 0 .1em,
                     rgb(0, 0, 0) 0 0 .2em,
                     rgb(0, 0, 0) 0 0 .4em`
                  : ''};
               }
               #${this.SELECTOR_ID}:hover .nova-subtitles-text-container {
                  overflow-y: auto;
               }

               a.${this.SELECTOR_PREFIX}-time {
                  cursor: pointer;
                  ${user_settings.subtitle_show_time ? '' : 'display: none'};
                  color: ghostwhite;
                  margin-right: .3em;
               }
               #${this.SELECTOR_ID}:hover a.${this.SELECTOR_PREFIX}-time {
                  display: revert;
               }
               a.${this.SELECTOR_PREFIX}-time:hover {
                  text-decoration: underline;
               }`);

            const subtitlesWrapper = document.createElement('div');
            subtitlesWrapper.id = this.SELECTOR_ID;
            // stupid attempt to prevent video playback when dragging
            // subtitlesWrapper.addEventListener('click', evt => {
            //    evt.preventDefault();
            // });

            const subtitlesTextContainer = document.createElement('div');
            subtitlesTextContainer.id = `${this.SELECTOR_PREFIX}-container`;
            subtitlesTextContainer.className = 'nova-subtitles-text-container';
            // loading msg
            const pre = document.createElement('pre');
            pre.textContent = 'Loading data...';
            subtitlesTextContainer.append(pre);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = `${this.SELECTOR_PREFIX}-buttons-container`;

            // search
            const searchInput = document.createElement('input');
            searchInput.setAttribute('type', 'search');
            searchInput.setAttribute('placeholder', 'Filter');
            // Object.assign(searchInput.style, {
            //    padding: '.4em .6em',
            //    // border: 0,
            //    // 'border-radius': '4px',
            //    'margin-bottom': '1.5em',
            // });

            // Solution 1. Placement Position
            document.addEventListener('keydown', evt => {
               // if (!evt.isTrusted || !evt.target.matches('input')) return;
               if (evt.isTrusted && evt.target.isSameNode(searchInput)) {
                  evt.preventDefault();
                  evt.stopPropagation();
                  // evt.stopImmediatePropagation();
               }
            }, { capture: true });
            // Solution 2. Placement Position
            ['change', 'keyup'].forEach(evt => {
               searchInput.addEventListener(evt, function () {
                  NOVA.searchFilterHTML({
                     'keyword': this.value,
                     'search_selectors': '.nova-subtitles-text-container .subtitle',
                     'filter_selector': '.nova-subtitle-text',
                     'highlight_class': 'nova-mark-text',
                  });
               });
            });
            // clear search-box
            searchInput.addEventListener('dblclick', () => {
               searchInput.value = '';
               searchInput.dispatchEvent(new Event('change'));
            });

            // copy
            // alt - https://greasyfork.org/en/scripts/500083-quick-copy-youtube-subtitles
            // const copyBtn = document.createElement('button');
            const copyBtn = document.createElement('span');
            if (navigator.clipboard?.write) {
               // copyBtn.textContent = 'Copy';
               // copyBtn.innerHTML = NOVA.createSafeHTML(
               //    `<svg viewBox="0 0 52 52" width="100%" height="100%">
               //       <g fill="currentColor">
               //          <path d="M44,2H18c-2.2,0-4,1.8-4,4v2h24c2.2,0,4,1.8,4,4v28h2c2.2,0,4-1.8,4-4V6C48,3.8,46.2,2,44,2z" />
               //          <path d="M38,16c0-2.2-1.8-4-4-4H8c-2.2,0-4,1.8-4,4v30c0,2.2,1.8,4,4,4h26c2.2,0,4-1.8,4-4V16z M20,23 c0,0.6-0.4,1-1,1h-8c-0.6,0-1-0.4-1-1v-2c0-0.6,0.4-1,1-1h8c0.6,0,1,0.4,1,1V23z M28,39c0,0.6-0.4,1-1,1H11c-0.6,0-1-0.4-1-1v-2 c0-0.6,0.4-1,1-1h16c0.6,0,1,0.4,1,1V39z M32,31c0,0.6-0.4,1-1,1H11c-0.6,0-1-0.4-1-1v-2c0-0.6,0.4-1,1-1h20c0.6,0,1,0.4,1,1V31z" />
               //       </g>
               //    </svg>`);
               copyBtn.append((function createSvgIcon() {
                  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  svg.setAttribute('width', '100%');
                  svg.setAttribute('height', '100%');
                  svg.setAttribute('viewBox', '0 0 52 52');

                  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  g.setAttribute('fill', 'currentColor');

                  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  path1.setAttribute('d', 'M44,2H18c-2.2,0-4,1.8-4,4v2h24c2.2,0,4,1.8,4,4v28h2c2.2,0,4-1.8,4-4V6C48,3.8,46.2,2,44,2z');

                  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  path2.setAttribute('d', 'M38,16c0-2.2-1.8-4-4-4H8c-2.2,0-4,1.8-4,4v30c0,2.2,1.8,4,4,4h26c2.2,0,4-1.8,4-4V16z M20,23 c0,0.6-0.4,1-1,1h-8c-0.6,0-1-0.4-1-1v-2c0-0.6,0.4-1,1-1h8c0.6,0,1,0.4,1,1V23z M28,39c0,0.6-0.4,1-1,1H11c-0.6,0-1-0.4-1-1v-2 c0-0.6,0.4-1,1-1h16c0.6,0,1,0.4,1,1V39z M32,31c0,0.6-0.4,1-1,1H11c-0.6,0-1-0.4-1-1v-2c0-0.6,0.4-1,1-1h20c0.6,0,1,0.4,1,1V31z');

                  g.append(path1, path2);
                  svg.append(g);

                  return svg;
               })());

               // copyBtn.title = 'Like for summarize';
               copyBtn.title = 'Copy';
               copyBtn.addEventListener('click', () => {
                  navigator.clipboard.writeText(
                     [...document.querySelectorAll(`.${this.SELECTOR_PREFIX}-text`)]
                        .map(el => el.innerText).join('\n')
                  )
                     .then(() => NOVA.showOSD({ message: 'Screenshot copied to clipboard', source: 'subtitle' }))
                     .catch(error => {
                        console.error('Failed to copy to clipboard:\n', error);
                        // Failed to copy to clipboard. NotAllowedError: Failed to execute 'write' on 'Clipboard': Document is not focused
                        if (error.name === 'NotAllowedError') {
                           alert('Clipboard access denied. Tab context is not focused');
                        }
                        NOVA.showOSD({ message: 'Failed to copy screenshot', source: 'subtitle' });
                     });
               });
            }

            // langs
            const selectLang = document.createElement('select');
            const isoLangs = {
               af: { name: 'Afrikaans', nativeName: 'Afrikaans' }, sq: { name: 'Albanian', nativeName: 'Shqip' }, ar: { name: 'Arabic', nativeName: 'العربية' }, az: { name: 'Azerbaijani', nativeName: 'azərbaycan dili' }, eu: { name: 'Basque', nativeName: 'euskara' }, bn: { name: 'Bengali', nativeName: 'বাংলা' }, be: { name: 'Belarusian', nativeName: 'Беларуская' }, bg: { name: 'Bulgarian', nativeName: 'български език' }, ca: { name: 'Catalan; Valencian', nativeName: 'Català' }, zh: { name: 'Chinese', nativeName: '中文 (Zhōngwén), 汉语, 漢語' }, hr: { name: 'Croatian', nativeName: 'hrvatski' }, cs: { name: 'Czech', nativeName: 'česky, čeština' }, da: { name: 'Danish', nativeName: 'dansk' }, nl: { name: 'Dutch', nativeName: 'Nederlands, Vlaams' }, en: { name: 'English', nativeName: 'English' }, eo: { name: 'Esperanto', nativeName: 'Esperanto' }, et: { name: 'Estonian', nativeName: 'eesti, eesti keel' }, tl: { name: 'Tagalog', nativeName: 'Wikang Tagalog, ᜏᜒᜃᜅ᜔ ᜆᜄᜎᜓᜄ᜔' }, fi: { name: 'Finnish', nativeName: 'suomi, suomen kieli' }, fr: { name: 'French', nativeName: 'français, langue française' }, gl: { name: 'Galician', nativeName: 'Galego' }, ka: { name: 'Georgian', nativeName: 'ქართული' }, de: { name: 'German', nativeName: 'Deutsch' }, el: { name: 'Greek', nativeName: 'Ελληνικά' }, gu: { name: 'Gujarati', nativeName: 'ગુજરાતી' }, ht: { name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen' }, iw: { name: 'Hebrew', nativeName: 'עברית' }, hi: { name: 'Hindi', nativeName: 'हिन्दी, हिंदी' }, hu: { name: 'Hungarian', nativeName: 'Magyar' }, is: { name: 'Icelandic', nativeName: 'Íslenska' }, id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia' }, ga: { name: 'Irish', nativeName: 'Gaeilge' }, it: { name: 'Italian', nativeName: 'Italiano' }, ja: { name: 'Japanese', nativeName: '日本語 (にほんご／にっぽんご)' }, kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ' }, ko: { name: 'Korean', nativeName: '한국어 (韓國語), 조선말 (朝鮮語)' }, la: { name: 'Latin', nativeName: 'latine, lingua latina' }, lv: { name: 'Latvian', nativeName: 'latviešu valoda' }, lt: { name: 'Lithuanian', nativeName: 'lietuvių kalba' }, mk: { name: 'Macedonian', nativeName: 'македонски јазик' }, ms: { name: 'Malay', nativeName: 'bahasa Melayu, بهاس ملايو‎' }, mt: { name: 'Maltese', nativeName: 'Malti' }, no: { name: 'Norwegian', nativeName: 'Norsk bokmål' }, fa: { name: 'Persian', nativeName: 'فارسی' }, pl: { name: 'Polish', nativeName: 'polski' }, pt: { name: 'Portuguese', nativeName: 'Português' }, ro: { name: 'Romanian, Moldavian', nativeName: 'română' }, ru: { name: 'Russian', nativeName: 'русский язык' }, sr: { name: 'Serbian', nativeName: 'српски језик' }, sk: { name: 'Slovak', nativeName: 'slovenčina' }, sl: { name: 'Slovenian', nativeName: 'slovenščina' }, es: { name: 'Spanish', nativeName: 'español, castellano' }, sw: { name: 'Swahili', nativeName: 'Kiswahili' }, sv: { name: 'Swedish', nativeName: 'svenska' }, ta: { name: 'Tamil', nativeName: 'தமிழ்' }, te: { name: 'Telugu', nativeName: 'తెలుగు' }, th: { name: 'Thai', nativeName: 'ไทย' }, tr: { name: 'Turkish', nativeName: 'Türkçe' }, uk: { name: 'Ukrainian', nativeName: 'українська' }, ur: { name: 'Urdu', nativeName: 'اردو' }, vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt' }, cy: { name: 'Welsh', nativeName: 'Cymraeg' }, yi: { name: 'Yiddish', nativeName: 'ייִדיש' }
            };
            Object.entries(isoLangs).forEach(([code, lang]) => {
               const availableLangs = YoutubeSubtitle.getSubtitlesList()?.find(item => item.code === code);

               if (!availableLangs && !LANGS.includes(code)) return;

               const option = document.createElement('option');
               option.value = code;
               option.textContent = availableLangs
                  ? `${availableLangs.language}*`
                  : lang.name;
               selectLang.append(option);
            });
            selectLang.addEventListener('change', async function () {
               const responseJson = await YoutubeSubtitle.fetchSubtitle(selectLang.value);
               Subtitle.subtitlesData = YoutubeSubtitle.parse(responseJson.events);
               Subtitle.updateSubtitlesVisibility();
               Subtitle.render();
            });

            // const languages = [
            //    { label: 'English', url: 'http://example.com/subtitle1' },
            // ];
            // function createDropdown(languages, videoTitle) {
            //    const dropdown = document.createElement('div');
            //    dropdown.className = 'subtitle-dropdown';

            //    const titleDiv = document.createElement('div');
            //    titleDiv.className = 'subtitle-dropdown-title';
            //    titleDiv.textContent = `Download Subtitles (${languages.length})`;
            //    dropdown.append(titleDiv);

            //    languages.forEach((lang) => {
            //       const option = document.createElement('div');
            //       option.className = 'subtitle-option';
            //       option.dataset.url = lang.url;
            //       option.textContent = lang.label;
            //       dropdown.append(option);
            //    });

            //    return dropdown;
            // }

            buttonsContainer.append(selectLang, navigator.clipboard?.write && copyBtn, searchInput);
            subtitlesWrapper.append(buttonsContainer, subtitlesTextContainer);

            // document.body.append(subtitlesWrapper);
            // Solution 1. Placement Position
            // document.querySelector('#ytd-player #container').append(subtitlesWrapper);
            // movie_player.after(subtitlesWrapper);
            // Solution 2. Placement Position
            movie_player.append(subtitlesWrapper);

            return subtitlesWrapper;
         },

         render() {
            const fragment = document.createDocumentFragment();

            this.subtitlesData.forEach((subtitle, idx) => {
               // const div = document.createElement('span');
               const subtitleContainer = document.createElement('div');
               subtitleContainer.classList.add('subtitle', 'inactive');
               subtitleContainer.setAttribute('data-index', idx);

               const subtitleText = document.createElement('span');
               subtitleText.className = `${this.SELECTOR_PREFIX}-text`;
               // regular direct method
               // subtitleText.innerText = subtitle.text;
               // subtitleText.innerHTML = NOVA.createSafeHTML(convertMarkdown(subtitle.text));
               // "parts" method
               subtitle.parts.forEach((subtitlePart, idx) => {
                  const subtitleTextPart = document.createElement('span');
                  subtitleTextPart.className = `${this.SELECTOR_PREFIX}-part`;
                  subtitleTextPart.setAttribute('part-offset', subtitlePart.offset);

                  // assembly "[__]" from array
                  if (subtitlePart.text.endsWith('[')
                     && (assemblyPart1 = subtitle.parts[idx + 1]?.text) && assemblyPart1.includes('__')
                     && (assemblyPart2 = subtitle.parts[idx + 2]?.text) && assemblyPart2.startsWith(']')
                  ) {
                     subtitlePart.text = subtitlePart.text.replace('[', '');
                     subtitle.parts[idx + 1].text = assemblyPart1.replace('__', '[__]');
                     // subtitle.parts[idx + 2].text = assemblyPart2.slice(0, -1);
                     subtitle.parts[idx + 2].text = assemblyPart2.replace(']', '');
                  }

                  // subtitleText.innerText = subtitlePart.text;
                  const newText = convertMarkdown(subtitlePart.text);
                  if (newText) {
                     subtitleTextPart.innerHTML = NOVA.createSafeHTML(newText + ' ');
                     subtitleText.append(subtitleTextPart);
                  }
               });

               const timeLink = document.createElement('a');
               timeLink.className = `${this.SELECTOR_PREFIX}-time`;
               timeLink.href = NOVA.queryURL.set({ 't': Math.trunc(subtitle.start) + 's' });
               timeLink.textContent = NOVA.formatTime.HMS.digit(subtitle.start);
               timeLink.title = `Duration: ${NOVA.formatTime.HMS.digit(subtitle.duration)}`;
               timeLink.addEventListener('click', evt => {
                  evt.preventDefault();
                  seekTime(subtitle.start);
                  // NOVA.updateUrl(NOVA.queryURL.set({ 't': Math.trunc(subtitle.start) + 's' }));


                  function seekTime(sec) {
                     // in embed does not have "movie_player.seekBy"
                     if (typeof movie_player.seekBy === 'function') {
                        movie_player.seekTo(sec);
                     }
                     // for embed
                     else if (NOVA.videoElement) {
                        NOVA.videoElement.currentTime = sec;
                     }
                     else {
                        const errorText = '[time-jump] > "seekTime" detect player error';
                        console.error(errorText);
                        throw errorText;
                     }
                  }
               });

               subtitleContainer.append(timeLink, subtitleText);
               fragment.append(subtitleContainer);
            });

            const subtitlesTextContainer = document.getElementById(`${Subtitle.SELECTOR_PREFIX}-container`);
            subtitlesTextContainer.textContent = '';
            subtitlesTextContainer.append(fragment);


            function convertMarkdown(str) {
               return str
                  // Convert headers
                  // .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                  // .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                  // .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                  // .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
                  // .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
                  // .replace(/^###### (.+)$/gm, '<h6>$1</h6>')

                  // Convert bold and italic
                  // .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                  // .replace(/\*([^*]+)\*/g, '<em>$1</em>')

                  .replace(/(\([^*]+\))/g, '<font class="mention">$1</font>') // mention "(text)"
                  // swear words "[ __ ]"
                  // .replace(/((\[(\s)?__(\s)?\]))/g, '[REDACTED]')
                  .replace(/((\[(\s)?__(\s)?\]))/g, '&block;&block;&block;') // '&#9608;&#9608;&#9608;'
                  // "[ words ]" ex - https://youtu.be/hYHb7rltxrE?t=122s https://youtu.be/G5wI_DRgImU?t=318
                  .replace(/(\[[^*]+\])/g, '<font class="mention">$1</font>')

                  // .replace(/("\S+")/g, '<strong>$1</strong>') // in quotes. Warn broken link
                  .replace(/(@\S+)/g, '<a href="$2">$1</a>') // @user
                  .replace(/(♪[^*]+♪)/, '<font class="music">$1</font>') // music "♪song♪"
                  .replace(/^(\-)/, '—') // direct speech
                  // .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>') // Convert links

                  // Convert lists
                  // .replace(/^\* (.+)$/gm, '<li>$1</li>')
                  // .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

                  // Wrap in a div for list items
                  // .replace(/<\/li>/g, '</li></ul>').replace(/<li>/g, '<ul><li>')

                  .replace(/[\u200B-\u200D\uFEFF\u034f\u2000-\u200F]/g, '') // remove zero-width space characters
                  .replace(/\s{2,}/g, ' ') // multi-spacebar

                  .trim();
            }
         },

         // updateLastSubtitleIdx: -1, // avoiding duplication
         update(time) {
            if (!this.subtitlesData?.length) {
               // console.warn('subtitlesData unavailable');
               return;
            }

            // // Find the active subtitle and add active class
            const currSubtitleIdx = this.subtitlesData.findLastIndex(c => time >= c.start && time <= (c.start + c.duration));

            if (currSubtitleIdx !== this.updateLastSubtitleIdx) {
               this.updateLastSubtitleIdx = currSubtitleIdx;

               // set inactive all
               if (this.updateLastSubtitleIdx === -1) {
                  document.querySelectorAll('.subtitle.active')
                     .forEach(el => el.classList.replace('active', 'inactive'));
               }
               else {
                  // set inactive older N
                  document.querySelector(`.subtitle[data-index="${currSubtitleIdx - 1}"]`)?.classList.replace('active', 'inactive');

                  // set active
                  // document.querySelector(`.subtitle[data-index="${currSubtitleIdx}"]`).classList.replace('inactive', 'active');
                  document.querySelectorAll(`.subtitle[data-index="${currSubtitleIdx}"]`)
                     .forEach(el => el.classList.replace('inactive', 'active'));

                  if (activeSubEl = document.querySelector(`.subtitle[data-index="${currSubtitleIdx}"]`)) {
                     scrollToElement(activeSubEl);
                  }

                  // renderCue(this.subtitlesData[currSubtitleIdx], currSubtitleIdx);
               }

               function scrollToElement(target_el = required()) {
                  if (!(target_el instanceof HTMLElement)) return console.error('target_el not HTMLElement:', target_el);
                  const container = target_el.parentElement;
                  container.scrollTop = target_el.offsetTop - (container.clientHeight / 2);
               }
            }
         },

         updateSubtitlesVisibility() {
            document.getElementById(this.SELECTOR_ID).style.display = movie_player.isSubtitlesOn()
               ? 'inherit'
               : 'none';
         },
      };

      const YoutubeSubtitle = {
         getSubtitlesList() {
            // [
            //    {
            //       "baseUrl": https://www.youtube.com/api/timedtext?v=...&lang=en",
            //       "name": {
            //          "simpleText": "English (auto-generated)"
            //       },
            //       "vssId": "a.en",
            //       "languageCode": "en",
            //       "kind": "asr",
            //       "isTranslatable": true,
            //       "trackName": ""
            //    }
            // ].

            const captionTracks = movie_player.getPlayerResponse()?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            // || NOVA.searchInObjectBy.key({
            //    obj: document.body.querySelector('.ytd-page-manager[video-id]')?.playerData,
            //    key: 'captionTracks',
            //    //match_fn: val => {},
            // });

            if (captionTracks) {
               return captionTracks.map(data => {
                  return {
                     link: data.baseUrl,
                     language: data.name.simpleText,
                     code: data.languageCode,
                  };
               });
            }
         },

         async fetchSubtitle(lang_code, link) {
            // console.debug('fetchSubtitle:', ...arguments);
            const urlCaption = link || this.getSubtitlesList()?.[0].link;

            if (urlCaption) {
               const dataQuery = { fmt: 'json3' };
               // if (lang_code) dataQuery['lang'] = lang_code;
               if (lang_code) dataQuery['tlang'] = lang_code;
               const captionUrl = NOVA.queryURL.set(dataQuery, urlCaption);
               return await NOVA.fetch(captionUrl);
            }
            else {
               console.warn('No subtitles available for this video');
            }
         },

         // "parts" method
         parse(subtitles) {
            const result = [];

            subtitles.forEach((subtitle, idx) => {
               if (subtitle.segs?.length) {
                  const parts = [];
                  subtitle.segs.forEach(seg => {
                     const text = seg.utf8?.trim();
                     if (text) {
                        parts.push({
                           text: seg.utf8?.trim(),
                           offset: (seg.tOffsetMs / 1000) || 0,
                        });
                     }
                  });

                  if (subtitle.dDurationMs && parts?.length) {
                     // trim duration into segment (https://youtu.be/X0ylty8OBbY?t=12, https://youtu.be/9EvbqxBUG_c?t=59)
                     const nextSeg = subtitles[idx + 1];
                     if (nextSeg && ((subtitle.tStartMs + subtitle.dDurationMs) > nextSeg.tStartMs)) {
                        subtitle.dDurationMs = nextSeg.tStartMs - subtitle.tStartMs;
                     }
                     result.push({
                        parts,
                        start: subtitle.tStartMs / 1000, // convert to sec
                        duration: subtitle.dDurationMs / 1000, // convert to sec
                     });
                  }
               }
            });
            return result;
         },

         // "regular direct" method
         // parse(subtitles) {
         //    return subtitles.map(subtitle => {
         //       // const parts = subtitle.segs?.map(seg => seg.utf8.trim()).join(' ');
         //       const parts = subtitle.segs?.map(seg => {
         //          return {
         //             text: seg.utf8?.trim(),
         //             offset: seg.tOffsetMs / 1000,
         //          };
         //       });
         //       if (parts?.length) {
         //          return {
         //             parts: parts,
         //             start: Math.trunc(subtitle.tStartMs / 1000), // convert to sec
         //             duration: Math.trunc(subtitle.dDurationMs / 1000), // convert to sec
         //          };
         //       }
         //    });
         // },
      };

      (function (origXHROpen) {
         XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
            if (async && url.includes('/api/timedtext')) {
               // preferred langs patch
               if (LANGS.length
                  // skip pathed
                  && !LANGS.includes(NOVA.queryURL.get('lang', url))
                  && !LANGS.includes(NOVA.queryURL.get('tlang', url))
               ) {
                  YoutubeSubtitle.fetchSubtitle(LANGS, url)
                     .then(({ events }) => {
                        Subtitle.subtitlesData = YoutubeSubtitle.parse(events);
                        Subtitle.updateSubtitlesVisibility();
                        Subtitle.render();
                     })
                     .catch(err => {
                        console.error('Failed patch subtitle:', err);
                        // throw new Error(`${err}`);
                     });
               }

               // handle
               this.addEventListener('readystatechange', async function (event) {
                  if (this.readyState === 4 && this.status === 200) {
                     try {
                        Subtitle.subtitlesData = YoutubeSubtitle.parse(JSON.parse(this.responseText).events);
                        Subtitle.updateSubtitlesVisibility();
                        Subtitle.render();
                     } catch (err) {
                        console.error('Failed subtitlesData:', err);
                     }
                  }
                  if (this.onreadystatechange) {
                     this.onreadystatechange(event);
                  }
               }, { capture: true }); // before all events. Possible loading slowdown
            }
            origXHROpen.apply(this, arguments);
            // origXHROpen.call(this, method, url, async, user, pass);
         };
      })(XMLHttpRequest.prototype.open);


      return


      // const origXHROpen = XMLHttpRequest.prototype.open;
      // XMLHttpRequest = new Proxy(XMLHttpRequest, {
      //    construct: function (target, args) {
      //       const xhr = new target(...args);
      //       // Do whatever you want with XHR request
      //       xhr.open = function (method, url, async, user, pass) {
      //          if (url.includes('/api/timedtext')
      //             // // && !url.includes(`&tlang=${LANG}`) // skip patched
      //             // && (NOVA.queryURL.get('tlang', url) != LANG) // skip patched
      //             && (NOVA.queryURL.get('lang', url) != LANG) // skip same LANG code
      //          ) {
      //             // console.debug('open', ...arguments);
      //             xhr.hookUrl = NOVA.queryURL.set({ 'tlang': LANG }, url);
      //          }
      //          // oldXHROpen.apply(this, arguments);
      //          // origXHROpen.apply(this, [method, url, async, user, pass]);
      //          origXHROpen.apply(xhr, [method, url, async, user, pass]);
      //       };
      //       xhr.onreadystatechange = async function (event) {
      //          // if (xhr.readyState === 1) {
      //          //    // Before sent request to server
      //          //    xhr.setRequestHeader("Authorization", "XXXX-XXXX-XXXX-XXXX");
      //          // }
      //          // if (xhr.readyState === 4) {
      //          //    // After complition of XHR request
      //          //    if (xhr.status === 401) {
      //          //       alert("Session expired, please reload the page!");
      //          //    }
      //          // }
      //          if (xhr.hookUrl && xhr.readyState === 4 && xhr.status === 200) {
      //             try {
      //                // real XMLHttpRequest.responseText is "read only";
      //                const responseJSON = await patchSubtitle(xhr.responseText, xhr.hookUrl);
      //                delete xhr.hookUrl;
      //                // Simulate responseText modification using a closure (prevents direct modification)
      //                Object.defineProperty(xhr, 'responseText', {
      //                   writable: true,
      //                   // get: () => responseJSON,
      //                });
      //                xhr.responseText = JSON.stringify(responseJSON);
      //                // Call the handler with original (modified) event
      //             } catch (err) {
      //                console.error('Error XMLHttpRequest:', err);
      //                // Handle patching errors gracefully (e.g., revert to original response)
      //             }
      //          }
      //          if (xhr.onreadystatechange) {
      //             xhr.onreadystatechange(event);
      //          }
      //       };
      //       return xhr;
      //    },
      // });


      // async function patchSubtitle(response, translated_url) {
      //    // console.debug('patch:', ...arguments);
      //    const originalData = JSON.parse(response);
      //    const translatedData = await NOVA.fetch(translated_url);

      //    //const isOfficialSub = originalData.events?.some(i => i.segs?.length > 1);
      //    const isOfficialSub = !originalData.events?.some(i => i.aAppend);
      //    console.debug('isOfficialSub:', isOfficialSub);

      //    // Merge subtitles
      //    originalData.events.forEach((originalEvent, idx) => {
      //       if (translatedEvent = translatedData.events[idx]) {
      //          originalEvent.segs = [...originalEvent.segs, { utf8: '\n\n' }, ...translatedEvent.segs]; // Combine with line break
      //          // fix multi newline sigs (ex - https://www.youtube.com/watch?v=UCmt9z5FrWk?t=96)
      //          // if (originalEvent.segs[0].utf8.endsWith('\n')) {
      //          // if (originalEvent.segs[0].utf8.endsWith(' ')) {
      //          originalEvent.segs[0].utf8 = originalEvent.segs[0].utf8.trim(); //.replace(/(\n)+$/, '2');
      //          // }
      //          // console.debug('"', originalEvent.segs[0].utf8.trim(), '"', originalEvent.segs[0].utf8.endsWith(' '));
      //       }
      //    });

      //    // fix for auto-generated sub
      //    // const mergeWords_utf8 = arr => {
      //    //    // {
      //    //    //     "utf8": " kind",
      //    //    //     "tOffsetMs": 1799,
      //    //    //     "acAsrConf": 248
      //    //    // },
      //    //    arr[0].utf8 = arr.reduce((sum, { utf8 }) => sum + utf8, '');
      //    //    arr.splice(1);
      //    //    return arr;
      //    // };

      //    // const mergeByProperty = (target, source, prop) => {
      //    //    source.forEach(sourceObj => {
      //    //       let targetObj = target.find(i => sourceObj[prop] === i[prop]);
      //    //       //console.debug('targetObj:', targetObj);
      //    //       if (targetObj.segs?.length) {
      //    //          targetObj.segs = mergeWords_utf8(targetObj.segs.concat([{ utf8: '\n' }], sourceObj.segs));
      //    //       }
      //    //       // targetObj ? Object.assign(targetObj, sourceObj) : target.push(sourceObj);
      //    //    })
      //    // };
      //    // mergeByProperty(originalData.events, translatedData.events, 'tStartMs');

      //    console.debug('new originalData', originalData);
      //    return originalData;
      // }


   },
   options: {
      subtitle_langs: {
         _tagName: 'select',
         label: 'Preferred languages',
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
         title: '[Ctrl+Click] to select several',
         // 'title:zh': '[Ctrl+Click] 选择多个',
         // 'title:ja': '「Ctrl+Click」して、いくつかを選択します',
         // 'title:ko': '[Ctrl+Click] 여러 선택',
         // 'title:vi': '',
         // 'title:id': '[Ctrl+Klik] untuk memilih beberapa',
         // 'title:es': '[Ctrl+Click] para seleccionar varias',
         // 'title:pt': '[Ctrl+Click] para selecionar vários',
         // 'title:fr': '[Ctrl+Click] pour sélectionner plusieurs',
         // 'title:it': '[Ctrl+Clic] per selezionarne diversi',
         // 'title:tr': 'Birkaç tane seçmek için [Ctrl+Tıkla]',
         // 'title:de': '[Ctrl+Click] um mehrere auszuwählen',
         'title:pl': 'Ctrl+kliknięcie, aby zaznaczyć kilka',
         // 'title:ua': '[Ctrl+Click] щоб обрати декілька',
         multiple: null, // don't use - selected: true
         // required: true, // don't use - selected: true
         size: 7, // = options.length
         options: [
            // follow the language used in YouTube page
            // { label: 'default', /* value: false, */ }, // fill value if no "selected" mark another option

            { value: 'af', label: 'Afrikaans', /* 'Afrikaans' */ },
            { value: 'sq', label: 'Albanian', /* 'Shqip' */ },
            { value: 'ar', label: 'Arabic', /* 'العربية' */ },
            { value: 'az', label: 'Azerbaijani', /* 'azərbaycan dili' */ },
            { value: 'eu', label: 'Basque', /* 'euskara' */ },
            { value: 'bn', label: 'Bengali', /* 'বাংলা' */ },
            { value: 'be', label: 'Belarusian', /* 'Беларуская' */ },
            { value: 'bg', label: 'Bulgarian', /* 'български език' */ },
            { value: 'ca', label: 'Catalan; Valencian', /* 'Català' */ },
            { value: 'zh', label: 'Chinese', /* '中文 (Zhōngwén), 汉语, 漢語' */ },
            { value: 'hr', label: 'Croatian', /* 'hrvatski' */ },
            { value: 'cs', label: 'Czech', /* 'česky, čeština' */ },
            { value: 'da', label: 'Danish', /* 'dansk' */ },
            { value: 'nl', label: 'Dutch', /* 'Nederlands, Vlaams' */ },
            { value: 'en', label: 'English', /* 'English' */ },
            { value: 'eo', label: 'Esperanto', /* 'Esperanto' */ },
            { value: 'et', label: 'Estonian', /* 'eesti, eesti keel' */ },
            { value: 'tl', label: 'Tagalog', /* 'Wikang Tagalog, ᜏᜒᜃᜅ᜔ ᜆᜄᜎᜓᜄ᜔' */ },
            { value: 'fi', label: 'Finnish', /* 'suomi, suomen kieli' */ },
            { value: 'fr', label: 'French', /* 'français, langue française' */ },
            { value: 'gl', label: 'Galician', /* 'Galego' */ },
            { value: 'ka', label: 'Georgian', /* 'ქართული' */ },
            { value: 'de', label: 'German', /* 'Deutsch' */ },
            { value: 'el', label: 'Greek', /* 'Ελληνικά' */ },
            { value: 'gu', label: 'Gujarati', /* 'ગુજરાતી' */ },
            { value: 'ht', label: 'Haitian Creole', /* 'Kreyòl ayisyen' */ },
            { value: 'iw', label: 'Hebrew', /* 'עברית' */ },
            { value: 'hi', label: 'Hindi', /* 'हिन्दी, हिंदी' */ },
            { value: 'hu', label: 'Hungarian', /* 'Magyar' */ },
            { value: 'is', label: 'Icelandic', /* 'Íslenska' */ },
            { value: 'id', label: 'Indonesian', /* 'Bahasa Indonesia' */ },
            { value: 'ga', label: 'Irish', /* 'Gaeilge' */ },
            { value: 'it', label: 'Italian', /* 'Italiano' */ },
            { value: 'ja', label: 'Japanese', /* '日本語 (にほんご／にっぽんご)' */ },
            { value: 'kn', label: 'Kannada', /* 'ಕನ್ನಡ' */ },
            { value: 'ko', label: 'Korean', /* '한국어 (韓國語), 조선말 (朝鮮語)' */ },
            { value: 'la', label: 'Latin', /* 'latine, lingua latina' */ },
            { value: 'lv', label: 'Latvian', /* 'latviešu valoda' */ },
            { value: 'lt', label: 'Lithuanian', /* 'lietuvių kalba' */ },
            { value: 'mk', label: 'Macedonian', /* 'македонски јазик' */ },
            { value: 'ms', label: 'Malay', /* 'bahasa Melayu, بهاس ملايو‎' */ },
            { value: 'mt', label: 'Maltese', /* 'Malti' */ },
            { value: 'no', label: 'Norwegian', /* 'Norsk bokmål' */ },
            { value: 'fa', label: 'Persian', /* 'فارسی' */ },
            { value: 'pl', label: 'Polish', /* 'polski' */ },
            { value: 'pt', label: 'Portuguese', /* 'Português' */ },
            { value: 'ro', label: 'Romanian, Moldavian', /* 'română' */ },
            { value: 'ru', label: 'Russian', /* 'русский язык' */ },
            { value: 'sr', label: 'Serbian', /* 'српски језик' */ },
            { value: 'sk', label: 'Slovak', /* 'slovenčina' */ },
            { value: 'sl', label: 'Slovenian', /* 'slovenščina' */ },
            { value: 'es', label: 'Spanish', /* 'español, castellano' */ },
            { value: 'sw', label: 'Swahili', /* 'Kiswahili' */ },
            { value: 'sv', label: 'Swedish', /* 'svenska' */ },
            { value: 'ta', label: 'Tamil', /* 'தமிழ்' */ },
            { value: 'te', label: 'Telugu', /* 'తెలుగు' */ },
            { value: 'th', label: 'Thai', /* 'ไทย' */ },
            { value: 'tr', label: 'Turkish', /* 'Türkçe' */ },
            { value: 'uk', label: 'Ukrainian', /* 'українська' */ },
            { value: 'ur', label: 'Urdu', /* 'اردو' */ },
            { value: 'vi', label: 'Vietnamese', /* 'Tiếng Việt' */ },
            { value: 'cy', label: 'Welsh', /* 'Cymraeg' */ },
            { value: 'yi', label: 'Yiddish', /* 'ייִדיש' */ }
         ],
      },
      subtitle_show_time: {
         _tagName: 'input',
         label: 'Always show time',
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
      subtitle_draggable: {
         _tagName: 'input',
         label: 'Draggable',
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
      subtitle_transparent: {
         _tagName: 'input',
         label: 'Opacity',
         // 'label:zh': '不透明度',
         // 'label:ja': '不透明度',
         // 'label:ko': '불투명',
         // 'label:vi': '',
         // 'label:id': 'Kegelapan',
         // 'label:es': 'Opacidad',
         // 'label:pt': 'Opacidade',
         // 'label:fr': 'Opacité',
         // 'label:it': 'Opacità',
         // 'label:tr': 'Opaklık',
         // 'label:de': 'Opazität',
         'label:pl': 'Przejrzystość',
         // 'label:ua': 'Прозорість',
         type: 'number',
         // title: '',
         placeholder: '0-1',
         step: .05,
         min: 0,
         max: 1,
         value: .55,
      },
      subtitle_font_size: {
         _tagName: 'input',
         label: 'Font size',
         // 'label:zh': '字体大小',
         // 'label:ja': 'フォントサイズ',
         // 'label:ko': '글꼴 크기',
         // 'label:vi': '',
         // 'label:id': '',
         // 'label:es': 'Tamaño de fuente',
         // 'label:pt': 'Tamanho da fonte',
         // 'label:fr': 'Taille de police',
         // 'label:it': '',
         // 'label:tr': '',
         // 'label:de': 'Schriftgröße',
         'label:pl': 'Rozmiar czcionki',
         // 'label:ua': 'Розмір шрифту',
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
         placeholder: '1-3',
         step: .1,
         min: 1,
         max: 3,
         value: 1.5,
         // for calc px
         // placeholder: '1-5',
         // step: 1,
         // min: 1,
         // max: 3,
         // value: 3,
      },
      subtitle_bold: {
         _tagName: 'input',
         label: 'Bold text',
         // 'label:zh': '粗体',
         // 'label:ja': '太字',
         // 'label:ko': '굵은 텍스트',
         // 'label:vi': '',
         // 'label:id': 'Teks tebal',
         // 'label:es': 'Texto en negrita',
         // 'label:pt': 'Texto em negrito',
         // 'label:fr': 'Texte en gras',
         // 'label:it': 'Testo grassetto',
         // 'label:tr': 'Kalın yazı',
         // 'label:de': 'Fetter Text',
         'label:pl': 'Tekst pogrubiony',
         // 'label:ua': 'Жирний текст',
         type: 'checkbox',
         // title: '',
      },
      subtitle_auto_translate_disable: {
         _tagName: 'input',
         label: 'Prevent Auto-Translation',
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
      subtitle_color: {
         _tagName: 'input',
         type: 'color',
         value: '#ffffff',
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
         title: 'default - #FFF',
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
