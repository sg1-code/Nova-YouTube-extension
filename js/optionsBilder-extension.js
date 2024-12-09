console.debug('init optionsBilder-extension.js');

Plugins.load();

// send plugins form build
window.addEventListener('load', () => {
   document.dispatchEvent(new CustomEvent('settings-sync'));

   // add script info to open issues link
   document.body.querySelector('a[href$="issues/new"]')
      .addEventListener('click', ({ target }) => {
         target.href += '?body=' + encodeURIComponent(browser.runtime.getManifest().version + ' | ' + navigator.userAgent) + '&labels=bug&template=bug_report.md';
      });

   // export setting
   document.getElementById('settings_export')
      ?.addEventListener('click', () => {
         const manifest = browser.runtime.getManifest();

         Storage.getParams(user_settings => {
            const d = document.createElement('a');
            d.style.display = 'none';
            d.setAttribute('download', `${manifest.short_name || manifest.name}-backup.json`);
            d.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(user_settings)));
            document.body.append(d);
            d.click();
            console.debug('Settings file exported:', d.download);
            document.body.removeChild(d);
         }, storageMethod);
      });

   // import setting
   document.getElementById('settings_import')
      ?.addEventListener('click', () => {
         // check in popup
         if (document.body.clientWidth < 350) {
            // if (confirm(i18n('opt_import_popup'))) browser.runtime.openOptionsPage();
            if (confirm(i18n('opt_prompt_import_settings'))) {
               // browser.runtime.openOptionsPage();
               const urlOptionsPage = new URL(browser.runtime.getURL(
                  browser.runtime.getManifest().options_ui?.page// || options_page
               )); // manifest v2
               // const urlOptionsPage = new URL(browser.extension.getURL(browser.runtime.getManifest().options_page)); // manifest v3
               urlOptionsPage.searchParams.set('tabs', 'tab-other');
               window.open(urlOptionsPage.href);
            }
            return;
         }
         const f = document.createElement('input');
         f.type = 'file';
         f.accept = 'application/JSON';
         f.style.display = 'none';
         f.addEventListener('change', ({ target }) => {
            if (f.files.length !== 1) return alert('file empty');
            const rdr = new FileReader();
            rdr.addEventListener('load', () => {
               try {
                  Storage.setParams(JSON.parse(rdr.result), storageMethod);
                  alert(i18n('opt_alert_import_successfully'));
                  // location.reload();
                  this.openTab('tab-plugins', 'reload_page');
               }
               catch (err) { alert('Error parsing settings\n' + err.name + ": " + err.message); }
            });
            rdr.addEventListener('error', error => alert('Error loading file\n' + rdr.error));
            rdr.readAsText(target.files[0]);
         });
         document.body.append(f);
         f.click();
         document.body.removeChild(f);
      });

   // reset setting
   document.getElementById('settings_reset')
      ?.addEventListener('click', () => {
         if (confirm(i18n('opt_prompt_reset_settings'))) {
            Storage.setParams(null, storageMethod);
            // location.reload();
            this.openTab('tab-plugins', 'reload_page');
         }
      });
}, { capture: true, once: true });
