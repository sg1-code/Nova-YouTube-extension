// for test:
// https://www.youtube.com/watch?v=Zrv1EDIqHkY - Includes paid promotion
// https://www.youtube.com/watch?v=1RjnI64Rwqs - Includes paid promotion

window.nova_plugins.push({
   id: 'ad-state',
   title: 'Show Ads info',
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
   run_on_pages: 'watch, -mobile',
   restart_on_location_change: true,
   section: 'details',
   // desc: ',
   _runtime: user_settings => {

      const SELECTOR_ID = 'nova-monetization';

      // movie_player.getAdState();

      // NOVA.waitSelector('.ytp-paid-content-overlay, ytm-paid-content-overlay-renderer', { destroy_after_page_leaving: true })
      //    .then(el => {
      //       insertToHTML({ 'text': `【Monetized (${adCount} ads)】`, 'container': el });
      //    });

      NOVA.waitSelector('#title h1', { destroy_after_page_leaving: true })
         .then(el => {
            if (playerResponse = document.getElementById('page-manager')?.getCurrentData()?.playerResponse) {
               let text = [];
               if (playerResponse?.paidContentOverlay) text.push('Sponsored');
               // if (adSlots = playerResponse?.adSlots?.length) text.push('adSlots: ' + adSlots);
               if (adCount = playerResponse?.adPlacements?.length) text.push(`Ads count ${adCount}`);

               if (text.length) insertToHTML({ 'text': `「${text.join(', ')}」`, 'container': el });
               // insertToHTML({ 'text': `【${text.join(', ')}】`, 'container': el });
            }
         });

      function insertToHTML({ text = '', container = required() }) {
         // console.debug('insertToHTML', ...arguments);
         if (!(container instanceof HTMLElement)) {
            console.error('Container is not an HTMLElement:', container);
            return;
         }

         (document.getElementById(SELECTOR_ID) || (() => {
            const el = document.createElement('span');
            el.id = SELECTOR_ID;
            el.classList.add('style-scope', 'yt-formatted-string', 'bold');
            // el.style.cssText = 'font-size: 1.35rem; line-height: 2rem; margin: 10px;';
            Object.assign(el.style, {
               'font-size': '1.35rem',
               'line-height': '2rem',
               margin: '10px',
            });
            container.after(el);
            // container.insertAdjacentElement('afterend', el);
            return el;
            // 62.88 % slower
            // container.insertAdjacentHTML('afterend', NOVA.createSafeHTML(
            //    `<span id="${SELECTOR_ID}" class="style-scope yt-formatted-string bold" style="font-size: 1.35rem; line-height: 2rem; font-weight:400;">${text}</span>`));
            // return document.getElementById(SELECTOR_ID);
         })())
            .textContent = text;
      }

   },
});
