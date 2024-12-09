
// for testing
// https://www.youtube.com/watch?v=LhKT9NTH9HA - don't have 480p
// https://www.youtube.com/watch?v=FZovbrEP53o - don't have 480p
// https://www.youtube.com/watch?v=Qc6FJWapiJk - don't have 240p
// https://www.youtube.com/watch?v=f354o8g-4mk - don't have 240p
// https://www.youtube.com/watch?v=E480DjY6ve8 - only 360p

// https://www.youtube.com/watch?v=2_4aVFv95z8 - hd2160
// https://www.youtube.com/watch?v=IUWJ8_lkFAA - hd2880
// https://www.youtube.com/watch?v=Hf5enZVznC4 - highres
// https://www.youtube.com/watch?v=5USuekk16e0 - highres
// https://www.youtube.com/watch?v=yK4mTN3B1d8 - premium bitrate
// https://www.youtube.com/watch?v=QbFx9_dH4DY - premium bitrate
// https://www.youtube.com/watch?v=QSyimjkM1I4 - premium bitrate
// https://www.youtube.com/watch?v=YgSPaXgAdzE - premium bitrate
// https://www.youtube.com/channel/UCKKKYE55BVswHgKihx5YXew/videos (https://www.youtube.com/watch?v=QSyimjkM1I4)- premium bitrate

window.nova_plugins.push({
   id: 'video-quality',
   title: 'Video quality',
   // 'title:zh': '视频质量',
   // 'title:ja': 'ビデオ品質',
   // 'title:ko': '비디오 품질',
   // 'title:vi': '',
   // 'title:id': 'Kualitas video',
   // 'title:es': 'Calidad de video',
   // 'title:pt': 'Qualidade de vídeo',
   // 'title:fr': 'Qualité vidéo',
   // 'title:it': 'Qualità video',
   // 'title:tr': 'Video kalitesi',
   // 'title:de': 'Videoqualität',
   'title:pl': 'Jakość wideo',
   // 'title:ua': 'Якість відео',
   run_on_pages: 'watch, embed',
   section: 'player',
   // desc: '',
   _runtime: user_settings => {

      // alt1 - https://greasyfork.org/en/scripts/6034-youtube-hd-override
      // alt2 - https://greasyfork.org/en/scripts/23661-youtube-hd
      // alt3 - https://greasyfork.org/en/scripts/379822-youtube-video-quality
      // alt5 - https://github.com/avi12/youtube-auto-hd
      // alt6 - https://github.com/james-fray/YouTube-HD

      // ex. yt-API call
      // movie_player.getAvailableQualityData()
      // movie_player.getAvailableQualityDataAndMessaging()
      // movie_player.getAvailableQualityLabels()
      // movie_player.getAvailableQualityLevels()

      class PlayerState {
         constructor() {
            this.quality_lock = false;
            PlayerState.qualityToSet = user_settings.video_quality;
         }

         addEventListeners(movie_player) {
            // keep save manual quality in the session
            if (user_settings.video_quality_manual_save_in_tab
               && NOVA.currentPage == 'watch' // no sense in the embed
            ) {
               movie_player.addEventListener('onPlaybackQualityChange', quality => {
                  // console.debug('document.activeElement,', document.activeElement);
                  // if (document.activeElement.getAttribute('role') == 'menuitemradio' // focuse on setting menu
                  if (document.activeElement.classList.contains('ytp-settings-button') // focuse on setting menu
                     && quality !== user_settings.video_quality // the new quality
                  ) {
                     console.info(`keep quality "${quality}" in the session`);
                     user_settings.video_quality = quality;
                     // clear all other state
                     user_settings.video_quality_for_music = false;
                     user_settings.video_quality_for_fullscreen = false;
                  }
               }, { capture: true });
            }

            // custom volume from [save-channel-state] plugin
            if (user_settings['save-channel-state']) {
               NOVA.runOnPageLoad(async () => {
                  if (NOVA.currentPage != 'watch' && NOVA.currentPage != 'embed') return;

                  const customQuality = await NOVA.storage_obj_manager.getParam('quality');
                  if (customQuality) {
                     user_settings.video_quality = customQuality; // rewrite
                     qualityManager.setQuality(movie_player.getPlayerState());
                  }
               });
            }

            qualityManager.setQuality(movie_player.getPlayerState()); // init

            movie_player.addEventListener('onStateChange', qualityManager.setQuality); // update

            if (user_settings.video_quality_for_fullscreen) {
               let selectedQualityBackup = user_settings.video_quality;
               document.addEventListener('fullscreenchange', () => {
                  user_settings.video_quality = document.fullscreenElement
                     ? user_settings.video_quality_for_fullscreen
                     : selectedQualityBackup;
                  movie_player.setPlaybackQualityRange(user_settings.video_quality, user_settings.video_quality);
               });
            }
         }
      }

      const qualityManager = {
         async setQuality(state = required()) {
            if (!PlayerState.qualityToSet) return console.error('qualityToSet unavailable', PlayerState.qualityToSet);
            // console.debug('playerState', NOVA.getPlayerState.playback(state));

            // checkMusicType
            if (user_settings.video_quality_for_music
               && location.search.includes('list=')
               // && (NOVA.queryURL.has('list')/* || movie_player?.getPlaylistId()*/)
               && NOVA.isMusic()
            ) {
               PlayerState.qualityToSet = user_settings.video_quality_for_music;
            }

            // Atention "quality_lock" fix conflict [quick-quality] from [player-quick-buttons] plugin
            // get data [quick-quality] from [player-quick-buttons] plugin
            // if (user_settings['player-quick-buttons']
            //    && user_settings.player_buttons_custom_items?.includes('quick-quality')
            //    && window['nova-quality']
            // ) {
            //    PlayerState.qualityToSet = window['nova-quality'];
            // }

            // if (['PLAYING', 'BUFFERING'].includes(NOVA.getPlayerState.playback(state)) && !setQuality.quality_lock) {
            if ((1 === state || 3 === state) && !player_state.quality_lock) {
               player_state.quality_lock = true;

               let availableQualityList;
               await NOVA.waitUntil(() => (availableQualityList = movie_player.getAvailableQualityLevels()) && availableQualityList.length, 50); // 50ms

               // Set premium quality if available
               if (user_settings.video_quality_premium) {
                  // Solution 1. API
                  const premiumQuality = [...movie_player.getAvailableQualityData()]
                     .find(q => //q.quality == PlayerState.qualityToSet
                        q.isPlayable && // comment for test
                        q.qualityLabel?.toLocaleLowerCase().includes('premium'))?.qualityLabel
                  if (premiumQuality) {
                     qualityManager.setPremium(premiumQuality);
                     return;
                  }
                  // Solution 2. HTML
                  // await NOVA.waitSelector('ytd-badge-supported-renderer > [aria-label="Premium"]').then(() => {});
               }

               const qualityFormatListWidth = {
                  highres: 4320,
                  hd2880: 2880,
                  hd2160: 2160,
                  hd1440: 1440,
                  hd1080: 1080,
                  hd720: 720,
                  large: 480,
                  medium: 360,
                  small: 240,
                  tiny: 144,
                  // auto: 0, ???
               };

               // incorrect window size definition in embed
               // set max quality limit (screen resolution (not viewport) + 30%)
               const maxWidth = (NOVA.currentPage == 'watch') ? screen.width : window.innerWidth;
               const maxQualityIdx = availableQualityList.findIndex(i => qualityFormatListWidth[i] <= (maxWidth * 1.3));
               if (maxQualityIdx === -1) {
                  console.error('maxQualityIdx', maxQualityIdx);
                  return;
               }

               availableQualityList = availableQualityList.slice(maxQualityIdx);

               // const maxAvailableQualityIdx = Math.max(availableQualityList.indexOf(PlayerState.qualityToSet), 0);
               const availableQualityIdx = (() => {
                  let idx = availableQualityList.indexOf(PlayerState.qualityToSet);
                  if (idx === -1) { // get closest
                     const
                        availableQuality = Object.keys(qualityFormatListWidth)
                           .filter(v => availableQualityList.includes(v) || (v == PlayerState.qualityToSet)), // filter available and qualityToSet
                        // nearestQualityIdx = availableQuality.findIndex(q => q === PlayerState.qualityToSet); // hight quality idx
                        nearestQualityIdx = availableQuality.findIndex(q => q === PlayerState.qualityToSet) - 1; // lower quality idx

                     idx = availableQualityList[nearestQualityIdx] ? nearestQualityIdx : 0;
                  }
                  return idx;

               })();
               const newQuality = availableQualityList[availableQualityIdx];

               // if (!newQuality || movie_player.getPlaybackQuality() == PlayerState.qualityToSet) {
               //    return console.debug('skip set quality');
               // }

               // if (!availableQualityList.includes(PlayerState.qualityToSet)) {
               //    console.info(`no has qualityToSet: "${PlayerState.qualityToSet}". Choosing instead the top-most quality available "${newQuality}" of ${JSON.stringify(availableQualityList)}`);
               // }

               if (typeof movie_player.setPlaybackQuality === 'function') {
                  // console.debug('use setPlaybackQuality');
                  movie_player.setPlaybackQuality(newQuality);
               }

               // set QualityRange
               if (typeof movie_player.setPlaybackQualityRange === 'function') {
                  // console.debug('use setPlaybackQualityRange');
                  movie_player.setPlaybackQualityRange(newQuality, newQuality);
               }

               // console.debug('availableQualityList:', availableQualityList);
               // console.debug("try set quality:", newQuality);
               // console.debug('current quality:', movie_player.getPlaybackQuality());
            }
            // else if (['UNSTARTED', 'ENDED'].includes(NOVA.getPlayerState.playback(state))) {
            else if (state <= 0) {
               player_state.quality_lock = false;
            }
         },

         // alt1 - https://openuserjs.org/scripts/adisib/Youtube_HD
         // alt2 - https://greasyfork.org/en/scripts/498145-youtube-hd-premium
         async setPremium(qualityLabel = required()) {
            // premium clicker
            // NOVA.waitSelector('#movie_player')
            //    .then(player => {
            //       player.addEventListener('onStateChange', setQualityPremium, { capture: true, once: true });
            //    });

            // async function setQualityPremium() {
            const SELECTOR_CONTAINER = '#movie_player';
            // Open settings menu
            const settingsButton = await NOVA.waitSelector(`${SELECTOR_CONTAINER} .ytp-chrome-bottom button.ytp-settings-button[aria-expanded="false"]`);
            settingsButton.click(); // open

            // Open quality menu
            //const qualityMenuButton = await NOVA.waitSelector(`${SELECTOR_CONTAINER} .ytp-settings-menu [role="menuitem"]:last-child`);
            const qualityMenuButton = [...document.body.querySelectorAll(`${SELECTOR_CONTAINER} .ytp-settings-menu [role="menuitem"] .ytp-menuitem-content`)]
               .find(menuItem => menuItem.textContent.toLocaleLowerCase().includes('auto') || (NOVA.extractAsNum.int(menuItem.textContent) >= 144));
            qualityMenuButton.click(); // open

            // Solution 1
            // const qualityItem = [...document.body.querySelector('.ytp-quality-menu .ytp-panel-menu').children]
            // const qualityItem = [...document.body.querySelectorAll('.ytp-quality-menu .ytp-menuitem[role="menuitemradio"]:has(.ytp-premium-label)')]
            const qualityItem = [...document.body.querySelectorAll('.ytp-quality-menu [role="menuitemradio"]')]
               .find(menuItem => menuItem.textContent.includes(qualityLabel));
            // Solution 2
            // const qualityItem = await NOVA.waitSelector(`${SELECTOR_CONTAINER} .ytp-settings-menu .ytp-quality-menu .ytp-premium-label`);

            // choosing it quality
            if (qualityItem) {
               // await NOVA.waitUntil(() => {
               //    // check quality is set
               //    if () {
               //       return true;
               //    }
               //    // choose quality if qualityItem showing
               //    else if (NOVA.isVisible(qualityItem)) {
               //       qualityItem.click();
               //    }
               //    // error. stop job
               //    else {
               //       return true;
               //    }
               // }, 500);
               let visibleAfterclicked;
               await NOVA.waitUntil(() => {
                  // when the qualityItem is hide then probably quality is set
                  if (NOVA.isVisible(qualityItem)) {
                     qualityItem.click();
                     visibleAfterclicked = true;
                  }
                  // stop job
                  else if (visibleAfterclicked) return true;
               }, 500);
               // await NOVA.delay(1500);
               // console.debug('choosing it quality', qualityItem.textContent, qualityItem.innerText);
               // qualityItem.click();
               // alert(`choosing it quality:\n${qualityItem.textContent}\n${qualityItem.innerText}`);
               // player.removeEventListener('onStateChange', setQualityPremium);
            }

            // unfocused
            // document.body.click();
            // document.body.querySelector('video').focus();
            // }

            setQuality.quality_lock = true;
            // return true;
         },
      }

      const player_state = new PlayerState();

      NOVA.waitSelector('#movie_player')
         .then(movie_player => {
            player_state.addEventListeners(movie_player);
         });

      // error detector
      // NOVA.waitSelector('.ytp-error [class*="reason"]', { destroy_after_page_leaving: true })
      //    .then(error_reason_el => {
      //       if (alertText = error_reason_el.textContent) {
      //          // err ex:
      //          // This video isn't available at the selected quality. Please try again later.
      //          // An error occurred. Please try again later. (Playback ID: Ame9qzOk-p5tXqLS) Learn More
      //          // alert(alertText);
      //          throw alertText; // send to _pluginsCaptureException
      //       }
      //    });

   },
   options: {
      video_quality: {
         _tagName: 'select',
         label: 'Default',
         // 'label:zh': '默认视频质量',
         // 'label:ja': 'デフォルトのビデオ品質',
         // 'label:ko': '기본 비디오 품질',
         // 'label:vi': '',
         // 'label:id': 'Kualitas bawaan',
         // 'label:es': 'Calidad predeterminada',
         // 'label:pt': 'Qualidade padrão',
         // 'label:fr': 'Qualité par défaut',
         // 'label:it': 'Qualità predefinita',
         // 'label:tr': 'Varsayılan kalite',
         // 'label:de': 'Standardvideoqualität',
         'label:pl': 'Domyślna jakość',
         // 'label:ua': 'Звичайна якість',
         // title: 'If unavailable, set max available quality',
         // multiple: null,
         options: [
            // Available ['highres','hd2880','hd2160','hd1440','hd1080','hd720','large','medium','small','tiny']
            { label: '8K/4320p', value: 'highres' },
            { label: '5K/2880p', value: 'hd2880' },
            { label: '4K/2160p', value: 'hd2160' },
            { label: 'QHD/1440p', value: 'hd1440' },
            { label: 'FHD/1080p', value: 'hd1080', selected: true },
            { label: 'HD/720p', value: 'hd720' },
            { label: '480p', value: 'large' },
            { label: '360p', value: 'medium' },
            { label: 'SD/240p', value: 'small' }, // VHS
            { label: '144p', value: 'tiny' },
            // { label: 'Auto', value: 'auto' }, // no sense, deactivation does too
         ],
      },
      video_quality_premium: {
         _tagName: 'input',
         label: 'Use Premium bitrate when available',
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
         title: 'High priority',
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
      video_quality_manual_save_in_tab: {
         _tagName: 'input',
         // label: 'Manually selected qualities are saved in the current tab' // too much long
         label: 'Save manually selected for the same tab',
         // label: 'Save manual selection for next video',
         // 'label:zh': '手动选择的质量保存在当前选项卡中',
         // 'label:ja': '手動で選択した品質が現在のタブに保存されます',
         // 'label:ko': '동일한 탭에 대해 수동으로 선택한 저장',
         // 'label:vi': '',
         // 'label:id': 'Simpan dipilih secara manual untuk tab yang sama',
         // 'label:es': 'Guardar seleccionado manualmente para la misma pestaña',
         // 'label:pt': 'Salvar selecionado manualmente para a mesma guia',
         // 'label:fr': 'Enregistrer sélectionné manuellement pour le même onglet',
         // 'label:it': 'Salva selezionato manualmente per la stessa scheda',
         // 'label:tr': 'Aynı sekme için manuel olarak seçili kaydet',
         // 'label:de': 'Manuell für dieselbe Registerkarte ausgewählt speichern',
         'label:pl': 'Właściwości dla obecnej karty',
         // 'label:ua': 'Зберігати власноруч обрану якість для вкладки',
         type: 'checkbox',
         title: 'Affects to next videos',
         // 'title:zh': '对下一个视频的影响',
         // 'title:ja': '次の動画への影響',
         // 'title:ko': '다음 동영상에 영향',
         // 'title:vi': '',
         // 'title:id': 'Mempengaruhi video berikutnya',
         // 'title:es': 'Afecta a los siguientes videos',
         // 'title:pt': 'Afeta para os próximos vídeos',
         // 'title:fr': 'Affecte aux prochaines vidéos',
         // 'title:it': 'Influisce sui prossimi video',
         // 'title:tr': 'Sonraki videoları etkiler',
         // 'title:de': 'Beeinflusst die nächsten Videos',
         'title:pl': 'Zmiany w następnych filmach',
         // 'title:ua': 'Впливає на наступні відео',
      },
      video_quality_for_music: {
         _tagName: 'select',
         label: 'For Music (in playlists)',
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
         // 'label:ua': 'Змінити якість музики у списках відтворення',
         title: 'to save traffic / increase speed',
         // 'title:zh': '节省流量/提高速度',
         // 'title:ja': 'トラフィックを節約/速度を上げる',
         // 'title:ko': '트래픽 절약 / 속도 향상',
         // 'title:vi': '',
         // 'title:id': 'untuk menghemat lalu lintas / meningkatkan kecepatan',
         // 'title:es': 'para ahorrar tráfico / aumentar la velocidad',
         // 'title:pt': 'para economizar tráfego / aumentar a velocidade',
         // 'title:fr': 'économiser du trafic / augmenter la vitesse',
         // 'title:it': 'per risparmiare traffico / aumentare la velocità',
         // 'title:tr': '',
         // 'title:de': 'um Verkehr zu sparen / Geschwindigkeit zu erhöhen',
         'title:pl': 'aby zaoszczędzić ruch / zwiększyć prędkość',
         // 'title:ua': 'для економії трафіку / збільшення швидкості',
         // multiple: null,
         options: [
            // Available ['highres','hd2880','hd2160','hd1440','hd1080','hd720','large','medium','small','tiny']
            // { label: '8K/4320p', value: 'highres' }, // useless for the current mode
            // { label: '5K/2880p', value: 'hd2880' }, // useless for the current mode
            // { label: '4K/2160p', value: 'hd2160' }, // useless for the current mode
            { label: 'QHD/1440p', value: 'hd1440' },
            { label: 'FHD/1080p', value: 'hd1080' },
            { label: 'HD/720p', value: 'hd720' },
            { label: 'SD/480p', value: 'large' },
            { label: 'SD/360p', value: 'medium' },
            { label: 'SD/240p', value: 'small' },
            { label: 'SD/144p', value: 'tiny' },
            { label: 'Auto', value: 'auto' },
            { label: 'default', /* value: false, */ selected: true }, // fill value if no "selected" mark another option
         ],
      },
      video_quality_for_fullscreen: {
         _tagName: 'select',
         label: 'On Full-screen',
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
         // title: 'specified quality in Full-screen mode',
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
         // multiple: null,
         options: [
            // Available ['highres','hd2880','hd2160','hd1440','hd1080','hd720','large','medium','small','tiny']
            { label: '8K/4320p', value: 'highres' },
            // { label: '5K/2880p', value: 'hd2880' }, // missing like https://www.youtube.com/watch?v=Hbj3z8Db4Rk
            { label: '4K/2160p', value: 'hd2160' },
            { label: 'QHD/1440p', value: 'hd1440' },
            { label: 'FHD/1080p', value: 'hd1080' },
            { label: 'HD/720p', value: 'hd720' },
            { label: 'SD/480p', value: 'large' },
            { label: 'SD/360p', value: 'medium' },
            // { label: 'SD/240p', value: 'small' }, // useless for the current mode
            // { label: 'SD/144p', value: 'tiny' }, // useless for the current mode
            // { label: 'Auto', value: 'auto' }, // no sense, deactivation does too
            { label: 'default', /* value: false, */ selected: true }, // fill value if no "selected" mark another option
         ],
      },
   }
});
