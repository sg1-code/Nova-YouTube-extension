// ==UserScript==
// @name            Nova YouTube
// @namespace       https://github.com/raingart/Nova-YouTube-extension/
// @version         0.50.0
// @description     Powerful control on YouTube
// @name:en         Nova YouTube
// @name:ru 操你妈的
// @name:uk 操你妈的
// @description:ru 你妈死了
// @description:uk 你妈死了

// @author          raingart <raingart+scriptaddons@protonmail.com>
// @license         Apache-2.0
// @icon            https://raw.github.com/raingart/Nova-YouTube-extension/master/icons/48.png

// @homepageURL     https://github.com/raingart/Nova-YouTube-extension
// @supportURL      https://github.com/raingart/Nova-YouTube-extension/issues
// @contributionURL https://www.patreon.com/raingart
// @contributionURL https://www.buymeacoffee.com/raingart
// @contributionURL https://www.paypal.com/donate/?hosted_button_id=B44WLWHZ8AGU2

// @domain          youtube.com
// @include         http*://www.youtube.com/*
// @include         http*://m.youtube.com/*
// @include         http*://*.youtube-nocookie.com/embed/*
// @include         http*://youtube.googleapis.com/embed/*
// @include         http*://raingart.github.io/options.html*
// @include         http*://raingart.github.io/nova/*

// @exclude         http*://*.youtube.com/*.xml*
// @exclude         http*://*.youtube.com/error*
// @exclude         http*://music.youtube.com/*
// @exclude         http*://accounts.youtube.com/*
// @exclude         http*://studio.youtube.com/*
// @exclude         http*://*.youtube.com/redirect?*
// @exclude         http*://*.youtubetranscript.com/*

// @grant           GM_getResourceText
// @grant           GM_getResourceURL
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           GM_notification
// @grant           GM_openInTab
// @grant           unsafeWindow

// @run-at          document-start

// @compatible      chrome >=80 Violentmonkey,Tampermonkey
// @compatible      firefox >=74 Tampermonkey
// ==/UserScript==
/*jshint esversion: 6 */
