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
   // - checkVisibility
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
   - isMusic
   - formatTimeOut.hmsToSec
   - formatTimeOut.HMS.digit
   - formatTimeOut.HMS.abbr
   //- formatTimeOut.HMS.abbrFull
   - formatTimeOut.ago
   - dateFormat
   - numberFormat.abbr
   - numberFormat.friendly
   - extractAsNum.float
   - extractAsNum.int
   //- extractAsNum.firstInt
   - updateUrl
   - queryURL.has
   - queryURL.get
   - queryURL.set
   - queryURL.remove
   - queryURL.getFromHash
   - request.API (async)
   - getPlayerState
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
   createSafeHTML(html = required()) {
      if (typeof html !== 'string') return console.error('not string "html":', typeof html);
      if (typeof this.policy === 'undefined') {
         this.policy = (typeof trustedTypes !== 'undefined')
            // Sanitize or validate the HTML here before returning it
            ? trustedTypes.createPolicy('nova-policy', { createHTML: html => html, })
            : null;
      }
      return this.policy ? this.policy.createHTML(html) : html;
   },

   /**
   * @typedef {{
   *   name?: string
   *   stopIf?: () => boolean
   *   timeout?: number
   *   context?: Document | HTMLElement
   * }} GetElementOptions
   *
   * @param {string} selector
   * @param {GetElementOptions} options
   * @returns {Promise<HTMLElement | null>}
   */
   // getElement(selector, {
   //    name = null,
   //    stopIf = null,
   //    timeout = Infinity,
   //    context = document,
   // } = {}) {
   //    return new Promise((resolve) => {
   //       let startTime = Date.now();
   //       let recordId;
   //       let timeoutId;

   //       function stop($element, reason) {
   //          if ($element == null) {
   //             warn(`stopped waiting for ${name || selector} after ${reason}`);
   //          }
   //          else if (Date.now() > startTime) {
   //             log(`${name || selector} appeared after`, Date.now() - startTime, 'ms');
   //          }
   //          if (recordId) {
   //             cancelAnimationFrame(recordId);
   //          }
   //          if (timeoutId) {
   //             clearTimeout(timeoutId);
   //          }
   //          resolve($element);
   //       }

   //       if (timeout !== Infinity) {
   //          timeoutId = setTimeout(stop, timeout, null, `${timeout}ms timeout`);
   //       }

   //       function queryElement() {
   //          let $element = context.querySelector(selector);
   //          if ($element) {
   //             stop($element);
   //          }
   //          else if (stopIf?.() === true) {
   //             stop(null, 'stopIf condition met');
   //          }
   //          else {
   //             recordId = requestAnimationFrame(queryElement);
   //          }
   //       }

   //       queryElement();
   //    });
   // },

   // waitSelector(selector, intervalMs = 500, maxTries = 6) {
   //    return new Promise((resolve, reject) => {
   //       let tried = 1
   //       const id = setInterval(() => {
   //          if (tried > maxTries) {
   //             clearInterval(id);
   //             reject(new Error(`The maximum amount of tries (${maxTries}) was exceeded.`));
   //             return;
   //          }
   //          const elements = document.body.querySelectorAll(selector);
   //          if (elements.length > 0) {
   //             clearInterval(id);
   //             resolve(elements);
   //             return;
   //          }
   //          tried++
   //       }, +intervalMs || 500); // default 500ms
   //    })
   // }

   // waitSelector(selector = required(), container) {
   //    if (typeof selector !== 'string') return console.error('wait > selector:', typeof selector);
   //    if (!(container instanceof HTMLElement)) return console.error('wait > container not HTMLElement:', container);
   //    // console.debug('waitSelector:', selector);

   //    return Promise.resolve((container || document.body).querySelector(selector));
   // },

   /**
     * @param {String} selector The CSS selector used to select the element
     * @returns {Promise<Element>} The selected element
   */
   // waitForElement(selector) {
   //    return new Promise((resolve) => {
   //       if (document.querySelector(selector)) return resolve(document.querySelector(selector));

   //       const observer = new MutationObserver(() => {
   //          if (document.querySelector(selector)) {
   //             observer.disconnect();
   //             resolve(document.querySelector(selector));
   //          }
   //       });

   //       observer.observe(document.body, { childList: true, subtree: true });
   //    });
   // },

   /**
    * @param  {string} selector
    * @param  {Node*} container
    * @param {destroy_timeout} sec How long to wait before throwing an error (seconds)
    * @return {Promise<Element>}
    *
   */
   // // Function to be called when the target element exists
   // // untilDOM
   // // waitSelector(selector = required(), { container, destroy_after_page_leaving, destroy_timeout }) {
   // waitSelector(selector = required(), limit_data) {
   //    return new Promise((resolve, reject) => {
   //       // reject
   //       if (typeof selector !== 'string') {
   //          console.error('wait > selector:', ...arguments);
   //          return reject('wait > selector:', typeof selector);
   //       }
   //       // if (selector.includes(':has(')) selector = `@supports selector(:has(*)) {${selector}}`
   //       if (selector.includes(':has(') && !CSS.supports('selector(:has(*))')) {
   //       // fix - Error: Failed to execute 'querySelector' on 'Element': 'ytd-comment-thread-renderer:has(#linked-comment-badge) #replies' is not a valid selector.
   //       // https://jsfiddle.net/f6o2amjk/4/ https://www.bram.us/2023/01/04/css-has-feature-detection-with-supportsselector-you-want-has-not-has/
   //          // throw new Error('CSS ":has()" unsupported');
   //          console.warn('CSS ":has()" unsupported');
   //          return reject('CSS ":has()" unsupported');
   //       }

   //       if (limit_data && (/*!Object.keys(limit_data).label ||*/ !limit_data.hasOwnProperty('destroy_after_page_leaving') && !limit_data.hasOwnProperty('container'))) {
   //          console.error('waitSelector > check format "limit_data":', ...arguments);
   //          return reject('waitSelector > check format "limit_data"');
   //       }
   //       if (limit_data?.container && !(container instanceof HTMLElement)) {
   //          console.error('waitSelector > container not HTMLElement:', ...arguments);
   //          return reject('waitSelector > container not HTMLElement');
   //       }
   //       // console.debug('waitSelector:', selector);

   //       // https://stackoverflow.com/a/68262400
   //       // best https://codepad.co/snippet/wait-for-an-element-to-exist-via-mutation-observer
   //       // alt:
   //       // https://git.io/waitForKeyElements.js
   //       // https://github.com/fuzetsu/userscripts/tree/master/wait-for-elements
   //       // https://github.com/CoeJoder/waitForKeyElements.js
   //       // https://gist.githubusercontent.com/sidneys/ee7a6b80315148ad1fb6847e72a22313/raw/
   //       // https://greasyfork.org/scripts/21927-arrive-js/code/arrivejs.js  (ex: https://greasyfork.org/en/scripts/429783-confirm-and-upload-imgur)
   //       // https://greasyfork.org/scripts/464780-global-module/code/global_module.js
   //       // https://github.com/CoeJoder/waitForKeyElements.js
   //       // https://update.greasyfork.org/scripts/419640/887637/onElementReady.js

   //       // There is a more correct method - transitionend.
   //       // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/transitionend_event
   //       // But this requires a change in the logic of the current implementation. It will also complicate the restoration of the expansion if in the future, if YouTube replaces logic.

   //       // resolve
   //       if (element = (limit_data?.container || document.body || document).querySelector(selector)) {
   //          // console.debug('[1]', selector);
   //          return resolve(element);
   //       }

   //       const startTime = Date.now();
   //       let waiting = false;

   //       const observerFactory = new MutationObserver((mutationRecordsArray, observer) => {
   //          // for (const record of mutationRecordsArray) {
   //          //    for (const node of record.addedNodes) {
   //          //       if (![1, 3, 8].includes(node.nodeType) || !(node instanceof HTMLElement)) continue; // speedup hack

   //          //       if (node.matches && node.matches(selector)) { // this node
   //          //          console.debug('[2]', Date.now() - startTime, 'ms', record.type, node.nodeType, selector);
   //          //          observer.disconnect();
   //          //          return resolve(node);
   //          //       }
   //          //       // closet ?
   //          //       else if ( // inside node
   //          //          (parentEl = node.parentElement || node)
   //          //          && (!(parentEl instanceof HTMLElement))
   //          //          && (element = parentEl.querySelector(selector))
   //          //       ) {
   //          //          console.debug('[3]', Date.now() - startTime, 'ms', record.type, node.nodeType, selector);
   //          //          observer.disconnect();
   //          //          return resolve(element);
   //          //       }
   //          //    }
   //          // }

   //          // after for-loop. In global
   //          // if (document?.readyState != 'loading' // fix slowdown page
   //          //    && (element = (limit_data?.container || document?.body || document).querySelector(selector))
   //          // ) {
   //          //    // console.debug('[4]', selector);
   //          //    observer.disconnect();
   //          //    return resolve(element);
   //          // }

   //          if (!waiting
   //             && document?.readyState != 'loading' // fix slowdown page
   //             // && document.visibilityState == 'visible'
   //          ) {
   //             waiting = true;
   //             setTimeout(() => {
   //                if (element = (limit_data?.container || document?.body || document).querySelector(selector)) {
   //                   // console.debug('[4]', selector);
   //                   observer.disconnect();
   //                   return resolve(element);
   //                }
   //                waiting = false;
   //             }, 100); // Adjust throttle time as needed
   //          }
   //       });

   //       observerFactory
   //          .observe(limit_data?.container || document.body || document.documentElement || document, {
   //             childList: true, // observe direct children
   //             subtree: true, // and lower descendants too
   //             attributes: true, // need to - "NOVA.waitSelector('#movie_player.ytp-autohide video')" in embed page
   //             //  characterData: true,
   //             //  attributeOldValue: true,
   //             //  characterDataOldValue: true
   //          });

   //       // destructure self
   //       if (sec = +limit_data?.destroy_timeout) {
   //          setTimeout(() => {
   //             observerFactory.disconnect();
   //             return reject(`"${selector}" timed out after ${sec} seconds`);
   //          }, sec * 1000);
   //       }

   //       // destructure self
   //       // if (limit_data?.destroy_on_page_navigate) {
   //       if (limit_data?.destroy_after_page_leaving) {
   //          // url save init
   //          isURLChange();
   //          // on page update
   //          window.addEventListener('transitionend', ({ target }) => isURLChange() && observerFactory.disconnect(), { capture: true, once: true });

   //          function isURLChange() {
   //             return (this.prevURL === document.URL) ? false : this.prevURL = document.URL;
   //          }
   //       }
   //    });
   // },

   /**
    * Finds an element on the webpage, with timeout and page change handling.
    *
    * @param {string} selector - CSS selector for the target element
    * @param {object} options - Configuration options
    * @param {HTMLElement} options.container - The element to search within (defaults to document)
    * @param {number} options.destroy_timeout - Timeout in seconds before rejecting (optional)
    * @param {boolean} options.destroy_after_page_leaving - Disconnect observer on page change (optional)
    *
    * @returns {Promise<HTMLElement>} - Resolves with the found element, rejects on timeout or error
   */
   waitSelector(selector = required(), options = {}) {
      const { container = document, destroy_timeout, destroy_after_page_leaving } = options;

      return new Promise((resolve, reject) => {
         // reject
         if (typeof selector !== 'string') {
            console.error('wait > selector:', ...arguments);
            return reject('wait > selector:', typeof selector);
         }
         // if (selector.includes(':has(')) selector = `@supports selector(:has(*)) {${selector}}`
         else if (selector.includes(':has(') && !CSS.supports('selector(:has(*))')) {
            // fix - Error: Failed to execute 'querySelector' on 'Element': 'ytd-comment-thread-renderer:has(#linked-comment-badge) #replies' is not a valid selector.
            // https://jsfiddle.net/f6o2amjk/4/ https://www.bram.us/2023/01/04/css-has-feature-detection-with-supportsselector-you-want-has-not-has/
            // throw new Error('CSS ":has()" unsupported');
            console.error('CSS ":has()" unsupported');
            return reject('CSS ":has()" unsupported');
         }

         if (options?.container && (!(options.container instanceof HTMLElement))) {
            console.error('waitSelector > container not HTMLElement:', ...arguments);
            return reject('waitSelector > container not HTMLElement');
         }

         const prevURL = document.URL; // For page change detection
         let recordId;

         function queryElement() {
            if (el = container.querySelector(selector)) stop(el);
            else {
               recordId = requestAnimationFrame(queryElement);
            }

            function stop(el) {
               if (recordId) {
                  cancelAnimationFrame(recordId);
               }
               resolve(el);
            }
         }

         queryElement();

         // Handle timeout (if provided)
         if (destroy_timeout) {
            setTimeout(() => {
               cancelAnimationFrame(recordId);
               reject(`${name || 'Element'} timed out after ${destroy_timeout} seconds`);
            }, destroy_timeout * 1000);
         }

         // Handle page change (if enabled)
         if (destroy_after_page_leaving) {
            window.addEventListener('transitionend', ({ target }) => {
               if (prevURL != document.URL) {
                  cancelAnimationFrame(recordId);
                  reject(`${name || 'Element'} not found before page change`);
               }
            }, { capture: true, once: true });
         }
      });
   },

   /**
    * @param  {function} condition
    * @param  {int*} timeout
    * @return {Promise<fn>}
   */
   /** wait for every DOM change until a condition becomes true */
   // await NOVA.waitUntil(fn_condition, 500) // 500ms
   waitUntil(condition = required(), timeout = required()) {
      if (typeof condition !== 'function') return console.error('waitUntil > condition is not fn:', typeof condition);

      return new Promise((resolve) => {
         if (result = condition()) {
            // console.debug('waitUntil[1]', result, condition, timeout);
            resolve(result);
         }
         else {
            const waitCondition = setInterval(() => {
               if (result = condition()) {
                  // console.debug('waitUntil[2]', result, condition, timeout);
                  clearInterval(waitCondition);
                  resolve(result);
               }
               // console.debug('waitUntil[3]', result, condition, timeout);
            }, +timeout || 500); // default 500ms
         }
      });
   },

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
      // alt - https://github.com/uzairfarooq/arrive (https://greasyfork.org/scripts/21927-arrive-js/code/arrivejs.js)

      // console.debug('watch', selector);
      if (!Array.isArray(selectors) && typeof selectors !== 'string') return console.error('watch > selector:', typeof selectors);
      if (typeof callback !== 'function') return console.error('watch > callback:', typeof callback);

      let waiting = false;
      // let mutations = [];

      // selectors str to array
      !Array.isArray(selectors) && (selectors = selectors.split(',').map(s => s.trim()));

      const observerFactory = new MutationObserver(records => {
         // mutations.push(...records);
         if (!waiting && document.visibilityState == 'visible') {
            waiting = true;
            setTimeout(() => {
               // callback(mutations);
               process();
               waiting = false;
               // mutations = [];
            }, 100); // Adjust throttle time as needed
         }
      });
      observerFactory
         .observe(document.body || document.documentElement || document, {
            childList: true, // observe direct children
            subtree: true, // and lower descendants too
            attributes: true, // need to - "NOVA.waitSelector('#movie_player.ytp-autohide video')" in embed page
            //  characterData: true,
            //  attributeOldValue: true,
            //  characterDataOldValue: true
         });

      // destructure self
      // if (limit_data?.destroy_on_page_navigate) {
      if (destroy_after_page_leaving) {
         // url save init
         isURLChange();
         // on page update
         window.addEventListener('transitionend', ({ target }) => isURLChange() && observerFactory.disconnect());

         function isURLChange() {
            return (this.prevURL === document.URL) ? false : this.prevURL = document.URL;
         }
      }

      function process() {
         // console.debug('watch.process', { selector, callback });
         selectors
            .forEach(selector => {
               // https://jsfiddle.net/f6o2amjk/4/ https://www.bram.us/2023/01/04/css-has-feature-detection-with-supportsselector-you-want-has-not-has/
               // if (selector.includes(':has(')) selector = `@supports selector(:has(*)) {${selector}}`
               if (selector.includes(':has(') && !CSS.supports('selector(:has(*))')) {
                  return console.warn('CSS ":has()" unsupported');
               }

               if (attr_mark) selector += `:not([${attr_mark}])`;
               // if ((slEnd = ':not([hidden])') && !selector.endsWith(slEnd)) {
               //    selector += slEnd;
               // }
               // console.debug('selector', selector);

               document.body.querySelectorAll(selector)
                  .forEach(el => {
                     // if (el.offsetWidth > 0 || el.offsetHeight > 0) { // el.is(":visible")
                     // console.debug('watch.process.viewed', selector);
                     if (attr_mark) el.setAttribute(attr_mark, true);
                     callback(el);
                     // }
                  });
            });
      }

   },

   /**
    * @param  {function} callback
    * @return {void}
   */
   // Check if URL has changed
   runOnPageLoad(callback) {
      if (!callback || typeof callback !== 'function') {
         return console.error('runOnPageLoad > callback not function:', ...arguments);
      }
      let prevURL = document.URL;
      const isURLChange = () => (prevURL === document.URL) ? false : prevURL = document.URL;
      // init
      isURLChange() || callback();
      // update
      // window.addEventListener('transitionend', () => isURLChange() && callback());
      document.addEventListener('yt-navigate-finish', () => isURLChange() && callback());
   },

   /**
    * @param  {obj/string} css
    * @param  {string*} selector
    * @param  {boolean*} set_important
    * @return {void}
   */
   css: {
      push(css = required(), selector, set_important) {
         // console.debug('css\n', ...arguments);
         if (typeof css === 'object') {
            if (!selector) return console.error('injectStyle > empty json-selector:', ...arguments);

            // To above v105 https://developer.mozilla.org/en-US/docs/Web/CSS/:has
            if (selector.includes(':has(') && !CSS.supports('selector(:has(*))')) {
               // throw new Error('CSS ":has()" unsupported');
               return console.error('CSS ":has()" unsupported', ...arguments);
            }

            // if (set_important) {
            injectCss(selector + json2css(css));
            // } else {
            //    Object.assign(document.body.querySelector(selector).style, css);
            // }

            function json2css(obj) {
               let css = '';
               Object.entries(obj)
                  .forEach(([key, value]) => {
                     css += key + ':' + value + (set_important ? ' !important' : '') + ';';
                  });
               return `{ ${css} }`;
            }
         }
         else if (css && typeof css === 'string') {
            if (document.head) {
               injectCss(css);
            }
            else {
               window.addEventListener('load', () => injectCss(css), { capture: true, once: true });
            }
         }
         else {
            console.error('addStyle > css:', typeof css);
         }

         function injectCss(source = required()) {
            let sheet;

            if (source.endsWith('.css')) {
               sheet = document.createElement('link');
               sheet.rel = 'sheet';
               sheet.href = source;
            }
            else {
               const sheetId = 'NOVA-style';
               sheet = document.getElementById(sheetId) || (function () {
                  const style = document.createElement('style');
                  style.type = 'text/css';
                  style.id = sheetId;
                  return (document.head || document.documentElement).appendChild(style);
               })();
            }

            // sheet.innerText += '/**/\n' + source
            sheet.textContent += '/**/\n' + source
               .replace(/\n+\s{2,}/g, ' ') // singleline format
               // multiline format
               // .replace(/\n+\s{2,}/g, '\n\t')
               // .replace(/\t\}/mg, '}')
               + '\n';
            // sheet.insertRule(css, sheet.cssRules.length);
            // (document.head || document.documentElement).append(sheet);
            // document.adoptedStyleSheets.push(newSheet); // v99+

            // sheet.onload = () => NOVA.log('style loaded:', sheet.src || sheet || sheet.textContent.substr(0, 100));
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
         return (el = (selector instanceof HTMLElement) ? selector : document.body?.querySelector(selector))
            ? getComputedStyle(el).getPropertyValue(prop_name) : null; // for some callback functions (Match.max) return "undefined" is not valid
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
      //    return Object.fromEntries(
      //       document.cookie
      //          .split(/; */)
      //          .map(c => {
      //             const [key, ...v] = c.split('=');
      //             return [key, decodeURIComponent(v.join('='))];
      //          })
      //    )[name];
      // },
      get(name = required()) {
         return (matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
            && decodeURIComponent(matches[1]));
      },
      get(name = required()) {
         return (match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))) && decodeURIComponent(match[2]);
      },
      // 70.38 % slower
      // set(name = required(), value = '', days = 90) { // 90 days
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
         this.set(name, '', -1);
      },
      clear() {
         for (const key in this.get()) {
            this.delete(key);
         }
         const domain = location.hostname.replace(/^www\./i, '');
         this.clearAllCookies(domain);
      },
      clearAllCookies(domain) {
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
      if (!(el instanceof HTMLElement)) return console.error('el is not HTMLElement type:', el);

      if (distance = el.getBoundingClientRect()) {
         return (
            distance.top >= 0 &&
            distance.left >= 0 &&
            distance.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            distance.right <= (window.innerWidth || document.documentElement.clientWidth)
         );
      }
   },

   /**
    * @param  {Node} el
    * @return  {boolean}
   */
   // checkVisibility(el = required()) {
   //    if (!el.offsetHeight && !el.offsetWidth) return false;

   //    if (styles = getComputedStyle(el)) {
   //       return (
   //          styles.visibility != 'hidden' &&
   //          styles.display != 'none'
   //       );
   //    }
   // }

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
      const selector_id = `${label.match(/[a-z]+/gi).join('')}-prevent-load-btn`;

      this.waitSelector(selector.toString())
         .then(el => {
            if (remove) el.remove();
            else {
               if (document.getElementById(selector_id)) return;
               el.style.display = 'none';
               // create button
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
         const
            gcd = (a, b) => b ? gcd(b, a % b) : a,
            divisor = gcd(width, height),
            w = width / divisor,
            h = height / divisor;

         return (w > 10 && h > 10 && Math.abs(w - h) <= 2) // fix ration "91:90", "121:120" etc.
            ? '1:1'
            : w + ':' + h;

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
         //       return width + 'x' + height;
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
            'landscape': {
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
            'portrait': {
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
         return choiceRatioFromList(this.getAspectRatio(...arguments)) || acceptedRatioList['landscape']['16:9'];

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
   openPopup({ url = required(), title = document.title, width = window.innerWidth, height = window.innerHeight, closed_callback }) {
      // console.debug('openPopup', ...arguments);
      // center screen
      const left = (window.screen.width / 2) - (width / 2);
      const top = (window.screen.height / 2) - (height / 2);
      // const left = (screen.width / 2) - (width / 2);
      // const top = (screen.height / 2) - (height / 2);
      // bottom right corner
      // left = window.innerWidth;
      // top = window.innerHeight;
      const win = window.open(url, '_blank', `popup=1,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,copyhistory=no,width=${width},height=${height},top=${top},left=${left}`);
      // win.document.title = title; // Uncaught TypeError: Cannot read properties of null (reading 'document')

      if (closed_callback && typeof closed_callback === 'function') {
         const timer = setInterval(() => {
            if (win.closed) {
               clearInterval(timer);
               closed_callback();
            }
         }, 500);
      }
   },

   /**
    * @param  {HTMLElement}
    * @return {void}
   */
   // simulateClick(el = required()) {
   //    if (!(el instanceof HTMLElement)) return console.error('el is not HTMLElement type:', el);
   //    ['mouseover', 'mousedown', 'mouseup', 'click']
   //       .forEach(evt => {
   //          el.dispatchEvent(new MouseEvent(evt, {
   //             bubbles: true,
   //             cancelable: true,
   //             // view: window
   //             // target: document.body,
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
      // 'timeout_ms': null,
      // 'clear_previous_text': true,
   }) {
      console.debug('showOSD', ...arguments);
      // notification [player-indicator] plugin
      document.dispatchEvent(
         new CustomEvent(
            'nova-osd',
            {
               bubbles: true,
               detail: {
                  'message': message,
                  'ui_value': ui_value,
                  'ui_max': ui_max,
                  'source': source,
                  // 'timeout_ms': null,
                  // 'clear_previous_text': true,
               }
            })
      );
   },
   // showOSD(text) {
   //    // console.debug('showOSD', ...arguments);
   //    if (!text || !['watch', 'embed'].includes(this.currentPage)) return;
   //    if (typeof this.fadeBezel === 'number') clearTimeout(this.fadeBezel); // reset fade

   //    const bezelEl = document.body.querySelector('.ytp-bezel-text');
   //    if (!bezelEl) return console.error(`showOSD ${text}=>${bezelEl}`);

   //    const
   //       bezelContainer = bezelEl.parentElement.parentElement,
   //       CLASS_VALUE = 'ytp-text-root',
   //       SELECTOR = '.' + CLASS_VALUE; // for css

   //    if (!this.bezel_css_inited) {
   //       this.bezel_css_inited = true;
   //       this.css.push(
   //          `${SELECTOR} { display: block !important; }
   //          ${SELECTOR} .ytp-bezel-text-wrapper {
   //             pointer-events: none;
   //             z-index: 40 !important;
   //          }
   //          ${SELECTOR} .ytp-bezel-text { display: inline-block !important; }
   //          ${SELECTOR} .ytp-bezel { display: none !important; }`);
   //    }

   //    bezelEl.textContent = text;
   //    bezelContainer.classList.add(CLASS_VALUE);

   //    let ms = 1200;
   //    if ((text = String(text)) && (text.endsWith('%') || text.endsWith('x') || text.startsWith('+'))) {
   //       ms = 600
   //    }

   //    this.fadeBezel = setTimeout(() => {
   //       bezelContainer.classList.remove(CLASS_VALUE);
   //       bezelEl.textContent = ''; // fix not showing bug when frequent calls
   //    }, ms);
   // },

   /**
    * @param  {int} video_duration
    * @return {array}
   */
   getChapterList(video_duration = required()) {
      if (!['watch', 'embed'].includes(this.currentPage)) return;

      switch (NOVA.currentPage) {
         case 'embed':
            chapsCollect = getFromAPI();
            // console.debug('chapsCollect (embed)', chapsCollect);
            return chapsCollect;
            break;

         // Solution 2
         case 'watch':
            // if ((chapsCollect = getFromDescriptionText() || getFromDescriptionChaptersBlock())
            if ((chapsCollect = getFromDescriptionText())
               && chapsCollect.length
            ) {
               // console.debug('chapsCollect (watch)', chapsCollect);
               return chapsCollect;
            }
            break;
      }

      function descriptionExpand() {
         document.body.querySelector('#meta [collapsed] #more, [description-collapsed] #description #expand')?.click();
      }

      function getFromDescriptionText() {
         descriptionExpand();

         const selectorTimestampLink = 'a[href*="&t="]';
         let
            timestampsCollect = [],
            unreliableSorting;

         [
            // description text
            // https://www.youtube.com/watch?v=4_m3HsaNwOE - bold chapater "Screenshot moment" show markdown "*Screenshot moment*"(
            (document.body.querySelector('.ytd-page-manager[video-id]')?.playerData?.videoDetails?.shortDescription
               || document.body.querySelector('ytd-watch-metadata #description.ytd-watch-metadata')?.textContent
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
                     'text': `${a.textContent} ${(a.nextSibling || a.previousSibling)?.textContent}`, // a.nextElementSibling || a.previousElementSibling
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
                     if (line.length > 5
                        && (timestamp = /((\d?\d:){1,2}\d{2})/g.exec(line))
                        && (line.length - timestamp.length) < 200 // 200 max line length (https://www.youtube.com/watch?v=kSfPHLVFBQk&t=763s)
                     ) {
                        // console.debug('line', line);
                        timestamp = timestamp[0]; // ex:"0:00"
                        const
                           sec = NOVA.formatTimeOut.hmsToSec(timestamp),
                           timestampPos = line.indexOf(timestamp);

                        if (
                           // fix invalid sort timestamp
                           // ex: https://www.youtube.com/watch?v=S66Q7T7qqxU https://www.youtube.com/watch?v=nkyXwDU97ms
                           (unreliableSorting ? true : (sec > prevSec && sec < +video_duration))
                           // not in the middle of the line ("2" - is a possible error. For example, at the end of the line there is a comma and the time is in brackets)
                           // ex: https://www.youtube.com/watch?v=5Do_0aWpYeo
                           && (timestampPos < 5 || (timestampPos + timestamp.length) > (line.length - 2))
                        ) {
                           if (unreliableSorting) prevSec = sec;

                           timestampsCollect.push({
                              'sec': sec,
                              'time': timestamp.startsWith('0')
                                 ? NOVA.formatTimeOut.HMS.digit(sec) // clear zeros prefix (like "00:05:11" -> "5:11")
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

      function getFromDescriptionChaptersBlock() {
         descriptionExpand();

         const selectorTimestampLink = 'a[href*="&t="]';
         let timestampsCollect = [];
         let prevSec = -1;
         document.body.querySelectorAll(`#structured-description ${selectorTimestampLink}`)
            // document.body.querySelectorAll(`#description.ytd-watch-metadata ${selectorTimestampLink}`)
            .forEach(chapterLink => {
               // console.debug('chapterLink:', chapterLink);
               // filter duplicate
               const sec = parseInt(NOVA.queryURL.get('t', chapterLink.href));
               if (sec > prevSec) {
                  prevSec = sec;
                  timestampsCollect.push({
                     'time': NOVA.formatTimeOut.HMS.digit(sec),
                     'sec': sec,
                     'title': chapterLink.textContent.trim().split('\n')[0].trim(),
                     // in #structured-description
                     // 'time': chapterLink.querySelector('#time')?.textContent,
                     // 'title': chapterLink.querySelector('h4')?.textContent,
                  });
               }
            });
         // if 1 mark < 25% video_duration. Ex skip intro info in comment
         if (timestampsCollect.length == 1 && (timestampsCollect[0].sec < (video_duration / 4))) {
            return timestampsCollect;
         }
         else if (timestampsCollect.length > 1) {
            // console.debug('timestamepsCollect', timestampsCollect);
            return timestampsCollect;
         }
      }

      function getFromAPI() {
         // console.debug('getFromAPI');
         if (!window.ytPubsubPubsubInstance) {
            return console.warn('ytPubsubPubsubInstance is empty:', ytPubsubPubsubInstance);
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
                        'time': NOVA.formatTimeOut.HMS.digit(sec),
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
    * @param  {string} filter_selectors
    * @param  {boolean*} highlight_selector
    * @return {void}
   */
   searchFilterHTML({
      keyword = required(),
      filter_selectors = required(),
      highlight_selector,
      highlight_class,
   }) {
      // console.debug('searchFilterHTML:', ...arguments);
      keyword = keyword.toString().toLowerCase();

      document.body.querySelectorAll(filter_selectors)
         .forEach(item => {
            const
               // text = item.textContent,
               text = item.innerText,
               // text = item.querySelector(highlight_selector).getAttribute('title'),
               hasText = text?.toLowerCase().includes(keyword),
               highlight = el => {
                  if (el.innerHTML.includes('<mark ')) {
                     el.innerHTML = this.createSafeHTML(el.innerHTML
                        .replace(/<\/?mark[^>]*>/g, '')
                     ); // clear highlight tags
                  }
                  item.style.display = hasText ? '' : 'none'; // hide el out of search
                  if (hasText && keyword) {
                     highlightTerm({
                        'target': el,
                        'keyword': keyword,
                        'highlightClass': highlight_class,
                     });
                  }
               };

            (highlight_selector ? item.querySelectorAll(highlight_selector) : [item])
               .forEach(highlight);
         });

      function highlightTerm({ target = required(), keyword = required(), highlightClass }) {
         // console.debug('highlightTerm:', ...arguments);
         const
            // content = target.innerHTML,
            // content = target.textContent,
            content = target.innerText,
            pattern = new RegExp('(>[^<.]*)?(' + keyword + ')([^<.]*)?', 'gi'),
            highlightStyle = highlightClass ? `class="${highlightClass}"` : 'style="background-color:#afafaf"',
            replaceWith = `$1<mark ${highlightStyle}>$2</mark>$3`,
            marked = content.replaceAll(pattern, replaceWith);

         return (target.innerHTML = NOVA.createSafeHTML(marked)) !== content;
      }
   },

   /**
    * @return {boolean}
   */
   // isMusicChannel() {
   isMusic() {
      if (!['watch', 'embed'].includes(this.currentPage)) return;

      return checkMusicType();
      // const
      //    CACHE_PREFIX = 'nova-music-type',
      //    cacheName = CACHE_PREFIX + ':' + (this.queryURL.get('v') || movie_player.getVideoData().video_id);

      // // fix (Disable cache) - Failed to read the 'sessionStorage' property from 'Window': Access is denied for this document.
      // if (!navigator.cookieEnabled && this.currentPage == 'embed') return checkMusicType();

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
            // channelName = document.body.querySelector('#upload-info #channel-name a:not(:empty)')?.textContent,
            // channelName = document.body.querySelector('.ytd-page-manager[video-id]')?.playerData?.videoDetails?.author,
            // channelName = document.body.querySelector('.ytd-page-manager[video-id]')?.playerData?.microformat?.playerMicroformatRenderer.ownerChannelName,
            channelName = movie_player.getVideoData().author, // document.body.querySelector('.ytp-title-channel a:not(:empty)').textContent
            titleStr = movie_player.getVideoData().title.toUpperCase(), // #movie_player .ytp-title a:not(:empty)
            titleWordsList = titleStr?.toUpperCase().match(/\w+/g), // UpperCase
            playerData = document.body.querySelector('.ytd-page-manager[video-id]')?.playerData;

         // if (user_settings.rate_apply_music == 'expanded') {
         //    // 【MAD】,『MAD』,「MAD」
         //    // warn false finding ex: "AUDIO visualizer" 'underCOVER','VOCALoid','write THEME','UI THEME','photo ALBUM', 'lolyPOP', 'ascENDING', speeED, 'LapOP' 'Ambient AMBILIGHT lighting', 'CD Projekt RED', 'Remix OS, TEASER
         //    if (titleStr.split(' - ').length === 2  // search for a hyphen. Ex.:"Artist - Song", "Sound Test" (https://www.youtube.com/watch?v=gLSTUhRY2-s)
         //       || ['【', '『', '「', 'SOUND', 'REMIX', 'CD', 'PV', 'AUDIO', 'EXTENDED', 'FULL', 'TOP', 'TRACK', 'TRAP', 'THEME', 'PIANO', 'POP', '8-BIT', 'HITS', 'CLASSIC'].some(i => titleWordsList?.map(w => w.toUpperCase()).includes(i))
         //    ) {
         //       return true;
         //    }
         // }

         return [
            titleStr, // ex. - https://www.youtube.com/watch?v=mjLSQMPr6ak
            location.host, // music.youtube.com
            location.hash, // youtube.com#music
            channelName,
            // video genre
            playerData?.microformat?.playerMicroformatRenderer.category, // exclude embed page
            // playlistTitle
            playerData?.videoDetails?.title, // ex. - https://www.youtube.com/watch?v=cEdVLDfV1e0&list=PLVrIzE02N3EE9mplAPO8BGleeenadCSNv&index=2

            // ALL BELOW - not updated after page transition!
            // window.ytplayer?.config?.args.title,
            // document.body.querySelector('meta[itemprop="genre"][content]')?.content,
            // window.ytplayer?.config?.args.raw_player_response.microformat?.playerMicroformatRenderer.category,
            // document.body.querySelector('ytd-player')?.player_?.getCurrentVideoConfig()?.args.raw_player_response?.microformat.playerMicroformatRenderer.category
         ]
            .some(i => i?.toUpperCase().includes('MUSIC'))

            // 'Official Artist' badge
            || document.body.querySelector('#upload-info #channel-name .badge-style-type-verified-artist')
            // https://yt.lemnoslife.com/channels?part=approval&id=CHANNEL_ID (items[0].approval == 'Official Artist Channel') (https://github.com/Benjamin-Loison/YouTube-operational-API)

            // channelNameVEVO
            || (channelName && /(VEVO|Topic|Records|RECORDS|Recordings|AMV)$/.test(channelName)) // https://www.youtube.com/channel/UCHV1I4axw-6pCeQTUu7YFhA, https://www.youtube.com/@FIRESLARadio, https://www.youtube.com/@VisibleNoiseRecords, https://www.youtube.com/@TerribleRecords, https://www.youtube.com/@blackholerecordings

            // specific word in channel
            || (channelName && /(MUSIC|ROCK|SOUNDS|SONGS)/.test(channelName.toUpperCase())) // https://www.youtube.com/channel/UCj-Wwx1PbCUX3BUwZ2QQ57A https://www.youtube.com/@RelaxingSoundsOfNature

            // word - https://www.youtube.com/watch?v=N67yRMOVk1s
            || titleWordsList?.length && ['🎵', '♫', 'SONG', 'SONGS', 'SOUNDTRACK', 'LYRIC', 'LYRICS', 'AMBIENT', 'MIX', 'VEVO', 'CLIP', 'KARAOKE', 'OPENING', 'COVER', 'COVERED', 'VOCAL', 'INSTRUMENTAL', 'ORCHESTRAL', 'SYMPHONY', 'CONCERT', 'DUBSTEP', 'DJ', 'DNB', 'BASS', 'BEAT', 'ALBUM', 'PLAYLIST', 'DUBSTEP', 'CHILL', 'RELAX', 'CINEMATIC', 'KBPS']
               .some(i => titleWordsList.includes(i))

            // words ("feat." miss - https://www.youtube.com/watch?v=7ubvobYxgBk)
            || ['OFFICIAL VIDEO', 'OFFICIAL AUDIO', 'FEAT.', 'FT.', 'LIVE RADIO', 'DANCE VER', 'HIP HOP', 'ROCK N ROLL', 'HOUR VER', 'HOURS VER', 'INTRO THEME'] // 'FULL ALBUM'
               .some(i => titleStr.includes(i))

            // word (case sensitive)
            || titleWordsList?.length && ['OP', 'ED', 'MV', 'OST', 'NCS', 'BGM', 'EDM', 'GMV', 'AMV', 'MMD', 'MAD', 'HQ']
               .some(i => titleWordsList.includes(i));
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
   formatTimeOut: {
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

      HMS: {
         parseTime(time_sec) {
            const ts = Math.abs(+time_sec);
            return {
               d: Math.trunc(ts / 86400),
               h: Math.trunc((ts % 86400) / 3600),
               m: Math.trunc((ts % 3600) / 60),
               // min = Math.trunc(Math.log(sec) / Math.log(60)), // after sec
               s: Math.trunc(ts % 60),
            };
         },

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
         digit(time_sec = required()) { // format out "h:mm:ss"
            const { d, h, m, s } = this.parseTime(time_sec);

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
         abbr(time_sec = required()) { // format out "999h00m00s"
            const { d, h, m, s } = this.parseTime(time_sec);

            return (d ? `${d}d ` : '')
               + (h ? (d ? h.toString().padStart(2, '0') : h) + 'h' : '')
               + (m ? (h ? m.toString().padStart(2, '0') : m) + 'm' : '')
               + (s ? (m ? s.toString().padStart(2, '0') : s) + 's' : '');
            // 81.34 % slower
            // const ts = Math.abs(+time_sec);
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
         if (!(date instanceof Date)) return console.error('"date" is not Date type:', date);

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
            seconds = Math.round((Date.now() - Math.abs(now)) / 1000),
            interval = samples.find(i => i.sec < seconds),
            time = Math.round(seconds / interval.sec);

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

      if (!(this instanceof Date)) return console.error('dateFormat - is not Date type:', this);

      // console.debug('format', format);
      const
         twoDigit = n => n.toString().padStart(2, '0'),
         date = this.getDate(),
         year = this.getFullYear(),
         monthIdx = this.getMonth(),
         weekIdx = this.getDay(),
         hours = this.getHours(),
         minutes = this.getMinutes(),
         seconds = this.getSeconds();

      return format
         // .replace(/a|A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/g, partPattern => { // full
         .replace(/A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/gi, pattern => { // remove key "a" for use text "at"
            let out;
            switch (pattern) {
               case 'YY': out = year.substr(2); break;
               case 'YYYY': out = year; break;
               case 'M': out = monthIdx + 1; break;
               case 'MM': out = twoDigit(monthIdx + 1); break;
               case 'MMM': out = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIdx]; break;
               case 'MMMM': out = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][monthIdx]; break;
               case 'D': out = date; break;
               case 'DD': out = twoDigit(date); break;
               case 'DDD': out = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'][weekIdx]; break;
               case 'DDDD': out = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekIdx]; break;
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
         if (typeof query_obj != 'object' || !Object.keys(query_obj).length) return console.error('query_obj:', query_obj);
         const url = new URL(url_string || location);
         Object.entries(query_obj).forEach(([key, value]) => url.searchParams.set(key, value));
         return url.toString();
      },

      remove(query = required(), url_string) {
         const url = new URL(url_string || location);
         url.searchParams.delete(query.toString());
         return url.toString();
      },

      getFromHash: (query = required(), url_string) => location.hash && new URLSearchParams(new URL(url_string || location).hash.substring(1)).get(query.toString()),
   },

   request: (() => {
      const API_STORE_NAME = 'YOUTUBE_API_KEYS'; // restrict access

      async function getKeys() { // restrict access
         NOVA.log('request.API: fetch to youtube_api_keys.json');
         // see https://gist.github.com/raingart/ff6711fafbc46e5646d4d251a79d1118/
         return await fetch('https://gist.githubusercontent.com/raingart/ff6711fafbc46e5646d4d251a79d1118/raw/youtube_api_keys.json')
            .then(res => res.text())
            // save
            .then(keys => {
               NOVA.log(`get and save keys in localStorage`, keys);
               localStorage.setItem(API_STORE_NAME, keys);
               return JSON.parse(keys);
            })
            // clear
            .catch(error => {
               localStorage.removeItem(API_STORE_NAME);
               throw error;
               // throw new Error(error);
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
            // NOVA.log('request.API:', ...arguments); // err
            // console.debug('API:', ...arguments);
            // get API key
            const YOUTUBE_API_KEYS = localStorage.hasOwnProperty(API_STORE_NAME)
               ? JSON.parse(localStorage.getItem(API_STORE_NAME)) : await getKeys();

            if (!api_key && (!Array.isArray(YOUTUBE_API_KEYS) || !YOUTUBE_API_KEYS?.length)) {
               localStorage.hasOwnProperty(API_STORE_NAME) && localStorage.removeItem(API_STORE_NAME);
               // alert('I cannot access the API key.'
               //    + '\nThe plugins that depend on it have been terminated.'
               //    + "\n - Check your network's access to Github"
               //    + '\n - Generate a new private key'
               //    + '\n - Deactivate plugins that need it'
               // );
               // throw new Error('YOUTUBE_API_KEYS is empty:', YOUTUBE_API_KEYS);
               return console.error('YOUTUBE_API_KEYS empty:', YOUTUBE_API_KEYS);
            }

            const referRandKey = arr => api_key || 'AIzaSy' + arr[Math.trunc(Math.random() * arr.length)];
            // combine GET
            const query = Object.keys(params)
               .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
               .join('&');

            const URL = `https://www.googleapis.com/youtube/v3/${request}?${query}&key=` + referRandKey(YOUTUBE_API_KEYS);
            // console.debug('URL', URL);
            // request
            return await fetch(URL)
               .then(response => response.json())
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
    * @param  {string*} state
    * @return {string}
   */
   getPlayerState(state) {
      // movie_player.getPlayerState() === 2 // 2: PAUSED
      // NOVA.getPlayerState() == 'PLAYING'
      // movie_player.addEventListener('onStateChange', state => 'PLAYING' == NOVA.getPlayerState(state));
      return {
         '-1': 'UNSTARTED',
         0: 'ENDED',
         1: 'PLAYING',
         2: 'PAUSED',
         3: 'BUFFERING',
         5: 'CUED'
      }[state || movie_player.getPlayerState()];
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
         document.body.querySelector('.ytd-page-manager[video-id]')?.playerData?.videoDetails?.channelId, // exclude embed page
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
      //             channelName = channelName_.substring(1);
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
      //    'match_fn': val => {},
      // });
      // ex test array: NOVA.searchInObjectBy.key({ obj: { a: [1, {"ucid": 11}] }, key: "ucid" })
      /**
       * @param  {object} obj
       * @param  {string} key
       * @param  {function*} match_fn
       * @param  {boolean*} multiple
       * @param  {int*} maxDepth
       * @return {object} {path, data, depth}
      */
      key({
         obj = required(),
         key = required(),
         multiple = false,
         // match_fn = data => data.constructor.name !== 'Object', // exclude objects type
         maxDepth = 10,
      }) {
         // if (typeof obj !== 'object') {
         //    return console.error('seachInObjectBy > key is not Object:', ...arguments);
         // }
         let results = [];

         return searchInternal({ 'obj': obj }) || (multiple && results);

         function searchInternal({ obj = required(), path = '', depth = 0 }) {
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
                  else if (depth < maxDepth) {
                     switch (obj[prop].constructor.name) {
                        case 'Object':
                           if (result = searchInternal({
                              'obj': obj[prop],
                              // 'path': path + '.' + prop,
                              'path': setPath(prop),
                              // 'match_fn': match_fn,
                              'depth': depth + 1,
                           })) {
                              if (multiple) results.push(result);
                              else return result;
                           }
                           break;

                        case 'Array':
                           for (let i = 0; i < obj[prop].length; i++) {
                              if (typeof obj[prop][i] !== 'undefined') {
                                 if (result = searchInternal({
                                    'obj': obj[prop][i],
                                    'path': path + `[${i}]`,
                                    // 'match_fn': match_fn,
                                    'depth': depth + 1,
                                 })) {
                                    if (multiple) results.push(result);
                                    else return result;
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

   log() {
      if (this.DEBUG && arguments.length) {
         console.groupCollapsed(...arguments);
         console.trace();
         console.groupEnd();
      }
   },
};
