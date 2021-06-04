const YDOM = {
   // DEBUG: true,

   HTMLElement: {
      // alternative https://github.com/fuzetsu/userscripts/tree/master/wait-for-elements

      // There is a more correct method - transitionend.
      // But this requires a change in the logic of the current implementation. It will also complicate the restoration of the expansion if in the future. If YouTube replaces logic.

      wait(selector = required()) {
         YDOM.log('wait', ...arguments);

         if (!('MutationObserver' in window)) throw new Error('MutationObserver not available!');

         return new Promise(resolve => {
            const el = (selector instanceof HTMLElement) ? selector : document.querySelector(selector);
            if (el) {
               YDOM.log('waited(1)', selector, el);
               return resolve(el);
            }
            if (typeof selector !== 'string') return console.error('wait > selector:', typeof selector);

            new MutationObserver((mutations, observer) => {
               mutations.forEach(mutation => {
                  [...mutation.addedNodes]
                     .filter(node => node.nodeType === 1)
                     .forEach(node => {
                        (node?.parentElement || document).querySelectorAll(selector)
                           .forEach(element => {
                              YDOM.log('waited', mutation.type, selector);
                              observer.disconnect();
                              return resolve(element);
                           });
                     });
               });
            })
               .observe(document.body || document.documentElement, { childList: true, subtree: true });
         });
      },

      watch({ selector = required(), attr_mark, callback = required() }) {
         YDOM.log('watch', selector);
         if (typeof selector !== 'string') return console.error('watch > selector:', typeof selector);

         process(); // launch not wait

         setInterval(process, 1000 * 1.5); // 1.5 sec

         function process() {
            YDOM.log('process', { selector, callback });
            document.querySelectorAll(selector + (attr_mark ? ':not([' + attr_mark + '])' : ''))
               .forEach(el => {
                  YDOM.log('viewed', selector);
                  if (attr_mark) el.setAttribute(attr_mark, true);
                  if (typeof callback !== 'function') return console.error('watch > callback:', typeof callback);
                  callback(el);
               });
         }
      },
   },

   css: {
      push(css = required(), selector, important) {
         if (typeof css === 'object') {
            if (!selector) {
               return console.error('injectStyle > empty json-selector:', ...arguments);
            }
            // if (important) {
            injectCss(selector + json2css(css));
            // } else {
            //    Object.assign(document.querySelector(selector).style, css);
            // }

            function json2css(obj) {
               let css = '';
               Object.entries(obj)
                  .forEach(([key, value]) => {
                     css += key + ':' + value + (important ? ' !important' : '') + ';';
                  });
               return `{ ${css} }`;
            }

         } else if (css && typeof css === 'string') injectCss(css);
         else console.error('addStyle > css:', typeof css);

         function injectCss(source = required()) {
            let sheet;

            if (source.endsWith('.css')) {
               sheet = document.createElement('link');
               sheet.rel = "sheet";
               sheet.href = source;

            } else {
               const sheetName = 'YDOM_style';
               sheet = document.getElementById(sheetName) || (function () {
                  const style = document.createElement('style');
                  style.type = 'text/css';
                  style.id = sheetName;
                  document.head.appendChild(style);
                  return style;
               })();
            }

            sheet.textContent += '/**/\n' + source
               .replace(/\n+\s{2,}/g, ' ') // singleline format
               // multiline format
               // .replace(/\n+\s{2,}/g, '\n\t')
               // .replace(/\t\}/mg, '}')
               + '\n';
            // sheet.insertRule(css, sheet.cssRules.length);
            // (document.head || document.documentElement).appendChild(sheet);

            sheet.onload = () => YDOM.log('style loaded:', sheet.src || sheet.textContent.substr(0, 100));
         }
      },

      getValue({ selector = required(), property = required() }) {
         const el = (selector instanceof HTMLElement) ? selector : document.querySelector(selector);
         if (!el) return console.warn('getCSSValue:selector is empty', el, ...arguments);
         return window.getComputedStyle(el)[property];
      },

      // uncheck: toggle => toggle.hasAttribute("checked") && toggle.click(),
   },

   cookie: {
      get(name = required()) {
         Object.fromEntries(
            document.cookie
               .split(/; */)
               .map(c => {
                  const [key, ...v] = c.split('=');
                  return [key, decodeURIComponent(v.join('='))];
               })
         )[name];
      },

      set(name = required(), value, days = 90) { // 90 days
         let date = new Date();
         date.setTime(date.getTime() + 3600000 * 24 * days); // m*h*d

         document.cookie = Object.entries({
            [encodeURIComponent(name)]: encodeURIComponent(value),
            domain: '.' + location.hostname.split('.').slice(-2).join('.'), // .youtube.com
            expires: date.toUTCString(),
            path: '/', // what matters at the end
         })
            .map(([key, value]) => `${key}=${value}`).join('; '); // if no "value" = undefined

         return document.cookie;
      },
   },

   bezelTrigger(text) {
      if (typeof fateBezel === 'number') clearTimeout(fateBezel);
      const bezelEl = document.querySelector(".ytp-bezel-text");
      if (!bezelEl || !text) return console.error(`bezelTrigger ${text}=>${bezelEl}`);

      const
         bezelConteiner = bezelEl.parentElement.parentElement,
         CLASS_VALUE_TOGGLE = 'ytp-text-root';

      if (!this.bezel_inited) {
         this.bezel_inited = true;
         this.css.push(
            `.${CLASS_VALUE_TOGGLE} {
               display: block !important;
            }
            .${CLASS_VALUE_TOGGLE} .ytp-bezel-text-wrapper {
               pointer-events: none;
               z-index: 40 !important;
            }
            .${CLASS_VALUE_TOGGLE} .ytp-bezel-text {
               display: inline-block !important;
            }
            .${CLASS_VALUE_TOGGLE} .ytp-bezel {
               display: none !important;
            }`);
      }

      bezelEl.textContent = text;
      bezelConteiner.classList.add(CLASS_VALUE_TOGGLE);

      fateBezel = setTimeout(() => bezelConteiner.classList.remove(CLASS_VALUE_TOGGLE), 600); // 600ms
   },

   secToStr(timestamp, no_zeros) {
      const
         hours = Math.floor(timestamp / 60 / 60),
         minutes = Math.floor(timestamp / 60) - (hours * 60),
         seconds = timestamp % 60;

      return [hours, minutes, seconds]
         .filter(i => +i) // clear zeros
         .map(i => no_zeros ? i : i.toString().padStart(2, '0')) // "1" => "01"
         .join(':'); // format "0h:0m:0s"
   },

   // YDOM.getURLParams().get('name');
   getURLParams: url => new URLSearchParams((url ? new URL(url) : location).search),
   // getQuery = (url, query) => new URLSearchParams(url).get(query),

   request: {

      API_STORE_NAME: 'YOUTUBE_API_KEYS',

      async API({ request, params, api_key }) {
         // YDOM.log('API:', ...arguments); // err
         // console.log('API:', ...arguments);
         // get API key
         const YOUTUBE_API_KEYS = localStorage.hasOwnProperty(this.API_STORE_NAME) ? JSON.parse(localStorage.getItem(this.API_STORE_NAME)) : await this.keys();

         if (!api_key && (!Array.isArray(YOUTUBE_API_KEYS) || !YOUTUBE_API_KEYS?.length)) {
            localStorage.hasOwnProperty(this.API_STORE_NAME) && localStorage.removeItem(this.API_STORE_NAME);
            // alert('I cannot access the API key.'
            //    + '\nThe plugins that depend on it have been terminated.'
            //    + "\n - Check your network's access to Github"
            //    + '\n - Generate a new private key'
            //    + '\n - Deactivate plugins that need it'
            // );
            // throw new Error('YOUTUBE_API_KEYS is empty:', YOUTUBE_API_KEYS);
            return console.error('YOUTUBE_API_KEYS empty:', YOUTUBE_API_KEYS);
         }

         const referRandKey = arr => api_key || 'AIzaSy' + arr[Math.floor(Math.random() * arr.length)];
         // combine GET
         const query = (request == 'videos' ? 'videos' : 'channels') + '?'
            + Object.keys(params)
               .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
               .join('&');

         const URL = `https://www.googleapis.com/youtube/v3/${query}&key=` + referRandKey(YOUTUBE_API_KEYS);
         // console.debug('URL', URL);
         // request
         return await fetch(URL)
            .then(response => response.json())
            .then(json => {
               if (!json.error && Object.keys(json).length) return json;
               console.warn('used key:', YDOM.getURLParams(URL).get('key'));
               throw new Error(JSON.stringify(json?.error));
            })
            .catch(error => {
               localStorage.removeItem(this.API_STORE_NAME);
               console.error(`Request API failed:${URL}\n${error}`);
               // alert('Problems with the YouTube API:'
               //    + '\n' + error?.message
               //    + '\n\nIf this error is repeated:'
               //    + '\n - Disconnect the plugins that need it'
               //    + '\n - Update your YouTube API KEY');
            });
      },

      async keys() {
         YDOM.log('fetch to youtube_api_keys.json');
         // see https://gist.github.com/raingart/ff6711fafbc46e5646d4d251a79d1118/
         return await fetch('https://gist.githubusercontent.com/raingart/ff6711fafbc46e5646d4d251a79d1118/raw/youtube_api_keys.json')
            .then(res => res.text())
            .then(keys => { // save
               YDOM.log(`get and save keys in localStorage`, keys);
               localStorage.setItem(this.API_STORE_NAME, keys);
               return JSON.parse(keys);
            })
            .catch(error => { // clear
               localStorage.removeItem(this.API_STORE_NAME);
               throw error;
               // throw new Error(error);
            })
            .catch(reason => console.error('Error get keys:', reason)); // warn
      },
   },

   log(...args) {
      if (this.DEBUG && args?.length) {
         console.groupCollapsed(...args);
         console.trace();
         console.groupEnd();
      }
   }
}
