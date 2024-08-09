// for test
// https://www.youtube.com/watch?v=dQw4w9WgXcQ - too many comments
// https://www.youtube.com/watch?v=kXYiU_JCYtU - too many comments
// https://www.youtube.com/watch?v=hWozHt9wbO4 - many comments
// https://www.youtube.com/watch?v=jQNeYbBiCKw - many comments
// https://www.youtube.com/watch?v=FNez9XBzTQI - [403] The video identified by the \u003ccode\u003e\u003ca href=\"/youtube/v3/docs/commentThreads/list#videoId\"\u003evideoId\u003c/a\u003e\u003c/code\u003e parameter has disabled comments.

// https://www.youtube.com/watch?v=lP4djyHSzzg - min test

// https://www.youtube.com/watch?v=zEE4aAMbD5I&lc=Ugz7num8lktTuHRbFNp4AaABAg- paid comment. There is no way to determine this type

window.nova_plugins.push({
   id: 'comments-sort',
   title: 'Comments sort',
   'title:zh': '评论排序',
   'title:ja': 'コメントの並べ替え',
   // 'title:ko': '댓글 정렬',
   // 'title:vi': '',
   // 'title:id': 'Mengurutkan komentar',
   // 'title:es': 'Clasificación de comentarios',
   // 'title:pt': 'classificação de comentários',
   // 'title:fr': 'Tri des commentaires',
   // 'title:it': 'Ordinamento dei commenti',
   // 'title:tr': '',
   // 'title:de': 'Kommentare sortieren',
   'title:pl': 'Sortowanie komentarzy',
   // 'title:ua': 'Сортування коментарів',
   run_on_pages: 'watch, embed, -mobile',
   // restart_on_location_change: true,
   section: 'comments',
   opt_api_key_warn: true,
   desc: 'add modal',
   // 'desc:zh': '',
   // 'desc:ja': '',
   // 'desc:ko': '',
   // 'desc:vi': '',
   // 'desc:id': '',
   // 'desc:es': '',
   // 'desc:pt': '',
   // 'desc:fr': '',
   // 'desc:it': '',
   // 'desc:tr': '',
   // 'desc:de': '',
   // 'desc:pl': '',
   // 'desc:ua': 'Додати спосіб подання',
   _runtime: user_settings => {

      // alt1 - https://github.com/sonigy/YCS
      // alt2 - https://github.com/pancevac/ytsc-extension
      // alt3 - https://github.com/FreeTubeApp/yt-comment-scraper

      // return comment username
      // alt1 - https://github.com/yakisova41/return-youtube-comment-username
      // alt2 - https://greasyfork.org/en/scripts/492172-youtube-comment-username-reveals

      // alt1 - https://greasyfork.org/en/scripts/11057-block-youtube-users
      // alt2 - https://greasyfork.org/en/scripts/500798-youtube-filter-channel-comment-video

      // #comments #contents #submessage[is-empty] - "Comments are turned off."

      // exclude (Width < 700px)
      if (NOVA.currentPage == 'embed' && window.innerWidth < 700) return;

      const
         MAX_COMMENTS = (user_settings['user-api-key'] && +user_settings.comments_sort_max) || 250, // no API key limit comments
         BTN_CLASS_NAME = 'nova-comments-sort',
         // CACHE_PREFIX = 'nova-channel-videos-count:',
         MODAL_NAME_SELECTOR_ID = 'nova-modal-comments',
         MODAL_CONTENT_SELECTOR_ID = 'modal-content',
         NOVA_REPLYS_SELECTOR_ID = 'nova-replys',
         NOVA_REPLYS_SWITCH_CLASS_NAME = NOVA_REPLYS_SELECTOR_ID + '-switch',
         // textarea to array
         BLOCK_KEYWORDS = NOVA.strToArray(user_settings.comments_sort_blocklist?.toLowerCase());
      // getCacheName = () => CACHE_PREFIX + ':' + (NOVA.queryURL.get('v') || movie_player.getVideoData().video_id);

      insertButton();

      function insertButton() {
         NOVA.waitSelector(getParentSelector())
            .then(menu => {
               // [data-open-modal="nova-modal-comments"]
               const btn = document.createElement('span');
               btn.className = BTN_CLASS_NAME;
               btn.setAttribute('data-open-modal', MODAL_NAME_SELECTOR_ID);
               btn.title = 'Nova comments';
               // btn.textContent = '►';
               // btn.innerHTML = NOVA.createSafeHTML(
               //    `<svg width="100%" height="100%" viewBox="0 0 121.86 122.88">
               //       <title>Nova comments</title>
               //       <g fill="currentColor">
               //          <path d="M30.28,110.09,49.37,91.78A3.84,3.84,0,0,1,52,90.72h60a2.15,2.15,0,0,0,2.16-2.16V9.82a2.16,2.16,0,0,0-.64-1.52A2.19,2.19,0,0,0,112,7.66H9.82A2.24,2.24,0,0,0,7.65,9.82V88.55a2.19,2.19,0,0,0,2.17,2.16H26.46a3.83,3.83,0,0,1,3.82,3.83v15.55ZM28.45,63.56a3.83,3.83,0,1,1,0-7.66h53a3.83,3.83,0,0,1,0,7.66Zm0-24.86a3.83,3.83,0,1,1,0-7.65h65a3.83,3.83,0,0,1,0,7.65ZM53.54,98.36,29.27,121.64a3.82,3.82,0,0,1-6.64-2.59V98.36H9.82A9.87,9.87,0,0,1,0,88.55V9.82A9.9,9.9,0,0,1,9.82,0H112a9.87,9.87,0,0,1,9.82,9.82V88.55A9.85,9.85,0,0,1,112,98.36Z" />
               //       </g>
               //    </svg>`);
               // fix - This document requires 'TrustedHTML' assignment.
               btn.append((function createSvgIcon() {
                  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  svg.setAttribute('width', '100%');
                  svg.setAttribute('height', '100%');
                  svg.setAttribute('viewBox', '0 0 121.86 122.88');

                  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  g.setAttribute('fill', 'currentColor');

                  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  path.setAttribute('d', 'M30.28,110.09,49.37,91.78A3.84,3.84,0,0,1,52,90.72h60a2.15,2.15,0,0,0,2.16-2.16V9.82a2.16,2.16,0,0,0-.64-1.52A2.19,2.19,0,0,0,112,7.66H9.82A2.24,2.24,0,0,0,7.65,9.82V88.55a2.19,2.19,0,0,0,2.17,2.16H26.46a3.83,3.83,0,0,1,3.82,3.83v15.55ZM28.45,63.56a3.83,3.83,0,1,1,0-7.66h53a3.83,3.83,0,0,1,0,7.66Zm0-24.86a3.83,3.83,0,1,1,0-7.65h65a3.83,3.83,0,0,1,0,7.65ZM53.54,98.36,29.27,121.64a3.82,3.82,0,0,1-6.64-2.59V98.36H9.82A9.87,9.87,0,0,1,0,88.55V9.82A9.9,9.9,0,0,1,9.82,0H112a9.87,9.87,0,0,1,9.82,9.82V88.55A9.85,9.85,0,0,1,112,98.36Z');

                  g.append(path);
                  svg.append(g);

                  return svg;
               })());

               btn.addEventListener('click', evt => {
                  evt.preventDefault();
                  evt.stopPropagation();
                  evt.stopImmediatePropagation();
                  // once if not inited
                  if (!document.body.querySelector(`#${MODAL_CONTENT_SELECTOR_ID} table`)) {
                     getComments();
                     // eventListenerPatchTimeLink();
                  }
                  btn.dispatchEvent(new CustomEvent(MODAL_NAME_SELECTOR_ID, { bubbles: true, detail: 'test' }));
               }, { capture: true });

               // append css
               // Object.assign(btn.style,
               //    (user_settings['comments-dropdown'] && user_settings['header-unfixed'])
               //       ? {
               //          /*transform: rotate(-90deg) translateX(-100%);*/
               //          position: 'fixed',
               //          right: '0',
               //          top: 'var(--ytd-masthead-height)',
               //          // right: '1em',
               //          visibility: 'visible',
               //          'z-index': 1 + Math.max(
               //             // getComputedStyle(menu)['z-index'],
               //             // NOVA.css.get('yt-live-chat-app', 'z-index'),
               //             NOVA.css.get('.ytp-chrome-top', 'z-index'),
               //             60),
               //          // 'font-size': '18px',
               //          height: '18px',
               //       }
               //       : {
               //          // 'font-size': '24px',
               //          height: '22px',
               //          'text-decoration': 'none',
               //          padding: '0 10px',
               //          'background-color': 'transparent',
               //          border: 'none',
               //       },
               //    // common
               //    // {
               //    //    color: 'var(--yt-spec-text-primary, orange)',
               //    //    cursor: 'pointer',
               //    // }
               // );

               user_settings['comments-dropdown']
                  ? menu.append(btn)
                  : menu.prepend(btn);

               // if #page-manager #owner
               // menu.append(btn);

               insertModal();

               prepareModal();
               // clear table after page transition
               // NOVA.runOnPageLoad(() => {
               document.addEventListener('yt-navigate-start', () => {
                  if (NOVA.currentPage == 'watch') {
                     prepareModal();
                     btn.style.display = null;
                  }
                  else {
                     btn.style.display = 'none';
                  }
               });

               function prepareModal() {
                  // document.getElementById(MODAL_CONTENT_SELECTOR_ID).innerHTML = NOVA.createSafeHTML('<pre>Loading data...</pre>');
                  const pre = document.createElement('pre');
                  pre.textContent = 'Loading data...';
                  document.getElementById(MODAL_CONTENT_SELECTOR_ID)?.append(pre);
               }

            });

         function getParentSelector() {
            let css = '', out;

            switch (NOVA.currentPage) {
               case 'watch':
                  // out = (user_settings['comments-dropdown'] || user_settings['header-unfixed'])
                  // ? '#comments ytd-comments-header-renderer #title'
                  // : '#masthead-container #end';
                  out = '#masthead-container #end';
                  css = 'padding: 1em; height: 2em;';
                  break;

               case 'embed':
                  out = '.ytp-chrome-top-buttons';
                  css = 'float: left; padding: 20px;';
                  break;
            }

            NOVA.css.push(
               `.${BTN_CLASS_NAME} {
                  color: var(--yt-spec-text-primary, orange);
                  cursor: pointer;
                  height: 3em;
                  ${css};
               }
               .${BTN_CLASS_NAME}:hover {
                 color: deepskyblue;
               }`);

            return out;
         }
      }

      let commentList = [];

      function getComments(next_page_token) {
         // console.debug('genTable:', ...arguments);
         // const channelId = NOVA.getChannelId(user_settings['user-api-key']);
         // if (!channelId) return console.error('genTable channelId: empty', channelId);

         // has in cache
         // if (storage = sessionStorage.getItem(CACHE_PREFIX + channelId)) {
         //    insertToHTML({ 'text': storage, 'container': container });

         // } else {

         // https://developers.google.com/youtube/v3/docs/commentThreads/list?apix_params=%7B%22part%22%3A%5B%22snippet%22%5D%2C%22textFormat%22%3A%22plainText%22%2C%22videoId%22%3A%228Pnlm1Ky_sA%22%7D

         // https://www.googleapis.com/youtube/v3/commentThreads?key={your_api_key}&textFormat=plainText&part=snippet&videoId={video_id}&part=snippet&order=relevance&maxResults=5&pageToken={nextPageToken}

         // chunkArray(ids, YOUTUBE_API_MAX_IDS_PER_CALL)
         //    .forEach(id_part => {
         // console.debug('id_part', id_part);

         const params = {
            'videoId': NOVA.queryURL.get('v') || movie_player.getVideoData().video_id,
            'part': 'snippet,replies',
            'maxResults': Math.min(+user_settings.comments_sort_max || 100, 100), // API max limit 100
            'order': 'relevance', // 'time',
         };

         if (next_page_token) {
            params['pageToken'] = next_page_token;
         }

         NOVA.request.API({
            request: 'commentThreads',
            params: params,
            api_key: user_settings['user-api-key'],
         })
            .then(res => {
               if (res?.error) {
                  // alert message
                  if (res.reason) {
                     document.getElementById(MODAL_NAME_SELECTOR_ID)
                        .dispatchEvent(new CustomEvent(MODAL_NAME_SELECTOR_ID, { bubbles: true, detail: 'test' }));
                     return alert(`Error [${res.code}]: ${res.reason}`);
                  }
                  // modal message
                  else {
                     return document.getElementById(MODAL_CONTENT_SELECTOR_ID).innerHTML = NOVA.createSafeHTML(
                        `<pre>Error [${res.code}]: ${res.reason}</pre>
                        <pre>${res.error}</pre>`);
                  }
               }

               res?.items?.forEach(item => {
                  if (comment = item.snippet?.topLevelComment?.snippet) {

                     // "id": "Ug...",
                     // {
                     //    "snippet": {
                     //       "videoId": "xxx..",
                     //       "textDisplay": "text", // html inicode
                     //       "textOriginal": "text",
                     //       "authorDisplayName": "@usernick",
                     //       "authorProfileImageUrl": "https://yt3.ggpht.com/ytc/..",
                     //       "authorChannelUrl": "http://www.youtube.com/channel/UC1..",
                     //       "authorChannelId": { "value": "UC.." },
                     //       "canRate": true,
                     //       "viewerRating": "none",
                     //       "likeCount": 5,
                     //       "publishedAt": "2022-01-01T01:23:00Z",
                     //       "updatedAt": "2022-01-01T01:23:00Z"
                     //    },
                     // "canReply": true,
                     // "totalReplyCount": 7,
                     // "isPublic": true
                     // }
                     // save cache in tabs
                     // sessionStorage.setItem(CACHE_PREFIX + channelId, videoCount);
                     commentList.push(
                        Object.assign(
                           { 'totalReplyCount': item.snippet.totalReplyCount },
                           { 'id': item.id },
                           comment,
                           item.replies,
                        )
                     );
                  }
                  else {
                     console.warn('API is change', item);
                  }
               });

               // no API key limit comments
               if (commentList.length >= MAX_COMMENTS) {
                  // const msgMaxComments = `Use your personal API key to overcome the ${MAX_COMMENTS} comments limit`;
                  // // NOVA.uiAlert(msgMaxComments);
                  // alert(msgMaxComments);
                  // console.warn(msgMaxComments);
                  genTable();
               }
               // get next page
               // else if ((res?.nextPageToken && (commentList.length % 1000) !== 0)
               //    || ((commentList.length % 1000) === 0 && confirm(`Continue downloading?`)) // message every multiple of 1000 comments
               // ) {
               else if (res?.nextPageToken) {
                  // display current download status
                  document.getElementById(MODAL_CONTENT_SELECTOR_ID).innerHTML = NOVA.createSafeHTML(`<pre>Loading: ${commentList.length + (user_settings['user-api-key'] ? '' : '/' + MAX_COMMENTS)}</pre>`);

                  getComments(res?.nextPageToken);
               }
               // pages are over
               else {
                  // console.debug('>', res);
                  genTable();
               }
            });
      }

      function genTable() {
         if (!commentList.length) {
            return document.getElementById(MODAL_CONTENT_SELECTOR_ID).innerHTML = NOVA.createSafeHTML(`<pre>Comments empty</pre>`);
         }

         const ul = document.createElement('tbody');

         // @channelA
         const channelName = (href = document.body.querySelector('#owner #upload-info #channel-name a[href]')?.href) && new URL(href).pathname;

         commentList
            .sort((a, b) => b.likeCount - a.likeCount) // default sorting by number of likes
            .forEach(comment => {
               try {
                  if (!(comment.textDisplay = filterStr(comment.textDisplay, comment.authorDisplayName))) return; // continue

                  // the word is too long
                  if (comment.textOriginal.length > 100 && comment.textOriginal.split(' ')?.some(word => word.length > 100)) {
                     console.debug('comment istoo long:\n', comment.textOriginal);
                     return;
                  }

                  const
                     replyInputName = `${NOVA_REPLYS_SELECTOR_ID}-${comment.id}`,
                     li = document.createElement('tr');

                  let replyCount = 0;

                  li.className = 'item';
                  // isAuthor
                  if (channelName && comment.authorChannelUrl.includes(channelName)) li.classList.add('author');

                  // invalid time "updatedAt" - https://www.youtube.com/watch?v=1RjnI64Rwqs&lc=Uggcg-Z0w-cmRXgCoAEC

                  li.innerHTML = NOVA.createSafeHTML(
                     `<td>${comment.likeCount}</td>
                     <td sorttable_customkey="${comment.totalReplyCount}" class="${NOVA_REPLYS_SWITCH_CLASS_NAME}">
                     ${comment.comments?.length
                        ? `<a href="https://www.youtube.com/watch?v=${comment.videoId}&lc=${comment.id}" target="_blank" title="Open comment link">${comment.totalReplyCount}</a> <label for="${replyInputName}"></label>`
                        : ''}</td>
                     <td sorttable_customkey="${new Date(comment.publishedAt).getTime()}">${NOVA.formatTimeOut.ago(new Date(comment.publishedAt))}</td>
                     <td>
                        <a href="${comment.authorChannelUrl}" target="_blank" title="${comment.authorDisplayName}">
                           <img src="${comment.authorProfileImageUrl}" alt="${comment.authorDisplayName}" />
                        </a>
                     </td>
                     <td sorttable_customkey="${comment.textOriginal.length}">
                        <span class="text-overflow-dynamic-ellipsis">${comment.textDisplay}</span>
                        ${appendReplies()?.outerHTML || ''}
                     </td>`);
                  // fix - This document requires 'TrustedHTML' assignment.
                  // function createCommentCell(text, sortKey) {
                  //    const td = document.createElement('td');
                  //    td.textContent = text;
                  //    if (sortKey) {
                  //       td.setAttribute('sorttable_customkey', sortKey);
                  //    }
                  //    return td;
                  // }

                  // function createCommentLinkCell(comment, replyInputName) {
                  //    const td = document.createElement('td');
                  //    td.classList.add(NOVA_REPLYS_SWITCH_CLASS_NAME);

                  //    if (comment.comments?.length) {
                  //       const link = document.createElement('a');
                  //       link.href = `https://www.youtube.com/watch?v=${comment.videoId}&lc=${comment.id}`;
                  //       link.target = '_blank';
                  //       link.title = 'Open comment link';
                  //       link.textContent = comment.totalReplyCount;

                  //       const label = document.createElement('label');
                  //       label.htmlFor = replyInputName;

                  //       td.append(link);
                  //       td.append(label);
                  //    }

                  //    return td;
                  // }

                  // function createCommentDateCell(comment) {
                  //    const td = document.createElement('td');
                  //    td.setAttribute('sorttable_customkey', new Date(comment.publishedAt).getTime());
                  //    td.textContent = NOVA.formatTimeOut.ago(new Date(comment.publishedAt));
                  //    return td;
                  // }

                  // function createCommentAuthorCell(comment) {
                  //    const td = document.createElement('td');
                  //    const link = document.createElement('a');
                  //    link.href = comment.authorChannelUrl;
                  //    link.target = '_blank';
                  //    link.title = comment.authorDisplayName;

                  //    const img = document.createElement('img');
                  //    img.src = comment.authorProfileImageUrl;
                  //    img.alt = comment.authorDisplayName;

                  //    link.append(img);
                  //    return td.appendChild(link);
                  // }

                  // function createCommentTextCell(comment) {
                  //    const td = document.createElement('td');
                  //    const span = document.createElement('span');
                  //    span.classList.add('text-overflow-dynamic-ellipsis');
                  //    span.textContent = comment.textDisplay;

                  //    td.append(span);
                  //    // Assuming appendReplies() creates content
                  //    if (repliesDom = appendReplies()) td.append(repliesDom);

                  //    return td;
                  // }

                  // const likeCountCell = createCommentCell(comment.likeCount);
                  // const replyCountCell = createCommentLinkCell(comment, replyInputName);
                  // const dateCell = createCommentDateCell(comment);
                  // const authorCell = createCommentAuthorCell(comment);
                  // const textCell = createCommentTextCell(comment);

                  // li.append(likeCountCell);
                  // li.append(replyCountCell);
                  // li.append(dateCell);
                  // li.append(authorCell);
                  // li.append(textCell);
                  // end fix - This document requires 'TrustedHTML' assignment.

                  ul.append(li);

                  // checkbox reply show
                  // if (+comment.totalReplyCount) {
                  if (replyCount) {
                     const checkbox = document.createElement('input');
                     checkbox.type = 'checkbox';
                     checkbox.id = checkbox.name = replyInputName;
                     checkbox.addEventListener('change', ({ target }) => {
                        // console.debug('change', target, 'name:', target.name);
                        document.body.querySelector(`table[${NOVA_REPLYS_SELECTOR_ID}="${target.name}"]`)
                           .classList.toggle('nova-hide');
                     });
                     li.querySelector('td label[for]')
                        ?.before(checkbox);
                     // ?.append(checkbox);
                  }

                  createReplyItem
                  function appendReplies() {
                     if (!+comment.totalReplyCount) return '';

                     const table = document.createElement('table');
                     table.className = 'nova-hide';
                     table.setAttribute(NOVA_REPLYS_SELECTOR_ID, replyInputName); // mark
                     // replies
                     comment.comments
                        // ?.reverse() // order by
                        ?.forEach(reply => {
                           if (!(reply.snippet.textDisplay = filterStr(reply.snippet.textDisplay, reply.snippet.authorDisplayName))) return; // continue

                           replyCount++;

                           const li = document.createElement('tr');
                           // li.className = 'item';
                           // isAuthor
                           if (channelName && reply.snippet.authorChannelUrl.includes(channelName)) li.classList.add('author');
                           // Solution 1
                           // li.innerHTML = NOVA.createSafeHTML(
                           //    `<td>
                           //       <a href="${reply.snippet.authorChannelUrl}" target="_blank" title="${reply.snippet.authorDisplayName}">
                           //          <img src="${reply.snippet.authorProfileImageUrl}" alt="${reply.snippet.authorDisplayName}" />
                           //       </a>
                           //    </td>
                           //    <td>
                           //       <span class="text-overflow-dynamic-ellipsis">
                           //          <div class="nova-reply-time-text">${reply.snippet.likeCount
                           //       ? `${reply.snippet.likeCount} likes` : ''}</div>
                           //          <div>${reply.snippet.textDisplay}</div>
                           //       </span>
                           //    </td>`);
                           // Solution 2
                           const authorCell = document.createElement('td');
                           const authorLink = document.createElement('a');
                           authorLink.href = reply.snippet.authorChannelUrl;
                           authorLink.target = '_blank';
                           authorLink.title = reply.snippet.authorDisplayName;

                           const authorImage = document.createElement('img');
                           authorImage.src = reply.snippet.authorProfileImageUrl;
                           authorImage.alt = reply.snippet.authorDisplayName;

                           authorLink.append(authorImage);
                           authorCell.append(authorLink);

                           const contentCell = document.createElement('td');
                           const containerReply = document.createElement('span');
                           containerReply.className = 'text-overflow-dynamic-ellipsis';

                           const likeCountDiv = document.createElement('div');
                           likeCountDiv.className = 'nova-reply-time-text';
                           likeCountDiv.textContent = reply.snippet.likeCount ? `${reply.snippet.likeCount} likes` : '';

                           const replyText = document.createElement('div');
                           // Atention: broken <br> tag.
                           // fix - This document requires 'TrustedHTML' assignment.
                           replyText.innerHTML = NOVA.createSafeHTML(reply.snippet.textDisplay);

                           containerReply.append(likeCountDiv);
                           containerReply.append(replyText);
                           contentCell.append(containerReply);

                           li.append(authorCell);
                           li.append(contentCell);

                           table.append(li); // append
                        });
                     return table;
                  }

               } catch (error) {
                  console.error('Error comment generate:\n', error.stack + '\n', comment);
                  // alert('Error comment generate\n' + comment);
               }
            });

         function filterStr(str, user) {
            // alt - https://greasyfork.org/en/scripts/481131-youtube-comment-sponsor-blocker
            if (keyword = BLOCK_KEYWORDS?.find(keyword => ((user && keyword?.startsWith('@')) ? user : str)
               .toLowerCase().includes(keyword))
            ) {
               console.log('comment filter:', `"${keyword}\n"`, str.replace(keyword, `[${keyword}]`));
               return;
            }

            const countWords = (str = '') => str.trim().split(/\s+/).length,
               clearOfEmoji = str => str
                  // for test test 'a1^€$❤️🧠🦄🦊🥦►•●-–—🔺'
                  // .replace(/[\u2011-\u26FF]/g, ' ') // Symbols. remove "€" sign
                  .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, ' ') // Symbols
                  .replace(/(?![*#0-9]+)[\p{Emoji}]/gu, ' ') // Emoji
                  // .replace(/[^<>=\p{L}\p{N}\p{P}\p{Z}{\^\$€}]/gu, ' ') // Emoji
                  .replace(/([=:;/.()]{2,}|\))$/g, ' ') // ANSII smile at the end of the line
                  .replace(/\s{2,}/g, ' ') // multi-spacebar
                  .replace(/(<br>){3,}/g, '<br><br>')
                  .replace(/<a[^>]+><\/a>/g, '') // empty links
                  .trim();

            // filter comments
            if (user_settings.comments_sort_clear_emoji) {
               str = clearOfEmoji(str); // comment.textOriginal

               // skip empty after clear
               if (!str.length) return;

               if (+user_settings.comments_sort_min_words
                  && countWords(str) <= +user_settings.comments_sort_min_words
               ) {
                  // console.debug('filter comment (by min words):', str);
                  return;
               }
            }

            return str;
         }


         // render table
         const MODAL_CONTENT_FILTER_SELECTOR_ID = 'nova-search-comment';
         document.getElementById(MODAL_CONTENT_SELECTOR_ID).innerHTML = NOVA.createSafeHTML(
            `<table class="sortable" border="0" cellspacing="0" cellpadding="0">
               <thead id="${MODAL_CONTENT_FILTER_SELECTOR_ID}">
                  <tr>
                     <th class="sorttable_numeric">likes</th>
                     <th class="sorttable_numeric">replys</th>
                     <th class="sorttable_numeric">date</th>
                     <th class="sorttable_nosort">avatar</th>
                     <th class="sorttable_numeric">comments (${commentList.length/*res.pageInfo.totalResults*/})</th>
                  </tr>
               </thead>
               <!-- $ {ul.innerHTML} -->
            </table>`);

         // fix - This document requires 'TrustedHTML' assignment.
         // const table = document.createElement('table');
         // table.className = 'sortable';
         // table.border = '0';
         // table.cellSpacing = '0';
         // table.cellPadding = '0';

         // const thead = document.createElement('thead');
         // thead.id = MODAL_CONTENT_FILTER_SELECTOR_ID;

         // const headerRow = document.createElement('tr');

         // // Create and append th elements for each column
         // const thLikes = document.createElement('th');
         // thLikes.className = 'sorttable_numeric';
         // thLikes.textContent = 'likes';
         // headerRow.append(thLikes);

         // const thReplys = document.createElement('th');
         // // thReplys.classList.add('sorttable_numeric');
         // thReplys.textContent = 'replys';
         // headerRow.append(thReplys);

         // const thDate = document.createElement('th');
         // thDate.className = 'sorttable_numeric';
         // thDate.textContent = 'date';
         // headerRow.append(thDate);

         // const thAvatar = document.createElement('th');
         // thAvatar.className = 'sorttable_nosort';
         // thAvatar.textContent = 'avatar';
         // headerRow.append(thAvatar);

         // const thComment = document.createElement('th');
         // thComment.className = 'sorttable_numeric';
         // thComment.textContent = `comments (${commentList.length/*res.pageInfo.totalResults*/})`;
         // headerRow.append(thComment);

         // thead.append(headerRow);
         // table.append(thead);

         // // Append the table body content (ul.innerHTML) here

         // document.getElementById(MODAL_CONTENT_SELECTOR_ID).textContent = '';
         // document.getElementById(MODAL_CONTENT_SELECTOR_ID).append(table);
         // end fix - This document requires 'TrustedHTML' assignment.

         document.getElementById(MODAL_CONTENT_FILTER_SELECTOR_ID).after(ul); /*$ {ul.innerHTML}*/

         // add sort event
         // connectSortable().makeSortable(document.body.querySelector('table.sortable'));
         connectSortable.apply(this).makeSortable(document.body.querySelector('table.sortable'));

         // scroll to top on sorting
         // document.body.querySelector(`#${MODAL_CONTENT_SELECTOR_ID} table.sortable thead`)
         document.body.querySelector(`table.sortable thead`)
            .addEventListener('click', ({ target }) => {
               if (['input', 'textarea', 'select'].includes(target.localName) || target.isContentEditable) return;

               // new MutationObserver((mutationRecordsArray, observer) => {
               //    mutationRecordsArray.forEach(mutation => {
               //       // const { target } = mutation;
               //       // .sorttable_sorted OR .sorttable_sorted_reverse
               //       if (mutation.attributeName === 'class') {
               //          observer.disconnect();
               //          if (containerScroll = document.body.querySelector('.modal-container')) containerScroll.scrollTop = 0;
               //          // mutation.target.classList.contains('is-busy')
               //       }
               //    });
               // })
               //    .observe(target, {
               //       attributes: true,
               //       attributeFilter: ['class']
               //    });
               // scroll to top after sorted
               if (containerScroll = document.body.querySelector('.modal-container')) containerScroll.scrollTop = 0;
            });

         insertFilterInput(MODAL_CONTENT_FILTER_SELECTOR_ID);

         // replies
         NOVA.css.push(
            `.nova-hide {
               display: none;
            }
            table[${NOVA_REPLYS_SELECTOR_ID}] {
               border: 1px solid #444;
               width: auto !important;
            }
            table[${NOVA_REPLYS_SELECTOR_ID}] td {
               padding: auto 10px;
            }
            .nova-reply-time-text {
               font-size: .5em;
               font-style: italic;
            }

            /* replies checkbox */
            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox] {
               --height: 1.5em;
               --disabled-opacity: .7;

               background-color: var(--dark-theme-divider-color);
               color: var(--dark-theme-text-color);
               --off-hover-bg: var(--light-theme-secondary-color, deepskyblue, greenyellow);
               /* --checked-bg: #188cc3;
               --checked-bg: #ff691c; */
               --checked-bg: #e85717;
               --checked-bg-active: var(--dark-theme-divider-color);
               --checked-color: var(--dark-theme-text-color);

               --text-on: 'HIDE';
               --text-on-press: 'SHOW';
               /* --text-on: attr(text-on); */
               --text-off: 'ANS';
               --text-off-press: 'HIDE?';
               /* --text-on: attr(text-off); */

               appearance: none;
               -webkit-appearance: none;
               position: relative;
               cursor: pointer;
               outline: 0;
               border: none;
               overflow: hidden;

               -webkit-user-select: none;
               -moz-user-select: none;
               -ms-user-select: none;
               user-select: none;
               -webkit-backface-visibility: hidden;
               backface-visibility: hidden;
               /* box-shadow: none !important; */

               /* transform: skew(-10deg); */
               font-size: 1em;
               width: 4em;
               height: 1.7em;
               font-weight: bold;
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:hover:before {
               background-color: var(--off-hover-bg);
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:after,
            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:before {
               position: absolute;
               transition: left 200ms ease-in-out;
               width: 100%;
               line-height: 1.8em;
               text-align: center;
               /* box-shadow: 0 0 .25em rgba(0, 0, 0, .3); */
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:after {
               left: 100%;
               content: var(--text-on);
               font-weight: bold;
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:before {
               left: 0;
               content: var(--text-off);
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:active {
               /* line on press */
               background-color: var(--checked-bg);
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:active:before {
               left: -10%;
               content: var(--text-on-press);
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:checked {
               color: var(--checked-color);
               background-color: var(--checked-bg);
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:checked:before {
               left: -100%;
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:checked:after {
               left: 0;
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox]:checked:active:after {
               left: 10%;
               content: var(--text-off-press);
               background-color: var(--checked-bg-active);
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox] [disabled] {
               cursor: not-allowed;
            }

            .${NOVA_REPLYS_SWITCH_CLASS_NAME} input[type=checkbox] [disabled] {
               opacity: var(--disabled-opacity);
            }
            `);
      }

      // copy fn from [redirect-disable] plugin
      // function eventListenerPatchTimeLink() {
      //    document.addEventListener('click', ({ target }) => patchLink(target), { capture: true });
      //    // mouse middle click
      //    document.addEventListener('auxclick', evt => evt.button === 1 && patchLink(evt.target), { capture: true });

      //    function patchLink(target = required()) {
      //       // https://www.youtube.com/watch?v=VIDEO_ID&t=0m42s
      //       const linkSelector = 'a[href*="&t="]';

      //       if (!target.matches(linkSelector)) {
      //          if (!(target = target.closest(linkSelector))) return;
      //       }

      //       if (t = NOVA.queryURL.get('t', target.href)) {
      //          // '10m42s' > '10:42' > '642'
      //          t = Math.trunc(NOVA.formatTimeOut.hmsToSec(t.replace(/m/, ':').replace(/s$/, '')));

      //          target.href = NOVA.queryURL.set({ 't': t + 's' }, target.href);
      //          NOVA.updateUrl(NOVA.queryURL.set({ 't': t + 's' }, target.href));
      //          // alert(target.href);
      //       }
      //    }
      // }

      function insertFilterInput(parent_selector_id = required()) {
         if (typeof parent_selector_id !== 'string') {
            return console.error('typeof "parent_selector_id":', (typeof parent_selector_id));
         }

         NOVA.css.push(
            `#${parent_selector_id} input {
              position: absolute;
              top: 0;
              right: 0;

              /* border: 1px solid var(--ytd-searchbox-border-color);
              background-color: var(--ytd-searchbox-background);
              color: var(--ytd-searchbox-text-color); */

              height: 100%;
            }

            #${parent_selector_id} input[type=search]:focus,
            #${parent_selector_id} input[type=text]:focus {
               outline: 1px solid #00b7fc;
            }
            .nova-mark-text {
               background-color: #ff0;
               background-color: mark;

               /* outline: 2px dashed rgba(255, 127, 127, 0.8);
               background-color: transparent;
               color: inherit;*/
            }`);

         const searchInput = document.createElement('input');
         searchInput.setAttribute('type', 'search');
         searchInput.setAttribute('placeholder', 'Filter');
         // Object.assign(searchInput.style, {
         //    padding: '.4em .6em',
         //    // border: 0,
         //    // 'border-radius': '4px',
         //    'margin-bottom': '1.5em',
         // });

         ['change', 'keyup'].forEach(evt => {
            searchInput
               .addEventListener(evt, function () {
                  NOVA.searchFilterHTML({
                     'keyword': this.value,
                     'filter_selectors': 'tr.item',
                     'highlight_selector': '.text-overflow-dynamic-ellipsis',
                     'highlight_class': 'nova-mark-text',
                  });
               });
            searchInput
               .addEventListener('click', () => {
                  searchInput.value = '';
                  searchInput.dispatchEvent(new Event('change')); // run searchFilterHTML
               });
         });

         document.getElementById(parent_selector_id).append(searchInput);
         // return searchInput;
      };

      function insertModal() {
         NOVA.css.push(
            `.modal {
               --animation-time: .2s;

               z-index: 9999;
               position: fixed;
               top: 0;
               left: 0;
               background-color: rgba(0, 0, 0, .8);
               display: flex;
               align-items: center;
               justify-content: center;

               width: 100%;
               height: 100%;

               box-sizing: border-box;

               visibility: hidden;
               opacity: 0;

               /*transition:
                  visibility 100ms linear,
                  opacity 100ms ease-out;*/
            }

            .modal.modal-visible {
               animation: microModalFadeIn var(--animation-time) cubic-bezier(0, 0, .2, 1);
               backdrop-filter: blur(1em);
               visibility: visible;
               opacity: 1;
            }

            @keyframes microModalFadeIn {
               from { opacity: 0; }
               to { opacity: 1; }
            }

            .modal-container {
               border-radius: 4px;
               /* background-color: silver; */
               border: 1px solid #222;

               position: relative;
               display: flex;
               box-sizing: border-box;
               overflow-y: auto;
               max-width: ${(NOVA.currentPage == 'embed' ? 95 : 70)}%;
               max-height: 100vh;

               transform: scale(0.9);
               transition: scale var(--animation-time) ease-out;
            }

            .modal.modal-visible .modal-container {
               transform: scale(1);
            }

            .modal-close {
               position: absolute;
               top: 0;
               right: 0;
               cursor: pointer;
               font-size: 2em;
               padding: 0 5px;
               transition: background-color var(--animation-time) ease-out;
            }

            /* .modal-close { content: "\\2715"; } */

            .modal-close:hover {
               background-color: #ea3c3c;
            }

            .modal-content {
               padding: 2rem;
            }`);

         // custom style
         NOVA.css.push(
            `.modal {}

            .modal-container {
               /*--yt-spec-general-background-a: #181818;
               --yt-spec-general-background-b: #0f0f0f;
               --yt-spec-general-background-c: #030303;*/
               /* background-color: var(--yt-spec-brand-background-primary);
               background-color: var(--yt-spec-menu-background);
               background-color: var(--yt-spec-raised-background); */
               color: var(--yt-spec-text-primary);
            }

            .modal-content {
               font-size: 12px;
            }`);

         // html
         // document.body
         //    // document.getElementById('comments')
         //    // document.body.querySelector('ytd-app')
         //    .insertAdjacentHTML('beforeend', NOVA.createSafeHTML(
         //       `<div id="${MODAL_NAME_SELECTOR_ID}" class="modal" data-modal>
         //          <div class="modal-container">
         //             <div class="modal-close" data-close-modal>✕</div>

         //             <div class="modal-content" id="${MODAL_CONTENT_SELECTOR_ID}"></div>
         //          </div>
         //       </div>`));
         // fix - This document requires 'TrustedHTML' assignment.
         const modalContainer = document.createElement('div');
         modalContainer.id = MODAL_NAME_SELECTOR_ID;
         modalContainer.className = 'modal';
         modalContainer.setAttribute('data-modal', '');

         const modalClose = document.createElement('div');
         modalClose.className = 'modal-close';
         modalClose.setAttribute('data-close-modal', '');
         modalClose.textContent = '✕';

         const modalContent = document.createElement('div');
         modalContent.id = MODAL_CONTENT_SELECTOR_ID;
         modalContent.className = 'modal-content';

         const container = document.createElement('div');
         container.className = 'modal-container';
         container.append(modalClose);
         container.append(modalContent);

         modalContainer.append(container);

         document.body.append(modalContainer);

         // closeButton.innerHTML = NOVA.createSafeHTML(
         //    `<svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 384 512">
         //       <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
         //    </svg>`);

         // js
         // demo - https://www.cssscript.com/demo/lite-modal-javascript-library-modalite/
         // src - https://github.com/hdodov/modalite/blob/0f965bea481e1a6aefb4f272c50fece5a9836448/dist/modalite.js
         const modalShowClass = 'modal-visible';

         // addEventListener close modal
         document.getElementById(MODAL_NAME_SELECTOR_ID)
            .addEventListener('click', ({ target }) => {
               target.dispatchEvent(new CustomEvent(MODAL_NAME_SELECTOR_ID, { bubbles: true, detail: 'test' }));
            });

         document.addEventListener(MODAL_NAME_SELECTOR_ID, ({ target }) => {
            // console.debug('', evt.detail);
            const
               attrModal = target.hasAttribute('data-modal'),
               attrOpen = target.getAttribute('data-open-modal'),
               attrClose = target.hasAttribute('data-close-modal');

            // modal overlay
            if (attrModal) {
               target.classList.remove(modalShowClass);
            }
            // activate
            else if (attrOpen && (modal = document.getElementById(attrOpen))) {
               modal.classList.add(modalShowClass);
            }
            // close btn
            else if (attrClose && (modal = target.closest('[data-modal]'))) {
               modal.classList.remove(modalShowClass);
            }
         });
      }

      function connectSortable() {
         // https://www.kryogenix.org/code/browser/sorttable/

         // table
         NOVA.css.push(
            `table.sortable table {
               width: 100%;
            }

            /* fixed headers */
            table.sortable thead {
               position: sticky;
               top: 0px
            }

            table.sortable th {
               text-transform: uppercase;
               white-space: nowrap;
            }

            table.sortable th:not(.sorttable_nosort) {
               cursor: pointer;
            }

            table.sortable th:not(.sorttable_sorted):not(.sorttable_sorted_reverse):not(.sorttable_nosort):hover:after {
               position: absolute;
               content: " \\25B4\\25BE";
               /* content: " ▼"; */
               /* content: " ▽"; */
            }

            thead, th, td {
               text-align: center;
            }

            table tbody {
               counter-reset: sortabletablescope;
            }

            /* row count */
            /*table thead tr::before {
               content: '';
               display: table-cell;
            }

            table tbody tr::before {
               content: counter(sortabletablescope);
               counter-increment: sortabletablescope;
               display: table-cell;
            }

            table tbody tr:nth-child(odd) {}
            table tbody tr:nth-child(even) {} */`);

         // custom style
         NOVA.css.push(
            `#${MODAL_CONTENT_SELECTOR_ID} table {}

            #${MODAL_CONTENT_SELECTOR_ID} thead {
               background-color: #555;
               /* background-color: var(--yt-spec-text-secondary); */
               /* background-color: var(--yt-spec-outline); */
               z-index: 1;
            }

            #${MODAL_CONTENT_SELECTOR_ID} th {
               padding: 5px 3px;
               font-weight: 500;
            }

            #${MODAL_CONTENT_SELECTOR_ID} tr:nth-child(even) {
               background-color: var(--yt-spec-menu-background);
               background: color-mix(in srgb, currentColor 10%, transparent);
            }

            /*#${MODAL_CONTENT_SELECTOR_ID} td {
               border-bottom: 1px solid rgba(255,255,255,.1);
            }*/

            #${MODAL_CONTENT_SELECTOR_ID} td .text-overflow-dynamic-ellipsis {
               display: block;
               max-height: 25vh;
               overflow-y: auto;
               scrollbar-width: thin;
               text-align: left;
               font-size: 1.2em;
               line-height: 1.4;
               padding: 10px 5px;

               text-overflow: ellipsis;
               word-wrap: break-word;
            }

            #${MODAL_CONTENT_SELECTOR_ID} td .text-overflow-dynamic-ellipsis:hover{
               max-height: 55vh !important;
            }

            #${MODAL_CONTENT_SELECTOR_ID} tr.author { }

            #${MODAL_CONTENT_SELECTOR_ID} .author > td > .text-overflow-dynamic-ellipsis {
               background-color: rgba(0, 47, 144, .2);
            }

            #${MODAL_CONTENT_SELECTOR_ID} td a {
               text-decoration: none;
               color: var(--yt-spec-call-to-action);
            }`);

         // TODO add wait when sorting
         // document.body.querySelector('table.sortable').style.cursor = 'wait';
         // document.body.querySelector('table.sortable').style.removeProperty('cursor')

         // https://github.com/raingart/sorttable
         return sorttable = { selectorTables: "table.sortable", classSortBottom: "sortbottom", classNoSort: "sorttable_nosort", classSorted: "sorttable_sorted", classSortedReverse: "sorttable_sorted_reverse", idSorttableSortfwdind: "sorttable_sortfwdind", idSorttableSortfrevind: "sorttable_sortrevind", iconUp: "&nbsp;&#x25B4;", iconDown: "&nbsp;&#x25BE;", regexNonDecimal: /[^0-9\.\-]/g, regexTrim: /^\s+|\s+$/g, regexAnySorttableClass: /\bsorttable_([a-z0-9]+)\b/, init() { sorttable.init.done || (sorttable.init.done = !0, document.querySelectorAll(sorttable.selectorTables).forEach(sorttable.makeSortable)) }, innerSortFunction(t, e) { d("wait"); const o = this.classList.contains(sorttable.classSorted), s = this.classList.contains(sorttable.classSortedReverse); if (o || s) return sorttable.reverse(this.sorttable_tbody), c(this, s), void t.preventDefault(); const r = [], a = this.sorttable_columnindex, n = this.sorttable_tbody.rows; for (let t = 0; t < n.length; t++)r.push([sorttable.getInnerText(n[t].cells[a]), n[t]]); r.sort(this.sorttable_sortfunction), c(this, !0); const l = this.sorttable_tbody, i = document.createDocumentFragment(); for (let t = 0; t < r.length; t++)i.append(r[t][1]); function c(t, e) { const { id: o, icon: s } = e ? { id: sorttable.idSorttableSortfwdind, icon: sorttable.iconDown } : { id: sorttable.idSorttableSortfrevind, icon: sorttable.iconUp }; document.getElementById(sorttable.idSorttableSortfwdind)?.remove(), document.getElementById(sorttable.idSorttableSortfrevind)?.remove(); const r = document.createElement("span"); r.id = o, r.innerHTML = NOVA.createSafeHTML(s), t.append(r), t.classList.remove(sorttable.classSorted, sorttable.classSortedReverse), t.classList.add(e ? sorttable.classSorted : sorttable.classSortedReverse), d() } function d(t = null) { e.style.cursor = t } l.append(i), t.preventDefault() }, makeSortable(t) { if (!t.tHead) { const e = document.createElement("thead"); t.insertBefore(e, t.firstChild) } if (1 !== t.tHead.rows.length) return; const e = Array.from(t.rows).filter((t => t.classList.contains(sorttable.classSortBottom))); if (e.length) { let o = t.tFoot; o || (o = document.createElement("tfoot"), t.append(o)); const s = document.createDocumentFragment(); e.forEach((t => s.append(t))), o.append(s) } const o = t.tHead.rows[0].cells; for (let e = 0; e < o.length; e++) { const s = o[e]; if (!s.classList.contains(sorttable.classNoSort)) { const o = s.className.match(sorttable.regexAnySorttableClass)?.[1]; s.sorttable_sortfunction = o ? sorttable[`sort_${o}`] : sorttable.guessType(t, e), s.sorttable_columnindex = e, s.sorttable_tbody = t.tBodies[0] } } t.tHead.addEventListener("click", (e => { const o = e.target; "TH" !== o.tagName || o.classList.contains(sorttable.classNoSort) || sorttable.innerSortFunction.call(o, e, t) })) }, guessedTypesCache: new WeakMap, guessType(t, e) { const o = this.guessedTypesCache.get(t) || new Map; if (o.has(e)) return o.get(e); const s = []; for (let o = 0; o < t.rows.length; o++) { const r = t.rows[o].cells[e]; if (r.textContent?.trim()) { s.push(sorttable.sort_alpha); break } } return o.set(e, columnType), this.guessedTypesCache.set(t, o), columnType }, innerTextCache: new WeakMap, getInnerText(t) { if (!t) return ""; if (t.dataset && t.dataset.value) return t.dataset.value; if (customkey = t.getAttribute("sorttable_customkey")) return customkey; const e = sorttable.innerTextCache.get(t); if (void 0 !== e) return e; const o = "function" == typeof t?.getElementsByTagName && t.getElementsByTagName("input").length, s = t.textContent?.trim() || t.innerText?.trim() || t.text?.trim(); if (s && !o) return s; let r = ""; switch (t.nodeType) { case 3: "input" === t.nodeName.toLowerCase() && (r = t.value.trim()); break; case 1: for (let e = 0; e < t.childNodes.length; e++)r += sorttable.getInnerText(t.childNodes[e]) }return sorttable.innerTextCache.set(t, r.trim()), r.trim() }, reverse(t) { Array.from(t.rows).reverse().forEach((e => t.append(e))) }, sort_numeric: (t, e) => parseFloat(t[0].replace(sorttable.regexNonDecimal, "")) - parseFloat(e[0].replace(sorttable.regexNonDecimal, "")), sort_alpha: (t, e) => t[0].localeCompare(e[0]), shakerSort(t, e) { let o = 0, s = t.length - 1; for (; o < s;)r(t, e, o, s), s-- , a(t, e, o, s), o++; function r(t, e, o, s) { let r = !1; for (let a = o; a < s; a++)e(t[a], t[a + 1]) > 0 && ([t[a], t[a + 1]] = [t[a + 1], t[a]], r = !0); return r } function a(t, e, o, s) { let r = !1; for (let a = s; a > o; a--)e(t[a], t[a - 1]) < 0 && ([t[a], t[a - 1]] = [t[a - 1], t[a]], r = !0); return r } } };

      }

   },
   options: {
      comments_sort_clear_emoji: {
         _tagName: 'input',
         label: 'Clear of emoji',
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
      },
      comments_sort_min_words: {
         _tagName: 'input',
         label: 'Min words count',
         'label:zh': '最少字数',
         'label:ja': '最小単語数',
         // 'label:ko': '최소 단어 수',
         // 'label:vi': '',
         // 'label:id': '',
         'label:es': 'Recuento mínimo de palabras',
         // 'label:pt': 'Contagem mínima de palavras',
         // 'label:fr': 'Nombre minimum de mots',
         // 'label:it': '',
         // 'label:tr': '',
         // 'label:de': 'Mindestanzahl an Wörtern',
         'label:pl': 'Minimalna liczba słów',
         // 'label:ua': 'Мінімальна кількість слів',
         type: 'number',
         title: '0 - disable',
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
         placeholder: '0-10',
         min: 0,
         max: 10,
         value: 2,
         'data-dependent': { 'comments_sort_clear_emoji': true },
      },
      comments_sort_max: {
         _tagName: 'input',
         label: 'Max comments',
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
         type: 'number',
         title: '0 - disable',
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
         placeholder: '0-1200',
         min: 0,
         max: 1200,
         value: 100,
         // 'data-dependent': { 'user-api-key': true },
      },
      comments_sort_blocklist: {
         _tagName: 'textarea',
         label: 'Words/users blocklist',
         'label:zh': '被阻止的单词列表',
         'label:ja': 'ブロックされた単語のリスト',
         // 'label:ko': '단어 목록',
         // 'label:vi': '',
         // 'label:id': 'Daftar kata',
         // 'label:es': 'lista de palabras',
         // 'label:pt': 'Lista de bloqueio de palavras',
         // 'label:fr': 'Liste de blocage de mots',
         // 'label:it': 'Elenco di parole',
         // // 'label:tr': 'Kelime listesi',
         // 'label:de': 'Liste blockierter Wörter',
         'label:pl': 'Lista blokowanych słów',
         // 'label:ua': 'Список заблокованих слів',
         title: 'separator: "," or ";" or "new line"',
         'title:zh': '分隔器： "," 或 ";" 或 "新队"',
         'title:ja': 'セパレータ： "," または ";" または "改行"',
         // 'title:ko': '구분 기호: "," 또는 ";" 또는 "새 줄"',
         // 'title:vi': '',
         // 'title:id': 'pemisah: "," atau ";" atau "baris baru"',
         // 'title:es': 'separador: "," o ";" o "new line"',
         // 'title:pt': 'separador: "," ou ";" ou "new line"',
         // 'title:fr': 'séparateur : "," ou ";" ou "nouvelle ligne"',
         // 'title:it': 'separatore: "," o ";" o "nuova linea"',
         // 'title:tr': 'ayırıcı: "," veya ";" veya "new line"',
         // 'title:de': 'separator: "," oder ";" oder "new line"',
         'title:pl': 'separator: "," lub ";" lub "now linia"',
         // 'title:ua': 'розділювач: "," або ";" або "новий рядок"',
         placeholder: 'text1\n@userA',
         // required: true,
      },
   },
});
