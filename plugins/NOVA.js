/*
   NOVA - complex solutions to simple problems
   full fusctions list in NOVA:
   - createSafeHTML
   - waitSelector (async)
   - waitUntil (async)
   - delay (async)
   // - uiAlert
   - watchElements
   - runOnPageLoad
   - css.push
   - css.get
   // - cookies.get
   // - cookies.set
   // - cookies.delete
   // - cookies.clear
   // - cookies.clearAllCookies
   // - cookies.parseQueryToObj
   // - cookies.updateParam
   - isInViewport
   // - isVisible
   - collapseElement
   - aspectRatio.sizeToFit
   - aspectRatio.getAspectRatio
   - aspectRatio.calculateHeight
   - aspectRatio.calculateWidth
   - openPopup
   // - simulateClick
   - showOSD
   - getChapterList
   - strToArray
   - searchFilterHTML
   - Draggable: [class]
   - isMusic
   - formatTime.hmsToSec
   - formatTime.HMS.digit
   - formatTime.HMS.abbr
   //- formatTime.HMS.abbrFull
   - formatTime.ago
   - dateFormat
   - numberFormat.abbr
   - numberFormat.friendly
   - extractAsNum.float
   - extractAsNum.int
   //- extractAsNum.firstInt
   - editableFocused
   - updateUrl
   - queryURL.has
   - queryURL.get
   - queryURL.set
   - queryURL.remove
   - queryURL.getFromHash
   - request.API (async)
   - fetch (async)
   - getPlayerState.playback
   - getPlayerState.visibility
   //- videoId
   - getChannelId (async)
   - storage_obj_manager.getParam
   //- searchInObjectBy.key
   //- fakeUA

   // data (not fn)
   - videoElement
   - currentPage
   - isMobile
*/

// const $ = element => document.body.querySelector(element);

const NOVA = {
   // DEBUG: true,

   // fix - This document requires 'TrustedHTML' assignment.
   // if (window.hasOwnProperty('trustedTypes')) {
   //    window.trustedTypes.createPolicy('default', { createHTML: string => string });
   // }
   createSafeHTML(html = required()) {
      if (typeof html !== 'string') {
         console.error('html is not a string:', typeof html, html);
         return;
      }
      if (typeof this.policy === 'undefined') {
         this.policy = (typeof trustedTypes !== 'undefined')
            // Sanitize or validate the HTML here before returning it
            ? trustedTypes.createPolicy('nova-policy', { createHTML: html => html, })
            : null;
      }
      return this.policy ? this.policy.createHTML(html) : html;
   },

   /**
    * @param {string} selector - CSS selector for the target element
    * @param {object} options - Configuration options
    * @param {HTMLElement} [options.container] - The element to search within (defaults to document)
    * @param {boolean} [options.destroy_after_page_leaving] - Disconnect observer on page change (optional)
    * @param {number} [options.destroy_timeout] - Timeout in seconds before rejecting (optional)
    *
    * @returns {Promise<HTMLElement>} - Resolves with the found element, rejects on timeout or error
   */
   // untilDOM
   waitSelector(selector = required(), limit_options = {}) {
      const {
         container = document.body || document,
         destroy_after_page_leaving,
         destroy_timeout = 0,
      } = limit_options;

      if (typeof selector !== 'string') {
         console.error('selector is not a string:', selector);
         return;
      }
      else if (!CSS.supports('selector(:has(*))')) {
         console.warn('CSS ":has()" unsupported');
         return;
      }

      if (container !== document && !(container instanceof HTMLElement)) {
         console.error('container is not a HTMLElement:', limit_options);
         return;
      }

      // if (typeof destroy_timeout !== 'number'/* && destroy_timeout <= 0*/) {FF
      if (destroy_timeout && !Number.isFinite(destroy_timeout)) {
         console.error('timeout must be a positive number:', destroy_timeout);
         return;
      }

      return new Promise((resolve, reject) => {
         // https://stackoverflow.com/a/68262400
         // best https://codepad.co/snippet/wait-for-an-element-to-exist-via-mutation-observer
         // alt:
         // https://git.io/waitForKeyElements.js
         // https://github.com/fuzetsu/userscripts/tree/master/wait-for-elements
         // https://github.com/CoeJoder/waitForKeyElements.js
         // https://gist.githubusercontent.com/sidneys/ee7a6b80315148ad1fb6847e72a22313/raw/
         // https://greasyfork.org/scripts/21927-arrive-js/code/arrivejs.js  (ex: https://greasyfork.org/en/scripts/429783-confirm-and-upload-imgur)
         // https://greasyfork.org/scripts/464780-global-module/code/global_module.js
         // https://github.com/CoeJoder/waitForKeyElements.js
         // https://update.greasyfork.org/scripts/419640/887637/onElementReady.js

         // resolve
         if (el = container.querySelector(selector)) {
            // console.debug('[1]', selector);
            return resolve(el);
         }

         // const startTime = Date.now();
         let waiting = document.hidden || !container.contains(document.activeElement);
         let destroyTimeout;

         const observerFactory = new MutationObserver(queryElement);
         // const observerFactory = new MutationObserver((mutationRecordsArray, observer) => {
         //    // for (const record of mutationRecordsArray) {
         //    //    for (const node of record.addedNodes) {
         //    //       if (![1, 3, 8].includes(node.nodeType) || !(node instanceof HTMLElement)) continue; // speedup hack

         //    //       if (node.matches && node.matches(selector)) { // this node
         //    //          console.debug('[2]', Date.now() - startTime, 'ms', record.type, node.nodeType, selector);
         //    //          observer.disconnect();
         //    //          return resolve(node);
         //    //       }
         //    //       // closet ?
         //    //       else if ( // inside node
         //    //          (parentEl = node.parentElement || node)
         //    //          && (!(parentEl instanceof HTMLElement))
         //    //          && (element = parentEl.querySelector(selector))
         //    //       ) {
         //    //          console.debug('[3]', Date.now() - startTime, 'ms', record.type, node.nodeType, selector);
         //    //          observer.disconnect();
         //    //          return resolve(element);
         //    //       }
         //    //    }
         //    // }

         //    // after for-loop. In global
         //    // if (document?.readyState != 'loading' // fix slowdown page
         //    //    && (element = container.querySelector(selector))
         //    // ) {
         //    //    // console.debug('[4]', selector);
         //    //    observer.disconnect();
         //    //    return resolve(element);
         //    // }
         //    }

         observerFactory
            .observe(container, {
               childList: true, // observe direct children
               subtree: true, // and lower descendants too
               // attributes: true, // need to - "NOVA.waitSelector('#movie_player.ytp-autohide video')" in embed page
               //  characterData: true,
               //  attributeOldValue: true,
               //  characterDataOldValue: true
            });

         // destructure self
         if (destroy_timeout > 0) {
            destroyTimeout = setTimeout(() => {
               stopJob();
               return reject(`Element not found within ${destroy_timeout} seconds`);
            }, destroy_timeout * 1000);
         }

         // destructure self
         if (destroy_after_page_leaving) {
            const prevURL = document.URL;
            window.addEventListener('transitionend', () => {
               if (prevURL !== document.URL) {
                  stopJob();
                  return reject('Page changed before element was found');
               }
            }, { capture: true, once: true });
         }

         document.addEventListener('visibilitychange', handleVisibilityChange);

         function handleVisibilityChange() {
            waiting = document.hidden; // If the page becomes inactive, pause the search
            queryElement();
         }

         function queryElement() {
            if (!waiting && document.readyState === 'complete') {
               waiting = true;
               setTimeout(() => {
                  const element = container.querySelector(selector);
                  if (element) {
                     stopJob()
                     return resolve(element);
                  }
                  else {
                     waiting = false;
                  }
               }, 100); // Adjust throttle time as needed
            }
         }

         function stopJob() {
            observerFactory.disconnect();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (typeof destroyTimeout === 'number') clearTimeout(destroyTimeout);
         }

      });
   },

   /**
    * @param  {function} condition_fn
    * @param  {int*} check_period
    * @param  {int*} destroy_after - destructure self after in sec
    * @return {Promise<fn>}
   */
   // await NOVA.waitUntil(condition_fn, 500) // 500ms
   waitUntil(condition_fn = required(), check_period = 500, destroy_after = (60 * 1000)) {
      if (typeof condition_fn !== 'function') {
         console.error('condition is not a function:', typeof condition_fn, condition_fn);
         return Promise.reject(new Error('Condition function is required'));
      }

      if (!Number.isFinite(check_period)) {
         console.error('check_period must be a positive number:', check_period);
         return Promise.reject(new Error('Check period must be a finite number'));
      }

      if (!Number.isFinite(destroy_after)) {
         console.error('timeout must be a positive number:', destroy_after);
         return Promise.reject(new Error('Destroy timeout must be a finite number'));
      }

      return new Promise((resolve, reject) => {
         const startTime = Date.now();
         const checkCondition = () => {
            try {
               const result = condition_fn();
               if (result !== undefined) { // Ensure the function returns a value
                  resolve(result); // Resolve with the actual output of condition_fn
               }
               else if ((Date.now() - startTime) > destroy_after * 1000) {
                  reject(new Error('Timeout reached'));
               }
               else {
                  setTimeout(checkCondition, check_period);
               }
            } catch (err) {
               reject(err);
            }
         };

         checkCondition();
      });
   },

   // waitUntil(condition_fn = () => { }, check_period = 500, destroy_timeout = check_period * 10) {
   //    return new Promise((resolve, reject) => {
   //       let destroyTimeout;

   //       const checkCondition = () => {
   //          try {
   //             const result = condition_fn();
   //             if (result !== undefined) {
   //                resolve(result);
   //             } else {
   //                setTimeout(checkCondition, check_period);
   //             }
   //          } catch (err) {
   //             reject(err);
   //          }
   //       };
   //       const destructureTimeout = new Promise((_, reject) => {
   //          destroyTimeout = setTimeout(() => {
   //             reject(new Error('Timeout reached'));
   //          }, destroy_timeout * 1000);
   //       });

   //       Promise.race([checkCondition()])
   //          .finally(() => {
   //             console.debug('', 2222);
   //             if (typeof destroyTimeout === 'number') clearTimeout(destroyTimeout);
   //          });
   //    });
   // },

   // await NOVA.delay(500);
   delay(ms = 100) {
      return new Promise(resolve => setTimeout(resolve, ms));
   },

   // uiAlert(message, callback) {
   //    if (callback) {
   //       if (window.confirm(message)) {
   //          callback();
   //       }
   //    }
   //    else alert(message);
   // },

   /**
    * @param  {array/string} condition
    * @param  {string*} attr_mark
    * @param  {function} callback
    * @param  {boolean} destroy_after_page_leaving
    * @return {void}
   */
   watchElements({ selectors = required(), attr_mark, callback = required(), destroy_after_page_leaving = false }) {
      if (!Array.isArray(selectors) && typeof selectors !== 'string') {
         console.error('selectors is not array/string:', typeof selectors, selectors);
         return;
      }
      if (typeof callback !== 'function') {
         console.error('callback is not a function:', typeof callback, callback);
         return;
      }

      // Convert selectors to an array if a single selector is provided
      if (typeof selectors === 'string') selectors = [selectors];

      // Check for CSS ":has()" support
      selectors = selectors.filter(selector => {
         if (!CSS.supports(`selector(:has(*))`)) {
            console.error('CSS ":has()" unsupported', selector);
            return false;
         }
         return true;
      });

      if (!selectors.length) return;

      const container = document.body || document;

      // const startTime = Date.now();
      let waiting = document.hidden || !container.contains(document.activeElement);
      let destroyTimeout;

      const observerFactory = new MutationObserver(queryElement);

      observerFactory
         .observe(container, {
            childList: true, // observe direct children
            subtree: true, // and lower descendants too
            attributes: true,
            //  characterData: true,
            //  attributeOldValue: true,
            //  characterDataOldValue: true
         });

      // destructure self
      // if (destroy_timeout > 0) {
      //    destroyTimeout = setTimeout(() => {
      //       stopJob();
      //       return reject(`Element not found within ${destroy_timeout} seconds`);
      //    }, destroy_timeout * 1000);
      // }

      // destructure self
      if (destroy_after_page_leaving) {
         const prevURL = document.URL;
         window.addEventListener('transitionend', () => {
            if (prevURL !== document.URL) {
               stopJob();
               return reject('Page changed before element was found');
            }
         }, { capture: true, once: true });
      }

      document.addEventListener('visibilitychange', handleVisibilityChange);

      function handleVisibilityChange() {
         waiting = document.hidden; // If the page becomes inactive, pause the search
         queryElement();
      }

      function queryElement() {
         if (!waiting && document.readyState === 'complete') {
            waiting = true;
            setTimeout(() => {
               selectors.forEach(selector => {
                  // Add attribute mark to selector if provided
                  const selectorWithAttrMark = attr_mark ? `${selector}:not([${attr_mark}])` : selector;

                  // Find elements matching the selector
                  document.querySelectorAll(selectorWithAttrMark).forEach(el => {
                     if (attr_mark) {
                        el.setAttribute(attr_mark, true);
                     }
                     // Call the callback function for each element
                     callback(el);
                  });
               });

               waiting = false;
            }, 100); // Adjust throttle time as needed
         }
      }

      function stopJob() {
         observerFactory.disconnect();
         document.removeEventListener('visibilitychange', handleVisibilityChange);
         if (typeof destroyTimeout === 'number') clearTimeout(destroyTimeout);
      }
   },

   /**
    * @param  {function} callback
    * @return {void}
   */
   // Check if URL has changed
   runOnPageLoad(callback = required()) {
      if (typeof callback !== 'function') {
         console.error('callback is not a function:', typeof callback, callback);
         return;
      }
      let prevURL = document.URL;

      // Initial call to callback if URL hasn't changed
      if (!isURLChange()) callback();
      // update
      // window.addEventListener('transitionend', () => isURLChange() && callback());
      document.addEventListener('yt-navigate-finish', () => isURLChange() && callback());

      function isURLChange() {
         return (prevURL === document.URL) ? false : prevURL = document.URL;
      }
   },

   /**
    * @param  {obj/string} css
    * @param  {string*} selector
    * @param  {boolean*} is_important
    * @return {void}
   */
   css: {
      push(css = required(), selector, is_important) {
         // console.debug('css\n', ...arguments);
         if (typeof css === 'object') {
            if (!selector) {
               console.error('css is not a object:', typeof selector, selector);
               return;
            }
            // prevent a complex css because of one ":has()" selector is stupid
            // if (!CSS.supports('selector(:has(*))')) {
            //    console.error('CSS ":has()" unsupported:', selector);
            //    return;
            // }

            const cssString = json2css(css);
            injectCss(`${selector} { ${cssString} }`);
         }
         else if (typeof css === 'string') {
            injectCss(css);
         }
         else {
            console.error('CSS is not object/string:', typeof css, css);
            return;
         }

         function json2css(obj = required()) {
            if (typeof obj !== 'object') {
               console.error('json2css argument is not a object:', typeof obj, obj);
               return;
            }
            let css = '';
            Object.entries(obj).forEach(([key, value]) => {
               css += `${key}:${value}${is_important ? ' !important' : ''};`;
            });
            return css;
         }

         function injectCss(source = required()) {
            if (typeof source !== 'string') {
               console.error('source is not a string:', source);
               return;
            }

            // Try using document.adoptedStyleSheets
            if (window.CSSStyleSheet && window.CSSStyleSheet.prototype.replaceSync) {
               const sheet = new CSSStyleSheet();
               sheet.replaceSync(source);
               document.adoptedStyleSheets = [sheet, ...document.adoptedStyleSheets];
            }
            // Fallback to sheet.textContent
            else if (document.head) {
               const sheetId = 'NOVA-style';
               const sheet = document.getElementById(sheetId) || createStyleSheet(sheetId);
               // sheet.textContent += `/**/\n${source.replace(/\n+\s{2,}/g, ' ')}\n`;
               // sheet.innerText += '/**/\n' + source
               sheet.textContent += '/**/\n' + source
                  .replace(/\n+\s{2,}/g, ' ') // singleline format
                  // multiline format
                  // .replace(/\n+\s{2,}/g, '\n\t')
                  // .replace(/\t\}/mg, '}')
                  + '\n';

               function createStyleSheet(id) {
                  const style = document.createElement('style');
                  style.type = 'text/css';
                  style.id = id;
                  document.head.append(style);
                  return style;
               }
            }
            // Fallback to sheet.insertRule()
            else {
               const sheet = document.styleSheets[0] || document.createElement('style');
               sheet.insertRule(source, sheet.cssRules.length);
               document.head.append(sheet);
            }
         }
      },

      /**
       * @param  {string/Node} selector
       * @param  {string} prop_name
       * @param  {boolean} int
       * @return {string}
      */
      // https://developer.mozilla.org/ru/docs/Web/API/CSSStyleDeclaration
      // HTMLElement.prototype.getIntValue = () {}
      // const { position, right, bottom, zIndex, boxShadow } = window.getComputedStyle(container); // multiple
      get(selector = required(), prop_name = required()) {
         const el = (selector instanceof HTMLElement) ? selector : document.body?.querySelector(selector);
         return el ? getComputedStyle(el).getPropertyValue(prop_name) : null;
      },
      // getCssBatch(selector, propNames) {
      //    const styles = getComputedStyle(document.body.querySelector(selector));
      //    const values = {};
      //    for (const propName of propNames) {
      //       values[propName] = styles.getPropertyValue(propName);
      //    }
      //    return values;
      // }
   },

   cookies: {
      // 97.1 % slower
      // get(name = required()) {
      //    if (!navigator.cookieEnabled) return;
      //    return Object.fromEntries(
      //       document.cookie
      //          .split(/; */)
      //          .map(c => {
      //             const [key, ...v] = c.split('=');
      //             return [key, decodeURIComponent(v.join('='))];
      //          })
      //    )[name];
      // },
      // get(name = required()) {
      //    return (matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
      //       && decodeURIComponent(matches[1]));
      // },
      get(name = required()) {
         if (!navigator.cookieEnabled) return;
         return (match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))) && decodeURIComponent(match[2]);
      },
      // 70.38 % slower
      // set(name = required(), value = '', days = 90) { // 90 days
      //    if (!navigator.cookieEnabled) return;
      //    let date = new Date();
      //    date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);

      //    document.cookie = Object.entries({
      //       [encodeURIComponent(name)]: value,
      //       // domain: '.' + location.hostname.split('.').slice(-2).join('.'),  // "www.youtube.com" => ".youtube.com"
      //       domain: location.hostname,
      //       expires: date.toUTCString(),
      //       path: '/', // what matters at the end
      //    })
      //       .map(([key, value]) => `${key}=${value}`).join('; ');

      //    // console.assert(this.get(name) == value, 'cookie set err:', ...arguments, document.cookie);
      // },
      // set(name = required(), value = '', options) {
      //    if (!navigator.cookieEnabled) return;
      //    options = options || {};

      //    let expires = options.expires;

      //    if (typeof expires === 'number' && expires) {
      //       let d = new Date();
      //       d.setTime(d.getTime() + expires * 1000);
      //       expires = options.expires = d;
      //    }
      //    if (expires && expires.toUTCString) {
      //       options.expires = expires.toUTCString();
      //    }

      //    value = encodeURIComponent(value);

      //    let updatedCookie = name + "=" + value;

      //    for (let propName in options) {
      //       if (options.hasOwnProperty(propName)) {
      //          updatedCookie += "; " + propName;
      //          let propValue = options[propName];
      //          if (propValue !== true) {
      //             updatedCookie += "=" + propValue;
      //          }
      //       }
      //    }

      //    document.cookie = updatedCookie;
      // },
      set(name = required(), value = '', days = 90) { // 90 days
         if (!navigator.cookieEnabled) return;
         let expires = '';
         if (+days) {
            let date = new Date();
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000 * days));
            expires = '; expires=' + date.toGMTString();
         }
         document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';path=/' + expires;
         // console.assert(this.get(name) == value, 'cookie set err:', ...arguments, document.cookie);
      },
      delete(name) {
         if (!navigator.cookieEnabled) return;
         this.set(name, '', -1);
      },
      clear() {
         if (!navigator.cookieEnabled) return;
         for (const key in this.get()) {
            this.delete(key);
         }
         const domain = location.hostname.replace(/^www\./i, '');
         this.clearAllCookies(domain);
      },
      clearAllCookies(domain) {
         if (!navigator.cookieEnabled) return;

         let cookies = document.cookie.split('; ');
         for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookies.indexOf('=');
            const name = eqPos > -1 ? cookies.substr(0, eqPos) : cookie;
            const cookieDomain = location.hostname.replace(/^www\./i, '');
            if (cookieDomain === domain || cookieDomain.endsWith('.' + domain)) {
               document.cookie = name + `=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=${cookieDomain};path=/`;
            }
         }
      },
      // 47.69 % slower
      // parseQueryToObj(str) {
      //    return str && [...new URLSearchParams(str).entries()]
      //       .reduce((acc, [k, v]) => ((acc[k] = v), acc), {});
      // },
      parseQueryToObj(str) {
         return str && Object.fromEntries(
            str
               ?.split(/&/)
               .map(c => {
                  const [key, ...v] = c.split('=');
                  return [key, decodeURIComponent(v.join('='))];
               }) || []
         );
      },
      updateParam({ key = required(), param = required(), value = required() }) {
         let paramsObj = this.getParamLikeObj(key) || {};

         if (paramsObj[param] != value) {
            paramsObj[param] = value;
            this.set(key, NOVA.queryURL.set(paramsObj).split('?').pop());
            location.reload();
         }
      },
   },

   /**
    * @param  {Node} el
    * @return  {boolean}
   */
   isInViewport(el = required()) {
      if (!(el instanceof HTMLElement)) {
         console.error('el is not a HTMLElement:', typeof el, el);
         return;
      }

      const rect = el.getBoundingClientRect();
      if (!rect) return;

      const { top, left, bottom, right } = rect;
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;

      return (
         top >= 0
         && left >= 0
         && bottom <= windowHeight
         && right <= windowWidth
      );
   },

   /**
    * @param  {Node} el
    * @return  {boolean}
   */
   isVisible(el = required(), deeper = false) {
      if (!(el instanceof HTMLElement)) {
         console.error('el is not a HTMLElement:', typeof el, el);
         return;
      }
      // Check visibility of main element
      if (isHidden(el)) {
         return false;
      }

      // check parents
      let parent = el.offsetParent;
      while (parent && parent !== document.body) {
         if (isHidden(parent)) {
            return false;
         }
         if (!deeper) break;
         parent = parent.offsetParent;
      }

      return true;

      function isHidden(element = required()) {
         const { offsetHeight, offsetWidth } = element;
         if (offsetHeight === 0 || offsetWidth === 0) {
            return true;
         }
         const rect = element.getBoundingClientRect();
         if (rect.width === 0 || rect.height === 0) {
            return true;
         }

         const { display, visibility, opacity } = window.getComputedStyle(element);
         if (display === 'none'
            || visibility !== 'visible'
            || parseFloat(opacity) === 0
         ) {
            return true;
         }
      }
   },

   /* NOVA.collapseElement({
         selector: '#secondary #related',
         label: 'related',// auto uppercase
         remove: true,
         remove: (user_settings.NAME_visibility_mode == 'remove') ? true : false,
   }); */
   /**
    * @param  {string} selector
    * @param  {string} label
    * @param  {boolean} remove
    * @return {void}
   */
   collapseElement({ selector = required(), label = required(), remove }) {
      // console.debug('collapseElement', ...arguments);
      // Validate arguments
      if (typeof selector !== 'string') {
         console.error('selector is not a string:', selector);
         return;
      }

      const selector_id = `${label.match(/[a-z]+/gi).join('')}-prevent-load-btn`;

      this.waitSelector(selector.toString())
         .then(el => {
            if (remove) el.remove();
            else {
               if (document.getElementById(selector_id)) {
                  return;
               }
               // Hide the element
               el.style.display = 'none';
               // Create the "Load" button
               const btn = document.createElement('a');
               btn.textContent = `Load ${label}`;
               btn.id = selector_id;
               btn.classList.add('more-button', 'style-scope', 'ytd-video-secondary-info-renderer');
               // btn.className = 'ytd-vertical-list-renderer';
               // btn.style.cssText = '';
               Object.assign(btn.style, {
                  cursor: 'pointer',
                  'text-align': 'center',
                  'text-transform': 'uppercase',
                  display: 'block',
                  color: 'var(--yt-spec-text-secondary)',
               });
               btn.addEventListener('click', () => {
                  btn.remove();
                  el.style.display = 'inherit';
                  window.dispatchEvent(new Event('scroll')); // need to "comments-visibility" (https://stackoverflow.com/a/68202306)
               });
               el.before(btn);
            }
         });
   },

   aspectRatio: {
      /**
       * @param  {object} 4 int
       * @return {Object} { width, height }
      */
      sizeToFit({
         src_width = required(), src_height = required(),
         // max_width = window.innerWidth, max_height = window.innerHeight // viewport size
         max_width = screen.width, max_height = screen.height // screen size
      }) {
         // console.debug('aspectRatioFit:', ...arguments);
         const aspectRatio = Math.min(max_width / +src_width, max_height / +src_height, 1); // "1" if src < max
         return {
            width: +src_width * aspectRatio,
            height: +src_height * aspectRatio,
         };
      },

      /**
       * @param  {object} 2 int
       * @return {object} string
      */
      // extractRatio({ width = required(), height = required() }) {
      getAspectRatio({ width = required(), height = required() }) {
         // for test https://www.youtube.com/watch?v=738UOATPjwc

         // 'width': NOVA.videoElement.clientWidth, // 677
         // 'height': NOVA.videoElement.clientHeight, // 508

         // 'width': movie_player.clientWidth, // 1825
         // 'height': movie_player.clientHeight, // 508

         // 'width': NOVA.videoElement?.videoWidth, // 1440
         // 'height': NOVA.videoElement?.videoHeight, // 1080

         // Scale video dimensions to fit the client area while maintaining aspect ratio.
         if (width == NOVA.videoElement?.videoWidth && height == NOVA.videoElement?.videoHeight) {
            width = Math.min(width, NOVA.videoElement?.clientWidtho);
            height = Math.min(height, NOVA.videoElement?.clientHeight);
         }

         // Check if the aspect ratio is too close to a perfect square.
         const ASPECT_RATIO_TOLERANCE = 0.05; // 5% tolerance from a perfect square (1:1)
         // const maxDiff = Math.abs((width / height) - 1);
         const maxDiff = Math.abs(width - height) / Math.max(width, height);
         const isTooCloseToSquare = maxDiff <= ASPECT_RATIO_TOLERANCE;

         if (isTooCloseToSquare) return '1:1';

         const
            gcd = (a, b) => b ? gcd(b, a % b) : a,
            divisor = gcd(width, height),
            w = width / divisor,
            h = height / divisor;

         return w + ':' + h;

         // switch (w + ':' + h) {
         //    case '64:27':
         //    case '43:18':
         //    case '12:5':
         //    case '7:3':
         //       return '21:9';
         //    case '2:1':
         //       return '18:9';
         //    case '18:5':
         //    case '16:5':
         //       return '32:9';
         //    case '16:9':
         //       return '16:9';
         //    case '16:10':
         //       return '16:10';
         //    case '41:30':
         //    case '4:3':
         //       return '4:3';
         //    default:
         //       return w + ':' + h;
         // }
      },

      /**
       * @param  {object} 2 int
       * @return {int}
      */
      chooseAspectRatio({ width = required(), height = required(), layout }) {
         // from list ['4:3', '16:9']
         // const ratio = width / height;
         // return (Math.abs(ratio - 4 / 3) < Math.abs(ratio - 16 / 9)) ? '4:3' : '16:9';

         const acceptedRatioList = {
            landscape: {
               '1:1': 1,
               '3:2': 1.5,
               '4:3': 1.33333333333,
               '5:4': 1.25,
               '5:3': 1.66666666667,
               '16:9': 1.77777777778,
               '16:10': 1.6,
               '17:9': 1.88888888889,
               '21:9': 2.33333333333,
               '24:10': 2.4,
            },
            portrait: {
               '1:1': 1,
               '2:3': .66666666667,
               '3:4': .75,
               '3:5': .6,
               '4:5': .8,
               '9:16': .5625,
               '9:17': .5294117647,
               '9:21': .4285714286,
               '10:16': .625,
            },
         };
         return choiceRatioFromList(this.getAspectRatio({ width, height })) || acceptedRatioList.landscape['16:9'];

         function choiceRatioFromList(ratio = required()) {
            const layout_ = layout || ((ratio < 1) ? 'portrait' : 'landscape');
            return acceptedRatioList[layout_][ratio];
         }
      },

      /**
       * @param  {height|width} int
       * @param  {aspectRatio*} int
       * @return {int}
       * source - https://codepen.io/codemediaweb/pen/OJjmwNJ
      */
      calculateHeight: (width = required(), aspectRatio = (16 / 9)) => parseFloat((width / aspectRatio).toFixed(2)),
      calculateWidth: (height = required(), aspectRatio = (16 / 9)) => parseFloat((height * aspectRatio).toFixed(2)),
      // universale
      // fitToSize({ width, height, aspectRatio = (16 / 9) }) {
      // sizeToRatio({ width, height, aspectRatio = (16 / 9) }) {
      //    if (ratio = width ? (height / aspectRatio) : width ? (height / aspectRatio) : null) {
      //       return parseFloat(ratio).toFixed(2);
      //    }
      // },
   },

   /**
    * @param  {object} 2 str, 2 int
    * @return {void}
   */
   openPopup({
      url = required(),
      title = document.title,
      width = window.innerWidth,
      height = window.innerHeight,
      on_closed_callback,
   }) {
      let top = left = 0;
      try {
         // Сenter of the parent window
         const
            parentWindow = window.opener || window.parent,
            zoom = getPageZoomLevel(),
            // Uncaught SecurityError: Failed to read a named property 'screenX' from 'Window': Blocked a frame with origin
            parentLeft = parentWindow.screenX || parentWindow.screenLeft || 0,
            parentTop = parentWindow.screenY || parentWindow.screenTop || 0,
            parentWidth = parentWindow.innerWidth || parentWindow.document.documentElement.clientWidth,
            parentHeight = parentWindow.innerHeight || parentWindow.document.documentElement.clientHeight;

         // Calculate the position of the popup window
         left = parentLeft + (parentWidth * zoom - width) / 2;
         top = parentTop + (parentHeight * zoom - height) / 2;
      } catch (err) {
         // Сenter screen
         left = (window.screen.width / 2) - (width / 2);
         top = (window.screen.height / 2) - (height / 2);
      }

      const win = window.open(url, '_blank', `popup=1,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,copyhistory=no,width=${width},height=${height},top=${top},left=${left}`);

      // Set the title of the popup window
      if (win.document) { // Uncaught TypeError: Cannot read properties of null (reading 'document')
         win.document.title = title;
      }

      if (on_closed_callback && typeof on_closed_callback === 'function') {
         const timer = setInterval(() => {
            if (win.closed) {
               clearInterval(timer);
               on_closed_callback();
            }
         }, 500); // timeout 500ms
      }

      function getPageZoomLevel() {
         try {
            // Uncaught SecurityError: Failed to read a named property 'outerWidth' from 'Window': Blocked a frame with origin "https://www.youtube.com" from accessing a cross-origin frame.
            return (parentWindow.outerWidth / parentWindow.innerWidth).toFixed(2);
         } catch (err) {
            const screenWidth = window.screen.width;
            const screenHeight = window.screen.height;

            const clientWidth = document.documentElement.clientWidth || document.body.clientWidth;
            const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;

            // Calculate the zoom level based on the width and height
            const zoomLevelWidth = (screenWidth / clientWidth).toFixed(2);
            const zoomLevelHeight = (screenHeight / clientHeight).toFixed(2);

            return Math.min(zoomLevelWidth, zoomLevelHeight); // Return the minimum zoom level between width and height
         }

      }
   },

   /**
    * @param  {HTMLElement}
    * @return {void}
   */
   // simulateClick(el = required()) {
   //    if (!(el instanceof HTMLElement)) {
   //       console.error('el is not a HTMLElement:', el);
   //       return;
   //    }

   //    // Check if MouseEvent is supported
   //    if (!window.MouseEvent) {
   //       throw new Error('MouseEvent is not supported in this browser');
   //    }

   //    ['mouseover', 'mousedown', 'mouseup', 'click']
   //       .forEach(evt => {
   //          el.dispatchEvent(new MouseEvent(evt, {
   //             bubbles: true,
   //             cancelable: true,
   //             view: window,
   //             target: el,
   //          }));
   //       });
   // },

   /**
    * @param  {string} text
    * @return {void}
   */
   showOSD({
      message = '',
      ui_value,
      ui_max,
      source,
      fade_ms,
   }) {
      // for [player-indicator] plugin
      document.dispatchEvent(
         new CustomEvent(
            'nova-osd',
            {
               bubbles: true,
               detail: {
                  message,
                  ui_value,
                  ui_max,
                  source,
                  fade_ms,
               }
            })
      );

      triggerBezel.apply(this, [message]);

      function triggerBezel(text) {
         // console.debug('showOSD', ...arguments);
         if (!text || !['watch', 'embed'].includes(this.currentPage)) return;
         if (typeof this.fadeBezel === 'number') clearTimeout(this.fadeBezel); // reset fade

         const bezelEl = document.body.querySelector('.ytp-bezel-text');
         if (!bezelEl) return console.error(`showOSD ${text}=>${bezelEl}`);

         const
            bezelContainer = bezelEl.parentElement.parentElement,
            CLASS_VALUE = 'ytp-text-root',
            SELECTOR = '.' + CLASS_VALUE; // for css

         if (!this.bezel_css_inited) {
            this.bezel_css_inited = true;
            this.css.push(
               `${SELECTOR} { display: block !important; }
               ${SELECTOR} .ytp-bezel-text-wrapper {
                  pointer-events: none;
                  z-index: 40 !important;
               }
               ${SELECTOR} .ytp-bezel-text { display: inline-block !important; }
               ${SELECTOR} .ytp-bezel { display: none !important; }`);
         }

         bezelEl.textContent = text;
         bezelContainer.classList.add(CLASS_VALUE);

         let ms = 1200;
         if ((text = String(text)) && (text.endsWith('%') || text.endsWith('x') || text.startsWith('+'))) {
            ms = 600
         }

         this.fadeBezel = setTimeout(() => {
            bezelContainer.classList.remove(CLASS_VALUE);
            bezelEl.textContent = ''; // fix not showing bug when frequent calls
         }, ms);
      }
   },

   /**
    * @param  {int} video_duration
    * @return {array}
   */
   getChapterList(video_duration = required()) {
      if (typeof video_duration !== 'number') {
         console.warn('video_duration is not a number:', video_duration);
         return;
      }

      switch (NOVA.currentPage) {
         case 'embed':
            const chapsCollectEmbed = getFromAPI();
            // console.debug('chapsCollect (embed)', chapsCollectEmbed);
            return chapsCollectEmbed;
            break;

         // Solution 2
         case 'watch':
            const chapsCollectWatch = getFromDescriptionText();
            // if ((chapsCollect = getFromDescriptionText() || getFromDescriptionChaptersBlock())
            return chapsCollectWatch;
            break;

         default:
            console.warn('Unsupported page:', NOVA.currentPage);
      }

      function descriptionExpand() {
         document.body.querySelector('#meta [collapsed] #more, [description-collapsed] #description #expand')?.click();
      }

      function getFromDescriptionText() {
         descriptionExpand();

         video_duration = Math.trunc(video_duration);
         const selectorTimestampLink = 'a[href*="&t="]';
         let
            timestampsCollect = [],
            unreliableSorting;

         [
            // description text
            // https://www.youtube.com/watch?v=4_m3HsaNwOE - bold chapater "Screenshot moment" show markdown "*Screenshot moment*"(
            (
               movie_player.getPlayerResponse()?.videoDetails?.shortDescription
               || document.body.querySelector('ytd-watch-metadata #description.ytd-watch-metadata')?.innerText
            )
               ?.split('\n') || [],

            // first comment (pinned)
            // '#comments ytd-comment-thread-renderer:first-child #content',
            // Solution 1. To above v105 https://developer.mozilla.org/en-US/docs/Web/CSS/:has
            // all comments
            [...document.body.querySelectorAll(`#comments #comment #comment-content:has(${selectorTimestampLink})`)]
               .map(el => [...el.querySelectorAll(selectorTimestampLink)]
                  .map(a => ({
                     'source': 'comment',
                     // for test https://www.youtube.com/watch?v=4SDlcydjk9A&lc=UgxJk_OAS9GHKhL2zT14AaABAg
                     'text': `${a.innerText} ${(a.nextSibling || a.previousSibling)?.innerText}`, // a.nextElementSibling || a.previousElementSibling
                  }))
               )
               ?.sort((a, b) => b.length - a.length) // sort by length
               ?.shift() // get first (max timestamp)
            // ?.flat() // Doesn't work
            || []

         ]
            ?.sort((a, b) => b.length - a.length) // sort by maximum number of chapters. Comment this line for preset (#1 description, #2 comments) (test - https://www.youtube.com/watch?v=Wy11aSF-HXs)
            .forEach(chaptersList => {
               // console.debug('chaptersList:', chaptersList);
               if (timestampsCollect.length > 1) return; // skip if exist in priority selector (sort by maximum number of chapters) OR (#1 description, #2 comments)

               let prevSec = -1;

               chaptersList
                  .forEach(line => {
                     // console.debug('line', line);
                     // needed for check, applying sorting by timestamps
                     unreliableSorting = Boolean(line?.source);
                     line = (line?.text || line).toString().trim(); // clear spaces
                     if (line.length > 5 // min line length
                        && (timestamp = /((\d?\d:){1,2}\d{2})/g.exec(line))
                        && (line.length - timestamp.length) < 200 // max line length
                     ) {
                        // console.debug('line', line);
                        timestamp = timestamp[0]; // ex:"0:00"
                        const
                           sec = NOVA.formatTime.hmsToSec(timestamp),
                           timestampPos = line.indexOf(timestamp);

                        if (
                           // fix invalid sort timestamp
                           // ex: https://www.youtube.com/watch?v=S66Q7T7qqxU
                           (unreliableSorting ? true : (sec > prevSec && sec < (+video_duration - 5)))
                           // not in the middle of the line ("2" - is a possible error. For example, at the end of the line there is a comma and the time is in brackets)
                           // ex: https://www.youtube.com/watch?v=5Do_0aWpYeo
                           && (timestampPos < 5 || (timestampPos + timestamp.length) > (line.length - 2))
                        ) {
                           if (unreliableSorting) prevSec = sec;

                           timestampsCollect.push({
                              'sec': sec,
                              'time': timestamp.startsWith('0')
                                 ? NOVA.formatTime.HMS.digit(sec) // clear zeros prefix (like "00:05:11" -> "5:11")
                                 : timestamp,
                              'title': line
                                 // .replace(timestamp, '')
                                 // https://www.youtube.com/watch?v=5Do_0aWpYeo - Phoenix (0:37)
                                 // https://www.youtube.com/watch?v=S5_Fk51hbFw - 5:21 Save Time with Text Snippets (Text Blaze)
                                 // https://www.youtube.com/watch?v=PD8xu0ooYko - 10. Anti Heaven 97 (Knights Ver.) 28:22
                                 // https://www.youtube.com/watch?v=OFx2ZXEIw-0 - 3:40 Cuphead (1080p)
                                 // .replace(/(\(\)|\[\])/g, '') // clear of brackets
                                 .replace(new RegExp(`((?:\\[\\(]|\\(|\\[)?)(${timestamp})(?:\\]|\\)|\\])?`, 'g'), '') // timestamp + brackets
                                 .replace(/\*(.*?)\*/g, '<b>$1</b>').trim() // convert Markdown bold text to html
                                 .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '') // Symbols
                                 .trim()
                                 .replace(/^([\u2011-\u26FF:\-|/]+)/, '') // beginning of the line
                                 .replace(/([\u2011-\u26FF:\-;|/]+|(\.))$/g, '') // end of the line, exclude "text..."
                                 // .trim().replace(/^\d+[.):]\s+/g, '') // clear numeric list prefix
                                 .trim(),
                           });
                        }
                        // else {
                        //    console.debug('skip line:', line);
                        // }
                     }
                  });
            });

         // if 1 mark < 25% video_duration
         if (timestampsCollect.length == 1 && (timestampsCollect[0].sec < (video_duration / 4))) {
            return timestampsCollect;
         }
         else if (timestampsCollect.length > 1) {
            if (unreliableSorting) {
               // apply sort by sec (ex: https://www.youtube.com/watch?v=kXsAqdwB52o&lc=Ugx0zm8M0iSAFNvTV_R4AaABAg)
               timestampsCollect = timestampsCollect.sort((a, b) => a.sec - b.sec);
            }
            // console.debug('timestampsCollect', timestampsCollect);
            return timestampsCollect;
         }
      }

      // function getFromDescriptionChaptersBlock() {
      //    descriptionExpand();

      //    const selectorTimestampLink = 'a[href*="&t="]';
      //    let timestampsCollect = [];
      //    let prevSec = -1;
      //    document.body.querySelectorAll(`#structured-description ${selectorTimestampLink}`)
      //       // document.body.querySelectorAll(`#description.ytd-watch-metadata ${selectorTimestampLink}`)
      //       .forEach(chapterLink => {
      //          // console.debug('chapterLink:', chapterLink);
      //          // filter duplicate
      //          const sec = parseInt(NOVA.queryURL.get('t', chapterLink.href));
      //          if (sec > prevSec) {
      //             prevSec = sec;
      //             timestampsCollect.push({
      //                'time': NOVA.formatTime.HMS.digit(sec),
      //                'sec': sec,
      //                'title': chapterLink.textContent.trim().split('\n')[0].trim(),
      //                // in #structured-description
      //                // 'time': chapterLink.querySelector('#time')?.textContent,
      //                // 'title': chapterLink.querySelector('h4')?.textContent,
      //             });
      //          }
      //       });
      //    // if 1 mark < 25% video_duration. Ex skip intro info in comment
      //    if (timestampsCollect.length == 1 && (timestampsCollect[0].sec < (video_duration / 4))) {
      //       return timestampsCollect;
      //    }
      //    else if (timestampsCollect.length > 1) {
      //       // console.debug('timestamepsCollect', timestampsCollect);
      //       return timestampsCollect;
      //    }
      // }

      function getFromAPI() {
         // console.debug('getFromAPI');
         if (!window.ytPubsubPubsubInstance) {
            console.warn('ytPubsubPubsubInstance is empty:', ytPubsubPubsubInstance);
            return;
         }

         if ((ytPubsubPubsubInstance = ytPubsubPubsubInstance.i // embed
            || ytPubsubPubsubInstance.j // watch
            || ytPubsubPubsubInstance.subscriptions_ // navigation
         )
            && Array.isArray(ytPubsubPubsubInstance)
         ) {
            const data = Object.values(
               ytPubsubPubsubInstance.find(a => a?.player)?.player.app
            )
               .find(a => a?.videoData)
               ?.videoData.multiMarkersPlayerBarRenderer;

            if (data?.markersMap?.length) {
               return data.markersMap[0].value.chapters
                  ?.map(c => {
                     const sec = Math.trunc(c.chapterRenderer.timeRangeStartMillis) / 1000;
                     return {
                        'sec': sec,
                        'time': NOVA.formatTime.HMS.digit(sec),
                        'title':
                           c.chapterRenderer.title.simpleText // watch
                           || c.chapterRenderer.title.runs[0].text, // embed
                     };
                  });
            }
         }
      }

   },

   // there are problems with the video https://www.youtube.com/watch?v=SgQ_Jk49FRQ. Too lazy to continue testing because it is unclear which method is more optimal.
   // getChapterList(video_duration = required()) {
   //    const selectorLinkTimestamp = 'a[href*="&t="]';
   //    let timestampList = [];
   //    let prevSec = -1;

   //    document.body.querySelectorAll(`ytd-watch-metadata #description ${selectorLinkTimestamp}, #contents ytd-comment-thread-renderer:first-child #content ${selectorLinkTimestamp}`)
   //       .forEach((link, i, arr) => {
   //          // const prev = arr[i-1] || -1; // needs to be called "hmsToSecondsOnly" again. What's not optimized
   //          const sec = parseInt(this.queryURL.get('t', link.href));
   //          if (sec > prevSec && sec < +video_duration) {
   //             prevSec = sec;
   //             // will be skip - time: '0:00'
   //             timestampList.push({
   //                // num: ++i,
   //                sec: sec,
   //                time: link.textContent,
   //                title: link.parentElement.textContent
   //                   .split('\n')
   //                   .find(line => line.includes(link.textContent))
   //                   .replaceAll(link.textContent, '')
   //                   .trim()
   //                   .replace(/(^[:\-–—]|[:\-–—.;]$)/g, '')
   //                   .trim()
   //             });
   //          }
   //       });
   //    console.debug('timestampList', timestampList);

   //    if (timestampList?.length > 1) { // clear from "lying timestamp"
   //       return timestampList.filter(i => i.title.length < 80);
   //    }
   // },

   /**
    * @param  {str} str
    * @return {@Nullable array}
   */
   strToArray(str) {
      return str
         ?.trim().split(/[\n,;]/)
         // .map(e => e.toString().trim().toLowerCase())
         // .map(e => e.replace(/(\s\n)$/, '')) // trim new line
         .map(e => e.replace(/^(\s+)$/, '')) // trim empty line
         .filter(e => e.length);
   },

   /**
    * @param  {string} keyword
    * @param  {string} search_selectors
    * @param  {boolean*} filter_selector
    * @return {void}
   */
   searchFilterHTML({
      keyword = required(),
      search_selectors = required(),
      filter_selector,
      highlight_class,
   }) {
      // console.debug('searchFilterHTML:', ...arguments);
      keyword = keyword.toString().toLowerCase();

      document.body.querySelectorAll(search_selectors)
         .forEach(item => {
            const text = item.innerText;
            const isfound = text.toLowerCase().includes(keyword);

            if (filter_selector) {
               item.querySelectorAll(filter_selector).forEach(highlight);
            }
            else {
               highlight(item);
            }

            function highlight(el) {
               // clear highlight tags
               if (el.innerHTML.includes('<mark ')) {
                  el.innerHTML = NOVA.createSafeHTML(el.innerHTML.replace(/<\/?mark[^>]*>/g, ''));
               }
               // hide el out of search
               item.style.display = isfound ? '' : 'none';

               if (isfound && keyword) {
                  highlightTerm({
                     target: el,
                     keyword,
                     highlight_class,
                  });
               }
            }
         });

      function highlightTerm({ target = required(), keyword = required(), highlight_class }) {
         // console.debug('highlightTerm:', ...arguments);
         const
            // content = target.innerHTML,
            // content = target.textContent,
            content = target.innerText,
            pattern = new RegExp('(>[^<.]*)?(' + escapeRegExp(keyword) + ')([^<.]*)?', 'gi'),
            highlightStyle = highlight_class ? `class="${highlight_class}"` : 'style="background-color:#afafaf"',
            replaceWith = `$1<mark ${highlightStyle}>$2</mark>$3`,
            marked = content.replaceAll(pattern, replaceWith);

         return (target.innerHTML = NOVA.createSafeHTML(marked)) !== content;

         // function escapeRegExp(string) {
         //    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         // }
         function escapeRegExp(str) { // Escape RegExp special characters
            return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'); // skip '.', '+', '?', и '*'
         }
      }
   },

   /**
    * Makes an elemenet draggable around the screen.
    * @param {string} el Select an element from the DOM to become draggable
   */
   Draggable: class {
      constructor(drag_container = document.body) {
         if (!(drag_container instanceof HTMLElement)) {
            console.error('drag_container not HTMLElement:', drag_container);
            return;
         }
         // this.DEBUG = true;

         this.dragging = {
            target: null,
            moving: false,
            offset: { x: 0, y: 0 },
            initial: { x: 0, y: 0 },
            current: { x: 0, y: 0 },
            final: { x: 0, y: 0 },
            dragContainer: drag_container,
            attrOnMoving: 'nova-el-moving',
         };

         // Bind methods to current instance
         this.reset = this.reset.bind(this);
         this.disable = this.disable.bind(this);
         this.dragStart = this.dragStart.bind(this);
         this.dragEnd = this.dragEnd.bind(this);
         this.draging = this.draging.bind(this);
         this.moveByCoordinates = this.moveByCoordinates.bind(this);
      }

      init(target_el = required()) {
         if (!(target_el instanceof HTMLElement)) {
            console.error('target_el not HTMLElement:', target_el);
            return;
         }
         this.log('drag init', ...arguments);

         this.dragging.target = target_el;

         // touchs
         document.addEventListener('touchstart', this.dragStart);
         document.addEventListener('touchend', this.dragEnd);
         document.addEventListener('touchmove', this.draging);
         // // document.addEventListener('focusin', this..bind(this));
         // // document.addEventListener('focusout', this..bind(this));
         // mouse
         document.addEventListener('mousedown', this.dragStart);
         document.addEventListener('mouseup', this.dragEnd);
         document.addEventListener('mousemove', this.draging);

         // css on moving
         // NOVA.css.push(
         //    `[${this.dragging.attrOnMoving}]:active {
         //       pointer-events: none;
         //       cursor: grab; /* <-- Doesn't work */
         //       outline: 2px dashed #3ea6ff !important;
         //    }`);
      }

      reset(clear_final) {
         // switchElement.style.transform = ''; // clear drag state
         this.dragging.target?.style.removeProperty('transform');// clear drag state
         this.dragging.final = clear_final
            ? this.dragging.offset.x = this.dragging.offset.y = 0
            : { x: this.dragging.offset.x, y: this.dragging.offset.y }; // save pos
      }

      disable() {
         this.log('dragDisable', this.dragging);
         this.dragging.target = null;

         // touchs
         document.removeEventListener('touchstart', this.dragStart);
         document.removeEventListener('touchend', this.dragEnd);
         document.removeEventListener('touchmove', this.draging);
         // document.removeEventListener('focusin', this..bind(this));
         // document.removeEventListener('focusout', this..bind(this));
         // mouse
         document.removeEventListener('mousedown', this.dragStart);
         document.removeEventListener('mouseup', this.dragEnd);
         document.removeEventListener('mousemove', this.draging);
      }

      dragStart(evt) {
         if (!this.dragging.target.contains(evt.target)) return;
         // if (!evt.target.querySelector(PINNED_SELECTOR)) return; // Doesn't work
         this.log('dragStart', this.dragging);

         const { targetX, targetY } = this.getTargetCoordinates(evt);
         this.dragging.initial.x = targetX - (this.dragging.offset.x || 0);
         this.dragging.initial.y = targetY - (this.dragging.offset.y || 0);

         this.dragging.moving = true;
      }

      dragEnd(evt) {
         if (!this.dragging.moving) return;
         this.log('dragEnd', this.dragging);

         this.dragging.initial.x = this.dragging.current.x;
         this.dragging.initial.y = this.dragging.current.y;

         this.dragging.moving = false;
         this.dragging.target.style.pointerEvents = null;
         this.dragging.target.removeAttribute(this.dragging.attrOnMoving); // unmark after moved
         document.body.style.cursor = '';
      }

      draging(evt) {
         if (!this.dragging.moving) return;
         this.log('draging', this.dragging);

         this.dragging.target.style.pointerEvents = 'none';
         // document.body.style.cursor = 'grab';
         document.body.style.cursor = 'move';

         if (!this.dragging.target.hasAttribute(this.dragging.attrOnMoving)) {
            this.dragging.target.setAttribute(this.dragging.attrOnMoving, true); // mark on moving
         }

         const { targetX, targetY } = this.getTargetCoordinates(evt);
         // Calculate the delta from the initial position
         const dx = targetX - this.dragging.initial.x;
         const dy = targetY - this.dragging.initial.y;

         // Limit viewport
         if (this.dragging.dragContainer) {
            const dragContainerHeight = this.dragging.dragContainer.clientHeight || window.innerHeight;
            const dragContainerWidth = this.dragging.dragContainer.clientWidth || window.innerWidth;

            this.dragging.current.x = Math.min(
               Math.max(dx, 0 - this.dragging.target.offsetLeft), // max left
               dragContainerWidth - this.dragging.target.offsetWidth - this.dragging.target.offsetLeft // max right
            );;

            this.dragging.current.y = Math.min(
               Math.max(dy, 0 - this.dragging.target.offsetTop), // max top
               dragContainerHeight - this.dragging.target.offsetHeight - this.dragging.target.offsetTop // max buttom
            );;
         }
         // No limit viewport
         else {
            this.dragging.current.x = dx;
            this.dragging.current.y = dy;
         }

         this.dragging.offset.x = this.dragging.current.x;
         this.dragging.offset.y = this.dragging.current.y;

         this.moveByCoordinates(this.dragging.current);
         // this.moveByCoordinates({ x: this.dragging.current.x, y: this.dragging.current.y });
      }

      moveByCoordinates({ x = required(), y = required() }) {
         this.log('moveByCoordinates', this.dragging);
         this.dragging.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      getTargetCoordinates(evt = required()) {
         let targetX, targetY;
         switch (evt.type) {
            case 'touchstart':
            case 'touchmove':
               targetX = evt.touches[0].clientX;
               targetY = evt.touches[0].clientY;
               break;
            case 'mousedown':
            case 'mousemove':
               targetX = evt.clientX;
               targetY = evt.clientY;
               break;
         }
         return { targetX, targetY };
      }

      log() {
         if (this.DEBUG && arguments.length) {
            console.groupCollapsed(...arguments);
            console.trace();
            console.groupEnd();
         }
      }
   },

   /**
    * @return {boolean}
   */
   // isMusicChannel() {
   isMusic(is_expand) {
      if (!['watch', 'embed'].includes(this.currentPage)) return;

      return checkMusicType();
      // const
      //    CACHE_PREFIX = 'nova-music-type',
      //    cacheName = CACHE_PREFIX + ':' + (this.queryURL.get('v') || movie_player.getVideoData().video_id);

      // // fix - Failed to read the 'sessionStorage' property from 'Window': Access is denied for this document.
      // if (!window?.sessionStorage && this.currentPage == 'embed') return checkMusicType();

      // if (storage = sessionStorage.getItem(cacheName)) {
      //    // console.debug(CACHE_PREFIX, 'cache:', storage);
      //    return JSON.parse(storage);
      // }
      // save
      // else {
      //    const state = checkMusicType();
      //    // console.debug(CACHE_PREFIX, 'gen:', state);
      //    sessionStorage.setItem(cacheName, Boolean(state));
      //    return state;
      // }

      // document.addEventListener('yt-page-data-updated', () => {
      //    checkMusicType();
      // });

      function checkMusicType() {
         // await NOVA.waitUntil(() => typeof movie_player === 'object');
         const
            playerData = movie_player.getPlayerResponse(),
            videoData = movie_player.getVideoData(),
            // channelName = document.body.querySelector('#upload-info #channel-name a:not(:empty)')?.textContent,
            // channelName = playerData?.videoDetails?.author,
            // channelName = playerData?.microformat?.playerMicroformatRenderer.ownerChannelName,
            channelName = videoData.author, // document.body.querySelector('.ytp-title-channel a:not(:empty)').textContent
            titleStr = videoData.title.toUpperCase(), // #movie_player .ytp-title a:not(:empty)
            titleWordsList = titleStr?.toUpperCase().match(/\w+/g);

         return [
            titleStr, // ex. - https://www.youtube.com/watch?v=mjLSQMPr6ak
            location.host, // music.youtube.com
            location.hash, // youtube.com#music
            channelName,
            // video genre
            playerData?.microformat?.playerMicroformatRenderer.category, // exclude embed page
            // playlistTitle
            (
               document.body.querySelector('.ytd-page-manager[video-id]')?.__data.playlistData
               || document.body.querySelector('yt-playlist-manager')?.polymerController?.currentPlaylistData_
            )?.title // ex. - https://www.youtube.com/watch?v=cEdVLDfV1e0&list=PLVrIzE02N3EE9mplAPO8BGleeenadCSNv&index=2

            // ALL BELOW - not updated after page transition!
            // document.body.querySelector('meta[itemprop="genre"][content]')?.content,
            // window.ytplayer?.config?.args.raw_player_response.microformat?.playerMicroformatRenderer.category,
         ]
            .some(i => i?.toUpperCase().includes('MUSIC'))

            // 'Official Artist' badge
            || document.body.querySelector('#upload-info #channel-name .badge-style-type-verified-artist')
            // https://yt.lemnoslife.com/channels?part=approval&id=CHANNEL_ID (items[0].approval == 'Official Artist Channel') (https://github.com/Benjamin-Loison/YouTube-operational-API)

            // channelNameVEVO
            || (channelName && /(^(DJ)|(VEVO|Topic|AMV|Official)$)/.test(channelName))
            // specific word in channel
            || (channelName && /(HITS|BAND|ROCK|SOUNDS|SONG|MUSIK|𝐌𝐔𝐒𝐈𝐂|RECORD(?:S|INGS)?)/i.test(channelName)) // https://www.youtube.com/@VisibleNoiseRecords, https://www.youtube.com/@WarnerRecordsVault, https://www.youtube.com/channel/UCj-Wwx1PbCUX3BUwZ2QQ57A, https://www.youtube.com/@RelaxingSoundsOfNature

            // word - https://www.youtube.com/watch?v=N67yRMOVk1s
            || titleWordsList?.length && ['🎵', '♫', 'SONG', 'SONGS', 'SOUNDTRACK', 'LYRIC', 'LYRICS', 'AMBIENT', 'MIX', 'VEVO', 'KARAOKE', 'COVER', 'COVERED', 'VOCAL', 'INSTRUMENTAL', 'ORCHESTRAL', 'SYMPHONY', 'CONCERT', 'DUBSTEP', 'DJ', 'DNB', 'BASS', 'BEAT', 'ALBUM', 'PLAYLIST', 'DUBSTEP', 'CHILL', 'RELAX', 'CINEMATIC', 'KBPS', 'SPEEDRUN', 'MELODY']
               .some(i => titleWordsList.includes(i))

            // words ("feat." miss - https://www.youtube.com/watch?v=7ubvobYxgBk)
            || ['OFFICIAL VIDEO', 'OFFICIAL AUDIO', 'FEAT.', 'FT.', 'LIVE RADIO', 'DANCE VER', 'HIP HOP', 'ROCK N ROLL', 'HOUR VER', 'HOURS VER', 'INTRO THEME', 'FULL ALBUM']
               .some(i => titleStr.includes(i))

            // word (case sensitive)
            || titleWordsList?.length && ['OP', 'ED', 'MV', 'OST', 'NCS', 'BGM', 'EDM', 'GMV', 'AMV', 'MMD', 'MAD', 'HQ']
               .some(i => titleWordsList.includes(i))

            || (is_expand && (
               playerData?.videoDetails.keywords?.some(i => i?.toUpperCase().includes('MUSIC'))
               || (channelName && /(MIX|ALBUM|METAL|INSTRUMENTAL)/i.test(channelName)) // https://www.youtube.com/channel/UCHV1I4axw-6pCeQTUu7YFhA, https://www.youtube.com/@FIRESLARadio, https://www.youtube.com/channel/UCeWfmeus1O6cUL5o1tKdYAA, https://www.youtube.com/channel/UCvomiBtoN-BPjs4cx4QTMEg, https://www.youtube.com/channel/UCzCWehBejA23yEz3zp7jlcg
               || titleStr.split(' - ').length === 2  // search for a hyphen. Ex.:"Artist - Song", "Sound Test" (https://www.youtube.com/watch?v=gLSTUhRY2-s)
               // 【MAD】,『MAD』,「MAD」
               // warn false finding ex: "AUDIO visualizer" 'underCOVER','VOCALoid','write THEME','UI THEME','photo ALBUM', 'lolyPOP', 'ascENDING', speeED, 'LapOP' 'Ambient AMBILIGHT lighting', 'CD Projekt RED', 'Remix OS'
               || ['【', '『', '「', 'SOUND', 'REMIX', 'CD', 'PV', 'AUDIO', 'EXTENDED', 'FULL', 'TOP', 'TRACK', 'TRAP', 'THEME', 'PIANO', 'POP', '8-BIT', 'HITS', 'CLASSIC', 'OPENING', 'ENDING', 'CLIP']
                  .some(i => titleWordsList.includes(i))
            ));
      }
   },

   // findTimestamps(text) {
   //    const result = []
   //    const timestampPattern = /((\d?\d:){1,2}\d{2})/g
   //    let match
   //    while ((match = timestampPattern.exec(text))) {
   //       result.push({
   //          from: match.index,
   //          to: timestampPattern.lastIndex
   //       })
   //    }
   //    return result
   // },

   // dateFormatter
   formatTime: {
      /**
       * 00:00:00形式の時間を秒に変換する
       *
       * @param  {string} str
       * @return {int}
      */
      // 13.19% slower
      // hmsToSec(str) { // format out "h:mm:ss" > "sec"
      //    // str = ':00:00am'; // for test
      //    if ((arr = str?.split(':')) && arr.length) {
      //       return arr.reduce((acc, time) => (60 * acc) + +time);
      //    }
      // },
      hmsToSec(str = required()) { // format out "h:mm:ss" > "sec". if str don't have ":" return zero
         // if (!str?.includes(':')) return console.warn('hmsToSec err:', str);
         let
            parts = str?.split(':'),
            t = 0;
         switch (parts?.length) {
            case 2: t = (parts[0] * 60); break; // m:s
            case 3: t = (parts[0] * 3600) + (parts[1] * 60); break; // h:m
            case 4: t = (parts[0] * 86400) + (parts[1] * 3600) + (parts[2] * 60); break;
         }
         return t + +parts.pop();
      },
      // HMS mean: Hours, Minutes, Seconds
      HMS: {
         parseTime(sec) {
            const ts = Math.abs(+sec);
            return {
               d: Math.trunc(ts / 86400),
               h: Math.trunc((ts % 86400) / 3600),
               m: Math.trunc((ts % 3600) / 60),
               // min = Math.trunc(Math.log(sec) / Math.log(60)), // after sec
               s: Math.trunc(ts % 60),
            };
         },

         // 98.69 % slower
         // parseTime(sec) {
         //    const date = new Date(sec * 1000);
         //    return {
         //       d: Math.trunc(sec / 86400),
         //       h: date.getUTCHours(),
         //       m: date.getUTCMinutes(),
         //       s: date.getUTCSeconds(),
         //    };
         // },

         /**
          * @param  {int} time_sec
          * @return {string}
         */
         // 65.77 % slower
         // digit(ts = required()) { // format out "h:mm:ss"
         //    const
         //       ts = Math.abs(+ts),
         //       days = Math.trunc(ts / 86400);

         //    let t = new Date(ts).toISOString();
         //    if (ts < 3600000) t = t.substr(14, 5); // add hours
         //    else t = t.substr(11, 8); // only minutes

         //    return (days ? `${days}d ` : '') + t;
         // },
         digit(sec = required()) { // format out "h:mm:ss"
            const { d, h, m, s } = this.parseTime(sec);

            return (d ? `${d}d ` : '')
               + (h ? (d ? h.toString().padStart(2, '0') : h) + ':' : '')
               + (h ? m.toString().padStart(2, '0') : m) + ':'
               + s.toString().padStart(2, '0');

            // 84% slower
            // return (days && !isNaN(days) ? `${days}d ` : '')
            //    + [hours, minutes, seconds]
            //       .filter(i => +i && !isNaN(i))
            //       .map((item, idx) => idx ? item.toString().padStart(2, '0') : item) // "1:2:3" => "1:02:03"
            //       .join(':'); // format "h:m:s"
         },

         /**
          * @param  {int} time_sec
          * @return {string}
         */
         abbr(sec = required()) { // format out "999h00m00s"
            const { d, h, m, s } = this.parseTime(sec);

            return (d ? `${d}d ` : '')
               + (h ? (d ? h.toString().padStart(2, '0') : h) + 'h' : '')
               + (m ? (h ? m.toString().padStart(2, '0') : m) + 'm' : '')
               + (s ? (m ? s.toString().padStart(2, '0') : s) + 's' : '');
            // 81.34 % slower
            // const ts = Math.abs(+sec);
            // return [
            //    days = { label: 'd', time: Math.trunc(ts / 86400) },
            //    hours = { label: 'h', time: Math.trunc((ts % 86400) / 3600) },
            //    minutes = { label: 'm', time: Math.trunc((ts % 3600) / 60) },
            //    // { label: 's', time: Math.trunc(Math.log(sec) / Math.log(60)) },
            //    seconds = { label: 's', time: Math.trunc(ts % 60) },
            // ]
            //    .map((i, idx, arr) =>
            //       (i.time ? (arr[idx - 1] ? i.time.toString().padStart(2, '0') : i.time) + i.label : '')
            //    )
            //    .join('');
         },

         /**
          * @param  {ts} int
          * @return {string}
         */
         // abbrFull(ts) {
         //    const plural = (amount, name) => {
         //       return (amount == 1 ? '1 ' + name : amount + ' ' + name + 's');
         //    };
         //    const pluralandplural = (amount1, name1, amount2, name2) => {
         //       return plural(amount1, name1) + (amount2 == 0 ? '' : ' and ' + plural(amount2, name2));
         //    };

         //    if (ts >= 86400) {
         //       const
         //          days = Math.trunc(ts / 86400),
         //          hours = Math.trunc(ts / 3600 - days * 24);
         //       return pluralandplural(days, 'day', hours, 'hour');
         //    }
         //    else if (ts >= 3600) {
         //       const
         //          hours = Math.trunc(ts / 3600),
         //          minutes = Math.trunc(ts / 60 - hours * 60);
         //       return pluralandplural(hours, 'hour', minutes, 'min');
         //    }
         //    else if (ts >= 60) {
         //       const
         //          minutes = Math.trunc(ts / 60),
         //          seconds = Math.trunc(ts - minutes * 60);
         //       return pluralandplural(minutes, 'min', seconds, 'sec');
         //    }
         //    else {
         //       const seconds = Math.max(0, Math.trunc(ts));
         //       return plural(seconds, 'second');
         //    }
         // },
      },

      /**
       * @param  {date} date
       * @return {string}
      */
      // timeSince(date = required()) { // format out "1 day"
      ago(date = required()) { // format out "1 day"
         if (!(date instanceof Date)) {
            console.error('date is not a Date type:', date);
            return;
         }

         const samples = [
            { label: 'year', sec: 31536000 },
            { label: 'month', sec: 2592000 },
            { label: 'day', sec: 86400 },
            { label: 'hour', sec: 3600 },
            { label: 'minute', sec: 60 },
            { label: 'second', sec: 1 }
         ];
         const
            now = date.getTime(),
            seconds = Math.floor((Date.now() - Math.abs(now)) / 1000),
            interval = samples.find(i => i.sec < seconds),
            time = Math.floor(seconds / interval.sec);

         // return `${time} ${interval.label}${time !== 1 ? 's' : ''} ago`;
         return `${(now < 0 ? '-' : '') + time} ${interval.label}${time !== 1 ? 's' : ''}`;
      },
   },

   /**
    * @param  {this} date
    * @param  {format} string
    * @return {string}
   */
   // NOVA.dateFormat.apply(new Date(text), [user_settings.video_date_format]);
   // Date.prototype.format = function (format = 'YYYY/MM/DD') {
   dateFormat(format = 'YYYY/MM/DD') {
      // info and alt:
      // https://cwestblog.com/2012/09/27/javascript-date-prototype-format/
      // https://github.com/mikebaldry/formatDate-js/blob/master/formatDate.js
      // https://github.com/sean1093/timeSolver/blob/master/src/1.2.0/timeSolver.js

      if (!(this instanceof Date)) {
         console.error('dateFormat is not a Date type:', this);
         return;
      }

      const
         twoDigit = n => n.toString().padStart(2, '0'),
         date = this.getDate(),
         year = this.getFullYear(),
         monthIdx = this.getMonth(),
         weekIdx = this.getDay(),
         hours = this.getHours(),
         minutes = this.getMinutes(),
         seconds = this.getSeconds();

      const dateLabels = (() => {
         const labels = {
            en: {
               week: {
                  short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'],
                  full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
               },
               month: {
                  short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
               },
            },
         };
         const userLocal = navigator.language.split('-')[0]; // document.documentElement.lang
         const defaultLabel = labels.hasOwnProperty(userLocal) || 'en';

         return labels[defaultLabel];
      })();

      return format
         // .replace(/a|A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/g, partPattern => { // full
         .replace(/A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/gi, pattern => { // remove key "a" for use text "at"
            let out;
            switch (pattern) {
               case 'YY': out = year.substr(2); break;
               case 'YYYY': out = year; break;
               case 'M': out = monthIdx + 1; break;
               case 'MM': out = twoDigit(monthIdx + 1); break;
               case 'MMM': out = dateLabels.month.short[monthIdx]; break;
               case 'MMMM': out = dateLabels.month.full[monthIdx]; break;
               case 'D': out = date; break;
               case 'DD': out = twoDigit(date); break;
               case 'DDD': out = dateLabels.week.short[weekIdx]; break;
               case 'DDDD': out = dateLabels.week.full[weekIdx]; break;
               case 'h': out = (hours % 12) || 12; break;
               case 'H': out = hours; break;
               case 'HH': out = twoDigit(hours); break;
               // case 'm': out = minutes; break;
               case 'mm': out = twoDigit(minutes); break;
               case 's': out = seconds; break;
               case 'ss': out = twoDigit(seconds); break;
               case 'SS': out = twoDigit(seconds); break;
               // case 'SSS' out = Milliseconds with leading zeros (three digits long)
               // case 'a': out = (hours < 12 ? 'am' : 'pm'); break;
               case 'A': out = (hours < 12 ? 'AM' : 'PM'); break;
               case 'Z': out = ('+' + -this.getTimezoneOffset() / 60)
                  .replace(/^\D?(\D)/, "$1")
                  .replace(/^(.)(.)$/, "$10$2") + '00';
                  break;
               // default: console.debug('skiped:', pattern); break;
            }
            return out;
         });
   },

   numberFormat: {
      /**
       * @param  {integer/string} num
       * @return {string}
      */
      // conver number "200111" > "200.1K"
      // abbr: num => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, notation: 'compact', compactDisplay: 'short' }).format(num),
      abbr(num) {
         num = Math.abs(+num);
         if (num === 0 || isNaN(num)) return '';
         else if (num < 1000) return Math.trunc(num);
         else if (num < 1e4) return round(num / 1000) + 'K';
         else if (num < 990000) return Math.round(num / 1000) + 'K'; // no fractions
         else if (num < 990000000) return Math.round(num / 1e5) / 10 + 'M';
         else return Math.round(num / 1e8) / 10 + 'B';

         function round(num, sig = 1) {
            const prec = Math.pow(10, sig);
            return Math.round(num * prec) / prec;
         }
      },
      // broken "1000000" => '1000K'
      // abbr(num, units = ['', 'K', 'M', 'B']) {
      //    const sign = Math.sign(num);
      //    let unit = 0;

      //    while (Math.abs(num) > 1000) {
      //       unit = unit + 1;
      //       num = Math.floor(Math.abs(num) / 100) / 10;
      //    }
      //    return sign * Math.abs(num) + units[unit];
      // },

      // "9999999" => "9,999,999"
      friendly: num => new Intl.NumberFormat().format(Math.round(num * 10) / 10),
   },

   extractAsNum: {
      float: str => (n = str?.replace(/[^0-9.]/g, '')) && +n,
      int: str => (n = str?.replace(/\D+/g, '')) && +n,
      // firstInt: str => str && parseInt(str.replace(/\D/g, '')),
   },

   editableFocused(target = required()) {
      if (target === document) return;

      if (!(target instanceof HTMLElement)) {
         console.error('target is not a HTMLElement:', target);
         return;
      }

      return (['input', 'textarea', 'select'].includes(target.localName) || target.isContentEditable);

      // return (
      //    ['TEXTAREA', 'SELECT'].includes(target.tagName)
      //    || (target.tagName == 'INPUT' && ['email', 'text', 'password', 'search', 'url'].includes(target.getAttribute('type')))
      //    || target.isContentEditable
      // );
   },

   /**
    * @param  {string} new_url
    * @return {void}
   */
   updateUrl: (new_url = required()) => window.history.replaceState(null, null, new_url),

   queryURL: {
      // const videoId = new URLSearchParams(location.search).get('v');
      // const getChannelName = () => new URLSearchParams(location.search).get('ab_channel');
      // get: (query, url) => new URLSearchParams((url ? new URL(url) : location.search || document.URL).search).get(query),
      // has: (query = required(), url_string) => new URLSearchParams((url_string ? new URL(url_string) : location.search)).has(query), // Doesn't work

      has: (query = required(), url_string) => new URL(url_string || location).searchParams.has(query.toString()),

      get: (query = required(), url_string) => new URL(url_string || location).searchParams.get(query.toString()),

      /**
       * @param  {object} query_obj
       * @param  {string*} url_string
       * @return {string}
      */
      set(query_obj = {}, url_string) {
         // console.debug('queryURL.set:', ...arguments);
         if (typeof query_obj != 'object' || !Object.keys(query_obj).length) {
            console.error('query_obj is not a object:', typeof query_obj, query_obj);
            return;
         }
         const url = new URL(url_string || location);
         Object.entries(query_obj).forEach(([key, value]) => url.searchParams.set(key, value));
         return url.toString();
      },

      remove(query = required(), url_string) {
         const url = new URL(url_string || location);
         url.searchParams.delete(query.toString());
         return url.toString();
      },

      getFromHash: (query = required(), url_string) => location.hash && new URLSearchParams(new URL(url_string || location).hash.slice(1)).get(query.toString()),
   },

   request: (() => {
      const API_STORE_NAME = 'YOUTUBE_API_KEYS'; // restrict access

      async function getKeys() { // restrict access
         NOVA.log('request.API: fetch to youtube_api_keys.json');
         // see https://gist.github.com/raingart/ff6711fafbc46e5646d4d251a79d1118/
         return await this.fetch('https://gist.githubusercontent.com/raingart/ff6711fafbc46e5646d4d251a79d1118/raw/youtube_api_keys.json')
            // save
            .then(keys => {
               NOVA.log(`get and save keys in localStorage`, keys);
               localStorage.setItem(API_STORE_NAME, JSON.stringify(keys));
               return keys
            })
            // clear
            .catch(err => {
               localStorage.removeItem(API_STORE_NAME);
               console.error('API Keys: failed fetching:', err);
               throw new Error(`API Keys: failed fetching: ${err}`);
            })
            .catch(reason => console.error('Error get keys:', reason)); // warn
      }

      return {
         /**
          * @param  {string} request
          * @param  {object} params
          * @param  {string*} api_key
          * @return {object}
         */
         async API({ request = required(), params = required(), api_key }) {
            // fix - Failed to read the 'localStorage' property from 'Window': Access is denied for this document.
            // if (!api_key && !window?.localStorage) return;

            // NOVA.log('request.API:', ...arguments); // err
            // console.debug('API:', ...arguments);
            // get API key
            const YOUTUBE_API_KEYS = localStorage.hasOwnProperty(API_STORE_NAME)
               ? JSON.parse(localStorage.getItem(API_STORE_NAME))
               : await getKeys();

            if (!api_key && (!Array.isArray(YOUTUBE_API_KEYS) || !YOUTUBE_API_KEYS?.length)) {
               localStorage.hasOwnProperty(API_STORE_NAME) && localStorage.removeItem(API_STORE_NAME);
               // alert('I cannot access the API key.'
               //    + '\nThe plugins that depend on it have been terminated.'
               //    + "\n - Check your network's access to Github"
               //    + '\n - Generate a new private key'
               //    + '\n - Deactivate plugins that need it'
               // );
               console.error('YOUTUBE_API_KEYS is empty:', YOUTUBE_API_KEYS);
               throw new Error('YOUTUBE_API_KEYS is empty');
            }

            const referRandKey = arr => api_key || 'AIzaSy' + arr[Math.trunc(Math.random() * arr.length)];
            // combine GET
            const query = Object.keys(params)
               .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
               .join('&');

            const URL = `https://www.googleapis.com/youtube/v3/${request}?${query}&key=` + referRandKey(YOUTUBE_API_KEYS);
            // console.debug('URL', URL);
            // request
            return await NOVA.fetch(URL)
               // .then(response => response.json())
               .then(json => {
                  if (!json?.error && Object.keys(json).length) return json;
                  console.warn('used key:', NOVA.queryURL.get('key', URL));
                  if (json?.error && Object.keys(json.error).length) {
                     throw new Error(JSON.stringify(json?.error));
                  }
               })
               .catch(error => {
                  localStorage.removeItem(API_STORE_NAME);
                  console.error(`Request API failed:${URL}\n${error}`);
                  if (error?.message && (err = JSON.parse(error?.message))) {
                     return {
                        'code': err.code,
                        'reason': err.errors?.length && err.errors[0].reason,
                        'error': err.message,
                     };
                  }
                  // alert('Problems with the YouTube API:'
                  //    + '\n' + error?.message
                  //    + '\n\nIf this error is repeated:'
                  //    + '\n - Disconnect the plugins that need it'
                  //    + '\n - Update your YouTube API KEY');
               });
         },
      };

   })(),

   /**
    * @param  {string} url
    * @param  {object*} options
    * @return {JSON}
   */
   async fetch(url, options = {}) {
      // NOVA.debug('fetch', ...arguments);

      const defaultOptions = {
         method: 'GET', // *GET, POST, PUT, DELETE, etc.
         // mode: 'no-cors', // no-cors, *cors, same-origin
         headers: {
            // 'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
         },
         responseType: 'json',
         // binary: false,
         // timeout: 0 * 1000 // // Default to no timeout, Atention! Convert to milliseconds for GM_xmlhttpRequest
      };

      const mergedOptions = {
         ...defaultOptions,
         ...options
      };

      let response;

      try {
         if (typeof GM_info === 'object') {
            // Assuming GM_fetch is a shim for GM_xmlhttpRequest available in certain environments like Greasemonkey.
            response = await GM_fetch(url, mergedOptions);
         } else {
            response = await fetch(url, mergedOptions);
            response = await response.json();
         }
      } catch (err) {
         console.error(`NOVA.fetch: Unexpected error: ${err}\n${url}`);
         throw err; // Ensure error are not silently ignored.
      }

      return response;

      async function GM_fetch(url, options = {}) {
         if (options.body) {
            options.data = options.body;
            delete options.body;
         }

         return new Promise((resolve, reject) => {
            const xhr = GM_xmlhttpRequest({
               url,
               ...options,
               // onload: response => resolve(response.response),
               onloadend(response) {
                  if (response.status >= 200 && response.status < 300) {
                     switch (options.responseType) {
                        case 'json':
                           resolve(JSON.parse(response.responseText));
                           break;
                        default:
                           resolve(response.response);
                           break;
                     }
                  }
                  // else reject(new Error(`HTTP error! status: ${response.status}`));
               },
               // onerror: error => reject(error),
               onerror: error => reject(new Error('Network error')),
            });

            if (options.timeout > 0) {
               setTimeout(() => xhr.abort(), options.timeout);
            }
         });
      };
   },

   getPlayerState: {
      /**
       * @param  {string*} state
       * @return {string}
      */
      playback(state) {
         // movie_player.getPlayerState() === 2 // 2: PAUSED
         // NOVA.getPlayerState.playback() == 'PLAYING'
         // movie_player.addEventListener('onStateChange', state => 'PLAYING' == NOVA.getPlayerState.playback(state));
         return {
            '-1': 'UNSTARTED',
            0: 'ENDED',
            1: 'PLAYING',
            2: 'PAUSED',
            3: 'BUFFERING',
            5: 'CUED'
         }[state || movie_player.getPlayerState()];
      },

      visibility() {
         return {
            0: 'SHOW',
            1: 'MINIPLAYER',
            2: 'FULLSCREEN',
            3: 'HIDE',
            10: 'THEATER',
         }[movie_player.getVisibilityState()];
      },
   },

   // captureActiveVideoElement
   videoElement: (() => {
      const videoSelector = '#movie_player:not(.ad-showing) video';
      // init
      document.addEventListener('canplay', ({ target }) => {
         target.matches(videoSelector) && (NOVA.videoElement = target);
      }, { capture: true, once: true });
      // update (redundancy. if canplay is initialized but this script not runing)
      document.addEventListener('play', ({ target }) => {
         target.matches(videoSelector) && (NOVA.videoElement = target);
      }, true);
      // movie_player.addEventListener('onVideoDataChange', () => console.debug('onVideoDataChange'));
      // document.dispatchEvent(new CustomEvent('nova-video-loaded'));
   })(),

   // videoId(url = document.URL) {
   //    return new URL(url).searchParams.get('v') || movie_player.getVideoData().video_id;
   // },

   // getPlayerData() {
   //    movie_player.getPlayerResponse() || document.body.querySelector('.ytd-page-manager[video-id]')?.playerData,
   //       movie_player.getVideoData(),
   //       document.body.querySelector('.ytd-page-manager[video-id]')?.data || document.body.querySelector('ytd-app')?.data?.response || document.body.querySelector('ytd-app')?.__data?.data?.response /*not updated after page transition!*/|| window.ytInitialData, // document.body.querySelector('ytd-player')?.player_?.getCurrentVideoConfig()?.args.raw_player_response
   // },

   /**
    * @param  {string*} api_key
    * @return {string}
   */
   getChannelId(api_key) {
      const isChannelId = id => id && /UC([a-z0-9-_]{22})$/i.test(id);
      // local search
      let result = [
         // global
         document.head.querySelector('meta[itemprop="channelId"][content]')?.content,
         // channel page
         (document.body.querySelector('ytd-app')?.__data?.data?.response
            || document.body.querySelector('ytd-app')?.data?.response
            || window.ytInitialData
         )
            ?.metadata?.channelMetadataRenderer?.externalId,
         // ex https://www.youtube.com/c/<ChannelId>
         document.head.querySelector('link[itemprop="url"][href]')?.href.split('/')[4],
         location.pathname.split('/')[2],
         // playlist page
         document.body.querySelector('#video-owner a[href]')?.href.split('/')[4],
         document.body.querySelector('a.ytp-ce-channel-title[href]')?.href.split('/')[4],
         // watch page
         movie_player.getPlayerResponse()?.videoDetails?.channelId, // exclude embed page
         // document.body.querySelector('#owner #channel-name a[href]')?.href.split('/')[4], // outdated
         // ALL BELOW - not updated after page transition!
         // || window.ytplayer?.config?.args.ucid
         // || window.ytplayer?.config?.args.raw_player_response.videoDetails.channelId
         // || document.body.querySelector('ytd-player')?.player_.getCurrentVideoConfig()?.args.raw_player_response.videoDetails.channelId
         // embed page
         ((typeof ytcfg === 'object') && (obj = ytcfg.data_?.PLAYER_VARS?.embedded_player_response)
            && NOVA.searchInObjectBy.key({
               'obj': JSON.parse(obj),
               'key': 'channelId',
            })?.data),
         // (typeof window.ytInitialData === 'object'
         ((obj = document.getElementById('page-manager')?.getCurrentData())
            && NOVA.searchInObjectBy.key({
               //'obj': JSON.parse(obj),
               'obj': obj,
               'key': 'channelId',
            })?.data),
      ]
         .find(i => isChannelId(i));
      // console.debug('channelId (local):', result);

      // if (!result) { // request
      //    let channelName;
      //    switch (this.currentPage) {
      //       case 'channel':
      //          if ((channelName_ = document.body.querySelector('#channel-handle')?.textContent)
      //             && channelName_.startsWith('@')
      //          ) {
      //             channelName = channelName_.slice(1);
      //          }

      //          break;
      //       // case 'watch':
      //       //    // channelLinkArr = await this.waitSelector('#owner #channel-name a[href], ytm-slim-owner-renderer > a[href]');
      //       //    channelLinkArr = await this.waitSelector('#owner #channel-name a[href]');
      //       //    channelArr = channelLinkArr?.href.split('/');
      //       //    if (channelArr.length && ['c', 'user'].includes(channelArr[3])) {
      //       //       channelName = channelArr[4];
      //       //    }
      //       //    break;
      //    }
      //    console.debug('channelName:', channelName);
      //    if (!channelName) return
      //    // https://www.googleapis.com/youtube/v3/channels?key={YOUR_API_KEY}&forUsername={USER_NAME}&part=id
      //    const res = await this.request.API({
      //       request: 'channels',
      //       params: { 'forUsername': channelName, 'part': 'id' },
      //       api_key: api_key,
      //    });
      //    // console.debug('res', res);
      //    if (res?.items?.length && isChannelId(res.items[0]?.id)) result = res.items[0].id;
      //    // console.debug('channelId (request):', result);
      // }
      return result;
   },

   // storage_obj_manager - currently only compatible with the [save-channel-state] plugin. It makes sense to unify for subsequent decisions

   // multiple keys in localStorage
   // storage_obj_manager: {
   //    // STORAGE_NAME: 'str'
   //    async initName() {
   //       const
   //          CACHE_PREFIX = 'nova-channels-state:',
   //          storageId = location.search.includes('list=')
   //             ? (NOVA.queryURL.get('list') || movie_player?.getPlaylistId())
   //             : await NOVA.waitUntil(NOVA.getChannelId, 1000);

   //       this.STORAGE_NAME = CACHE_PREFIX + storageId;

   //       return this.STORAGE_NAME;
   //    },

   //    read() {
   //       return JSON.parse(localStorage.getItem(this.STORAGE_NAME));
   //    },

   //    write(obj_save) {
   //       localStorage.setItem(this.STORAGE_NAME, JSON.stringify(obj_save));
   //    },

   //    _getParam(key = required()) {
   //       if (storage = this.read()) {
   //          return storage[key];
   //       }
   //    },

   //    async getParam(key = required()) {
   //       if (!this.STORAGE_NAME) await this.initName(); // wait storage name
   //       return this._getParam(...arguments);
   //    },

   //    save(obj_save) {
   //       // console.debug('STORAGE_OBJ_MANAGER save:', ...arguments);
   //       // update storage
   //       if (storage = this.read()) {
   //          obj_save = Object.assign(storage, obj_save);
   //       }
   //       // create storage
   //       this.write(obj_save);
   //    },

   //    remove(key) {
   //       // update if more ones
   //       if ((storage = this.read()) && Object.keys(storage).length > 1) {
   //          delete storage[key];
   //          this.write(storage);
   //       }
   //       // remove
   //       else localStorage.removeItem(this.STORAGE_NAME);
   //    }
   // },

   // one key in localStorage
   storage_obj_manager: {

      STORAGE_NAME: 'nova-channels-state',

      STORAGE_NAME_SPEED: 'nova-channels-speed',

      // channelId: 'str',
      async initStorage() {
         //   playlist higher priority than the channel
         this.channelId = location.search.includes('list=')
            ? (NOVA.queryURL.get('list') || movie_player?.getPlaylistId())
            : await NOVA.waitUntil(NOVA.getChannelId, 1000); // 1sec
      },

      read(return_all) {
         if (store = JSON.parse(localStorage.getItem(this.STORAGE_NAME))) {
            return return_all ? store : store[this.channelId];
         }
      },

      write(obj_save) {
         // merge with other storage
         if ((storage = this.read('all') || {})) {
            if (Object.keys(obj_save).length) {
               storage = Object.assign(storage, { [this.channelId]: obj_save });
            }
            else {
               delete storage[this.channelId];
            }
         }
         localStorage.setItem(this.STORAGE_NAME, JSON.stringify(storage));
      },

      _getParam(key = required()) {
         if (storage = this.read()) {
            return storage[key];
         }
      },

      async getParam(key = required()) {
         if (!this.channelId) await this.initStorage(); // wait storage name
         return this._getParam(...arguments);
      },

      save(obj_save) {
         // console.debug('send to save:', ...arguments);
         if (storage = this.read()) {
            // merge with saved param
            obj_save = Object.assign(storage, obj_save);
         }
         this.write(obj_save);
      },

      remove(key) {
         // update if more ones
         if ((storage = this.read())) {
            delete storage[key];
            this.write(storage);
         }
      },
   },

   // findPathInObj
   searchInObjectBy: {
      // ex:
      // NOVA.searchInObjectBy.key({
      //    'obj': window.ytplayer,
      //    'key': 'ucid',
      //    // 'match_fn': val => {},
      // });
      // ex test array: NOVA.searchInObjectBy.key({ obj: { a: [1, {"ucid": 11}] }, key: "ucid" })
      /**
       * @param  {object} obj
       * @param  {string} key
       * @param  {function*} match_fn
       * @param  {boolean*} multiple
       * @param  {int*} max_depth
       * @return {object} {path, data, depth}
      */
      key({
         obj = required(),
         key = required(),
         multiple = false,
         // match_fn = data => data.constructor.name !== 'Object', // exclude objects type
         match_fn, // Optional function for custom matching
         max_depth = 10,
      }) {
         let results = [];

         const found = searchInternal({ obj, path: '', depth: 0 });
         if (found) {
            return multiple ? results : found;
         }

         function searchInternal({ obj = required(), path = '', depth = 0 }) {
            if (depth >= max_depth) return;

            const setPath = d => (path ? path + '.' : '') + d;

            for (const prop in obj) {
               if (obj.hasOwnProperty(prop) && (typeof obj[prop] !== 'undefined')) {
                  // if (hasKey && )) {
                  if ((key === prop) && (typeof match_fn !== 'function' || match_fn(obj[prop]))) {
                     const result = {
                        'path': setPath(prop),
                        'data': obj[prop],
                        'depth': depth,
                     };
                     if (multiple) results.push(result);
                     else return result;
                  }
                  // in deeper (recursive)
                  else if (depth < max_depth) {
                     switch (obj[prop].constructor.name) {
                        case 'Object':
                           const foundInObject = searchInternal({
                              'obj': obj[prop],
                              // 'path': path + '.' + prop,
                              'path': setPath(prop),
                              // 'match_fn': match_fn,
                              'depth': depth + 1,
                           });
                           if (foundInObject) {
                              if (multiple) results.push(foundInObject);
                              else return foundInObject;
                           }
                           break;

                        case 'Array':
                           for (let i = 0; i < obj[prop].length; i++) {
                              if (typeof obj[prop][i] !== 'undefined') {
                                 const foundInArray = searchInternal({
                                    'obj': obj[prop][i],
                                    'path': path + `[${i}]`,
                                    // 'match_fn': match_fn,
                                    'depth': depth + 1,
                                 });
                                 if (foundInArray) {
                                    if (foundInArray) results.push(foundInArray);
                                    else return foundInArray;
                                 }
                              }
                           }
                           break;

                        // case 'Function':
                        //    for (const j in obj[prop]) {
                        //       if (typeof obj[prop][j] !== 'undefined') {
                        //          // recursive
                        //          if (result = searchInternal({
                        //             'obj': obj[prop][j],
                        //             'path': setPath(prop) + '.' + j,
                        //             // 'match_fn': match_fn,
                        //             'depth': depth + 1,
                        //          })) {
                        //             if (multiple) results.push(result);
                        //             else return result;
                        //          }
                        //       }
                        //    }
                        //    break;
                     }
                  }
               }
            }
         }
      },
   },

   // fakeUA(ua) {
   //    Object.defineProperty(navigator, 'userAgent', {
   //       value: ua,
   //       writable: false,
   //       configurable: false,
   //       enumerable: true
   //    });
   // },

   // alt - https://greasyfork.org/en/scripts/446507-youtube-sub-feed-filter-2
   // NOVA.waitSelector('#voice-search-button', { destroy_after_page_leaving: true })
   insertFIlterButton() {
      NOVA.waitSelector('#filter-button, ytd-shelf-renderer #title-container a[href="/feed/channels"]', { destroy_after_page_leaving: true })
         .then(container => {
            const filterBtn = document.createElement('button');
            filterBtn.classList.add('style-scope', 'yt-formatted-string', 'bold', 'yt-spec-button-shape-next--tonal', 'yt-spec-button-shape-next--mono', 'yt-spec-button-shape-next--size-m', 'yt-spec-button-shape-next--text');
            // // filterBtn.textContent = 'Filter Switch';
            // filterBtn.innerHTML = NOVA.createSafeHTML(
            //    `<span class="yt-spec-button-shape-next__icon" style="height:100%">
            //    <svg viewBox="-50 -50 400 400" height="100%" width="100%">
            //       <g fill="currentColor">
            //          <path d="M128.25,175.6c1.7,1.8,2.7,4.1,2.7,6.6v139.7l60-51.3v-88.4c0-2.5,1-4.8,2.7-6.6L295.15,65H26.75L128.25,175.6z" />
            //       </g>
            //    </svg>
            // </span>`);
            // fix - This document requires 'TrustedHTML' assignment.
            filterBtn.append((function createFilterIcon() {
               const iconBtn = document.createElement('span');
               iconBtn.className = 'yt-spec-button-shape-next__icon';
               iconBtn.style.height = '100%';

               const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
               svg.setAttribute('viewBox', '-50 -50 400 400');
               svg.setAttribute('height', '100%');
               svg.setAttribute('width', '100%');

               const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
               g.setAttribute('fill', 'currentColor');

               const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
               path.setAttribute('d', 'M128.25,175.6c1.7,1.8,2.7,4.1,2.7,6.6v139.7l60-51.3v-88.4c0-2.5,1-4.8,2.7-6.6L295.15,65H26.75L128.25,175.6z');

               g.append(path);
               svg.append(g);
               iconBtn.append(svg);

               return iconBtn;
            })());

            filterBtn.title = 'Toggle NOVA plugin [thumbs-hide]';
            // filterBtn.style.cssText = '';
            Object.assign(filterBtn.style, {
               border: 0,
               cursor: 'pointer',
               scale: .7,
            });
            filterBtn.addEventListener('click', () => {
               document.body.classList.toggle('nova-thumbs-unhide');
               // filterBtn opacity
               filterBtn.style.opacity = document.body.classList.contains('nova-thumbs-unhide') ? .3 : 1;
            });
            container.after(filterBtn);
         });
   },

   log() {
      if (this.DEBUG && arguments.length) {
         console.groupCollapsed(...arguments);
         console.trace();
         console.groupEnd();
      }
   },
};
