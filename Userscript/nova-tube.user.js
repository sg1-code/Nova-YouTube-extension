if (typeof GM_info === "undefined") {
  alert("Direct Chromium is not supported now");
}

if (!("MutationObserver" in window)) {
  errorAlert("MutationObserver not supported");
}

try {
  document?.body;
} catch (err) {
  errorAlert("Your browser does not support chaining operator");
}

switch (GM_info.scriptHandler) {
  case "Tampermonkey":
  case "Violentmonkey":
  case "ScriptCat":
  case "OrangeMonkey":
    break;

  case "FireMonkey":
    errorAlert(GM_info.scriptHandler + " incomplete support", false);
    break;

  case "Greasemonkey":
    errorAlert(GM_info.scriptHandler + " is not supported");
    break;

  case "Stay":
    errorAlert(
      GM_info.scriptHandler +
        " is not tested!\nPlease inform the author about the working status",
    );
    break;

  default:
    if (typeof GM_getValue !== "function") {
      errorAlert(
        "Your " +
          GM_info.scriptHandler +
          " does not support/no access the API being used. Contact the developer",
      );
    }
    break;
}

function errorAlert(text = "", stop_execute = true) {
  alert(GM_info.script.name + " Error!\n" + text);
  if (stop_execute) {
    throw GM_info.script.name + " crashed!\n" + text;
  }
}
window.nova_plugins = [];

window.nova_plugins.push({
  id: "comments-sort",
  title: "Comments sort",

  "title:pl": "Sortowanie komentarzy",

  run_on_pages: "watch, embed, -mobile",

  section: "comments",
  opt_api_key_warn: true,
  desc: "add modal",

  _runtime: (user_settings) => {
    if (NOVA.currentPage == "embed" && window.innerWidth < 700) return;

    const MAX_COMMENTS =
        Math.min(
          100,
          user_settings["user-api-key"] && +user_settings.comments_sort_max,
        ) || 100,
      BTN_CLASS_NAME = "nova-comments-sort",
      MODAL_NAME_SELECTOR_ID = "nova-modal-comments",
      MODAL_CONTENT_SELECTOR_ID = "modal-content",
      NOVA_REPLIES_SELECTOR_ID = "nova-replies",
      NOVA_REPLIES_SWITCH_CLASS_NAME = NOVA_REPLIES_SELECTOR_ID + "-switch",
      BLOCK_KEYWORDS = NOVA.strToArray(
        user_settings.comments_sort_blocklist?.toLowerCase(),
      );

    let sortable;

    insertButton();

    function insertButton() {
      NOVA.waitSelector(getParentSelector()).then((menu) => {
        const btn = document.createElement("span");
        btn.className = BTN_CLASS_NAME;
        btn.setAttribute("data-open-modal", MODAL_NAME_SELECTOR_ID);
        btn.title = "Nova comments";

        btn.append(
          (function createSvgIcon() {
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("viewBox", "0 0 121.86 122.88");

            const g = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g",
            );
            g.setAttribute("fill", "currentColor");

            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            path.setAttribute(
              "d",
              "M30.28,110.09,49.37,91.78A3.84,3.84,0,0,1,52,90.72h60a2.15,2.15,0,0,0,2.16-2.16V9.82a2.16,2.16,0,0,0-.64-1.52A2.19,2.19,0,0,0,112,7.66H9.82A2.24,2.24,0,0,0,7.65,9.82V88.55a2.19,2.19,0,0,0,2.17,2.16H26.46a3.83,3.83,0,0,1,3.82,3.83v15.55ZM28.45,63.56a3.83,3.83,0,1,1,0-7.66h53a3.83,3.83,0,0,1,0,7.66Zm0-24.86a3.83,3.83,0,1,1,0-7.65h65a3.83,3.83,0,0,1,0,7.65ZM53.54,98.36,29.27,121.64a3.82,3.82,0,0,1-6.64-2.59V98.36H9.82A9.87,9.87,0,0,1,0,88.55V9.82A9.9,9.9,0,0,1,9.82,0H112a9.87,9.87,0,0,1,9.82,9.82V88.55A9.85,9.85,0,0,1,112,98.36Z",
            );

            g.append(path);
            svg.append(g);

            return svg;
          })(),
        );

        btn.addEventListener(
          "click",
          (evt) => {
            evt.stopPropagation();

            if (
              !document.body.querySelector(
                `#${MODAL_CONTENT_SELECTOR_ID} table`,
              )
            ) {
              getComments();
            }
            btn.dispatchEvent(
              new CustomEvent(MODAL_NAME_SELECTOR_ID, {
                bubbles: true,
                detail: "test",
              }),
            );
          },
          { capture: true },
        );

        user_settings["comments-dropdown"]
          ? menu.append(btn)
          : menu.prepend(btn);

        insertModal(NOVA.currentPage == "embed" ? movie_player : document.body);

        prepareModal();

        document.addEventListener("yt-navigate-start", () => {
          if (NOVA.currentPage == "watch") {
            prepareModal();
            btn.style.display = null;
          } else {
            btn.style.display = "none";
          }
        });

        function prepareModal(
          container = document.getElementById(MODAL_CONTENT_SELECTOR_ID),
        ) {
          const pre = document.createElement("pre");
          pre.textContent = "Loading data...";
          container.textContent = "";
          container.append(pre);
        }
      });

      function getParentSelector() {
        let css = "",
          out;

        switch (NOVA.currentPage) {
          case "watch":
            out = "#masthead-container #end";
            css = "padding: 1em; height: 2em;";
            break;

          case "embed":
            out = ".ytp-chrome-top-buttons";
            css = "float: left; padding: 20px;";

            NOVA.css.push(
              `.ytp-autohide .${BTN_CLASS_NAME} { display: none; }`,
            );
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
               }`,
        );

        return out;
      }
    }

    let commentList = [];

    function getComments(next_page_token) {
      const params = {
        videoId: NOVA.queryURL.get("v") || movie_player.getVideoData().video_id,
        part: "snippet,replies",
        maxResults: Math.min(+user_settings.comments_sort_max || 100, 100),
        order: "relevance",
      };

      if (next_page_token) {
        params["pageToken"] = next_page_token;
      }

      NOVA.request
        .API({
          request: "commentThreads",
          params: params,
          api_key: user_settings["user-api-key"],
        })
        .then((res) => {
          if (res?.error) {
            if (res.reason) {
              document.getElementById(MODAL_NAME_SELECTOR_ID).dispatchEvent(
                new CustomEvent(MODAL_NAME_SELECTOR_ID, {
                  bubbles: true,
                  detail: "test",
                }),
              );
              alert(`Error [${res.code}]: ${res.reason}`);
              return;
            } else {
              return (document.getElementById(
                MODAL_CONTENT_SELECTOR_ID,
              ).innerHTML = NOVA.createSafeHTML(
                `<pre>Error [${res.code}]: ${res.reason}</pre>
                        <pre>${res.error}</pre>`,
              ));
            }
          }

          commentList = res?.items?.map((item) => {
            const comment = item.snippet?.topLevelComment?.snippet;
            if (comment) {
              return {
                ...comment,
                totalReplyCount: item.snippet.totalReplyCount,
                id: item.id,
                replies: item.replies?.comments,
              };
            }
          });

          if (commentList.length >= MAX_COMMENTS) {
            genTable();
          } else if (res?.nextPageToken) {
            document.getElementById(MODAL_CONTENT_SELECTOR_ID).innerHTML =
              NOVA.createSafeHTML(
                `<pre>Loading: ${commentList.length + (user_settings["user-api-key"] ? "" : "/" + MAX_COMMENTS)}</pre>`,
              );

            getComments(res?.nextPageToken);
          } else {
            genTable();
          }
        });
    }

    function genTable() {
      if (!commentList.length) {
        return (document.getElementById(MODAL_CONTENT_SELECTOR_ID).innerHTML =
          NOVA.createSafeHTML(`<pre>Comments empty</pre>`));
      }

      const ul = document.createElement("tbody");

      const channelName =
        (href = document.body.querySelector(
          "#owner #upload-info #channel-name a[href]",
        )?.href) && new URL(href).pathname;

      commentList
        .sort((a, b) => b.likeCount - a.likeCount)
        .forEach((comment) => {
          try {
            if (
              !(comment.textDisplay = filterStr(
                comment.textDisplay,
                comment.authorDisplayName,
              ))
            )
              return;

            const replyInputName = `${NOVA_REPLIES_SELECTOR_ID}-${comment.id}`,
              li = document.createElement("tr");

            let replyCount = 0;

            li.className = "item";

            if (channelName && comment.authorChannelUrl.includes(channelName))
              li.classList.add("author");

            li.innerHTML = NOVA.createSafeHTML(
              `<td sorttable_customkey="-${comment.likeCount}">${comment.likeCount}</td>
                     <td sorttable_customkey="-${comment.totalReplyCount}" class="${NOVA_REPLIES_SWITCH_CLASS_NAME}">
                     ${
                       comment.replies?.length
                         ? `<a href="/watch?v=${comment.videoId}&lc=${comment.id}" target="_blank">${comment.totalReplyCount}</a>
                        <label for="${replyInputName}"></label>`
                         : ""
                     }</td>
                     <td sorttable_customkey="-${new Date(comment.publishedAt).getTime()}">${NOVA.formatTime.ago(new Date(comment.publishedAt))}</td>
                     <td title="${comment.authorDisplayName}">
                        <a href="${comment.authorChannelUrl}" target="_blank" title="${comment.authorDisplayName}">
                           <img src="${comment.authorProfileImageUrl}" alt="${comment.authorDisplayName}" />
                        </a>
                     </td>
                     <td sorttable_customkey="-${comment.textOriginal.length}">
                        <span class="nova-reply-text">
                           <a href="/watch?v=${comment.videoId}&lc=${comment.id}" class="nova-reply-copy-link" target="_blank" title="Open comment link"></a>
                           ${comment.textDisplay}
                        </span>
                        ${renderReplies()?.outerHTML || ""}
                     </td>`,
            );

            ul.append(li);

            if (replyCount) {
              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.id = checkbox.name = replyInputName;
              checkbox.addEventListener("change", ({ target }) => {
                const table_element = document.body.querySelector(
                  `table[${NOVA_REPLIES_SELECTOR_ID}="${target.name}"]`,
                );
                table_element.classList.toggle("nova-hide");

                const th = table_element.querySelector("th:first-child");
                if (th && !th.classList.contains("sorttable_sorted")) {
                  sorttable.makeSortable(table_element);
                  th.click();
                }
              });
              li.querySelector("td label[for]")?.before(checkbox);
            }

            function renderReplies() {
              if (!+comment.totalReplyCount) return "";

              const table = document.createElement("table");
              table.innerHTML = NOVA.createSafeHTML(
                `<thead style="display:none">
                           <tr>
                              <th class="sorttable_alpha">answer</th>
                              <th class="sorttable_nosort">avatar</th>
                              <th class="sorttable_alpha">replies</th>
                           </tr>
                        </thead>`,
              );

              table.classList.add("nova-hide", "sortable");
              table.setAttribute(NOVA_REPLIES_SELECTOR_ID, replyInputName);

              comment.replies.forEach((reply, idx) => {
                let replyText = reply.snippet.textDisplay;

                const matchesUsers = replyText.match(/@([^@\s]+)/)?.[0];

                replyText = replyText.replace(/@+\S+/, "");

                if (
                  !(replyText = filterStr(
                    replyText,
                    reply.snippet.authorDisplayName,
                    "ignore_min_words",
                  ))
                )
                  return;

                replyCount++;

                const li = document.createElement("tr");
                if (matchesUsers) li.classList.add("answer");

                if (
                  channelName &&
                  reply.snippet.authorChannelUrl.includes(channelName)
                )
                  li.classList.add("author");

                const answerCell = document.createElement("td");
                answerCell.setAttribute(
                  "sorttable_customkey",
                  `${idx}-${matchesUsers || reply.snippet.authorDisplayName}-${replyCount}`,
                );
                if (matchesUsers) answerCell.textContent = `↪ ${matchesUsers}`;
                answerCell.style.display = "none";

                const authorCell = document.createElement("td");
                authorCell.title = reply.snippet.authorDisplayName;
                const authorLink = document.createElement("a");
                authorLink.href = reply.snippet.authorChannelUrl;
                authorLink.target = "_blank";
                authorLink.title = reply.snippet.authorDisplayName;

                const authorImage = document.createElement("img");
                authorImage.src = reply.snippet.authorProfileImageUrl;
                authorImage.alt = reply.snippet.authorDisplayName;

                authorLink.append(authorImage);
                authorCell.append(authorLink);

                const contentCell = document.createElement("td");

                const copyLink = document.createElement("a");
                copyLink.className = "nova-reply-copy-link";
                copyLink.href = `/watch?v=${comment.videoId}&lc=${reply.id}`;
                copyLink.target = "_blank";

                contentCell.append(copyLink);

                if (reply.snippet.likeCount) {
                  const likesDiv = document.createElement("span");
                  likesDiv.className = "nova-reply-likes-count";
                  likesDiv.textContent = `${reply.snippet.likeCount} like${reply.snippet.likeCount > 1 ? `s` : ""}`;
                  contentCell.append(likesDiv);
                }

                const replyTextDiv = document.createElement("div");
                replyTextDiv.className = "nova-reply-text";

                replyTextDiv.innerHTML = NOVA.createSafeHTML(replyText);

                contentCell.append(replyTextDiv);

                li.append(answerCell, authorCell, contentCell);

                table.append(li);
              });
              return table;
            }
          } catch (err) {
            console.error(
              "Error comment generate:\n",
              err.stack + "\n",
              comment,
            );
          }
        });

      function filterStr(str, user_name, ignore_min_words) {
        const LOG_FILTER = false;

        if (
          (keyword = BLOCK_KEYWORDS?.find((keyword) =>
            (user_name && keyword?.startsWith("@") ? user_name : str)
              .toLowerCase()
              .includes(keyword),
          ))
        ) {
          LOG_FILTER &&
            console.log(
              "filter by block comment/reply:",
              `"${keyword}\n"`,
              str.replace(keyword, `[${keyword}]`),
            );
          return;
        }

        let strOut = str;

        if (
          strOut.length > 100 &&
          strOut.split(" ")?.some((word) => word.length > 100)
        ) {
          LOG_FILTER && console.log("filter comment/reply is too long:\n", str);
          return;
        }

        const countWords = (str = "") => str.trim().split(/\s+/).length,
          clearOfEmoji = (str) =>
            str

              .replace(
                /[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g,
                " ",
              )
              .replace(/(?![*#0-9]+)[\p{Emoji}]/gu, " ")

              .replace(/([=:;/.()]{2,}|\))$/g, " ")
              .trim();

        if (user_settings.comments_sort_clear_emoji) {
          strOut = clearOfEmoji(strOut);

          if (
            !ignore_min_words &&
            +user_settings.comments_sort_min_words &&
            countWords(strOut) <= +user_settings.comments_sort_min_words
          ) {
            LOG_FILTER && console.log("filter comment (by min words):", str);
            return;
          }
        }

        strOut = strOut
          .replace(/[\u200B-\u200D\uFEFF\u034f\u2000-\u200F]/g, "")
          .replace(/\s{2,}/g, " ")
          .replace(/(<br>){3,}/g, "<br><br>")
          .replace(/<a[^>]+><\/a>/g, "")
          .replace(/^(\+){1,}/g, "");

        if (!strOut.length) {
          console.log("filter comment/reply:", str);
          return;
        }

        return strOut;
      }

      const MODAL_CONTENT_FILTER_SELECTOR_ID = "nova-search-comment";

      document.getElementById(MODAL_CONTENT_SELECTOR_ID).innerHTML =
        NOVA.createSafeHTML(
          `<table class="sortable" border="0" cellspacing="0" cellpadding="0">
               <thead id="${MODAL_CONTENT_FILTER_SELECTOR_ID}">
                  <tr>
                     <th class="sorttable_numeric">likes</th>
                     <th class="sorttable_numeric">replies</th>
                     <th class="sorttable_numeric">date</th>
                     <th class="sorttable_nosort">avatar</th>
                     <th class="sorttable_numeric">comments (${commentList.length})</th>
                  </tr>
               </thead>
               <!-- $ {ul.innerHTML} -->
            </table>`,
        );

      document.getElementById(MODAL_CONTENT_FILTER_SELECTOR_ID).after(ul);

      if (!sortable) sortable = connectSortable();
      sorttable.makeSortable(document.body.querySelector("table.sortable"));

      document.body
        .querySelector(`table.sortable thead`)
        .addEventListener("click", ({ target }) => {
          if (NOVA.editableFocused(target)) return;

          if (
            (containerScroll = document.body.querySelector(".modal-container"))
          )
            containerScroll.scrollTop = 0;
        });

      insertFilterInput(MODAL_CONTENT_FILTER_SELECTOR_ID);

      NOVA.css.push(
        `.nova-hide {
               display: none;
            }
            table[${NOVA_REPLIES_SELECTOR_ID}] {
               border: 1px solid #444;
               width: auto !important;
            }
            table[${NOVA_REPLIES_SELECTOR_ID}] td {
               padding: auto 10px;
            }

            .nova-reply-likes-count {
               position: absolute;
               top: 0;
               left: 0;
               margin: 0 2em;
               font-size: .3em;
               font-style: italic;
               color: lightslategrey;
               opacity: .6;
            }

            table[${NOVA_REPLIES_SELECTOR_ID}] .answer .nova-reply-text:last-child:before {
               content: "↪";
               margin: 0 .3em;
               color: #6186c9;
            }


            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox] {
               --height: 1.5em;
               --disabled-opacity: .7;

               background-color: var(--dark-theme-divider-color);
               color: var(--dark-theme-text-color);
               --off-hover-bg: var(--light-theme-secondary-color, deepskyblue, greenyellow);

               --checked-bg: #e85717;
               --checked-bg-active: var(--dark-theme-divider-color);
               --checked-color: var(--dark-theme-text-color);

               --text-on: 'HIDE';
               --text-on-press: 'SHOW';

               --text-off: 'ANS';
               --text-off-press: 'HIDE?';


               display: block;
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



               font-size: 1em;
               width: 4em;
               height: 1.7em;
               font-weight: bold;
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:hover:before {
               background-color: var(--off-hover-bg);
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:after,
            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:before {
               position: absolute;
               transition: left 200ms ease-in-out;
               width: 100%;
               line-height: 1.8em;
               text-align: center;

            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:after {
               left: 100%;
               content: var(--text-on);
               font-weight: bold;
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:before {
               left: 0;
               content: var(--text-off);
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:active {

               background-color: var(--checked-bg);
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:active:before {
               left: -10%;
               content: var(--text-on-press);
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:checked {
               color: var(--checked-color);
               background-color: var(--checked-bg);
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:checked:before {
               left: -100%;
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:checked:after {
               left: 0;
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox]:checked:active:after {
               left: 10%;
               content: var(--text-off-press);
               background-color: var(--checked-bg-active);
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox] [disabled] {
               cursor: not-allowed;
            }

            .${NOVA_REPLIES_SWITCH_CLASS_NAME} input[type=checkbox] [disabled] {
               opacity: var(--disabled-opacity);
            }
            `,
      );
    }

    function insertFilterInput(parent_selector_id = required()) {
      if (typeof parent_selector_id !== "string") {
        return console.error(
          'typeof "parent_selector_id":',
          typeof parent_selector_id,
        );
      }

      NOVA.css.push(
        `#${parent_selector_id} input {
              position: absolute;
              top: 0;
              right: 0;



              height: 100%;
            }

            #${parent_selector_id} input[type=search]:focus,
            #${parent_selector_id} input[type=text]:focus {
               outline: 1px solid #00b7fc;
            }
            .nova-mark-text {
               background-color: #ff0;
               background-color: mark;


            }`,
      );

      const searchInput = document.createElement("input");
      searchInput.setAttribute("type", "search");
      searchInput.setAttribute("placeholder", "Filter");

      ["change", "keyup"].forEach((evt) => {
        searchInput.addEventListener(evt, function () {
          NOVA.searchFilterHTML({
            keyword: this.value,
            search_selectors: "tr.item",
            filter_selector: ".nova-reply-text",
            highlight_class: "nova-mark-text",
          });
        });
      });

      searchInput.addEventListener("dblclick", () => {
        searchInput.value = "";
        searchInput.dispatchEvent(new Event("change"));
      });

      document.getElementById(parent_selector_id).append(searchInput);
    }

    function insertModal(parent = document.body) {
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

               border: 1px solid #222;

               position: relative;
               display: flex;
               box-sizing: border-box;
               overflow-y: auto;
               max-width: ${NOVA.currentPage == "embed" ? 95 : 70}%;
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



            .modal-close:hover {
               background-color: #ea3c3c;
            }

            .modal-content {
               padding: 2rem;
            }`,
      );

      NOVA.css.push(
        `.modal {}

            .modal-container {


               color: var(--yt-spec-text-primary);
            }

            .modal-content {
               font-size: 12px;
            }`,
      );

      const modalContainer = document.createElement("div");
      modalContainer.id = MODAL_NAME_SELECTOR_ID;
      modalContainer.className = "modal";
      modalContainer.setAttribute("data-modal", "");

      const modalClose = document.createElement("div");
      modalClose.className = "modal-close";
      modalClose.setAttribute("data-close-modal", "");
      modalClose.textContent = "✕";

      const modalContent = document.createElement("div");
      modalContent.id = MODAL_CONTENT_SELECTOR_ID;
      modalContent.className = "modal-content";

      const container = document.createElement("div");
      container.className = "modal-container";

      container.append(modalClose, modalContent);

      modalContainer.append(container);
      parent.append(modalContainer);

      const modalShowClass = "modal-visible";

      document
        .getElementById(MODAL_NAME_SELECTOR_ID)
        .addEventListener("click", ({ target }) => {
          target.dispatchEvent(
            new CustomEvent(MODAL_NAME_SELECTOR_ID, {
              bubbles: true,
              detail: "test",
            }),
          );
        });

      document.addEventListener(MODAL_NAME_SELECTOR_ID, ({ target }) => {
        const attrModal = target.hasAttribute("data-modal"),
          attrOpen = target.getAttribute("data-open-modal"),
          attrClose = target.hasAttribute("data-close-modal");

        if (attrModal) {
          target.classList.remove(modalShowClass);
        } else if (attrOpen && (modal = document.getElementById(attrOpen))) {
          modal.classList.add(modalShowClass);
        } else if (attrClose && (modal = target.closest("[data-modal]"))) {
          modal.classList.remove(modalShowClass);
        }
      });
    }

    function connectSortable() {
      NOVA.css.push(
        `table.sortable table {
               width: 100%;
            }


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


            }

            thead, th, td {
               text-align: center;
            }

            table tbody {
               counter-reset: sortabletablescope;
            }


            `,
      );

      NOVA.css.push(
        `#${MODAL_CONTENT_SELECTOR_ID} table {}

            #${MODAL_CONTENT_SELECTOR_ID} thead {
               background-color: #555;


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



            #${MODAL_CONTENT_SELECTOR_ID} td {
               position: relative;
            }

            #${MODAL_CONTENT_SELECTOR_ID} td .nova-reply-text {
               display: block;
               max-height: 25vh;
               overflow-y: auto;
               scrollbar-width: thin;
               text-align: left;
               font-size: 1.2em;
               line-height: 1.4;
               padding: .8em .5em;

               text-overflow: ellipsis;
               word-wrap: break-word;
            }

            #${MODAL_CONTENT_SELECTOR_ID} td .nova-reply-text:hover{
               max-height: 55vh !important;

            }

            #${MODAL_CONTENT_SELECTOR_ID} tr.author { }

            #${MODAL_CONTENT_SELECTOR_ID} .author > td > .nova-reply-text {
               background-color: rgba(0, 47, 144, .2);
            }

            #${MODAL_CONTENT_SELECTOR_ID} td a {
               text-decoration: none;
               color: var(--yt-spec-call-to-action);
            }

            #${MODAL_CONTENT_SELECTOR_ID} td a.nova-reply-copy-link {
               position: absolute;
               top: 0;
               right: 0;
               padding: 1px 5px;
               font-size: .3em;
               background-color: #333;
               opacity: 0;
            }
            #${MODAL_CONTENT_SELECTOR_ID} td a.nova-reply-copy-link::before {
               content: "link";
            }
            #${MODAL_CONTENT_SELECTOR_ID} td:hover > nova-reply-text > a.nova-reply-copy-link {
               opacity: .3;
            }
            #${MODAL_CONTENT_SELECTOR_ID} td > nova-reply-text > a.nova-reply-copy-link:hover {
               opacity: 1;
               text-decoration: underline;
            }`,
      );

      return (sorttable = {
        selectorTables: "table.sortable",
        classSortBottom: "sortbottom",
        classNoSort: "sorttable_nosort",
        classSorted: "sorttable_sorted",
        classSortedReverse: "sorttable_sorted_reverse",
        idSorttableSortfwdind: "sorttable_sortfwdind",
        idSorttableSortfrevind: "sorttable_sortrevind",
        iconUp: "&nbsp;&#x25B4;",
        iconDown: "&nbsp;&#x25BE;",
        regexNonDecimal: /[^0-9\.\-]/g,
        regexTrim: /^\s+|\s+$/g,
        regexAnySorttableClass: /\bsorttable_([a-z0-9]+)\b/,
        init() {
          sorttable.init.done ||
            ((sorttable.init.done = !0),
            document
              .querySelectorAll(sorttable.selectorTables)
              .forEach(sorttable.makeSortable));
        },
        innerSortFunction(t, e) {
          d("wait");
          const o = this.classList.contains(sorttable.classSorted),
            s = this.classList.contains(sorttable.classSortedReverse);
          if (o || s)
            return (
              sorttable.reverse(this.sorttable_tbody),
              c(this, s),
              void t.preventDefault()
            );
          const r = [],
            a = this.sorttable_columnindex,
            n = this.sorttable_tbody.rows;
          for (let t = 0; t < n.length; t++)
            r.push([sorttable.getInnerText(n[t].cells[a]), n[t]]);
          r.sort(this.sorttable_sortfunction), c(this, !0);
          const l = this.sorttable_tbody,
            i = document.createDocumentFragment();
          for (let t = 0; t < r.length; t++) i.append(r[t][1]);
          function c(t, e) {
            const { id: o, icon: s } = e
              ? {
                  id: sorttable.idSorttableSortfwdind,
                  icon: sorttable.iconDown,
                }
              : {
                  id: sorttable.idSorttableSortfrevind,
                  icon: sorttable.iconUp,
                };
            document.getElementById(sorttable.idSorttableSortfwdind)?.remove(),
              document
                .getElementById(sorttable.idSorttableSortfrevind)
                ?.remove();
            const r = document.createElement("span");
            (r.id = o),
              (r.innerHTML = NOVA.createSafeHTML(s)),
              t.append(r),
              t.classList.remove(
                sorttable.classSorted,
                sorttable.classSortedReverse,
              ),
              t.classList.add(
                e ? sorttable.classSorted : sorttable.classSortedReverse,
              ),
              d();
          }
          function d(t = null) {
            e.style.cursor = t;
          }
          l.append(i), t.preventDefault();
        },
        makeSortable(t) {
          if (!t.tHead) {
            const e = document.createElement("thead");
            t.insertBefore(e, t.firstChild);
          }
          if (1 !== t.tHead.rows.length) return;
          const e = Array.from(t.rows).filter((t) =>
            t.classList.contains(sorttable.classSortBottom),
          );
          if (e.length) {
            let o = t.tFoot;
            o || ((o = document.createElement("tfoot")), t.append(o));
            const s = document.createDocumentFragment();
            e.forEach((t) => s.append(t)), o.append(s);
          }
          const o = t.tHead.rows[0].cells;
          for (let e = 0; e < o.length; e++) {
            const s = o[e];
            if (!s.classList.contains(sorttable.classNoSort)) {
              const o = s.className.match(
                sorttable.regexAnySorttableClass,
              )?.[1];
              (s.sorttable_sortfunction = o
                ? sorttable[`sort_${o}`]
                : sorttable.guessType(t, e)),
                (s.sorttable_columnindex = e),
                (s.sorttable_tbody = t.tBodies[0]);
            }
          }
          t.tHead.addEventListener("click", (e) => {
            const o = e.target;
            "TH" !== o.tagName ||
              o.classList.contains(sorttable.classNoSort) ||
              sorttable.innerSortFunction.call(o, e, t);
          });
        },
        guessedTypesCache: new WeakMap(),
        guessType(t, e) {
          const o = this.guessedTypesCache.get(t) || new Map();
          if (o.has(e)) return o.get(e);
          const s = [];
          for (let o = 0; o < t.rows.length; o++) {
            const r = t.rows[o].cells[e];
            if (r.textContent?.trim()) {
              s.push(sorttable.sort_alpha);
              break;
            }
          }
          return (
            o.set(e, columnType), this.guessedTypesCache.set(t, o), columnType
          );
        },
        innerTextCache: new WeakMap(),
        getInnerText(t) {
          if (!t) return "";
          if (t.dataset && t.dataset.value) return t.dataset.value;
          if ((customkey = t.getAttribute("sorttable_customkey")))
            return customkey;
          const e = sorttable.innerTextCache.get(t);
          if (void 0 !== e) return e;
          const o =
              "function" == typeof t?.getElementsByTagName &&
              t.getElementsByTagName("input").length,
            s = t.textContent?.trim() || t.innerText?.trim() || t.text?.trim();
          if (s && !o) return s;
          let r = "";
          switch (t.nodeType) {
            case 3:
              "input" === t.nodeName.toLowerCase() && (r = t.value.trim());
              break;
            case 1:
              for (let e = 0; e < t.childNodes.length; e++)
                r += sorttable.getInnerText(t.childNodes[e]);
          }
          return sorttable.innerTextCache.set(t, r.trim()), r.trim();
        },
        reverse(t) {
          Array.from(t.rows)
            .reverse()
            .forEach((e) => t.append(e));
        },
        sort_numeric: (t, e) =>
          parseFloat(t[0].replace(sorttable.regexNonDecimal, "")) -
          parseFloat(e[0].replace(sorttable.regexNonDecimal, "")),
        sort_alpha: (t, e) => t[0].localeCompare(e[0]),
        shakerSort(t, e) {
          let o = 0,
            s = t.length - 1;
          for (; o < s; ) r(t, e, o, s), s--, a(t, e, o, s), o++;
          function r(t, e, o, s) {
            let r = !1;
            for (let a = o; a < s; a++)
              e(t[a], t[a + 1]) > 0 &&
                (([t[a], t[a + 1]] = [t[a + 1], t[a]]), (r = !0));
            return r;
          }
          function a(t, e, o, s) {
            let r = !1;
            for (let a = s; a > o; a--)
              e(t[a], t[a - 1]) < 0 &&
                (([t[a], t[a - 1]] = [t[a - 1], t[a]]), (r = !0));
            return r;
          }
        },
      });
    }
  },
  options: {
    comments_sort_clear_emoji: {
      _tagName: "input",
      label: "Clear of emoji",

      type: "checkbox",
    },
    comments_sort_min_words: {
      _tagName: "input",
      label: "Min words count",

      "label:es": "Recuento mínimo de palabras",

      "label:pl": "Minimalna liczba słów",

      type: "number",
      title: "Ignore replies. 0 - disable",

      placeholder: "0-10",
      min: 0,
      max: 10,
      value: 2,
      "data-dependent": { comments_sort_clear_emoji: true },
    },
    comments_sort_max: {
      _tagName: "input",
      label: "Max comments",

      type: "number",
      title: "0 - disable",

      placeholder: "0-1200",
      min: 0,
      max: 1200,
      value: 100,
    },
    comments_sort_blocklist: {
      _tagName: "textarea",
      label: "Words/users blocklist",

      "label:pl": "Lista blokowanych słów",

      title: 'separator: "," or ";" or "new line"',

      "title:pl": 'separator: "," lub ";" lub "now linia"',

      placeholder: "text1\n@userA",
    },
  },
});
window.nova_plugins.push({
  id: "comments-dropdown",
  title: "Dropdown comments section",

  run_on_pages: "watch, -mobile",
  section: "comments",

  _runtime: (user_settings) => {
    if (user_settings["comments_visibility_mode"] == "disable") return;

    const COMMENTS_SELECTOR =
        "html:not(:fullscreen) #page-manager #comments:not([hidden]):not(:empty)",
      counterAttrName = "data-counter";

    NOVA.runOnPageLoad(() => {
      if (NOVA.currentPage == "watch") {
        NOVA.waitSelector(
          "ytd-comments-header-renderer #title #count:not(:empty)",
          { destroy_after_page_leaving: true },
        ).then((countEl) => {
          if ((count = NOVA.extractAsNum.int(countEl.textContent))) {
            document.body
              .querySelector(COMMENTS_SELECTOR)
              ?.setAttribute(counterAttrName, NOVA.numberFormat.abbr(count));
          }
        });
      }
    });

    NOVA.waitSelector("#masthead-container").then((masthead) => {
      NOVA.css.push(
        `${COMMENTS_SELECTOR},
               ${COMMENTS_SELECTOR}:before {
                  position: fixed;
                  top: ${masthead.offsetHeight || 56}px;
                  right: 0;
                  z-index: ${1 + Math.max(getComputedStyle(masthead || movie_player)["z-index"], 601)};
               }


               ${COMMENTS_SELECTOR}:not(:hover):before {


                  content: attr(${counterAttrName}) " comments ▽";
                  cursor: pointer;
                  visibility: visible;

                  right: 2em;
                  padding: 0 6px 2px;
                  line-height: normal;
                  font-family: Roboto, Arial, sans-serif;
                  font-size: 11px;
                  color: #eee;
                  background-color: rgba(0, 0, 0, .3);
               }


               ${COMMENTS_SELECTOR} {
                  ${user_settings.comments_dropdown_width === 100 ? "margin: 0 1%;" : ""}
                  padding: 0 15px;
                  background-color: var(--yt-spec-brand-background-primary);
                  background-color: var(--yt-spec-menu-background);
                  background-color: var(--yt-spec-raised-background);
                  color: var(--yt-spec-text-primary);;
                  border: 1px solid #333;
                  max-width: ${user_settings.comments_dropdown_width || 40}%;
                  ${user_settings["square-avatars"] ? "" : "border-radius: 12px"};
               }

               ${COMMENTS_SELECTOR}:not(:hover) {
                  visibility: collapse;
               }


               ${COMMENTS_SELECTOR}:hover {
                  visibility: visible !important;
               }


               ${COMMENTS_SELECTOR} > #sections > #contents {
                  overflow-y: auto;
                  max-height: 82.5vh;
                  padding-top: 1em;
               }

               #expander.ytd-comment-renderer {
                  overflow-x: hidden;
               }

               ${COMMENTS_SELECTOR} #sections {
                  min-width: 500px;
               }


               ${COMMENTS_SELECTOR} #contents::-webkit-scrollbar {
                  height: 8px;
                  width: 10px;
               }

               ${COMMENTS_SELECTOR} #contents::-webkit-scrollbar-button {
                  height: 0;
                  width: 0;
               }

               ${COMMENTS_SELECTOR} #contents::-webkit-scrollbar-corner {
                  background-color: transparent;
               }

               ${COMMENTS_SELECTOR} #contents::-webkit-scrollbar-thumb {
                  background-color: #e1e1e1;

                  border: 0;
                  border-radius: 0;
               }

               ${COMMENTS_SELECTOR} #contents::-webkit-scrollbar-thumb {}

               ${COMMENTS_SELECTOR} #contents::-webkit-scrollbar-track {
                  background-color: #666;
                  border: 0;
                  border-radius: 0;
               }
               ${COMMENTS_SELECTOR} #contents::-webkit-scrollbar-track:hover {
                  background-color: #666;
               }

               ytd-comments-header-renderer {
                  margin: 10px 0 !important;
               }`,
      );

      if (user_settings.comments_dropdown_hide_textarea) {
        NOVA.css.push(
          `${COMMENTS_SELECTOR} > #sections > #contents {
                     overflow-y: auto;
                     max-height: 88vh;
                     border-top: 1px solid #333;
                     padding-top: 1em;
                  }
                  ${COMMENTS_SELECTOR} #header #simple-box {
                     display: none;
                  }

                  ytd-comments-header-renderer #title {
                     margin: 0 !important;
                  }`,
        );
      }
    });
  },
  options: {
    comments_dropdown_width: {
      _tagName: "input",
      label: "Width %",

      "label:pl": "Szerokość",

      type: "number",

      title: "% of the screen width",

      placeholder: "%",
      step: 5,
      min: 10,
      max: 100,
      value: 40,
    },
    comments_dropdown_hide_textarea: {
      _tagName: "input",
      label: "Hide textarea",

      "label:pl": "Ukryj obszar tekstowy",

      type: "checkbox",
    },
  },
});
window.nova_plugins.push({
  id: "square-avatars",
  title: "Square avatars",

  "title:pl": "Kwadratowe awatary",

  run_on_pages: "*, -live_chat",

  section: "comments",
  desc: "Make user images squared",
  "desc:zh": "方形用户形象",
  "desc:ja": "ユーザー画像を二乗する",

  "desc:pl": "Awatary użytkowniów będą kwadratowe",

  _runtime: (user_settings) => {
    NOVA.css.push(
      [
        "yt-img-shadow",
        ".ytp-title-channel-logo",
        "#player .ytp-title-channel",
        "ytm-profile-icon",
        ".ytd-page-manager[video-id]",

        "a.ytd-thumbnail",

        "#search .ytd-searchbox",

        "#ytd-player",
        "yt-image-banner-view-model",

        "ytd-engagement-panel-section-list-renderer[modern-panels]:not([live-chat-engagement-panel])",
      ].join(",\n") +
        ` {
               border-radius: 0 !important;
            }
            html {
               --yt-button-border-radius: 0;
            }`,
    );

    NOVA.waitUntil(() => {
      if (
        window.yt &&
        (obj = yt?.config_?.EXPERIMENT_FLAGS) &&
        Object.keys(obj).length
      ) {
        yt.config_.EXPERIMENT_FLAGS.web_rounded_thumbnails = false;
        return true;
      }
    }, 100);
  },
});
window.nova_plugins.push({
  id: "comments-expand",
  title: "Expand comments",

  "title:pl": "Rozwiń komentarze",

  run_on_pages: "watch, -mobile",
  section: "comments",

  _runtime: (user_settings) => {
    NOVA.css.push(
      `#expander.ytd-comment-renderer {
            overflow-x: hidden;
         }`,
    );

    NOVA.watchElements({
      selectors: ["#comments #expander[collapsed] #more:not([hidden])"],
      attr_mark: "nova-comment-expanded",
      callback: (btn) => {
        const moreExpand = () => btn.click();
        const comment = btn.closest("#expander[collapsed]");

        switch (user_settings.comments_expand_mode) {
          case "onhover":
            comment.addEventListener("mouseenter", moreExpand, {
              capture: true,
              once: true,
            });
            break;

          case "always":
            moreExpand();
            break;
        }
      },
    });

    NOVA.watchElements({
      selectors: [
        "#replies #more-replies button",
        "#replies #expander-contents ytd-continuation-item-renderer button",
      ],
      attr_mark: "nova-replies-expanded",
      callback: (btn) => {
        const moreExpand = () => btn.click();

        switch (user_settings.comments_view_reply) {
          case "onhover":
            btn.addEventListener("mouseenter", moreExpand, {
              capture: true,
              once: true,
            });
            break;

          case "always":
            moreExpand();
            break;
        }
      },
    });

    if (NOVA.queryURL.has("lc")) {
      NOVA.waitSelector(
        "#comment #linked-comment-badge + #body #expander[collapsed] #more:not([hidden])",
      ).then((btn) => btn.click());

      NOVA.waitSelector(
        "ytd-comment-thread-renderer:has(#linked-comment-badge) #replies #more-replies button",
      ).then((btn) => btn.click());
    }
  },
  options: {
    comments_expand_mode: {
      _tagName: "select",
      label: "Expand comment",

      "label:pl": "Rozwiń komentarz",

      options: [
        {
          label: "always",
          value: "always",
          selected: true,

          "label:pl": "zawsze",
        },
        {
          label: "on hover",
          value: "onhover",

          "label:pl": "przy najechaniu",
        },
        {
          label: "disable",
          value: false,
        },
      ],
    },
    comments_view_reply: {
      _tagName: "select",
      label: "Expand reply",

      "label:pl": "Rozwiń odpowiedź",

      options: [
        {
          label: "always",
          value: "always",

          "label:pl": "zawsze",
        },
        {
          label: "on hover",
          value: "onhover",
          selected: true,

          "label:pl": "przy najechaniu",
        },
        {
          label: "disable",
          value: false,
        },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "comments-visibility",
  title: "Collapse comments section",

  "title:pl": "Zwiń sekcję komentarzy",

  run_on_pages: "watch, -mobile",
  restart_on_location_change: true,
  section: "comments",

  "plugins-conflict": "comments-dropdown",
  _runtime: (user_settings) => {
    NOVA.collapseElement({
      selector: "#comments",
      label: "comments",
      remove:
        user_settings.comments_visibility_mode == "disable" ? true : false,
    });
  },
  options: {
    comments_visibility_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "collapse",
          value: "hide",
          selected: true,

          "label:pl": "zwiń",
        },
        {
          label: "remove",
          value: "disable",

          "label:pl": "usuń",
        },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "metadata-hide",
  title: "Hide metadata",

  run_on_pages: "watch",
  section: "details",
  desc: "Cover link to games, movies, merch, etc.",

  _runtime: (user_settings) => {
    let selectorsList = [
      "ytd-watch-metadata > ytd-metadata-row-container-renderer",

      "ytd-merch-shelf-renderer, #infocards-section",
    ];

    if (user_settings.description_card_list) {
      selectorsList.push(
        "#structured-description ytd-horizontal-card-list-renderer",
      );
    }
    if (user_settings.description_shorts_remixing) {
      selectorsList.push("#structured-description ytd-reel-shelf-renderer");
    }
    if (user_settings.description_transcript) {
      selectorsList.push(
        "#structured-description ytd-video-description-transcript-section-renderer",
      );
    }

    if (selectorsList.length) {
      NOVA.css.push(
        selectorsList.join(",\n") +
          ` {
               display: none !important;
               background-color: red;
            }`,
      );
    }
  },
  options: {
    description_card_list: {
      _tagName: "input",
      label: "Chapters/key, moments/music info",

      type: "checkbox",

      "data-dependent": { "player-float-progress-bar": true },
    },
    description_shorts_remixing: {
      _tagName: "input",
      label: "Shorts remixing this video",

      type: "checkbox",
    },
    description_transcript: {
      _tagName: "input",
      label: "Transcript button",

      type: "checkbox",
    },
  },
});

window.nova_plugins.push({
  id: "details-buttons-visibility",
  title: "Buttons hide",

  run_on_pages: "watch, -mobile",
  section: "details-buttons",

  _runtime: (user_settings) => {
    const SELECTOR_BTN_CONTAINER = "ytd-watch-metadata #actions";

    if (
      user_settings.details_buttons_hide?.length &&
      (stylesList = getHideButtonsList()) &&
      stylesList.length
    ) {
      NOVA.css.push(
        stylesList.join(",\n") +
          ` {
            display: none !important;
            background-color: red;
         }`,
      );
    }

    function getHideButtonsList() {
      let stylesList = [];

      if (user_settings.details_buttons_hide?.includes("subscribe")) {
        stylesList.push("#owner #subscribe-button");
      }
      if (user_settings.details_buttons_hide.includes("join")) {
        stylesList.push("#sponsor-button");
      }

      if (user_settings.details_buttons_hide?.includes("all")) {
        stylesList.push(`${SELECTOR_BTN_CONTAINER} button`);
        return stylesList;
      }

      if (user_settings.details_buttons_hide.includes("like_dislike")) {
        stylesList.push(
          `${SELECTOR_BTN_CONTAINER} segmented-like-dislike-button-view-model`,
        );
      } else if (user_settings.details_buttons_hide.includes("dislike")) {
        stylesList.push(
          `${SELECTOR_BTN_CONTAINER} dislike-button-view-model, ${SELECTOR_BTN_CONTAINER} .yt-spec-button-shape-next--segmented-start::after`,
        );

        NOVA.css.push(
          `${SELECTOR_BTN_CONTAINER} segmented-like-dislike-button-view-model button {
               border-radius: 20px;
            }`,
        );
      }

      if (user_settings.details_buttons_hide.includes("download")) {
        stylesList.push(
          `${SELECTOR_BTN_CONTAINER} ytd-download-button-renderer`,
        );
        NOVA.css.push(`#flexible-item-buttons { width: inherit; }`);
      }

      if (CSS.supports("selector(:has(*))")) {
        const buttonsSelector = [
          `${SELECTOR_BTN_CONTAINER} ytd-button-renderer`,
          `${SELECTOR_BTN_CONTAINER} button`,
          "ytd-popup-container ytd-menu-service-item-renderer",
        ];

        if (user_settings.details_buttons_hide.includes("share")) {
          stylesList.push(
            buttonsSelector.map((e) => `\n${e}:has(path[d^="M15 5.63 20.66"])`),
          );
        }
        if (user_settings.details_buttons_hide.includes("thanks")) {
          stylesList.push(
            buttonsSelector.map(
              (e) => `\n${e}:has(path[d^="M11 17h2v-1h1c.55"])`,
            ),
          );
        }
        if (user_settings.details_buttons_hide.includes("clip")) {
          stylesList.push(
            buttonsSelector.map((e) => `\n${e}:has(path[d^="M8 7c0 .55-.45"])`),
          );
        }
        if (user_settings.details_buttons_hide.includes("save")) {
          stylesList.push(
            buttonsSelector.map((e) => `\n${e}:has(path[d^="M22 13h-4v4h"])`),
          );
        }
        if (user_settings.details_buttons_hide.includes("report")) {
          stylesList.push(
            buttonsSelector.map((e) => `\n${e}:has(path[d^="m13.18 4 .24 "])`),
          );
        }
        if (user_settings.details_buttons_hide.includes("transcript")) {
          stylesList.push(
            buttonsSelector.map(
              (e) => `\n${e}:has(path[d^="M5,11h2v2H5V11z"])`,
            ),
          );
        }
      }

      return stylesList;
    }

    let stylesTextHideLabel = "";

    if (user_settings.details_buttons_label_hide) {
      stylesTextHideLabel += `${SELECTOR_BTN_CONTAINER} button [class*=text] {
               display: none;
            }
            ${SELECTOR_BTN_CONTAINER} button .yt-spec-button-shape-next__icon {
               margin: 0 !important;
            }


            ${SELECTOR_BTN_CONTAINER} segmented-like-dislike-button-view-model button,
            ${SELECTOR_BTN_CONTAINER} segmented-like-dislike-button-view-model ~ * button,
            ${SELECTOR_BTN_CONTAINER} button.yt-spec-button-shape-next--size-m {
               padding: 0 7px;
            }
            ${SELECTOR_BTN_CONTAINER} ytd-menu-renderer[has-items] yt-button-shape.ytd-menu-renderer {
               margin: 0 !important;
            }`;
    }

    if (+user_settings.details_buttons_opacity) {
      stylesTextHideLabel += `#owner #subscribe-button:not(:hover),
            ${SELECTOR_BTN_CONTAINER} #menu:not(:hover) {
               transition: opacity .2s ease-in-out;
               opacity: ${user_settings.details_buttons_opacity || 0.1};
            }`;
    }

    if (stylesTextHideLabel.length) {
      NOVA.css.push(stylesTextHideLabel);
    }
  },
  options: {
    details_buttons_label_hide: {
      _tagName: "input",
      label: "Buttons without labels",

      "label:pl": "Guziki bez etykiet",

      type: "checkbox",
      title: 'Requires support for css tag ":has()"',
    },
    details_buttons_opacity: {
      _tagName: "input",
      label: "Opacity",

      "label:pl": "Przejrzystość",

      type: "number",
      title: "0 - disable",

      placeholder: "0-1",
      step: 0.05,
      min: 0,
      max: 1,
      value: 0.9,
    },

    details_buttons_hide: {
      _tagName: "select",

      label: "Hide items",

      title: "[Ctrl+Click] to select several",

      "title:pl": "Ctrl+kliknięcie, aby zaznaczyć kilka",

      multiple: null,

      size: 8,
      options: [
        {
          label: "subscribe",
          value: "subscribe",
        },
        {
          label: "join",
          value: "join",
        },
        {
          label: "all (below)",
          value: "all",
        },
        {
          label: "like+dislike",
          value: "like_dislike",
        },
        {
          label: "dislike",
          value: "dislike",
        },
        {
          label: "share",
          value: "share",
        },
        {
          label: "clip",
          value: "clip",
        },
        {
          label: "save",
          value: "save",
        },
        {
          label: "download",
          value: "download",
        },
        {
          label: "thanks",
          value: "thanks",
        },
        {
          label: "report",
          value: "report",
        },
        {
          label: "transcript",
          value: "transcript",
        },
      ],
    },
  },
});

window.nova_plugins.push({
  id: "video-date-format",

  title: "Date format display",

  run_on_pages: "watch, -mobile",

  section: "details",
  opt_api_key_warn: true,
  _runtime: (user_settings) => {
    const CACHE_PREFIX = "nova-video-date:",
      DATE_SELECTOR_ID = "nova-video-published-date";

    NOVA.runOnPageLoad(async () => {
      if (NOVA.currentPage == "watch") {
        await NOVA.waitUntil(() => typeof movie_player === "object", 1000);

        NOVA.waitSelector("#title h1", {
          destroy_after_page_leaving: true,
        }).then((el) => setVideoDate(el));
      }
    });

    function setVideoDate(container = required()) {
      const videoId =
        NOVA.queryURL.get("v") || movie_player.getVideoData().video_id;

      if (
        window?.sessionStorage &&
        (storage = sessionStorage.getItem(CACHE_PREFIX + videoId)) &&
        storage.format == user_settings.video_date_format
      ) {
        return insertToHTML({ text: storage.date, container: container });
      }

      NOVA.request
        .API({
          request: "videos",
          params: {
            id: videoId,
            part:
              "snippet,liveStreamingDetails" +
              (user_settings.video_view_count ? ",statistics" : ""),
          },
          api_key: user_settings["user-api-key"],
        })
        .then((res) => {
          if (res?.error)
            return alert(`Error [${res.code}]: ${res.reason}\n` + res.error);

          res?.items?.forEach((item) => {
            let outList = [];

            if (user_settings.video_view_count && item.statistics.viewCount) {
              switch (user_settings.video_view_count) {
                case "friendly":
                  outList.push(
                    NOVA.numberFormat.friendly(item.statistics.viewCount),
                    "views",
                  );
                  break;

                default:
                  outList.push(
                    NOVA.numberFormat.abbr(item.statistics.viewCount),
                    "views",
                  );

                  break;
              }
            }

            if (item.liveStreamingDetails) {
              if (
                movie_player.getVideoData().isLive ||
                item.snippet.liveBroadcastContent == "live"
              ) {
                outList.push(
                  "Active Livestream",
                  NOVA.dateFormat.apply(
                    new Date(item.liveStreamingDetails.actualStartTime),
                    [user_settings.video_date_format],
                  ),
                );
              } else if (item.liveStreamingDetails.actualEndTime) {
                const timeStart = new Date(
                    item.liveStreamingDetails.actualStartTime,
                  ),
                  timeEnd = new Date(item.liveStreamingDetails.actualEndTime),
                  sameDate = timeStart.getDay() === timeEnd.getDay();

                outList.push(
                  movie_player.getPlayerResponse()?.videoDetails?.isLiveContent
                    ? "Streamed"
                    : "Premiered",
                );
                if (!sameDate) outList.push("from");
                outList.push(
                  NOVA.dateFormat.apply(timeStart, [
                    user_settings.video_date_format,
                  ]),
                );

                if (!sameDate) {
                  outList.push(
                    "until",
                    NOVA.dateFormat.apply(timeEnd, [
                      user_settings.video_date_format,
                    ]),
                  );
                }
              } else if (item.snippet.liveBroadcastContent == "upcoming") {
                outList.push(
                  "Scheduled",
                  NOVA.dateFormat.apply(
                    new Date(item.liveStreamingDetails.scheduledStartTime),
                    [user_settings.video_date_format],
                  ),
                );
              }
            } else if (item.snippet.publishedAt) {
              const publishedDate = new Date(item.snippet.publishedAt);

              if (user_settings.video_date_format == "ago") {
                outList.push(NOVA.formatTime.ago(publishedDate), "ago");
              } else {
                outList.push(
                  NOVA.dateFormat.apply(publishedDate, [
                    user_settings.video_date_format,
                  ]),
                );
              }
            }

            if (outList.length) {
              insertToHTML({ text: outList.join(" "), container: container });

              if (window?.sessionStorage) {
                sessionStorage.setItem(
                  CACHE_PREFIX + videoId,
                  JSON.stringify({
                    date: outList.join(" "),
                    format: user_settings.video_date_format,
                  }),
                );
              }
            }
          });
        });

      function insertToHTML({ text = "", container = required() }) {
        if (!(container instanceof HTMLElement)) {
          console.error("Container is not an HTMLElement:", container);
          return;
        }

        (
          document.getElementById(DATE_SELECTOR_ID) ||
          (() => {
            const el = document.createElement("span");
            el.id = DATE_SELECTOR_ID;
            el.classList.add("style-scope", "yt-formatted-string", "bold");

            Object.assign(el.style, {
              "font-size": "1.35rem",
              "line-height": "2rem",
              "font-weight": 400,
            });
            container.after(el);

            return el;
          })()
        ).textContent = text;
      }
    }
  },
  options: {
    video_view_count: {
      _tagName: "select",

      label: "Views count format",

      options: [
        { label: "disable", value: false },
        { label: "9.9K", value: "abbr", selected: true },
        { label: "9,999", value: "friendly" },
      ],
    },
    video_date_format: {
      _tagName: "select",
      label: "Date pattern",

      options: [
        { label: "ago", value: "ago" },
        { label: "January 20, 1999", value: "MMMM D, YYYY" },
        { label: "20 Jan 1999", value: "D MMM YYYY" },
        {
          label: "20 Jan 1999 at 23:59",
          value: "D MMM YYYY at H:mm",
          selected: true,
        },
        { label: "Mon 20/01/1999 23:59", value: "DDD DD/MM/YYYY H:mm" },
        { label: "Monday 20/01/1999 23:59", value: "DDDD DD/MM/YYYY H:mm" },
        { label: "1999/01/20", value: "YYYY/MM/DD" },
        { label: "1999/01/20 at 23:59", value: "YYYY/MM/DD at H:mm" },
        { label: "1999-01-20", value: "YYYY-MM-D" },
        { label: "1999-01-20 at 23:59", value: "YYYY-MM-D at H:mm" },
        { label: "1999.1.20", value: "YYYY.M.D" },
        { label: "1999.1.20 at 23:59", value: "YYYY.M.D at H:mm" },
        { label: "01/20/1999", value: "MM/DD/YYYY" },
        { label: "01/20/1999 at 23:59", value: "MM/DD/YYYY at H:mm" },
        { label: "01-20-1999", value: "MM-D-YYYY" },
        { label: "01-20-1999 at 23:59", value: "MM-D-YYYY at H:mm" },
        { label: "01.20.1999", value: "MM.D.YYYY" },
        { label: "01.20.1999 at 23:59", value: "MM.D.YYYY at H:mm" },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "redirect-disable",
  title: "Clear links from redirect",

  "title:pl": "Wyczyść linki z przekierowań",

  run_on_pages: "watch, channel",
  section: "details",
  desc: "Direct external links",
  "desc:zh": "直接链接到外部站点",
  "desc:ja": "外部サイトへの直接リンク",

  "desc:pl": "Bezpośrednie łącza zewnętrzne",

  _runtime: (user_settings) => {
    document.addEventListener(
      "click",
      (evt) => evt.isTrusted && patchLink(evt.target),
      { capture: true },
    );

    document.addEventListener(
      "auxclick",
      (evt) => evt.isTrusted && evt.button === 1 && patchLink(evt.target),
      { capture: true },
    );

    const linkSelector = 'a[href*="/redirect?"]';

    function patchLink(target = required()) {
      if (!target.matches(linkSelector)) {
        if (!(target = target.parentElement.matches(linkSelector))) return;
      }

      if ((q = NOVA.queryURL.get("q", target.href))) {
        target.href = decodeURIComponent(q);
      }
    }
  },
});

window.nova_plugins.push({
  id: "description-timestamps-scroll",

  title: "Disable scroll to top on click timestamps",

  "title:pl": "Brak przejścia do odtwarzacza na znacznikach czasu",

  run_on_pages: "watch, -mobile",
  section: "details",
  desc: "Disable scrolling to player when clicking on timestamps",

  "desc:pl":
    "Wyłącza przewijanie do odtwarzacza podczas klikania znaczników czasu",

  _runtime: (user_settings) => {
    if (user_settings["description-dropdown"]) return;

    document.addEventListener(
      "click",
      (evt) => {
        if (!evt.isTrusted || !evt.target.matches('a[href*="&t="]')) return;

        if ((sec = parseInt(NOVA.queryURL.get("t", evt.target.href)))) {
          evt.preventDefault();
          evt.stopPropagation();

          movie_player.seekTo(sec);
        }
      },
      { capture: true },
    );
  },
});
window.nova_plugins.push({
  id: "transcript",
  title: "Show transcript",

  run_on_pages: "watch, -mobile",

  section: "details-buttons",

  _runtime: (user_settings) => {
    const BTN_SELECTOR_ID = "nova-transcript-button",
      BTN_SELECTOR = "#" + BTN_SELECTOR_ID;

    NOVA.runOnPageLoad(async () => {
      if (NOVA.currentPage != "watch") return;

      if (await NOVA.storage_obj_manager.getParam("transcript")) {
        NOVA.waitSelector(BTN_SELECTOR, {
          destroy_after_page_leaving: true,
        }).then((btn) => {
          btn.style.display = "flex";
          switch (user_settings.transcript_visibility_mode) {
            case "button":
              transcriptExpand();
              break;

            case "external":
          }
        });
        return;
      }

      switch (user_settings.transcript_visibility_mode) {
        case "expand":
          NOVA.waitSelector(
            '[target-id="engagement-panel-searchable-transcript"][visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"]',
            { destroy_after_page_leaving: true },
          ).then((transcriptEl) => {
            transcriptEl.setAttribute(
              "visibility",
              "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
            );
          });

          break;

        default:
          NOVA.waitSelector(BTN_SELECTOR, {
            destroy_after_page_leaving: true,
          }).then((btn) => {
            btn.style.display = document.body.querySelector(
              '#description ytd-video-description-transcript-section-renderer button, [target-id="engagement-panel-searchable-transcript"]',
            )
              ? "flex"
              : "none";
          });
          break;
      }
    });

    switch (user_settings.transcript_visibility_mode) {
      case "button":
        NOVA.waitSelector(
          "ytd-watch-metadata #actions #top-level-buttons-computed",
        ).then((container) => {
          insertToHTML({
            container: container,
            position: "beforebegin",
          }).addEventListener("click", transcriptExpand);
        });
        break;

      case "external":
    }

    function transcriptExpand() {
      if (
        (btn = document.body.querySelector(
          "#description ytd-video-description-transcript-section-renderer button",
        ))
      ) {
        btn.click();
      } else if (
        (transcriptEl = document.body.querySelector(
          '[target-id="engagement-panel-searchable-transcript"][visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"]',
        ))
      ) {
        transcriptEl.setAttribute(
          "visibility",
          "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
        );
      }
    }

    function insertToHTML({
      container = required(),
      position = "beforebegin",
    }) {
      if (!(container instanceof HTMLElement)) {
        console.error("Container is not an HTMLElement:", container);
        return;
      }

      return (
        document.getElementById(BTN_SELECTOR_ID) ||
        (function () {
          NOVA.css.push(
            `${BTN_SELECTOR} {
                  border: 0;
                  cursor: pointer;
                  text-decoration: none;
                  font-weight: bold;
                  margin: 0 var(--ytd-subscribe-button-margin, 12px);
              }`,
          );

          container.insertAdjacentHTML(
            position,
            NOVA.createSafeHTML(
              `<button id="${BTN_SELECTOR_ID}" style="display:flex" title="Show Transcript" class="style-scope yt-formatted-string bold yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m">
                  <span class="yt-spec-button-shape-next__icon" style="height:100%">
                     <svg viewBox="0 0 24 24" height="100%" width="100%">
                        <g fill="currentColor">
                           <path d="M20 12V13C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13V12M12 17C9.79086 17 8 15.2091 8 13V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V13C16 15.2091 14.2091 17 12 17Z" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                     </svg>
                  </span>
                  <span class="yt-spec-button-shape-next__button-text-content" style="align-self:center;">Transcript</span>
               </button>`,
            ),
          );
          return document.getElementById(BTN_SELECTOR_ID);
        })()
      );
    }
  },
  options: {
    transcript_visibility_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "expand default section",
          selected: true,
        },
        {
          label: "add button",
          value: "button",
        },
        {
          label: "link to external",
          value: "external",
        },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "auto-likes",
  title: "Auto-like",

  run_on_pages: "watch, -mobile",

  section: "details-buttons",

  _runtime: (user_settings) => {
    if (
      user_settings["details-buttons"] &&
      (user_settings.details_buttons_hide?.includes("all") ||
        user_settings.details_buttons_hide.includes("like_dislike"))
    ) {
      return;
    }
    const SELECTOR_LIKE_BTN =
      "ytd-watch-metadata #actions like-button-view-model button";

    NOVA.waitSelector("#movie_player video").then((video) => {
      video.addEventListener("loadeddata", () => {
        if (
          user_settings.auto_likes_for_subscribed ||
          movie_player.getVideoData().isLive
        ) {
          Timer.disable = true;
        } else Timer.reset.bind(Timer);
      });
      video.addEventListener(
        "playing",
        Timer.start.bind(Timer, video.playbackRate),
      );
      video.addEventListener("pause", Timer.pause.bind(Timer));

      video.addEventListener("timeupdate", function () {
        if (Timer.disable || isNaN(this.duration)) return;

        if (
          +Timer.progressTime / this.duration >
          (Math.trunc(user_settings.auto_likes_percent) / 100 || 0.8)
        ) {
          Timer.disable = true;
          setLike();
          NOVA.showOSD({
            message: "Auto-like is activation",
            source: "auto-likes",
          });
        }
      });
    });

    NOVA.runOnPageLoad(async () => {
      if (NOVA.currentPage != "watch") return;

      NOVA.waitSelector(`${SELECTOR_LIKE_BTN}[aria-pressed="true"]`, {
        destroy_after_page_leaving: true,
      }).then(() => {
        if (Timer.disable) return;

        Timer.disable = true;
        NOVA.showOSD({
          message: "Auto-like is deactivated",
          source: "auto-likes",
        });
      });

      if (user_settings.auto_likes_for_subscribed) {
        NOVA.waitSelector("#subscribe-button [subscribed]", {
          destroy_after_page_leaving: true,
        }).then(() => {
          Timer.disable = false;
          NOVA.showOSD({
            message: "Auto-like is enable",
            source: "auto-likes",
          });
        });
      }
    });

    function setLike() {
      const likeBtn = document.body.querySelector(SELECTOR_LIKE_BTN);

      if (!isLiked()) likeBtn.click();

      function isLiked() {
        return likeBtn.getAttribute("aria-pressed") == "true";
      }
    }

    const Timer = {
      progressTime: 0,

      start(delta = 1) {
        if (this.disable) return;
        this.timer = setInterval(function () {
          Timer.progressTime += 1 * delta;
        }, 1000);
      },

      pause() {
        if (typeof this.timer === "number") clearInterval(this.timer);
      },

      reset() {
        this.disable = false;
        this.progressTime = 0;
      },
    };
  },
  options: {
    auto_likes_percent: {
      _tagName: "input",
      label: "Watch threshold in %",

      "label:pl": "Próg oglądania w%",

      type: "number",
      title: "10-90%",
      title: "Percentage of views at which a video is liked",

      placeholder: "%",
      step: 5,
      min: 10,
      max: 90,
      value: 80,
    },
    auto_likes_for_subscribed: {
      _tagName: "input",
      label: "Only for subscribed",

      type: "checkbox",
    },
  },
});

window.nova_plugins.push({
  id: "description-dropdown",
  title: "Dropdown description",

  run_on_pages: "watch, -mobile",
  section: "details",

  "plugins-conflict": "description-timestamps-scroll",

  _runtime: (user_settings) => {
    const DESCRIPTION_SELECTOR =
        "html:not(:fullscreen) ytd-watch-metadata #description.ytd-watch-metadata:not([hidden]):not(:empty)",
      DATE_SELECTOR_ID = "nova-description-date";

    NOVA.waitSelector("#masthead-container").then((masthead) => {
      NOVA.css.push(
        `${DESCRIPTION_SELECTOR},
               ${DESCRIPTION_SELECTOR}:before {
                  position: fixed;
                  top: ${masthead.offsetHeight || 56}px;
                  right: 0;
                  z-index: ${1 + Math.max(getComputedStyle(masthead || movie_player)["z-index"], 601)};
               }


               ${DESCRIPTION_SELECTOR}:not(:hover):before {


                  content: "info ▽";
                  cursor: pointer;
                  visibility: visible;

                  right: 12.5em;
                  padding: 0 8px 2px;
                  line-height: normal;
                  font-family: Roboto, Arial, sans-serif;
                  font-size: 11px;
                  color: #eee;
                  background-color: rgba(0, 0, 0, .3);
               }


               ${DESCRIPTION_SELECTOR} {
                  margin: 0 1%;
                  overflow-y: auto;
                  max-height: 88vh;
                  max-width: 55%;
                  background-color: var(--yt-spec-brand-background-primary);
                  background-color: var(--yt-spec-menu-background);
                  background-color: var(--yt-spec-raised-background);
                  color: var(--yt-spec-text-primary);;
                  border: 1px solid #333;
                  ${user_settings["square-avatars"] ? "border-radius: 0" : ""};
               }

               ${DESCRIPTION_SELECTOR}:not(:hover) {
                  visibility: collapse;
                  overflow: hidden;
               }


               ${DESCRIPTION_SELECTOR}:hover {
                  visibility: visible !important;
               }


               ${DESCRIPTION_SELECTOR}::-webkit-scrollbar {
                  height: 8px;
                  width: 10px;
               }

               ${DESCRIPTION_SELECTOR}::-webkit-scrollbar-button {
                  height: 0;
                  width: 0;
               }

               ${DESCRIPTION_SELECTOR}::-webkit-scrollbar-corner {
                  background-color: transparent;
               }

               ${DESCRIPTION_SELECTOR}::-webkit-scrollbar-thumb {
                  background-color: #e1e1e1;
                  border: 0;
                  border-radius: 0;
               }

               ${DESCRIPTION_SELECTOR}::-webkit-scrollbar-track {
                  background-color: #666;
                  border: 0;
                  border-radius: 0;
               }

               ${DESCRIPTION_SELECTOR}::-webkit-scrollbar-track:hover {
                  background-color: #666;
               }`,
      );
    });

    NOVA.waitSelector(DESCRIPTION_SELECTOR).then((descriptionEl) => {
      descriptionEl.addEventListener("mouseenter", (evt) => {
        document.body
          .querySelector(
            "#meta [collapsed] #more, [description-collapsed] #description #expand",
          )
          ?.click();
      });
    });

    if (!user_settings["video-date-format"]) {
      NOVA.runOnPageLoad(
        () => NOVA.currentPage == "watch" && restoreDateLine(),
      );
    }

    let oldDateText;
    function restoreDateLine() {
      NOVA.waitSelector("#title h1").then((container) => {
        NOVA.waitSelector(
          "ytd-watch-metadata #description.ytd-watch-metadata",
        ).then(async (textDateEl) => {
          await NOVA.waitUntil(() => {
            if (
              (text = [
                ...textDateEl.querySelectorAll(
                  "span.bold.yt-formatted-string:not(:empty)",
                ),
              ]

                .map((e) => e.textContent)

                ?.join("")
                .trim()) &&
              text != oldDateText
            ) {
              oldDateText = text;

              insertToHTML({ text: oldDateText, container: container });
              return true;
            }
          }, 1000);
        });
      });

      function insertToHTML({ text = "", container = required() }) {
        if (!(container instanceof HTMLElement)) {
          console.error("Container is not an HTMLElement:", container);
          return;
        }

        (
          document.getElementById(DATE_SELECTOR_ID) ||
          (function () {
            const el = document.createElement("span");
            el.id = DATE_SELECTOR_ID;
            el.classList.add("style-scope", "yt-formatted-string", "bold");

            Object.assign(el.style, {
              "font-size": "1.35rem",
              "line-height": "2rem",
              "font-weight": 400,
            });
            container.after(el);

            return el;
          })()
        ).textContent = text;
      }
    }
  },
});
window.nova_plugins.push({
  id: "description-expand",
  title: "Expand description",

  "title:pl": "Rozwiń opis",

  run_on_pages: "watch, -mobile",

  section: "details",
  desc: "on hover",

  "plugins-conflict":
    "description-dropdown, comments-sidebar-position-exchange",
  _runtime: (user_settings) => {
    if (user_settings["description-dropdown"]) return;
    if (user_settings["comments-sidebar-position-exchange"]) return;

    const SELECTOR_BTN = "[description-collapsed] #description #expand";

    switch (user_settings.description_expand_mode) {
      case "onhover":
        NOVA.waitSelector(SELECTOR_BTN).then((btn) =>
          btn.addEventListener("mouseenter", btn.click),
        );
        break;

      case "always":
        document.addEventListener("yt-page-data-updated", expandSection);

        function expandSection() {
          if (NOVA.currentPage == "watch") {
            document.body.querySelector(SELECTOR_BTN)?.click();
          }
        }

        break;
    }
  },
  options: {
    description_expand_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "always",
          value: "always",
          selected: true,

          "label:pl": "zawsze",
        },
        {
          label: "on hover",
          value: "onhover",

          "label:pl": "po najechaniu",
        },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "save-to-playlist",
  title: 'Add sort/filter to "Save to playlist" menu',

  "title:pl": "Dodaj sortowanie/filtr do menu „Zapisz na liście odtwarzania”.",

  run_on_pages: "home, feed, results, channel, watch, -mobile",
  section: "details-buttons",

  _runtime: (user_settings) => {
    NOVA.waitSelector("tp-yt-paper-dialog #playlists").then((playlists) => {
      const container = playlists.closest("tp-yt-paper-dialog");

      new IntersectionObserver(([entry]) => {
        const searchInput = container.querySelector("input[type=search]");

        if (entry.isIntersecting) {
          if (user_settings.save_to_playlist_sort) sortPlaylistsMenu(playlists);

          if (!searchInput) {
            insertFilterInput(
              document.body.querySelector(
                "ytd-add-to-playlist-renderer #header ytd-menu-title-renderer",
              ),
            );
          }
        } else if (searchInput) {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("change"));
        }
      }).observe(container);
    });

    function sortPlaylistsMenu(playlists = required()) {
      if (!(playlists instanceof HTMLElement))
        return console.error("playlists not HTMLElement:", playlists);

      playlists.append(...Array.from(playlists.childNodes).sort(sortByLabel));

      function sortByLabel(a, b) {
        const getLabel = (el) => el.innerText.trim();

        return stringLocaleCompare(getLabel(a), getLabel(b));

        function stringLocaleCompare(a = required(), b = required()) {
          return a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }
      }
    }

    function insertFilterInput(container = required()) {
      if (!(container instanceof HTMLElement)) {
        console.error("Container is not an HTMLElement:", container);
        return;
      }

      const searchInput = document.createElement("input");
      searchInput.setAttribute("type", "search");
      searchInput.setAttribute("placeholder", "Playlists Filter");

      Object.assign(searchInput.style, {
        padding: ".4em .6em",
        border: 0,
        outline: 0,

        "min-width": "250px",
        width: "100%",
        height: "2.5em",
        color: "var(--ytd-searchbox-text-color)",
        "background-color": "var(--ytd-searchbox-background)",
      });
      ["change", "keyup"].forEach((evt) => {
        searchInput.addEventListener(evt, function () {
          NOVA.searchFilterHTML({
            keyword: this.value,

            search_selectors: "#playlists #checkbox",

            filter_selector: "#label",
          });
        });
      });

      searchInput.addEventListener("dblclick", () => {
        searchInput.value = "";
        searchInput.dispatchEvent(new Event("change"));
      });

      const containerDiv = document.createElement("div");

      Object.assign(containerDiv.style, {
        "margin-top": ".5em",
        display: "flex",
        gap: "10px",
      });

      if (!user_settings.save_to_playlist_sort) {
        const sortBtn = document.createElement("button");
        sortBtn.textContent = "A-Z ↓";

        Object.assign(sortBtn.style, {
          padding: ".4em .6em",
          border: 0,
          outline: 0,
          "border-radius": "4px",
          color: "var(--ytd-searchbox-text-color)",
          "background-color": "var(--ytd-searchbox-background)",
          "white-space": "nowrap",
          cursor: "pointer",
        });

        sortBtn.addEventListener(
          "click",
          () => {
            sortBtn.remove();
            sortPlaylistsMenu(
              document.body.querySelector("tp-yt-paper-dialog #playlists"),
            );
          },
          { capture: true, once: true },
        );

        containerDiv.append(sortBtn);
      }

      containerDiv.append(searchInput);
      container.append(containerDiv);
    }
  },
  options: {
    save_to_playlist_sort: {
      _tagName: "input",
      label: "Default sorting alphabetically",

      "label:pl": "Domyślne sortowanie alfabetyczne",

      type: "checkbox",
    },
  },
});

//www.youtube.com/watch?v=eB6txyhHFG4 - many dislike count

https: window.nova_plugins.push({
  id: "return-dislike",
  title: "Show dislike count",

  run_on_pages: "watch, -mobile",

  section: "details-buttons",

  desc: "via by returnyoutubedislike.com",

  _runtime: (user_settings) => {
    if (
      user_settings.details_buttons_label_hide ||
      user_settings.details_buttons_hide?.includes("like_dislike")
    ) {
      return;
    }

    const CACHE_PREFIX = "nova-dislikes-count:",
      SELECTOR_ID = "nova-dislikes-count";

    NOVA.waitSelector("#actions dislike-button-view-model button", {
      destroy_after_page_leaving: true,
    }).then((el) => setDislikeCount(el));

    NOVA.runOnPageLoad(() => {
      if (NOVA.currentPage != "watch") return;

      document.addEventListener("yt-action", dislikeIsUpdated);
    });

    function dislikeIsUpdated(evt) {
      if (NOVA.currentPage != "watch") return;

      switch (evt.detail?.actionName) {
        case "yt-set-active-panel-item-action":
        case "yt-reload-continuation-items-command":
          document.removeEventListener("yt-action", dislikeIsUpdated);

          NOVA.waitSelector("#actions dislike-button-view-model button", {
            destroy_after_page_leaving: true,
          }).then((el) => setDislikeCount(el));
          break;
      }
    }

    async function setDislikeCount(container = required()) {
      const videoId =
        NOVA.queryURL.get("v") || movie_player.getVideoData().video_id;
      if (!videoId)
        return console.error("return-dislike videoId: empty", videoId);

      container.style.width = "auto";

      if ((storage = sessionStorage.getItem(CACHE_PREFIX + videoId))) {
        insertToHTML({ data: JSON.parse(storage), container: container });
      } else if ((data = await getDislikeCount())) {
        insertToHTML({ data: data, container: container });
      }

      async function getDislikeCount() {
        const videoId =
          NOVA.queryURL.get("v") || movie_player.getVideoData().video_id;

        const fetchAPI = () =>
          NOVA.fetch(
            `https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`,
            {
              method: "GET",

              headers: { "Content-Type": "application/json" },
            },
          )
            .then((response) => response.json())

            .then(
              (json) =>
                json.dislikes && { likes: json.likes, dislikes: json.dislikes },
            )
            .catch((error) => {});

        if ((result = await fetchAPI())) {
          sessionStorage.setItem(
            CACHE_PREFIX + videoId,
            JSON.stringify(result),
          );
          return result;
        }
      }

      function insertToHTML({ data = required(), container = required() }) {
        if (!(container instanceof HTMLElement)) {
          console.error("Container is not an HTMLElement:", container);
          return;
        }

        const percent = Math.trunc(
          (data.dislikes * 100) / (data.likes + data.dislikes),
        );
        const text = `${NOVA.numberFormat.abbr(data.dislikes)} (${percent}%)`;

        (
          document.getElementById(SELECTOR_ID) ||
          (function () {
            const el = document.createElement("span");
            el.id = SELECTOR_ID;
            el.classList.add("style-scope", "yt-formatted-string", "bold");

            Object.assign(el.style, {
              "text-overflow": "ellipsis",
              overflow: "visible",
              "white-space": "nowrap",
              "padding-left ": "3px",
            });
            return container.appendChild(el);
          })()
        ).textContent = text;

        container.title = text;
      }
    }
  },
});
window.nova_plugins.push({
  id: "video-title-hashtag",
  title: "Title hashtag",

  run_on_pages: "watch",
  section: "details",

  _runtime: (user_settings) => {
    let cssObj = {};

    switch (user_settings.title_hashtag_visibility_mode) {
      case "uncolorize":
        cssObj["color"] =
          "var(--yt-endpoint-color, var(--yt-spec-text-primary))";
        break;

      default:
        cssObj["display"] = "none";
        break;
    }

    if (Object.keys(cssObj).length) {
      NOVA.css.push(cssObj, 'h1 a[href*="/hashtag/"]', "important");
      NOVA.css.push(cssObj, 'h1 a[href*="/@"]', "important");
    }
  },
  options: {
    title_hashtag_visibility_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "hide",
          selected: true,
        },
        {
          label: "uncolorize",
          value: "uncolorize",
        },
      ],
    },
  },
});

window.nova_plugins.push({
  id: "ad-state",
  title: "Show Ads info",

  run_on_pages: "watch, -mobile",
  restart_on_location_change: true,
  section: "details",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-monetization";

    NOVA.waitSelector("#title h1", { destroy_after_page_leaving: true }).then(
      (el) => {
        if (
          (playerResponse = document
            .getElementById("page-manager")
            ?.getCurrentData()?.playerResponse)
        ) {
          let text = [];
          if (playerResponse?.paidContentOverlay) text.push("Sponsored");

          if ((adCount = playerResponse?.adPlacements?.length))
            text.push(`Ads count ${adCount}`);

          if (text.length)
            insertToHTML({ text: `「${text.join(", ")}」`, container: el });
        }
      },
    );

    function insertToHTML({ text = "", container = required() }) {
      if (!(container instanceof HTMLElement)) {
        console.error("Container is not an HTMLElement:", container);
        return;
      }

      (
        document.getElementById(SELECTOR_ID) ||
        (() => {
          const el = document.createElement("span");
          el.id = SELECTOR_ID;
          el.classList.add("style-scope", "yt-formatted-string", "bold");

          Object.assign(el.style, {
            "font-size": "1.35rem",
            "line-height": "2rem",
            margin: "10px",
          });
          container.after(el);

          return el;
        })()
      ).textContent = text;
    }
  },
});

window.nova_plugins.push({
  id: "channel-videos-count",
  title: "Show channel videos count",

  "title:pl": "Pokaż liczbę filmów na kanale",

  run_on_pages: "watch, -mobile",
  restart_on_location_change: true,
  section: "details",
  opt_api_key_warn: true,
  desc: "Display uploaded videos on channel",
  "desc:zh": "在频道上显示上传的视频",
  "desc:ja": "アップロードした動画をチャンネルに表示",

  "desc:pl": "Wyświetla przesłane filmy na kanale",

  _runtime: (user_settings) => {
    const CACHE_PREFIX = "nova-channel-videos-count:",
      SELECTOR_ID = "nova-video-count";

    NOVA.waitSelector(
      "#upload-info #owner-sub-count, ytm-slim-owner-renderer .subhead",
      { destroy_after_page_leaving: true },
    ).then((el) => setVideoCount(el));

    async function setVideoCount(container = required()) {
      await NOVA.delay(500);

      const channelId = NOVA.getChannelId(user_settings["user-api-key"]);
      if (!channelId)
        return console.error("setVideoCount channelId: empty", channelId);

      if (
        window?.sessionStorage &&
        (storage = sessionStorage.getItem(CACHE_PREFIX + channelId))
      ) {
        insertToHTML({ text: storage, container: container });
      } else {
        NOVA.request
          .API({
            request: "channels",
            params: { id: channelId, part: "statistics" },
            api_key: user_settings["user-api-key"],
          })
          .then((res) => {
            if (res?.error)
              return alert(`Error [${res.code}]: ${res.reason}\n` + res.error);

            res?.items?.forEach((item) => {
              if (
                (videoCount = NOVA.numberFormat.abbr(
                  item.statistics.videoCount,
                ))
              ) {
                insertToHTML({ text: videoCount, container: container });

                if (window?.sessionStorage)
                  sessionStorage.setItem(CACHE_PREFIX + channelId, videoCount);
              } else console.warn("API is change", item);
            });
          });
      }

      function insertToHTML({ text = "", container = required() }) {
        if (!(container instanceof HTMLElement)) {
          console.error("Container is not an HTMLElement:", container);
          return;
        }

        (
          document.getElementById(SELECTOR_ID) ||
          (function () {
            const outerSpan = document.createElement("span");
            outerSpan.classList.add(
              "date",
              "style-scope",
              "ytd-video-secondary-info-renderer",
            );
            outerSpan.style.marginRight = "5px";

            const innerSpan = document.createElement("span");
            innerSpan.id = SELECTOR_ID;
            innerSpan.textContent = text;

            outerSpan.append(document.createTextNode(" • "), innerSpan);
            container.append(outerSpan);

            return innerSpan;
          })()
        ).textContent = text;

        container.title = `${text} videos`;
      }
    }
  },
});
window.nova_plugins.push({
  id: "header-compact",
  title: "Header compact",

  "title:pl": "Kompaktowy nagłówek",

  run_on_pages: "*, -embed, -mobile, -live_chat",
  section: "header",

  _runtime: (user_settings) => {
    const height = "36px";

    NOVA.css.push(
      `#masthead #container.ytd-masthead {
            max-height: ${height} !important;
         }


         #masthead #background {
            max-height: ${height} !important;
         }

         #search-form, #search-icon-legacy {
            max-height: ${height} !important;
         }

         body,
         html:not(:fullscreen) #page-manager {
            --ytd-masthead-height: ${height};
         }

         #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
            --ytd-rich-grid-chips-bar-top: ${height};
         }`,
    );
  },
});
window.nova_plugins.push({
  id: "subscriptions-home",
  title: "Redirect from home page to subscriptions page",

  "title:pl": "Przekieruj ze strony głównej na stronę subskrypcji",

  run_on_pages: "home",
  restart_on_location_change: true,
  section: "header",

  "plugins-conflict": "page-logo",
  _runtime: (user_settings) => {
    location.pathname = "/feed/subscriptions";
  },
});
window.nova_plugins.push({
  id: "page-logo",

  title: "YouTube logo link",

  run_on_pages: "*, -embed, -mobile, -live_chat",
  section: "header",

  _runtime: (user_settings) => {
    NOVA.waitSelector("#masthead a#logo", {
      destroy_after_page_leaving: true,
    }).then(async (a) => {
      if ((link = new URL(user_settings.page_logo_url_mode)?.href)) {
        a.href = link;

        await NOVA.waitUntil(
          () => a.data?.commandMetadata?.webCommandMetadata?.url,
          1500,
        );

        a.data.commandMetadata.webCommandMetadata.url = link;
      }
    });
  },
  options: {
    page_logo_url_mode: {
      _tagName: "input",
      label: "URL",
      type: "url",
      pattern: "https://.*",

      placeholder: "https://youtube.com/...",
      value: "https://youtube.com/feed/subscriptions",
    },
  },
});
window.nova_plugins.push({
  id: "search-query",
  title: "Search filter",

  "title:pl": "Filtry wyszukiwania",

  run_on_pages: "results",
  restart_on_location_change: true,
  section: "header",

  _runtime: (user_settings) => {
    if (
      !NOVA.queryURL.has("sp") &&
      (sp = user_settings.search_query_date || user_settings.search_query_sort)
    ) {
      location.href = NOVA.queryURL.set({ sp: sp });
    }
  },
  options: {
    search_query_sort: {
      _tagName: "select",
      label: "Sort by",

      "label:pl": "Sortuj według",

      options: [
        {
          label: "relevance",
          value: false,
          selected: true,
        },
        {
          label: "upload date",
          value: "cai%253d",
        },
        {
          label: "view count",
          value: "cam%253d",
        },
        {
          label: "rating",
          value: "cae%253d",
        },
      ],
      "data-dependent": { search_query_date: false },
    },
    search_query_date: {
      _tagName: "select",
      label: "Upload date",

      "label:pl": "Data przesłania",

      options: [
        {
          label: "all time",
          value: false,
          selected: true,
        },
        {
          label: "last hour",
          value: "egiiaq%253d%253d",
        },
        {
          label: "today",
          value: "egiiag%253d%253d",
        },
        {
          label: "this week",
          value: "egiiaw%253d%253d",
        },
        {
          label: "this month",
          value: "egiiba%253d%253d",
        },
        {
          label: "this year",
          value: "egiibq%253d%253d",
        },
      ],
      "data-dependent": { search_query_sort: false },
    },
  },
});
window.nova_plugins.push({
  id: "header-unfixed",
  title: "Header unpinned",

  "title:pl": "Przewijany nagłówek",

  run_on_pages: "*, -embed, -mobile, -live_chat",

  section: "header",
  desc: "Prevent header from sticking",
  "desc:zh": "防止头部粘连",
  "desc:ja": "ヘッダーがくっつくのを防ぎます",

  "desc:pl": "Nagłówek będzie przewijany wraz ze stroną",

  _runtime: (user_settings) => {
    const CLASS_NAME_TOGGLE = "nova-header-unfixed",
      SELECTOR = "html." + CLASS_NAME_TOGGLE;

    NOVA.css.push(
      `${SELECTOR} #masthead-container {
            position: absolute !important;
         }
         ${SELECTOR} #chips-wrapper {
            position: sticky !important;
         }
         ${SELECTOR} #header {
            margin-top: 0 !important;
         }`,
    );

    document.documentElement.classList.add(CLASS_NAME_TOGGLE);

    if (user_settings.header_unfixed_hotkey) {
      const hotkey = user_settings.header_unfixed_hotkey || "KeyV";

      document.addEventListener("keyup", (evt) => {
        if (NOVA.editableFocused(evt.target)) return;

        if ((hotkey.length === 1 ? evt.key : evt.code) === hotkey) {
          document.documentElement.classList.toggle(CLASS_NAME_TOGGLE);
        }
      });
    }

    if (user_settings.header_unfixed_scroll) {
      insertArrowButton();

      document.addEventListener("yt-action", (evt) => {
        switch (evt.detail?.actionName) {
          case "yt-store-grafted-ve-action":
          case "yt-open-popup-action":
            scrollAfter();
            break;
        }
      });

      function scrollAfter() {
        if (
          (masthead = document.getElementById("masthead")) &&
          (topOffset = masthead.offsetHeight) &&
          NOVA.isInViewport(masthead)
        ) {
          window.scrollTo({ top: topOffset });
        }
      }

      function insertArrowButton() {
        const scrollDownButton = document.createElement("button");

        scrollDownButton.append(
          (function createSvgIcon() {
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("viewBox", "0 0 16 16");
            svg.setAttribute("height", "100%");
            svg.setAttribute("width", "100%");

            const g = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g",
            );
            g.setAttribute("fill", "currentColor");

            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            path.setAttribute(
              "d",
              "M3.35 4.97 8 9.62 12.65 4.97l.71.71L8 11.03l-5.35-5.35.7-.71z",
            );

            g.append(path);
            svg.append(g);

            return svg;
          })(),
        );

        scrollDownButton.title = "Scroll down";

        Object.assign(scrollDownButton.style, {
          cursor: "pointer",
          "background-color": "transparent",
          color: "deepskyblue",
          border: "none",
          height: "3em",
        });
        scrollDownButton.addEventListener("click", scrollAfter);

        if ((endnode = document.getElementById("end"))) {
          endnode.parentElement.insertBefore(scrollDownButton, endnode);
        }
      }
    }
  },
  options: {
    header_unfixed_scroll: {
      _tagName: "input",
      label: "Scroll after header",

      "label:pl": "Przewiń nagłówek",

      type: "checkbox",
      title: "Makes sense on a small screen",

      "title:pl": "Przydatne na małym ekranie",
    },
    header_unfixed_hotkey: {
      _tagName: "select",
      label: "Hotkey toggle",

      options: [
        { label: "none", value: false },

        { label: "ShiftL", value: "ShiftLeft" },
        { label: "ShiftR", value: "ShiftRight" },
        { label: "CtrlL", value: "ControlLeft" },
        { label: "CtrlR", value: "ControlRight" },
        { label: "AltL", value: "AltLeft" },
        { label: "AltR", value: "AltRight" },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV", selected: true },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
    },
  },
});

const NOVA = {
  createSafeHTML(html = required()) {
    if (typeof html !== "string") {
      console.error("html is not a string:", typeof html, html);
      return;
    }
    if (typeof this.policy === "undefined") {
      this.policy =
        typeof trustedTypes !== "undefined"
          ? trustedTypes.createPolicy("nova-policy", {
              createHTML: (html) => html,
            })
          : null;
    }
    return this.policy ? this.policy.createHTML(html) : html;
  },

  waitSelector(selector = required(), limit_options = {}) {
    const {
      container = document.body || document,
      destroy_after_page_leaving,
      destroy_timeout = 0,
    } = limit_options;

    if (typeof selector !== "string") {
      console.error("selector is not a string:", selector);
      return;
    } else if (!CSS.supports("selector(:has(*))")) {
      console.warn('CSS ":has()" unsupported');
      return;
    }

    if (container !== document && !(container instanceof HTMLElement)) {
      console.error("container is not a HTMLElement:", limit_options);
      return;
    }

    if (destroy_timeout && !Number.isFinite(destroy_timeout)) {
      console.error("timeout must be a positive number:", destroy_timeout);
      return;
    }

    return new Promise((resolve, reject) => {
      if ((el = container.querySelector(selector))) {
        return resolve(el);
      }

      let waiting =
        document.hidden || !container.contains(document.activeElement);
      let destroyTimeout;

      const observerFactory = new MutationObserver(queryElement);

      observerFactory.observe(container, {
        childList: true,
        subtree: true,
      });

      if (destroy_timeout > 0) {
        destroyTimeout = setTimeout(() => {
          stopJob();
          return reject(`Element not found within ${destroy_timeout} seconds`);
        }, destroy_timeout * 1000);
      }

      if (destroy_after_page_leaving) {
        const prevURL = document.URL;
        window.addEventListener(
          "transitionend",
          () => {
            if (prevURL !== document.URL) {
              stopJob();
              return reject("Page changed before element was found");
            }
          },
          { capture: true, once: true },
        );
      }

      document.addEventListener("visibilitychange", handleVisibilityChange);

      function handleVisibilityChange() {
        waiting = document.hidden;
        queryElement();
      }

      function queryElement() {
        if (!waiting && document.readyState === "complete") {
          waiting = true;
          setTimeout(() => {
            const element = container.querySelector(selector);
            if (element) {
              stopJob();
              return resolve(element);
            } else {
              waiting = false;
            }
          }, 100);
        }
      }

      function stopJob() {
        observerFactory.disconnect();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        if (typeof destroyTimeout === "number") clearTimeout(destroyTimeout);
      }
    });
  },

  waitUntil(
    condition_fn = required(),
    check_period = 500,
    destroy_after = 60 * 1000,
  ) {
    if (typeof condition_fn !== "function") {
      console.error(
        "condition is not a function:",
        typeof condition_fn,
        condition_fn,
      );
      return Promise.reject(new Error("Condition function is required"));
    }

    if (!Number.isFinite(check_period)) {
      console.error("check_period must be a positive number:", check_period);
      return Promise.reject(new Error("Check period must be a finite number"));
    }

    if (!Number.isFinite(destroy_after)) {
      console.error("timeout must be a positive number:", destroy_after);
      return Promise.reject(
        new Error("Destroy timeout must be a finite number"),
      );
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkCondition = () => {
        try {
          const result = condition_fn();
          if (result !== undefined) {
            resolve(result);
          } else if (Date.now() - startTime > destroy_after * 1000) {
            reject(new Error("Timeout reached"));
          } else {
            setTimeout(checkCondition, check_period);
          }
        } catch (err) {
          reject(err);
        }
      };

      checkCondition();
    });
  },

  delay(ms = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  watchElements({
    selectors = required(),
    attr_mark,
    callback = required(),
    destroy_after_page_leaving = false,
  }) {
    if (!Array.isArray(selectors) && typeof selectors !== "string") {
      console.error(
        "selectors is not array/string:",
        typeof selectors,
        selectors,
      );
      return;
    }
    if (typeof callback !== "function") {
      console.error("callback is not a function:", typeof callback, callback);
      return;
    }

    if (typeof selectors === "string") selectors = [selectors];

    selectors = selectors.filter((selector) => {
      if (!CSS.supports(`selector(:has(*))`)) {
        console.error('CSS ":has()" unsupported', selector);
        return false;
      }
      return true;
    });

    if (!selectors.length) return;

    const container = document.body || document;

    let waiting =
      document.hidden || !container.contains(document.activeElement);
    let destroyTimeout;

    const observerFactory = new MutationObserver(queryElement);

    observerFactory.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    if (destroy_after_page_leaving) {
      const prevURL = document.URL;
      window.addEventListener(
        "transitionend",
        () => {
          if (prevURL !== document.URL) {
            stopJob();
            return reject("Page changed before element was found");
          }
        },
        { capture: true, once: true },
      );
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    function handleVisibilityChange() {
      waiting = document.hidden;
      queryElement();
    }

    function queryElement() {
      if (!waiting && document.readyState === "complete") {
        waiting = true;
        setTimeout(() => {
          selectors.forEach((selector) => {
            const selectorWithAttrMark = attr_mark
              ? `${selector}:not([${attr_mark}])`
              : selector;

            document.querySelectorAll(selectorWithAttrMark).forEach((el) => {
              if (attr_mark) {
                el.setAttribute(attr_mark, true);
              }

              callback(el);
            });
          });

          waiting = false;
        }, 100);
      }
    }

    function stopJob() {
      observerFactory.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (typeof destroyTimeout === "number") clearTimeout(destroyTimeout);
    }
  },

  runOnPageLoad(callback = required()) {
    if (typeof callback !== "function") {
      console.error("callback is not a function:", typeof callback, callback);
      return;
    }
    let prevURL = document.URL;

    if (!isURLChange()) callback();

    document.addEventListener(
      "yt-navigate-finish",
      () => isURLChange() && callback(),
    );

    function isURLChange() {
      return prevURL === document.URL ? false : (prevURL = document.URL);
    }
  },

  css: {
    push(css = required(), selector, is_important) {
      if (typeof css === "object") {
        if (!selector) {
          console.error("css is not a object:", typeof selector, selector);
          return;
        }

        const cssString = json2css(css);
        injectCss(`${selector} { ${cssString} }`);
      } else if (typeof css === "string") {
        injectCss(css);
      } else {
        console.error("CSS is not object/string:", typeof css, css);
        return;
      }

      function json2css(obj = required()) {
        if (typeof obj !== "object") {
          console.error("json2css argument is not a object:", typeof obj, obj);
          return;
        }
        let css = "";
        Object.entries(obj).forEach(([key, value]) => {
          css += `${key}:${value}${is_important ? " !important" : ""};`;
        });
        return css;
      }

      function injectCss(source = required()) {
        if (typeof source !== "string") {
          console.error("source is not a string:", source);
          return;
        }

        if (
          window.CSSStyleSheet &&
          window.CSSStyleSheet.prototype.replaceSync
        ) {
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(source);
          document.adoptedStyleSheets = [sheet, ...document.adoptedStyleSheets];
        } else if (document.head) {
          const sheetId = "NOVA-style";
          const sheet =
            document.getElementById(sheetId) || createStyleSheet(sheetId);

          sheet.textContent += "\n" + source.replace(/\n+\s{2,}/g, " ") + "\n";

          function createStyleSheet(id) {
            const style = document.createElement("style");
            style.type = "text/css";
            style.id = id;
            document.head.append(style);
            return style;
          }
        } else {
          const sheet =
            document.styleSheets[0] || document.createElement("style");
          sheet.insertRule(source, sheet.cssRules.length);
          document.head.append(sheet);
        }
      }
    },

    get(selector = required(), prop_name = required()) {
      const el =
        selector instanceof HTMLElement
          ? selector
          : document.body?.querySelector(selector);
      return el ? getComputedStyle(el).getPropertyValue(prop_name) : null;
    },
  },

  cookies: {
    get(name = required()) {
      if (!navigator.cookieEnabled) return;
      return (
        (match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))) &&
        decodeURIComponent(match[2])
      );
    },

    set(name = required(), value = "", days = 90) {
      if (!navigator.cookieEnabled) return;
      let expires = "";
      if (+days) {
        let date = new Date();
        date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
        expires = "; expires=" + date.toGMTString();
      }
      document.cookie =
        encodeURIComponent(name) +
        "=" +
        encodeURIComponent(value) +
        ";path=/" +
        expires;
    },
    delete(name) {
      if (!navigator.cookieEnabled) return;
      this.set(name, "", -1);
    },
    clear() {
      if (!navigator.cookieEnabled) return;
      for (const key in this.get()) {
        this.delete(key);
      }
      const domain = location.hostname.replace(/^www\./i, "");
      this.clearAllCookies(domain);
    },
    clearAllCookies(domain) {
      if (!navigator.cookieEnabled) return;

      let cookies = document.cookie.split("; ");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookies.indexOf("=");
        const name = eqPos > -1 ? cookies.substr(0, eqPos) : cookie;
        const cookieDomain = location.hostname.replace(/^www\./i, "");
        if (cookieDomain === domain || cookieDomain.endsWith("." + domain)) {
          document.cookie =
            name +
            `=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=${cookieDomain};path=/`;
        }
      }
    },

    parseQueryToObj(str) {
      return (
        str &&
        Object.fromEntries(
          str?.split(/&/).map((c) => {
            const [key, ...v] = c.split("=");
            return [key, decodeURIComponent(v.join("="))];
          }) || [],
        )
      );
    },
    updateParam({ key = required(), param = required(), value = required() }) {
      let paramsObj = this.getParamLikeObj(key) || {};

      if (paramsObj[param] != value) {
        paramsObj[param] = value;
        this.set(key, NOVA.queryURL.set(paramsObj).split("?").pop());
        location.reload();
      }
    },
  },

  isInViewport(el = required()) {
    if (!(el instanceof HTMLElement)) {
      console.error("el is not a HTMLElement:", typeof el, el);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (!rect) return;

    const { top, left, bottom, right } = rect;
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;

    return (
      top >= 0 && left >= 0 && bottom <= windowHeight && right <= windowWidth
    );
  },

  isVisible(el = required(), deeper = false) {
    if (!(el instanceof HTMLElement)) {
      console.error("el is not a HTMLElement:", typeof el, el);
      return;
    }

    if (isHidden(el)) {
      return false;
    }

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
      if (
        display === "none" ||
        visibility !== "visible" ||
        parseFloat(opacity) === 0
      ) {
        return true;
      }
    }
  },

  collapseElement({ selector = required(), label = required(), remove }) {
    if (typeof selector !== "string") {
      console.error("selector is not a string:", selector);
      return;
    }

    const selector_id = `${label.match(/[a-z]+/gi).join("")}-prevent-load-btn`;

    this.waitSelector(selector.toString()).then((el) => {
      if (remove) el.remove();
      else {
        if (document.getElementById(selector_id)) {
          return;
        }

        el.style.display = "none";

        const btn = document.createElement("a");
        btn.textContent = `Load ${label}`;
        btn.id = selector_id;
        btn.classList.add(
          "more-button",
          "style-scope",
          "ytd-video-secondary-info-renderer",
        );

        Object.assign(btn.style, {
          cursor: "pointer",
          "text-align": "center",
          "text-transform": "uppercase",
          display: "block",
          color: "var(--yt-spec-text-secondary)",
        });
        btn.addEventListener("click", () => {
          btn.remove();
          el.style.display = "inherit";
          window.dispatchEvent(new Event("scroll"));
        });
        el.before(btn);
      }
    });
  },

  aspectRatio: {
    sizeToFit({
      src_width = required(),
      src_height = required(),

      max_width = screen.width,
      max_height = screen.height,
    }) {
      const aspectRatio = Math.min(
        max_width / +src_width,
        max_height / +src_height,
        1,
      );
      return {
        width: +src_width * aspectRatio,
        height: +src_height * aspectRatio,
      };
    },

    getAspectRatio({ width = required(), height = required() }) {
      if (
        width == NOVA.videoElement?.videoWidth &&
        height == NOVA.videoElement?.videoHeight
      ) {
        width = Math.min(width, NOVA.videoElement?.clientWidtho);
        height = Math.min(height, NOVA.videoElement?.clientHeight);
      }

      const ASPECT_RATIO_TOLERANCE = 0.05;

      const maxDiff = Math.abs(width - height) / Math.max(width, height);
      const isTooCloseToSquare = maxDiff <= ASPECT_RATIO_TOLERANCE;

      if (isTooCloseToSquare) return "1:1";

      const gcd = (a, b) => (b ? gcd(b, a % b) : a),
        divisor = gcd(width, height),
        w = width / divisor,
        h = height / divisor;

      return w + ":" + h;
    },

    chooseAspectRatio({ width = required(), height = required(), layout }) {
      const acceptedRatioList = {
        landscape: {
          "1:1": 1,
          "3:2": 1.5,
          "4:3": 1.33333333333,
          "5:4": 1.25,
          "5:3": 1.66666666667,
          "16:9": 1.77777777778,
          "16:10": 1.6,
          "17:9": 1.88888888889,
          "21:9": 2.33333333333,
          "24:10": 2.4,
        },
        portrait: {
          "1:1": 1,
          "2:3": 0.66666666667,
          "3:4": 0.75,
          "3:5": 0.6,
          "4:5": 0.8,
          "9:16": 0.5625,
          "9:17": 0.5294117647,
          "9:21": 0.4285714286,
          "10:16": 0.625,
        },
      };
      return (
        choiceRatioFromList(this.getAspectRatio({ width, height })) ||
        acceptedRatioList.landscape["16:9"]
      );

      function choiceRatioFromList(ratio = required()) {
        const layout_ = layout || (ratio < 1 ? "portrait" : "landscape");
        return acceptedRatioList[layout_][ratio];
      }
    },

    calculateHeight: (width = required(), aspectRatio = 16 / 9) =>
      parseFloat((width / aspectRatio).toFixed(2)),
    calculateWidth: (height = required(), aspectRatio = 16 / 9) =>
      parseFloat((height * aspectRatio).toFixed(2)),
  },

  openPopup({
    url = required(),
    title = document.title,
    width = window.innerWidth,
    height = window.innerHeight,
    on_closed_callback,
  }) {
    let top = (left = 0);
    try {
      const parentWindow = window.opener || window.parent,
        zoom = getPageZoomLevel(),
        parentLeft = parentWindow.screenX || parentWindow.screenLeft || 0,
        parentTop = parentWindow.screenY || parentWindow.screenTop || 0,
        parentWidth =
          parentWindow.innerWidth ||
          parentWindow.document.documentElement.clientWidth,
        parentHeight =
          parentWindow.innerHeight ||
          parentWindow.document.documentElement.clientHeight;

      left = parentLeft + (parentWidth * zoom - width) / 2;
      top = parentTop + (parentHeight * zoom - height) / 2;
    } catch (err) {
      left = window.screen.width / 2 - width / 2;
      top = window.screen.height / 2 - height / 2;
    }

    const win = window.open(
      url,
      "_blank",
      `popup=1,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,copyhistory=no,width=${width},height=${height},top=${top},left=${left}`,
    );

    if (win.document) {
      win.document.title = title;
    }

    if (on_closed_callback && typeof on_closed_callback === "function") {
      const timer = setInterval(() => {
        if (win.closed) {
          clearInterval(timer);
          on_closed_callback();
        }
      }, 500);
    }

    function getPageZoomLevel() {
      try {
        return (parentWindow.outerWidth / parentWindow.innerWidth).toFixed(2);
      } catch (err) {
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;

        const clientWidth =
          document.documentElement.clientWidth || document.body.clientWidth;
        const clientHeight =
          document.documentElement.clientHeight || document.body.clientHeight;

        const zoomLevelWidth = (screenWidth / clientWidth).toFixed(2);
        const zoomLevelHeight = (screenHeight / clientHeight).toFixed(2);

        return Math.min(zoomLevelWidth, zoomLevelHeight);
      }
    }
  },

  showOSD({ message = "", ui_value, ui_max, source, fade_ms }) {
    document.dispatchEvent(
      new CustomEvent("nova-osd", {
        bubbles: true,
        detail: {
          message,
          ui_value,
          ui_max,
          source,
          fade_ms,
        },
      }),
    );

    triggerBezel.apply(this, [message]);

    function triggerBezel(text) {
      if (!text || !["watch", "embed"].includes(this.currentPage)) return;
      if (typeof this.fadeBezel === "number") clearTimeout(this.fadeBezel);

      const bezelEl = document.body.querySelector(".ytp-bezel-text");
      if (!bezelEl) return console.error(`showOSD ${text}=>${bezelEl}`);

      const bezelContainer = bezelEl.parentElement.parentElement,
        CLASS_VALUE = "ytp-text-root",
        SELECTOR = "." + CLASS_VALUE;

      if (!this.bezel_css_inited) {
        this.bezel_css_inited = true;
        this.css.push(
          `${SELECTOR} { display: block !important; }
               ${SELECTOR} .ytp-bezel-text-wrapper {
                  pointer-events: none;
                  z-index: 40 !important;
               }
               ${SELECTOR} .ytp-bezel-text { display: inline-block !important; }
               ${SELECTOR} .ytp-bezel { display: none !important; }`,
        );
      }

      bezelEl.textContent = text;
      bezelContainer.classList.add(CLASS_VALUE);

      let ms = 1200;
      if (
        (text = String(text)) &&
        (text.endsWith("%") || text.endsWith("x") || text.startsWith("+"))
      ) {
        ms = 600;
      }

      this.fadeBezel = setTimeout(() => {
        bezelContainer.classList.remove(CLASS_VALUE);
        bezelEl.textContent = "";
      }, ms);
    }
  },

  getChapterList(video_duration = required()) {
    if (typeof video_duration !== "number") {
      console.warn("video_duration is not a number:", video_duration);
      return;
    }

    switch (NOVA.currentPage) {
      case "embed":
        const chapsCollectEmbed = getFromAPI();

        return chapsCollectEmbed;
        break;

      case "watch":
        const chapsCollectWatch = getFromDescriptionText();

        return chapsCollectWatch;
        break;

      default:
        console.warn("Unsupported page:", NOVA.currentPage);
    }

    function descriptionExpand() {
      document.body
        .querySelector(
          "#meta [collapsed] #more, [description-collapsed] #description #expand",
        )
        ?.click();
    }

    function getFromDescriptionText() {
      descriptionExpand();

      video_duration = Math.trunc(video_duration);
      const selectorTimestampLink = 'a[href*="&t="]';
      let timestampsCollect = [],
        unreliableSorting;

      [
        (
          movie_player.getPlayerResponse()?.videoDetails?.shortDescription ||
          document.body.querySelector(
            "ytd-watch-metadata #description.ytd-watch-metadata",
          )?.innerText
        )?.split("\n") || [],

        [
          ...document.body.querySelectorAll(
            `#comments #comment #comment-content:has(${selectorTimestampLink})`,
          ),
        ]
          .map((el) =>
            [...el.querySelectorAll(selectorTimestampLink)].map((a) => ({
              source: "comment",

              text: `${a.innerText} ${(a.nextSibling || a.previousSibling)?.innerText}`,
            })),
          )
          ?.sort((a, b) => b.length - a.length)
          ?.shift() || [],
      ]
        ?.sort((a, b) => b.length - a.length)
        .forEach((chaptersList) => {
          if (timestampsCollect.length > 1) return;

          let prevSec = -1;

          chaptersList.forEach((line) => {
            unreliableSorting = Boolean(line?.source);
            line = (line?.text || line).toString().trim();
            if (
              line.length > 5 &&
              (timestamp = /((\d?\d:){1,2}\d{2})/g.exec(line)) &&
              line.length - timestamp.length < 200
            ) {
              timestamp = timestamp[0];
              const sec = NOVA.formatTime.hmsToSec(timestamp),
                timestampPos = line.indexOf(timestamp);

              if (
                (unreliableSorting
                  ? true
                  : sec > prevSec && sec < +video_duration - 5) &&
                (timestampPos < 5 ||
                  timestampPos + timestamp.length > line.length - 2)
              ) {
                if (unreliableSorting) prevSec = sec;

                timestampsCollect.push({
                  sec: sec,
                  time: timestamp.startsWith("0")
                    ? NOVA.formatTime.HMS.digit(sec)
                    : timestamp,
                  title: line

                    .replace(
                      new RegExp(
                        `((?:\\[\\(]|\\(|\\[)?)(${timestamp})(?:\\]|\\)|\\])?`,
                        "g",
                      ),
                      "",
                    )
                    .replace(/\*(.*?)\*/g, "<b>$1</b>")
                    .trim()
                    .replace(
                      /[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g,
                      "",
                    )
                    .trim()
                    .replace(/^([\u2011-\u26FF:\-|/]+)/, "")
                    .replace(/([\u2011-\u26FF:\-;|/]+|(\.))$/g, "")

                    .trim(),
                });
              }
            }
          });
        });

      if (
        timestampsCollect.length == 1 &&
        timestampsCollect[0].sec < video_duration / 4
      ) {
        return timestampsCollect;
      } else if (timestampsCollect.length > 1) {
        if (unreliableSorting) {
          timestampsCollect = timestampsCollect.sort((a, b) => a.sec - b.sec);
        }

        return timestampsCollect;
      }
    }

    function getFromAPI() {
      if (!window.ytPubsubPubsubInstance) {
        console.warn(
          "ytPubsubPubsubInstance is empty:",
          ytPubsubPubsubInstance,
        );
        return;
      }

      if (
        (ytPubsubPubsubInstance =
          ytPubsubPubsubInstance.i ||
          ytPubsubPubsubInstance.j ||
          ytPubsubPubsubInstance.subscriptions_) &&
        Array.isArray(ytPubsubPubsubInstance)
      ) {
        const data = Object.values(
          ytPubsubPubsubInstance.find((a) => a?.player)?.player.app,
        ).find((a) => a?.videoData)?.videoData.multiMarkersPlayerBarRenderer;

        if (data?.markersMap?.length) {
          return data.markersMap[0].value.chapters?.map((c) => {
            const sec =
              Math.trunc(c.chapterRenderer.timeRangeStartMillis) / 1000;
            return {
              sec: sec,
              time: NOVA.formatTime.HMS.digit(sec),
              title:
                c.chapterRenderer.title.simpleText ||
                c.chapterRenderer.title.runs[0].text,
            };
          });
        }
      }
    }
  },

  strToArray(str) {
    return str
      ?.trim()
      .split(/[\n,;]/)

      .map((e) => e.replace(/^(\s+)$/, ""))
      .filter((e) => e.length);
  },

  searchFilterHTML({
    keyword = required(),
    search_selectors = required(),
    filter_selector,
    highlight_class,
  }) {
    keyword = keyword.toString().toLowerCase();

    document.body.querySelectorAll(search_selectors).forEach((item) => {
      const text = item.innerText;
      const isfound = text.toLowerCase().includes(keyword);

      if (filter_selector) {
        item.querySelectorAll(filter_selector).forEach(highlight);
      } else {
        highlight(item);
      }

      function highlight(el) {
        if (el.innerHTML.includes("<mark ")) {
          el.innerHTML = NOVA.createSafeHTML(
            el.innerHTML.replace(/<\/?mark[^>]*>/g, ""),
          );
        }

        item.style.display = isfound ? "" : "none";

        if (isfound && keyword) {
          highlightTerm({
            target: el,
            keyword,
            highlight_class,
          });
        }
      }
    });

    function highlightTerm({
      target = required(),
      keyword = required(),
      highlight_class,
    }) {
      const content = target.innerText,
        pattern = new RegExp(
          "(>[^<.]*)?(" + escapeRegExp(keyword) + ")([^<.]*)?",
          "gi",
        ),
        highlightStyle = highlight_class
          ? `class="${highlight_class}"`
          : 'style="background-color:#afafaf"',
        replaceWith = `$1<mark ${highlightStyle}>$2</mark>$3`,
        marked = content.replaceAll(pattern, replaceWith);

      return (target.innerHTML = NOVA.createSafeHTML(marked)) !== content;

      function escapeRegExp(str) {
        return str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
      }
    }
  },

  Draggable: class {
    constructor(drag_container = document.body) {
      if (!(drag_container instanceof HTMLElement)) {
        console.error("drag_container not HTMLElement:", drag_container);
        return;
      }

      this.dragging = {
        target: null,
        moving: false,
        offset: { x: 0, y: 0 },
        initial: { x: 0, y: 0 },
        current: { x: 0, y: 0 },
        final: { x: 0, y: 0 },
        dragContainer: drag_container,
        attrOnMoving: "nova-el-moving",
      };

      this.reset = this.reset.bind(this);
      this.disable = this.disable.bind(this);
      this.dragStart = this.dragStart.bind(this);
      this.dragEnd = this.dragEnd.bind(this);
      this.draging = this.draging.bind(this);
      this.moveByCoordinates = this.moveByCoordinates.bind(this);
    }

    init(target_el = required()) {
      if (!(target_el instanceof HTMLElement)) {
        console.error("target_el not HTMLElement:", target_el);
        return;
      }
      this.log("drag init", ...arguments);

      this.dragging.target = target_el;

      document.addEventListener("touchstart", this.dragStart);
      document.addEventListener("touchend", this.dragEnd);
      document.addEventListener("touchmove", this.draging);

      document.addEventListener("mousedown", this.dragStart);
      document.addEventListener("mouseup", this.dragEnd);
      document.addEventListener("mousemove", this.draging);
    }

    reset(clear_final) {
      this.dragging.target?.style.removeProperty("transform");
      this.dragging.final = clear_final
        ? (this.dragging.offset.x = this.dragging.offset.y = 0)
        : { x: this.dragging.offset.x, y: this.dragging.offset.y };
    }

    disable() {
      this.log("dragDisable", this.dragging);
      this.dragging.target = null;

      document.removeEventListener("touchstart", this.dragStart);
      document.removeEventListener("touchend", this.dragEnd);
      document.removeEventListener("touchmove", this.draging);

      document.removeEventListener("mousedown", this.dragStart);
      document.removeEventListener("mouseup", this.dragEnd);
      document.removeEventListener("mousemove", this.draging);
    }

    dragStart(evt) {
      if (!this.dragging.target.contains(evt.target)) return;

      this.log("dragStart", this.dragging);

      const { targetX, targetY } = this.getTargetCoordinates(evt);
      this.dragging.initial.x = targetX - (this.dragging.offset.x || 0);
      this.dragging.initial.y = targetY - (this.dragging.offset.y || 0);

      this.dragging.moving = true;
    }

    dragEnd(evt) {
      if (!this.dragging.moving) return;
      this.log("dragEnd", this.dragging);

      this.dragging.initial.x = this.dragging.current.x;
      this.dragging.initial.y = this.dragging.current.y;

      this.dragging.moving = false;
      this.dragging.target.style.pointerEvents = null;
      this.dragging.target.removeAttribute(this.dragging.attrOnMoving);
      document.body.style.cursor = "";
    }

    draging(evt) {
      if (!this.dragging.moving) return;
      this.log("draging", this.dragging);

      this.dragging.target.style.pointerEvents = "none";

      document.body.style.cursor = "move";

      if (!this.dragging.target.hasAttribute(this.dragging.attrOnMoving)) {
        this.dragging.target.setAttribute(this.dragging.attrOnMoving, true);
      }

      const { targetX, targetY } = this.getTargetCoordinates(evt);

      const dx = targetX - this.dragging.initial.x;
      const dy = targetY - this.dragging.initial.y;

      if (this.dragging.dragContainer) {
        const dragContainerHeight =
          this.dragging.dragContainer.clientHeight || window.innerHeight;
        const dragContainerWidth =
          this.dragging.dragContainer.clientWidth || window.innerWidth;

        this.dragging.current.x = Math.min(
          Math.max(dx, 0 - this.dragging.target.offsetLeft),
          dragContainerWidth -
            this.dragging.target.offsetWidth -
            this.dragging.target.offsetLeft,
        );

        this.dragging.current.y = Math.min(
          Math.max(dy, 0 - this.dragging.target.offsetTop),
          dragContainerHeight -
            this.dragging.target.offsetHeight -
            this.dragging.target.offsetTop,
        );
      } else {
        this.dragging.current.x = dx;
        this.dragging.current.y = dy;
      }

      this.dragging.offset.x = this.dragging.current.x;
      this.dragging.offset.y = this.dragging.current.y;

      this.moveByCoordinates(this.dragging.current);
    }

    moveByCoordinates({ x = required(), y = required() }) {
      this.log("moveByCoordinates", this.dragging);
      this.dragging.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    getTargetCoordinates(evt = required()) {
      let targetX, targetY;
      switch (evt.type) {
        case "touchstart":
        case "touchmove":
          targetX = evt.touches[0].clientX;
          targetY = evt.touches[0].clientY;
          break;
        case "mousedown":
        case "mousemove":
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

  isMusic(is_expand) {
    if (!["watch", "embed"].includes(this.currentPage)) return;

    return checkMusicType();

    function checkMusicType() {
      const playerData = movie_player.getPlayerResponse(),
        videoData = movie_player.getVideoData(),
        channelName = videoData.author,
        titleStr = videoData.title.toUpperCase(),
        titleWordsList = titleStr?.toUpperCase().match(/\w+/g);

      return (
        [
          titleStr,
          location.host,
          location.hash,
          channelName,

          playerData?.microformat?.playerMicroformatRenderer.category,

          (
            document.body.querySelector(".ytd-page-manager[video-id]")?.__data
              .playlistData ||
            document.body.querySelector("yt-playlist-manager")
              ?.polymerController?.currentPlaylistData_
          )?.title,
        ].some((i) => i?.toUpperCase().includes("MUSIC")) ||
        document.body.querySelector(
          "#upload-info #channel-name .badge-style-type-verified-artist",
        ) ||
        (channelName &&
          /(^(DJ)|(VEVO|Topic|AMV|Official)$)/.test(channelName)) ||
        (channelName &&
          /(HITS|BAND|ROCK|SOUNDS|SONG|MUSIK|𝐌𝐔𝐒𝐈𝐂|RECORD(?:S|INGS)?)/i.test(
            channelName,
          )) ||
        (titleWordsList?.length &&
          [
            "🎵",
            "♫",
            "SONG",
            "SONGS",
            "SOUNDTRACK",
            "LYRIC",
            "LYRICS",
            "AMBIENT",
            "MIX",
            "VEVO",
            "KARAOKE",
            "COVER",
            "COVERED",
            "VOCAL",
            "INSTRUMENTAL",
            "ORCHESTRAL",
            "SYMPHONY",
            "CONCERT",
            "DUBSTEP",
            "DJ",
            "DNB",
            "BASS",
            "BEAT",
            "ALBUM",
            "PLAYLIST",
            "DUBSTEP",
            "CHILL",
            "RELAX",
            "CINEMATIC",
            "KBPS",
            "SPEEDRUN",
            "MELODY",
          ].some((i) => titleWordsList.includes(i))) ||
        [
          "OFFICIAL VIDEO",
          "OFFICIAL AUDIO",
          "FEAT.",
          "FT.",
          "LIVE RADIO",
          "DANCE VER",
          "HIP HOP",
          "ROCK N ROLL",
          "HOUR VER",
          "HOURS VER",
          "INTRO THEME",
          "FULL ALBUM",
        ].some((i) => titleStr.includes(i)) ||
        (titleWordsList?.length &&
          [
            "OP",
            "ED",
            "MV",
            "OST",
            "NCS",
            "BGM",
            "EDM",
            "GMV",
            "AMV",
            "MMD",
            "MAD",
            "HQ",
          ].some((i) => titleWordsList.includes(i))) ||
        (is_expand &&
          (playerData?.videoDetails.keywords?.some((i) =>
            i?.toUpperCase().includes("MUSIC"),
          ) ||
            (channelName &&
              /(MIX|ALBUM|METAL|INSTRUMENTAL)/i.test(channelName)) ||
            titleStr.split(" - ").length === 2 ||
            [
              "【",
              "『",
              "「",
              "SOUND",
              "REMIX",
              "CD",
              "PV",
              "AUDIO",
              "EXTENDED",
              "FULL",
              "TOP",
              "TRACK",
              "TRAP",
              "THEME",
              "PIANO",
              "POP",
              "8-BIT",
              "HITS",
              "CLASSIC",
              "OPENING",
              "ENDING",
              "CLIP",
            ].some((i) => titleWordsList.includes(i))))
      );
    }
  },

  formatTime: {
    hmsToSec(str = required()) {
      let parts = str?.split(":"),
        t = 0;
      switch (parts?.length) {
        case 2:
          t = parts[0] * 60;
          break;
        case 3:
          t = parts[0] * 3600 + parts[1] * 60;
          break;
        case 4:
          t = parts[0] * 86400 + parts[1] * 3600 + parts[2] * 60;
          break;
      }
      return t + +parts.pop();
    },

    HMS: {
      parseTime(sec) {
        const ts = Math.abs(+sec);
        return {
          d: Math.trunc(ts / 86400),
          h: Math.trunc((ts % 86400) / 3600),
          m: Math.trunc((ts % 3600) / 60),

          s: Math.trunc(ts % 60),
        };
      },

      digit(sec = required()) {
        const { d, h, m, s } = this.parseTime(sec);

        return (
          (d ? `${d}d ` : "") +
          (h ? (d ? h.toString().padStart(2, "0") : h) + ":" : "") +
          (h ? m.toString().padStart(2, "0") : m) +
          ":" +
          s.toString().padStart(2, "0")
        );
      },

      abbr(sec = required()) {
        const { d, h, m, s } = this.parseTime(sec);

        return (
          (d ? `${d}d ` : "") +
          (h ? (d ? h.toString().padStart(2, "0") : h) + "h" : "") +
          (m ? (h ? m.toString().padStart(2, "0") : m) + "m" : "") +
          (s ? (m ? s.toString().padStart(2, "0") : s) + "s" : "")
        );
      },
    },

    ago(date = required()) {
      if (!(date instanceof Date)) {
        console.error("date is not a Date type:", date);
        return;
      }

      const samples = [
        { label: "year", sec: 31536000 },
        { label: "month", sec: 2592000 },
        { label: "day", sec: 86400 },
        { label: "hour", sec: 3600 },
        { label: "minute", sec: 60 },
        { label: "second", sec: 1 },
      ];
      const now = date.getTime(),
        seconds = Math.floor((Date.now() - Math.abs(now)) / 1000),
        interval = samples.find((i) => i.sec < seconds),
        time = Math.floor(seconds / interval.sec);

      return `${(now < 0 ? "-" : "") + time} ${interval.label}${time !== 1 ? "s" : ""}`;
    },
  },

  dateFormat(format = "YYYY/MM/DD") {
    if (!(this instanceof Date)) {
      console.error("dateFormat is not a Date type:", this);
      return;
    }

    const twoDigit = (n) => n.toString().padStart(2, "0"),
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
            short: ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"],
            full: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ],
          },
          month: {
            short: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            full: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
          },
        },
      };
      const userLocal = navigator.language.split("-")[0];
      const defaultLabel = labels.hasOwnProperty(userLocal) || "en";

      return labels[defaultLabel];
    })();

    return format.replace(
      /A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/gi,
      (pattern) => {
        let out;
        switch (pattern) {
          case "YY":
            out = year.substr(2);
            break;
          case "YYYY":
            out = year;
            break;
          case "M":
            out = monthIdx + 1;
            break;
          case "MM":
            out = twoDigit(monthIdx + 1);
            break;
          case "MMM":
            out = dateLabels.month.short[monthIdx];
            break;
          case "MMMM":
            out = dateLabels.month.full[monthIdx];
            break;
          case "D":
            out = date;
            break;
          case "DD":
            out = twoDigit(date);
            break;
          case "DDD":
            out = dateLabels.week.short[weekIdx];
            break;
          case "DDDD":
            out = dateLabels.week.full[weekIdx];
            break;
          case "h":
            out = hours % 12 || 12;
            break;
          case "H":
            out = hours;
            break;
          case "HH":
            out = twoDigit(hours);
            break;

          case "mm":
            out = twoDigit(minutes);
            break;
          case "s":
            out = seconds;
            break;
          case "ss":
            out = twoDigit(seconds);
            break;
          case "SS":
            out = twoDigit(seconds);
            break;

          case "A":
            out = hours < 12 ? "AM" : "PM";
            break;
          case "Z":
            out =
              ("+" + -this.getTimezoneOffset() / 60)
                .replace(/^\D?(\D)/, "$1")
                .replace(/^(.)(.)$/, "$10$2") + "00";
            break;
        }
        return out;
      },
    );
  },

  numberFormat: {
    abbr(num) {
      num = Math.abs(+num);
      if (num === 0 || isNaN(num)) return "";
      else if (num < 1000) return Math.trunc(num);
      else if (num < 1e4) return round(num / 1000) + "K";
      else if (num < 990000) return Math.round(num / 1000) + "K";
      else if (num < 990000000) return Math.round(num / 1e5) / 10 + "M";
      else return Math.round(num / 1e8) / 10 + "B";

      function round(num, sig = 1) {
        const prec = Math.pow(10, sig);
        return Math.round(num * prec) / prec;
      }
    },

    friendly: (num) =>
      new Intl.NumberFormat().format(Math.round(num * 10) / 10),
  },

  extractAsNum: {
    float: (str) => (n = str?.replace(/[^0-9.]/g, "")) && +n,
    int: (str) => (n = str?.replace(/\D+/g, "")) && +n,
  },

  editableFocused(target = required()) {
    if (target === document) return;

    if (!(target instanceof HTMLElement)) {
      console.error("target is not a HTMLElement:", target);
      return;
    }

    return (
      ["input", "textarea", "select"].includes(target.localName) ||
      target.isContentEditable
    );
  },

  updateUrl: (new_url = required()) =>
    window.history.replaceState(null, null, new_url),

  queryURL: {
    has: (query = required(), url_string) =>
      new URL(url_string || location).searchParams.has(query.toString()),

    get: (query = required(), url_string) =>
      new URL(url_string || location).searchParams.get(query.toString()),

    set(query_obj = {}, url_string) {
      if (typeof query_obj != "object" || !Object.keys(query_obj).length) {
        console.error(
          "query_obj is not a object:",
          typeof query_obj,
          query_obj,
        );
        return;
      }
      const url = new URL(url_string || location);
      Object.entries(query_obj).forEach(([key, value]) =>
        url.searchParams.set(key, value),
      );
      return url.toString();
    },

    remove(query = required(), url_string) {
      const url = new URL(url_string || location);
      url.searchParams.delete(query.toString());
      return url.toString();
    },

    getFromHash: (query = required(), url_string) =>
      location.hash &&
      new URLSearchParams(new URL(url_string || location).hash.slice(1)).get(
        query.toString(),
      ),
  },

  request: (() => {
    const API_STORE_NAME = "YOUTUBE_API_KEYS";

    async function getKeys() {
      NOVA.log("request.API: fetch to youtube_api_keys.json");

      return await this.fetch(
        "https://gist.githubusercontent.com/raingart/ff6711fafbc46e5646d4d251a79d1118/raw/youtube_api_keys.json",
      )

        .then((keys) => {
          NOVA.log(`get and save keys in localStorage`, keys);
          localStorage.setItem(API_STORE_NAME, JSON.stringify(keys));
          return keys;
        })

        .catch((err) => {
          localStorage.removeItem(API_STORE_NAME);
          console.error("API Keys: failed fetching:", err);
          throw new Error(`API Keys: failed fetching: ${err}`);
        })
        .catch((reason) => console.error("Error get keys:", reason));
    }

    return {
      async API({ request = required(), params = required(), api_key }) {
        const YOUTUBE_API_KEYS = localStorage.hasOwnProperty(API_STORE_NAME)
          ? JSON.parse(localStorage.getItem(API_STORE_NAME))
          : await getKeys();

        if (
          !api_key &&
          (!Array.isArray(YOUTUBE_API_KEYS) || !YOUTUBE_API_KEYS?.length)
        ) {
          localStorage.hasOwnProperty(API_STORE_NAME) &&
            localStorage.removeItem(API_STORE_NAME);

          console.error("YOUTUBE_API_KEYS is empty:", YOUTUBE_API_KEYS);
          throw new Error("YOUTUBE_API_KEYS is empty");
        }

        const referRandKey = (arr) =>
          api_key || "AIzaSy" + arr[Math.trunc(Math.random() * arr.length)];

        const query = Object.keys(params)
          .map(
            (k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]),
          )
          .join("&");

        const URL =
          `https://www.googleapis.com/youtube/v3/${request}?${query}&key=` +
          referRandKey(YOUTUBE_API_KEYS);

        return await NOVA.fetch(URL)

          .then((json) => {
            if (!json?.error && Object.keys(json).length) return json;
            console.warn("used key:", NOVA.queryURL.get("key", URL));
            if (json?.error && Object.keys(json.error).length) {
              throw new Error(JSON.stringify(json?.error));
            }
          })
          .catch((error) => {
            localStorage.removeItem(API_STORE_NAME);
            console.error(`Request API failed:${URL}\n${error}`);
            if (error?.message && (err = JSON.parse(error?.message))) {
              return {
                code: err.code,
                reason: err.errors?.length && err.errors[0].reason,
                error: err.message,
              };
            }
          });
      },
    };
  })(),

  async fetch(url, options = {}) {
    const defaultOptions = {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      responseType: "json",
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
    };

    let response;

    try {
      if (typeof GM_info === "object") {
        response = await GM_fetch(url, mergedOptions);
      } else {
        response = await fetch(url, mergedOptions);
        response = await response.json();
      }
    } catch (err) {
      console.error(`NOVA.fetch: Unexpected error: ${err}\n${url}`);
      throw err;
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

          onloadend(response) {
            if (response.status >= 200 && response.status < 300) {
              switch (options.responseType) {
                case "json":
                  resolve(JSON.parse(response.responseText));
                  break;
                default:
                  resolve(response.response);
                  break;
              }
            }
          },

          onerror: (error) => reject(new Error("Network error")),
        });

        if (options.timeout > 0) {
          setTimeout(() => xhr.abort(), options.timeout);
        }
      });
    }
  },

  getPlayerState: {
    playback(state) {
      return {
        "-1": "UNSTARTED",
        0: "ENDED",
        1: "PLAYING",
        2: "PAUSED",
        3: "BUFFERING",
        5: "CUED",
      }[state || movie_player.getPlayerState()];
    },

    visibility() {
      return {
        0: "SHOW",
        1: "MINIPLAYER",
        2: "FULLSCREEN",
        3: "HIDE",
        10: "THEATER",
      }[movie_player.getVisibilityState()];
    },
  },

  videoElement: (() => {
    const videoSelector = "#movie_player:not(.ad-showing) video";

    document.addEventListener(
      "canplay",
      ({ target }) => {
        target.matches(videoSelector) && (NOVA.videoElement = target);
      },
      { capture: true, once: true },
    );

    document.addEventListener(
      "play",
      ({ target }) => {
        target.matches(videoSelector) && (NOVA.videoElement = target);
      },
      true,
    );
  })(),

  getChannelId(api_key) {
    const isChannelId = (id) => id && /UC([a-z0-9-_]{22})$/i.test(id);

    let result = [
      document.head.querySelector('meta[itemprop="channelId"][content]')
        ?.content,

      (
        document.body.querySelector("ytd-app")?.__data?.data?.response ||
        document.body.querySelector("ytd-app")?.data?.response ||
        window.ytInitialData
      )?.metadata?.channelMetadataRenderer?.externalId,

      document.head
        .querySelector('link[itemprop="url"][href]')
        ?.href.split("/")[4],
      location.pathname.split("/")[2],

      document.body.querySelector("#video-owner a[href]")?.href.split("/")[4],
      document.body
        .querySelector("a.ytp-ce-channel-title[href]")
        ?.href.split("/")[4],

      movie_player.getPlayerResponse()?.videoDetails?.channelId,

      typeof ytcfg === "object" &&
        (obj = ytcfg.data_?.PLAYER_VARS?.embedded_player_response) &&
        NOVA.searchInObjectBy.key({
          obj: JSON.parse(obj),
          key: "channelId",
        })?.data,

      (obj = document.getElementById("page-manager")?.getCurrentData()) &&
        NOVA.searchInObjectBy.key({
          //'obj': JSON.parse(obj),
          obj: obj,
          key: "channelId",
        })?.data,
    ].find((i) => isChannelId(i));

    return result;
  },

  storage_obj_manager: {
    STORAGE_NAME: "nova-channels-state",

    STORAGE_NAME_SPEED: "nova-channels-speed",

    async initStorage() {
      this.channelId = location.search.includes("list=")
        ? NOVA.queryURL.get("list") || movie_player?.getPlaylistId()
        : await NOVA.waitUntil(NOVA.getChannelId, 1000);
    },

    read(return_all) {
      if ((store = JSON.parse(localStorage.getItem(this.STORAGE_NAME)))) {
        return return_all ? store : store[this.channelId];
      }
    },

    write(obj_save) {
      if ((storage = this.read("all") || {})) {
        if (Object.keys(obj_save).length) {
          storage = Object.assign(storage, { [this.channelId]: obj_save });
        } else {
          delete storage[this.channelId];
        }
      }
      localStorage.setItem(this.STORAGE_NAME, JSON.stringify(storage));
    },

    _getParam(key = required()) {
      if ((storage = this.read())) {
        return storage[key];
      }
    },

    async getParam(key = required()) {
      if (!this.channelId) await this.initStorage();
      return this._getParam(...arguments);
    },

    save(obj_save) {
      if ((storage = this.read())) {
        obj_save = Object.assign(storage, obj_save);
      }
      this.write(obj_save);
    },

    remove(key) {
      if ((storage = this.read())) {
        delete storage[key];
        this.write(storage);
      }
    },
  },

  searchInObjectBy: {
    key({
      obj = required(),
      key = required(),
      multiple = false,

      match_fn,
      max_depth = 10,
    }) {
      let results = [];

      const found = searchInternal({ obj, path: "", depth: 0 });
      if (found) {
        return multiple ? results : found;
      }

      function searchInternal({ obj = required(), path = "", depth = 0 }) {
        if (depth >= max_depth) return;

        const setPath = (d) => (path ? path + "." : "") + d;

        for (const prop in obj) {
          if (obj.hasOwnProperty(prop) && typeof obj[prop] !== "undefined") {
            if (
              key === prop &&
              (typeof match_fn !== "function" || match_fn(obj[prop]))
            ) {
              const result = {
                path: setPath(prop),
                data: obj[prop],
                depth: depth,
              };
              if (multiple) results.push(result);
              else return result;
            } else if (depth < max_depth) {
              switch (obj[prop].constructor.name) {
                case "Object":
                  const foundInObject = searchInternal({
                    obj: obj[prop],

                    path: setPath(prop),

                    depth: depth + 1,
                  });
                  if (foundInObject) {
                    if (multiple) results.push(foundInObject);
                    else return foundInObject;
                  }
                  break;

                case "Array":
                  for (let i = 0; i < obj[prop].length; i++) {
                    if (typeof obj[prop][i] !== "undefined") {
                      const foundInArray = searchInternal({
                        obj: obj[prop][i],
                        path: path + `[${i}]`,

                        depth: depth + 1,
                      });
                      if (foundInArray) {
                        if (foundInArray) results.push(foundInArray);
                        else return foundInArray;
                      }
                    }
                  }
                  break;
              }
            }
          }
        }
      }
    },
  },

  insertFIlterButton() {
    NOVA.waitSelector(
      '#filter-button, ytd-shelf-renderer #title-container a[href="/feed/channels"]',
      { destroy_after_page_leaving: true },
    ).then((container) => {
      const filterBtn = document.createElement("button");
      filterBtn.classList.add(
        "style-scope",
        "yt-formatted-string",
        "bold",
        "yt-spec-button-shape-next--tonal",
        "yt-spec-button-shape-next--mono",
        "yt-spec-button-shape-next--size-m",
        "yt-spec-button-shape-next--text",
      );

      filterBtn.append(
        (function createFilterIcon() {
          const iconBtn = document.createElement("span");
          iconBtn.className = "yt-spec-button-shape-next__icon";
          iconBtn.style.height = "100%";

          const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
          );
          svg.setAttribute("viewBox", "-50 -50 400 400");
          svg.setAttribute("height", "100%");
          svg.setAttribute("width", "100%");

          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("fill", "currentColor");

          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          path.setAttribute(
            "d",
            "M128.25,175.6c1.7,1.8,2.7,4.1,2.7,6.6v139.7l60-51.3v-88.4c0-2.5,1-4.8,2.7-6.6L295.15,65H26.75L128.25,175.6z",
          );

          g.append(path);
          svg.append(g);
          iconBtn.append(svg);

          return iconBtn;
        })(),
      );

      filterBtn.title = "Toggle NOVA plugin [thumbs-hide]";

      Object.assign(filterBtn.style, {
        border: 0,
        cursor: "pointer",
        scale: 0.7,
      });
      filterBtn.addEventListener("click", () => {
        document.body.classList.toggle("nova-thumbs-unhide");

        filterBtn.style.opacity = document.body.classList.contains(
          "nova-thumbs-unhide",
        )
          ? 0.3
          : 1;
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
window.nova_plugins.push({
  id: "scroll-to-top",
  title: 'Add "Scroll to top" button',

  "title:pl": "Przycisk przewijania do góry",

  run_on_pages: "*, -embed, -mobile, -live_chat",
  section: "other",
  desc: "Displayed on long pages",
  "desc:zh": "出现在长页面上",
  "desc:ja": "長いページに表示されます",

  "desc:pl": "Wyświetlaj na długich stronach",

  _runtime: (user_settings) => {
    document.addEventListener("scroll", insertButton, {
      capture: true,
      once: true,
    });

    function insertButton() {
      const SELECTOR_ID = "nova-scrollTop-btn";

      const btn = document.createElement("button");
      btn.id = SELECTOR_ID;

      Object.assign(btn.style, {
        position: "fixed",
        cursor: "pointer",
        bottom: 0,
        left: "20%",

        visibility: "hidden",
        opacity: 0.5,
        width: "40%",
        height: "40px",
        border: "none",

        outline: "none",
        "z-index": 1,
        "border-radius": "100% 100% 0 0",
        "font-size": "16px",
        "background-color": "rgba(0,0,0,.3)",
        "box-shadow":
          "0 16px 24px 2px rgba(0, 0, 0, .14), 0 6px 30px 5px rgba(0, 0, 0, .12), 0 8px 10px -5px rgba(0, 0, 0, .4)",
      });
      btn.addEventListener("click", () => {
        window.scrollTo({
          top: 0,

          behavior: user_settings.scroll_to_top_smooth ? "smooth" : "instant",
        });
        if (
          user_settings.scroll_to_top_autoplay &&
          NOVA.currentPage == "watch" &&
          ["UNSTARTED", "PAUSED"].includes(NOVA.getPlayerState.playback())
        ) {
          movie_player.playVideo();
        }
      });

      const arrow = document.createElement("span");

      Object.assign(arrow.style, {
        border: "solid white",
        "border-width": "0 3px 3px 0",
        display: "inline-block",
        padding: "4px",
        "vertical-align": "middle",
        transform: "rotate(-135deg)",
      });
      btn.append(arrow);
      document.body.append(btn);

      NOVA.css.push(
        `#${SELECTOR_ID}:hover {
               opacity: 1 !important;
               background-color: rgba(0,0,0,.6) !important;
            }`,
      );

      const scrollTop_btn = document.getElementById(SELECTOR_ID);
      let sOld;
      window.addEventListener("scroll", () => {
        const sCurr =
          document.documentElement.scrollTop > window.innerHeight / 2;
        if (sCurr == sOld) return;
        sOld = sCurr;
        scrollTop_btn.style.visibility = sCurr ? "visible" : "hidden";
      });
    }
  },
  options: {
    scroll_to_top_smooth: {
      _tagName: "input",
      label: "Smooth",

      "label:pl": "Płynnie",

      type: "checkbox",
    },
    scroll_to_top_autoplay: {
      _tagName: "input",
      label: "Unpause a video",

      "label:pl": "Wyłącz wstrzymanie odtwarzania filmu",

      type: "checkbox",
    },
  },
});
window.nova_plugins.push({
  id: "collapse-navigation-panel",
  title: "Collapse navigation panel",

  "title:pl": "Zwiń panel nawigacyjny",

  run_on_pages: "*, -watch, -embed, -live_chat",
  section: "other",

  _runtime: (user_settings) => {
    NOVA.waitSelector("#guide[opened]").then((el) => {
      document.getElementById("guide-button").click();
      el.removeAttribute("opened");
    });
  },
});

window.nova_plugins.push({
  id: "rss-link",
  title: "Add RSS feed link",

  "title:pl": "Dodaj kanał RSS",

  run_on_pages: "channel, playlist, -mobile",
  restart_on_location_change: true,
  section: "channel",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-rss-link",
      rssLinkPrefix = "/feeds/videos.xml",
      playlistURL = rssLinkPrefix + "?playlist_id=" + NOVA.queryURL.get("list"),
      genChannelURL = (channelId) => rssLinkPrefix + "?channel_id=" + channelId;

    switch (NOVA.currentPage) {
      case "channel":
        NOVA.waitSelector("#page-header h1").then(async (container) => {
          await NOVA.delay(500);

          const rssLink =
            document.head.querySelector(
              'link[type="application/rss+xml"][href]',
            )?.href ||
            genChannelURL(NOVA.getChannelId(user_settings["user-api-key"]));

          if (rssLink) {
            insertToHTML({ url: rssLink, container: container });
          }
        });
        break;

      case "playlist":
        NOVA.waitSelector(".page-header-sidebar h1", {
          destroy_after_page_leaving: true,
        }).then((container) => {
          insertToHTML({
            url: playlistURL,
            container: container,
            is_playlist: true,
          });
        });
        break;
    }

    function insertToHTML({
      url = required(),
      container = required(),
      is_playlist,
    }) {
      if (!(container instanceof HTMLElement)) {
        console.error("Container is not an HTMLElement:", container);
        return;
      }

      (
        container.querySelector(`#${SELECTOR_ID}`) ||
        (function () {
          const link = document.createElement("a");
          link.id = SELECTOR_ID;
          link.target = "_blank";
          link.title = "Nova RSS";
          link.className = `yt-spec-button-shape-next--overlay`;

          link.append(
            (function createSvgIcon() {
              const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
              );
              svg.setAttribute("viewBox", "-35 -35 55 55");
              svg.setAttribute("height", "100%");
              svg.setAttribute("width", "100%");
              svg.style.width = "auto";

              const g = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              g.setAttribute("fill", "currentColor");

              const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path.setAttribute("fill", "#F60");
              path.setAttribute(
                "d",
                "M-17.392 7.875c0 3.025-2.46 5.485-5.486 5.485s-5.486-2.46-5.486-5.485c0-3.026 2.46-5.486 5.486-5.486s5.486 2.461 5.486 5.486zm31.351 5.486C14.042.744 8.208-11.757-1.567-19.736c-7.447-6.217-17.089-9.741-26.797-9.708v9.792C-16.877-19.785-5.556-13.535.344-3.66a32.782 32.782 0 0 1 4.788 17.004h8.827v.017zm-14.96 0C-.952 5.249-4.808-2.73-11.108-7.817c-4.821-3.956-11.021-6.184-17.255-6.15v8.245c6.782-.083 13.432 3.807 16.673 9.774a19.296 19.296 0 0 1 2.411 9.326h8.278v-.017z",
              );

              g.append(path);
              svg.append(g);

              return svg;
            })(),
          );

          Object.assign(link.style, {
            height: "20px",
            display: "inline-block",
            padding: "5px",
          });

          container.append(link);
          return link;
        })()
      ).href = url;
    }
  },
});
window.nova_plugins.push({
  id: "copy-url",
  title: "Copy URL to clipboard",

  run_on_pages: "results, channel, playlist, watch, embed",
  section: "other",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-copy-notification";

    document.addEventListener("keydown", (evt) => {
      const hotkeyMod = user_settings.copy_url_hotkey || "ctrlKey";

      if (
        hotkeyMod == "ctrlKey" &&
        window.getSelection &&
        window.getSelection().toString()
      )
        return;

      if (NOVA.editableFocused(evt.target)) return;

      if (evt[hotkeyMod] && evt.code === "KeyC") {
        evt.preventDefault();
        evt.stopPropagation();

        let url;
        switch (NOVA.currentPage) {
          case "watch":
          case "embed":
            url =
              "https://youtu.be/" +
              (NOVA.queryURL.get("v") || movie_player.getVideoData().video_id);
            break;

          case "channel":
            url = (channelId = NOVA.getChannelId(user_settings["user-api-key"]))
              ? user_settings["channel-play-all"]
                ? `https://${location.host}/playlist?list=UULF` +
                  channelId.slice(2)
                : `https://${location.host}/channel/` + channelId
              : location.href;
            break;

          case "results":
          case "playlist":
            url = location.href;
            break;
        }
        if (url) {
          navigator.clipboard.writeText(url);

          showNotification("URL copied");
        }
      }
    });

    function showNotification(msg) {
      if (typeof showNotification.fadeTimeout === "number") {
        clearTimeout(showNotification.fadeTimeout);
        clearTimeout(showNotification.hideTimeout);
      }

      const notify =
        document.getElementById(SELECTOR_ID) ||
        (function () {
          const el = document.createElement("div");
          el.id = SELECTOR_ID;

          let initcss = {
            position: "fixed",

            "z-index": 9999,
            "border-radius": "2px",
            "background-color": user_settings.copy_url_color || "#e85717",
            "box-shadow": "rgb(0 0 0 / 50%) 0px 0px 3px",
            "border-radius": user_settings["square-avatars"]
              ? "inherit"
              : "12px",
            "font-size": `${+user_settings.copy_url_font_size || 1.7}em`,
            color: "var(--yt-spec-text-primary, white)",
            padding: ".5em .8em",
            cursor: "pointer",
          };
          switch (user_settings.copy_url_position) {
            case "top-left":
              initcss.top = "60px";
              initcss.left = "20px";
              break;
            case "bottom-left":
              initcss.bottom = "20px";
              initcss.left = "20px";
              break;
            case "bottom-right":
              initcss.bottom = "20px";
              initcss.right = "20px";
              break;

            default:
              initcss.top = "60px";
              initcss.right = "20px";
              break;
          }

          Object.assign(el.style, initcss);
          return document.body.appendChild(el);
        })();

      notify.textContent = msg;

      notify.style.opacity = +user_settings.copy_url_opacity || 1;
      notify.style.visibility = "visible";

      showNotification.fadeTimeout = setTimeout(() => {
        notify.style.transition = "opacity 200ms ease-out";
        notify.style.opacity = 0;
        showNotification.hideTimeout = setTimeout(
          () => (notify.style.visibility = "hidden"),
          5000,
        );
      }, 600);
    }
  },
  options: {
    copy_url_hotkey: {
      _tagName: "select",
      label: "Hotkey",

      "label:pl": "Klawisz skrótu",

      options: [
        { label: "shift+c", value: "shiftKey", selected: true },
        { label: "ctrl+c", value: "ctrlKey" },
      ],
    },
    copy_url_position: {
      _tagName: "select",

      label: "Notification position",

      options: [
        {
          label: "↖",
          value: "top-left",
        },
        {
          label: "↗",
          value: "top-right",
          selected: true,
        },
        {
          label: "↙",
          value: "bottom-left",
        },
        {
          label: "↘",
          value: "bottom-right",
        },
      ],
    },
    copy_url_opacity: {
      _tagName: "input",
      label: "Opacity",

      type: "number",

      placeholder: "0.1-1",
      step: 0.1,
      min: 0.1,
      max: 1,
      value: 0.8,
    },
    copy_url_font_size: {
      _tagName: "input",
      label: "Font size",

      type: "number",
      title: "in em",

      placeholder: "0.5-3",
      step: 0.1,
      min: 0.5,
      max: 3,
      value: 1.7,
    },
    copy_url_color: {
      _tagName: "input",
      type: "color",

      value: "#e85717",
      label: "Color",

      "label:pl": "Kolor",

      title: "default - #e85717",
    },
  },
});

window.nova_plugins.push({
  id: "channel-default-tab",
  title: "Default tab (for channel page)",

  "title:pl": "Domyślna karta na stronie kanału",

  run_on_pages: "channel",
  restart_on_location_change: true,
  section: "channel",

  _runtime: (user_settings) => {
    if (NOVA.channelTab) return;

    if (user_settings.channel_default_tab_mode == "redirect") {
      switch (user_settings.channel_default_tab_thumbs_sort) {
        case "popular":
          location.assign(
            `${location.protocol}//${location.hostname}/${location.pathname}/${user_settings.channel_default_tab}?SRT=P`,
          );
          return;
          break;
      }
      location.pathname += "/" + user_settings.channel_default_tab;
    } else {
      const tabSelectors = '#tabsContent [role="tab"]';

      NOVA.waitSelector(tabSelectors, {
        destroy_after_page_leaving: true,
      }).then(() => {
        let tabActive;
        const tabs = [...document.body.querySelectorAll(tabSelectors)];
        switch (user_settings.channel_default_tab) {
          case "videos":
            tabActive = tabs[1];
            break;

          default:
            location.pathname += "/" + user_settings.channel_default_tab;
        }

        tabActive?.click();

        document.addEventListener(
          "yt-navigate-finish",
          () => window.dispatchEvent(new Event("resize")),
          { capture: true, once: true },
        );
      });
    }
  },
  options: {
    channel_default_tab: {
      _tagName: "select",
      label: "Default tab",

      "label:pl": "Domyślna karta",

      options: [
        {
          label: "videos",
          value: "videos",
          selected: true,

          "label:pl": "wideo",
        },
        {
          label: "shorts",
          value: "shorts",
        },
        {
          label: "live",
          value: "streams",
        },
        {
          label: "podcasts",
          value: "podcasts",
        },
        {
          label: "releases",
          value: "releases",
        },
        {
          label: "playlists",
          value: "playlists",

          "label:pl": "playlista",
        },
        {
          label: "community",
          value: "community",
        },
      ],
    },
    channel_default_tab_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "click",

          "label:pl": "klik",
        },
        {
          label: "redirect",
          value: "redirect",

          "label:pl": "przekierowanie",
        },
      ],

      "data-dependent": { channel_default_tab: ["videos"] },
    },
    channel_default_tab_thumbs_sort: {
      _tagName: "select",
      label: "Sort by",

      options: [
        {
          label: "newest",
          selected: true,
        },
        {
          label: "popular",
          value: "popular",
        },
      ],
      "data-dependent": { channel_default_tab_mode: ["redirect"] },
    },
  },
});

window.nova_plugins.push({
  id: "page-title-time",
  title: "Show time in tab title",

  "title:pl": "Pokaż czas w tytule karty",

  run_on_pages: "watch",
  section: "other",

  _runtime: (user_settings) => {
    NOVA.waitSelector("video").then((video) => {
      document.addEventListener(
        "yt-navigate-start",
        () => (pageTitle.backup = null),
      );

      video.addEventListener("playing", pageTitle.save.bind(pageTitle));

      video.addEventListener("timeupdate", () => pageTitle.update(video));

      video.addEventListener("pause", () => pageTitle.restore(video));
      video.addEventListener("ended", () => pageTitle.restore(video));
    });

    const pageTitle = {
      strSplit: " | ",

      saveCheck() {
        return (result = (this.backup || document.title).includes(
          this.strSplit,
        ))
          ? new RegExp(
              `^((\\d?\\d:){1,2}\\d{2})(${this.strSplit.replace("|", "\\|")})`,
              "",
            ).test(document.title)
          : result;
      },

      save() {
        if (
          this.backup ||
          movie_player.getVideoData().isLive ||
          movie_player.classList.contains("ad-showing") ||
          this.saveCheck()
        ) {
          return;
        }

        this.backup =
          movie_player.getVideoData().title +
          " :: " +
          movie_player.getVideoData().author;
      },

      update(video = NOVA.videoElement) {
        if (!this.backup) return;

        let newTitleArr = [];

        switch (
          movie_player.getVideoData().isLive
            ? "current"
            : user_settings.page_title_time_mode
        ) {
          case "current":
            newTitleArr = [video.currentTime];
            break;

          case "current-duration":
            if (!isNaN(video.duration)) {
              newTitleArr = [video.currentTime, " / ", video.duration];
            }
            break;

          default:
            if (!isNaN(video.duration)) {
              newTitleArr = [video.duration - video.currentTime];
            }
        }

        newTitleArr = newTitleArr
          .map((t) =>
            typeof t === "string"
              ? t
              : NOVA.formatTime.HMS.digit(t / video.playbackRate),
          )
          .join("");

        this.set([newTitleArr, this.backup]);
      },

      restore(video = NOVA.videoElement) {
        if (!this.backup) return;

        this.set([
          movie_player.getVideoData().isLive && video.currentTime,
          this.backup,
        ]);
      },

      set(arr) {
        document.title = arr.filter(Boolean).join(this.strSplit);
      },
    };
  },
  options: {
    page_title_time_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "left",
          value: "left",
          selected: true,

          "label:pl": "pozostało",
        },
        {
          label: "current/duration",
          value: "current-duration",

          "label:pl": "bieżący czas",
        },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "pages-clear",

  title: "Clear pages of junk",

  "title:pl": "Wyczyść strony ze śmieci",

  run_on_pages: "results, feed, watch, embed, -mobile",
  section: "other",

  desc: "Remove the annoying stuff",
  "desc:zh": "删除烦人的东西",
  "desc:ja": "煩わしいものを取り除く",

  "desc:pl": "Usuń irytujące rzeczy",

  _runtime: (user_settings) => {
    let selectorsList = [
      ".ytp-paid-content-overlay",

      ".iv-branding",

      '#movie_player:not(:hover) > [class^="ytp-ce-"]',

      ".ytp-cards-teaser-text",

      "ytm-paid-content-overlay-renderer",
    ];

    switch (NOVA.currentPage) {
      case "embed":
        selectorsList.push([
          (user_settings["player-quick-buttons"] &&
            user_settings.player_buttons_custom_items?.includes(
              "card-switch",
            )) ||
            ".ytp-pause-overlay",

          ".ytp-info-panel-preview",
        ]);
        break;

      default:
        selectorsList.push([
          "ytd-search-pyv-renderer",

          '[class^="ytd-promoted-"]',

          "ytd-search-pyv-renderer ~ ytd-shelf-renderer",
          "ytd-video-renderer + ytd-shelf-renderer",

          "#clarify-box",

          "ytd-watch-metadata ytd-info-panel-content-renderer",

          ".ytd-watch-flexy.attached-message",

          "ytd-popup-container tp-yt-paper-dialog ytd-single-option-survey-renderer",

          "#donation-shelf ytd-donation-unavailable-renderer",

          `#subscribe-button .smartimation__border,
               #subscribe-button .smartimation__background,
               ytd-watch-metadata #actions .smartimation__border,
               ytd-watch-metadata #actions .smartimation__background`,

          '[class^="ytp-cultural-moment"]',

          "ytd-donation-unavailable-renderer, .ytd-donation-unavailable-renderer",

          ".sparkles-light-cta",

          "ytd-feed-nudge-renderer",
        ]);

        if (CSS.supports("selector(:has(*))")) {
          selectorsList.push([
            "ytd-rich-item-renderer:has(ytd-ad-slot-renderer)",

            "#chat[collapsed] #message",

            'ytd-popup-container:has(yt-tooltip-renderer[position-type="OPEN_POPUP_POSITION_BOTTOM"])',
          ]);
        }
    }

    if (selectorsList.length) {
      NOVA.css.push(
        selectorsList.join(",\n") +
          ` {
               display: none !important;
            }`,
      );
    }
  },
});

window.nova_plugins.push({
  id: "default-miniplayer-disable",
  title: "Disable miniplayer",

  run_on_pages: "results, feed, channel, watch, -mobile",
  section: "other",
  desc: "shown on changeable page when playing playlist",

  _runtime: (user_settings) => {
    NOVA.css.push(
      `.ytp-right-controls .ytp-miniplayer-button {
            display: none !important;
         }`,
    );

    document.addEventListener("yt-action", (evt) => {
      if (evt.detail?.actionName.includes("miniplayer")) {
        document.body.querySelector("ytd-miniplayer[active]")?.remove();
      }
    });

    document.addEventListener(
      "keydown",
      (evt) => {
        if (NOVA.editableFocused(evt.target)) return;

        if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;

        if (NOVA.currentPage == "watch" && evt.code === "KeyI") {
          evt.preventDefault();
          evt.stopPropagation();
        }
      },
      { capture: true },
    );
  },
});

window.nova_plugins.push({
  id: "channel-trailer-stop-preload",

  title: "Stop play channel trailer",

  "title:pl": "Zatrzymaj zwiastun kanału",

  run_on_pages: "channel, -mobile",
  restart_on_location_change: true,
  section: "channel",

  _runtime: (user_settings) => {
    NOVA.waitSelector("#c4-player.playing-mode", {
      destroy_after_page_leaving: true,
    }).then((player) => player.stopVideo());
  },
});
window.nova_plugins.push({
  id: "channel-play-all",

  title: 'Add "Play All" button',

  run_on_pages: "channel, watch, -mobile",
  restart_on_location_change: true,
  section: "channel",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-play-all-channel-btn",
      endpoint = "/playlist?list=";

    switch (NOVA.currentPage) {
      case "watch":
        if (!user_settings.channel_play_all_in_watch) return;

        NOVA.waitSelector("#owner.ytd-watch-metadata").then((container) => {
          if ((channelId = NOVA.getChannelId(user_settings["user-api-key"]))) {
            const btnList = user_settings.channel_play_all_mode
              ? { id: "UULF", title: "All" }
              : { id: "UULP", title: "MOST POPULAR" };

            insertToHTML({
              container: container,
              url: endpoint + btnList.id + channelId.slice(2),
            });

            function insertToHTML({
              url = required(),
              container = required(),
            }) {
              if (!(container instanceof HTMLElement)) {
                console.error("Container is not an HTMLElement:", container);
                return;
              }

              (
                document.getElementById(SELECTOR_ID) ||
                (function () {
                  const el = document.createElement("a");
                  el.id = SELECTOR_ID;
                  el.classList.add(
                    "style-scope",
                    "yt-formatted-string",
                    "bold",
                    "yt-spec-button-shape-next--tonal",
                    "yt-spec-button-shape-next--mono",
                    "yt-spec-button-shape-next--size-m",
                  );

                  Object.assign(el.style, {
                    "margin-left": "5px",
                    "text-decoration": "none",
                    "text-wrap": "nowrap",
                  });
                  el.textContent = `► Play ${btnList.title}`;

                  el.title = "Play every videos in channel";
                  return container.appendChild(el);
                })()
              ).href = url;
            }
          }
        });
        break;

      case "channel":
        let btnList;
        switch (NOVA.channelTab) {
          case "videos":
            btnList = user_settings.channel_play_all_mode
              ? { id: "UULF", title: "All" }
              : { id: "UULP", title: "Popular" };
            break;

          case "shorts":
            btnList = user_settings.channel_play_all_mode
              ? { id: "UUSH", title: "All Shorts" }
              : { id: "UUPS", title: "Popular Shorts" };
            break;

          case "streams":
            btnList = user_settings.channel_play_all_mode
              ? { id: "UULV", title: "All Streams" }
              : { id: "UUPV", title: "Popular Streams" };
            break;
        }

        if (!btnList) return;

        NOVA.waitSelector("#header #chips-wrapper").then((container) => {
          container.querySelector(`.${SELECTOR_ID}`)?.remove();

          const btn = document.createElement("tp-yt-paper-button");

          btn.classList.add(
            "style-scope",
            "yt-formatted-string",
            "bold",
            "yt-chip-cloud-chip-renderer",
            "1yt-spec-button-shape-next",
          );
          btn.classList.add(SELECTOR_ID);

          btn.style.cssText =
            "color: wheat; text-wrap: nowrap; text-decoration: none;";

          btn.textContent = `► Play ${btnList.title}`;

          btn.addEventListener("click", () => {
            if (
              (channelId = NOVA.getChannelId(user_settings["user-api-key"]))
            ) {
              location.href = endpoint + btnList.id + channelId.slice(2);
            }
          });

          container.append(btn);
        });
        break;
    }
  },
  options: {
    channel_play_all_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "all videos",
          value: true,
        },

        {
          label: "most popular",
        },
      ],
    },
    channel_play_all_in_watch: {
      _tagName: "input",
      label: 'Add in the "watch page" too',

      type: "checkbox",
    },
  },
});
window.nova_plugins.push({
  id: "scrollbar-hide",
  title: "Hide scrollbar (for watch page)",

  run_on_pages: "watch, -mobile",

  section: "other",
  _runtime: (user_settings) => {
    const HIDE_SCROLL_ATTR = "nova-scrollbar-hide";

    NOVA.css.push(
      `html[${HIDE_SCROLL_ATTR}] {
            scrollbar-width: none;
         }
         html[${HIDE_SCROLL_ATTR}] body::-webkit-scrollbar {
            width: 0px;
            height: 0px;
         }`,
    );

    NOVA.runOnPageLoad(() => {
      const hasAttr = document.documentElement.hasAttribute(HIDE_SCROLL_ATTR);

      if (NOVA.currentPage == "watch" && !hasAttr) {
        document.documentElement.setAttribute(HIDE_SCROLL_ATTR, true);
      } else if (NOVA.currentPage != "watch" && hasAttr) {
        document.documentElement.removeAttribute(HIDE_SCROLL_ATTR);
      }
    });

    if (user_settings.scrollbar_hide_toggle_on_scroll) {
      window.addEventListener("scroll", function blink() {
        if (NOVA.currentPage != "watch") return;

        if (document.documentElement.scrollHeight > window.innerHeight) {
          if (document.documentElement.hasAttribute(HIDE_SCROLL_ATTR)) {
            document.documentElement.removeAttribute(HIDE_SCROLL_ATTR);
          }
          if (typeof blink.fadeTimeout === "number")
            clearTimeout(blink.fadeTimeout);
          blink.fadeTimeout = setTimeout(() => {
            document.documentElement.setAttribute(HIDE_SCROLL_ATTR, true);
          }, 700);
        }
      });
    }
  },
  options: {
    scrollbar_hide_toggle_on_scroll: {
      _tagName: "input",
      label: "Showing on scroll",

      type: "checkbox",
    },
  },
});
window.nova_plugins.push({
  id: "player-resume-playback",
  title: "Remember playback time",

  "title:pl": "Powrót do pozycji czasowej odtwarzania",

  run_on_pages: "watch, embed",
  section: "player",
  desc: "On page reload - resume playback",
  "desc:zh": "在页面重新加载 - 恢复播放",
  "desc:ja": "ページがリロードされると、再生が復元されます",

  "desc:pl": "Przy ponownym załadowaniu strony - wznawiaj odtwarzanie",

  _runtime: (user_settings) => {
    if (!window?.sessionStorage) return;

    const CACHE_PREFIX = "nova-resume-playback-time",
      getCacheName = () =>
        CACHE_PREFIX +
        ":" +
        (NOVA.queryURL.get("v") || movie_player.getVideoData().video_id);

    let cacheName;

    NOVA.waitSelector("#movie_player video").then((video) => {
      cacheName = getCacheName();

      resumePlayback.apply(video);
      video.addEventListener("loadeddata", resumePlayback.bind(video));

      video.addEventListener("timeupdate", savePlayback.bind(video));

      video.addEventListener("ended", () =>
        sessionStorage.removeItem(cacheName),
      );

      if (
        user_settings.player_resume_playback_url_mark &&
        NOVA.currentPage != "embed"
      ) {
        if (
          NOVA.queryURL.has("t") ||
          NOVA.queryURL.getFromHash("t") ||
          NOVA.queryURL.has("time_continue")
        ) {
          document.addEventListener(
            "yt-navigate-finish",
            connectSaveStateInURL.bind(video),
            { capture: true, once: true },
          );
        } else {
          connectSaveStateInURL.apply(video);
        }
      }
    });

    function savePlayback() {
      if (
        this.currentTime > 5 &&
        this.duration > 30 &&
        !movie_player.classList.contains("ad-showing")
      ) {
        sessionStorage.setItem(cacheName, Math.trunc(this.currentTime));
      }
    }

    async function resumePlayback() {
      if (
        NOVA.queryURL.has("t") ||
        NOVA.queryURL.getFromHash("t") ||
        NOVA.queryURL.has("time_continue") ||
        (user_settings["save-channel-state"] &&
          (await NOVA.storage_obj_manager.getParam("ignore-playback")))
      ) {
        return;
      }

      cacheName = getCacheName();

      if (
        (time = +sessionStorage.getItem(cacheName)) &&
        time < this.duration - 1
      ) {
        this.currentTime = time;
      }
    }

    function connectSaveStateInURL() {
      let delaySaveOnPauseURL;

      this.addEventListener("pause", () => {
        if (
          this.currentTime < this.duration - 1 &&
          this.currentTime > 5 &&
          this.duration > 10
        ) {
          delaySaveOnPauseURL = setTimeout(() => {
            NOVA.updateUrl(
              NOVA.queryURL.set({ t: Math.trunc(this.currentTime) + "s" }),
            );
          }, 100);
        }
      });

      this.addEventListener("playing", () => {
        if (typeof delaySaveOnPauseURL === "number")
          clearTimeout(delaySaveOnPauseURL);
        if (NOVA.queryURL.has("t")) NOVA.updateUrl(NOVA.queryURL.remove("t"));
      });
    }
  },
  options: {
    player_resume_playback_url_mark: {
      _tagName: "input",
      label: "Mark time in URL when paused",

      "label:pl": "Zaznacz czas w adresie URL po wstrzymaniu",

      type: "checkbox",

      title: "Makes sense when saving bookmarks",

      "title:pl": "Ma sens podczas zapisywania zakładek",
    },
  },
});

window.nova_plugins.push({
  id: "video-unblock-region",
  title: "Redirect video not available in your country",

  "title:pl": "Spróbuj odblokować, jeśli film nie jest dostępny w Twoim kraju",

  run_on_pages: "watch, embed, -mobile",
  section: "player",
  opt_api_key_warn: true,
  desc: "Some mirrors will partially replace VPNs",

  _runtime: (user_settings) => {
    const SELECTOR_EMBED =
      '#movie_player.ytp-embed-error .ytp-error[role="alert"] .ytp-error-content-wrap-subreason:not(:empty)';
    const SELECTOR = `.ytd-page-manager[video-id][player-unavailable] #player-error-message-container #info, ${SELECTOR_EMBED}`;

    NOVA.waitSelector(SELECTOR, { destroy_after_page_leaving: true }).then(
      async (container) => {
        if (container.querySelector("button")) return;

        const videoId =
          NOVA.queryURL.get("v") || movie_player.getVideoData().video_id;

        insertLinks(container, videoId);

        function insertLinks(container = required(), video_id = required()) {
          if (!(container instanceof HTMLElement)) {
            console.error("Container is not an HTMLElement:", container);
            return;
          }

          NOVA.css.push(
            `${SELECTOR} ul {
                     border-radius: 12px;
                     background-color: var(--yt-spec-badge-chip-background);
                     font-size: 1.4rem;
                     line-height: 2rem;
                     padding: 10px;
                  }
                  ${SELECTOR} li {
                     color: var(--yt-spec-text-primary);
                  }
                  ${SELECTOR} a:not(:hover) {
                     color: var(--yt-spec-text-primary);
                     text-decoration: none;
                  }`,
          );

          const ul = document.createElement("ul");

          [
            { label: "hooktube.com", value: "hooktube.com" },
            { label: "clipzag.com", value: "clipzag.com" },
            { label: "piped.video", value: "piped.video" },
            { label: "yewtu.be", value: "yewtu.be" },
            { label: "nsfwyoutube.com", value: "nsfwyoutube.com" },
            { label: "yout-ube.com", value: "yout-ube.com" },
            {
              label: "riservato-xyz.frama.io",
              value: "riservato-xyz.frama.io",
            },
          ].forEach((domain) => {
            const li = document.createElement("li");

            const a = document.createElement("a");
            a.href = `${location.protocol}//${domain.value}${location.port ? ":" + location.port : ""}/watch?v=${video_id}`;
            a.target = "_blank";
            a.textContent = "→ Open with " + domain.label;
            a.title = "Open with " + domain.label;

            li.append(a);
            ul.append(li);
          });

          const liAtention = document.createElement("li");
          liAtention.classList.add(
            "bold",
            "style-scope",
            "yt-formatted-string",
          );
          liAtention.textContent =
            "Enable map select allowed country in your VPN";
          ul.append(liAtention);

          container.append(ul);
        }
      },
    );

    NOVA.waitSelector(
      `.ytd-page-manager[video-id][player-unavailable], ${SELECTOR_EMBED}`,
      { destroy_after_page_leaving: true },
    )

      .then((el) => {
        if (
          user_settings.video_unblock_region_domain &&
          el.querySelector(
            "yt-player-error-message-renderer #button.yt-player-error-message-renderer button",
          ) &&
          confirm(
            "Nova [video-unblock-region]\nThe video is not available in your region, open a in mirror?",
          )
        ) {
          redirect();
        }

        if (user_settings.video_unblock_region_open_map) {
          NOVA.request
            .API({
              request: "videos",
              params: {
                id:
                  NOVA.queryURL.get("v") ||
                  movie_player.getVideoData().video_id,
                part: "contentDetails",
              },
              api_key: user_settings["user-api-key"],
            })
            .then((res) => {
              if (res?.error)
                return alert(`Error [${res.code}]: ${res?.message}`);

              res?.items?.forEach((item) => {
                if ((data = item.contentDetails?.regionRestriction)) {
                  const mapLink = NOVA.queryURL.set(
                    data,
                    "https://raingart.github.io/region_map/",
                  );

                  NOVA.openPopup({
                    url: mapLink,
                    width: "1200px",
                    height: "600px",
                  });
                }
              });
            });
        }
      });

    function redirect(new_tab) {
      const videoId =
        NOVA.queryURL.get("v") || movie_player.getVideoData().video_id;

      if (new_tab) {
        window.open(
          `${location.protocol}//${user_settings.video_unblock_region_domain || "hooktube.com"}${location.port ? ":" + location.port : ""}/watch?v=${videoId}`,
        );
      } else {
        location.hostname =
          user_settings.video_unblock_region_domain || "hooktube.com";
      }
    }
  },
  options: {
    video_unblock_region_domain: {
      _tagName: "input",
      label: "Redirect to URL",

      type: "text",
      list: "video_unblock_region_domain_help_list",
      pattern: "^(?!-)[a-zA-Z0-9\\-]{1,63}(?<!-)\.[a-zA-Z]{2,6}$",
      title: 'without "https://"',

      "title:pl": "bez „https://”",

      placeholder: "domain.com",

      minlength: 5,
      maxlength: 20,
    },
    video_unblock_region_domain_help_list: {
      _tagName: "datalist",
      options: [
        { label: "hooktube.com", value: "hooktube.com" },
        { label: "clipzag.com", value: "clipzag.com" },
        { label: "piped.video", value: "piped.video" },
        { label: "yewtu.be", value: "yewtu.be" },
        { label: "nsfwyoutube.com", value: "nsfwyoutube.com" },
        { label: "yout-ube.com", value: "yout-ube.com" },
        { label: "riservato-xyz.frama.io", value: "riservato-xyz.frama.io" },
      ],
    },

    video_unblock_region_open_map: {
      _tagName: "input",
      label: "Open the map",

      "label:pl": "Otwórz mapę z dostępnością w regionach",

      type: "checkbox",
      title: "which regions is available",
    },
  },
});

window.nova_plugins.push({
  id: "embed-popup",
  title: "Open small embedded in Pop-ups",

  "title:pl": "Przekieruj osadzone wideo do wyskakującego okienka",

  run_on_pages: "embed, -mobile",
  section: "player",
  desc: "if iframe width is less than 720p",

  "plugins-conflict": "player-fullscreen-mode",
  _runtime: (user_settings) => {
    if (
      window.top === window.self ||
      location.hostname.includes("googleapis.com") ||
      NOVA.queryURL.has("popup")
    ) {
      return;
    }

    if (user_settings.player_full_viewport_mode == "redirect_watch_to_embed")
      return;

    if (user_settings["player-fullscreen-mode"]) return;

    const minWidth = +user_settings.embed_popup_min_width || 720;
    const minHeight = 480;

    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;

    if (windowWidth > minWidth && windowHeight > minHeight) return;

    NOVA.waitSelector("#movie_player video").then((video) => {
      video.addEventListener("playing", createPopup.bind(video), {
        capture: true,
        once: true,
      });
    });

    function createPopup() {
      const videoWidth = this.videoWidth || NOVA.videoElement.videoWidth;
      const videoHeight = this.videoHeight || NOVA.videoElement.videoHeight;

      if (videoWidth < windowWidth && videoHeight < windowHeight) return;

      const { width, height } = NOVA.aspectRatio.sizeToFit({
        src_width: videoWidth,
        src_height: videoHeight,
        max_width: Math.min(screen.width, videoWidth),
        max_height: Math.min(screen.height, videoHeight),
      });

      movie_player.stopVideo();

      const embedUrl = new URL(
        document.head.querySelector('link[itemprop="embedUrl"][href]')?.href ||
          location.origin + "/embed/" + movie_player.getVideoData().video_id,
      );

      embedUrl.searchParams.set("autoplay", 1);
      embedUrl.searchParams.set("popup", true);

      NOVA.openPopup({ url: embedUrl.href, width: width, height: height });
    }
  },
  options: {
    embed_popup_min_width: {
      _tagName: "input",
      label: "If the width iframe is smaller",

      type: "number",
      title: "in px",

      placeholder: "300-900",
      step: 5,
      min: 300,
      max: 900,
      value: 720,
    },
  },
});

window.nova_plugins.push({
  id: "video-rate",
  title: "Playback speed",

  "title:pl": "Kontrola prędkości odtwarzania",

  run_on_pages: "home, results, feed, channel, playlist, watch, embed",
  section: "player",

  desc: "With mouse wheel",
  "desc:zh": "带鼠标滚轮",
  "desc:ja": "マウスホイール付き",

  "desc:pl": "Za pomocą kółka myszy",

  _runtime: (user_settings) => {
    if (
      user_settings.rate_overlay_time &&
      +user_settings.rate_default !== 1 &&
      window?.localStorage
    ) {
      let channelsSpeed =
        user_settings["save-channel-state"] &&
        JSON.parse(
          localStorage.getItem(NOVA.storage_obj_manager.STORAGE_NAME_SPEED),
        );

      if (
        user_settings["save-channel-state"] &&
        !channelsSpeed &&
        NOVA.currentPage != "watch" &&
        NOVA.currentPage != "embed"
      ) {
        if (
          (customChannels = JSON.parse(
            localStorage.getItem(NOVA.storage_obj_manager.STORAGE_NAME),
          ))
        ) {
          const channelIds = Object.keys(customChannels);

          NOVA.request
            .API({
              request: "channels",
              params: {
                part: "snippet",
                id: channelIds.join(","),
              },
              api_key: user_settings["user-api-key"],
            })
            .then((res) => {
              let newStorage = {};
              res.items?.forEach((item) => {
                const channelSpeedData = customChannels[item.id]?.speed;
                if (channelSpeedData)
                  newStorage[item.snippet.customUrl.toLowerCase()] =
                    channelSpeedData;
              });
              channelsSpeed = newStorage;
              localStorage.setItem(
                NOVA.storage_obj_manager.STORAGE_NAME_SPEED,
                JSON.stringify(newStorage),
              );

              reCalcOverlayTime(newStorage);
            });
        }
      } else {
        reCalcOverlayTime(channelsSpeed);
      }
    }

    NOVA.waitSelector("#movie_player video").then((video) => {
      const sliderContainer = insertSlider.apply(video);

      video.addEventListener("ratechange", function () {
        NOVA.showOSD({
          message: this.playbackRate + "x",
          ui_value: this.playbackRate,
          ui_max: +user_settings.rate_max || 2,
          source: "rate",
        });

        if (user_settings.rate_slider && Object.keys(sliderContainer).length) {
          sliderContainer.slider.value = this.playbackRate;
          sliderContainer.slider.title = `Speed (${this.playbackRate})`;
          sliderContainer.sliderLabel.textContent = `Speed (${this.playbackRate})`;
          sliderContainer.sliderCheckbox.checked =
            this.playbackRate === 1 ? false : true;
        }
      });

      setDefaultRate.apply(video);

      video.addEventListener("loadeddata", setDefaultRate);

      if (user_settings.rate_slider && Object.keys(sliderContainer).length) {
        sliderContainer.slider.addEventListener("input", ({ target }) =>
          playerRate.set(target.value),
        );
        sliderContainer.slider.addEventListener("change", ({ target }) =>
          playerRate.set(target.value),
        );
        sliderContainer.slider.addEventListener("wheel", (evt) => {
          evt.preventDefault();
          const rate = playerRate.adjust(
            +user_settings.rate_step * Math.sign(evt.wheelDelta),
          );
        });
        sliderContainer.sliderCheckbox.addEventListener(
          "change",
          ({ target }) => target.checked || playerRate.set(1),
        );
      }

      NOVA.runOnPageLoad(async () => {
        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;

        if (
          user_settings["save-channel-state"] &&
          (customRate = await NOVA.storage_obj_manager.getParam("speed"))
        ) {
          video.addEventListener("playing", () => playerRate.set(customRate), {
            capture: true,
            once: true,
          });
        }

        expandAvailableRatesMenu();
      });
    });

    if (user_settings.rate_hotkey == "keyboard") {
      document.addEventListener(
        "keydown",
        (evt) => {
          if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed")
            return;
          if (NOVA.editableFocused(evt.target)) return;
          if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;

          let delta;
          switch (
            user_settings.rate_hotkey_custom_up.length === 1
              ? evt.key
              : evt.code
          ) {
            case user_settings.rate_hotkey_custom_up:
              delta = 1;
              break;
            case user_settings.rate_hotkey_custom_down:
              delta = -1;
              break;
          }
          if (delta) {
            evt.preventDefault();
            evt.stopPropagation();

            if ((step = +user_settings.rate_step * Math.sign(delta))) {
              const rate = playerRate.adjust(step);
            }
          }
        },
        { capture: true },
      );
    } else if (user_settings.rate_hotkey) {
      NOVA.waitSelector(".html5-video-container").then((container) => {
        container.addEventListener(
          "wheel",
          (evt) => {
            evt.preventDefault();

            if (
              evt[user_settings.rate_hotkey] ||
              (user_settings.rate_hotkey == "wheel" &&
                !evt.ctrlKey &&
                !evt.altKey &&
                !evt.shiftKey &&
                !evt.metaKey)
            ) {
              const step = +user_settings.rate_step * Math.sign(evt.wheelDelta);
              if (step) {
                const rate = playerRate.adjust(step);
              }
            }
          },
          { capture: true },
        );
      });
    }

    if (+user_settings.rate_default !== 1 && user_settings.rate_apply_music) {
      NOVA.waitSelector(
        "#upload-info #channel-name .badge-style-type-verified-artist",
      ).then(() => playerRate.set(1));

      NOVA.waitSelector("#upload-info #channel-name a[href]", {
        destroy_after_page_leaving: true,
      }).then((channel_name) => {
        if (
          /(VEVO|Topic|Records|AMV)$/.test(channel_name.textContent) ||
          channel_name.textContent.toUpperCase().includes("MUSIC")
        ) {
          playerRate.set(1);
        }
      });
    }

    const playerRate = {
      testDefault: (rate) =>
        +rate % 0.25 === 0 &&
        +rate <= 2 &&
        +user_settings.rate_default <= 2 &&
        NOVA.videoElement?.playbackRate <= 2 &&
        NOVA.videoElement?.playbackRate % 0.25 === 0 &&
        typeof movie_player === "object" &&
        typeof movie_player.getPlaybackRate === "function",

      async set(level = 1) {
        this.log("set", ...arguments);
        if (this.testDefault(level)) {
          this.log("set:default");
          movie_player.setPlaybackRate(+level) && this.saveInSession(level);
        } else {
          this.log("set:html5");

          if (NOVA.videoElement) {
            NOVA.videoElement.playbackRate = +level;
            this.clearInSession();
          }
        }
      },

      adjust(rate_step = required()) {
        this.log("adjust", ...arguments);

        return (
          (this.testDefault(rate_step) && this.default(+rate_step)) ||
          this.html5(+rate_step)
        );
      },

      default(playback_rate = required()) {
        this.log("default", ...arguments);
        const playbackRate = movie_player.getPlaybackRate();

        const inRange = (step) => {
          const setRateStep = playbackRate + step;
          return (
            0.1 <= setRateStep && setRateStep <= 2 && +setRateStep.toFixed(2)
          );
        };
        const newRate = inRange(+playback_rate);

        if (!newRate) return false;

        if (newRate && newRate != playbackRate) {
          movie_player.setPlaybackRate(newRate);

          if (newRate === movie_player.getPlaybackRate()) {
            this.saveInSession(newRate);
          } else {
            console.error(
              "playerRate:default different: %s!=%s",
              newRate,
              movie_player.getPlaybackRate(),
            );
          }
        }
        this.log("default return", newRate);
        return newRate === movie_player.getPlaybackRate() && newRate;
      },

      html5(playback_rate = required()) {
        this.log("html5", ...arguments);
        if (!NOVA.videoElement)
          return console.error(
            "playerRate > videoElement empty:",
            NOVA.videoElement,
          );

        const playbackRate = NOVA.videoElement.playbackRate;
        const inRange = (step) => {
          const setRateStep = playbackRate + step;
          return (
            0.1 <= setRateStep &&
            setRateStep <= (+user_settings.rate_max || 2) &&
            +setRateStep.toFixed(2)
          );
        };
        const newRate = inRange(+playback_rate);

        if (newRate && newRate != playbackRate) {
          NOVA.videoElement.playbackRate = newRate;

          if (newRate === NOVA.videoElement.playbackRate) {
            this.clearInSession();
          } else {
            console.error(
              "playerRate:html5 different: %s!=%s",
              newRate,
              NOVA.videoElement.playbackRate,
            );
          }
        }
        this.log("html5 return", newRate);
        return newRate === NOVA.videoElement.playbackRate && newRate;
      },

      saveInSession(level = required()) {
        if (!window?.sessionStorage) return;

        try {
          sessionStorage["yt-player-playback-rate"] = JSON.stringify({
            creation: Date.now(),
            data: level.toString(),
          });
          this.log("playbackRate save in session:", ...arguments);
        } catch (err) {
          console.warn(
            `${err.name}: save "rate" in sessionStorage failed. It seems that "Block third-party cookies" is enabled`,
            err.message,
          );
        }
      },

      clearInSession() {
        if (!window?.sessionStorage) return;

        const keyName = "yt-player-playback-rate";
        try {
          sessionStorage.hasOwnProperty(keyName) &&
            sessionStorage.removeItem(keyName);
          this.log("playbackRate save in session:", ...arguments);
        } catch (err) {
          console.warn(
            `${err.name}: save "rate" in sessionStorage failed. It seems that "Block third-party cookies" is enabled`,
            err.message,
          );
        }
      },

      log() {
        if (this.DEBUG && arguments.length) {
          console.groupCollapsed(...arguments);
          console.trace();
          console.groupEnd();
        }
      },
    };

    function setDefaultRate() {
      if (+user_settings.rate_default !== 1) {
        const is_music = NOVA.isMusic(
          user_settings.rate_apply_music == "expanded",
        );

        if (
          this.playbackRate !== +user_settings.rate_default &&
          (!user_settings.rate_apply_music || !is_music) &&
          !isNaN(this.duration) &&
          this.duration > 25
        ) {
          playerRate.set(user_settings.rate_default);
        } else if (this.playbackRate !== 1 && is_music) {
          playerRate.set(1);
        }
      }
    }

    function insertSlider() {
      if (!user_settings.rate_slider) return;

      const SELECTOR_ID = "nova-rate-slider-menu",
        SELECTOR = "#" + SELECTOR_ID;

      NOVA.css.push(
        `${SELECTOR} [type="range"] {
               vertical-align: text-bottom;
               margin: '0 5px',
            }

            ${SELECTOR} [type="checkbox"] {
               appearance: none;
               outline: none;
               cursor: pointer;
            }

            ${SELECTOR} [type="checkbox"]:checked {
               background-color: #f00;
            }

            ${SELECTOR} [type="checkbox"]:checked:after {
               left: 20px;
               background-color: white;
            }`,
      );

      const slider = document.createElement("input");
      slider.className = "ytp-menuitem-slider";
      slider.type = "range";
      slider.min = +user_settings.rate_step;
      slider.max = Math.max(
        +user_settings.rate_max || 2,
        +user_settings.rate_default,
      );
      slider.step = +user_settings.rate_step;
      slider.value = this.playbackRate;

      const sliderIcon = document.createElement("div");
      sliderIcon.className = "ytp-menuitem-icon";

      const sliderLabel = document.createElement("div");
      sliderLabel.className = "ytp-menuitem-label";
      sliderLabel.textContent = `Speed (${this.playbackRate})`;

      const sliderCheckbox = document.createElement("input");
      sliderCheckbox.className = "ytp-menuitem-toggle-checkbox";
      sliderCheckbox.type = "checkbox";
      sliderCheckbox.title = "Remember speed";

      const out = {};

      const right = document.createElement("div");
      right.className = "ytp-menuitem-content";
      out.sliderCheckbox = right.appendChild(sliderCheckbox);
      out.slider = right.appendChild(slider);

      const speedMenu = document.createElement("div");
      speedMenu.className = "ytp-menuitem";
      speedMenu.id = SELECTOR_ID;
      speedMenu.append(sliderIcon);
      out.sliderLabel = speedMenu.appendChild(sliderLabel);
      speedMenu.append(right);

      document.body.querySelector(".ytp-panel-menu")?.append(speedMenu);

      return out;
    }

    function expandAvailableRatesMenu() {
      if (typeof _yt_player !== "object") {
        return console.error(
          "expandAvailableRatesMenu > _yt_player is empty",
          _yt_player,
        );
      }

      if (
        (path = findPathInObj({
          obj: _yt_player,
          key: "getAvailablePlaybackRates",
        }))
      ) {
        setAvailableRates(_yt_player, 0, path.split("."));
      }

      function findPathInObj({
        obj = required(),
        key = required(),
        path = "",
      }) {
        const setPath = (d) => (path ? path + "." : "") + d;

        for (const prop in obj) {
          if (obj.hasOwnProperty(prop) && obj[prop]) {
            if (key === prop) {
              return setPath(prop);
            }

            if (typeof obj[prop] == "function") {
              for (const j in obj[prop]) {
                if (typeof obj[prop][j] !== "undefined") {
                  if (
                    (result = findPathInObj({
                      obj: obj[prop][j],
                      key: key,
                      path: setPath(prop) + "." + j,
                    }))
                  ) {
                    return result;
                  }
                }
              }
            }
          }
        }
      }

      function setAvailableRates(path, idx, arr) {
        if (arr.length - 1 == idx) {
          path[arr[idx]] = () => [
            0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25,
            3.5, 3.75, 4, 10,
          ];
        } else {
          setAvailableRates(path[arr[idx]], idx + 1, arr);
        }
      }
    }

    function reCalcOverlayTime(channels_speed) {
      const ATTR_MARK = "nova-thumb-overlay-time-recalc",
        thumbsSelectors = [
          "ytd-rich-item-renderer",
          "ytd-video-renderer",
          "ytd-playlist-renderer",

          "ytd-compact-video-renderer",
          "yt-append-continuation-items-action",
          "ytm-compact-video-renderer",
          "ytm-item-section-renderer",
        ].join(",");

      NOVA.css.push(
        `#thumbnail #overlays [${ATTR_MARK}]:not(:empty):before { content: '⚡'; }`,
      );

      document.addEventListener("scroll", () => {
        requestAnimationFrame(reCalc);
      });

      document.addEventListener(
        "visibilitychange",
        () => !document.hidden && reCalc(),
      );

      document.addEventListener("yt-action", (evt) => {
        switch (evt.detail?.actionName) {
          case "yt-append-continuation-items-action":
          case "ytd-update-grid-state-action":

          case "yt-service-request":
          case "ytd-rich-item-index-update-action":
            reCalc();
            break;
        }
      });

      function reCalc() {
        switch (NOVA.currentPage) {
          case "home":

          case "feed":
          case "channel":
          case "watch":
            document.body
              .querySelectorAll(
                `#thumbnail #overlays ytd-thumbnail-overlay-time-status-renderer .badge-shape-wiz__text:not([${ATTR_MARK}])`,
              )
              .forEach((overlay) => {
                const channelURLName = overlay
                  .closest(thumbsSelectors)
                  ?.querySelector("#channel-name a[href]")
                  ?.href?.split("/")
                  ?.pop()
                  ?.toLowerCase();
                const rate =
                  channels_speed?.[channelURLName] ||
                  user_settings.rate_default;

                const timeLabelEl = overlay.textContent.trim();
                if (timeLabelEl?.includes(":")) {
                  overlay.setAttribute(ATTR_MARK, true);

                  const timeSec = NOVA.formatTime.hmsToSec(timeLabelEl);
                  overlay.textContent = NOVA.formatTime.HMS.digit(
                    timeSec / rate,
                  );
                }
              });
            break;
        }
      }
    }
  },
  options: {
    rate_default: {
      _tagName: "input",

      label: "Default speed",

      "label:pl": "Prędkość przy uruchamianiu",

      type: "number",
      title: "1 - default",
      step: 0.05,
      min: 1,
      max: 5,
      value: 1,
    },
    rate_overlay_time: {
      _tagName: "input",
      label: "Recalculate time in thumbnail",

      type: "checkbox",
      title: 'by "startup" value',

      "data-dependent": { rate_default: "!1" },
      opt_api_key_warn: true,
    },
    rate_apply_music: {
      _tagName: "select",
      label: "Music video",

      options: [
        {
          label: "ignore",
          value: true,
          selected: true,
        },
        {
          label: "ignore (extended)",
          value: "expanded",
        },
        {
          label: "apply",
          value: false,
        },
      ],
      "data-dependent": { rate_default: "!1" },
    },
    rate_hotkey: {
      _tagName: "select",
      label: "Hotkey",

      "label:pl": "Klawisz skrótu",

      options: [
        { label: "none", value: "false" },
        { label: "alt+wheel", value: "altKey", selected: true },
        { label: "shift+wheel", value: "shiftKey" },
        { label: "ctrl+wheel", value: "ctrlKey" },
        { label: "wheel", value: "wheel" },
        { label: "keyboard", value: "keyboard" },
      ],
    },

    rate_hotkey_custom_up: {
      _tagName: "select",
      label: "Hotkey up",

      options: [
        { label: "]", value: "]", selected: true },
        { label: "none" },

        { label: "ShiftL", value: "ShiftLeft" },
        { label: "ShiftR", value: "ShiftRight" },
        { label: "CtrlL", value: "ControlLeft" },
        { label: "CtrlR", value: "ControlRight" },
        { label: "AltL", value: "AltLeft" },
        { label: "AltR", value: "AltRight" },
        { label: "ArrowUp", value: "ArrowUp" },
        { label: "ArrowDown", value: "ArrowDown" },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
      "data-dependent": { rate_hotkey: ["keyboard"] },
    },
    rate_hotkey_custom_down: {
      _tagName: "select",
      label: "Hotkey down",

      options: [
        { label: "[", value: "[", selected: true },
        { label: "none" },

        { label: "ShiftL", value: "ShiftLeft" },
        { label: "ShiftR", value: "ShiftRight" },
        { label: "CtrlL", value: "ControlLeft" },
        { label: "CtrlR", value: "ControlRight" },
        { label: "AltL", value: "AltLeft" },
        { label: "AltR", value: "AltRight" },
        { label: "ArrowUp", value: "ArrowUp" },
        { label: "ArrowDown", value: "ArrowDown" },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
      "data-dependent": { rate_hotkey: ["keyboard"] },
    },
    rate_step: {
      _tagName: "input",
      label: "Hotkey step",

      "label:pl": "Krok",

      type: "number",
      title: "0.25 - default",

      placeholder: "0.1-1",
      step: 0.05,
      min: 0.05,
      max: 0.5,
      value: 0.25,
      "data-dependent": { rate_hotkey: ["!false"] },
    },
    rate_max: {
      _tagName: "input",
      label: "Hotkey max",

      type: "number",
      title: "2 - default",

      placeholder: "2-5",
      step: 0.05,
      min: 2,
      max: 5,
      value: 2,
      "data-dependent": { rate_hotkey: ["!false"] },
    },
    rate_slider: {
      _tagName: "input",
      label: "Show slider",

      type: "checkbox",
      title: 'in "gear" dropdown menu',
    },
  },
});

window.nova_plugins.push({
  id: "shorts-redirect",

  title: "UnShort video",

  "title:pl": "Przełączaj Shorts na zwykłe adresy URL",

  run_on_pages: "shorts",
  restart_on_location_change: true,

  section: "player",
  desc: "Redirect Shorts video to normal player",
  "desc:zh": "将 Shorts 视频重定向到普通播放器",
  "desc:ja": "ショートパンツのビデオを通常のプレーヤーにリダイレクトする",

  "desc:pl": "Przełącza krótkie filmy do normalnego odtwarzacza",

  _runtime: (user_settings) => {
    location.href = location.href.replace("shorts/", "watch?v=");
  },
});

window.nova_plugins.push({
  id: "theater-mode",
  title: "Auto wide player (Theater mode)",

  "title:pl": "Tryb kinowy",

  run_on_pages: "watch, -mobile",
  section: "player",

  _runtime: (user_settings) => {
    if (user_settings.player_full_viewport_mode == "redirect_watch_to_embed") {
      return location.assign(
        `https://www.youtube.com/embed/` + NOVA.queryURL.get("v"),
      );
    }

    if (
      user_settings.theater_mode_ignore_playlist &&
      location.search.includes("list=")
    )
      return;

    NOVA.waitSelector(
      ".ytd-page-manager[video-id]:not([player-unavailable])",
    ).then((el) => {
      if (isTheaterMode()) return;

      NOVA.waitUntil(() => isTheaterMode() || toggleTheater(), 1000);

      function isTheaterMode() {
        return (
          NOVA.getPlayerState.visibility() == "THEATER" ||
          el.hasAttribute("theater") ||
          (typeof el.isTheater_ === "function" && el.isTheater_())
        );
      }

      function toggleTheater() {
        if (
          (btn = document.body.querySelector(
            ".ytp-chrome-bottom .ytp-size-button",
          ))
        ) {
          btn.click();
        } else {
          (typeof movie_player === "object"
            ? movie_player
            : document
          ).dispatchEvent(
            new KeyboardEvent("keydown", {
              keyCode: 84,
              key: "t",
              code: "KeyT",
              which: 84,

              bubbles: true,
              cancelable: false,
            }),
          );
        }
      }

      if (!user_settings["video-unblock-warn-content"]) {
        NOVA.waitSelector(
          ".ytd-page-manager[video-id][player-unavailable] yt-player-error-message-renderer #button.yt-player-error-message-renderer button",
          { destroy_after_page_leaving: true },
        ).then((btn) => btn.click());
      }
    });

    if (user_settings.player_full_viewport_mode == "") return;

    if (
      user_settings["player-fullscreen-mode"] &&
      !user_settings.player_fullscreen_mode_embed &&
      user_settings.player_full_viewport_mode != "cinema"
    ) {
      return;
    }

    NOVA.waitSelector("#movie_player").then((movie_player) => {
      const PLAYER_CONTAINER_SELECTOR =
          ".ytd-page-manager[video-id][theater]:not([fullscreen]) #ytd-player",
        PINNED_SELECTOR = ".nova-player-pin",
        PLAYER_SCROLL_LOCK_CLASS_NAME = "nova-lock-scroll",
        _PLAYER_SELECTOR = `#movie_player:not(${PINNED_SELECTOR}):not(.${PLAYER_SCROLL_LOCK_CLASS_NAME})`,
        PLAYER_SELECTOR = `${PLAYER_CONTAINER_SELECTOR} ${_PLAYER_SELECTOR}`,
        zIndex = Math.max(getComputedStyle(movie_player)["z-index"], 2020);

      addScrollDownBehavior(movie_player);

      switch (user_settings.player_full_viewport_mode) {
        case "offset":
          NOVA.css.push(
            `${PLAYER_CONTAINER_SELECTOR}${user_settings.player_full_viewport_mode_exit ? `:has(${_PLAYER_SELECTOR}.playing-mode)` : ""} {
                        min-height: calc(100vh - ${
                          user_settings["header-compact"]
                            ? "36px"
                            : NOVA.css.get("#masthead-container", "height") ||
                              "56px"
                        }) !important;
                     }` +
              `.ytd-page-manager[video-id][theater]:not([fullscreen]) ${user_settings.player_full_viewport_mode_exit ? `*:has(${_PLAYER_SELECTOR}.playing-mode) ~` : ""} #columns {
                        position: absolute;
                        top: 100vh;
                     }
                     ${PLAYER_SELECTOR} {
                        background-color: black;
                     }`,
          );

          fixOnPause();
          break;

        case "force":
          setPlayerFullViewport(user_settings.player_full_viewport_mode_exit);
          break;

        case "smart":
          if (
            user_settings.player_full_viewport_mode_exclude_shorts &&
            NOVA.currentPage == "shorts"
          ) {
            return;
          }

          NOVA.waitSelector("video").then((video) => {
            video.addEventListener("loadeddata", function () {
              if (
                user_settings.player_full_viewport_mode_exclude_shorts &&
                this.videoWidth < this.videoHeight
              ) {
                return;
              }
              const miniSize = NOVA.aspectRatio.sizeToFit({
                src_Width: this.videoWidth,
                src_Height: this.videoHeight,
                max_Width: window.innerWidth,
                max_Height: window.innerHeight,
              });

              if (miniSize.width < window.innerWidth) {
                setPlayerFullViewport("player_full_viewport_mode_exit");
              }
            });
          });
          break;

        case "cinema":
          NOVA.css.push(
            `${PLAYER_SELECTOR} { z-index: ${zIndex}; }

                     ${PLAYER_SELECTOR}:before {
                        content: '';
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, ${+user_settings.cinema_mode_opacity});
                        opacity: 0;
                        transition: opacity 400ms ease-in-out;
                        pointer-events: none;
                     }


                     ${PLAYER_SELECTOR}.playing-mode:before { opacity: 1; }


                     .ytp-ad-player-overlay,
                     #playlist:hover,
                     #masthead-container:hover,
                     iframe,
                     #guide,
                     [class*="popup"],
                     [role="navigation"],
                     [role="dialog"] {
                        z-index: ${zIndex + 1};
                     }
                     #playlist:hover { position: relative; }`,
          );

          addHideScrollbarCSS();
          break;
      }

      function setPlayerFullViewport(exclude_pause) {
        NOVA.css.push(
          `${PLAYER_SELECTOR}.paused-mode${exclude_pause ? `.ytp-progress-bar-hover.${fixOnSeeking}` : ``},
                  ${PLAYER_SELECTOR}.playing-mode {
                     width: 100vw;
                     height: 100vh;
                     position: fixed;
                     bottom: 0 !important;
                     z-index: ${zIndex};
                     background-color: black;
                  }`,
        );

        if (CSS.supports("selector(:has(*))")) {
          NOVA.css.push(
            `#masthead-container:has( ~ #page-manager .ytd-page-manager[video-id][theater]) {
                        position: fixed;
                        z-index: ${zIndex + 1};
                        opacity: 0;
                     }
                     #masthead-container:has( ~ #page-manager .ytd-page-manager[video-id][theater]):hover,
                     #masthead-container:has( ~ #page-manager .ytd-page-manager[video-id][theater]):focus {
                        opacity: 1;
                     }`,
          );
        }

        addHideScrollbarCSS();

        fixOnPause();
      }

      function fixOnPause() {
        if (!user_settings.player_full_viewport_mode_exit) return;

        NOVA.waitSelector("video").then((video) => {
          video.addEventListener("pause", () => {
            if (
              !document.body
                .querySelector(".ytp-progress-bar")
                ?.contains(document.activeElement)
            ) {
              window.dispatchEvent(new Event("resize"));
            }
          });

          video.addEventListener("play", () =>
            window.dispatchEvent(new Event("resize")),
          );
        });
      }

      function addScrollDownBehavior(movie_player = required()) {
        document.body
          .querySelector(".ytp-chrome-controls")
          ?.addEventListener("wheel", (evt) => {
            switch (Math.sign(evt.wheelDelta)) {
              case 1:
                if (
                  window.scrollY === 0 &&
                  movie_player.classList.contains(PLAYER_SCROLL_LOCK_CLASS_NAME)
                ) {
                  movie_player.classList.remove(PLAYER_SCROLL_LOCK_CLASS_NAME);
                  triggerPlayerLayoutUpdate();
                }
                break;

              case -1:
                if (
                  !movie_player.classList.contains(
                    PLAYER_SCROLL_LOCK_CLASS_NAME,
                  )
                ) {
                  movie_player.classList.add(PLAYER_SCROLL_LOCK_CLASS_NAME);
                  triggerPlayerLayoutUpdate();
                }
                break;
            }
          });

        async function triggerPlayerLayoutUpdate() {
          await NOVA.delay(200);
          window.dispatchEvent(new Event("resize"));
        }
      }

      function addHideScrollbarCSS() {
        if (user_settings["scrollbar-hide"]) return;

        NOVA.css.push(
          `html body:has(${PLAYER_SELECTOR})::-webkit-scrollbar { display: none }`,
        );
      }
    });
  },
  options: {
    player_full_viewport_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "default",
          selected: true,
        },
        {
          label: "cinema",
          value: "cinema",
        },
        {
          label: "full-viewport",
          value: "force",
        },
        {
          label: "full-viewport (auto)",
          value: "smart",
        },
        {
          label: "full-viewport+searchBar",
          value: "offset",
        },
        {
          label: "redirect to embedded",
          value: "redirect_watch_to_embed",
        },
      ],
    },
    player_full_viewport_mode_exit: {
      _tagName: "input",

      label: "Switch on end/pause",

      "label:pl": "Wyjdź, gdy film się kończy/pauzuje",

      type: "checkbox",

      "data-dependent": {
        player_full_viewport_mode: ["force", "smart", "offset"],
      },
    },
    player_full_viewport_mode_exclude_shorts: {
      _tagName: "input",
      label: "Full-viewport exclude shorts",

      "label:pl": "Pełny ekran wyklucza krótkie filmy",

      type: "checkbox",

      "data-dependent": { player_full_viewport_mode: "smart" },
    },
    cinema_mode_opacity: {
      _tagName: "input",
      label: "Opacity",

      "label:pl": "Przezroczystość",

      type: "number",
      title: "0-1",
      placeholder: "0-1",
      step: 0.05,
      min: 0,
      max: 1,
      value: 0.75,
      "data-dependent": { player_full_viewport_mode: "cinema" },
    },
    theater_mode_ignore_playlist: {
      _tagName: "input",
      label: "Ignore in playlist",

      "label:pl": "Zignoruj listę odtwarzania",

      type: "checkbox",
    },
  },
});

window.nova_plugins.push({
  id: "video-unblock-warn-content",
  title: "Skip inappropriate/offensive content warn",

  run_on_pages: "watch, embed, -mobile",
  section: "player",
  desc: "skip 'The following content may contain suicide or self-harm topics.'",

  _runtime: (user_settings) => {
    NOVA.waitSelector(
      ".ytd-page-manager[video-id][player-unavailable] #player-error-message-container #info button",
      { destroy_after_page_leaving: true },
    ).then((btn) => btn.click());
  },
});
window.nova_plugins.push({
  id: "disable-player-sleep-mode",

  title: 'Skip "Continue watching?" popup',

  "title:pl": "Wyłącz tryb uśpienia odtwarzacza",

  run_on_pages: "watch, -mobile",
  section: "player",

  _runtime: (user_settings) => {
    setInterval(
      () => {
        if (!document.hasFocus()) {
          document.dispatchEvent(
            new KeyboardEvent("keyup", {
              keyCode: 143,

              which: 143,

              bubbles: true,
              cancelable: true,
            }),
          );
        }
      },
      1000 * 60 * 5,
    );
  },
});

window.nova_plugins.push({
  id: "player-pin-scroll",
  title: "Pin player while scrolling",

  "title:pl": "Przypnij odtwarzacz podczas przewijania",

  run_on_pages: "watch, -mobile",
  section: "player",
  desc: "Show mini player when scrolling down",

  _runtime: (user_settings) => {
    if (!("IntersectionObserver" in window))
      return alert(
        "Nova\n\nPin player Error!\nIntersectionObserver not supported.",
      );

    const CLASS_VALUE = "nova-player-pin",
      PINNED_SELECTOR = "." + CLASS_VALUE,
      UNPIN_BTN_CLASS_VALUE = CLASS_VALUE + "-unpin-btn",
      UNPIN_BTN_SELECTOR = "." + UNPIN_BTN_CLASS_VALUE;

    let makeDraggable;

    document.addEventListener(
      "scroll",
      () => {
        NOVA.waitSelector("#ytd-player").then((container) => {
          makeDraggable = new NOVA.Draggable();

          new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                movie_player.classList.remove(CLASS_VALUE);
                makeDraggable.reset();
                makeDraggable.disable();
              } else if (
                !document.fullscreenElement &&
                document.documentElement.scrollTop
              ) {
                movie_player.classList.add(CLASS_VALUE);

                makeDraggable.init(movie_player);

                if (makeDraggable.dragging.final)
                  makeDraggable.moveByCoordinates(makeDraggable.dragging.final);
              }

              window.dispatchEvent(new Event("resize"));
            },
            {
              threshold: 0.5,
            },
          ).observe(container);
        });
      },
      { capture: true, once: true },
    );

    NOVA.waitSelector(PINNED_SELECTOR).then(async (player) => {
      await NOVA.waitUntil(
        () =>
          NOVA.videoElement?.videoWidth &&
          !isNaN(NOVA.videoElement.videoWidth) &&
          NOVA.videoElement?.videoHeight &&
          !isNaN(NOVA.videoElement.videoHeight),

        500,
      );

      initMiniStyles();

      insertUnpinButton(player);

      document.addEventListener("fullscreenchange", () => {
        document.fullscreenElement &&
          movie_player.classList.remove(CLASS_VALUE);
      });

      NOVA.waitSelector("#movie_player video").then((video) => {
        video.addEventListener("loadeddata", () => {
          if (NOVA.currentPage != "watch") return;

          NOVA.waitSelector(PINNED_SELECTOR, {
            destroy_after_page_leaving: true,
          }).then(() => {
            const width = NOVA.aspectRatio.calculateWidth(
              movie_player.clientHeight,

              NOVA.aspectRatio.chooseAspectRatio({
                width: NOVA.videoElement.videoWidth,
                height: NOVA.videoElement.videoHeight,
                layout: "landscape",
              }),
            );
            player.style.setProperty("--width", `${width}px !important;`);
          });
        });
      });

      if (
        user_settings.player_float_scroll_after_fullscreen_restore_srcoll_pos
      ) {
        let scrollPos = 0;

        document.addEventListener("yt-navigate-start", () => (scrollPos = 0));

        document.addEventListener(
          "fullscreenchange",
          () => {
            if (
              !document.fullscreenElement &&
              scrollPos &&
              makeDraggable.dragging.final !== 0 &&
              makeDraggable.dragging.final !== 0
            ) {
              window.scrollTo({
                top: scrollPos,
              });
            }
          },
          { capture: false },
        );

        document.addEventListener(
          "fullscreenchange",
          () => {
            if (document.fullscreenElement) {
              scrollPos = document.documentElement.scrollTop;
            }
          },
          { capture: true },
        );
      }
    });

    function initMiniStyles() {
      const scrollbarWidth =
        (window.innerWidth - document.documentElement.clientWidth || 0) + "px";
      const miniSize = NOVA.aspectRatio.sizeToFit({
        src_width: NOVA.videoElement.videoWidth,
        src_height: NOVA.videoElement.videoHeight,
        max_width:
          window.innerWidth / user_settings.player_float_scroll_size_ratio,
        max_height:
          window.innerHeight / user_settings.player_float_scroll_size_ratio,
      });

      let initcss = {
        width:
          NOVA.aspectRatio.calculateWidth(
            miniSize.height,

            NOVA.aspectRatio.chooseAspectRatio({
              width: miniSize.width,
              height: miniSize.height,
            }),
          ) + "px",

        height: miniSize.height + "px",
        position: "fixed",
        "z-index": "var(--zIndex)",
        "box-shadow":
          "0 16px 24px 2px rgba(0, 0, 0, .14)," +
          "0 6px 30px 5px rgba(0, 0, 0, .12)," +
          "0 8px 10px -5px rgba(0, 0, 0, .4)",
      };

      switch (user_settings.player_float_scroll_position) {
        case "top-left":
          initcss.top = user_settings["header-unfixed"]
            ? 0
            : (document.getElementById("masthead-container")?.offsetHeight ||
                0) + "px";
          initcss.left = 0;
          break;
        case "top-right":
          initcss.top = user_settings["header-unfixed"]
            ? 0
            : (document.getElementById("masthead-container")?.offsetHeight ||
                0) + "px";
          initcss.right = scrollbarWidth;
          break;
        case "bottom-left":
          initcss.bottom = 0;
          initcss.left = 0;
          break;
        case "bottom-right":
          initcss.bottom = 0;
          initcss.right = scrollbarWidth;
          break;
      }

      NOVA.css.push(initcss, PINNED_SELECTOR, "important");

      NOVA.css.push(
        `html[style*="ytrb-bar"] ${PINNED_SELECTOR} {
               --zIndex: 1000;
            }
            ${PINNED_SELECTOR} {
               --height: ${initcss.height} !important;
               --width: ${initcss.width} !important;

               width: var(--width) !important;
               height: var(--height) !important;

               background-color: var(--yt-spec-base-background);
               ${user_settings["square-avatars"] ? "" : "border-radius: 12px;"}
               margin: 1em 2em;
               --zIndex: ${
                 1 +
                 Math.max(
                   NOVA.css.get("#chat", "z-index"),
                   NOVA.css.get(".ytp-chrome-top .ytp-cards-button", "z-index"),
                   NOVA.css.get("#chat", "z-index"),
                   NOVA.css.get("ytrb-bar", "z-index"),

                   601,
                 )
               };
            }
            ${PINNED_SELECTOR} video {
               object-fit: contain !important;
            }

            ${PINNED_SELECTOR} .ytp-chrome-controls .nova-right-custom-button,
            ${PINNED_SELECTOR} .ytp-chrome-controls #nova-player-time-remaining,
            ${PINNED_SELECTOR} .ytp-chrome-controls button.ytp-size-button,
            ${PINNED_SELECTOR} .ytp-chrome-controls button.ytp-subtitles-button,
            ${PINNED_SELECTOR} .ytp-chrome-controls button.ytp-settings-button,
            ${PINNED_SELECTOR} .ytp-chrome-controls .ytp-chapter-container {
               display: none !important;
            }`,
      );

      NOVA.css.push(
        `${PINNED_SELECTOR} .ytp-preview,
            ${PINNED_SELECTOR} .ytp-scrubber-container,
            ${PINNED_SELECTOR} .ytp-hover-progress,
            ${PINNED_SELECTOR} .ytp-gradient-bottom { display:none !important; }

            ${PINNED_SELECTOR} .ytp-chrome-bottom { width: 96% !important; }
            ${PINNED_SELECTOR} .ytp-chapters-container { display: flex; }`,
      );

      NOVA.css.push(
        `${PINNED_SELECTOR} video {
               width: var(--width) !important;
               height: var(--height) !important;
               left: 0 !important;
               top: 0 !important;
            }
            ${PINNED_SELECTOR}.ended-mode video {
               visibility: hidden;
            }`,
      );
    }

    function insertUnpinButton(player = movie_player) {
      NOVA.css.push(
        `${UNPIN_BTN_SELECTOR} { display: none; }

            ${PINNED_SELECTOR} ${UNPIN_BTN_SELECTOR} {
               display: inherit !important;
               position: absolute;
               cursor: pointer;
               top: 10px;
               left: 10px;
               width: 28px;
               height: 28px;
               color: white;
               border: none;
               outline: none;
               opacity: .1;
               ${user_settings["square-avatars"] ? "" : "border-radius: 100%;"}
               z-index: var(--zIndex);
               font-size: 24px;
               font-weight: bold;
               background-color: rgba(0, 0, 0, .8);
               transition: opacity 100ms linear;

            }

            ${PINNED_SELECTOR}:hover ${UNPIN_BTN_SELECTOR} { opacity: .7; }
            ${UNPIN_BTN_SELECTOR}:hover { opacity: 1 !important; }`,
      );

      const btnUnpin = document.createElement("button");
      btnUnpin.className = UNPIN_BTN_CLASS_VALUE;
      btnUnpin.title = "Unpin player";
      btnUnpin.textContent = "×";
      btnUnpin.addEventListener("click", () => {
        player.classList.remove(CLASS_VALUE);
        makeDraggable.reset("clear_final");
        window.dispatchEvent(new Event("resize"));
      });
      player.append(btnUnpin);

      document.addEventListener("yt-navigate-start", () => {
        if (player.classList.contains(CLASS_VALUE)) {
          player.classList.remove(CLASS_VALUE);
          makeDraggable.reset();
        }
      });
    }
  },
  options: {
    player_float_scroll_size_ratio: {
      _tagName: "input",
      label: "Player size",

      "label:pl": "Rozmiar odtwarzacza",

      type: "number",
      title: "Less value - larger size",

      "title:pl": "Mniejsza wartość - większy rozmiar",

      placeholder: "2-5",
      step: 0.1,
      min: 2,
      max: 5,
      value: 2.5,
    },
    player_float_scroll_position: {
      _tagName: "select",

      label: "Player position",

      "label:pl": "Pozycja odtwarzacza",

      options: [
        {
          label: "↖",
          value: "top-left",
        },
        {
          label: "↗",
          value: "top-right",
          selected: true,
        },
        {
          label: "↙",
          value: "bottom-left",
        },
        {
          label: "↘",
          value: "bottom-right",
        },
      ],
    },

    player_float_scroll_after_fullscreen_restore_srcoll_pos: {
      _tagName: "input",
      label: "Restore scrolling back there after exiting fullscreen",

      type: "checkbox",
    },
  },
});

window.nova_plugins.push({
  id: "pause-background-tab",

  title: "Pauses playing videos in other tabs",

  run_on_pages: "watch, embed",
  section: "player",
  desc: "Autopause all background tabs except the active one",

  _runtime: (user_settings) => {
    if (location.hostname.includes("youtube-nocookie.com")) {
      return;
    }

    if (!window?.localStorage) return;

    const storeName = "nova-playing-instanceIDTab",
      instanceID = String(Math.random()),
      removeStorage = () => localStorage.removeItem(storeName);

    NOVA.waitSelector("video").then((video) => {
      video.addEventListener("playing", () => {
        if (
          localStorage.hasOwnProperty(storeName) &&
          localStorage.getItem(storeName) !== instanceID &&
          !document.pictureInPictureElement &&
          !user_settings.pause_background_tab_autoplay_onfocus
        ) {
          video.pause();
        } else {
          localStorage.setItem(storeName, instanceID);
        }
      });

      ["pause", "ended"].forEach((evt) =>
        video.addEventListener(evt, removeStorage),
      );

      window.addEventListener("beforeunload", removeStorage);

      window.addEventListener("storage", (store) => {
        if (
          (!document.hasFocus() || NOVA.currentPage == "embed") &&
          store.key === storeName &&
          store.storageArea === localStorage &&
          localStorage.hasOwnProperty(storeName) &&
          localStorage.getItem(storeName) !== instanceID &&
          "PLAYING" == NOVA.getPlayerState.playback() &&
          !document.pictureInPictureElement
        ) {
          video.pause();
        }
      });

      if (user_settings.pause_background_tab_autoplay_onfocus) {
        window.addEventListener(
          "focus",
          () => {
            if (
              ["UNSTARTED", "PAUSED"].includes(NOVA.getPlayerState.playback())
            ) {
              video.play();

              if (
                user_settings.pause_background_tab_autoplay_onfocus === true
              ) {
                user_settings.pause_background_tab_autoplay_onfocus = false;
              }
            }
          },
          {
            capture: true,
            once: user_settings.pause_background_tab_autoplay_onfocus === true,
          },
        );
      }

      switch (user_settings.pause_background_tab_autopause_unfocus) {
        case "focus":
          window.addEventListener("blur", () => {
            if (
              "PLAYING" == NOVA.getPlayerState.playback() &&
              !document.pictureInPictureElement
            ) {
              video.pause();
            }
          });
          break;

        case "visibility":
          document.addEventListener("visibilitychange", () => {
            switch (document.visibilityState) {
              case "hidden":
                video.pause();
                break;
            }
          });
          break;
      }
    });
  },
  options: {
    pause_background_tab_autoplay_onfocus: {
      _tagName: "select",
      label: "Autoplay on tab focus",

      "label:pl": "Autoodtwarzanie po wybraniu karty",

      options: [
        {
          label: "none",
          selected: true,
        },
        {
          label: "once",
          value: true,
        },
        {
          label: "always",
          value: "force",
        },
      ],
    },
    pause_background_tab_autopause_unfocus: {
      _tagName: "select",
      label: "Autopause if tab loses on",

      "label:pl": "Automatycznie wstrzymaj wideo, jeśli karta straci ostrość",

      options: [
        {
          label: "disable",
          selected: true,
        },
        {
          label: "visibility",
          value: "visibility",
        },
        {
          label: "focus",
          value: "focus",
        },
      ],
    },
  },
});

window.nova_plugins.push({
  id: "video-zoom",
  title: "Zoom video",

  run_on_pages: "watch, embed, -mobile",
  section: "player",
  desc: "Remove horizontal black bars",

  _runtime: (user_settings) => {
    const ZOOM_CLASS_NAME = "nova-zoom";
    const ZOOM_MAX = 250;

    NOVA.waitSelector(".html5-video-container").then((container) => {
      let zoomPercent = 100;

      if (user_settings.zoom_hotkey == "keyboard") {
        document.addEventListener(
          "keydown",
          (evt) => {
            if (!filteredEvent(evt)) return;

            let delta;
            switch (
              user_settings.zoom_hotkey_custom_in.length === 1
                ? evt.key
                : evt.code
            ) {
              case user_settings.zoom_hotkey_custom_in:
                delta = 1;
                break;
              case user_settings.zoom_hotkey_custom_out:
                delta = -1;
                break;
            }

            if (delta) {
              evt.preventDefault();
              evt.stopPropagation();

              if ((step = +user_settings.zoom_step * Math.sign(delta))) {
                setScale(zoomPercent + step);
              }
            }
          },
          { capture: true },
        );
      } else if (user_settings.zoom_hotkey) {
        container.addEventListener(
          "wheel",
          (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            if (
              evt[user_settings.zoom_hotkey] ||
              (user_settings.zoom_hotkey == "wheel" &&
                !evt.ctrlKey &&
                !evt.altKey &&
                !evt.shiftKey &&
                !evt.metaKey)
            ) {
              const step = +user_settings.zoom_step * Math.sign(evt.wheelDelta);
              if (step) setScale(zoomPercent + step);
            }
          },
          { capture: true },
        );
      }

      if ((hotkey = user_settings.zoom_auto_max_width_hotkey_toggle)) {
        document.addEventListener(
          "keyup",
          (evt) => {
            if (!filteredEvent(evt)) return;

            if ((hotkey.length === 1 ? evt.key : evt.code) === hotkey) {
              const zoomMax =
                +user_settings.zoom_auto_max_width || geVideoMaxWidthPercent();
              setScale(zoomPercent === zoomMax ? 100 : zoomMax);
            }
          },
          { capture: true },
        );
      }

      let customZoom;

      if (user_settings["save-channel-state"]) {
        NOVA.runOnPageLoad(async () => {
          if (
            (NOVA.currentPage == "watch" || NOVA.currentPage == "embed") &&
            (customZoom = await NOVA.storage_obj_manager.getParam("zoom"))
          ) {
            setScale(customZoom * 100);
          }
        });
      }

      function setScale(zoom_pt = 100) {
        zoom_pt = Math.max(100, Math.min(ZOOM_MAX, Math.trunc(zoom_pt)));

        if (zoom_pt === 100 && container.classList.contains(ZOOM_CLASS_NAME)) {
          container.classList.remove(ZOOM_CLASS_NAME);
          container.style.removeProperty("transform");
        } else if (
          zoom_pt !== 100 &&
          !container.classList.contains(ZOOM_CLASS_NAME)
        ) {
          container.classList.add(ZOOM_CLASS_NAME);
        }

        NOVA.showOSD({
          message: `Zoom:`,
          ui_value: zoom_pt,
          ui_max: ZOOM_MAX,
          source: "zoom",
        });

        if (zoom_pt === zoomPercent) return;

        zoomPercent = zoom_pt;

        container.style.setProperty("transform", `scale(${zoom_pt / 100})`);

        document.addEventListener(
          "yt-navigate-start",
          () => {
            container?.style.removeProperty("transform");
          },
          { capture: true, once: true },
        );
      }

      function geVideoMaxWidthPercent() {
        return Math.min(
          ZOOM_MAX,
          Math.trunc(
            (movie_player.clientWidth / NOVA.videoElement.videoHeight) * 100,
          ),
        );
      }

      function filteredEvent(evt = required()) {
        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;
        if (NOVA.editableFocused(evt.target)) return;
        if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;

        return true;
      }

      NOVA.css.push(
        `.${ZOOM_CLASS_NAME} {
                  transition: transform 100ms linear;
                  transform-origin: center;
               }
               .${ZOOM_CLASS_NAME} video {
                  position: relative !important;
               }`,
      );
    });
  },
  options: {
    zoom_hotkey: {
      _tagName: "select",
      label: "Hotkey",

      "label:pl": "Klawisz skrótu",

      options: [
        { label: "none" },
        { label: "wheel", value: "wheel" },
        { label: "shift+wheel", value: "shiftKey" },
        { label: "ctrl+wheel", value: "ctrlKey" },
        { label: "alt+wheel", value: "altKey" },
        { label: "keyboard", value: "keyboard", selected: true },
      ],
    },
    zoom_hotkey_custom_in: {
      _tagName: "select",
      label: "Hotkey zoom in",

      options: [
        { label: "+", value: "+", selected: true },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
      "data-dependent": { zoom_hotkey: ["keyboard"] },
    },
    zoom_hotkey_custom_out: {
      _tagName: "select",
      label: "Hotkey zoom out",

      options: [
        { label: "-", value: "-", selected: true },

        { label: "ShiftL", value: "ShiftLeft" },
        { label: "ShiftR", value: "ShiftRight" },
        { label: "CtrlL", value: "ControlLeft" },
        { label: "CtrlR", value: "ControlRight" },
        { label: "AltL", value: "AltLeft" },
        { label: "AltR", value: "AltRight" },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "+",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
      "data-dependent": { zoom_hotkey: ["keyboard"] },
    },
    zoom_step: {
      _tagName: "input",
      label: "Hotkey step",

      "label:pl": "Krok",

      type: "number",
      title: "in %",

      placeholder: "%",
      step: 5,
      min: 5,
      max: 50,
      value: 10,
    },
    zoom_auto_max_width_hotkey_toggle: {
      _tagName: "select",
      label: "Hotkey toggle fit to width",

      title: "exception square video",

      options: [
        { label: "none", value: false },

        { label: "ShiftL", value: "ShiftLeft" },
        { label: "ShiftR", value: "ShiftRight" },
        { label: "CtrlL", value: "ControlLeft" },
        { label: "CtrlR", value: "ControlRight" },
        { label: "AltL", value: "AltLeft" },
        { label: "AltR", value: "AltRight" },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ", selected: true },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
    },
    zoom_auto_max_width: {
      _tagName: "input",
      label: "Hotkey max width",

      type: "number",
      title: "in %",

      placeholder: "%",
      step: 1,
      min: 0,
      max: 200,
      value: 130,

      "data-dependent": { zoom_auto_max_width_hotkey_toggle: "!false" },
    },
  },
});
window.nova_plugins.push({
  id: "player-disable-fullscreen-scroll",
  title: "Disable scrolling for fullscreen player",

  "title:pl": "Wyłącz przewijanie w trybie pełnoekranowym",

  run_on_pages: "watch, -mobile",
  section: "player",

  _runtime: (user_settings) => {
    NOVA.css.push(
      `.ytp-chrome-controls button.ytp-fullerscreen-edu-button { display: none !important; }`,
    );

    document.addEventListener("fullscreenchange", () => {
      document.fullscreenElement
        ? document.addEventListener("wheel", lockscroll, { passive: false })
        : document.removeEventListener("wheel", lockscroll);
    });

    function lockscroll(evt) {
      evt.preventDefault();
    }
  },
});

window.nova_plugins.push({
  id: "video-quality",
  title: "Video quality",

  "title:pl": "Jakość wideo",

  run_on_pages: "watch, embed",
  section: "player",

  _runtime: (user_settings) => {
    class PlayerState {
      constructor() {
        this.quality_lock = false;
        PlayerState.qualityToSet = user_settings.video_quality;
      }

      addEventListeners(movie_player) {
        if (
          user_settings.video_quality_manual_save_in_tab &&
          NOVA.currentPage == "watch"
        ) {
          movie_player.addEventListener(
            "onPlaybackQualityChange",
            (quality) => {
              if (
                document.activeElement.classList.contains(
                  "ytp-settings-button",
                ) &&
                quality !== user_settings.video_quality
              ) {
                console.info(`keep quality "${quality}" in the session`);
                user_settings.video_quality = quality;

                user_settings.video_quality_for_music = false;
                user_settings.video_quality_for_fullscreen = false;
              }
            },
            { capture: true },
          );
        }

        if (user_settings["save-channel-state"]) {
          NOVA.runOnPageLoad(async () => {
            if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed")
              return;

            const customQuality =
              await NOVA.storage_obj_manager.getParam("quality");
            if (customQuality) {
              user_settings.video_quality = customQuality;
              qualityManager.setQuality(movie_player.getPlayerState());
            }
          });
        }

        qualityManager.setQuality(movie_player.getPlayerState());

        movie_player.addEventListener(
          "onStateChange",
          qualityManager.setQuality,
        );

        if (user_settings.video_quality_for_fullscreen) {
          let selectedQualityBackup = user_settings.video_quality;
          document.addEventListener("fullscreenchange", () => {
            user_settings.video_quality = document.fullscreenElement
              ? user_settings.video_quality_for_fullscreen
              : selectedQualityBackup;
            movie_player.setPlaybackQualityRange(
              user_settings.video_quality,
              user_settings.video_quality,
            );
          });
        }
      }
    }

    const qualityManager = {
      async setQuality(state = required()) {
        if (!PlayerState.qualityToSet)
          return console.error(
            "qualityToSet unavailable",
            PlayerState.qualityToSet,
          );

        if (
          user_settings.video_quality_for_music &&
          location.search.includes("list=") &&
          NOVA.isMusic()
        ) {
          PlayerState.qualityToSet = user_settings.video_quality_for_music;
        }

        if ((1 === state || 3 === state) && !player_state.quality_lock) {
          player_state.quality_lock = true;

          let availableQualityList;
          await NOVA.waitUntil(
            () =>
              (availableQualityList =
                movie_player.getAvailableQualityLevels()) &&
              availableQualityList.length,
            50,
          );

          if (user_settings.video_quality_premium) {
            const premiumQuality = [
              ...movie_player.getAvailableQualityData(),
            ].find(
              (
                q, //q.quality == PlayerState.qualityToSet
              ) =>
                q.isPlayable &&
                q.qualityLabel?.toLocaleLowerCase().includes("premium"),
            )?.qualityLabel;
            if (premiumQuality) {
              qualityManager.setPremium(premiumQuality);
              return;
            }
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
          };

          const maxWidth =
            NOVA.currentPage == "watch" ? screen.width : window.innerWidth;
          const maxQualityIdx = availableQualityList.findIndex(
            (i) => qualityFormatListWidth[i] <= maxWidth * 1.3,
          );
          if (maxQualityIdx === -1) {
            console.error("maxQualityIdx", maxQualityIdx);
            return;
          }

          availableQualityList = availableQualityList.slice(maxQualityIdx);

          const availableQualityIdx = (() => {
            let idx = availableQualityList.indexOf(PlayerState.qualityToSet);
            if (idx === -1) {
              const availableQuality = Object.keys(
                  qualityFormatListWidth,
                ).filter(
                  (v) =>
                    availableQualityList.includes(v) ||
                    v == PlayerState.qualityToSet,
                ),
                nearestQualityIdx =
                  availableQuality.findIndex(
                    (q) => q === PlayerState.qualityToSet,
                  ) - 1;

              idx = availableQualityList[nearestQualityIdx]
                ? nearestQualityIdx
                : 0;
            }
            return idx;
          })();
          const newQuality = availableQualityList[availableQualityIdx];

          if (typeof movie_player.setPlaybackQuality === "function") {
            movie_player.setPlaybackQuality(newQuality);
          }

          if (typeof movie_player.setPlaybackQualityRange === "function") {
            movie_player.setPlaybackQualityRange(newQuality, newQuality);
          }
        } else if (state <= 0) {
          player_state.quality_lock = false;
        }
      },

      async setPremium(qualityLabel = required()) {
        const SELECTOR_CONTAINER = "#movie_player";

        const settingsButton = await NOVA.waitSelector(
          `${SELECTOR_CONTAINER} .ytp-chrome-bottom button.ytp-settings-button[aria-expanded="false"]`,
        );
        settingsButton.click();

        //const qualityMenuButton = await NOVA.waitSelector(`${SELECTOR_CONTAINER} .ytp-settings-menu [role="menuitem"]:last-child`);
        const qualityMenuButton = [
          ...document.body.querySelectorAll(
            `${SELECTOR_CONTAINER} .ytp-settings-menu [role="menuitem"] .ytp-menuitem-content`,
          ),
        ].find(
          (menuItem) =>
            menuItem.textContent.toLocaleLowerCase().includes("auto") ||
            NOVA.extractAsNum.int(menuItem.textContent) >= 144,
        );
        qualityMenuButton.click();

        const qualityItem = [
          ...document.body.querySelectorAll(
            '.ytp-quality-menu [role="menuitemradio"]',
          ),
        ].find((menuItem) => menuItem.textContent.includes(qualityLabel));

        if (qualityItem) {
          let visibleAfterclicked;
          await NOVA.waitUntil(() => {
            if (NOVA.isVisible(qualityItem)) {
              qualityItem.click();
              visibleAfterclicked = true;
            } else if (visibleAfterclicked) return true;
          }, 500);
        }

        setQuality.quality_lock = true;
      },
    };

    const player_state = new PlayerState();

    NOVA.waitSelector("#movie_player").then((movie_player) => {
      player_state.addEventListeners(movie_player);
    });
  },
  options: {
    video_quality: {
      _tagName: "select",
      label: "Default",

      "label:pl": "Domyślna jakość",

      options: [
        { label: "8K/4320p", value: "highres" },
        { label: "5K/2880p", value: "hd2880" },
        { label: "4K/2160p", value: "hd2160" },
        { label: "QHD/1440p", value: "hd1440" },
        { label: "FHD/1080p", value: "hd1080", selected: true },
        { label: "HD/720p", value: "hd720" },
        { label: "480p", value: "large" },
        { label: "360p", value: "medium" },
        { label: "SD/240p", value: "small" },
        { label: "144p", value: "tiny" },
      ],
    },
    video_quality_premium: {
      _tagName: "input",
      label: "Use Premium bitrate when available",

      type: "checkbox",
      title: "High priority",
    },
    video_quality_manual_save_in_tab: {
      _tagName: "input",

      label: "Save manually selected for the same tab",

      "label:pl": "Właściwości dla obecnej karty",

      type: "checkbox",
      title: "Affects to next videos",

      "title:pl": "Zmiany w następnych filmach",
    },
    video_quality_for_music: {
      _tagName: "select",
      label: "For Music (in playlists)",

      title: "to save traffic / increase speed",

      "title:pl": "aby zaoszczędzić ruch / zwiększyć prędkość",

      options: [
        { label: "QHD/1440p", value: "hd1440" },
        { label: "FHD/1080p", value: "hd1080" },
        { label: "HD/720p", value: "hd720" },
        { label: "SD/480p", value: "large" },
        { label: "SD/360p", value: "medium" },
        { label: "SD/240p", value: "small" },
        { label: "SD/144p", value: "tiny" },
        { label: "Auto", value: "auto" },
        { label: "default", selected: true },
      ],
    },
    video_quality_for_fullscreen: {
      _tagName: "select",
      label: "On Full-screen",

      options: [
        { label: "8K/4320p", value: "highres" },

        { label: "4K/2160p", value: "hd2160" },
        { label: "QHD/1440p", value: "hd1440" },
        { label: "FHD/1080p", value: "hd1080" },
        { label: "HD/720p", value: "hd720" },
        { label: "SD/480p", value: "large" },
        { label: "SD/360p", value: "medium" },

        { label: "default", selected: true },
      ],
    },
  },
});

window.nova_plugins.push({
  id: "video-autostop",
  title: "Stop video preload",

  "title:pl": "Zatrzymaj ładowanie wideo",

  run_on_pages: "watch, embed",

  section: "player",

  desc: "Prevent auto-buffering",

  _runtime: (user_settings) => {
    if (location.hostname.includes("youtube.googleapis.com")) return;

    if (NOVA.queryURL.has("popup")) return;

    if (
      user_settings.video_autostop_embed &&
      NOVA.currentPage != "embed" &&
      (!user_settings.video_autostop_comment_link ||
        (user_settings.video_autostop_comment_link && !NOVA.queryURL.has("lc"))) //!location.search.includes('$lc=')
    ) {
      return;
    }

    if (
      NOVA.currentPage == "embed" &&
      window.self !== window.top &&
      ["0", "false"].includes(NOVA.queryURL.get("autoplay"))
    ) {
      return;
    }

    if (
      user_settings.video_autostop_peview_thumbnail &&
      NOVA.currentPage == "watch"
    ) {
      NOVA.css.push(
        `.unstarted-mode {
               background: url("https://i.ytimg.com/vi/${NOVA.queryURL.get("v")}/maxresdefault.jpg") center center / contain no-repeat content-box;
            }
            .unstarted-mode video { visibility: hidden; }`,
      );
    }

    let disableStop;

    NOVA.waitSelector("#movie_player").then(async (movie_player) => {
      document.addEventListener(
        "yt-navigate-start",
        () => (disableStop = false),
      );

      await NOVA.waitUntil(
        () =>
          typeof movie_player === "object" &&
          typeof movie_player.stopVideo === "function",
        100,
      );

      movie_player.stopVideo();
      movie_player.addEventListener(
        "onStateChange",
        onPlayerStateChange.bind(this),
      );

      addCancelEvents(movie_player);

      function onPlayerStateChange(state) {
        if (
          !user_settings.video_autostop_comment_link ||
          (user_settings.video_autostop_comment_link &&
            !NOVA.queryURL.has("lc"))
        ) {
          if (
            user_settings.video_autostop_ignore_playlist &&
            location.search.includes("list=")
          )
            return;

          if (
            user_settings.video_autostop_ignore_live &&
            movie_player.getVideoData().isLive
          )
            return;
        }

        if (!disableStop && state > 0 && state < 5) {
          movie_player.stopVideo();
        }
      }
    });

    function addCancelEvents(movie_player) {
      document.addEventListener("keyup", (evt) => {
        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;
        if (NOVA.editableFocused(evt.target)) return;
        if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;

        switch (evt.code) {
          case "KeyK":
          case "Space":
          case "MediaPlay":
          case "MediaPlayPause":
            disableHoldStop();
            break;
        }
      });

      navigator.mediaSession.setActionHandler("play", disableHoldStop);

      document.addEventListener(
        "click",
        (evt) => {
          if (
            evt.isTrusted &&
            evt.target.closest("#movie_player") &&
            !disableStop
          ) {
            evt.preventDefault();

            evt.stopImmediatePropagation();

            disableHoldStop();
          }
        },
        { capture: true },
      );

      function disableHoldStop() {
        if (!disableStop) {
          disableStop = true;
          movie_player.playVideo();
        }
      }
    }
  },
  options: {
    video_autostop_embed: {
      _tagName: "select",
      label: "Apply to video type",

      options: [
        {
          label: "all",
          value: false,
          selected: true,
        },
        {
          label: "embed",
          value: "on",
        },
      ],
    },
    video_autostop_ignore_playlist: {
      _tagName: "input",
      label: "Ignore playlist",

      "label:pl": "Zignoruj listę odtwarzania",

      type: "checkbox",

      "data-dependent": { video_autostop_embed: false },
    },
    video_autostop_ignore_live: {
      _tagName: "input",
      label: "Ignore live",

      type: "checkbox",

      "data-dependent": { video_autostop_embed: false },
    },

    video_autostop_peview_thumbnail: {
      _tagName: "input",
      label: "Display preview thumbnail on video",

      type: "checkbox",
      title: "Instead black-screen",

      "data-dependent": { video_autostop_embed: false },
    },

    video_autostop_comment_link: {
      _tagName: "input",
      label: "Apply if URL references a comment",

      type: "checkbox",
      title: "Stop playback if you have opened the url with link to comment",
    },
  },
});
window.nova_plugins.push({
  id: "player-indicator",
  title: "Custom On-Screen Display (OSD)",
  "title:zh": "替换默认指示器",
  "title:ja": "デフォルトのインジケーターを置き換える",

  run_on_pages: "watch, embed, -mobile",
  section: "player",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-player-indicator-info",
      COLOR_OSD = user_settings.player_indicator_color || "#ff0000";

    NOVA.waitSelector("#movie_player video").then((video) => {
      if (!user_settings["video-volume"]) {
        video.addEventListener("volumechange", function () {
          const level = movie_player.getVolume();
          const isMuted = video.muted;
          NOVA.showOSD({
            message: isMuted ? `Muted` : `${level}%`,
            ui_value: isMuted ? 0 : level,

            source: "volume",
          });
        });
      }

      if (!user_settings["video-rate"]) {
        video.addEventListener("ratechange", function () {
          OSD.show({
            message: video.playbackRate + "x",
            ui_value: video.playbackRate,
            ui_max: 2,
            source: "rate",
          });
        });
      }
    });

    document.addEventListener("nova-osd", (evt) => {
      const { message, source, ui_value, ui_max, fade_ms } = evt.detail;

      if (!message) {
        console.error("message must be non empty:", message);
        return Promise.reject(new Error("message must be non empty"));
      }
      if (!Number.isFinite(ui_value)) {
        console.error("ui_value must be a positive number:", ui_value);
        return Promise.reject(new Error("ui_value must be a finite number"));
      }

      if (fade_ms && !Number.isFinite(fade_ms)) {
        console.error("fade_ms must be a positive number:", fade_ms);
        return Promise.reject(new Error("fade_ms must be a finite number"));
      }

      OSD.show({
        pt: +ui_max ? (ui_value / ui_max) * 100 : ui_value,
        message,
        source,
        fade_ms,
        color_alt: Boolean(ui_max),
      });
    });

    const OSD = {
      create() {
        NOVA.css.push(
          `.ytp-bezel-text-wrapper,
               .ytp-doubletap-ui-legacy.ytp-time-seeking,

               .ytp-chapter-seek {
                  display:none !important;
               }`,
        );

        NOVA.css.push(
          `#${SELECTOR_ID} {
                  --color: white;
                  --bg-color: rgba(0, 0, 0, ${user_settings.player_indicator_opacity || 0.3});
                  --zindex: ${1 + Math.max(NOVA.css.get(".ytp-chrome-top", "z-index"), 60)};

                  position: absolute;
                  right: 0;
                  z-index: calc(var(--zindex) + 1);
                  margin: 0 auto;
                  text-align: center;
                  opacity: 0;
                  background-color: var(--bg-color);
                  color: var(--color);
               }

               #${SELECTOR_ID} span {
                  text-overflow: ellipsis;
                  word-wrap: break-word;
                  overflow: hidden;

                  display: -webkit-box;
                  -webkit-line-clamp: 5;
                  line-clamp: 5;
                  -webkit-box-orient: vertical;

                  --background-color: ${COLOR_OSD}50;
                  --background-color: ${COLOR_OSD};
               }`,
        );

        const template = document.createElement("div");
        template.id = SELECTOR_ID;

        template.appendChild(document.createElement("span"));
        movie_player.append(template);

        this.container = document.getElementById(SELECTOR_ID);
        this.spanOSD = this.container.querySelector("span");

        switch (user_settings.player_indicator_type) {
          case "bar-top":
            Object.assign(this.container.style, {
              top: 0,
              width: "100%",
              padding: ".2em",
              "font-size": "1.55em",
            });

            Object.assign(this.spanOSD.style, {
              background:
                "linear-gradient(to right, var(--background-color) var(--pt), rgba(0,0,0,.8) var(--pt))",
            });
            break;

          case "bar-center":
            Object.assign(this.container.style, {
              left: 0,
              bottom: "20%",
              width: "30%",
              "font-size": "1.2em",
            });

            Object.assign(this.spanOSD.style, {
              "background-color": `var(--background-color)`,
              transition: "width 100ms ease-out",
              display: "inline-block",
              width: `clamp(var(--pt), 5%, 100%)`,
            });

            break;

          case "bar-vertical":
            Object.assign(this.container.style, {
              top: 0,
              height: "100%",
              width: "25px",
              "font-size": "1.2em",
            });

            Object.assign(this.spanOSD.style, {
              position: "absolute",
              bottom: 0,
              right: 0,
              "background-color": `var(--background-color)`,
              transition: "height 100ms ease-out 0s",
              display: "inline-block",
              width: "100%",
              "font-weight": "bold",
              height: `clamp(var(--pt), 0%, 100%)`,
            });
            break;

          case "text-top":
            Object.assign(this.container.style, {
              top: 0,
              width: "100%",
              padding: ".2em",
              "font-size": "1.55em",
            });
        }
        return this.container;
      },

      oldMsgObj: {},

      show({
        pt = 50,
        message = required(),
        fade_ms = 800,
        source,
        color_alt,
      }) {
        console.debug("OSD.show", ...arguments);

        if (typeof this.fade === "number") clearTimeout(this.fade);

        const notify = this.container || this.create();

        if (source) this.oldMsgObj[source] = message;
        else this.oldMsg = {};

        if (this.oldMsgObj[source]) {
          this.spanOSD.textContent = message;
        } else {
          this.spanOSD.innerText += "\n" + message;
        }

        pt = Math.round(pt);

        switch (user_settings.player_indicator_type) {
          case "bar-center":
          case "bar-vertical":
            this.spanOSD.style.setProperty("--pt", `${pt}%`);
            break;

          case "bar-top":
            this.spanOSD.style.setProperty("--pt", `${pt}%`);

            break;
        }

        notify.style.transition = "none";
        notify.style.opacity = 1;
        notify.style.visibility = "visible";

        this.fade = setTimeout(() => {
          notify.style.transition = "opacity 200ms ease-in";
          notify.style.opacity = 0;
          setTimeout(() => {
            if (typeof this.fade === "number") {
              notify.style.visibility = "hidden";
            }
          }, 1000);
        }, +fade_ms);
      },
    };
  },
  options: {
    player_indicator_type: {
      _tagName: "select",
      label: "Mode",
      "label:zh": "模式",
      "label:ja": "モード",

      "label:pl": "Tryb",

      options: [
        {
          label: "text-top",
          value: "text-top",
          selected: true,
        },
        {
          label: "bar-top",
          value: "bar-top",
        },
        {
          label: "bar-center",
          value: "bar-center",
        },
        {
          label: "bar-vertical",
          value: "bar-vertical",
        },
      ],
    },
    player_indicator_opacity: {
      _tagName: "input",
      label: "Opacity",
      "label:zh": "不透明度",
      "label:ja": "不透明度",

      "label:tr": "opaklık",

      "label:pl": "Przezroczystość",

      type: "number",
      title: "less value - more transparency",

      placeholder: "0-1",
      step: 0.1,
      min: 0.1,
      max: 0.9,
      value: 0.3,
    },
    player_indicator_color: {
      _tagName: "input",
      type: "color",
      value: "#ff0000",
      label: "Color",
      "label:zh": "颜色",
      "label:ja": "色",

      "label:pl": "Kolor",

      "data-dependent": { player_indicator_type: "!text-top" },
    },
  },
});

window.nova_plugins.push({
  id: "sponsor-block",
  title: "SponsorBlock",

  run_on_pages: "watch, embed",

  section: "player",

  _runtime: (user_settings) => {
    NOVA.waitSelector("#movie_player video").then((video) => {
      const categoryNameLabel = {
        sponsor: "Ad",
        selfpromo: "Self Promotion",
        interaction: "Reminder Subscribe",
        intro: "Intro",
        outro: "Credits",
        preview: "Recap",
        music_offtopic: "Non-music section",
        exclusive_access: "Full Video Label Only",

        filler: "Off-topic",
      };

      let segmentsList = [];
      let muteState;
      let videoId;

      video.addEventListener("loadeddata", init.bind(video));

      video.addEventListener("timeupdate", handleTimeUpdate.bind(video));

      async function init() {
        videoId =
          NOVA.queryURL.get("v") || movie_player.getVideoData().video_id;
        segmentsList = (await loadSegmentsForSkip(videoId)) || [];
      }

      if (user_settings["player-float-progress-bar"]) {
        document.addEventListener("render-chapters-markers", ({ detail }) => {
          if (segmentsList.length)
            renderMarksForProgressBar(segmentsList, detail.chapterList);
        });
      }

      function handleTimeUpdate({ target }) {
        const now = Math.trunc(this.currentTime);
        const segmentIdx = segmentsList.findIndex(
          ([segmentStart, segmentEnd]) =>
            now >= segmentStart && now < segmentEnd,
        );
        let segmentStart, segmentEnd, category;

        if (segmentIdx !== -1) {
          [segmentStart, segmentEnd, category] = segmentsList[segmentIdx];

          switch (user_settings.sponsor_block_action) {
            case "mute":
              if (!muteState) {
                muteState = this.muted;
                movie_player.mute(true);

                novaNotification("muted");
              }
              break;

            case "skip":
              this.currentTime = segmentEnd;
              segmentsList.splice(segmentIdx, 1);

              novaNotification();
              break;
          }
        } else if (muteState) {
          muteState = false;
          movie_player.unMute();
          novaNotification("unMuted");
        }

        function novaNotification(prefix = "") {
          if (!user_settings.sponsor_block_notification) return;

          const msg = `${prefix} ${NOVA.formatTime.HMS.digit(segmentEnd - segmentStart)}「${categoryNameLabel[category]}」• ${NOVA.formatTime.HMS.digit(segmentStart)} - ${NOVA.formatTime.HMS.digit(segmentEnd)}`;
          console.info(videoId, msg);
          NOVA.showOSD({
            message: msg,
            source: "sponsor-block",
            fade_ms: 1800,
          });
        }
      }
    });

    async function renderMarksForProgressBar(
      segments_list = required(),
      chapter_list,
    ) {
      const SELECTOR = "#nova-player-float-progress-bar-chapters > span[time]";
      const deflectionSec = 5;

      document.body
        .querySelectorAll(SELECTOR)
        .forEach((chapterEl, idx, chaptersEls) => {
          if (idx === chaptersEls.length - 1) return;

          const chapterStart = Math.trunc(
              NOVA.formatTime.hmsToSec(chapterEl.getAttribute("time")),
            ),
            chapterNextStart = Math.trunc(
              NOVA.formatTime.hmsToSec(
                chaptersEls[idx + 1].getAttribute("time"),
              ),
            );

          segments_list.forEach(([segmentStart, segmentEnd, category]) => {
            if (
              Math.trunc(segmentStart) + deflectionSec <= chapterNextStart &&
              Math.trunc(segmentEnd) - deflectionSec >= chapterStart
            ) {
              const newChapter = document.createElement("span"),
                startPoint = Math.max(segmentStart, chapterStart),
                sizeChapter = chapterNextStart - chapterStart,
                getPt = (d) => (d * 100) / sizeChapter + "%",
                color = getSegmentColor(category);

              newChapter.title = category;

              Object.assign(newChapter.style, {
                width: getPt(
                  Math.min(segmentEnd, chapterNextStart) - startPoint,
                ),
                left: getPt(startPoint - chapterStart),
                "background-color": `rgb(${color}, .4`,
              });

              chapterEl.append(newChapter);
            }
          });
        });

      function getSegmentColor(category = required()) {
        let color = user_settings[`sponsor_block_color_${category}`];
        if (color) {
          const convertColor = {
            hexToRgb(hex = required()) {
              return [
                ("0x" + hex[1] + hex[2]) | 0,
                ("0x" + hex[3] + hex[4]) | 0,
                ("0x" + hex[5] + hex[6]) | 0,
              ];
            },
          };

          color = convertColor.hexToRgb(color).join(",");
        } else {
          switch (category) {
            case "sponsor":
              color = "255, 231, 0";
              break;
            case "interaction":
              color = "255, 127, 80";
              break;
            case "selfpromo":
              color = "255, 99, 71";
              break;
            case "intro":
              color = "255, 165, 0";
              break;
            case "outro":
              color = "255, 165, 0";
              break;
            default:
              color = "0, 255, 107";
              break;
          }
        }

        return color;
      }
    }

    async function loadSegmentsForSkip(video_id = required()) {
      const CACHE_PREFIX = "nova-sponsorblock:";

      if (
        window?.sessionStorage &&
        (storage = sessionStorage.getItem(CACHE_PREFIX + video_id))
      ) {
        return JSON.parse(storage);
      } else {
        const actionTypes = ["skip", "mute"],
          categories = user_settings.sponsor_block_category || [
            "sponsor",
            "interaction",
            "selfpromo",
            "intro",
            "outro",
          ],
          URL = NOVA.queryURL.set(
            {
              videoID: video_id,
              actionTypes: JSON.stringify(actionTypes),
              categories: JSON.stringify(categories),
            },
            (user_settings.sponsor_block_url || "https://sponsor.ajay.app") +
              "/api/skipSegments",
          );

        if ((result = await fetchAPI(URL))) {
          if (window?.sessionStorage) {
            sessionStorage.setItem(
              CACHE_PREFIX + video_id,
              JSON.stringify(result),
            );
          }
          return result;
        }
      }

      async function fetchAPI(url, options = {}) {
        const response = await NOVA.fetch(url, options);

        return response.map((segment) => [
          ...segment.segment,
          segment.category,
        ]);
      }
    }
  },
  options: {
    sponsor_block_category: {
      _tagName: "select",
      label: "Category",

      title: "[Ctrl+Click] to select several",

      "title:pl": "Ctrl+kliknięcie, aby zaznaczyć kilka",

      multiple: null,
      required: true,
      size: 7,
      options: [
        {
          label: "Ads/Sponsor",
          value: "sponsor",

          title: "Paid promotion, paid referrals and direct advertisements",
        },
        {
          label: "Unpaid/Self promotion",
          value: "selfpromo",
        },
        {
          label: "Reminder subscribe",
          value: "interaction",
        },
        {
          label: "Intro",
          value: "intro",
        },
        {
          label: "Endcards/Credits",
          value: "outro",
        },

        {
          label: "Preview/Recap",
          value: "preview",
        },
        {
          label: "Non-music section of clip",
          value: "music_offtopic",
        },
        {
          label: "Full Video Label Only",
          value: "exclusive_access",
        },
        {
          label: "Off-topic/Filler",
          value: "filler",
        },
      ],
    },
    sponsor_block_action: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "skip",
          value: "skip",
          selected: true,
        },
        {
          label: "mute",
          value: "mute",
        },
      ],
    },
    sponsor_block_url: {
      _tagName: "input",
      label: "URL",
      type: "url",
      pattern: "https://.*",

      placeholder: "https://domain.com",
      value: "https://sponsor.ajay.app",
      required: true,
    },
    sponsor_block_notification: {
      _tagName: "input",
      label: "Show OSD notification",

      type: "checkbox",
    },

    sponsor_block_color_sponsor: {
      _tagName: "input",
      type: "color",
      value: "#08D00B",
      label: "Color - Ads/Sponsor",

      "data-dependent": { sponsor_block_category: ["sponsor"] },
    },
    sponsor_block_color_selfpromo: {
      _tagName: "input",
      type: "color",
      value: "#F8FA00",
      label: "Color - Unpaid/Self Promotion",

      "data-dependent": { sponsor_block_category: ["selfpromo"] },
    },
    sponsor_block_color_interaction: {
      _tagName: "input",
      type: "color",
      value: "#C900FB",
      label: "Color - Reminder Subscribe",

      "data-dependent": { sponsor_block_category: ["interaction"] },
    },
    sponsor_block_color_intro: {
      _tagName: "input",
      type: "color",
      value: "#00F4F3",
      label: "Color - intro",

      "data-dependent": { sponsor_block_category: ["intro"] },
    },
    sponsor_block_color_outro: {
      _tagName: "input",
      type: "color",
      value: "#0102F3",
      label: "Color - Endcards/Credits",

      "data-dependent": { sponsor_block_category: ["outro"] },
    },

    sponsor_block_color_preview: {
      _tagName: "input",
      type: "color",
      value: "#0B85C8",
      label: "Color - Preview/Recap",

      "data-dependent": { sponsor_block_category: ["preview"] },
    },
    sponsor_block_color_music_offtopic: {
      _tagName: "input",
      type: "color",
      value: "#FF9D04",

      label: "Color - Non-Music Section",

      "data-dependent": { sponsor_block_category: ["music_offtopic"] },
    },
    sponsor_block_color_exclusive_access: {
      _tagName: "input",
      type: "color",
      value: "#F2177B",
      label: "Color - Full Video Label Only",

      "data-dependent": { sponsor_block_category: ["exclusive_access"] },
    },
    sponsor_block_color_filler: {
      _tagName: "input",
      type: "color",
      value: "#7E00FF",
      label: "Color - Off-topic/Filler",

      "data-dependent": { sponsor_block_category: ["filler"] },
    },
  },
});

window.nova_plugins.push({
  id: "player-resize-ratio",
  title: "Player force resize 16:9",

  run_on_pages: "watch",
  section: "player",
  desc: "only for 4:3 video",

  _runtime: (user_settings) => {
    NOVA.waitSelector("ytd-watch-flexy:not([theater])").then((ytd_watch) => {
      NOVA.waitSelector("#movie_player video", { container: ytd_watch }).then(
        (video) => {
          console.assert(
            ytd_watch.calculateCurrentPlayerSize_,
            '"ytd_watch" does not have fn "calculateCurrentPlayerSize_"',
          );

          const heightRatio = 0.5625,
            squareAspectRatio = () => {
              const aspectRatio = NOVA.aspectRatio.getAspectRatio({
                width: video.videoWidth,
                height: video.videoHeight,
              });
              return (
                video.videoWidth / video.videoHeight > 2.3 ||
                "4:3" == aspectRatio ||
                "1:1" == aspectRatio
              );
            };

          if (ytd_watch.calculateCurrentPlayerSize_ && ytd_watch.updateStyles) {
            const backupFn = ytd_watch.calculateCurrentPlayerSize_;

            patchYtCalculateFn();

            video.addEventListener(
              "loadeddata",
              () => NOVA.currentPage == "watch" && patchYtCalculateFn(),
            );

            function sizeBypass() {
              let width = (height = NaN);

              if (!ytd_watch.theater) {
                width = movie_player.offsetWidth;
                height = Math.ceil(movie_player.offsetWidth / (16 / 9));

                if (ytd_watch.updateStyles) {
                  ytd_watch.updateStyles({
                    "--ytd-watch-flexy-width-ratio": 1,
                    "--ytd-watch-flexy-height-ratio": heightRatio,
                  });
                  window.dispatchEvent(new Event("resize"));
                }
              }
              return {
                width: width,
                height: height,
              };
            }

            function patchYtCalculateFn() {
              ytd_watch.calculateCurrentPlayerSize_ = squareAspectRatio()
                ? sizeBypass
                : backupFn;
              ytd_watch.calculateCurrentPlayerSize_();
            }
          } else {
            new MutationObserver((mutationRecordsArray) => {
              if (
                !ytd_watch.theater &&
                heightRatio !=
                  ytd_watch.style.getPropertyValue(
                    "--ytd-watch-flexy-height-ratio",
                  )
              ) {
                updateRatio();
              }
            }).observe(ytd_watch, {
              attributes: true,
              attributeFilter: ["style"],
            });
          }

          window.addEventListener("resize", updateRatio);

          function updateRatio() {
            if (squareAspectRatio()) {
              ytd_watch.style.setProperty("--ytd-watch-flexy-width-ratio", 1);
              ytd_watch.style.setProperty(
                "--ytd-watch-flexy-height-ratio",
                heightRatio,
              );
            }
          }
        },
      );
    });
  },
});

window.nova_plugins.push({
  id: "auto-buffer",
  title: "Video preloading/buffering",

  run_on_pages: "watch, embed",
  section: "player",
  desc: "Working while video is paused",

  _runtime: (user_settings) => {
    const maxBufferSec = +user_settings.auto_buffer_sec || 60;

    const SELECTOR_CLASS_NAME = "buffered";

    NOVA.css.push(
      `.${SELECTOR_CLASS_NAME} .ytp-swatch-background-color {
            background-color: ${user_settings.auto_buffer_color || "#ffa000"} !important;
         }`,
    );

    let stopPreload = true;
    let saveCurrentTime = false;

    NOVA.waitSelector("#movie_player video").then((video) => {
      let isLive;

      video.addEventListener("loadeddata", () => {
        saveCurrentTime = false;
        isLive = movie_player.getVideoData().isLive;
      });

      video.addEventListener("playing", function () {
        if (!this.paused && saveCurrentTime !== false) {
          this.currentTime = saveCurrentTime;
          saveCurrentTime = false;
          movie_player.classList.remove(SELECTOR_CLASS_NAME);
        }
      });

      document.addEventListener("keydown", (evt) => {
        if (!video.paused || !saveCurrentTime) return;

        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;
        if (NOVA.editableFocused(evt.target)) return;

        if (evt.code == "ArrowLeft" || evt.code == "ArrowRight") reSaveTime();
      });

      document.addEventListener("click", (evt) => {
        if (
          evt.isTrusted &&
          video.paused &&
          saveCurrentTime &&
          evt.target.closest(".ytp-progress-bar")
        ) {
          reSaveTime();
        }
      });

      function reSaveTime() {
        movie_player.classList.add(SELECTOR_CLASS_NAME);

        saveCurrentTime = video.currentTime;
      }

      video.addEventListener("pause", recordBuffer.bind(video));
      video.addEventListener("progress", recordBuffer.bind(video));

      function recordBuffer() {
        if (!this.paused || !this.buffered?.length) return;

        if (stopPreload) return;

        const bufferedSeconds = this.buffered.end(this.buffered.length - 1);

        if (saveCurrentTime === false) {
          movie_player.classList.add(SELECTOR_CLASS_NAME);

          saveCurrentTime = this.currentTime;
        }

        if (
          saveCurrentTime &&
          bufferedSeconds - saveCurrentTime > maxBufferSec
        ) {
          this.currentTime = saveCurrentTime;
          movie_player.classList.remove(SELECTOR_CLASS_NAME);
          return;
        }

        if (!isLive || !isNaN(this.duration)) {
          const bufferedPercent = bufferedSeconds / this.duration;

          if (bufferedPercent > 0.9) {
            movie_player.classList.remove(SELECTOR_CLASS_NAME);
            return;
          }
        }

        this.currentTime = bufferedSeconds;
      }
    });

    NOVA.waitSelector("#movie_player .ytp-left-controls .ytp-play-button").then(
      (container) => {
        const SELECTOR_CLASS = "nova-right-custom-button",
          btn = document.createElement("button");

        btn.classList.add("ytp-button", SELECTOR_CLASS);

        Object.assign(btn.style, {
          padding: "0 12px",
          opacity: 0.5,
          "min-width": getComputedStyle(container).width || "48px",
        });
        btn.title = "Preload video";

        btn.append(
          (function createSvgIcon() {
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("viewBox", "0 0 465 465");
            svg.setAttribute("height", "100%");
            svg.setAttribute("width", "100%");

            const g = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g",
            );
            g.setAttribute("fill", "currentColor");

            const pathsData = [
              "M279.591,423.714c-3.836,0.956-7.747,1.805-11.629,2.52c-10.148,1.887-16.857,11.647-14.98,21.804 c0.927,4.997,3.765,9.159,7.618,11.876c3.971,2.795,9.025,4.057,14.175,3.099c4.623-0.858,9.282-1.867,13.854-3.008 c10.021-2.494,16.126-12.646,13.626-22.662C299.761,427.318,289.618,421.218,279.591,423.714z",
              "M417.887,173.047c1.31,3.948,3.811,7.171,6.97,9.398c4.684,3.299,10.813,4.409,16.662,2.475 c9.806-3.256,15.119-13.83,11.875-23.631c-1.478-4.468-3.118-8.95-4.865-13.314c-3.836-9.59-14.714-14.259-24.309-10.423 c-9.585,3.834-14.256,14.715-10.417,24.308C415.271,165.528,416.646,169.293,417.887,173.047z",
              "M340.36,397.013c-3.299,2.178-6.704,4.286-10.134,6.261c-8.949,5.162-12.014,16.601-6.854,25.546 c1.401,2.433,3.267,4.422,5.416,5.942c5.769,4.059,13.604,4.667,20.127,0.909c4.078-2.352,8.133-4.854,12.062-7.452 c8.614-5.691,10.985-17.294,5.291-25.912C360.575,393.686,348.977,391.318,340.36,397.013z",
              "M465.022,225.279c-0.407-10.322-9.101-18.356-19.426-17.953c-10.312,0.407-18.352,9.104-17.947,19.422 c0.155,3.945,0.195,7.949,0.104,11.89c-0.145,6.473,3.021,12.243,7.941,15.711c2.931,2.064,6.488,3.313,10.345,3.401 c10.322,0.229,18.876-7.958,19.105-18.285C465.247,234.756,465.208,229.985,465.022,225.279z",
              "M414.835,347.816c-8.277-6.21-19.987-4.524-26.186,3.738c-2.374,3.164-4.874,6.289-7.434,9.298 c-6.69,7.86-5.745,19.666,2.115,26.361c0.448,0.38,0.901,0.729,1.371,1.057c7.814,5.509,18.674,4.243,24.992-3.171 c3.057-3.59,6.037-7.323,8.874-11.102C424.767,365.735,423.089,354.017,414.835,347.816z",
              "M442.325,280.213c-9.855-3.09-20.35,2.396-23.438,12.251c-1.182,3.765-2.492,7.548-3.906,11.253 c-3.105,8.156-0.13,17.13,6.69,21.939c1.251,0.879,2.629,1.624,4.126,2.19c9.649,3.682,20.454-1.159,24.132-10.812 c1.679-4.405,3.237-8.906,4.646-13.382C457.66,293.795,452.178,283.303,442.325,280.213z",
              "M197.999,426.402c-16.72-3.002-32.759-8.114-47.968-15.244c-0.18-0.094-0.341-0.201-0.53-0.287 c-3.584-1.687-7.162-3.494-10.63-5.382c-0.012-0.014-0.034-0.023-0.053-0.031c-6.363-3.504-12.573-7.381-18.606-11.628 C32.24,331.86,11.088,209.872,73.062,121.901c13.476-19.122,29.784-35.075,47.965-47.719c0.224-0.156,0.448-0.311,0.67-0.468 c64.067-44.144,151.06-47.119,219.089-1.757l-14.611,21.111c-4.062,5.876-1.563,10.158,5.548,9.518l63.467-5.682 c7.12-0.64,11.378-6.799,9.463-13.675L387.61,21.823c-1.908-6.884-6.793-7.708-10.859-1.833l-14.645,21.161 C312.182,7.638,252.303-5.141,192.87,5.165c-5.986,1.036-11.888,2.304-17.709,3.78c-0.045,0.008-0.081,0.013-0.117,0.021 c-0.225,0.055-0.453,0.128-0.672,0.189C123.122,22.316,78.407,52.207,46.5,94.855c-0.269,0.319-0.546,0.631-0.8,0.978 c-1.061,1.429-2.114,2.891-3.145,4.353c-1.686,2.396-3.348,4.852-4.938,7.308c-0.199,0.296-0.351,0.597-0.525,0.896 C10.762,149.191-1.938,196.361,0.24,244.383c0.005,0.158-0.004,0.317,0,0.479c0.211,4.691,0.583,9.447,1.088,14.129 c0.027,0.302,0.094,0.588,0.145,0.89c0.522,4.708,1.177,9.427,1.998,14.145c8.344,48.138,31.052,91.455,65.079,125.16 c0.079,0.079,0.161,0.165,0.241,0.247c0.028,0.031,0.059,0.047,0.086,0.076c9.142,9.017,19.086,17.357,29.793,24.898 c28.02,19.744,59.221,32.795,92.729,38.808c10.167,1.827,19.879-4.941,21.703-15.103 C214.925,437.943,208.163,428.223,197.999,426.402z",
              "M221.124,83.198c-8.363,0-15.137,6.78-15.137,15.131v150.747l137.87,71.271c2.219,1.149,4.595,1.69,6.933,1.69 c5.476,0,10.765-2.982,13.454-8.185c3.835-7.426,0.933-16.549-6.493-20.384l-121.507-62.818V98.329 C236.243,89.978,229.477,83.198,221.124,83.198z",
            ];

            pathsData.forEach((dValue) => {
              const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path.setAttribute("d", dValue);
              g.append(path);
            });

            svg.append(g);

            return svg;
          })(),
        );

        btn.addEventListener("click", toggleLoop);

        container.after(btn);

        NOVA.waitSelector("#movie_player video").then((video) => {
          video.addEventListener("loadeddata", ({ target }) => {
            stopPreload =
              movie_player.classList.contains("ad-showing") ||
              !Boolean(user_settings.auto_buffer_default);
            btn.style.opacity = stopPreload ? 0.5 : 1;
          });
        });

        function toggleLoop() {
          stopPreload = !stopPreload;

          btn.style.opacity = stopPreload ? 0.5 : 1;

          NOVA.showOSD({
            message: `Preload is ${Boolean(stopPreload)}`,
            source: "auto-buffer",
          });

          if (stopPreload) {
            NOVA.videoElement.currentTime = saveCurrentTime;
            movie_player.classList.remove(SELECTOR_CLASS_NAME);
          }

          if (NOVA.videoElement.paused) {
            NOVA.videoElement.play();
            NOVA.videoElement.pause();
          }
        }
      },
    );
  },
  options: {
    auto_buffer_sec: {
      _tagName: "input",
      label: "Sec",

      type: "number",

      title: "buffer time",

      placeholder: "10-300",
      step: 5,
      min: 30,
      max: 300,
      value: 60,
    },
    auto_buffer_default: {
      _tagName: "select",
      label: "Default state",

      "label:pl": "Stan domyślny",

      options: [
        {
          label: "on",
          value: true,
          selected: true,
        },
        {
          label: "off",
          value: false,
        },
      ],
    },
    auto_buffer_color: {
      _tagName: "input",
      type: "color",
      value: "#ffa000",
      label: "Color",

      "label:pl": "Kolor",
    },
  },
});

window.nova_plugins.push({
  id: "video-volume",
  title: "Volume",

  "title:pl": "Głośność",

  run_on_pages: "watch, embed, -mobile",
  section: "player",

  desc: "With mouse wheel",
  "desc:zh": "带鼠标滚轮",
  "desc:ja": "マウスホイール付き",

  "desc:pl": "Za pomocą kółka myszy",

  _runtime: (user_settings) => {
    class PlayerState {
      constructor() {}

      addEventListeners(video) {
        video.addEventListener("volumechange", function () {
          const level = movie_player.getVolume();
          const isMuted = video.muted;
          NOVA.showOSD({
            message: isMuted ? `Muted` : `${level}%`,
            ui_value: isMuted ? 0 : level,

            source: "volume",
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
        const setDefault = (level) =>
          video.addEventListener(
            "playing",
            () => {
              level > 100
                ? playerVolume.unlimit(level)
                : playerVolume.set(level);
            },
            { capture: true, once: true },
          );

        if (+user_settings.volume_default) {
          setDefault(+user_settings.volume_default);
        }

        if (user_settings["save-channel-state"]) {
          NOVA.runOnPageLoad(async () => {
            if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed")
              return;

            const customVolume =
              await NOVA.storage_obj_manager.getParam("volume");
            if (customVolume) {
              setDefault(customVolume);
            }
          });
        }
      }

      addHotkeys() {
        if (user_settings.volume_hotkey == "keyboard") {
          document.addEventListener(
            "keydown",
            (evt) => {
              if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed")
                return;
              if (NOVA.editableFocused(evt.target)) return;
              if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey)
                return;

              let delta = 0;
              switch (
                user_settings.volume_hotkey_custom_up.length === 1
                  ? evt.key
                  : evt.code
              ) {
                case user_settings.volume_hotkey_custom_up:
                  delta = 1;
                  break;
                case user_settings.volume_hotkey_custom_down:
                  delta = -1;
                  break;
              }
              if (delta) {
                evt.preventDefault();
                evt.stopPropagation();

                playerVolume.adjust(
                  +user_settings.volume_step * Math.sign(delta),
                );
              }
            },
            { capture: true },
          );
        } else if (user_settings.volume_hotkey) {
          NOVA.waitSelector(".html5-video-container").then((container) => {
            container.addEventListener(
              "wheel",
              (evt) => {
                evt.preventDefault();

                if (
                  evt[user_settings.volume_hotkey] ||
                  (user_settings.volume_hotkey == "wheel" &&
                    !evt.ctrlKey &&
                    !evt.altKey &&
                    !evt.shiftKey &&
                    !evt.metaKey)
                ) {
                  const step =
                    +user_settings.volume_step * Math.sign(evt.wheelDelta);
                  if (step) {
                    const volume = playerVolume.adjust(step);
                  }
                }
              },
              { capture: true },
            );
          });
        }
      }

      disableLoudnessNormalization(movie_player) {
        const { set } = Object.getOwnPropertyDescriptor(
          HTMLMediaElement.prototype,
          "volume",
        );

        Object.defineProperty(HTMLMediaElement.prototype, "volume", {
          enumerable: true,
          configurable: true,
          set(new_value) {
            new_value = movie_player.getVolume() / 100;

            set.call(this, new_value);
          },
        });
      }
    }

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
        } else {
          this.set(level);
        }
      },

      set(level = 50) {
        if (
          typeof movie_player !== "object" ||
          typeof movie_player.getVolume !== "function"
        ) {
          console.error("Error: getVolume is not a function");
          return;
        }

        const newLevel = Math.min(100, Math.max(0, +level));

        if (newLevel !== movie_player.getVolume()) {
          if (movie_player.isMuted()) movie_player.unMute();

          movie_player.setVolume(newLevel);

          if (this.audioCtx && this.node.gain.value !== 1) {
            this.node.gain.value = 1;
          }
        }

        return newLevel;
      },

      unlimit(level = 300) {
        if (level <= 100) {
          console.error("unlimit level less than or equal to 100:", level);
        }

        if (!this.audioCtx) {
          this.audioCtx = new AudioContext();
          const sourceNode = this.audioCtx.createMediaElementSource(
            NOVA.videoElement,
          );
          this.node = this.audioCtx.createGain();
          this.node.gain.value = Math.trunc(level / 100);
          sourceNode.connect(this.node);
          this.node.connect(this.audioCtx.destination);
        }

        if (this.node.gain.value < 6) {
          this.node.gain.value += 1;
        }

        level = this.get();
        NOVA.showOSD({
          message: `${level}%`,
          ui_value: level,
          ui_max: 600,
          source: "volume",
        });
      },

      saveInSession(level = required()) {
        if (!window?.sessionStorage) return;
        if (typeof level !== "number")
          throw new Error("Level must be provided");

        const storageData = {
          creation: Date.now(),
          data: { volume: +level, muted: level ? "false" : "true" },
        };

        try {
          localStorage["yt-player-volume"] = JSON.stringify({
            expiration: Date.now() + 2592e6,
            ...storageData,
          });
          sessionStorage["yt-player-volume"] = JSON.stringify(storageData);
        } catch (err) {
          console.warn(
            `${err.name}: save "volume" in sessionStorage failed. It seems that "Block third-party cookies" is enabled`,
            err.message,
          );
        }
      },

      renderVolumeTextSlot(timeout_ms = 800) {
        const defaultVolumeBar =
          movie_player?.querySelector(".ytp-volume-area");
        if (defaultVolumeBar) {
          if (typeof this.timeoutId === "number") clearTimeout(this.timeoutId);

          defaultVolumeBar.dispatchEvent(
            new Event("mouseover", { bubbles: true }),
          );

          this.timeoutId = setTimeout(() => {
            defaultVolumeBar.dispatchEvent(
              new Event("mouseout", { bubbles: true }),
            );
          }, timeout_ms);

          insertToHTML({
            text: movie_player.getVolume(),
            container: defaultVolumeBar,
          });
        }

        function insertToHTML({ text = "", container = required() }) {
          if (!(container instanceof HTMLElement)) {
            console.error("Container is not an HTMLElement:", container);
            return;
          }

          const SELECTOR_ID = "nova-volume-text";

          (
            document.getElementById(SELECTOR_ID) ||
            (function () {
              const SELECTOR = "#" + SELECTOR_ID;
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
                     }`,
              );

              const el = document.createElement("span");
              el.id = SELECTOR_ID;
              return container.appendChild(el);
            })()
          ).textContent = text;

          container.title = `${text} %`;
        }
      },
    };

    const player_state = new PlayerState();

    NOVA.waitSelector("#movie_player video").then((video) => {
      player_state.addEventListeners(video);
    });

    return;
    insertSettingButton();

    function insertElementWithShadowIntoDOM(shadowContent, css) {
      console.debug("insertElementWithShadowIntoDOM", ...arguments);
      const shadowHost = document.createElement("div");
      const shadowRoot = shadowHost.attachShadow({ mode: "open" });

      if (css) shadowRoot.append(css);
      shadowRoot.append(shadowContent);

      return shadowHost;
    }

    function insertSettingButton() {
      NOVA.waitSelector("#masthead #end").then((menu) => {
        const btn = document.createElement("span"),
          title = "Nova Settings",
          SETTING_BTN_ID = "nova_settings_button";

        btn.id = SETTING_BTN_ID;

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
                  </yt-icon-button>`,
        );

        Object.assign(btn.style, {
          "font-size": "24px",
          color: "deepskyblue",
          "text-decoration": "none",
          padding: "0 10px",
        });
        btn.addEventListener("click", null, { capture: true });

        btn.title = title;
        const tooltip = document.createElement("tp-yt-paper-tooltip");
        tooltip.classList.add("style-scope", "ytd-topbar-menu-button-renderer");

        tooltip.textContent = title;

        btn.append(tooltip);

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

                  }`,
        );

        insertElementWithShadowIntoDOM(menu, btn);
      });
    }
  },
  options: {
    volume_default: {
      _tagName: "input",

      label: "Default level",

      "label:pl": "Poziom domyślny",

      type: "number",
      title: "0 - auto",

      placeholder: "%",
      step: 5,
      min: 0,

      max: 600,
      value: 100,
    },
    volume_hotkey: {
      _tagName: "select",
      label: "Hotkey",

      "label:pl": "Klawisz skrótu",

      options: [
        { label: "none", value: false },
        { label: "wheel", value: "wheel", selected: true },
        { label: "shift+wheel", value: "shiftKey" },
        { label: "ctrl+wheel", value: "ctrlKey" },
        { label: "alt+wheel", value: "altKey" },
        { label: "keyboard", value: "keyboard" },
      ],
    },
    volume_step: {
      _tagName: "input",
      label: "Hotkey step",

      "label:pl": "Krok",

      type: "number",
      title: "in %",

      placeholder: "%",
      min: 1,

      max: 30,
      value: 10,
      "data-dependent": { volume_hotkey: ["!false"] },
    },
    volume_hotkey_custom_up: {
      _tagName: "select",
      label: "Hotkey up",

      options: [
        { label: "ArrowUp", value: "ArrowUp", selected: true },
        { label: "ArrowDown", value: "ArrowDown" },
        { label: "ArrowLeft", value: "ArrowLeft" },
        { label: "ArrowRight", value: "ArrowRight" },
        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
      "data-dependent": { volume_hotkey: ["keyboard"] },
    },
    volume_hotkey_custom_down: {
      _tagName: "select",
      label: "Hotkey down",

      options: [
        { label: "ArrowUp", value: "ArrowUp" },
        { label: "ArrowDown", value: "ArrowDown", selected: true },
        { label: "ArrowLeft", value: "ArrowLeft" },
        { label: "ArrowRight", value: "ArrowRight" },
        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
      "data-dependent": { volume_hotkey: ["keyboard"] },
    },
    volume_unlimit: {
      _tagName: "input",
      label: "Hotkey allow above 100%",

      type: "checkbox",
      title: "With sound distortion",

      "data-dependent": { volume_hotkey: ["!false"] },
    },
    volume_mute_unsave: {
      _tagName: "input",

      label: "Not keep muted state",

      "label:pl": "Nie zachowuj wyciszonego stanu",

      type: "checkbox",
      title: "Only affects new tabs",

      "title:pl": "Dotyczy tylko nowych kart",
    },
    volume_loudness_normalization: {
      _tagName: "input",

      label: "Disable loudness normalization",

      type: "checkbox",
      title: "Boost volume level",
    },
  },
});
window.nova_plugins.push({
  id: "video-autopause",
  title: "Video autopause",

  "title:ko": "비디오 자동 일시 중지",
  "title:id": "Jeda otomatis video",
  "title:es": "Pausa automática de video",

  "title:it": "Pausa automatica del video",

  "title:pl": "Automatyczne zatrzymanie wideo",

  run_on_pages: "watch, embed",

  section: "player",
  desc: "Disable autoplay",
  "desc:zh": "禁用自动播放",
  "desc:ja": "自動再生を無効にする",
  "desc:ko": "자동 재생 비활성화",
  "desc:it": "Nonaktifkan putar otomatis",
  "desc:es": "Deshabilitar reproducción automática",

  "desc:it": "Disabilita la riproduzione automatica",

  "desc:pl": "Wyłącz autoodtwarzanie",

  "data-conflict": "video-autostop",
  _runtime: (user_settings) => {
    if (
      user_settings["video-stop-preload"] &&
      !user_settings.stop_preload_embed
    )
      return;

    if (NOVA.queryURL.has("popup")) return;

    if (
      user_settings.video_autopause_embed &&
      NOVA.currentPage != "embed" &&
      (!user_settings.video_autopause_comment_link ||
        (user_settings.video_autopause_comment_link &&
          !NOVA.queryURL.has("lc"))) //!location.search.includes('$lc=')
    ) {
      return;
    }

    if (
      NOVA.currentPage == "embed" &&
      window.self !== window.top &&
      ["0", "false"].includes(NOVA.queryURL.get("autoplay"))
    ) {
      return;
    }

    NOVA.waitSelector("#movie_player video").then((video) => {
      if (
        !user_settings.video_autopause_comment_link ||
        (user_settings.video_autopause_comment_link && !NOVA.queryURL.has("lc"))
      ) {
        if (
          user_settings.video_autopause_ignore_live &&
          movie_player.getVideoData().isLive
        )
          return;
      }

      pauseVideo.apply(video);

      NOVA.runOnPageLoad(async () => {
        if (NOVA.currentPage == "watch" && !location.search.includes("list=")) {
          video.addEventListener("playing", pauseVideo, {
            capture: true,
            once: true,
          });
        }
      });

      const backupFn = HTMLVideoElement.prototype.play;

      HTMLVideoElement.prototype.play = pauseVideo;

      document.addEventListener("keyup", (evt) => {
        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;
        if (NOVA.editableFocused(evt.target)) return;
        if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) return;

        switch (evt.code) {
          case "KeyK":
          case "Space":
          case "MediaPlay":
          case "MediaPlayPause":
            restorePlayFn();
            break;
        }
      });

      navigator.mediaSession.setActionHandler("play", restorePlayFn);

      document.addEventListener(
        "click",
        (evt) => {
          if (
            evt.isTrusted &&
            !evt.target.closest(".ytp-right-controls") &&
            evt.target.closest("#movie_player")
          ) {
            restorePlayFn();
          }
        },
        { capture: true },
      );

      function pauseVideo() {
        movie_player.pauseVideo();
        this.paused || this.pause();
      }

      function restorePlayFn() {
        restorePlayFn = function () {};
        HTMLVideoElement.prototype.play = backupFn;
        movie_player.playVideo();
      }
    });
  },
  options: {
    video_autopause_embed: {
      _tagName: "select",
      label: "Apply to video type",

      options: [
        {
          label: "all",
          value: false,
          selected: true,
        },
        {
          label: "embed",
          value: "on",
        },
      ],
    },
    video_autopause_ignore_playlist: {
      _tagName: "input",
      label: "Ignore playlist",

      "label:ko": "재생목록 무시",
      "label:id": "Abaikan daftar putar",
      "label:es": "Ignorar lista de reproducción",

      "label:it": "Ignora playlist",

      "label:pl": "Zignoruj listę odtwarzania",

      type: "checkbox",
      "data-dependent": { video_autopause_embed: false },
    },
    video_autopause_ignore_live: {
      _tagName: "input",
      label: "Ignore live",

      type: "checkbox",
      "data-dependent": { video_autopause_embed: false },
    },

    video_autopause_comment_link: {
      _tagName: "input",
      label: "Apply if URL references a comment",

      type: "checkbox",
      title: "Pause playback if you have opened the url with link to comment",
    },
  },
});
window.nova_plugins.push({
  id: "player-control-below",
  title: "Control panel below the player",

  "title:pl": "Panel sterowania pod odtwarzaczem",

  run_on_pages: "watch, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    NOVA.waitSelector(".ytp-chrome-bottom").then(async (control_panel) => {
      if (
        (heightPanel = NOVA.css.get(control_panel, "height")) &&
        (heightProgressBar = NOVA.css.get(
          ".ytp-progress-bar-container",
          "height",
        ))
      ) {
        const height = `calc(${heightPanel} + ${heightProgressBar})` || "51px";
        let SELECTOR_CONTAINER =
          ".ytd-page-manager[video-id]:not([fullscreen])";

        if (
          ["force", "offset"].includes(user_settings.player_full_viewport_mode)
        ) {
          SELECTOR_CONTAINER += `:not([theater])`;
        }

        NOVA.css.push(
          `
                  ${SELECTOR_CONTAINER} .caption-window {
                     margin-bottom: 0;
                  }


                  ${SELECTOR_CONTAINER} .ytp-gradient-bottom {
                     transform: translateY(${height});
                     display: block !important;
                     opacity: 1 !important;
                     height: ${height} !important;
                     padding: 0;
                     background-color: #0f0f0f;
                  }


                  ${SELECTOR_CONTAINER} .ytp-chrome-bottom {
                     transform: translateY(${height});
                     opacity: 1 !important;
                  }


                  ${SELECTOR_CONTAINER} #movie_player {
                     overflow: visible;
                  }


                  ${SELECTOR_CONTAINER} .ytp-player-content.ytp-iv-player-content {
                     bottom: ${NOVA.css.get(".ytp-player-content.ytp-iv-player-content", "left") || "12px"};
                  }


                  ${SELECTOR_CONTAINER} .ytp-tooltip,
                  ${SELECTOR_CONTAINER} .ytp-settings-menu {
                     transform: translateY(${height});
                  }



                  ${SELECTOR_CONTAINER}[theater] > #columns,
                  ${SELECTOR_CONTAINER}:not([theater]) #below {
                     margin-top: ${height} !important;
                  }


                  #ytd-player {
                     overflow: visible !important;
                  }



                  `,
        );

        if (user_settings["player-float-progress-bar"]) {
          NOVA.css.push(
            `#movie_player.ytp-autohide .ytp-chrome-bottom .ytp-progress-bar-container {
                        display: none !important;
                     }`,
          );
        }
        fixControlFreeze();
      }
    });

    function fixControlFreeze(ms = 2000) {
      if (
        user_settings.player_hide_elements?.includes("time_display") ||
        (user_settings["theater-mode"] &&
          ["force", "offset"].includes(user_settings.player_full_viewport_mode))
      ) {
        return;
      }
      setInterval(() => {
        if (
          user_settings["theater-mode"] &&
          user_settings.player_full_viewport_mode == "smart" &&
          NOVA.css.get(movie_player, "z-index") != "2020" &&
          NOVA.css.get(movie_player, "position") != "fixed"
        ) {
          return;
        }

        if (
          NOVA.currentPage == "watch" &&
          document.visibilityState == "visible" &&
          movie_player.classList.contains("playing-mode") &&
          !document.fullscreenElement
        ) {
          movie_player.wakeUpControls();
        }
      }, ms);
    }
  },
});

window.nova_plugins.push({
  id: "player-float-progress-bar",

  title: "Float player progress bar",

  "title:pl": "Pływający pasek postępu odtwarzacza",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    if (NOVA.currentPage == "embed") {
      if (
        document.URL.includes("live_stream") ||
        ["0", "false"].includes(NOVA.queryURL.get("controls"))
      ) {
        return;
      }
    }

    const SELECTOR_CONTAINER = "#movie_player.ytp-autohide",
      SELECTOR_ID = "nova-player-float-progress-bar",
      SELECTOR = "#" + SELECTOR_ID,
      CHAPTERS_MARK_WIDTH_PX = "2px",
      CHP_JUMP_TOGGLE_CLASS_VALUE = "nova-chapters-jump-active";

    NOVA.waitSelector(
      `${user_settings["player-control-autohide"] ? "#movie_player" : SELECTOR_CONTAINER} video`,
    ).then((video) => {
      const container = insertFloatBar({
          init_container: movie_player,
          z_index: Math.max(NOVA.css.get(".ytp-chrome-bottom", "z-index"), 59),
        }),
        bufferEl = document.getElementById(`${SELECTOR_ID}-buffer`),
        progressEl = document.getElementById(`${SELECTOR_ID}-progress`);

      renderChapters.init(video);

      video.addEventListener(
        "progress",
        () => container.classList.add("transition"),
        { capture: true, once: true },
      );
      video.addEventListener("loadeddata", resetBar);
      video.addEventListener("ended", resetBar);
      document.addEventListener("yt-navigate-finish", resetBar);

      video.addEventListener("timeupdate", function () {
        if (notInteractiveToRender()) return;

        if (!isNaN(this.duration)) {
          progressEl.style.transform = `scaleX(${this.currentTime / this.duration})`;
        }
      });

      renderBuffer.apply(video);
      video.addEventListener("progress", renderBuffer.bind(video));
      video.addEventListener("seeking", renderBuffer.bind(video));

      function renderBuffer() {
        if (notInteractiveToRender()) return;

        if (!isNaN(this.duration) && this.buffered?.length) {
          bufferEl.style.transform = `scaleX(${this.buffered.end(this.buffered.length - 1) / this.duration})`;
        }
      }

      function resetBar() {
        container.style.display = movie_player.getVideoData().isLive
          ? "none"
          : "inherit";

        container.classList.remove("transition");
        bufferEl.style.transform = "scaleX(0)";
        progressEl.style.transform = "scaleX(0)";
        container.classList.add("transition");

        renderChapters.init(video);
      }

      function notInteractiveToRender() {
        return movie_player.getVideoData().isLive;
      }

      if (user_settings.player_float_progress_bar_hotkey) connectChapterJump();
    });

    function insertFloatBar({ init_container = movie_player, z_index = 60 }) {
      if (!(init_container instanceof HTMLElement)) {
        return console.error("init_container not HTMLElement:", init_container);
      }

      return (
        document.getElementById(SELECTOR_ID) ||
        (function () {
          init_container.insertAdjacentHTML(
            "beforeend",
            NOVA.createSafeHTML(
              `<div id="${SELECTOR_ID}" class="">
                  <div class="container">
                     <div id="${SELECTOR_ID}-buffer" class="ytp-load-progress"></div>
                     <div id="${SELECTOR_ID}-progress" class="ytp-swatch-background-color"></div>
                  </div>
                  <div id="${SELECTOR_ID}-chapters"></div>
               </div>`,
            ),
          );

          NOVA.css.push(
            `[id|=${SELECTOR_ID}] {
                  position: absolute;
                  bottom: 0;
               }

               ${SELECTOR} {
                  --opacity: ${+user_settings.player_float_progress_bar_opacity || 0.7};
                  --height: ${+user_settings.player_float_progress_bar_height || 3}px;
                  --bg-color: ${NOVA.css.get(".ytp-progress-list", "background-color") || "rgba(255,255,255,.2)"};
                  --zindex: ${z_index};

                  opacity: var(--opacity);
                  z-index: var(--zindex);
                  background-color: var(--bg-color);
                  width: 100%;
                  height: var(--height);
                  visibility: hidden;
               }



               ${SELECTOR_CONTAINER} ${SELECTOR}.transition [id|=${SELECTOR_ID}] {
                  transition: transform 200ms linear;
               }

               ${SELECTOR}-progress, ${SELECTOR}-buffer {
                  width: 100%;
                  height: 100%;
                  transform-origin: 0 0;
                  transform: scaleX(0);
               }

               ${SELECTOR}-progress {
                  z-index: calc(var(--zindex) + 1);
               }



               ${SELECTOR}-chapters {
                  position: relative;
                  width: 100%;
                  display: flex;
                  justify-content: flex-end;
               }

               ${SELECTOR}-chapters span {
                  height: var(--height);
                  z-index: calc(var(--zindex) + 1);
                  box-sizing: border-box;
                  padding: 0;
                  margin: 0;
               }

               ${SELECTOR}-chapters > span:first-child:not([time$="0:00"]),
               ${SELECTOR}-chapters > span:not(:first-child) {

                  border-left: ${CHAPTERS_MARK_WIDTH_PX} solid rgba(255,255,255,.7);
               }


               ${SELECTOR}-chapters > span {
                  position: relative;
               }
               ${SELECTOR}-chapters > span > span {
                  position: absolute;
               }

               .${CHP_JUMP_TOGGLE_CLASS_VALUE} {
                  visibility: visible !important;
                  --height: 20px !important;
               }
               .${CHP_JUMP_TOGGLE_CLASS_VALUE}:not(:hover) {
                  --bg-color: coral !important;
               }
               .${CHP_JUMP_TOGGLE_CLASS_VALUE} ${SELECTOR}-chapters span:hover {
                  border-left: ${CHAPTERS_MARK_WIDTH_PX} solid cornflowerblue !important;
                  cursor: pointer;
                  background-color: rgba(255,255,255,.7);
               }`,
          );

          if (user_settings["player-control-autohide"]) {
            switch (user_settings.player_control_autohide_container) {
              case "player":
                NOVA.css.push(
                  `#movie_player:not(:hover) ${SELECTOR} {
                           visibility: visible;
                        }`,
                );
                break;

              case "control":
                NOVA.css.push(
                  `.ytp-chrome-bottom:not(:hover) ~ ${SELECTOR},
                        #movie_player:has(> .ytp-chrome-bottom:not(:hover)) ${SELECTOR} {
                           visibility: visible;
                        }`,
                );
                break;
            }
            if (user_settings.player_control_autohide_show_on_seek) {
              NOVA.css.push(
                `[style*="opacity: 1"] ~ ${SELECTOR} {
                        visibility: hidden;
                     }`,
              );
            }
          } else {
            NOVA.css.push(
              `${SELECTOR_CONTAINER} ${SELECTOR} {
                     visibility: visible;
                  }`,
            );
          }

          return document.getElementById(SELECTOR_ID);
        })()
      );
    }

    function connectChapterJump() {
      let hotkeyActivated;
      document.addEventListener("keydown", showChapterSwitch);
      document.addEventListener("keyup", showChapterSwitch);

      function showChapterSwitch(evt) {
        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;
        if (NOVA.editableFocused(evt.target)) return;

        if (
          (el = document.getElementById(SELECTOR_ID)) &&
          el.querySelector("span[time]")
        ) {
          switch (evt.type) {
            case "keydown":
              const hotkey =
                user_settings.player_float_progress_bar_hotkey.length === 1
                  ? evt.key
                  : evt.code;
              if (
                user_settings.player_float_progress_bar_hotkey == hotkey &&
                !hotkeyActivated
              ) {
                evt.preventDefault();
                evt.stopPropagation();

                el.classList.add(CHP_JUMP_TOGGLE_CLASS_VALUE);
                hotkeyActivated = true;
              }
              break;

            case "keyup":
              if (hotkeyActivated) {
                hotkeyActivated = false;
                el.classList.remove(CHP_JUMP_TOGGLE_CLASS_VALUE);
              }
              break;
          }
        }
      }

      document
        .getElementById(SELECTOR_ID)
        .addEventListener("click", ({ target }) => {
          if (!(secTime = target.getAttribute("time"))) return;

          const sec = NOVA.formatTime.hmsToSec(secTime);

          if (typeof movie_player.seekBy === "function") {
            movie_player.seekTo(sec);
          } else if (NOVA.videoElement) {
            NOVA.videoElement.currentTime = sec;
          }
        });

      document
        .getElementById(SELECTOR_ID)
        .addEventListener("dblclick", ({ target }) => {
          if (!(secTime = target.getAttribute("title"))) return;

          navigator.clipboard
            .writeText(target.title)
            .then(() =>
              NOVA.showOSD({
                message: "Chapter name copied to clipboard",
                source: "player-float-progress-bar",
              }),
            )
            .catch((err) => {
              console.error("Failed copy to clipboard:\n", err);
              NOVA.showOSD({ message: "Failed copy to clipboard" });
            });
        });
    }

    const renderChapters = {
      async init(vid) {
        if (NOVA.currentPage == "watch" && !(vid instanceof HTMLElement)) {
          return console.error("vid not HTMLElement:", chaptersContainer);
        }

        await NOVA.waitUntil(() => !isNaN(vid.duration), 1000);

        switch (NOVA.currentPage) {
          case "watch":
            this.from_description(vid.duration);
            break;

          case "embed":
            let chaptersContainer;
            await NOVA.waitUntil(
              () =>
                (chaptersContainer = document.body.querySelector(
                  ".ytp-chapters-container",
                )) && chaptersContainer?.children.length > 1,
              1000,
            );

            this.renderChaptersMarkers(vid.duration) ||
              this.from_div(chaptersContainer);
            break;
        }

        if (user_settings["sponsor-block"]) {
          setTimeout(() => {
            if (
              document.body.querySelector(
                `#${SELECTOR_ID}-chapters > span[time]`,
              )
            )
              return;

            const chaptersContainer = document.getElementById(
                `${SELECTOR_ID}-chapters`,
              ),
              newChapter = document.createElement("span"),
              newChapter2 = document.createElement("span");

            newChapter.setAttribute("time", "0:00");
            newChapter.style.width = "100%";

            newChapter2.setAttribute("time", "0:01");
            newChapter2.style.width = 0;

            chaptersContainer.append(newChapter, newChapter2);

            this.callEvent();
          }, 5 * 1000);
        }
      },

      from_description(duration = required()) {
        if (isNaN(duration)) return console.error("duration isNaN:", duration);
        if (Math.sign(duration) !== 1)
          return console.error("duration not positive number:", duration);

        const selectorTimestampLink = 'a[href*="&t="]';

        NOVA.waitSelector(
          `ytd-watch-metadata #description.ytd-watch-metadata ${selectorTimestampLink}`,
          { destroy_after_page_leaving: true },
        ).then(() => this.renderChaptersMarkers(duration));

        NOVA.waitSelector(
          `#comments #comment #comment-content ${selectorTimestampLink}`,
          { destroy_after_page_leaving: true },
        ).then(() => {
          if (document.body.querySelector(`${SELECTOR}-chapters > span[time]`))
            return;
          this.renderChaptersMarkers(duration);
        });
      },

      from_div(chapters_container = required()) {
        if (!(chapters_container instanceof HTMLElement))
          return console.error(
            "container not HTMLElement:",
            chapters_container,
          );
        const progressContainerWidth = parseInt(
            getComputedStyle(chapters_container).width,
          ),
          chaptersOut = document.getElementById(`${SELECTOR_ID}-chapters`);

        for (const chapter of chapters_container.children) {
          const newChapter = document.createElement("span"),
            { width, marginLeft, marginRight } = getComputedStyle(chapter),
            chapterMargin = parseInt(marginLeft) + parseInt(marginRight);

          newChapter.style.width =
            ((parseInt(width) + chapterMargin) * 100) / progressContainerWidth +
            "%";

          chaptersOut.append(newChapter);
        }
      },

      renderChaptersMarkers(duration = required()) {
        if (isNaN(duration)) return console.error("duration isNaN:", duration);

        if (
          (chaptersContainer = document.getElementById(
            `${SELECTOR_ID}-chapters`,
          ))
        ) {
          chaptersContainer.textContent = "";
        }
        const chapterList = NOVA.getChapterList(duration);

        chapterList?.forEach((chapter, i, chapters_list) => {
          const newChapter = document.createElement("span");
          const nextChapterSec = chapters_list[i + 1]?.sec || duration;

          newChapter.style.width =
            ((nextChapterSec - chapter.sec) * 100) / duration + "%";
          if (chapter.title) newChapter.title = chapter.title;
          newChapter.setAttribute("time", chapter.time);

          chaptersContainer?.append(newChapter);
        });

        this.callEvent(chapterList);
      },

      callEvent(chapterList) {
        document.dispatchEvent(
          new CustomEvent("render-chapters-markers", {
            bubbles: true,
            detail: {
              chapterList: chapterList,
            },
          }),
        );
      },
    };
  },
  options: {
    player_float_progress_bar_height: {
      _tagName: "input",
      label: "Height",

      "label:pl": "Wysokość",

      type: "number",
      title: "in pixels",

      placeholder: "px",
      min: 1,
      max: 9,
      value: 3,
    },
    player_float_progress_bar_opacity: {
      _tagName: "input",
      label: "Opacity",

      "label:pl": "Przejrzystość",

      type: "number",

      placeholder: "0-1",
      step: 0.05,
      min: 0,
      max: 1,
      value: 0.7,
    },
    player_float_progress_bar_hotkey: {
      _tagName: "select",
      label: "Hotkey to chapters jump (by click)",

      title: "Double click copies chapter name",

      options: [
        { label: "none" },

        { label: "ShiftL", value: "ShiftLeft" },
        { label: "ShiftR", value: "ShiftRight" },
        { label: "CtrlL", value: "ControlLeft" },
        { label: "CtrlR", value: "ControlRight" },
        { label: "AltL", value: "AltLeft" },
        { label: "AltR", value: "AltRight" },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
    },
  },
});

window.nova_plugins.push({
  id: "subtitle",
  title: "Custom subtitle",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    if (
      user_settings.subtitle_auto_translate_disable &&
      window?.localStorage &&
      localStorage.hasOwnProperty("yt-player-caption-sticky-language")
    ) {
      localStorage.removeItem("yt-player-caption-sticky-language");
    }

    const LANGS = Array.isArray(user_settings.subtitle_langs)
      ? user_settings.subtitle_langs
      : [
          user_settings.subtitle_langs ||
            document.documentElement.lang ||
            navigator.language,
        ];

    NOVA.waitSelector("#movie_player video").then((video) => {
      const subtitlesWrapper = Subtitle.create();

      if (user_settings.subtitle_draggable) {
        const makeDraggable = new NOVA.Draggable(movie_player);
        makeDraggable.init(subtitlesWrapper);
      }

      video.addEventListener("timeupdate", () =>
        Subtitle.update(video.currentTime),
      );
      video.addEventListener("seeking", () => {
        Subtitle.updateLastSubtitleIdx = -1;
        Subtitle.update(video.currentTime);
      });

      NOVA.waitSelector(".ytp-subtitles-button").then((caption_btn) => {
        new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "attributes") {
              Subtitle.updateSubtitlesVisibility();
            }
          });
        }).observe(caption_btn, {
          attributes: true,
        });
      });
    });

    const Subtitle = {
      SELECTOR_PREFIX: "nova-subtitle",
      SELECTOR_ID: `nova-subtitle-wrapper`,

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
                  bottom: ${user_settings["player-float-progress-bar"] ? +user_settings.player_float_progress_bar_height : 0}px;
                  --zIndex: ${
                    1 +
                    Math.max(
                      NOVA.css.get(".ytp-chrome-bottom", "z-index"),
                      NOVA.css.get(".ytp-progress-bar", "z-index"),

                      58,
                    )
                  };
                  z-index: var(--zIndex);
               }


               #movie_player:has(.ytp-chrome-bottom:hover) ~ #${this.SELECTOR_ID} {
                  z-index: -1;
               }

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

                  color: ${user_settings.subtitle_color || "#fff"};
                  background-color: rgba(0, 0, 0, ${+user_settings.subtitle_transparent || 0.5});
                  padding: 5px;

                  font-size: ${+user_settings.subtitle_font_size || 1}em;
                  ${
                    user_settings.subtitle_bold
                      ? `text-shadow: rgb(0, 0, 0) 0 0 .1em,
                     rgb(0, 0, 0) 0 0 .2em,
                     rgb(0, 0, 0) 0 0 .4em`
                      : ""
                  };
               }
               #${this.SELECTOR_ID}:hover .nova-subtitles-text-container {
                  overflow-y: auto;
               }

               a.${this.SELECTOR_PREFIX}-time {
                  cursor: pointer;
                  ${user_settings.subtitle_show_time ? "" : "display: none"};
                  color: ghostwhite;
                  margin-right: .3em;
               }
               #${this.SELECTOR_ID}:hover a.${this.SELECTOR_PREFIX}-time {
                  display: revert;
               }
               a.${this.SELECTOR_PREFIX}-time:hover {
                  text-decoration: underline;
               }`,
        );

        const subtitlesWrapper = document.createElement("div");
        subtitlesWrapper.id = this.SELECTOR_ID;

        const subtitlesTextContainer = document.createElement("div");
        subtitlesTextContainer.id = `${this.SELECTOR_PREFIX}-container`;
        subtitlesTextContainer.className = "nova-subtitles-text-container";

        const pre = document.createElement("pre");
        pre.textContent = "Loading data...";
        subtitlesTextContainer.append(pre);

        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = `${this.SELECTOR_PREFIX}-buttons-container`;

        const searchInput = document.createElement("input");
        searchInput.setAttribute("type", "search");
        searchInput.setAttribute("placeholder", "Filter");

        document.addEventListener(
          "keydown",
          (evt) => {
            if (evt.isTrusted && evt.target.isSameNode(searchInput)) {
              evt.preventDefault();
              evt.stopPropagation();
            }
          },
          { capture: true },
        );

        ["change", "keyup"].forEach((evt) => {
          searchInput.addEventListener(evt, function () {
            NOVA.searchFilterHTML({
              keyword: this.value,
              search_selectors: ".nova-subtitles-text-container .subtitle",
              filter_selector: ".nova-subtitle-text",
              highlight_class: "nova-mark-text",
            });
          });
        });

        searchInput.addEventListener("dblclick", () => {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("change"));
        });

        const copyBtn = document.createElement("span");
        if (navigator.clipboard?.write) {
          copyBtn.append(
            (function createSvgIcon() {
              const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
              );
              svg.setAttribute("width", "100%");
              svg.setAttribute("height", "100%");
              svg.setAttribute("viewBox", "0 0 52 52");

              const g = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              g.setAttribute("fill", "currentColor");

              const path1 = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path1.setAttribute(
                "d",
                "M44,2H18c-2.2,0-4,1.8-4,4v2h24c2.2,0,4,1.8,4,4v28h2c2.2,0,4-1.8,4-4V6C48,3.8,46.2,2,44,2z",
              );

              const path2 = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path2.setAttribute(
                "d",
                "M38,16c0-2.2-1.8-4-4-4H8c-2.2,0-4,1.8-4,4v30c0,2.2,1.8,4,4,4h26c2.2,0,4-1.8,4-4V16z M20,23 c0,0.6-0.4,1-1,1h-8c-0.6,0-1-0.4-1-1v-2c0-0.6,0.4-1,1-1h8c0.6,0,1,0.4,1,1V23z M28,39c0,0.6-0.4,1-1,1H11c-0.6,0-1-0.4-1-1v-2 c0-0.6,0.4-1,1-1h16c0.6,0,1,0.4,1,1V39z M32,31c0,0.6-0.4,1-1,1H11c-0.6,0-1-0.4-1-1v-2c0-0.6,0.4-1,1-1h20c0.6,0,1,0.4,1,1V31z",
              );

              g.append(path1, path2);
              svg.append(g);

              return svg;
            })(),
          );

          copyBtn.title = "Copy";
          copyBtn.addEventListener("click", () => {
            navigator.clipboard
              .writeText(
                [...document.querySelectorAll(`.${this.SELECTOR_PREFIX}-text`)]
                  .map((el) => el.innerText)
                  .join("\n"),
              )
              .then(() =>
                NOVA.showOSD({
                  message: "Screenshot copied to clipboard",
                  source: "subtitle",
                }),
              )
              .catch((error) => {
                console.error("Failed to copy to clipboard:\n", error);

                if (error.name === "NotAllowedError") {
                  alert("Clipboard access denied. Tab context is not focused");
                }
                NOVA.showOSD({
                  message: "Failed to copy screenshot",
                  source: "subtitle",
                });
              });
          });
        }

        const selectLang = document.createElement("select");
        const isoLangs = {
          af: { name: "Afrikaans", nativeName: "Afrikaans" },
          sq: { name: "Albanian", nativeName: "Shqip" },
          ar: { name: "Arabic", nativeName: "العربية" },
          az: { name: "Azerbaijani", nativeName: "azərbaycan dili" },
          eu: { name: "Basque", nativeName: "euskara" },
          bn: { name: "Bengali", nativeName: "বাংলা" },
          be: { name: "Belarusian", nativeName: "Беларуская" },
          bg: { name: "Bulgarian", nativeName: "български език" },
          ca: { name: "Catalan; Valencian", nativeName: "Català" },
          zh: { name: "Chinese", nativeName: "中文 (Zhōngwén), 汉语, 漢語" },
          hr: { name: "Croatian", nativeName: "hrvatski" },
          cs: { name: "Czech", nativeName: "česky, čeština" },
          da: { name: "Danish", nativeName: "dansk" },
          nl: { name: "Dutch", nativeName: "Nederlands, Vlaams" },
          en: { name: "English", nativeName: "English" },
          eo: { name: "Esperanto", nativeName: "Esperanto" },
          et: { name: "Estonian", nativeName: "eesti, eesti keel" },
          tl: { name: "Tagalog", nativeName: "Wikang Tagalog, ᜏᜒᜃᜅ᜔ ᜆᜄᜎᜓᜄ᜔" },
          fi: { name: "Finnish", nativeName: "suomi, suomen kieli" },
          fr: { name: "French", nativeName: "français, langue française" },
          gl: { name: "Galician", nativeName: "Galego" },
          ka: { name: "Georgian", nativeName: "ქართული" },
          de: { name: "German", nativeName: "Deutsch" },
          el: { name: "Greek", nativeName: "Ελληνικά" },
          gu: { name: "Gujarati", nativeName: "ગુજરાતી" },
          ht: { name: "Haitian Creole", nativeName: "Kreyòl ayisyen" },
          iw: { name: "Hebrew", nativeName: "עברית" },
          hi: { name: "Hindi", nativeName: "हिन्दी, हिंदी" },
          hu: { name: "Hungarian", nativeName: "Magyar" },
          is: { name: "Icelandic", nativeName: "Íslenska" },
          id: { name: "Indonesian", nativeName: "Bahasa Indonesia" },
          ga: { name: "Irish", nativeName: "Gaeilge" },
          it: { name: "Italian", nativeName: "Italiano" },
          ja: { name: "Japanese", nativeName: "日本語 (にほんご／にっぽんご)" },
          kn: { name: "Kannada", nativeName: "ಕನ್ನಡ" },
          ko: {
            name: "Korean",
            nativeName: "한국어 (韓國語), 조선말 (朝鮮語)",
          },
          la: { name: "Latin", nativeName: "latine, lingua latina" },
          lv: { name: "Latvian", nativeName: "latviešu valoda" },
          lt: { name: "Lithuanian", nativeName: "lietuvių kalba" },
          mk: { name: "Macedonian", nativeName: "македонски јазик" },
          ms: { name: "Malay", nativeName: "bahasa Melayu, بهاس ملايو‎" },
          mt: { name: "Maltese", nativeName: "Malti" },
          no: { name: "Norwegian", nativeName: "Norsk bokmål" },
          fa: { name: "Persian", nativeName: "فارسی" },
          pl: { name: "Polish", nativeName: "polski" },
          pt: { name: "Portuguese", nativeName: "Português" },
          ro: { name: "Romanian, Moldavian", nativeName: "română" },
          ru: { name: "Russian", nativeName: "русский язык" },
          sr: { name: "Serbian", nativeName: "српски језик" },
          sk: { name: "Slovak", nativeName: "slovenčina" },
          sl: { name: "Slovenian", nativeName: "slovenščina" },
          es: { name: "Spanish", nativeName: "español, castellano" },
          sw: { name: "Swahili", nativeName: "Kiswahili" },
          sv: { name: "Swedish", nativeName: "svenska" },
          ta: { name: "Tamil", nativeName: "தமிழ்" },
          te: { name: "Telugu", nativeName: "తెలుగు" },
          th: { name: "Thai", nativeName: "ไทย" },
          tr: { name: "Turkish", nativeName: "Türkçe" },
          uk: { name: "Ukrainian", nativeName: "українська" },
          ur: { name: "Urdu", nativeName: "اردو" },
          vi: { name: "Vietnamese", nativeName: "Tiếng Việt" },
          cy: { name: "Welsh", nativeName: "Cymraeg" },
          yi: { name: "Yiddish", nativeName: "ייִדיש" },
        };
        Object.entries(isoLangs).forEach(([code, lang]) => {
          const availableLangs = YoutubeSubtitle.getSubtitlesList()?.find(
            (item) => item.code === code,
          );

          if (!availableLangs && !LANGS.includes(code)) return;

          const option = document.createElement("option");
          option.value = code;
          option.textContent = availableLangs
            ? `${availableLangs.language}*`
            : lang.name;
          selectLang.append(option);
        });
        selectLang.addEventListener("change", async function () {
          const responseJson = await YoutubeSubtitle.fetchSubtitle(
            selectLang.value,
          );
          Subtitle.subtitlesData = YoutubeSubtitle.parse(responseJson.events);
          Subtitle.updateSubtitlesVisibility();
          Subtitle.render();
        });

        buttonsContainer.append(
          selectLang,
          navigator.clipboard?.write && copyBtn,
          searchInput,
        );
        subtitlesWrapper.append(buttonsContainer, subtitlesTextContainer);

        movie_player.append(subtitlesWrapper);

        return subtitlesWrapper;
      },

      render() {
        const fragment = document.createDocumentFragment();

        this.subtitlesData.forEach((subtitle, idx) => {
          const subtitleContainer = document.createElement("div");
          subtitleContainer.classList.add("subtitle", "inactive");
          subtitleContainer.setAttribute("data-index", idx);

          const subtitleText = document.createElement("span");
          subtitleText.className = `${this.SELECTOR_PREFIX}-text`;

          subtitle.parts.forEach((subtitlePart, idx) => {
            const subtitleTextPart = document.createElement("span");
            subtitleTextPart.className = `${this.SELECTOR_PREFIX}-part`;
            subtitleTextPart.setAttribute("part-offset", subtitlePart.offset);

            if (
              subtitlePart.text.endsWith("[") &&
              (assemblyPart1 = subtitle.parts[idx + 1]?.text) &&
              assemblyPart1.includes("__") &&
              (assemblyPart2 = subtitle.parts[idx + 2]?.text) &&
              assemblyPart2.startsWith("]")
            ) {
              subtitlePart.text = subtitlePart.text.replace("[", "");
              subtitle.parts[idx + 1].text = assemblyPart1.replace(
                "__",
                "[__]",
              );

              subtitle.parts[idx + 2].text = assemblyPart2.replace("]", "");
            }

            const newText = convertMarkdown(subtitlePart.text);
            if (newText) {
              subtitleTextPart.innerHTML = NOVA.createSafeHTML(newText + " ");
              subtitleText.append(subtitleTextPart);
            }
          });

          const timeLink = document.createElement("a");
          timeLink.className = `${this.SELECTOR_PREFIX}-time`;
          timeLink.href = NOVA.queryURL.set({
            t: Math.trunc(subtitle.start) + "s",
          });
          timeLink.textContent = NOVA.formatTime.HMS.digit(subtitle.start);
          timeLink.title = `Duration: ${NOVA.formatTime.HMS.digit(subtitle.duration)}`;
          timeLink.addEventListener("click", (evt) => {
            evt.preventDefault();
            seekTime(subtitle.start);

            function seekTime(sec) {
              if (typeof movie_player.seekBy === "function") {
                movie_player.seekTo(sec);
              } else if (NOVA.videoElement) {
                NOVA.videoElement.currentTime = sec;
              } else {
                const errorText =
                  '[time-jump] > "seekTime" detect player error';
                console.error(errorText);
                throw errorText;
              }
            }
          });

          subtitleContainer.append(timeLink, subtitleText);
          fragment.append(subtitleContainer);
        });

        const subtitlesTextContainer = document.getElementById(
          `${Subtitle.SELECTOR_PREFIX}-container`,
        );
        subtitlesTextContainer.textContent = "";
        subtitlesTextContainer.append(fragment);

        function convertMarkdown(str) {
          return str

            .replace(/(\([^*]+\))/g, '<font class="mention">$1</font>')

            .replace(/((\[(\s)?__(\s)?\]))/g, "&block;&block;&block;")

            .replace(/(\[[^*]+\])/g, '<font class="mention">$1</font>')

            .replace(/(@\S+)/g, '<a href="$2">$1</a>')
            .replace(/(♪[^*]+♪)/, '<font class="music">$1</font>')
            .replace(/^(\-)/, "—")

            .replace(/[\u200B-\u200D\uFEFF\u034f\u2000-\u200F]/g, "")
            .replace(/\s{2,}/g, " ")

            .trim();
        }
      },

      update(time) {
        if (!this.subtitlesData?.length) {
          return;
        }

        const currSubtitleIdx = this.subtitlesData.findLastIndex(
          (c) => time >= c.start && time <= c.start + c.duration,
        );

        if (currSubtitleIdx !== this.updateLastSubtitleIdx) {
          this.updateLastSubtitleIdx = currSubtitleIdx;

          if (this.updateLastSubtitleIdx === -1) {
            document
              .querySelectorAll(".subtitle.active")
              .forEach((el) => el.classList.replace("active", "inactive"));
          } else {
            document
              .querySelector(`.subtitle[data-index="${currSubtitleIdx - 1}"]`)
              ?.classList.replace("active", "inactive");

            document
              .querySelectorAll(`.subtitle[data-index="${currSubtitleIdx}"]`)
              .forEach((el) => el.classList.replace("inactive", "active"));

            if (
              (activeSubEl = document.querySelector(
                `.subtitle[data-index="${currSubtitleIdx}"]`,
              ))
            ) {
              scrollToElement(activeSubEl);
            }
          }

          function scrollToElement(target_el = required()) {
            if (!(target_el instanceof HTMLElement))
              return console.error("target_el not HTMLElement:", target_el);
            const container = target_el.parentElement;
            container.scrollTop =
              target_el.offsetTop - container.clientHeight / 2;
          }
        }
      },

      updateSubtitlesVisibility() {
        document.getElementById(this.SELECTOR_ID).style.display =
          movie_player.isSubtitlesOn() ? "inherit" : "none";
      },
    };

    const YoutubeSubtitle = {
      getSubtitlesList() {
        const captionTracks =
          movie_player.getPlayerResponse()?.captions
            ?.playerCaptionsTracklistRenderer?.captionTracks;

        if (captionTracks) {
          return captionTracks.map((data) => {
            return {
              link: data.baseUrl,
              language: data.name.simpleText,
              code: data.languageCode,
            };
          });
        }
      },

      async fetchSubtitle(lang_code, link) {
        const urlCaption = link || this.getSubtitlesList()?.[0].link;

        if (urlCaption) {
          const dataQuery = { fmt: "json3" };

          if (lang_code) dataQuery["tlang"] = lang_code;
          const captionUrl = NOVA.queryURL.set(dataQuery, urlCaption);
          return await NOVA.fetch(captionUrl);
        } else {
          console.warn("No subtitles available for this video");
        }
      },

      parse(subtitles) {
        const result = [];

        subtitles.forEach((subtitle, idx) => {
          if (subtitle.segs?.length) {
            const parts = [];
            subtitle.segs.forEach((seg) => {
              const text = seg.utf8?.trim();
              if (text) {
                parts.push({
                  text: seg.utf8?.trim(),
                  offset: seg.tOffsetMs / 1000 || 0,
                });
              }
            });

            if (subtitle.dDurationMs && parts?.length) {
              const nextSeg = subtitles[idx + 1];
              if (
                nextSeg &&
                subtitle.tStartMs + subtitle.dDurationMs > nextSeg.tStartMs
              ) {
                subtitle.dDurationMs = nextSeg.tStartMs - subtitle.tStartMs;
              }
              result.push({
                parts,
                start: subtitle.tStartMs / 1000,
                duration: subtitle.dDurationMs / 1000,
              });
            }
          }
        });
        return result;
      },
    };

    (function (origXHROpen) {
      XMLHttpRequest.prototype.open = function (
        method,
        url,
        async,
        user,
        pass,
      ) {
        if (async && url.includes("/api/timedtext")) {
          if (
            LANGS.length &&
            !LANGS.includes(NOVA.queryURL.get("lang", url)) &&
            !LANGS.includes(NOVA.queryURL.get("tlang", url))
          ) {
            YoutubeSubtitle.fetchSubtitle(LANGS, url)
              .then(({ events }) => {
                Subtitle.subtitlesData = YoutubeSubtitle.parse(events);
                Subtitle.updateSubtitlesVisibility();
                Subtitle.render();
              })
              .catch((err) => {
                console.error("Failed patch subtitle:", err);
              });
          }

          this.addEventListener(
            "readystatechange",
            async function (event) {
              if (this.readyState === 4 && this.status === 200) {
                try {
                  Subtitle.subtitlesData = YoutubeSubtitle.parse(
                    JSON.parse(this.responseText).events,
                  );
                  Subtitle.updateSubtitlesVisibility();
                  Subtitle.render();
                } catch (err) {
                  console.error("Failed subtitlesData:", err);
                }
              }
              if (this.onreadystatechange) {
                this.onreadystatechange(event);
              }
            },
            { capture: true },
          );
        }
        origXHROpen.apply(this, arguments);
      };
    })(XMLHttpRequest.prototype.open);

    return;
  },
  options: {
    subtitle_langs: {
      _tagName: "select",
      label: "Preferred languages",

      title: "[Ctrl+Click] to select several",

      "title:pl": "Ctrl+kliknięcie, aby zaznaczyć kilka",

      multiple: null,

      size: 7,
      options: [
        { value: "af", label: "Afrikaans" },
        { value: "sq", label: "Albanian" },
        { value: "ar", label: "Arabic" },
        { value: "az", label: "Azerbaijani" },
        { value: "eu", label: "Basque" },
        { value: "bn", label: "Bengali" },
        { value: "be", label: "Belarusian" },
        { value: "bg", label: "Bulgarian" },
        { value: "ca", label: "Catalan; Valencian" },
        { value: "zh", label: "Chinese" },
        { value: "hr", label: "Croatian" },
        { value: "cs", label: "Czech" },
        { value: "da", label: "Danish" },
        { value: "nl", label: "Dutch" },
        { value: "en", label: "English" },
        { value: "eo", label: "Esperanto" },
        { value: "et", label: "Estonian" },
        { value: "tl", label: "Tagalog" },
        { value: "fi", label: "Finnish" },
        { value: "fr", label: "French" },
        { value: "gl", label: "Galician" },
        { value: "ka", label: "Georgian" },
        { value: "de", label: "German" },
        { value: "el", label: "Greek" },
        { value: "gu", label: "Gujarati" },
        { value: "ht", label: "Haitian Creole" },
        { value: "iw", label: "Hebrew" },
        { value: "hi", label: "Hindi" },
        { value: "hu", label: "Hungarian" },
        { value: "is", label: "Icelandic" },
        { value: "id", label: "Indonesian" },
        { value: "ga", label: "Irish" },
        { value: "it", label: "Italian" },
        { value: "ja", label: "Japanese" },
        { value: "kn", label: "Kannada" },
        { value: "ko", label: "Korean" },
        { value: "la", label: "Latin" },
        { value: "lv", label: "Latvian" },
        { value: "lt", label: "Lithuanian" },
        { value: "mk", label: "Macedonian" },
        { value: "ms", label: "Malay" },
        { value: "mt", label: "Maltese" },
        { value: "no", label: "Norwegian" },
        { value: "fa", label: "Persian" },
        { value: "pl", label: "Polish" },
        { value: "pt", label: "Portuguese" },
        { value: "ro", label: "Romanian, Moldavian" },
        { value: "ru", label: "Russian" },
        { value: "sr", label: "Serbian" },
        { value: "sk", label: "Slovak" },
        { value: "sl", label: "Slovenian" },
        { value: "es", label: "Spanish" },
        { value: "sw", label: "Swahili" },
        { value: "sv", label: "Swedish" },
        { value: "ta", label: "Tamil" },
        { value: "te", label: "Telugu" },
        { value: "th", label: "Thai" },
        { value: "tr", label: "Turkish" },
        { value: "uk", label: "Ukrainian" },
        { value: "ur", label: "Urdu" },
        { value: "vi", label: "Vietnamese" },
        { value: "cy", label: "Welsh" },
        { value: "yi", label: "Yiddish" },
      ],
    },
    subtitle_show_time: {
      _tagName: "input",
      label: "Always show time",

      type: "checkbox",
    },
    subtitle_draggable: {
      _tagName: "input",
      label: "Draggable",

      type: "checkbox",
    },
    subtitle_transparent: {
      _tagName: "input",
      label: "Opacity",

      "label:pl": "Przejrzystość",

      type: "number",

      placeholder: "0-1",
      step: 0.05,
      min: 0,
      max: 1,
      value: 0.55,
    },
    subtitle_font_size: {
      _tagName: "input",
      label: "Font size",

      "label:pl": "Rozmiar czcionki",

      type: "number",
      title: "in em",

      placeholder: "1-3",
      step: 0.1,
      min: 1,
      max: 3,
      value: 1.5,
    },
    subtitle_bold: {
      _tagName: "input",
      label: "Bold text",

      "label:pl": "Tekst pogrubiony",

      type: "checkbox",
    },
    subtitle_auto_translate_disable: {
      _tagName: "input",
      label: "Prevent Auto-Translation",

      type: "checkbox",
    },
    subtitle_color: {
      _tagName: "input",
      type: "color",
      value: "#ffffff",
      label: "Color",

      "label:pl": "Kolor",

      title: "default - #FFF",
    },
  },
});
window.nova_plugins.push({
  id: "player-hotkeys-focused",
  title: "Player shortcuts always active",

  "title:pl": "Klawisze skrótów dla graczy zawsze aktywne",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    document.addEventListener("keyup", (evt) => {
      switch (NOVA.currentPage) {
        case "watch":
        case "embed":
          if (NOVA.editableFocused(evt.target)) return;
          setPlayerFocus();
          break;
      }
    });

    if (user_settings.hotkeys_disable_numpad) {
      document.addEventListener(
        "keydown",
        (evt) => {
          if (evt.code.startsWith("Numpad")) {
            evt.preventDefault();
            evt.stopPropagation();
          }
        },
        { capture: true },
      );
    }

    function setPlayerFocus(target) {
      movie_player.focus({ preventScroll: true });
    }
  },
  options: {
    hotkeys_disable_numpad: {
      _tagName: "input",

      label: "Disable numpad",

      type: "checkbox",
    },
  },
});

window.nova_plugins.push({
  id: "download-video",
  title: "Download video",

  run_on_pages: "watch, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    NOVA.waitSelector("#movie_player .ytp-right-controls").then((container) => {
      const SELECTOR_BTN_CONTAINER_CLASS_NAME = "nova-video-download",
        SELECTOR_BTN_CONTAINER = "." + SELECTOR_BTN_CONTAINER_CLASS_NAME,
        containerBtn = document.createElement("button"),
        SELECTOR_BTN_LIST_ID = SELECTOR_BTN_CONTAINER_CLASS_NAME + "-list",
        SELECTOR_BTN_LIST = "#" + SELECTOR_BTN_LIST_ID,
        dropdownMenu = document.createElement("ul"),
        SELECTOR_BTN_LABEL_ID = SELECTOR_BTN_CONTAINER_CLASS_NAME + "-label",
        SELECTOR_BTN_LABEL = "#" + SELECTOR_BTN_LABEL_ID,
        labelBtn = document.createElement("span");

      NOVA.runOnPageLoad(() => {
        if (NOVA.currentPage == "watch") {
          containerBtn.removeEventListener("click", generateMenu);
          dropdownMenu.textContent = "";

          containerBtn.addEventListener("click", generateMenu, {
            capture: true,
            once: true,
          });
        }
      });

      NOVA.css.push(
        `${SELECTOR_BTN_LABEL}[tooltip]:hover::before {
                  content: attr(tooltip);
                  position: absolute;
                  top: -3em;
                  transform: translateX(-30%);
                  line-height: normal;
                  background-color: rgba(28,28,28,.9);
                  border-radius: .3em;
                  padding: 5px 9px;
                  color: white;
                  font-size: initial;
                  font-weight: bold;
                  white-space: nowrap;
               }

               html[data-cast-api-enabled] ${SELECTOR_BTN_LABEL}[tooltip]:hover::before {
                  font-weight: normal;
               }`,
      );

      NOVA.css.push(
        `${SELECTOR_BTN_CONTAINER} {
                  overflow: visible !important;
                  position: relative;
                  text-align: center !important;
                  vertical-align: top;
                  font-weight: bold;
               }

               ${SELECTOR_BTN_CONTAINER}:hover { color: #66afe9 !important; }
               ${SELECTOR_BTN_CONTAINER}:active { color: #2196f3 !important; }

               ${SELECTOR_BTN_LABEL} {

                  display: inline;
                  height: inherit;
                  line-height: 1.7;
                  font-size: 2em;
                  vertical-align: bottom;
               }

               ${SELECTOR_BTN_LIST} {
                  position: absolute;
                  bottom: 2.5em !important;
                  left: -2.2em;
                  list-style: none;
                  padding-bottom: 1.5em !important;
                  z-index: ${1 + Math.max(NOVA.css.get(".ytp-progress-bar", "z-index"), 31)};
               }


               html[data-cast-api-enabled] ${SELECTOR_BTN_LIST} {
                  margin: 0;
                  padding: 0;
                  bottom: 3.3em;

               }

               ${SELECTOR_BTN_CONTAINER}:not(:hover) ${SELECTOR_BTN_LIST} {
                  display: none;
               }

               ${SELECTOR_BTN_LIST} li {
                  cursor: pointer;
                  white-space: nowrap;
                  line-height: 1.4;
                  background-color: rgba(28, 28, 28, .9);
                  margin: .1em 0;
                  padding: .5em 2em;
                  border-radius: .3em;
                  color: white;
               }



               ${SELECTOR_BTN_LIST} li:hover { background-color: #c00; }`,
      );

      containerBtn.classList.add(
        "ytp-button",
        SELECTOR_BTN_CONTAINER_CLASS_NAME,
        "nova-right-custom-button",
      );

      labelBtn.id = SELECTOR_BTN_LABEL_ID;

      labelBtn.setAttribute("tooltip", "Nova video download");

      labelBtn.append(
        (function createSvgIcon() {
          const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
          );
          svg.setAttribute("width", "100%");
          svg.setAttribute("height", "100%");
          svg.setAttribute("viewBox", "0 0 582.207 582.207");
          svg.style.scale = 0.7;

          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("fill", "currentColor");

          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          path.setAttribute(
            "d",
            "M389.752,324.006V125.105c0-6.249-5.066-11.316-11.316-11.316H203.771c-6.249,0-11.316,5.067-11.316,11.316v198.893 h-53.672c-15.618,0-19.327,8.955-8.28,20L271.11,484.605c11.047,11.047,28.955,11.047,40,0L451.711,344 c11.047-11.047,7.338-20.002-8.279-20.002h-53.68V324.006z",
          );

          g.append(path);
          svg.append(g);

          return svg;
        })(),
      );

      dropdownMenu.id = SELECTOR_BTN_LIST_ID;

      containerBtn.append(labelBtn, dropdownMenu);
      container.prepend(containerBtn);

      async function generateMenu() {
        if ((menuList = document.getElementById(SELECTOR_BTN_LIST_ID))) {
          APIs.videoId =
            NOVA.queryURL.get("v") || movie_player.getVideoData().video_id;

          const labelBtnCloned = labelBtn.cloneNode(true);

          labelBtn.textContent = "🕓";
          labelBtn.cursor = "wait";

          let downloadVideoList = [];
          switch (user_settings.download_video_mode) {
            case "cobalt":
              downloadVideoList = APIs.Cobalt();

              break;

            case "loader.to":
              downloadVideoList = APIs.loaderTo();
              break;

            case "poketube":
              downloadVideoList = APIs.Poketube();
              break;

            case "tubenightly":
              downloadVideoList = APIs.TubeNightly();
              break;

            case "third_party_methods":
              downloadVideoList = APIs.third_party();
              break;

            case "direct":
              downloadVideoList = await APIs.getInternalListUrls();
              break;

            default:
              alert("Error APIs miss:\n" + user_settings.download_video_mode);
              break;
          }

          downloadVideoList
            .filter((i) => i?.codec)
            .forEach((item, idx) => {
              const menuItem = document.createElement("li");

              if (item.quality) {
                menuItem.textContent = `${item.codec} / ${item.quality}`;
              } else menuItem.textContent = item.codec;

              menuItem.addEventListener(
                "click",
                () => {
                  if (item.custom_fn && typeof item.custom_fn === "function") {
                    item.custom_fn(item);
                  } else if (item.link_new_tab) {
                    window.open(item.link_new_tab, "_blank");
                  } else {
                    downloadFile(item.link);
                  }
                },
                { capture: true },
              );

              menuList.append(menuItem);
            });

          labelBtn.replaceWith(labelBtnCloned);

          labelBtn.style.cursor = "";
        }
      }
    });

    const APIs = {
      getQualityAvailableList() {
        const qualityList = {
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
        };
        return movie_player
          .getAvailableQualityData()
          .map((i) => qualityList[i.quality]);
      },

      Cobalt() {
        const qualityAvailableList = this.getQualityAvailableList();
        let vidlist = [];

        ["h264", "vp9"].forEach((codec) => {
          qualityAvailableList.forEach((quality) => {
            vidlist.push(
              ...[
                {
                  codec: codec,
                  quality: quality,
                  data: { vCodec: codec, vQuality: String(quality) },
                  custom_fn: CobaltAPI,
                },
              ],
            );
          });
        });
        return [
          ...vidlist,

          {
            codec: "mp3",
            data: { isAudioOnly: true, cCodec: "mp3" },
            custom_fn: CobaltAPI,
          },
          {
            codec: "ogg",
            data: { isAudioOnly: true, cCodec: "ogg" },
            custom_fn: CobaltAPI,
          },
          {
            codec: "wav",
            data: { isAudioOnly: true, cCodec: "wav" },
            custom_fn: CobaltAPI,
          },
          {
            codec: "opus",
            data: { isAudioOnly: true, cCodec: "opus" },
            custom_fn: CobaltAPI,
          },
        ];

        async function CobaltAPI(item) {
          const dlink = await NOVA.fetch("https://api.cobalt.tools/api/json", {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              url: encodeURI("https://www.youtube.com/watch?v=" + APIs.videoId),

              filenamePattern: "basic",

              disableMetadata: true,
              isNoTTWatermark: true,
              ...item.data,
            }),
          })
            .then((response) => response.json())

            .then((json) => json.url)
            .catch((error) => {
              throw new Error(`Cobalt API: failed fetching: ${error}`);
            });

          if (!dlink) return console.error("CobaltAPI empty dlink:", dlink);
          downloadFile(dlink);
        }
      },

      third_party() {
        return [
          {
            quality: "mp3,mp4,m4a,aac,3gp,avi,mov,mkv",
            codec: "clipconverter.cc",
            link_new_tab:
              "https://www.clipconverter.cc/3/?url=https://www.youtube.com/watch?v=" +
              APIs.videoId,
          },
          {
            quality: "mp3,mp4,m4a,webp,acc,flac,opus,ogg,wav",
            codec: "loader.to",

            custom_fn: () =>
              NOVA.openPopup({
                url:
                  "https://loader.to/api/card2/?url=https://www.youtube.com/watch?v=" +
                  APIs.videoId,
                width: 960,
                height: 350,
              }),
          },
          {
            quality: "mp3,mp4,3gp,M4A",
            codec: "tomp3.cc",
            link_new_tab: "https://tomp3.cc/youtube-downloader/" + APIs.videoId,
          },

          {
            quality: "mp4,m4a,webm,opus",
            codec: "savefrom.net",
            link_new_tab:
              "https://savefrom.net/https://www.youtube.com/watch?v=" +
              APIs.videoId,
          },

          {
            quality: "mp3,mp4,3gp",
            codec: "Y2Mate",
            link_new_tab: "https://www.y2mate.com/youtube/" + APIs.videoId,
          },

          {
            quality: "mp3,mp4,3gp",
            codec: "yt1s.ltd",

            link_new_tab:
              "https://www.yt1s.com/en?q=https://www.youtube.com/watch?v=" +
              APIs.videoId,
          },

          {
            quality: "mp3,mp4,ogg,3gp",
            codec: "yt5s",
            link_new_tab: "https://yt5s.com/watch?v=" + APIs.videoId,
          },

          {
            quality: "mp3,mp4,ogg,3gp",
            codec: "snapsave.io",
            link_new_tab: "https://snapsave.io/?q=" + APIs.videoId,
          },
          {
            quality: "mp3,mp4,ogg,3gp",
            codec: "x2download.app",
            link_new_tab: "https://x2download.app/?q=" + APIs.videoId,
          },

          {
            quality: "mp3,mp4,webp",
            codec: "addyoutube.com",
            link_new_tab: "https://addyoutube.com/watch?v=" + APIs.videoId,
          },

          {
            quality: "mp4,webp",
            codec: "10downloader.com",
            link_new_tab:
              "https://10downloader.com/download?v=https://www.youtube.com/watch?v=" +
              APIs.videoId,
          },

          {
            quality: "mp3,mp4",
            codec: "YtbSave.com",
            link_new_tab:
              "https://ytbsave.com/https://www.youtube.com/watch?v=" +
              APIs.videoId,
          },

          {
            quality: "mp3,mp4(360p)",
            codec: "TubeMP3.to",
            link_new_tab: "https://tubemp3.to/" + APIs.videoId,
          },

          {
            quality: "mp3",
            codec: "conv2.be",
            link_new_tab: "https://conv2.be/watch?v=" + APIs.videoId,
          },
          {
            quality: "mp3",
            codec: "onlymp3.app",
            link_new_tab: "https://onlymp3.app/convert/" + APIs.videoId,
          },
        ];
      },
    };

    function downloadFile(url = required()) {
      const d = document.createElement("a");
      d.style.display = "none";
      d.download =
        movie_player
          .getVideoData()
          .title.replace(/[\\/:*?"<>|]+/g, "")
          .replace(/\s+/g, " ")
          .trim() + ".mp4";
      d.href = url;
      document.body.append(d);
      d.click();
      d.remove();
    }
  },
  options: {
    download_video_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "cobalt",
          value: "cobalt",
          selected: true,
        },

        {
          label: "multi 3rd party",
          value: "third_party_methods",
        },
      ],
    },
  },
});

window.nova_plugins.push({
  id: "embed-show-control-force",
  title: "Force enable control panel (for embed)",

  "title:pl": "Wymuś włączenie panelu sterowania w osadzeniu",

  run_on_pages: "embed",
  section: "player-control",
  _runtime: (user_settings) => {
    const href = location.href.replace(/&amp;/g, "&");

    if (["0", "false"].includes(NOVA.queryURL.get("controls", href))) {
      NOVA.updateUrl(NOVA.queryURL.remove("controls", href));
    }
  },
});
window.nova_plugins.push({
  id: "time-remaining",
  title: "Remaining time",

  "title:pl": "Pozostały czas",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",
  desc: "Remaining time until the end of the video",
  "desc:zh": "距离视频结束的剩余时间",
  "desc:ja": "ビデオの終わりまでの残り時間",

  "desc:pl": "Czas pozostały do końca filmu",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-player-time-remaining";

    let selectorOutAfter;
    switch (user_settings.time_remaining_position) {
      case "description":
        selectorOutAfter = "#title h1";
        break;

      default:
        selectorOutAfter =
          ".ytp-time-duration, ytm-time-display .time-display-content";
        break;
    }

    NOVA.waitSelector(selectorOutAfter).then((container) => {
      NOVA.waitSelector("video").then((video) => {
        video.addEventListener("timeupdate", setRemaining.bind(video));
        video.addEventListener("ratechange", setRemaining.bind(video));

        video.addEventListener("ended", () =>
          insertToHTML({ container: container }),
        );
        document.addEventListener("yt-navigate-finish", () =>
          insertToHTML({ container: container }),
        );
      });

      function setRemaining() {
        if (
          isNaN(this.duration) ||
          movie_player.getVideoData().isLive ||
          (NOVA.currentPage == "embed" &&
            document.URL.includes("live_stream")) ||
          document.visibilityState == "hidden" ||
          (user_settings.time_remaining_position != "description" &&
            movie_player.classList.contains("ytp-autohide"))
        )
          return;

        const playbackRate = this.playbackRate,
          currentTime = Math.trunc(this.currentTime),
          duration = Math.trunc(this.duration),
          left = duration - currentTime,
          floatRound = (value, total) => {
            const precision = total > 3600 ? 2 : total > 1500 ? 1 : 0;
            return value.toFixed(precision);
          },
          getPercent = (partialValue, totalValue) =>
            floatRound((partialValue * 100) / totalValue, totalValue) + "%";

        const patternHandlers = {
          "{speed}": () => playbackRate + "x",
          "{speed*}": () => (playbackRate === 1 ? "" : playbackRate + "x"),
          "{left}": () => "-" + NOVA.formatTime.HMS.digit(left),
          "{left^}": () => "-" + NOVA.formatTime.HMS.digit(left / playbackRate),
          "{left%}": () => "-" + getPercent(left, duration),
          "{done}": () => NOVA.formatTime.HMS.digit(currentTime),
          "{done^}": () =>
            NOVA.formatTime.HMS.digit(currentTime / playbackRate),
          "{done%}": () => getPercent(currentTime, duration),
          "{duration}": () => NOVA.formatTime.HMS.digit(duration),
          "{duration^}": () =>
            NOVA.formatTime.HMS.digit(duration / playbackRate),
        };

        const defaultHandler = (pattern) => {
          return pattern;
        };

        const patternHandler = (pattern) => {
          const handler = patternHandlers[pattern];
          return handler ? handler.call(this) : defaultHandler(pattern);
        };

        const text = user_settings.time_remaining_format.replace(
          /\{(speed|left|done|duration)([\^%*])?}/g,
          patternHandler,
        );

        if (text) insertToHTML({ text: text, container: container });
      }

      function insertToHTML({ text = "", container = required() }) {
        if (!(container instanceof HTMLElement)) {
          console.error("Container is not an HTMLElement:", container);
          return;
        }

        (
          document.getElementById(SELECTOR_ID) ||
          (function () {
            const el = document.createElement("span");
            el.id = SELECTOR_ID;
            container.after(el);

            return el;
          })()
        ).textContent = " " + text;
      }
    });
  },
  options: {
    time_remaining_format: {
      _tagName: "input",
      label: "Time pattern",

      type: "text",
      list: "time_remaining_format_help_list",
      pattern: "(.*)?\\{[a-z]+[\%\^\*]?\\}(.*)?",
      title: "Clear input to show hints",

      placeholder: "{done%}/{duration^} ({speed})",

      maxlength: 100,

      required: true,
    },
    time_remaining_format_help_list: {
      _tagName: "datalist",
      options: [
        { label: "0:10/1:00 (17%)", value: "{done}/{duration} ({done%})" },
        { label: "0:05/0:25 2x", value: "{done^}/{duration^} {speed}" },
        { label: "-0:50/1:00 • -83%", value: "{left}/{duration} • {left%}" },
        { label: "-0:25/0:30 2x", value: "{left^}/{duration^} {speed*}" },
        {
          label: "-0:50/1:00 • -0:25/0:30 (17%) 2x",
          value: "{left}/{duration} • {left^}/{duration^} ({done%}) {speed}",
        },
        {
          label: "-0:50 -0:25 -83% • 0:10 0:05 17% • 1:00 0:30 • 2x",
          value:
            "{left} {left^} {left%} • {done} {done^} {done%} • {duration} {duration^} • {speed} {speed*}",
        },
        {
          label: "For a custom template, you can use these fields:",
          value: " ",
        },

        { label: "2x", value: "{speed}" },
        { label: '2x "*" mean optional', value: "{speed*}" },
        { label: "-0:50", value: "{left}" },
        {
          label: '-0:25 "^" correction current playback speed',
          value: "{left^}",
        },
        { label: "-83%", value: "{left%}" },
        { label: "0:10", value: "{done}" },
        { label: "0:05", value: "{done^}" },
        { label: "17%", value: "{done%}" },
        { label: "1:00", value: "{duration}" },
        { label: "0:25", value: "{duration^}" },
      ],
    },

    time_remaining_position: {
      _tagName: "select",
      label: "Render section",

      options: [
        {
          label: "player",
          value: "player",
          selected: true,
        },
        {
          label: "description",
          value: "description",
        },
      ],
    },
  },
});

window.nova_plugins.push({
  id: "player-quick-buttons",
  title: "Add custom player buttons",

  "title:pl": "Dodaj własne przyciski odtwarzacza",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    const SELECTOR_BTN_CLASS_NAME = "nova-right-custom-button",
      SELECTOR_BTN = "." + SELECTOR_BTN_CLASS_NAME;

    NOVA.waitSelector("#movie_player .ytp-right-controls").then(
      async (container) => {
        NOVA.videoElement = await NOVA.waitSelector("video");

        NOVA.css.push(
          `${SELECTOR_BTN} {
                  user-select: none;

               }
               ${SELECTOR_BTN}:hover { color: #66afe9 !important; }
               ${SELECTOR_BTN}:active { color: #2196f3 !important; }`,
        );

        NOVA.css.push(
          `${SELECTOR_BTN}[tooltip]:hover::before {
                  content: attr(tooltip);
                  position: absolute;
                  top: -3em;
                  transform: translateX(-30%);
                  line-height: normal;
                  background-color: rgba(28,28,28,.9);
                  border-radius: .3em;
                  padding: 5px 9px;
                  color: white;
                  font-weight: bold;
                  white-space: nowrap;
               }

               html[data-cast-api-enabled] ${SELECTOR_BTN}[tooltip]:hover::before {
                  font-weight: normal;
               }`,
        );

        if (user_settings.player_buttons_custom_autohide) {
          NOVA.css.push(
            `.ytp-right-controls:has(>[aria-label]:hover) button.nova-right-custom-button {
                     width: 10px;
                  }
                  .ytp-right-controls:not(:hover) button.nova-right-custom-button {
                     display: none;
                  }`,
          );
        }

        if (
          user_settings.player_buttons_custom_items?.includes(
            "picture-in-picture",
          )
        ) {
          const pipBtn = document.createElement("button");
          pipBtn.classList.add("ytp-button", SELECTOR_BTN_CLASS_NAME);
          pipBtn.setAttribute("tooltip", "Picture in Picture (PiP)");
          pipBtn.innerHTML = createSvgIcon();

          pipBtn.addEventListener("click", () =>
            document.pictureInPictureElement
              ? document.exitPictureInPicture()
              : NOVA.videoElement?.requestPictureInPicture(),
          );

          container.prepend(pipBtn);

          NOVA.videoElement?.addEventListener(
            "enterpictureinpicture",
            () => (pipBtn.innerHTML = createSvgIcon("pip_enabled")),
          );
          NOVA.videoElement?.addEventListener(
            "leavepictureinpicture",
            () => (pipBtn.innerHTML = createSvgIcon()),
          );

          function createSvgIcon(pip_enabled) {
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("viewBox", "-8 -6 36 36");

            const g = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g",
            );
            g.setAttribute("fill", "currentColor");

            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            path.setAttribute(
              "d",
              pip_enabled
                ? "M18.5,11H18v1h.5A1.5,1.5,0,0,1,20,13.5v5A1.5,1.5,0,0,1,18.5,20h-8A1.5,1.5,0,0,1,9,18.5V18H8v.5A2.5,2.5,0,0,0,10.5,21h8A2.5,2.5,0,0,0,21,18.5v-5A2.5,2.5,0,0,0,18.5,11Z M14.5,4H2.5A2.5,2.5,0,0,0,0,6.5v8A2.5,2.5,0,0,0,2.5,17h12A2.5,2.5,0,0,0,17,14.5v-8A2.5,2.5,0,0,0,14.5,4Z"
                : "M2.5,17A1.5,1.5,0,0,1,1,15.5v-9A1.5,1.5,0,0,1,2.5,5h13A1.5,1.5,0,0,1,17,6.5V10h1V6.5A2.5,2.5,0,0,0,15.5,4H2.5A2.5,2.5,0,0,0,0,6.5v9A2.5,2.5,0,0,0,2.5,18H7V17Z M18.5,11h-8A2.5,2.5,0,0,0,8,13.5v5A2.5,2.5,0,0,0,10.5,21h8A2.5,2.5,0,0,0,21,18.5v-5A2.5,2.5,0,0,0,18.5,11Z",
            );

            g.append(path);
            svg.append(g);

            return NOVA.createSafeHTML(svg.outerHTML);
          }
        }

        if (
          user_settings.player_buttons_custom_items?.indexOf("popup") !== -1 &&
          !NOVA.queryURL.has("popup")
        ) {
          const popupBtn = document.createElement("button");
          popupBtn.classList.add("ytp-button", SELECTOR_BTN_CLASS_NAME);

          popupBtn.setAttribute("tooltip", "Open in popup");

          popupBtn.append(
            (function createSvgIcon() {
              const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
              );
              svg.setAttribute("viewBox", "-8 -8 36 36");
              svg.setAttribute("height", "100%");
              svg.setAttribute("width", "100%");

              const g = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              g.setAttribute("fill", "currentColor");

              const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path.setAttribute(
                "d",
                "M18 2H6v4H2v12h12v-4h4V2z M12 16H4V8h2v6h6V16z M16 12h-2h-2H8V8V6V4h8V12z",
              );

              g.append(path);
              svg.append(g);

              return svg;
            })(),
          );
          popupBtn.addEventListener("click", () => {
            const { width, height } = NOVA.aspectRatio.sizeToFit({
              src_width: NOVA.videoElement.videoWidth,
              src_height: NOVA.videoElement.videoHeight,
            });

            const url = new URL(
              document.head.querySelector('link[itemprop="embedUrl"][href]')
                ?.href ||
                location.origin +
                  "/embed/" +
                  movie_player.getVideoData().video_id,
            );

            if ((currentTime = Math.trunc(NOVA.videoElement?.currentTime)))
              url.searchParams.set("start", currentTime);
            url.searchParams.set("autoplay", 1);
            url.searchParams.set("popup", true);

            NOVA.openPopup({ url: url.href, width: width, height: height });
          });

          container.prepend(popupBtn);
        }

        if (user_settings.player_buttons_custom_items?.includes("screenshot")) {
          const SELECTOR_SCREENSHOT_ID = "nova-screenshot-result",
            SELECTOR_SCREENSHOT = "#" + SELECTOR_SCREENSHOT_ID;

          NOVA.css.push(
            SELECTOR_SCREENSHOT +
              ` {
                     --width: 400px;
                     --height: 400px;

                     position: fixed;
                     top: 0;
                     right: 0;
                     overflow: hidden;
                     margin: 36px 30px;
                     box-shadow: 0 0 15px black;
                     max-width: var(--width);
                     max-height: var(--height);
                  }





                  ${SELECTOR_SCREENSHOT} canvas {
                     max-width: var(--width);
                     max-height: var(--height);

                  }

                  ${SELECTOR_SCREENSHOT} .close-btn {
                     position: absolute;
                     bottom: 0;
                     right: 0;
                     background-color: rgba(0, 0, 0, .5);
                     color: white;
                     cursor: pointer;
                     font-size: 12px;
                     display: grid;
                     height: 100%;
                     width: 25%;
                  }
                  ${SELECTOR_SCREENSHOT} .close-btn:hover { background-color: rgba(0, 0, 0, .65); }
                  ${SELECTOR_SCREENSHOT} .close-btn > * { margin: auto; }`,
          );

          const screenshotBtn = document.createElement("button");
          screenshotBtn.classList.add("ytp-button", SELECTOR_BTN_CLASS_NAME);

          screenshotBtn.setAttribute("tooltip", "Take screenshot");

          screenshotBtn.append(
            (function createSvgIcon() {
              const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
              );
              svg.setAttribute("viewBox", "0 -166 512 860");
              svg.setAttribute("height", "100%");
              svg.setAttribute("width", "100%");

              const g = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              g.setAttribute("fill", "currentColor");

              const circle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle",
              );
              circle.setAttribute("cx", "255.811");
              circle.setAttribute("cy", "285.309");
              circle.setAttribute("r", "75.217");

              const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path.setAttribute(
                "d",
                "M477,137H352.718L349,108c0-16.568-13.432-30-30-30H191c-16.568,0-30,13.432-30,30l-3.718,29H34 c-11.046,0-20,8.454-20,19.5v258c0,11.046,8.954,20.5,20,20.5h443c11.046,0,20-9.454,20-20.5v-258C497,145.454,488.046,137,477,137 z M255.595,408.562c-67.928,0-122.994-55.066-122.994-122.993c0-67.928,55.066-122.994,122.994-122.994 c67.928,0,122.994,55.066,122.994,122.994C378.589,353.495,323.523,408.562,255.595,408.562z M474,190H369v-31h105V190z",
              );

              g.append(circle, path);
              svg.append(g);

              return svg;
            })(),
          );

          screenshotBtn.addEventListener("click", () => {
            const container =
                document.getElementById(SELECTOR_SCREENSHOT_ID) ||
                document.createElement("a"),
              canvas =
                container.querySelector("canvas") ||
                document.createElement("canvas"),
              ctx = canvas.getContext("2d"),
              mimeType = getMimeType(),
              { width, height } = getCanvasDimensions();

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(NOVA.videoElement, 0, 0, canvas.width, canvas.height);
            canvas.title = "Click to save";

            if (user_settings.player_buttons_custom_screenshot_subtitle)
              renderSubtitle();

            try {
              canvas.toBlob((blob) => {
                if (
                  user_settings.player_buttons_custom_screenshot_format ==
                  "popup"
                ) {
                  const convasURL = URL.createObjectURL(blob);

                  NOVA.openPopup({
                    url: convasURL,
                    width: canvas.width,
                    height: canvas.height,
                  });
                  URL.revokeObjectURL(convasURL);
                } else if (
                  user_settings.player_buttons_custom_screenshot_format ==
                    "clipboard" &&
                  navigator.clipboard?.write
                ) {
                  navigator.clipboard
                    .write([new ClipboardItem({ [mimeType]: blob })])
                    .then(() =>
                      NOVA.showOSD({
                        message: "Screenshot copied to clipboard",
                      }),
                    )
                    .catch((err) => {
                      console.error("Failed to copy to clipboard:\n", err);

                      if (err.name === "NotAllowedError") {
                        alert(
                          "Clipboard access denied. Tab context is not focused",
                        );
                        createPreviewContainer(blob);
                      }
                      NOVA.showOSD({ message: "Failed to copy screenshot" });
                    });
                } else createPreviewContainer(blob);
              }, mimeType);
            } catch (err) {
              console.error("Failed to capture screenshot:", err);
              NOVA.showOSD({ message: "Error: Take screenshot" });
            }

            function getMimeType() {
              const format =
                user_settings.player_buttons_custom_screenshot_format;
              return `image/${!format || format == "clipboard" ? "png" : format}`;
            }

            function getCanvasDimensions() {
              if (
                user_settings.player_buttons_custom_screenshot_size === "player"
              ) {
                return NOVA.aspectRatio.sizeToFit({
                  src_width: NOVA.videoElement.videoWidth,
                  src_height: NOVA.videoElement.videoHeight,
                  max_width: movie_player.clientWidth,
                  max_height: movie_player.clientHeight,
                });
              } else {
                return {
                  width: NOVA.videoElement.videoWidth,
                  height: NOVA.videoElement.videoHeight,
                };
              }
            }

            function renderSubtitle() {
              if (
                (textString =
                  document.body.querySelector(".caption-window")?.innerText)
              ) {
                const fontSize = Math.trunc(canvas.height * 0.05);
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textAlign = "bottom";
                ctx.textBaseline = "middle";

                ctx.fillStyle =
                  user_settings.player_buttons_custom_screenshot_subtitle_color ||
                  "white";

                ctx.strokeStyle =
                  user_settings.player_buttons_custom_screenshot_subtitle_shadow_color ||
                  "black";
                ctx.lineWidth = canvas.height / 1000;

                let h = canvas.height * 0.9;
                textString.split("\n").forEach((text) => {
                  const metrics = ctx.measureText(text),
                    lineHeight =
                      metrics.actualBoundingBoxAscent +
                      metrics.actualBoundingBoxDescent,
                    textWidth = ctx.measureText(text).width,
                    w = canvas.width / 2 - textWidth / 2;

                  ctx.fillText(text, w, h);
                  ctx.strokeText(text, w, h);

                  h += lineHeight;
                });
              }
            }

            function createPreviewContainer(blob) {
              if (container.id) return;

              container.id = SELECTOR_SCREENSHOT_ID;

              container.href = URL.createObjectURL(blob);
              container.target = "_blank";

              if (
                (headerContainer =
                  document.getElementById("masthead-container"))
              ) {
                container.style.marginTop =
                  (headerContainer?.offsetHeight || 0) + "px";

                container.style.zIndex =
                  parseInt(getComputedStyle(headerContainer).zIndex, 10) + 1;
              }

              canvas.addEventListener(
                "click",
                (evt) => {
                  evt.preventDefault();
                  downloadCanvasAsImage(evt.target, mime);
                  container.remove();
                  URL.revokeObjectURL(container.href);
                },
                { capture: true },
              );

              container.append(canvas, createCloseButton());
              document.body.append(container);

              function downloadCanvasAsImage(canvas, mime = "image/png") {
                const downloadLink = document.createElement("a"),
                  time = NOVA.formatTime.HMS.abbr(
                    NOVA.videoElement.currentTime,
                  ),
                  downloadFileName = `${cleanFileName(movie_player.getVideoData().title)} (${time}) ? (${time}) : ''`;

                downloadLink.href = canvas
                  .toDataURL(mime)
                  .replace(mime, "image/octet-stream");

                downloadLink.download = `${downloadFileName}.${user_settings.player_buttons_custom_screenshot_format || "png"}`;
                downloadLink.click();
                URL.revokeObjectURL(downloadLink.href);

                function cleanFileName(str) {
                  return str
                    .replace(/[^\w\s._-]/g, "")
                    .replace(/\s{2,}/g, " ")
                    .trim();
                }
              }

              function createCloseButton() {
                const button = document.createElement("a");
                button.className = "close-btn";

                const span = document.createElement("span");
                span.textContent = "CLOSE";
                button.append(span);

                button.title = "Close";
                button.addEventListener("click", (evt) => {
                  evt.preventDefault();
                  container.remove();
                  URL.revokeObjectURL(container.href);
                });
                return button;
              }
            }
          });

          container.prepend(screenshotBtn);
        }

        if (user_settings.player_buttons_custom_items?.includes("thumbnail")) {
          const thumbBtn = document.createElement("button");
          thumbBtn.classList.add("ytp-button", SELECTOR_BTN_CLASS_NAME);

          thumbBtn.setAttribute("tooltip", "View Thumbnail");

          thumbBtn.append(
            (function createSvgIcon() {
              const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
              );
              svg.setAttribute("viewBox", "0 -10 21 40");
              svg.setAttribute("height", "100%");
              svg.setAttribute("width", "100%");

              const g = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              g.setAttribute("fill", "currentColor");

              const circle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle",
              );
              circle.setAttribute("cx", "8");
              circle.setAttribute("cy", "7.2");
              circle.setAttribute("r", "2");

              const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path.setAttribute("d", "M0 2v16h20V2H0z M18 16H2V4h16V16z");

              const polygon = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polygon",
              );
              polygon.setAttribute(
                "points",
                "17 10.9 14 7.9 9 12.9 6 9.9 3 12.9 3 15 17 15",
              );

              g.append(circle, path, polygon);
              svg.append(g);

              return svg;
            })(),
          );
          const thumbBtnClone = thumbBtn.cloneNode(true);

          thumbBtn.addEventListener("click", async () => {
            const videoId =
                NOVA.queryURL.get("v") || movie_player.getVideoData().video_id,
              thumbsSizes = ["maxres", "sd", "hq", "mq", ""];

            thumbBtn.textContent = "🕓";
            thumbBtn.cursor = "wait";
            for (const prefixSize of thumbsSizes) {
              const imgUrl = `https://i.ytimg.com/vi/${videoId}/${prefixSize}default.jpg`;
              try {
                const response = await fetch(imgUrl);

                if (response.status === 200) {
                  const imageBlob = await response.blob();
                  const img = new Image();
                  img.src = URL.createObjectURL(imageBlob);

                  img.addEventListener("load", () => {
                    NOVA.openPopup({
                      url: imgUrl,

                      width: img.width,
                      height: img.height,
                    });
                    URL.revokeObjectURL(img.src);
                  });
                  break;
                }
              } catch (err) {
                console.error("Error fetching or loading image:", err);
              } finally {
                thumbBtn.style.cursor = "";
                thumbBtn.textContent = "";
                thumbBtn.append(thumbBtnClone);
              }
            }
          });
          container.prepend(thumbBtn);
        }

        if (user_settings.player_buttons_custom_items?.includes("rotate")) {
          const hotkey =
              user_settings.player_buttons_custom_hotkey_rotate || "KeyR",
            rotateBtn = document.createElement("button");

          rotateBtn.classList.add("ytp-button", SELECTOR_BTN_CLASS_NAME);

          rotateBtn.setAttribute(
            "tooltip",
            `Rotate video (${hotkey.replace("Key", "")})`,
          );
          rotateBtn.style.cssText = "padding: 0 1.1em;";

          rotateBtn.append(
            (function createRotateIcon() {
              const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
              );
              svg.setAttribute("viewBox", "0 0 1536 1536");
              svg.setAttribute("height", "100%");
              svg.setAttribute("width", "100%");

              const g = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              g.setAttribute("fill", "currentColor");

              const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path.setAttribute(
                "d",
                "M1536 128v448q0 26-19 45t-45 19h-448q-42 0-59-40-17-39 14-69l138-138Q969 256 768 256q-104 0-198.5 40.5T406 406 296.5 569.5 256 768t40.5 198.5T406 1130t163.5 109.5T768 1280q119 0 225-52t179-147q7-10 23-12 14 0 25 9l137 138q9 8 9.5 20.5t-7.5 22.5q-109 132-264 204.5T768 1536q-156 0-298-61t-245-164-164-245T0 768t61-298 164-245T470 61 768 0q147 0 284.5 55.5T1297 212l130-129q29-31 70-14 39 17 39 59z",
              );

              g.append(path);
              svg.append(g);

              return svg;
            })(),
          );

          rotateBtn.addEventListener("click", rotateVideo);

          document.addEventListener("keyup", (evt) => {
            if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed")
              return;
            if (NOVA.editableFocused(evt.target)) return;
            if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey)
              return;

            if ((hotkey.length === 1 ? evt.key : evt.code) === hotkey) {
              rotateVideo();
            }
          });
          function rotateVideo() {
            let angle = getRotation();

            const scale =
              angle === 0 || angle === 180
                ? movie_player.clientHeight / NOVA.videoElement.clientWidth
                : 1;
            angle += 90;
            NOVA.videoElement.style.transform =
              angle === 360 ? "" : `rotate(${angle}deg) scale(${scale})`;

            function getRotation(
              element_transform = NOVA.videoElement.style.transform,
            ) {
              return (match = element_transform.match(
                /rotate\((-?\d+(\.\d+)?deg)\)/,
              ))
                ? parseFloat(match[1])
                : 0;
            }
          }
          container.prepend(rotateBtn);
        }

        if (
          user_settings.player_buttons_custom_items?.includes("aspect-ratio")
        ) {
          const aspectRatioBtn = document.createElement("a"),
            aspectRatioList = [
              { "16:9": "scaleX(1.3333)" },
              { "4:3": "scaleX(.75)" },
              { "9:16": "scaleX(1.777777778)" },

              { "21:9": "scaleY(.7168)" },

              { default: "scale(1)" },
            ],
            genTooltip = (key = 0) =>
              `next ${Object.keys(aspectRatioList[key])}`;

          aspectRatioBtn.classList.add("ytp-button", SELECTOR_BTN_CLASS_NAME);
          aspectRatioBtn.style.textAlign = "center";
          aspectRatioBtn.style.fontWeight = "bold";

          aspectRatioBtn.setAttribute("tooltip", genTooltip());
          aspectRatioBtn.textContent = "default";

          aspectRatioBtn.addEventListener("click", function () {
            if (!NOVA.videoElement) return;

            const getNextIdx = () =>
              (this.listIdx + 1 || 0) % aspectRatioList.length;

            this.listIdx = getNextIdx();

            NOVA.videoElement.style.transform = Object.values(
              aspectRatioList[this.listIdx],
            );

            aspectRatioBtn.setAttribute("tooltip", genTooltip(getNextIdx()));
            aspectRatioBtn.textContent = Object.keys(
              aspectRatioList[this.listIdx],
            );
          });
          container.prepend(aspectRatioBtn);
        }

        if (
          user_settings.player_buttons_custom_items?.includes("watch-later")
        ) {
          NOVA.waitSelector(".ytp-watch-later-button").then(
            (watchLaterDefault) => {
              NOVA.css.push(
                `.${SELECTOR_BTN_CLASS_NAME} .ytp-spinner-container {
                           position: relative;
                           top: 0;
                           left: 0;
                           scale: .5;
                           margin: 0;
                        }
                        .${SELECTOR_BTN_CLASS_NAME}.watch-later-btn svg {
                           scale: .85;
                        }`,
              );

              const watchLaterBtn = document.createElement("button");

              watchLaterBtn.classList.add(
                "ytp-button",
                SELECTOR_BTN_CLASS_NAME,
                "watch-later-btn",
              );

              watchLaterBtn.setAttribute("tooltip", "Watch later");
              renderIcon();
              watchLaterBtn.addEventListener("click", () => {
                watchLaterDefault.click();
                renderIcon();
                const waitStatus = setInterval(() => {
                  if (watchLaterDefault.querySelector("svg")) {
                    clearInterval(waitStatus);
                    renderIcon();
                  }
                }, 100);
              });

              [...document.getElementsByClassName(SELECTOR_BTN_CLASS_NAME)]
                .pop()
                ?.after(watchLaterBtn);

              function renderIcon() {
                if (
                  (watchLaterIconClone = watchLaterDefault
                    .querySelector(".ytp-spinner-container, svg")
                    ?.cloneNode(true))
                ) {
                  watchLaterBtn.textContent = "";
                  watchLaterBtn.append(watchLaterIconClone);
                }
              }
            },
          );
        }

        if (
          user_settings.player_buttons_custom_items?.includes("card-switch") &&
          !user_settings.player_hide_elements?.includes(
            "videowall_endscreen",
          ) &&
          !user_settings.player_hide_elements?.includes("card_endscreen")
        ) {
          const cardAttrName = "nova-hide-endscreen",
            cardBtn = document.createElement("button");

          NOVA.css.push(
            `#movie_player[${cardAttrName}] .videowall-endscreen,
                  #movie_player[${cardAttrName}] .ytp-pause-overlay,
                  #movie_player[${cardAttrName}] [class^="ytp-ce-"] {
                     display: none !important;
                  }`,
          );

          cardBtn.classList.add("ytp-button", SELECTOR_BTN_CLASS_NAME);

          cardBtn.innerHTML = NOVA.createSafeHTML(
            `<svg viewBox="0 0 1300 1000" height="100%" width="100%">
                     <g fill="currentColor" transform="translate(0.000000,511) scale(0.1,-0.1)">
                        <path d="M1419.5,3442.2c-23.7-11.9-53.4-47.5-63.3-81.1c-27.7-77.2-29.7-2423.3-2-2494.5c41.5-112.8,170.1-138.5,257.2-51.4c37.6,37.6,39.6,67.3,39.6,464.9v425.3h3966.3h3966.3V-85v-1790.3H6972.3H4359.1l-47.5-49.5c-59.3-59.3-63.3-126.6-7.9-195.8l39.6-51.4h2737.8h2737.8l39.6,51.4l41.5,53.4V631.2c0,2874.3,2,2787.3-89,2822.9C9751.6,3475.8,1466.9,3465.9,1419.5,3442.2z M9583.5,2575.7V2002H5617.2H1650.9v573.7v573.7h3966.3h3966.3V2575.7z" />

                        <path d="M6412.4,520.4C5967.3,374,5724-102.8,5864.5-553.8c94.9-310.6,346.2-530.2,676.5-591.5c306.6-55.4,650.8,87,842.7,348.2c41.6,57.4,45.5,57.4,67.3,21.8c98.9-168.1,348.2-328.4,573.7-369.9c255.2-47.5,559.8,49.5,745.8,235.4c346.2,346.2,340.2,898.1-11.9,1232.4c-156.3,146.4-330.3,221.6-542,231.4c-294.8,13.8-486.7-65.3-690.4-286.8c-65.3-71.2-118.7-120.7-118.7-108.8c0,11.9-45.5,69.2-100.9,130.6c-71.2,77.1-146.4,132.5-249.3,184c-136.5,67.3-166.1,75.2-340.2,79.1C6572.6,556,6499.5,550,6412.4,520.4z M6907,201.9c191.9-85.1,302.7-243.3,318.5-457c11.9-170.1-27.7-286.8-142.4-409.5c-100.9-110.8-207.7-164.2-352.1-176.1c-148.4-13.8-263.1,19.8-383.7,110.8c-247.3,187.9-286.8,551.9-85.1,783.4C6438.2,253.3,6669.6,306.7,6907,201.9z M8414.4,192c187.9-93,296.7-273,298.7-484.7c0-292.8-207.7-522.2-498.5-548c-320.4-29.7-593.5,215.6-593.5,534.1C7621.1,112.9,8044.4,379.9,8414.4,192z" />

                        <path d="M1680.6,360.1c-623.1-87-1141.4-462.9-1406.5-1020.8C147.5-925.7,100-1137.4,100-1449.9c0-215.6,9.9-288.8,53.4-449.1c91-336.3,255.2-611.3,500.5-848.6c168.1-160.2,276.9-233.4,486.6-334.3c271-128.6,435.2-164.2,767.5-164.2s496.5,35.6,767.5,164.2c209.7,100.9,318.5,174.1,486.6,334.3c245.3,237.4,421.4,538.1,508.4,872.4c63.3,237.4,63.3,611.3,2,858.5c-164.2,658.7-686.4,1183-1331.3,1337.3C2149.4,366.1,1848.7,383.9,1680.6,360.1z M2333.4,4.1c152.3-47.5,364-152.3,453-223.5c53.4-43.5,55.4-51.4,29.7-87.1c-49.5-69.2-2001.9-2142.4-2017.8-2142.4c-23.7,0-184,231.5-241.3,346.2c-182,364-199.8,834.8-47.5,1216.6c81.1,199.8,174.1,338.3,340.3,504.4c219.6,219.6,453,350.1,749.7,417.4C1777.5,75.3,2155.3,59.4,2333.4,4.1z M3150.4-593.4c160.2-233.4,241.3-476.7,255.2-767.5c15.8-286.8-25.7-482.7-156.3-751.7c-87-180-122.6-227.5-280.9-385.7c-144.4-144.4-215.6-197.8-360-273c-318.5-162.2-688.4-213.6-1022.7-140.5c-144.4,31.7-553.9,217.6-544,245.3c11.9,29.7,2017.8,2156.2,2033.6,2156.2C3085.1-510.3,3118.7-547.9,3150.4-593.4z" />
                     </g>
                  </svg>`,
          );

          if (user_settings.player_buttons_custom_card_switch) {
            switchState(movie_player.toggleAttribute(cardAttrName));
          }

          cardBtn.addEventListener("click", () =>
            switchState(movie_player.toggleAttribute(cardAttrName)),
          );

          function switchState(state = required()) {
            cardBtn.textContent = "";
            cardBtn.append(createSvgIcon(state));

            cardBtn.setAttribute(
              "tooltip",
              `The cards are currently ${state ? "hidden" : "showing"}`,
            );
          }

          function createSvgIcon(alt) {
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("viewBox", "-200 0 912 512");

            const g = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g",
            );
            g.setAttribute("fill", "currentColor");

            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            path.setAttribute(
              "d",
              alt
                ? "M 409 57.104 C 407.625 57.641, 390.907 73.653, 371.848 92.687 L 337.196 127.293 323.848 120.738 C 301.086 109.561, 283.832 103.994, 265.679 101.969 C 217.447 96.591, 148.112 134.037, 59.026 213.577 C 40.229 230.361, 4.759 265.510, 2.089 270 C -0.440 274.252, -0.674 281.777, 1.575 286.516 C 4.724 293.153, 67.054 352.112, 89.003 369.217 L 92.490 371.934 63.330 401.217 C 37.873 426.781, 34.079 430.988, 33.456 434.346 C 31.901 442.720, 38.176 452.474, 46.775 455.051 C 56.308 457.907, 41.359 471.974, 244.317 269.173 C 350.152 163.421, 429.960 82.914, 431.067 80.790 C 436.940 69.517, 428.155 55.840, 415.185 56.063 C 413.158 56.098, 410.375 56.566, 409 57.104 M 245.500 137.101 C 229.456 139.393, 201.143 151.606, 177.500 166.433 C 151.339 182.839, 120.778 206.171, 89.574 233.561 C 72.301 248.723, 42 277.649, 42 278.977 C 42 280.637, 88.281 323.114, 108.367 339.890 L 117.215 347.279 139.209 325.285 L 161.203 303.292 159.601 293.970 C 157.611 282.383, 157.570 272.724, 159.465 261.881 C 165.856 225.304, 193.011 195.349, 229.712 184.389 C 241.299 180.929, 261.648 179.996, 272.998 182.405 L 280.496 183.996 295.840 168.652 L 311.183 153.309 303.342 149.583 C 292.100 144.242, 277.007 139.186, 267.205 137.476 C 257.962 135.865, 254.565 135.806, 245.500 137.101 M 377.500 163.164 C 374.231 164.968, 369.928 169.297, 368.295 172.423 C 366.203 176.431, 366.351 184.093, 368.593 187.889 C 369.597 189.587, 375.944 195.270, 382.699 200.516 C 406.787 219.226, 444.129 252.203, 462.500 270.989 L 470.500 279.170 459 290.204 C 374.767 371.030, 302.827 418.200, 259.963 420.709 C 239.260 421.921, 213.738 412.918, 179.575 392.352 C 167.857 385.298, 166.164 384.571, 161.448 384.571 C 154.702 384.571, 149.091 388.115, 146.121 394.250 C 143.531 399.600, 143.472 403.260, 145.890 408.500 C 148.270 413.656, 150.468 415.571, 162 422.535 C 198.520 444.590, 230.555 455.992, 256 455.992 C 305.062 455.992, 376.663 414.097, 462 335.458 C 483.584 315.567, 509.652 289.051, 510.931 285.685 C 512.694 281.042, 512.218 273.876, 509.889 270 C 507.494 266.017, 484.252 242.741, 463.509 223.552 C 437.964 199.922, 398.967 167.566, 391.300 163.639 C 387.656 161.773, 380.470 161.526, 377.500 163.164 M 235.651 219.459 C 231.884 220.788, 226.369 223.351, 223.395 225.153 C 216.405 229.389, 206.759 239.019, 202.502 246.010 C 198.959 251.828, 193.677 266.197, 194.194 268.611 C 194.372 269.437, 205.637 258.890, 220.993 243.519 C 249.683 214.801, 249.910 214.427, 235.651 219.459 M 316.962 223.250 C 313.710 224.890, 311.876 226.720, 310.200 230 C 307.188 235.893, 307.781 240.006, 313.805 255 C 317.867 265.109, 318.470 267.589, 318.790 275.500 C 319.554 294.378, 313.786 309.236, 300.522 322.557 C 287.282 335.854, 274.164 341.408, 256 341.408 C 244.216 341.408, 238.392 340.027, 226.837 334.489 C 214.541 328.596, 204.996 330.563, 200.250 339.966 C 191.301 357.697, 210.339 372.220, 247.484 375.998 C 301.141 381.456, 350.063 339.760, 353.664 285.500 C 354.618 271.136, 351.039 249.928, 345.577 237.579 C 342.933 231.601, 337.061 224.600, 332.875 222.435 C 328.782 220.319, 322.095 220.661, 316.962 223.250"
                : `M 377.5 163.164 C 374.231 164.968 375.944 195.27 382.699 200.516 C 406.787 219.226 444.129 252.203 462.5 270.989 L 470.5 279.17 L 459 290.204 C 374.767 371.03 302.827 418.2 259.963 420.709 C 239.26 421.921 213.738 412.918 179.575 392.352 C 167.857 385.298 166.164 384.571 161.448 384.571 C 154.702 384.571 149.091 388.115 146.121 394.25 C 143.531 399.6 143.472 403.26 145.89 408.5 C 148.27 413.656 150.468 415.571 162 422.535 C 198.52 444.59 230.555 455.992 256 455.992 C 305.062 455.992 376.663 414.097 462 335.458 C 483.584 315.567 509.652 289.051 510.931 285.685 C 512.694 281.042 512.218 273.876 509.889 270 C 507.494 266.017 484.252 242.741 463.509 223.552 C 437.964 199.922 398.967 167.566 391.3 163.639 C 387.656 161.773 380.47 161.526 377.5 163.164 M 316.962 223.25 C 313.71 224.89 311.876 226.72 310.2 230 C 307.188 235.893 307.781 240.006 313.805 255 C 317.867 265.109 318.47 267.589 318.79 275.5 C 319.554 294.378 313.786 309.236 300.522 322.557 C 287.282 335.854 274.164 341.408 256 341.408 C 244.216 341.408 238.392 340.027 226.837 334.489 C 214.541 328.596 204.996 330.563 200.25 339.966 C 191.301 357.697 210.339 372.22 247.484 375.998 C 301.141 381.456 350.063 339.76 353.664 285.5 C 354.618 271.136 351.039 249.928 345.577 237.579 C 342.933 231.601 337.061 224.6 332.875 222.435 C 328.782 220.319 322.095 220.661 316.962 223.25`,
            );
            g.append(path);

            if (alt) {
              path.setAttribute("fill-rule", "evenodd");
            } else {
              const secondPath = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              secondPath.setAttribute(
                "d",
                "M 377.487 163.483 C 374.218 165.287 369.915 169.616 368.282 172.742 C 366.19 176.75 366.338 184.412 368.58 188.208 C 369.584 189.906 375.931 195.589 382.686 200.835 C 406.774 219.545 444.116 252.522 462.487 271.308 L 470.487 279.489 L 458.987 290.523 C 374.754 371.349 302.814 418.519 259.95 421.028 C 239.247 422.24 213.725 413.237 179.562 392.671 C 167.844 385.617 166.151 384.89 161.435 384.89 C 154.689 384.89 149.078 388.434 146.108 394.569 C 143.518 399.919 143.459 403.579 145.877 408.819 C 148.257 413.975 150.455 415.89 161.987 422.854 C 198.507 444.909 230.542 456.311 255.987 456.311 C 305.049 456.311 376.65 414.416 461.987 335.777 C 483.571 315.886 509.639 289.37 510.918 286.004 C 512.681 281.361 512.205 274.195 509.876 270.319 C 507.481 266.336 484.239 243.06 463.496 223.871 C 437.951 200.241 398.954 167.885 391.287 163.958 C 387.643 162.092 380.457 161.845 377.487 163.483 M 316.949 223.569 C 313.697 225.209 311.863 227.039 310.187 230.319 C 307.175 236.212 307.768 240.325 313.792 255.319 C 317.854 265.428 318.457 267.908 318.777 275.819 C 319.541 294.697 313.773 309.555 300.509 322.876 C 287.269 336.173 274.151 341.727 255.987 341.727 C 244.203 341.727 238.379 340.346 226.824 334.808 C 214.528 328.915 204.983 330.882 200.237 340.285 C 191.288 358.016 210.326 372.539 247.471 376.317 C 301.128 381.775 350.05 340.079 353.651 285.819 C 354.605 271.455 351.026 250.247 345.564 237.898 C 342.92 231.92 337.048 224.919 332.862 222.754 C 328.769 220.638 322.082 220.98 316.949 223.569",
              );
              secondPath.setAttribute(
                "transform",
                "matrix(-1, 0, 0, -1, 512.000305, 558.092285)",
              );
              g.append(secondPath);
            }

            svg.append(g);

            return svg;
          }

          container.prepend(cardBtn);
        }

        if (
          user_settings.player_buttons_custom_items?.includes("quick-quality")
        ) {
          const SELECTOR_QUALITY_CLASS_NAME = "nova-quick-quality",
            SELECTOR_QUALITY = "." + SELECTOR_QUALITY_CLASS_NAME,
            qualityContainerBtn = document.createElement("a"),
            SELECTOR_QUALITY_LIST_ID = SELECTOR_QUALITY_CLASS_NAME + "-list",
            SELECTOR_QUALITY_LIST = "#" + SELECTOR_QUALITY_LIST_ID,
            listQuality = document.createElement("ul"),
            SELECTOR_QUALITY_TITLE_ID = SELECTOR_QUALITY_CLASS_NAME + "-title",
            qualityLabelBtn = document.createElement("span"),
            qualityFormatList = {
              highres: { label: "4320p", badge: "8K" },
              hd2880: { label: "2880p", badge: "5K" },
              hd2160: { label: "2160p", badge: "4K" },
              hd1440: { label: "1440p", badge: "QHD" },
              hd1080: { label: "1080p", badge: "FHD" },

              hd720: { label: "720p", badge: "ᴴᴰ" },
              large: { label: "480p" },
              medium: { label: "360p" },
              small: { label: "240p" },
              tiny: { label: "144p" },
              auto: { label: "auto" },
            };

          NOVA.css.push(
            SELECTOR_QUALITY +
              ` {
                     overflow: visible !important;
                     position: relative;
                     text-align: center !important;
                     vertical-align: top;
                     font-weight: bold;
                  }

                  ${SELECTOR_QUALITY_LIST} {
                     position: absolute;
                     bottom: 2.5em !important;
                     left: -2.2em;
                     list-style: none;
                     padding-bottom: 1.5em !important;
                     z-index: ${1 + Math.max(NOVA.css.get(".ytp-progress-bar", "z-index"), 31)};
                  }


                  html[data-cast-api-enabled] ${SELECTOR_QUALITY_LIST} {
                     margin: 0;
                     padding: 0;
                     bottom: 3.3em;

                  }


                  .ytp-big-mode .ytp-menuitem-toggle-checkbox {
                     width: 3.5em;
                     height: 1.6em;
                  }

                  ${SELECTOR_QUALITY}:not(:hover) ${SELECTOR_QUALITY_LIST} {
                     display: none;
                  }

                  ${SELECTOR_QUALITY_LIST} li {
                     cursor: pointer;
                     white-space: nowrap;
                     line-height: 1.4;
                     background-color: rgba(28, 28, 28, 0.9);
                     margin: .3em 0;
                     padding: .5em 3em;
                     border-radius: .3em;
                     color: white;
                  }

                  ${SELECTOR_QUALITY_LIST} li .quality-menu-item-label-badge {
                     position: absolute;
                     right: 1em;
                     width: 1.7em;
                  }

                  ${SELECTOR_QUALITY_LIST} li.active { background-color: #720000; }
                  ${SELECTOR_QUALITY_LIST} li.disable { color: #666; }
                  ${SELECTOR_QUALITY_LIST} li:hover:not(.active) { background-color: #c00; }`,
          );

          qualityContainerBtn.classList.add(
            "ytp-button",
            SELECTOR_BTN_CLASS_NAME,
            SELECTOR_QUALITY_CLASS_NAME,
          );

          qualityLabelBtn.id = SELECTOR_QUALITY_TITLE_ID;

          qualityLabelBtn.textContent =
            qualityFormatList[movie_player.getPlaybackQuality()]?.label ||
            "[N/A]";

          listQuality.id = SELECTOR_QUALITY_LIST_ID;

          qualityContainerBtn.prepend(qualityLabelBtn);
          qualityContainerBtn.append(listQuality);

          container.prepend(qualityContainerBtn);

          fillQualityMenu();

          movie_player.addEventListener(
            "onPlaybackQualityChange",
            (quality) => {
              document.getElementById(SELECTOR_QUALITY_TITLE_ID).textContent =
                qualityFormatList[quality]?.label || "[N/A]";

              fillQualityMenu();
            },
          );

          function fillQualityMenu() {
            if (
              (qualityList = document.getElementById(SELECTOR_QUALITY_LIST_ID))
            ) {
              qualityList.textContent = "";

              movie_player.getAvailableQualityLevels().forEach((quality) => {
                const qualityItem = document.createElement("li");

                if ((qualityData = qualityFormatList[quality])) {
                  qualityItem.textContent = qualityData.label;
                  if ((badge = qualityData.badge)) {
                    const labelBadge = document.createElement("span");
                    labelBadge.className = "quality-menu-item-label-badge";
                    labelBadge.textContent = badge;
                    qualityItem.append(labelBadge);
                  }

                  if (movie_player.getPlaybackQuality() == quality) {
                    qualityItem.className = "active";
                  } else {
                    const maxWidth =
                      NOVA.currentPage == "watch" ||
                      (user_settings["embed-popup"] &&
                        NOVA.queryURL.has("popup"))
                        ? screen.width
                        : window.innerWidth;

                    if (
                      (NOVA.extractAsNum.int(qualityData.label) || 0) <=
                      maxWidth * 1.3
                    ) {
                      qualityItem.addEventListener(
                        "click",
                        () => {
                          movie_player.setPlaybackQualityRange(
                            quality,
                            quality,
                          );
                        },
                        { capture: true },
                      );
                    } else {
                      qualityItem.className = "disable";
                      qualityItem.title = "Max (window viewport + 30%)";
                    }
                  }

                  qualityList.append(qualityItem);
                }
              });
            }
          }
        }

        if (user_settings.player_buttons_custom_items?.includes("clock")) {
          const clockEl = document.createElement("span");
          clockEl.className = "ytp-time-display";

          clockEl.title = "Now time";

          container.prepend(clockEl);

          let clockInterval;

          if (user_settings.player_buttons_custom_clock_fullcreen) {
            document.addEventListener("fullscreenchange", () => {
              if (document.fullscreenElement) setIntervalClock();
              else {
                clearInterval(clockInterval);
                clockEl.textContent = "";
              }
            });
          } else setIntervalClock();

          function setIntervalClock() {
            clockInterval = setInterval(() => {
              if (
                document.visibilityState == "hidden" ||
                movie_player.classList.contains("ytp-autohide")
              ) {
                return;
              }

              const formatLength =
                user_settings.player_buttons_custom_clock_seconds ? 8 : 5;
              const time = new Date().toTimeString().slice(0, formatLength);
              clockEl.textContent = time;
            }, 1000);
          }
        }

        if (
          user_settings.player_buttons_custom_items?.includes("range-speed")
        ) {
          const speedSlider = document.createElement("input"),
            SELECTOR_RANGE_CLASS_NAME = "nova-range-speed-input",
            SELECTOR_RANGE = "." + SELECTOR_RANGE_CLASS_NAME;

          NOVA.css.push(
            `${SELECTOR_RANGE}[type="range"] {
                     height: 100%;
                  }`,
          );

          speedSlider.classList.add(
            SELECTOR_BTN_CLASS_NAME,
            SELECTOR_RANGE_CLASS_NAME,
          );
          speedSlider.title = "Playback Rate";
          speedSlider.type = "range";

          speedSlider.min = speedSlider.step = +user_settings.rate_step || 0.1;

          speedSlider.max = user_settings.range_speed_unlimit
            ? +user_settings.rate_default
            : 2;
          speedSlider.value = NOVA.videoElement.playbackRate;
          updateTitleForSpeedSlider(NOVA.videoElement.playbackRate);

          NOVA.videoElement.addEventListener("ratechange", function () {
            speedSlider.value = this.playbackRate;
            updateTitleForSpeedSlider(this.playbackRate);
          });

          speedSlider.addEventListener("change", ({ target }) =>
            playerRate(target.value),
          );
          speedSlider.addEventListener(
            "wheel",
            (evt) => {
              evt.preventDefault();
              const rate =
                NOVA.videoElement.playbackRate +
                speedSlider.step * Math.sign(evt.wheelDelta);
              playerRate(rate);
              speedSlider.value = rate;
            },
            { capture: true },
          );
          container.prepend(speedSlider);

          function playerRate(rate) {
            if (!user_settings.range_speed_unlimit && rate > 2) return;
            NOVA.videoElement.playbackRate = (+rate).toFixed(2);
            updateTitleForSpeedSlider(rate);
          }

          function updateTitleForSpeedSlider(rate) {
            speedSlider.title = `Speed (${rate})`;
            speedSlider.setAttribute("tooltip", `Speed (${rate})`);
          }
        }

        if (
          user_settings.player_buttons_custom_items?.includes("toggle-speed")
        ) {
          const speedBtn = document.createElement("a"),
            hotkey =
              user_settings.player_buttons_custom_hotkey_toggle_speed || "KeyA",
            defaultRateText = "1x",
            genTooltip = () =>
              `Switch to ${NOVA.videoElement.playbackRate}>${speedBtn.textContent} (${hotkey.replace("Key", "")})`;

          let rateOrig = {};

          speedBtn.classList.add("ytp-button", SELECTOR_BTN_CLASS_NAME);
          speedBtn.style.textAlign = "center";
          speedBtn.style.fontWeight = "bold";
          speedBtn.textContent = defaultRateText;

          speedBtn.setAttribute("tooltip", genTooltip());

          document.addEventListener("keyup", (evt) => {
            if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed")
              return;
            if (NOVA.editableFocused(evt.target)) return;
            if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey)
              return;

            if ((hotkey.length === 1 ? evt.key : evt.code) === hotkey) {
              switchRate();
            }
          });
          speedBtn.addEventListener("click", switchRate);
          NOVA.videoElement.addEventListener("ratechange", function () {
            speedBtn.setAttribute("tooltip", genTooltip());

            if (!user_settings["video-rate"]) {
              NOVA.showOSD({
                message: this.playbackRate + "x",
                ui_value: this.playbackRate,
                source: "rate",
              });
            }
          });

          function switchRate() {
            if (Object.keys(rateOrig).length) {
              playerRate.set(rateOrig);
              rateOrig = {};
              speedBtn.textContent = defaultRateText;
            } else {
              rateOrig =
                typeof movie_player === "object" &&
                NOVA.videoElement.playbackRate % 0.25 === 0 &&
                NOVA.videoElement.playbackRate <= 2
                  ? { default: movie_player.getPlaybackRate() }
                  : { html5: NOVA.videoElement.playbackRate };

              let resetRate = { ...rateOrig };
              resetRate[Object.keys(resetRate)[0]] = 1;
              playerRate.set(resetRate);

              speedBtn.textContent = rateOrig[Object.keys(rateOrig)[0]] + "x";
            }

            speedBtn.setAttribute("tooltip", genTooltip());
          }

          const playerRate = {
            set(obj) {
              if (
                obj.hasOwnProperty("html5") ||
                typeof movie_player !== "object" ||
                typeof movie_player.setPlaybackRate !== "function"
              ) {
                NOVA.videoElement.playbackRate = obj.html5;
              } else {
                movie_player.setPlaybackRate(obj.default);
              }
            },
          };

          container.prepend(speedBtn);

          visibilitySwitch();

          NOVA.videoElement?.addEventListener("ratechange", visibilitySwitch);

          NOVA.videoElement?.addEventListener("loadeddata", () => {
            rateOrig = {};
            speedBtn.textContent = defaultRateText;
            visibilitySwitch();
          });

          function visibilitySwitch() {
            if (!Object.keys(rateOrig).length) {
              speedBtn.style.display =
                NOVA.videoElement?.playbackRate === 1 ? "none" : "";
            }
          }
        }
      },
    );
  },
  options: {
    player_buttons_custom_items: {
      _tagName: "select",
      label: "Buttons",

      "label:pl": "Przyciski",

      title: "[Ctrl+Click] to select several",

      "title:pl": "Ctrl+kliknięcie, aby zaznaczyć kilka",

      multiple: null,
      required: true,
      size: 7,
      options: [
        {
          label: "clock",
          value: "clock",
        },
        {
          label: "quick quality",
          value: "quick-quality",

          "label:pl": "jakość",
        },
        {
          label: "range speed",
          value: "range-speed",
        },
        {
          label: "toggle speed",
          value: "toggle-speed",

          "label:pl": "szybkość",
        },
        {
          label: "card-switch",
          value: "card-switch",
        },
        {
          label: "screenshot",
          value: "screenshot",
        },
        {
          label: "picture-in-picture",
          value: "picture-in-picture",

          "label:pl": "obraz w obrazie",
        },
        {
          label: "popup",
          value: "popup",

          "label:pl": "w okienku",
        },
        {
          label: "rotate",
          value: "rotate",

          "label:pl": "obróć",
        },
        {
          label: "aspect-ratio",
          value: "aspect-ratio",
        },
        {
          label: "watch later",
          value: "watch-later",
        },
        {
          label: "preview cover",
          value: "thumbnail",

          "label:pl": "miniaturka",
        },
      ],
    },
    player_buttons_custom_autohide: {
      _tagName: "input",
      label: "Auto-hide (if not hovered)",

      type: "checkbox",

      "data-dependent": {
        player_buttons_custom_items: [
          "range-speed",

          "card-switch",
          "screenshot",
          "picture-in-picture",
          "popup",
          "rotate",
          "aspect-ratio",
          "watch-later",
          "thumbnail",
        ],
      },
    },

    player_buttons_custom_hotkey_toggle_speed: {
      _tagName: "select",
      label: "Speed switch hotkey",

      "label:pl": "Skrót przełączania prędkości",

      options: [
        { label: "none", value: false },

        { label: "A", value: "KeyA", selected: true },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
      "data-dependent": { player_buttons_custom_items: ["toggle-speed"] },
    },
    player_buttons_custom_hotkey_rotate: {
      _tagName: "select",
      label: "Hotkey rotate",

      options: [
        { label: "none", value: false },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR", selected: true },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
      "data-dependent": { player_buttons_custom_items: ["rotate"] },
    },
    player_buttons_custom_card_switch: {
      _tagName: "select",
      label: "Default card state",

      options: [
        {
          label: "show",
          value: false,
          selected: true,
        },
        {
          label: "hide",
          value: true,
        },
      ],
      "data-dependent": { player_buttons_custom_items: ["card-switch"] },
    },
    player_buttons_custom_screenshot_format: {
      _tagName: "select",
      label: "Screenshot out type",

      options: [
        {
          label: "png",
          value: "png",
          selected: true,
        },
        {
          label: "jpg",
          value: "jpg",
        },
        {
          label: "webp",
          value: "webp",
        },
        {
          label: "clipboard",
          value: "clipboard",
        },
        {
          label: "popup",
          value: "popup",
        },
      ],
      "data-dependent": { player_buttons_custom_items: ["screenshot"] },
    },
    player_buttons_custom_screenshot_size: {
      _tagName: "select",
      label: "Screenshot frame size from",

      options: [
        {
          label: "video",
          selected: true,
        },
        {
          label: "player",
          value: "player",
        },
      ],
      "data-dependent": { player_buttons_custom_items: ["screenshot"] },
    },
    player_buttons_custom_screenshot_subtitle: {
      _tagName: "input",
      label: "Add screenshot subtitle",

      type: "checkbox",

      "data-dependent": { player_buttons_custom_items: ["screenshot"] },
    },
    player_buttons_custom_screenshot_subtitle_color: {
      _tagName: "input",
      type: "color",
      value: "#ffffff",
      label: "Screenshot subtitle color",

      "data-dependent": { player_buttons_custom_screenshot_subtitle: true },
    },
    player_buttons_custom_screenshot_subtitle_shadow_color: {
      _tagName: "input",
      type: "color",
      value: "#000000",
      label: "Screenshot subtitle shadow color",

      "data-dependent": { player_buttons_custom_screenshot_subtitle: true },
    },

    range_speed_unlimit: {
      _tagName: "input",
      label: "Range speed unlimit",

      type: "checkbox",

      "data-dependent": { player_buttons_custom_items: ["range-speed"] },
    },
    range_speed_unlimit: {
      _tagName: "input",
      label: "Range speed unlimit",

      type: "checkbox",

      "data-dependent": { player_buttons_custom_items: ["range-speed"] },
    },
    player_buttons_custom_clock_seconds: {
      _tagName: "input",
      label: "Clock show seconds",

      type: "checkbox",

      "data-dependent": { player_buttons_custom_items: ["clock"] },
    },
    player_buttons_custom_clock_fullcreen: {
      _tagName: "input",
      label: "Clock only fullscreen",

      type: "checkbox",

      "data-dependent": { player_buttons_custom_items: ["clock"] },
    },
  },
});
window.nova_plugins.push({
  id: "player-progress-bar-color",
  title: "Player progress bar color",

  "title:pl": "Kolor paska postępu gracza",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",
  _runtime: (user_settings) => {
    if (user_settings.player_progress_bar_gradient) {
      NOVA.css.push(
        `.ytp-play-progress, .ytp-swatch-background-color {
               background: var(--yt-spec-static-brand-red, #f03) !important;
            }`,
      );
    } else if (user_settings.player_progress_bar_color) {
      NOVA.css.push(
        `.ytp-swatch-background-color {
               background-color: ${user_settings.player_progress_bar_color || "#f00"} !important;
            }`,
      );
    }
  },
  options: {
    player_progress_bar_color: {
      _tagName: "input",
      type: "color",

      value: "#0089ff",
      label: "Color",

      "label:pl": "Kolor",

      "data-dependent": { player_progress_bar_gradient: "!true" },
    },
    player_progress_bar_gradient: {
      _tagName: "input",

      label: "No gradient",

      type: "checkbox",
    },
  },
});

window.nova_plugins.push({
  id: "player-hide-elements",
  title: "Hide some player buttons/elements",

  "title:pl": "Ukryj niektóre przyciski/elementy odtwarzacza",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    const SELECTORS = {
      ambient: "#cinematics-container",

      videowall_endscreen: ".videowall-endscreen",
      card_endscreen: '[class^="ytp-ce-"]',

      watch_later_button:
        ".ytp-chrome-top-buttons button.ytp-watch-later-button",

      info_button: ".ytp-chrome-top-buttons button.ytp-cards-button",

      prev_button: ".ytp-chrome-bottom .ytp-prev-button",
      play_button: ".ytp-chrome-bottom .ytp-play-button",
      next_button: ".ytp-chrome-bottom .ytp-next-button",
      volume_area: ".ytp-chrome-bottom .ytp-volume-area",
      time_display:
        ".ytp-chrome-bottom .ytp-time-display" +
        (user_settings["time-remaining"] ? " span > span:not([id])" : ""),
      time_duration_display:
        ".ytp-chrome-bottom .ytp-time-duration, .ytp-chrome-bottom .ytp-time-separator",
      chapter_container: ".ytp-chrome-bottom .ytp-chapter-container",

      autonav_toggle_button:
        '.ytp-chrome-bottom button.ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"]',
      subtitles_button: ".ytp-chrome-bottom button.ytp-subtitles-button",
      settings_button: ".ytp-chrome-bottom button.ytp-settings-button",
      cast_button: ".ytp-chrome-bottom button.ytp-remote-button",
      size_button: ".ytp-chrome-bottom button.ytp-size-button",
      miniplayer_button: ".ytp-chrome-bottom button.ytp-miniplayer-button",
      logo_button: ".ytp-chrome-bottom .yt-uix-sessionlink",
      fullscreen_button: ".ytp-chrome-bottom button.ytp-fullscreen-button",

      brave_jump_button: ".ytp-chrome-bottom button.ytp-jump-button",
    };

    const SELECTOR_CONTAINER = "#movie_player";
    const toArray = (a) => (Array.isArray(a) ? a : [a]);

    let list = [];

    toArray(user_settings.player_hide_elements).forEach(
      (el) =>
        (data = SELECTORS[el]) && list.push(`${SELECTOR_CONTAINER} ${data}`),
    );

    if (list.length) {
      NOVA.css.push(
        list.join(",\n") +
          ` {
               display: none !important;
            }`,
      );
    }
  },
  options: {
    player_hide_elements: {
      _tagName: "select",
      label: "Items",

      title: "[Ctrl+Click] to select several",

      "title:pl": "Ctrl+kliknięcie, aby zaznaczyć kilka",

      multiple: null,
      required: true,
      size: 10,
      options: [
        {
          label: "ambient",
          value: "ambient",
        },
        {
          label: "videowall (thumbs)",
          value: "videowall_endscreen",
        },
        {
          label: "card",
          value: "card_endscreen",
        },
        {
          label: "watch-later",
          value: "watch_later_button",
        },
        {
          label: "info (embed)",
          value: "info_button",
        },
        {
          label: "prev",
          value: "prev_button",
        },
        {
          label: "play/stop live",
          value: "play_button",
        },
        {
          label: "next",
          value: "next_button",
        },
        {
          label: "jump (for Brave)",
          value: "brave_jump_button",

          title: "Seek backwards/forward 10 seconds",
        },
        {
          label: "volume",
          value: "volume_area",
        },
        {
          label: "time",
          value: "time_display",
        },
        {
          label: "time duration",
          value: "time_duration_display",
        },
        {
          label: "chapter",
          value: "chapter_container",
        },
        {
          label: "autoplay next",
          value: "autonav_toggle_button",
        },
        {
          label: "subtitles",
          value: "subtitles_button",
        },
        {
          label: "settings",
          value: "settings_button",
        },
        {
          label: "cast",
          value: "cast_button",
        },
        {
          label: "size",
          value: "size_button",
        },
        {
          label: "miniplayer",
          value: "miniplayer_button",
        },
        {
          label: "logo (embed)",
          value: "logo_button",
        },
        {
          label: "fullscreen",
          value: "fullscreen_button",
        },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "player-control-autohide",

  title: "Hide player control panel if not hovered",

  "title:pl": "Ukrywaj elementy w odtwarzaczu",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",
  desc: "Hover controls to display it",
  "desc:zh": "将鼠标悬停在它上面以显示它",
  "desc:ja": "カーソルを合わせると表示されます",

  "desc:pl": "Najedź, aby wyświetlić",

  "plugins-conflict": "player-control-below",
  _runtime: (user_settings) => {
    if (user_settings["player-control-below"]) return;

    let selectorHover, selectorGradientHide;

    switch (user_settings.player_control_autohide_container) {
      case "player":
        selectorHover =
          ".ytd-page-manager[video-id]:not([fullscreen]) #movie_player:hover .ytp-chrome-bottom";
        selectorGradientHide = "#movie_player:not(:hover) .ytp-gradient-bottom";

        NOVA.waitSelector("#ytd-player").then((movie_player) => {
          let waiting;

          movie_player.addEventListener("mouseover", function () {
            if (waiting) return;
            waiting = true;
            fixControlFreeze();
          });
          movie_player.addEventListener("mouseout", function () {
            clearInterval(fixControlFreeze.intervalId);
            waiting = false;
          });
        });

        break;

      default:
        selectorHover = ".ytp-chrome-bottom:hover";
        selectorGradientHide =
          "#movie_player:not(.ytp-progress-bar-hover) .ytp-gradient-bottom";

        break;
    }

    NOVA.css.push(
      `.ytp-chrome-bottom {
            opacity: 0;
         }
         ${selectorHover} {
            opacity: 1;
         }`,
    );

    NOVA.css.push(
      `${selectorGradientHide} {
            opacity: 0;
         }`,
    );

    if (user_settings.player_control_autohide_show_on_seek) {
      let timeoutId;

      document.addEventListener("seeked", ({ target }) => {
        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;

        if (
          (el = document.body.querySelector("#movie_player .ytp-chrome-bottom"))
        ) {
          clearTimeout(timeoutId);
          el.style.opacity = 1;
          timeoutId = setTimeout(
            () => el.style.removeProperty("opacity"),
            1500,
          );
        }
      });
    }

    function fixControlFreeze(ms = 2000) {
      if (typeof fixControlFreeze.intervalId === "number")
        clearTimeout(fixControlFreeze.intervalId);
      fixControlFreeze.intervalId = setInterval(() => {
        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;

        if (
          document.visibilityState == "visible" &&
          movie_player.classList.contains("playing-mode") &&
          !document.fullscreenElement
        ) {
          movie_player.wakeUpControls();
        }
      }, ms);
    }
  },
  options: {
    player_control_autohide_container: {
      _tagName: "select",
      label: "Hover container",

      options: [
        {
          label: "player",
          value: "player",
          selected: true,
        },
        {
          label: "control",
          value: "control",
        },
      ],
    },
    player_control_autohide_show_on_seek: {
      _tagName: "input",
      label: "Show on seeked",

      type: "checkbox",
    },
  },
});

window.nova_plugins.push({
  id: "player-live-duration",
  title: "Show duration on live video",

  "title:pl": "Pokaż czas trwania wideo na żywo",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    NOVA.waitSelector("#movie_player video").then((video) => {
      video.addEventListener("canplay", () => {
        if (
          movie_player.getVideoData().isLive &&
          (el = document.body.querySelector(
            "#movie_player .ytp-chrome-controls .ytp-live .ytp-time-current",
          ))
        ) {
          el.style.cssText = "display: block !important; margin-right: 5px;";
        }
      });

      NOVA.css.push(
        `#movie_player .ytp-chrome-controls .ytp-time-display.ytp-live {
                  display: flex !important;
               }`,
      );
    });
  },
});

window.nova_plugins.push({
  id: "time-jump",
  title: "Jump time/chapter",

  "title:pl": "Skok czasowy",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",
  desc: "Use to skip the intro or ad inserts",
  "desc:zh": "用于跳过介绍或广告插入",
  "desc:ja": "イントロや広告挿入をスキップするために使用します",

  "desc:pl": "Służy do pomijania wstępu lub wstawek reklamowych",

  _runtime: (user_settings) => {
    if (user_settings.time_jump_title_offset) addTitleOffset();

    NOVA.waitSelector("#movie_player video").then((video) => {
      let chapterList;

      video.addEventListener("loadeddata", () => (chapterList = []));

      doubleKeyPressListener(timeLeap, user_settings.time_jump_hotkey);

      function timeLeap() {
        if (
          movie_player.getVideoData().isLive ||
          (NOVA.currentPage == "embed" && document.URL.includes("live_stream"))
        )
          return;

        if (chapterList !== null && !chapterList?.length) {
          chapterList = NOVA.getChapterList(movie_player.getDuration()) || null;
        }
        const currentTime = movie_player.getCurrentTime(),
          nextChapterIndex = chapterList?.findIndex((c) => c.sec > currentTime),
          separator = " • ";

        let msg;

        if (chapterList?.length && nextChapterIndex !== -1) {
          const nextChapterData = chapterList?.find(
            ({ sec }) => sec >= currentTime,
          );

          seekTime(nextChapterData.sec + 0.5);

          msg = nextChapterData.title + separator + nextChapterData.time;
        } else {
          seekTime(+user_settings.time_jump_step + currentTime);

          msg =
            `+${user_settings.time_jump_step} sec` +
            separator +
            NOVA.formatTime.HMS.digit(currentTime);
        }

        NOVA.showOSD({
          message: msg,
          source: "time-jump",
        });
      }

      function seekTime(sec) {
        if (typeof movie_player.seekBy === "function") {
          movie_player.seekTo(sec);
        } else if (NOVA.videoElement) {
          NOVA.videoElement.currentTime = sec;
        } else {
          const errorText = '[time-jump] > "seekTime" detect player error';
          console.error(errorText);
          throw errorText;
        }
      }
    });

    function addTitleOffset() {
      NOVA.css.push(
        `.ytp-tooltip-text:after {
               content: attr(data-before);
               color: #ffcc00;
            }`,
      );

      NOVA.waitSelector(".ytp-progress-bar").then((progressContainer) => {
        if ((tooltipEl = document.body.querySelector(".ytp-tooltip-text"))) {
          progressContainer.addEventListener("mousemove", () => {
            if (
              movie_player.getVideoData().isLive ||
              (NOVA.currentPage == "embed" &&
                document.URL.includes("live_stream"))
            )
              return;

            const cursorTime = NOVA.formatTime.hmsToSec(tooltipEl.textContent),
              offsetTime = cursorTime - NOVA.videoElement?.currentTime,
              sign =
                offsetTime >= 1 ? "+" : Math.sign(offsetTime) === -1 ? "-" : "";

            tooltipEl.setAttribute(
              "data-before",
              ` ${sign + NOVA.formatTime.HMS.digit(offsetTime)}`,
            );
          });

          progressContainer.addEventListener("mouseleave", () =>
            tooltipEl.removeAttribute("data-before"),
          );
        }
      });
    }

    function doubleKeyPressListener(
      callback = required(),
      keyNameFilter = required(),
    ) {
      let pressed,
        isDoublePress,
        lastWhich,
        lastPressed = keyNameFilter;

      document.addEventListener("keyup", keyPress);

      function keyPress(evt) {
        if (NOVA.editableFocused(evt.target)) return;

        pressed =
          keyNameFilter.length === 1 ||
          ["Control", "Shift"].includes(keyNameFilter)
            ? evt.key
            : evt.code;

        if (
          isDoublePress &&
          lastWhich === evt.which &&
          pressed === lastPressed
        ) {
          isDoublePress = false;
          if (callback && typeof callback === "function") return callback(evt);
        } else {
          isDoublePress = true;
          setTimeout(() => (isDoublePress = false), 500);
        }

        if (!keyNameFilter) lastPressed = pressed;
        lastWhich = evt.which;
      }
    }

    if (user_settings["save-channel-state"]) {
      NOVA.waitSelector("#movie_player video").then((video) => {
        NOVA.runOnPageLoad(async () => {
          const CACHE_PREFIX = "nova-resume-playback-time",
            getCacheName = () =>
              CACHE_PREFIX +
              ":" +
              (NOVA.queryURL.get("v") || movie_player.getVideoData().video_id);

          if (
            (NOVA.currentPage == "watch" || NOVA.currentPage == "embed") &&
            (!window?.sessionStorage ||
              !+sessionStorage.getItem(getCacheName())) &&
            !NOVA.queryURL.has("t") &&
            !NOVA.queryURL.getFromHash("t") &&
            (customSeek = await NOVA.storage_obj_manager.getParam("skip-into"))
          ) {
            video.addEventListener(
              "playing",
              timeLeapInto.apply(video, [customSeek]),
              { capture: true, once: true },
            );
          }
        });
      });
    } else if (
      +user_settings.skip_into_sec &&
      !NOVA.queryURL.has("t") &&
      !NOVA.queryURL.getFromHash("t")
    ) {
      NOVA.waitSelector("#movie_player video").then((video) => {
        NOVA.runOnPageLoad(() => {
          if (NOVA.currentPage == "watch") {
            video.addEventListener(
              "playing",
              timeLeapInto.bind(video, user_settings.skip_into_sec),
              { capture: true, once: true },
            );
          }
        });
      });
    }

    function timeLeapInto(time_seek = 10) {
      if (!time_seek && !user_settings.skip_into_sec_in_music && NOVA.isMusic())
        return;

      const CACHE_PREFIX = "resume-playback-time",
        getCacheName = () =>
          CACHE_PREFIX +
          ":" +
          (NOVA.queryURL.get("v") || movie_player.getVideoData().video_id);

      if (
        user_settings["player-resume-playback"] &&
        (!window?.sessionStorage ||
          (saveTime = +sessionStorage.getItem(getCacheName()))) &&
        saveTime > this.duration - 3
      )
        return;

      if (
        (isNaN(this.duration) || this.duration > 30) &&
        this.currentTime < +time_seek
      ) {
        this.currentTime = +time_seek;
      }
    }
  },
  options: {
    time_jump_step: {
      _tagName: "input",
      label: "Step time",

      "label:pl": "Krok czasowy",

      type: "number",

      title: "In seconds",
      placeholder: "sec",
      min: 3,
      max: 300,
      value: 30,
    },
    time_jump_hotkey: {
      _tagName: "select",
      label: "Hotkey (double click)",

      "label:pl": "Klawisz skrótu (podwójne kliknięcie)",

      title: "by default【Ctrl + Arrows】",

      options: [
        { label: "Shift (any)", value: "Shift" },
        { label: "ShiftL", value: "ShiftLeft" },
        { label: "ShiftR", value: "ShiftRight" },
        { label: "Ctrl (any)", value: "Control" },
        { label: "CtrlL", value: "ControlLeft" },
        { label: "CtrlR", value: "ControlRight", selected: true },

        { label: "AltL", value: "AltLeft" },
        { label: "AltR", value: "AltRight" },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
    },
    time_jump_title_offset: {
      _tagName: "input",
      label: "Show time offset on progress bar",

      "label:pl": "Pokaż przesunięcie czasu na pasku postępu",

      type: "checkbox",

      title: "Time offset from current playback time",

      "title:pl": "Przesunięcie czasu względem bieżącego czasu odtwarzania",
    },

    skip_into_sec: {
      _tagName: "input",
      label: "Start playback at",

      "label:pl": "Ustaw czas rozpoczęcia",

      type: "number",

      title: "in sec / 0 - disable",

      placeholder: "1-30",
      step: 1,
      min: 0,
      max: 30,
      value: 0,
    },
    skip_into_sec_in_music: {
      _tagName: "input",
      label: "Apply for music genre",

      type: "checkbox",

      "data-dependent": { skip_into_sec: "!0" },
    },
  },
});
window.nova_plugins.push({
  id: "save-channel-state",

  title: 'Add button "Save params for the channel"',

  "title:pl": "Zapisz dla określonego kanału",

  run_on_pages: "watch, embed",
  section: "player-control",

  _runtime: (user_settings) => {
    if (!window?.localStorage) return;

    const SELECTOR_BTN_ID = "nova-channels-state",
      SELECTOR_BTN = "#" + SELECTOR_BTN_ID,
      SELECTOR_BTN_CLASS_NAME = "nova-right-custom-button",
      SELECTOR_BTN_LIST_ID = SELECTOR_BTN_CLASS_NAME + "-list",
      SELECTOR_BTN_LIST = "#" + SELECTOR_BTN_LIST_ID,
      SELECTOR_BTN_TITLE_ID = SELECTOR_BTN_CLASS_NAME + "-title";

    NOVA.waitSelector("#movie_player .ytp-right-controls").then((container) => {
      initStyles();

      NOVA.runOnPageLoad(async () => {
        if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed") return;

        await NOVA.storage_obj_manager.initStorage();

        if ((btn = document.getElementById(SELECTOR_BTN_ID))) {
          btn.append(genList());
        } else {
          const btn = document.createElement("button");
          btn.id = SELECTOR_BTN_ID;
          btn.classList.add("ytp-button");

          if (
            !user_settings.player_buttons_custom_autohide ||
            (user_settings.player_buttons_custom_autohide &&
              !Boolean(NOVA.storage_obj_manager.read()))
          ) {
            btn.classList.add(SELECTOR_BTN_CLASS_NAME);
          }

          btn.title = "Save channel state";

          const btnTitle = document.createElement("span");
          btnTitle.id = SELECTOR_BTN_TITLE_ID;
          btnTitle.style.display = "flex";

          btnTitle.append(
            (function createSvgIcon() {
              const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
              );
              svg.setAttribute("width", "100%");
              svg.setAttribute("height", "100%");
              svg.setAttribute("viewBox", "0 0 36 36");

              const g = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              g.setAttribute("fill", "currentColor");

              const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              path.setAttribute(
                "d",
                "M23.4 24.2c-.3.8-1.1 1.4-2 1.4-.9 0-1.7-.6-2-1.4H9.3c-.3 0-.6-.3-.6-.6v-.3c0-.3.3-.6.6-.6h10.1c.3-.9 1.1-1.5 2.1-1.5s1.8.6 2.1 1.5h3.2c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6h-3.4zm-7.7-5.3c-.3.9-1.1 1.5-2.1 1.5s-1.8-.6-2.1-1.5H9.3c-.3 0-.6-.3-.6-.6V18c0-.3.3-.6.6-.6h2.2c.3-.8 1.1-1.4 2.1-1.4s1.8.6 2.1 1.4h11.1c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6H15.7zm7.9-5.4c-.3.8-1.1 1.4-2.1 1.4-.9 0-1.7-.6-2.1-1.4H9.3c-.3 0-.6-.3-.6-.6v-.3c0-.3.3-.6.6-.6h10.1c.3-.9 1.1-1.6 2.1-1.6s1.9.7 2.1 1.6h3.1c.3 0 .6.3.6.6v.3c0 .3-.3.6-.6.6h-3.1z",
              );

              g.append(path);
              svg.append(g);

              return svg;
            })(),
          );

          btn.append(btnTitle, genList());

          container.prepend(btn);
        }
        btnTitleStateUpdate(Boolean(NOVA.storage_obj_manager.read()));
      });
    });

    function btnTitleStateUpdate(state) {
      document
        .getElementById(SELECTOR_BTN_TITLE_ID)

        ?.style.setProperty("opacity", state ? 1 : 0.3);
    }

    function genList() {
      const ul = document.createElement("ul");
      ul.id = SELECTOR_BTN_LIST_ID;

      let listItem = [];

      listItem.push({
        name: "subtitles",

        get_current_state: () => {
          movie_player.toggleSubtitlesOn();
          return true;
        },
        custom_apply: () => {
          document.addEventListener(
            "playing",
            () => {
              if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed")
                return;

              movie_player.toggleSubtitlesOn();
            },
            { capture: true, once: true },
          );
        },
      });

      if (user_settings["video-quality"]) {
        listItem.push({
          name: "quality",
          get_current_state: movie_player.getPlaybackQuality,
        });
      }
      if (user_settings["video-rate"]) {
        listItem.push({
          name: "speed",
          get_current_state: () => {
            localStorage.removeItem(
              NOVA.storage_obj_manager.STORAGE_NAME_SPEED,
            );
            return NOVA.videoElement.playbackRate;
          },
        });
      }
      if (user_settings["video-volume"]) {
        listItem.push({
          name: "volume",
          get_current_state: () => Math.round(movie_player.getVolume()),
        });
      }
      if (user_settings["player-resume-playback"]) {
        listItem.push({
          name: "ignore-playback",
          label: "unsave playback time",
        });
      }
      if (user_settings["player-loop"]) {
        listItem.push({ name: "loop" });
      }
      if (user_settings["transcript"]) {
        listItem.push({ name: "transcript" });
      }
      if (user_settings["video-zoom"]) {
        listItem.push({
          name: "zoom",
          get_current_state: () =>
            NOVA.extractAsNum.float(
              document.body.querySelector(".html5-video-container")?.style
                .transform,
            ),
        });
      }

      listItem.forEach(async (el) => {
        const storage = NOVA.storage_obj_manager._getParam(el.name);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-${el.name}`;
        checkbox.checked = Boolean(storage);
        checkbox.className = "ytp-menuitem-toggle-checkbox";

        const li = document.createElement("li");
        li.innerHTML = NOVA.createSafeHTML(
          `<label for="checkbox-${el.name}">
                  ${el.label || el.name} <span>${(el.hasOwnProperty("get_current_state") && storage) || ""}</span>
               </label>`,
        );

        li.title = storage ? `Currently stored value ${storage}` : "none";

        if (
          Boolean(storage) &&
          el.hasOwnProperty("custom_apply") &&
          typeof el.custom_apply === "function"
        ) {
          el.custom_apply();
        }

        checkbox.addEventListener("change", () => {
          let state;

          if (
            checkbox.checked &&
            (state = el.hasOwnProperty("get_current_state")
              ? el.get_current_state()
              : true)
          ) {
            NOVA.storage_obj_manager.save({ [el.name]: state });
          } else {
            NOVA.storage_obj_manager.remove(el.name);
          }

          li.title = state ? `Currently stored value "${state}"` : "none";
          if (el.hasOwnProperty("get_current_state"))
            li.querySelector("span").textContent = state || "";
          btnTitleStateUpdate(Boolean(state));
        });

        li.prepend(checkbox);
        ul.append(li);
      });

      if (user_settings["time-jump"]) {
        const SLIDER_LABEL = "skip into",
          SLIDER_STORAGE_NAME = "skip-into",
          storage = +NOVA.storage_obj_manager._getParam(SLIDER_STORAGE_NAME);

        const slider = document.createElement("input");

        slider.type = "range";
        slider.min = 0;
        slider.max = 120;
        slider.step = 1;
        slider.value = storage || 0;

        const li = document.createElement("li");

        const label = document.createElement("label");
        label.append(document.createTextNode(SLIDER_LABEL));
        label.setAttribute("for", `checkbox-${SLIDER_STORAGE_NAME}`);

        const span = document.createElement("span");
        if (storage) span.textContent = storage;
        label.append(span);

        li.append(label);

        li.title = "Simple alternative SponsorBlock";

        slider.addEventListener("change", sliderChange);
        slider.addEventListener("input", sliderChange);
        slider.addEventListener("wheel", (evt) => {
          evt.preventDefault();
          evt.target.value = +evt.target.value + Math.sign(evt.wheelDelta);
          sliderChange(evt);
        });

        li.prepend(slider);
        ul.append(li);

        function sliderChange({ target }) {
          if ((state = +target.value)) {
            NOVA.storage_obj_manager.save({
              [SLIDER_STORAGE_NAME]: +target.value,
            });
          } else {
            NOVA.storage_obj_manager.remove(SLIDER_STORAGE_NAME);
          }

          li.title = state ? `Currently stored value ${state}` : "none";
          li.querySelector("span").textContent = state || "";
          btnTitleStateUpdate(Boolean(state));
        }
      }

      return ul;
    }

    function initStyles() {
      NOVA.css.push(
        SELECTOR_BTN +
          ` {
               overflow: visible !important;
               position: relative;
               text-align: center !important;
               vertical-align: top;
               font-weight: bold;
            }

            .ytp-left-controls {
               overflow: visible !important;
            }

            ${SELECTOR_BTN_LIST} {
               position: absolute;
               bottom: 2.5em !important;
               left: -2.2em;
               list-style: none;
               padding-bottom: 1.5em !important;
               z-index: calc(${+NOVA.css.get(".ytp-progress-bar", "z-index")} + 1);
            }


            html[data-cast-api-enabled] ${SELECTOR_BTN_LIST} {
               margin: 0;
               padding: 0;
               bottom: 3.3em;

            }

            ${SELECTOR_BTN}:not(:hover) ${SELECTOR_BTN_LIST} {
               display: none;
            }


            ${SELECTOR_BTN_LIST} li {
               cursor: pointer;
               white-space: nowrap;
               line-height: 1.4;
               background-color: rgba(28, 28, 28, .9);
               margin: .3em 0;
               padding: .5em 1em;
               border-radius: .3em;
               color: white;
               text-align: left !important;
               display: grid;
               grid-template-columns: auto auto;
               align-items: center;
               justify-content: start;
            }

            ${SELECTOR_BTN_LIST} li label {
               cursor: pointer;
               padding-left: 5px;
            }

            ${SELECTOR_BTN_LIST} li.active { background-color: #720000; }
            ${SELECTOR_BTN_LIST} li.disable { color: #666; }
            ${SELECTOR_BTN_LIST} li:not(:hover) { opacity: .8; }

            ${SELECTOR_BTN_LIST} li span:not(:empty):before { content: '('; }
            ${SELECTOR_BTN_LIST} li span:not(:empty):after { content: ')'; }


            ${SELECTOR_BTN_LIST} [type="checkbox"] {
               appearance: none;
               outline: none;
               cursor: pointer;
            }

            ${SELECTOR_BTN_LIST} [type="checkbox"]:checked {
               background-color: #f00;
            }

            ${SELECTOR_BTN_LIST} [type="checkbox"]:checked:after {
               left: 20px;
               background-color: white;
            }`,
      );
    }
  },
});

window.nova_plugins.push({
  id: "player-loop",
  title: "Add repeat (loop) playback button",

  "title:pl": "Dodaj przycisk odtwarzania pętli",

  run_on_pages: "watch, embed, -mobile",
  section: "player-control",

  _runtime: (user_settings) => {
    NOVA.waitSelector("#movie_player .ytp-left-controls .ytp-play-button").then(
      (container) => {
        const SELECTOR_CLASS = "nova-right-custom-button",
          btn = document.createElement("button");

        btn.classList.add("ytp-button", SELECTOR_CLASS);
        btn.style.opacity = 0.5;
        btn.style.minWidth = getComputedStyle(container).width || "48px";

        btn.title = "Repeat";

        btn.append(
          (function createSvgIcon() {
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("height", "100%");
            svg.setAttribute("width", "100%");
            svg.setAttribute("viewBox", "-6 -6 36 36");

            const g = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g",
            );
            g.setAttribute("fill", "currentColor");

            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            path.setAttribute(
              "d",
              "M 7 7 L 17 7 L 17 10 L 21 6 L 17 2 L 17 5 L 5 5 L 5 11 L 7 11 L 7 7 Z M 7.06 17 L 7 14 L 3 18 L 7 22 L 7 19 L 19 19 L 19 13 L 17 13 L 17 17 L 7.06 17 Z",
            );

            g.append(path);
            svg.append(g);

            return svg;
          })(),
        );

        btn.addEventListener("click", toggleLoop);

        container.after(btn);

        NOVA.waitSelector("#movie_player video").then((video) => {
          video.addEventListener("loadeddata", ({ target }) => {
            if (movie_player.classList.contains("ad-showing")) return;

            if (btn.style.opacity == 1 && !target.loop) target.loop = true;

            if (target.loop) btn.style.opacity = 1;
          });
        });

        if (user_settings.player_loop_hotkey) {
          const hotkey = user_settings.player_loop_hotkey;

          document.addEventListener("keyup", (evt) => {
            if (NOVA.currentPage != "watch" && NOVA.currentPage != "embed")
              return;
            if (NOVA.editableFocused(evt.target)) return;
            if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey)
              return;

            if ((hotkey.length === 1 ? evt.key : evt.code) === hotkey) {
              toggleLoop();
            }
          });
        }

        function toggleLoop() {
          if (!NOVA.videoElement)
            return console.error(
              "btn > videoElement empty:",
              NOVA.videoElement,
            );

          NOVA.videoElement.loop = !NOVA.videoElement.loop;
          btn.style.opacity = NOVA.videoElement.loop ? 1 : 0.5;
          NOVA.showOSD({
            message: `Loop is ${Boolean(NOVA.videoElement.loop)}`,
            source: "loop",
          });
        }
      },
    );
  },
  options: {
    player_loop_hotkey: {
      _tagName: "select",
      label: "Hotkey",

      options: [
        { label: "none" },

        { label: "A", value: "KeyA" },
        { label: "B", value: "KeyB" },
        { label: "C", value: "KeyC" },
        { label: "D", value: "KeyD" },
        { label: "E", value: "KeyE" },
        { label: "F", value: "KeyF" },
        { label: "G", value: "KeyG" },
        { label: "H", value: "KeyH" },
        { label: "I", value: "KeyI" },
        { label: "J", value: "KeyJ" },
        { label: "K", value: "KeyK" },
        { label: "L", value: "KeyL" },
        { label: "M", value: "KeyM" },
        { label: "N", value: "KeyN" },
        { label: "O", value: "KeyO" },
        { label: "P", value: "KeyP" },
        { label: "Q", value: "KeyQ" },
        { label: "R", value: "KeyR" },
        { label: "S", value: "KeyS" },
        { label: "T", value: "KeyT" },
        { label: "U", value: "KeyU" },
        { label: "V", value: "KeyV" },
        { label: "W", value: "KeyW" },
        { label: "X", value: "KeyX" },
        { label: "Y", value: "KeyY" },
        { label: "Z", value: "KeyZ" },
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        "]",
        "[",
        "+",
        "-",
        ",",
        ".",
        "/",
        "<",
        ";",
        "\\",
      ],
    },
  },
});

window.nova_plugins.push({
  id: "playlist-duration",
  title: "Show playlist duration",

  "title:pl": "Pokaż czas trwania playlisty",

  run_on_pages: "watch, playlist, -mobile",
  restart_on_location_change: true,
  section: "playlist",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-playlist-duration",
      playlistId = NOVA.queryURL.get("list");

    if (!playlistId) return;

    switch (NOVA.currentPage) {
      case "playlist":
        NOVA.waitSelector("#owner-text a").then((el) => {
          if ((duration = getPlaylistDuration())) {
            insertToHTML({ container: el, text: duration });
          } else {
            getPlaylistDurationFromThumbnails(
              "#primary #thumbnail #overlays #text:not(:empty)",
            )?.then((duration) =>
              insertToHTML({ container: el, text: duration }),
            );
          }

          function getPlaylistDuration() {
            const vids_list =
              (
                document.body.querySelector("ytd-app")?.data?.response ||
                window.ytInitialData
              ).contents.twoColumnBrowseResultsRenderer?.tabs[0].tabRenderer
                ?.content?.sectionListRenderer?.contents[0].itemSectionRenderer
                ?.contents[0].playlistVideoListRenderer?.contents ||
              document.body.querySelector(".ytd-page-manager[video-id]")?.__data
                .playlistData?.contents ||
              document.body.querySelector(".ytd-page-manager[video-id]")?.data
                ?.playlist?.playlist?.contents;

            const duration = vids_list?.reduce(
              (acc, vid) =>
                acc + (+vid.playlistVideoRenderer?.lengthSeconds || 0),
              0,
            );

            if (duration) {
              return outFormat(duration);
            }
          }
        });
        break;

      case "watch":
        NOVA.waitSelector(
          "#page-manager #playlist .index-message-wrapper:not([hidden])",
          { destroy_after_page_leaving: true },
        ).then((el) => {
          const waitPlaylist = setInterval(() => {
            const playlistLength = movie_player.getPlaylist()?.length,
              playlistList = document.body
                .querySelector("yt-playlist-manager")
                ?.currentPlaylistData_?.contents.filter(
                  (e) => e.playlistPanelVideoRenderer?.lengthText?.simpleText,
                )
                .map((e) =>
                  NOVA.formatTime.hmsToSec(
                    e.playlistPanelVideoRenderer.lengthText.simpleText,
                  ),
                );

            console.assert(
              playlistList?.length === playlistLength,
              "playlist loading:",
              playlistList?.length + "/" + playlistLength,
            );

            if (playlistLength && playlistList?.length === playlistLength) {
              clearInterval(waitPlaylist);

              if ((duration = getPlaylistDuration(playlistList))) {
                insertToHTML({ container: el, text: duration });

                NOVA.waitSelector("#movie_player video", {
                  destroy_after_page_leaving: true,
                }).then((video) => {
                  video.addEventListener("ratechange", () => {
                    insertToHTML({
                      container: el,
                      text: getPlaylistDuration(playlistList),
                    });
                  });
                });
              } else if (!user_settings.playlist_duration_progress_type) {
                getPlaylistDurationFromThumbnails(
                  "#playlist #playlist-items #unplayableText[hidden]",
                )?.then((duration) =>
                  insertToHTML({ container: el, text: duration }),
                );
              }
            }
          }, 2000);

          function getPlaylistDuration(total_list) {
            const currentIdx = movie_player.getPlaylistIndex();

            let elapsedList = [...total_list];

            switch (user_settings.playlist_duration_progress_type) {
              case "done":
                elapsedList.splice(currentIdx);

                break;

              case "left":
                elapsedList.splice(0, currentIdx);

                break;
            }
            const sumArr = (arr) => arr.reduce((acc, time) => acc + +time, 0);
            return outFormat(
              sumArr(elapsedList),
              user_settings.playlist_duration_percentage
                ? sumArr(total_list)
                : false,
            );
          }
        });
        break;
    }

    function getPlaylistDurationFromThumbnails(items_selector = required()) {
      if (container && !(container instanceof HTMLElement)) {
        return console.error("container not HTMLElement:", container);
      }

      return new Promise((resolve) => {
        let forcePlaylistRun = false;
        const waitThumbnails = setInterval(() => {
          const timeStampList = document.body.querySelectorAll(items_selector),
            playlistLength =
              movie_player.getPlaylist()?.length ||
              document.body.querySelector("ytd-player")?.player_?.getPlaylist()
                ?.length ||
              timeStampList.length,
            duration = getTotalTime(timeStampList);

          console.assert(
            timeStampList.length === playlistLength,
            "playlist loading:",
            timeStampList.length + "/" + playlistLength,
          );

          if (
            +duration &&
            timeStampList.length &&
            (timeStampList.length === playlistLength || forcePlaylistRun)
          ) {
            clearInterval(waitThumbnails);
            resolve(outFormat(duration));
          } else if (!forcePlaylistRun) {
            setTimeout(() => (forcePlaylistRun = true), 1000 * 3);
          }
        }, 500);
      });

      function getTotalTime(nodes) {
        const arr = [...nodes]
          .map((e) => NOVA.formatTime.hmsToSec(e.textContent))
          .filter(Number);

        return arr.length && arr.reduce((acc, time) => acc + +time, 0);
      }
    }

    function outFormat(duration = 0, total) {
      let outArr = [
        NOVA.formatTime.HMS.digit(
          NOVA.currentPage == "watch" && NOVA.videoElement?.playbackRate
            ? duration / NOVA.videoElement.playbackRate
            : duration,
        ),
      ];

      if (total) {
        outArr.push(`(${Math.trunc((duration * 100) / total) + "%"})`);

        if (user_settings.playlist_duration_progress_type) {
          outArr.push(user_settings.playlist_duration_progress_type);
        }
      }
      return " - " + outArr.join(" ");
    }

    function insertToHTML({ text = "", container = required() }) {
      if (!(container instanceof HTMLElement)) {
        console.error("Container is not an HTMLElement:", container);
        return;
      }

      (
        container.querySelector(`#${SELECTOR_ID}`) ||
        (function () {
          const el = document.createElement("span");
          el.id = SELECTOR_ID;

          return container.appendChild(el);
        })()
      ).textContent = " " + text;
    }
  },
  options: {
    playlist_duration_progress_type: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      label: "Time display mode",

      "title:pl": "Tryb wyświetlania czasu",

      options: [
        {
          label: "done",
          value: "done",

          "label:pl": "zakończone",
        },
        {
          label: "left",
          value: "left",

          "label:pl": "pozostało",
        },
        {
          label: "total",
          value: false,
          selected: true,

          "label:pl": "w sumie",
        },
      ],
    },
    playlist_duration_percentage: {
      _tagName: "input",

      label: "Add %",

      "label:pl": "Pokaż procenty",

      type: "checkbox",

      "data-dependent": { playlist_duration_progress_type: ["done", "left"] },
    },
  },
});
window.nova_plugins.push({
  id: "playlist-extended",
  title: "Playlist extended section",

  run_on_pages: "watch, -mobile",
  section: "playlist",

  _runtime: (user_settings) => {
    let height = 90;

    if (user_settings["move-to-sidebar"]) {
      switch (user_settings.move_to_sidebar_target) {
        case "info":
          height = 84;
          break;
      }
    }

    NOVA.css.push(
      `ytd-watch-flexy:not([theater]) #secondary #playlist {
            --ytd-watch-flexy-panel-max-height: ${height}vh !important;
         }`,
    );
  },
});

window.nova_plugins.push({
  id: "playlist-reverse",

  title: "Add playlist reverse order button",

  "title:pl": "Dodaj przycisk odtwarzania w odwrotnej kolejności",

  run_on_pages: "watch, -mobile",

  section: "playlist",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-playlist-reverse-btn",
      SELECTOR = "#" + SELECTOR_ID,
      CLASS_NAME_ACTIVE = "nova-playlist-reverse-on";

    window.nova_playlistReversed;

    NOVA.css.push(
      `${SELECTOR} {
            background: none;
            border: 0;
         }
         yt-icon-button {
            width: 40px;
            height: 40px;
            padding: 10px;
         }
         ${SELECTOR} svg {
            fill: white;
            fill: var(--yt-spec-text-secondary);
         }
         ${SELECTOR}:hover svg { fill: #66afe9; }

         ${SELECTOR}:active svg,
         ${SELECTOR}.${CLASS_NAME_ACTIVE} svg { fill: #2196f3; }`,
    );

    if (
      user_settings.playlist_reverse_auto_enabled &&
      !window.nova_playlistReversed
    ) {
      window.nova_playlistReversed = true;
    }

    NOVA.runOnPageLoad(async () => {
      if (NOVA.currentPage == "watch" && location.search.includes("list=")) {
        reverseControl();

        document.addEventListener("yt-page-data-updated", insertButton, {
          capture: true,
          once: true,
        });
      }
    });

    function insertButton() {
      NOVA.waitSelector(
        ".ytd-page-manager[video-id] #playlist #playlist-action-menu .top-level-buttons:not([hidden]), #secondary #playlist #playlist-action-menu #top-level-buttons-computed",
        { destroy_after_page_leaving: true },
      ).then((el) => createButton(el));

      async function createButton(container = required()) {
        if (!(container instanceof HTMLElement)) {
          console.error("Container is not an HTMLElement:", container);
          return;
        }
        await NOVA.delay(500);

        document.getElementById(SELECTOR_ID)?.remove();

        const reverseBtn = document.createElement("div"),
          updateTitle = () =>
            (reverseBtn.title = `Reverse playlist order is ${window.nova_playlistReversed ? "ON" : "OFF"}`);

        if (window.nova_playlistReversed)
          reverseBtn.className = CLASS_NAME_ACTIVE;
        reverseBtn.id = SELECTOR_ID;
        updateTitle();

        reverseBtn.append(
          (function createSvgIcon() {
            const iconBtn = document.createElement("yt-icon-button");

            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("viewBox", "0 0 381.399 381.399");
            svg.setAttribute("height", "100%");
            svg.setAttribute("width", "100%");

            const g = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g",
            );

            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );

            path.setAttribute(
              "d",
              "M233.757,134.901l-63.649-25.147v266.551c0,2.816-2.286,5.094-5.104,5.094h-51.013c-2.82,0-5.099-2.277-5.099-5.094 V109.754l-63.658,25.147c-2.138,0.834-4.564,0.15-5.946-1.669c-1.389-1.839-1.379-4.36,0.028-6.187L135.452,1.991 C136.417,0.736,137.91,0,139.502,0c1.576,0,3.075,0.741,4.041,1.991l96.137,125.061c0.71,0.919,1.061,2.017,1.061,3.109 c0,1.063-0.346,2.158-1.035,3.078C238.333,135.052,235.891,135.735,233.757,134.901z M197.689,378.887h145.456v-33.62H197.689 V378.887z M197.689,314.444h145.456v-33.622H197.689V314.444z M197.689,218.251v33.619h145.456v-33.619H197.689z",
            );

            g.append(path);
            svg.append(g);
            iconBtn.append(svg);

            return iconBtn;
          })(),
        );

        reverseBtn.addEventListener("click", () => {
          reverseBtn.classList.toggle(CLASS_NAME_ACTIVE);
          window.nova_playlistReversed = !window.nova_playlistReversed;

          if (window.nova_playlistReversed) {
            reverseControl();

            updateTitle();
            fixConflictPlugins();
          } else location.reload();
        });
        container.append(reverseBtn);
      }
    }

    function fixConflictPlugins() {
      if (user_settings["playlist-duration"]) {
        document.getElementById("nova-playlist-duration").textContent = "";
      }

      if (
        user_settings["playlist-toggle-autoplay"] &&
        (autoplayBtn = document.getElementById("nova-playlist-autoplay-btn"))
      ) {
        autoplayBtn.disabled = true;
        autoplayBtn.title = "out of reach";
      }
    }

    async function reverseControl() {
      if (!window.nova_playlistReversed) return;

      if (
        (ytdWatch = await NOVA.waitSelector(".ytd-page-manager[video-id]", {
          destroy_after_page_leaving: true,
        })) &&
        (data = await NOVA.waitUntil(
          () => ytdWatch.data?.contents?.twoColumnWatchNextResults,
          100,
        )) &&
        (playlist = data.playlist?.playlist) &&
        (autoplay = data.autoplay?.autoplay)
      ) {
        playlist.contents.reverse();

        playlist.currentIndex =
          playlist.totalVideos - playlist.currentIndex - 1;
        playlist.localCurrentIndex =
          playlist.contents.length - playlist.localCurrentIndex - 1;

        for (const i of autoplay.sets) {
          i.autoplayVideo = i.previousButtonVideo;
          i.previousButtonVideo = i.nextButtonVideo;
          i.nextButtonVideo = i.autoplayVideo;
        }

        if (ytdWatch.updatePageData_) ytdWatch.updatePageData_(data);
        else throw new Error("updatePageData_ is " + updatePageData_);

        if (
          (manager = document.body.querySelector("yt-playlist-manager")) &&
          (ytdPlayer = document.getElementById("ytd-player"))
        ) {
          ytdPlayer.updatePlayerComponents(null, autoplay, null, playlist);
          manager.autoplayData = autoplay;
          manager.setPlaylistData(playlist);
          ytdPlayer.updatePlayerPlaylist_(playlist);
        }
      }

      scrollToElement(
        document.body.querySelector(
          "#secondary #playlist-items[selected], ytm-playlist .item[selected=true]",
        ),
      );
    }

    function scrollToElement(target_el = required()) {
      if (!(target_el instanceof HTMLElement))
        return console.error("target_el not HTMLElement:", target_el);
      const container = target_el.parentElement;
      container.scrollTop = target_el.offsetTop - container.offsetTop;
    }
  },
  options: {
    playlist_reverse_auto_enabled: {
      _tagName: "input",
      label: "Default enabled state",

      "label:pl": "Domyślnie włączone",

      type: "checkbox",
    },
  },
});
window.nova_plugins.push({
  id: "playlist-collapse",
  title: "Collapse playlist",

  "title:pl": "Automatyczne zwijanie listy odtwarzania",

  run_on_pages: "watch, -mobile",
  section: "playlist",

  _runtime: (user_settings) => {
    if (!location.search.includes("list=")) return;

    NOVA.waitSelector(
      "#secondary #playlist:not([collapsed]) #expand-button button",
    ).then((btn) => {
      btn.click();
    });
  },
});

window.nova_plugins.push({
  id: "playlist-toggle-autoplay",
  title: "Add playlist autoplay control button",

  "title:pl": "Kontrola autoodtwarzania listy odtwarzania",

  run_on_pages: "watch, -mobile",

  section: "playlist",

  _runtime: (user_settings) => {
    const SELECTOR_ID = "nova-playlist-autoplay-btn",
      SELECTOR = "#" + SELECTOR_ID;

    let sesionAutoplayState = user_settings.playlist_autoplay;

    NOVA.css.push(
      `#playlist-action-menu .top-level-buttons {
            align-items: center;
         }
         ${SELECTOR}[type=checkbox] {
            --height: 1em;
            width: 2.2em;
         }
         ${SELECTOR}[type=checkbox]:after {
            transform: scale(1.5);
         }
         ${SELECTOR}[type=checkbox] {
            --opacity: .7;
            --color: white;
            height: var(--height);
            line-height: 1.6em;
            border-radius: 3em;
            background-color: var(--paper-toggle-button-unchecked-bar-color, black);
            appearance: none;
            -webkit-appearance: none;
            position: relative;
            cursor: pointer;
            outline: 0;
            border: none;
         }
         ${SELECTOR}[type=checkbox]:after {
            position: absolute;
            top: 0;
            left: 0;
            content: '';
            width: var(--height);
            height: var(--height);
            border-radius: 50%;
            background-color: var(--color);
            box-shadow: 0 0 .25em rgba(0, 0, 0, .3);

         }
         ${SELECTOR}[type=checkbox]:checked:after {
            left: calc(100% - var(--height));
            --color: var(--paper-toggle-button-checked-button-color, var(--primary-color));
         }
         ${SELECTOR}[type=checkbox]:focus, input[type=checkbox]:focus:after {
            transition: all 200ms ease-in-out;
         }
         ${SELECTOR}[type=checkbox]:disabled {
            opacity: .3;
         }`,
    );

    NOVA.runOnPageLoad(() => {
      if (NOVA.currentPage == "watch" && location.search.includes("list=")) {
        insertButton();
      }
    });

    function insertButton() {
      NOVA.waitSelector(
        ".ytd-page-manager[video-id]:not([hidden]) ytd-playlist-panel-renderer:not([collapsed]) #playlist-action-menu .top-level-buttons:not([hidden]), #secondary #playlist #playlist-action-menu #top-level-buttons-computed",
        { destroy_after_page_leaving: true },
      ).then((el) => insertrCheckbox(el));

      function insertrCheckbox(container = required()) {
        if (!(container instanceof HTMLElement)) {
          console.error("Container is not an HTMLElement:", container);
          return;
        }

        document.getElementById(SELECTOR_ID)?.remove();

        const autoplayCheckbox = document.createElement("input");
        autoplayCheckbox.id = SELECTOR_ID;
        autoplayCheckbox.type = "checkbox";
        autoplayCheckbox.title = "Playlist toggle autoplay";
        autoplayCheckbox.addEventListener("change", ({ target }) => {
          sesionAutoplayState = target.checked;
          setAssociatedAutoplay();
        });
        container.append(autoplayCheckbox);

        autoplayCheckbox.checked = sesionAutoplayState;
        setAssociatedAutoplay();

        function setAssociatedAutoplay() {
          if ((manager = document.body.querySelector("yt-playlist-manager"))) {
            manager.interceptedForAutoplay = true;
            manager.canAutoAdvance_ = autoplayCheckbox.checked;

            autoplayCheckbox.checked = manager?.canAutoAdvance_;
            autoplayCheckbox.title = `Playlist Autoplay is ${manager?.canAutoAdvance_ ? "ON" : "OFF"}`;

            if (autoplayCheckbox.checked) checkHiddenVideo();
          } else
            console.error(
              "Error playlist-autoplay. Playlist manager:",
              manager,
            );

          async function checkHiddenVideo() {
            const watchManager = document.body.querySelector(
              ".ytd-page-manager[video-id]",
            );
            let playlistItems;

            await NOVA.waitUntil(
              () =>
                (playlistItems = getPlaylistContents(watchManager)) &&
                playlistItems.length,
              1000,
            );

            const currentIdx = movie_player.getPlaylistIndex(),
              lastAvailableIdx =
                playlistItems.findIndex((i) =>
                  i.hasOwnProperty("messageRenderer"),
                ) - 1;

            if (currentIdx === lastAvailableIdx) {
              manager.canAutoAdvance_ = false;
              alert(
                "Nova [playlist-toggle-autoplay]:\nPlaylist has hide video. Playlist autoplay disabled",
              );
              autoplayCheckbox.checked = false;
            }

            function getPlaylistContents(manager) {
              return (
                manager?.data?.contents?.twoColumnWatchNextResults?.playlist
                  ?.playlist?.contents ||
                manager?.data?.playlist?.playlist?.contents
              );
            }
          }
        }
      }
    }
  },
  options: {
    playlist_autoplay: {
      _tagName: "select",
      label: "Default state",

      "label:pl": "Stan domyślny",

      options: [
        {
          label: "play",
          value: true,
          selected: true,
        },
        {
          label: "stop",
          value: false,
        },
      ],
    },
  },
});

window.nova_plugins.push({
  id: "move-to-sidebar",
  title: "Move to sidebar",

  "title:pl": "Przenieś na pasek boczny",

  run_on_pages: "watch, -mobile",

  section: "sidebar",

  _runtime: (user_settings) => {
    if (
      user_settings.move_to_sidebar_target != "info" &&
      location.search.includes("list=")
    )
      return;

    const SELECTOR_CONTAINER = ".ytd-page-manager[video-id]:not([fullscreen])",
      SELECTOR_BELOW = `${SELECTOR_CONTAINER} #below`,
      SELECTOR_SECONDARY = `${SELECTOR_CONTAINER} #secondary`;

    switch (user_settings.move_to_sidebar_target) {
      case "info":
        moveChannelInfo();
        break;

      case "description":
        if (user_settings["description-dropdown"]) return;

        NOVA.waitSelector(`${SELECTOR_BELOW} #description.ytd-watch-metadata`, {
          destroy_after_page_leaving: true,
        }).then((description) => {
          NOVA.waitSelector(`${SELECTOR_SECONDARY}-inner`, {
            destroy_after_page_leaving: true,
          }).then(async (secondary) => {
            if (document.body.querySelector("#chat:not([collapsed])")) return;

            secondary.prepend(description);

            const infoContainer = document.body.querySelector(
              `${SELECTOR_SECONDARY} #info-container`,
            );
            if (infoContainer) {
              if (
                !user_settings["description-dropdown"] &&
                !user_settings["video-date-format"]
              ) {
                const title = document.body.querySelector(
                  `${SELECTOR_BELOW} ytd-watch-metadata #title`,
                );
                title?.append(infoContainer);
              } else {
                infoContainer.remove();
              }
            }

            NOVA.css.push(
              `${SELECTOR_SECONDARY} #owner { margin: 0; }

                           ${SELECTOR_SECONDARY} #description.ytd-watch-metadata {
                              height: fit-content !important;
                              max-height: 80vh !important;
                              overflow-y: auto;
                           }

                           ${SELECTOR_SECONDARY} #description #collapse,

                           #ytd-watch-info-text, #info-container a {
                              display: none;
                           `,
            );
            document.body
              .querySelector(`${SELECTOR_SECONDARY} #description #expand`)
              ?.click();
          });
        });

        moveChannelInfo();
        moveSidebarBelow();
        break;

      case "comments":
        if (
          user_settings.comments_visibility_mode == "disable" ||
          user_settings["comments-dropdown"]
        )
          return;

        NOVA.waitSelector(`${SELECTOR_BELOW} #comments`, {
          destroy_after_page_leaving: true,
        }).then((comments) => {
          if (document.body.querySelector("#chat:not([collapsed])")) return;

          document.body
            .querySelector(`${SELECTOR_SECONDARY}`)
            ?.append(comments);

          comments.style.cssText = "height:100vh; overflow-y:auto;";
        });

        moveSidebarBelow();
        break;
    }

    function moveSidebarBelow() {
      NOVA.waitSelector(`${SELECTOR_SECONDARY} #related`, {
        destroy_after_page_leaving: true,
      }).then((related) => {
        if (document.body.querySelector("#chat:not([collapsed])")) return;
        document.body.querySelector("#below")?.append(related);
      });
    }

    function moveChannelInfo() {
      NOVA.waitSelector(`${SELECTOR_SECONDARY}-inner`, {
        destroy_after_page_leaving: true,
      }).then((secondary) => {
        NOVA.waitSelector(`${SELECTOR_BELOW} ytd-watch-metadata #owner`, {
          destroy_after_page_leaving: true,
        }).then((channelInfo) => {
          secondary.prepend(channelInfo);
        });
      });
    }
  },
  options: {
    move_to_sidebar_target: {
      _tagName: "select",
      label: "Target of movement",

      options: [
        { label: "info", value: "info" },
        { label: "info + description", value: "description", selected: true },
        { label: "comments", value: "comments" },
      ],
    },
  },
});

window.nova_plugins.push({
  id: "livechat-visibility",
  title: "Collapse livechat",

  "title:pl": "Ukryj czat na żywo",

  run_on_pages: "watch, -mobile",

  restart_on_location_change: true,
  section: "sidebar",

  _runtime: (user_settings) => {
    if (user_settings.livechat_visibility_mode == "disable") {
      NOVA.waitSelector("#chat", { destroy_after_page_leaving: true }).then(
        (chat) => {
          chat.remove();
        },
      );
    } else {
      NOVA.waitSelector("#chat:not([collapsed]) #show-hide-button button", {
        destroy_after_page_leaving: true,
      }).then((btn) => {
        btn.click();
      });
    }
  },
  options: {
    livechat_visibility_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "collapse",
          value: "hide",
          selected: true,

          "label:pl": "zwiń",
        },
        {
          label: "remove",
          value: "disable",

          "label:pl": "usunąć",
        },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "sidebar-thumbs-channel-link-patch",
  title: "Fix channel links in sidebar",

  "title:pl": "Napraw linki do kanałów na pasku bocznym",

  run_on_pages: "watch, -mobile",
  section: "sidebar",

  _runtime: (user_settings) => {
    document.addEventListener("click", (evt) => patchLink(evt), {
      capture: true,
    });

    document.addEventListener(
      "auxclick",
      (evt) => evt.button === 1 && patchLink(evt),
      { capture: true },
    );

    function patchLink(evt) {
      if (
        evt.isTrusted &&
        NOVA.currentPage == "watch" &&
        evt.target.closest("#channel-name")
      ) {
        const link = evt.target.closest("a");
        const targetElement = evt.target.closest(
          "ytd-compact-video-renderer, ytd-video-meta-block",
        );

        if (link && targetElement && (data = targetElement.data)) {
          const res = NOVA.searchInObjectBy.key({
            obj: data,
            key: "navigationEndpoint",
            match_fn: (val) =>
              val?.commandMetadata?.webCommandMetadata?.webPageType ===
              "WEB_PAGE_TYPE_CHANNEL",
          });
          if (res) {
            const urlOrigData = link.data,
              urlOrig = link.href,
              endpoint =
                (user_settings["channel-default-tab"] &&
                  user_settings.channel_default_tab) ||
                "videos";

            link.data = res;
            link.href = link.data.commandMetadata.webCommandMetadata.url +=
              link.data.commandMetadata.webCommandMetadata.url.endsWith("/")
                ? endpoint
                : `/${endpoint}`;

            evt.target.addEventListener(
              "mouseout",
              ({ target }) => {
                link.data = urlOrigData;
                link.href = urlOrig;
              },
              { capture: true, once: true },
            );
          }
        }
      }
    }
  },
});
window.nova_plugins.push({
  id: "related-visibility",
  title: "Collapse related section",

  "title:pl": "Zwiń powiązaną sekcję",

  run_on_pages: "watch, -mobile",
  section: "sidebar",

  _runtime: (user_settings) => {
    NOVA.collapseElement({
      selector: "#secondary #related",
      label: "related",
      remove: user_settings.related_visibility_mode == "disable" ? true : false,
    });
  },
  options: {
    related_visibility_mode: {
      _tagName: "select",
      label: "Mode",

      "label:pl": "Tryb",

      options: [
        {
          label: "collapse",
          value: "hide",
          selected: true,

          "label:pl": "zwiń",
        },
        {
          label: "remove",
          value: "disable",

          "label:pl": "usunąć",
        },
      ],
    },
  },
});
window.nova_plugins.push({
  id: "livechat-toggle-mode",
  title: '"Livechat" mode instead of "Top chat"',

  run_on_pages: "live_chat, -mobile",
  restart_on_location_change: true,
  section: "sidebar",

  _runtime: (user_settings) => {
    NOVA.waitSelector('#chat-messages #menu a[aria-selected="false"]').then(
      async (btn) => {
        await btn.click();
      },
    );
  },
});

window.nova_plugins.push({
  id: "thumbs-grid-count",
  title: "Thumbnails count in row",

  run_on_pages: "feed, channel, -mobile",
  section: "thumbs",

  _runtime: (user_settings) => {
    const MathMin_orig = Math.min,
      addRowCount = +user_settings.thumbs_grid_count || 1;

    Math.min = function () {
      return (
        MathMin_orig.apply(Math, arguments) +
        (/calcElementsPerRow/gim.test(Error().stack || "")
          ? addRowCount - 1
          : 0)
      );
    };
  },
  options: {
    thumbs_grid_count: {
      _tagName: "input",
      label: "Add to row",

      type: "number",

      placeholder: "1-10",
      step: 1,
      min: 1,
      max: 10,
      value: 1,
    },
  },
});
window.nova_plugins.push({
  id: "thumbs-title-show-full",
  title: "Show full title",

  "title:pl": "Pokaż pełny tytuł",

  run_on_pages: "home, feed, channel, watch",

  section: "thumbs",

  _runtime: (user_settings) => {
    const VIDEO_TITLE_SELECTOR = [
      "#video-title",

      'a > [class*="media-item-headline"]',
    ].map((i) => i + ":not(:empty)");

    NOVA.css.push(
      VIDEO_TITLE_SELECTOR.join(",") +
        ` {
            display: block !important;
            max-height: unset !important;
         }`,
    );
  },
});

window.nova_plugins.push({
  id: "thumbs-clear",
  title: "Thumbnails preview image",

  "title:pl": "Wyczyść miniatury",

  run_on_pages: "home, feed, channel, watch",

  section: "thumbs",
  desc: "Replaces the predefined clickbait thumbnails",
  "desc:zh": "替换预定义的缩略图",
  "desc:ja": "事前定義されたサムネイルを置き換えます",

  "desc:pl": "Zastępuje predefiniowaną miniaturkę",

  _runtime: (user_settings) => {
    const ATTR_MARK = "nova-thumb-preview-cleared",
      thumbsSelectors = [
        "ytd-rich-item-renderer",

        "yt-append-continuation-items-action",
        "ytm-compact-video-renderer",
        "ytm-item-section-renderer",
      ];

    if (user_settings.thumbs_clear_overlay) {
      NOVA.css.push(
        `#hover-overlays {
               visibility: hidden !important;
            }`,
      );
    }

    document.addEventListener("scroll", () => {
      requestAnimationFrame(patchThumb);
    });

    document.addEventListener(
      "visibilitychange",
      () => !document.hidden && patchThumb(),
    );

    document.addEventListener("yt-action", (evt) => {
      switch (evt.detail?.actionName) {
        case "yt-append-continuation-items-action":
        case "ytd-update-grid-state-action":

        case "yt-store-grafted-ve-action":
        case "ytd-update-elements-per-row-action":
          patchThumb();
          break;
      }
    });

    function patchThumb() {
      switch (NOVA.currentPage) {
        case "home":

        case "feed":
        case "channel":
        case "watch":
          document.body
            .querySelectorAll(
              `#thumbnail:not(.ytd-playlist-thumbnail):not([class*=markers]):not([href*="/shorts/"]) img[src]:not([src*="_live.jpg"]):not([${ATTR_MARK}]),
            a:not([href*="/shorts/"]) img.video-thumbnail-img[src]:not([src*="_live.jpg"]):not([${ATTR_MARK}])`,
            )
            .forEach((img) => {
              img.setAttribute(ATTR_MARK, true);

              passImg(img);
            });

          break;
      }
    }

    let DISABLE_YT_IMG_DELAY_LOADING_default = false;
    async function passImg(img = required()) {
      if (NOVA.currentPage == "results") return;

      if (
        window.yt?.config_?.DISABLE_YT_IMG_DELAY_LOADING &&
        DISABLE_YT_IMG_DELAY_LOADING_default !==
          window.yt?.config_?.DISABLE_YT_IMG_DELAY_LOADING
      ) {
        DISABLE_YT_IMG_DELAY_LOADING_default =
          window.yt?.config_?.DISABLE_YT_IMG_DELAY_LOADING;

        await NOVA.delay(100);

        document.body
          .querySelectorAll(`[${ATTR_MARK}]`)
          .forEach((e) => e.removeAttribute(ATTR_MARK));
      }

      if (
        (thumb = img.closest(thumbsSelectors)) &&
        thumb.querySelector(
          `#badges [class*="live-now"],
                  #overlays [aria-label="PREMIERE"],
                  #overlays [overlay-style="UPCOMING"]`,
        )
      ) {
        return;
      }

      if ((url = patchImg(img.src))) img.src = url;
    }

    function patchImg(url = required()) {
      if ((re = /(\w{2}default|hq\d+)./i) && re.test(url)) {
        return url.replace(
          re,
          (user_settings.thumbs_clear_preview_timestamp || "hq2") + ".",
        );
      }
    }
  },
  options: {
    thumbs_clear_preview_timestamp: {
      _tagName: "select",

      label: "Timestamps moment",

      "label:pl": "Znaczniki czasowe miniatur",

      title: "Show thumbnail from video time position",

      "title:pl": "Pokaż miniaturkę z pozycji czasu wideo",

      options: [
        {
          label: "start",
          value: "hq1",

          "label:pl": "początek",
        },
        {
          label: "middle",
          value: "hq2",
          selected: true,

          "label:pl": "środek",
        },
        {
          label: "end",
          value: "hq3",

          "label:pl": "koniec",
        },
      ],
    },
    thumbs_clear_overlay: {
      _tagName: "input",
      label: "Hide overlay buttons on a thumbnail",

      "label:pl": "Ukryj przyciski nakładki na miniaturce",

      type: "checkbox",
      title: "Hide [ADD TO QUEUE] [WATCH LATER]",
    },
  },
});

window.nova_plugins.push({
  id: "thumbs-title-lang",
  title: "Show titles original language",

  run_on_pages: "feed, channel, watch",

  section: "thumbs",
  opt_api_key_warn: true,

  "plugins-conflict": "thumbs-title-normalize",
  _runtime: (user_settings) => {
    const CACHE_NAME = "thumbs-title",
      SELECTOR_THUMBS_PATCHED_ATTR = "nova-thumbs-title-lang",
      thumbsSelectors = [
        "ytd-rich-item-renderer",

        "ytd-compact-video-renderer",
        "yt-append-continuation-items-action",
        "ytm-compact-video-renderer",
        "ytm-item-section-renderer",
      ]
        .map(
          (i) =>
            `${i}:has(a#thumbnail[${SELECTOR_THUMBS_PATCHED_ATTR}][href*="%id%"]) #video-title`,
        )
        .join(",");

    NOVA.css.push(
      `#video-title[${SELECTOR_THUMBS_PATCHED_ATTR}] {
            color: #86d2ed
         }
         *:hover > #video-title[${SELECTOR_THUMBS_PATCHED_ATTR}],
         *:not(:hover) > #video-title[${SELECTOR_THUMBS_PATCHED_ATTR}] + #video-title {
            display: none !important;
         }`,
    );

    let idsToProcess = [],
      newCacheItem = {},
      timeoutId;

    NOVA.watchElements({
      selectors: "a#thumbnail[href].ytd-thumbnail",
      attr_mark: SELECTOR_THUMBS_PATCHED_ATTR,
      callback: (thumbnail) => {
        if ((id = NOVA.queryURL.get("v", thumbnail.href))) {
          idsToProcess.push(id);
          run_process();
        }
      },
    });

    function run_process(sec = 1) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshCache(newCacheItem);
        patchThumbs(idsToProcess);
      }, 1000 * sec);
    }

    function patchThumbs(ids = []) {
      if (!ids.length) return;

      idsToProcess = [];
      const cacheData = JSON.parse(sessionStorage.getItem(CACHE_NAME));

      const newIds = ids.filter((id) => {
        if (cacheData?.hasOwnProperty(id)) {
          if ((cacheItem = cacheData[id])) {
            patchTitle({ id: id, text: cacheItem.text });
            return false;
          }
        }

        return true;
      });

      requestTitle(newIds);
    }

    function refreshCache(new_cache = {}) {
      if (!window?.sessionStorage) return;
      newCacheItem = {};
      const cacheData = JSON.parse(sessionStorage.getItem(CACHE_NAME)) || {};
      sessionStorage.setItem(
        CACHE_NAME,
        JSON.stringify(Object.assign(new_cache, cacheData)),
      );
    }

    function requestTitle(ids = []) {
      const YOUTUBE_API_MAX_IDS_PER_CALL = 50;

      chunkArray(ids, YOUTUBE_API_MAX_IDS_PER_CALL).forEach((id_part) => {
        NOVA.request
          .API({
            request: "videos",
            params: { id: id_part.join(","), part: "snippet" },
            api_key: user_settings["user-api-key"],
          })
          .then((res) => {
            res?.items?.forEach((item) => {
              patchTitle({ id: item.id, text: item.snippet.title });

              newCacheItem[item.id] = { text: item.snippet.title };
            });

            run_process(3);
          });
      });

      function chunkArray(array = [], size = 0) {
        let chunked = [];
        while (array.length) chunked.push(array.splice(0, +size));
        return chunked;
      }
    }

    function patchTitle({ id = required(), text = required() }) {
      document
        .querySelectorAll(thumbsSelectors.replaceAll("%id%", id))
        .forEach((videoTitleEl) => {
          if (videoTitleEl.textContent?.trim() == text) return;

          const newTitleEl = videoTitleEl.cloneNode(true);
          videoTitleEl.before(newTitleEl);
          newTitleEl.setAttribute(SELECTOR_THUMBS_PATCHED_ATTR, true);
          newTitleEl.textContent = text;
        });
    }
  },
});

window.nova_plugins.push({
  id: "thumbs-not-interested",
  title: 'Add "Not Interested" button on thumbnails',

  run_on_pages: "feed, channel, watch, -mobile",
  section: "thumbs",
  desc: "You must be logged in",

  _runtime: (user_settings) => {
    const SELECTOR_OVERLAY_ID_NAME = "nova-thumb-overlay",
      SELECTOR_CLASS_NAME = "nova-thumbs-not-interested-btn",
      thumbsSelectors = [
        "ytd-rich-item-renderer",

        "ytd-compact-video-renderer",
        "yt-append-continuation-items-action",
        "ytm-compact-video-renderer",
        "ytm-item-section-renderer",
      ]
        .map((i) => `${i}:not(.${SELECTOR_CLASS_NAME})`)
        .join(",");

    document.addEventListener("scroll", () => {
      requestAnimationFrame(patchThumb);
    });

    document.addEventListener(
      "visibilitychange",
      () => !document.hidden && patchThumb(),
    );

    document.addEventListener("yt-action", (evt) => {
      switch (evt.detail?.actionName) {
        case "yt-append-continuation-items-action":
        case "ytd-update-grid-state-action":

        case "yt-store-grafted-ve-action":

        case "yt-forward-redux-action-to-live-chat-iframe":
          patchThumb();
          break;
      }
    });

    if (!user_settings["thumbs-watch-later"]) {
      NOVA.css.push(
        `#${SELECTOR_OVERLAY_ID_NAME} {
               position: absolute;
               top: 0;
               left: 0;
               z-index: 999;
            }`,
      );
    }

    NOVA.css.push(
      `button.${SELECTOR_CLASS_NAME} {
            border: 0;
            cursor: pointer;
            height: 1.3em;
            font-size: 2em;
            background-color: transparent;
            background-color: var(--yt-spec-static-overlay-background-heavy);
            color: var(--yt-spec-static-overlay-text-primary);
         }`,
    );

    function renderButton(thumb = required()) {
      const btn = document.createElement("button");
      btn.className = SELECTOR_CLASS_NAME;

      btn.append(
        (function createSvgIcon() {
          const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
          );
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.setAttribute("height", "100%");
          svg.setAttribute("width", "100%");

          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("fill", "currentColor");

          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          path.setAttribute(
            "d",
            "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zM3 12c0 2.31.87 4.41 2.29 6L18 5.29C16.41 3.87 14.31 3 12 3c-4.97 0-9 4.03-9 9zm15.71-6L6 18.71C7.59 20.13 9.69 21 12 21c4.97 0 9-4.03 9-9 0-2.31-.87-4.41-2.29-6z",
          );

          g.append(path);
          svg.append(g);

          return svg;
        })(),
      );

      btn.title = "Not Interested";

      btn.addEventListener("click", async (evt) => {
        evt.stopPropagation();

        if ((menu = thumb.querySelector("#menu button"))) {
          menu.click();
          await NOVA.waitSelector("#menu [menu-active]", {
            container: thumb,
            destroy_after_page_leaving: true,
          });

          if (
            (menuItemEl = document.body.querySelector(
              'tp-yt-iron-dropdown [role="menuitem"]:has(path[d^="M12 2c5.52"])',
            ))
          ) {
            menuItemEl.style.backgroundColor = "red";

            await menuItemEl.click();

            menuItemEl.style.removeProperty("backgroundColor");
          }
        }
      });
      return btn;
    }

    function patchThumb() {
      switch (NOVA.currentPage) {
        case "feed":
        case "channel":
        case "watch":
          document.body.querySelectorAll(thumbsSelectors).forEach((thumb) => {
            thumb.classList.add(SELECTOR_CLASS_NAME);

            if (
              (container = thumb.querySelector("a#thumbnail.ytd-thumbnail"))
            ) {
              if (user_settings["thumbs-watch-later"]) {
                NOVA.waitSelector(`#${SELECTOR_OVERLAY_ID_NAME}`, {
                  container: container,
                }).then((container) => {
                  container.append(renderButton(thumb));
                });
              } else {
                const div = document.createElement("div");
                div.id = SELECTOR_OVERLAY_ID_NAME;
                div.append(renderButton(thumb));
                container.append(div);
              }
            }
          });
          break;
      }
    }
  },
});

window.nova_plugins.push({
  id: "thumbs-watched",

  title: "Mark watched thumbnails",

  "title:pl": "Oznacz obejrzane miniaturki",

  run_on_pages: "home, results, feed, channel, playlist, watch, -mobile",

  section: "thumbs",

  _runtime: (user_settings) => {
    NOVA.css.push(
      `a#thumbnail,
         a[class*="thumbnail"] {
            outline: 1px solid var(--yt-spec-general-background-a);
         }


         a#thumbnail:visited,
         a[class*="thumbnail"]:visited {
            outline: 1px solid ${user_settings.thumbs_watched_frame_color || "red"} !important;
         }


         ytd-playlist-panel-video-renderer a:visited #meta * {
            color: ${user_settings.thumbs_watched_title_color || "#ff4500"} !important;
         }`,
    );

    if (user_settings.thumbs_watched_title) {
      NOVA.css.push(
        `a#video-title:visited:not(:hover),
            #description a:visited {
               color: ${user_settings.thumbs_watched_title_color} !important;
            }`,
      );
    }
  },
  options: {
    thumbs_watched_frame_color: {
      _tagName: "input",
      label: "Frame color",

      "label:pl": "Kolor ramki",

      type: "color",
      value: "#FF0000",
    },
    thumbs_watched_title: {
      _tagName: "input",
      label: "Set title color",

      "label:pl": "Ustaw kolor tytułu",

      type: "checkbox",
    },
    thumbs_watched_title_color: {
      _tagName: "input",
      label: "Choose title color",

      "label:pl": "Wybierz kolor tytułu",

      type: "color",

      value: "#ff4500",
      "data-dependent": { thumbs_watched_title: true },
    },
  },
});
window.nova_plugins.push({
  id: "search-filter",

  title: "Blocked channels",

  "title:pl": "Zablokowane kanały",

  run_on_pages: "results, feed, watch, -mobile",
  section: "thumbs",

  desc: "Hide channels on the search page",
  "desc:zh": "在搜索页面上隐藏频道",
  "desc:ja": "検索ページでチャンネルを非表示にする",

  "desc:pl": "Ukryj kanały na stronie wyszukiwania",

  _runtime: (user_settings) => {
    const SELECTOR_THUMBS_HIDE_CLASS_NAME = "nova-thumbs-hide",
      BLOCK_KEYWORDS = NOVA.strToArray(
        user_settings.search_filter_channels_blocklist?.toLowerCase(),
      ),
      thumbsSelectors = [
        "ytd-rich-item-renderer",
        "ytd-video-renderer",
        "ytd-playlist-renderer",

        "ytm-compact-video-renderer",

        ".ytp-videowall-still",
      ].join(",");

    if (
      !user_settings["thumbs-hide"] &&
      !user_settings["thumbs-title-filter"]
    ) {
      document.addEventListener(
        "yt-navigate-finish",
        () => NOVA.queryURL.has("flow") && NOVA.insertFIlterButton(),
      );

      NOVA.insertFIlterButton();
    }

    NOVA.css.push(
      `body.nova-thumbs-unhide .${SELECTOR_THUMBS_HIDE_CLASS_NAME} {
            border: 2px dashed red;
         }
         body:not(.nova-thumbs-unhide) .${SELECTOR_THUMBS_HIDE_CLASS_NAME} {
            display: none;
         }`,
    );

    if (NOVA.isMobile) {
      NOVA.watchElements({
        selectors: ["#channel-name"],

        attr_mark: "nova-thumb-channel-filtered",
        callback: (channel_name) => {
          if (
            BLOCK_KEYWORDS.includes(
              channel_name.textContent.trim().toLowerCase(),
            ) &&
            (thumb = channel_name.closest(thumbsSelectors))
          ) {
            thumb.remove();
          }
        },
      });
    } else {
      document.addEventListener("scroll", () => {
        requestAnimationFrame(hideThumb);
      });

      document.addEventListener(
        "visibilitychange",
        () => !document.hidden && hideThumb(),
      );

      document.addEventListener("yt-action", (evt) => {
        switch (evt.detail?.actionName) {
          case "yt-append-continuation-items-action":
          case "ytd-update-grid-state-action":

          case "yt-store-grafted-ve-action":
            hideThumb();
            break;
        }
      });

      NOVA.waitSelector("#movie_player video").then((video) => {
        video.addEventListener("ended", () =>
          hideThumb(".ytp-videowall-still-info-author"),
        );
      });

      if (typeof GM_info === "object") {
        let activeThumb;
        document.addEventListener("click", (evt) => {
          activeThumb =
            evt.isTrusted && (el = evt.target.closest("#menu #button"))
              ? el.closest("#dismissible")
              : null;
        });

        NOVA.waitSelector(
          'tp-yt-iron-dropdown:not([aria-hidden="true"]) ytd-menu-popup-renderer[slot="dropdown-content"] [role="menuitem"]',
        ).then((container) => {
          NOVA.css.push(
            `div.ytd-menu-service-item-renderer:hover { background-color: var(--yt-spec-10-percent-layer); }`,
          );

          const btn = document.createElement("div");
          btn.classList = "style-scope ytd-menu-service-item-renderer";

          Object.assign(btn.style, {
            "font-size": "14px",
            padding: "9px 15px 9px 56px",
            cursor: "pointer",
          });

          const boldText = document.createElement("strong");
          boldText.textContent = "Nova block channel";
          btn.append(boldText);
          btn.title = "Nova block channel";

          btn.addEventListener("click", () => {
            const currentCannelName = activeThumb?.querySelector(
              "#channel-name a, #channel-name #text",
            )?.textContent;

            console.debug("currentCannelName", currentCannelName, activeThumb);

            if (
              currentCannelName &&
              confirm(`Add channel【${currentCannelName}】to the blacklist?`)
            ) {
              user_settings.search_filter_channels_blocklist +=
                "\n" + currentCannelName;
              GM_setValue(configStoreName, user_settings);
            }
            document.body.click();
          });

          container.after(btn);
        });
      }

      function hideThumb(selector) {
        document.body
          .querySelectorAll(selector || "#channel-name a[href]:first-child")
          .forEach((channel_name) => {
            BLOCK_KEYWORDS.forEach((keyword) => {
              if (
                keyword.startsWith("@") &&
                channel_name.href.includes(keyword) &&
                (thumb = channel_name.closest(thumbsSelectors))
              ) {
                thumb.remove();
              } else if (
                channel_name.textContent
                  .trim()
                  .toLowerCase()
                  .includes(keyword) &&
                (thumb = channel_name.closest(thumbsSelectors))
              ) {
                thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);
              }
            });
          });
      }
    }
  },
  options: {
    search_filter_channels_blocklist: {
      _tagName: "textarea",
      label: "List",

      "label:pl": "Lista",

      title: 'separator: "," or ";" or "new line"',

      "title:pl": 'separator: "," lub ";" lub "now linia"',

      placeholder: "channel1\nchannel2",
      required: true,
    },
  },
});
window.nova_plugins.push({
  id: "thumbs-title-filter",
  title: "Block thumbnails by title",

  "title:pl": "Blokuj miniatury według tytułu",

  run_on_pages: "*, -embed, -mobile, -live_chat",
  section: "thumbs",

  _runtime: (user_settings) => {
    const SELECTOR_THUMBS_HIDE_CLASS_NAME = "nova-thumbs-hide",
      BLOCK_KEYWORDS = NOVA.strToArray(
        user_settings.thumbs_filter_title_blocklist?.toLowerCase(),
      ),
      thumbsSelectors = [
        "ytd-rich-item-renderer",
        "ytd-video-renderer",
        "ytd-playlist-renderer",

        "ytd-compact-video-renderer",
        "yt-append-continuation-items-action",
        "ytm-compact-video-renderer",
        "ytm-item-section-renderer",
        ".ytp-videowall-still",
      ].join(",");

    if (!user_settings["thumbs-hide"] && !user_settings["search-filter"]) {
      document.addEventListener(
        "yt-navigate-finish",
        () => NOVA.queryURL.has("flow") && NOVA.insertFIlterButton(),
      );

      NOVA.insertFIlterButton();
    }

    NOVA.css.push(
      `body.nova-thumbs-unhide .${SELECTOR_THUMBS_HIDE_CLASS_NAME} {
            border: 2px dashed orange;
         }
         body:not(.nova-thumbs-unhide) .${SELECTOR_THUMBS_HIDE_CLASS_NAME} {
            display: none;
         }`,
    );

    if (NOVA.isMobile) {
      NOVA.watchElements({
        selectors: ["#video-title:not(:empty)"],
        attr_mark: "nova-thumb-title-filtered",
        callback: (video_title) => {
          BLOCK_KEYWORDS.forEach((keyword) => {
            if (
              video_title.textContent.trim().toLowerCase().includes(keyword) &&
              (thumb = channel_name.closest(thumbsSelectors))
            ) {
            }
          });
        },
      });
    } else {
      document.addEventListener("scroll", () => {
        requestAnimationFrame(hideThumb);
      });

      document.addEventListener(
        "visibilitychange",
        () => !document.hidden && hideThumb(),
      );

      document.addEventListener("yt-action", (evt) => {
        switch (evt.detail?.actionName) {
          case "yt-append-continuation-items-action":
          case "ytd-update-grid-state-action":

          case "yt-store-grafted-ve-action":
            hideThumb();
            break;
        }
      });

      NOVA.waitSelector("#movie_player video").then((video) => {
        video.addEventListener("ended", () =>
          hideThumb(".ytp-videowall-still-info-title"),
        );
      });

      function hideThumb(selector) {
        document.body
          .querySelectorAll(selector || "#video-title")
          .forEach((titleEl) => {
            BLOCK_KEYWORDS.forEach((keyword) => {
              if (
                titleEl.textContent.toLowerCase().includes(keyword) &&
                (thumb = titleEl.closest(thumbsSelectors))
              ) {
                thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);
              }
            });
          });
      }
    }
  },
  options: {
    thumbs_filter_title_blocklist: {
      _tagName: "textarea",
      label: "Words list",

      "label:pl": "Lista słów",

      title: 'separator: "," or ";" or "new line"',

      "title:pl": 'separator: "," lub ";" lub "now linia"',

      placeholder: "text1\ntext2",
      required: true,
    },
  },
});

window.nova_plugins.push({
  id: "thumbs-watch-later",
  title: 'Add "Watch Later" button on thumbnails (for feed page)',

  run_on_pages: "feed, -mobile",
  section: "thumbs",
  desc: "You must be logged in",

  _runtime: (user_settings) => {
    const SELECTOR_OVERLAY_ID_NAME = "nova-thumb-overlay",
      SELECTOR_CLASS_NAME = "nova-thumbs-watch-later-btn",
      thumbsSelectors = [
        "ytd-rich-item-renderer",

        "ytd-compact-video-renderer",
        "yt-append-continuation-items-action",
        "ytm-compact-video-renderer",
        "ytm-item-section-renderer",
      ]
        .map((i) => `${i}:not(.${SELECTOR_CLASS_NAME})`)
        .join(",");

    document.addEventListener("scroll", () => {
      requestAnimationFrame(patchThumb);
    });

    document.addEventListener(
      "visibilitychange",
      () => !document.hidden && patchThumb(),
    );

    document.addEventListener("yt-action", (evt) => {
      switch (evt.detail?.actionName) {
        case "yt-append-continuation-items-action":
        case "ytd-update-grid-state-action":

        case "yt-store-grafted-ve-action":
          patchThumb();
          break;
      }
    });

    NOVA.css.push(
      `#${SELECTOR_OVERLAY_ID_NAME} {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 999;
         }
         button.${SELECTOR_CLASS_NAME} {
            border: 0;
            cursor: pointer;
            height: 1.3em;
            font-size: 2em;
            background-color: transparent;
            background-color: var(--yt-spec-static-overlay-background-heavy);
            color: var(--yt-spec-static-overlay-text-primary);
         }`,
    );

    function renderButton(thumb = required()) {
      const btn = document.createElement("button");
      btn.className = SELECTOR_CLASS_NAME;

      btn.append(
        (function createSvgIcon() {
          const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
          );
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.setAttribute("height", "100%");
          svg.setAttribute("width", "100%");

          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("fill", "currentColor");

          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          path.setAttribute(
            "d",
            "M14.97 16.95 10 13.87V7h2v5.76l4.03 2.49-1.06 1.7zM12 3c-4.96 0-9 4.04-9 9s4.04 9 9 9 9-4.04 9-9-4.04-9-9-9m0-1c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z",
          );

          g.append(path);
          svg.append(g);

          return svg;
        })(),
      );

      btn.title = "Watch Later";

      btn.addEventListener("click", async (evt) => {
        evt.stopPropagation();

        if ((menu = thumb.querySelector("#menu button"))) {
          menu.click();
          await NOVA.waitSelector("#menu [menu-active]", {
            container: thumb,
            destroy_after_page_leaving: true,
          });

          if (
            (menuItemEl = document.body.querySelector(
              'tp-yt-iron-dropdown [role="menuitem"]:has(path[d^="M14.97"])',
            ))
          ) {
            menuItemEl.style.backgroundColor = "red";

            await menuItemEl.click();

            menuItemEl.style.removeProperty("backgroundColor");
          }
          document.body.click();
        }
      });
      return btn;
    }

    function patchThumb() {
      switch (NOVA.currentPage) {
        case "feed":
          document.body.querySelectorAll(thumbsSelectors).forEach((thumb) => {
            thumb.classList.add(SELECTOR_CLASS_NAME);

            if (
              (container = thumb.querySelector("a#thumbnail.ytd-thumbnail"))
            ) {
              const div = document.createElement("div");
              div.id = SELECTOR_OVERLAY_ID_NAME;
              div.append(renderButton(thumb));
              container.append(div);
            }
          });
          break;
      }
    }
  },
});

window.nova_plugins.push({
  id: "thumbs-hide",
  title: "Thumbnails filter",

  "title:pl": "Ukryj kilka miniatur",

  run_on_pages: "home, results, feed, channel, watch, -mobile",
  section: "thumbs",
  _runtime: (user_settings) => {
    const SELECTOR_THUMBS_HIDE_CLASS_NAME = "nova-thumbs-hide",
      thumbsSelectors = [
        "ytd-rich-item-renderer",
        "ytd-video-renderer",
        "ytd-playlist-renderer",

        "ytd-compact-video-renderer",
        "yt-append-continuation-items-action",
        "ytm-compact-video-renderer",
        "ytm-item-section-renderer",
        "ytd-rich-section-renderer",
      ]
        .map((i) => `${i}:not(.${SELECTOR_THUMBS_HIDE_CLASS_NAME})`)
        .join(",");

    document.addEventListener("scroll", () => {
      requestAnimationFrame(hideThumb);
    });

    document.addEventListener(
      "visibilitychange",
      () => !document.hidden && hideThumb(),
    );

    document.addEventListener("yt-action", (evt) => {
      console.debug(evt.detail?.actionName);
      switch (evt.detail?.actionName) {
        case "yt-append-continuation-items-action":
        case "ytd-update-grid-state-action":

        case "yt-store-grafted-ve-action":
          hideThumb();
          break;
      }
    });

    function hideThumb() {
      switch (NOVA.currentPage) {
        case "home":
          thumbRemove.live();
          thumbRemove.mix();
          thumbRemove.watched();
          break;

        case "results":
          thumbRemove.live();
          thumbRemove.shorts();

          thumbRemove.mix();

          break;

        case "feed":
          thumbRemove.live();
          thumbRemove.streamed();
          thumbRemove.shorts();
          thumbRemove.durationLimits();
          thumbRemove.premieres();
          thumbRemove.mix();
          thumbRemove.watched();
          break;

        case "watch":
          thumbRemove.live();
          thumbRemove.mix();
          thumbRemove.watched();
          break;
      }
    }

    document.addEventListener(
      "yt-navigate-finish",
      () => NOVA.queryURL.has("flow") && NOVA.insertFIlterButton(),
    );

    NOVA.insertFIlterButton();

    NOVA.css.push(
      `body.nova-thumbs-unhide .${SELECTOR_THUMBS_HIDE_CLASS_NAME} {
            border: 2px dashed orange;
         }
         body:not(.nova-thumbs-unhide) .${SELECTOR_THUMBS_HIDE_CLASS_NAME} {
            display: none;
         }`,
    );

    if (user_settings.thumbs_hide_shorts) {
      const stylesList = [];

      if (CSS.supports("selector(:has(*))")) {
        stylesList.push(
          'ytd-guide-entry-renderer:has(path[d^="m7.61 15.719.392-.22v"])',
        );
        stylesList.push(
          'ytd-mini-guide-entry-renderer:has(path[d^="m7.61 15.719.392-.22v"])',
        );
      }

      NOVA.css.push(stylesList.join(",\n") + `{ display: none !important; }`);
    }

    const thumbRemove = {
      shorts() {
        if (!user_settings.thumbs_hide_shorts) return;

        if (NOVA.currentPage == "channel" && NOVA.channelTab == "shorts")
          return;

        document.body
          .querySelectorAll('[is-shorts], a[href^="/shorts/"]')

          .forEach((el) => {
            if ((thumb = el.closest(thumbsSelectors))) {
              thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);

              thumb.style.border = "2px solid orange";
            }
          });
      },

      durationLimits() {
        if (!+user_settings.thumbs_hide_min_duration) return;

        const OVERLAYS_TIME_SELECTOR = "#thumbnail #overlays #text:not(:empty)";

        NOVA.waitSelector(OVERLAYS_TIME_SELECTOR).then(() => {
          document.body
            .querySelectorAll(OVERLAYS_TIME_SELECTOR)
            .forEach((el) => {
              if (
                (thumb = el.closest(thumbsSelectors)) &&
                (timeSec = NOVA.formatTime.hmsToSec(el.textContent.trim())) &&
                timeSec * (user_settings.rate_default || 1) <
                  (+user_settings.thumbs_hide_min_duration || 60)
              ) {
                thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);

                thumb.style.border = "2px solid aqua";
              }
            });
        });
      },

      premieres() {
        if (!user_settings.thumbs_hide_premieres) return;

        document.body
          .querySelectorAll(
            `#thumbnail #overlays [aria-label="Premiere"],
               #thumbnail #overlays [aria-label="Upcoming"]`,
          )

          .forEach((el) => {
            console.debug("el", el);
            if ((thumb = el.closest(thumbsSelectors))) {
              thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);

              thumb.style.border = "2px dashed limegreen";
            }
          });
      },

      live() {
        if (!user_settings.thumbs_hide_live) return;

        if (NOVA.currentPage == "channel" && NOVA.channelTab == "streams")
          return;

        const BLOCK_KEYWORDS = NOVA.strToArray(
          user_settings.thumbs_hide_live_channels_exception?.toLowerCase(),
        );

        document.body
          .querySelectorAll(
            `#thumbnail img[src*="_live.jpg"],
               #thumbnail [is-live-video],
               #thumbnail ~ * [aria-label="LIVE"],
               [class*="badge"] [class*="live-now"]`,
          )

          .forEach((el) => {
            if ((thumb = el.closest(thumbsSelectors))) {
              if (
                BLOCK_KEYWORDS?.includes(
                  thumb
                    .querySelector("#channel-name a")
                    ?.textContent.trim()
                    .toLowerCase(),
                )
              ) {
                if (user_settings["search-filter"]) {
                  thumb.style.display = "block";
                }
                thumb.style.border = "2px solid darkred";
                return;
              }

              thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);

              thumb.style.border = "2px dashed red";
            }
          });
      },

      streamed() {
        if (!user_settings.thumbs_hide_streamed) return;

        if (NOVA.currentPage == "channel" && NOVA.channelTab == "streams")
          return;

        const BLOCK_KEYWORDS = NOVA.strToArray(
          user_settings.thumbs_hide_live_channels_exception?.toLowerCase(),
        );

        document.body.querySelectorAll("#metadata").forEach((el) => {
          if (
            el
              .querySelector("#metadata-line > span:last-of-type")
              ?.textContent?.split(" ").length === 4 &&
            (thumb = el.closest(thumbsSelectors)) &&
            thumb.querySelector("#meta > #buttons:empty")
          ) {
            if (
              BLOCK_KEYWORDS?.includes(
                thumb
                  .querySelector("#channel-name a")
                  ?.textContent.trim()
                  .toLowerCase(),
              )
            ) {
              if (user_settings["search-filter"]) {
                thumb.style.display = "block";
              }
              thumb.style.border = "2px solid mediumvioletred";
              return;
            }

            thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);

            thumb.style.border = "2px dashed palevioletred";
          }
        });
      },

      mix() {
        if (!user_settings.thumbs_hide_mix) return;

        document.body
          .querySelectorAll(
            `a[href*="list="][href*="start_radio="]:not([hidden]),
               #video-title[title^="Mix -"]:not([hidden])`,
          )

          .forEach((el) => {
            if (
              (thumb = el.closest(
                "ytd-radio-renderer, ytd-compact-radio-renderer," +
                  thumbsSelectors,
              ))
            ) {
              thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);

              thumb.style.border = "2px dashed pink";
            }
          });
      },

      watched() {
        if (!user_settings.thumbs_hide_watched) return;

        if (!user_settings["thumbs-watched"]) return;

        const PERCENT_COMPLETE =
          +user_settings.thumbs_hide_watched_percent_complete || 90;

        document.body
          .querySelectorAll('#thumbnail #overlays #progress[style*="width"]')
          .forEach((el) => {
            if (
              parseInt(el.style.width) > PERCENT_COMPLETE &&
              (thumb = el.closest(thumbsSelectors))
            ) {
              thumb.classList.add(SELECTOR_THUMBS_HIDE_CLASS_NAME);

              thumb.style.border = "2px dashed violet";
            }
          });
      },
    };

    if (user_settings.thumbs_hide_mix) {
      NOVA.css.push(
        `ytd-radio-renderer {
               display: none !important;
            }`,
      );
    }
  },
  options: {
    thumbs_hide_shorts: {
      _tagName: "input",
      label: "Hide Shorts",

      "label:pl": "Ukryj YouTube Shorts",

      type: "checkbox",
    },
    thumbs_hide_min_duration: {
      _tagName: "input",
      label: "Min duration in sec (for regular video)",

      "label:pl": "Poniżej czasu trwania w sekundach",

      type: "number",

      title: "in sec / 0 - disable",

      placeholder: "60-3600",
      step: 1,
      min: 0,
      max: 3600,
      value: 0,
    },
    thumbs_hide_premieres: {
      _tagName: "input",
      label: "Hide Premieres/Upcoming",

      "label:pl": "Ukrywaj premiery",

      type: "checkbox",
      title: "Premiere Announcements",
    },
    thumbs_hide_live: {
      _tagName: "input",
      label: "Hide Live now streams",

      "label:pl": "Ukryj strumień (na żywo)",

      type: "checkbox",
      title: "Now airing",

      "title:pl": "Teraz wietrzenie",
    },
    thumbs_hide_live_channels_exception: {
      _tagName: "textarea",
      label: "Live channels exception",

      title: 'separator: "," or ";" or "new line"',

      "title:pl": 'separator: "," lub ";" lub "now linia"',

      placeholder: "channel1\nchannel2",
      "data-dependent": { thumbs_hide_live: true },
    },
    thumbs_hide_streamed: {
      _tagName: "input",
      label: "Hide finished streams",

      "label:pl": "Ukryj po streamie",

      type: "checkbox",

      "data-dependent": { thumbs_hide_live: true },
    },
    thumbs_hide_mix: {
      _tagName: "input",
      label: "Hide 'Mix' thumbnails",

      "label:pl": 'Ukryj miniaturki "Mix"',

      type: "checkbox",
      title: "[Mix] offers to rewatch what has already saw",

      "title:pl": "[Mix] proponuje ponowne obejrzenie już obejrzanych filmów",
    },
    thumbs_hide_watched: {
      _tagName: "input",
      label: "Hide watched",

      "label:pl": "Ukryj oglądane",

      type: "checkbox",

      title: "Need to Turn on [YouTube History]",
    },
    thumbs_hide_watched_percent_complete: {
      _tagName: "input",
      label: "Threshold percent",
      type: "number",
      title: "in %",

      placeholder: "%",
      step: 5,
      min: 5,
      max: 100,
      value: 90,
      "data-dependent": { thumbs_hide_watched: true },
    },
  },
});
window.nova_plugins.push({
  id: "thumbs-title-normalize",
  title: "Decapitalize thumbnails title",

  "title:pl": "Zmniejsz czcionkę w tytule miniatur",

  run_on_pages: "home, feed, channel, watch",

  section: "thumbs",
  desc: "Upper Case thumbnails title back to normal",

  _runtime: (user_settings) => {
    const VIDEO_TITLE_SELECTOR = [
        "#video-title",

        'a > [class*="media-item-headline"]',
      ].map((i) => i + ":not(:empty)"),
      MAX_CAPS_LETTERS =
        +user_settings.thumbs_title_normalize_smart_max_words || 2,
      ATTR_MARK = "nova-thumb-title-normalized",
      clearOfSymbols = (str) =>
        str.replace(/[\u2011-\u26FF]/g, " ").replace(/\s{2,}/g, " "),
      clearOfEmoji = (str) =>
        str
          .replace(/[^<>=\p{L}\p{N}\p{P}\p{Z}{\^\$}]/gu, " ")
          .replace(/\s{2,}/g, " ");

    if (user_settings["thumbs-title-lang"]) return;

    const UpperCaseLetterRegex = new RegExp(
      "([\-0-9A-ZÀ-ÖØ-ÞĀĂĄĆĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬĮİĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŘŚŜŞŠŢŤŦŨŪŬŮŰŲŴŶŸ-ŹŻŽƁ-ƂƄƆ-ƇƉ-ƋƎ-ƑƓ-ƔƖ-ƘƜ-ƝƟ-ƠƢƤƦ-ƧƩƬƮ-ƯƱ-ƳƵƷ-ƸƼǄǇǊǍǏǑǓǕǗǙǛǞǠǢǤǦǨǪǬǮǱǴǶ-ǸǺǼǾȀȂȄȆȈȊȌȎȐȒȔȖȘȚȜȞȠȢȤȦȨȪȬȮȰȲȺ-ȻȽ-ȾɁɃ-ɆɈɊɌɎͰͲͶΆΈ-ΊΌΎ-ΏΑ-ΡΣ-ΫϏϒ-ϔϘϚϜϞϠϢϤϦϨϪϬϮϴϷϹ-ϺϽ-ЯѠѢѤѦѨѪѬѮѰѲѴѶѸѺѼѾҀҊҌҎҐҒҔҖҘҚҜҞҠҢҤҦҨҪҬҮҰҲҴҶҸҺҼҾӀ-ӁӃӅӇӉӋӍӐӒӔӖӘӚӜӞӠӢӤӦӨӪӬӮӰӲӴӶӸӺӼӾԀԂԄԆԈԊԌԎԐԒԔԖԘԚԜԞԠԢԱ-Ֆ֊־٠-٩۰-۹߀-߉०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯๐-๙໐-໙༠-༩၀-၉႐-႙Ⴀ-Ⴥ០-៩᠆᠐-᠙᥆-᥏᧐-᧙᭐-᭙᮰-᮹᱀-᱉᱐-᱙ḀḂḄḆḈḊḌḎḐḒḔḖḘḚḜḞḠḢḤḦḨḪḬḮḰḲḴḶḸḺḼḾṀṂṄṆṈṊṌṎṐṒṔṖṘṚṜṞṠṢṤṦṨṪṬṮṰṲṴṶṸṺṼṾẀẂẄẆẈẊẌẎẐẒẔẞẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸỺỼỾἈ-ἏἘ-ἝἨ-ἯἸ-ἿὈ-ὍὙὛὝὟὨ-ὯᾸ-ΆῈ-ΉῘ-ΊῨ-ῬῸ-Ώ‐-―ℂℇℋ-ℍℐ-ℒℕℙ-ℝℤΩℨK-ℭℰ-ℳℾ-ℿⅅↃⰀ-ⰮⱠⱢ-ⱤⱧⱩⱫⱭ-ⱯⱲⱵⲀⲂⲄⲆⲈⲊⲌⲎⲐⲒⲔⲖⲘⲚⲜⲞⲠⲢⲤⲦⲨⲪⲬⲮⲰⲲⲴⲶⲸⲺⲼⲾⳀⳂⳄⳆⳈⳊⳌⳎⳐⳒⳔⳖⳘⳚⳜⳞⳠⳢ⸗⸚〜〰゠꘠-꘩ꙀꙂꙄꙆꙈꙊꙌꙎꙐꙒꙔꙖꙘꙚꙜꙞꙢꙤꙦꙨꙪꙬꚀꚂꚄꚆꚈꚊꚌꚎꚐꚒꚔꚖꜢꜤꜦꜨꜪꜬꜮꜲꜴꜶꜸꜺꜼꜾꝀꝂꝄꝆꝈꝊꝌꝎꝐꝒꝔꝖꝘꝚꝜꝞꝠꝢꝤꝦꝨꝪꝬꝮꝹꝻꝽ-ꝾꞀꞂꞄꞆꞋ꣐-꣙꤀-꤉꩐-꩙︱-︲﹘﹣－０-９Ａ-Ｚ]|\ud801[\udc00-\udc27\udca0-\udca9]|\ud835[\udc00-\udc19\udc34-\udc4d\udc68-\udc81\udc9c\udc9e-\udc9f\udca2\udca5-\udca6\udca9-\udcac\udcae-\udcb5\udcd0-\udce9\udd04-\udd05\udd07-\udd0a\udd0d-\udd14\udd16-\udd1c\udd38-\udd39\udd3b-\udd3e\udd40-\udd44\udd46\udd4a-\udd50\udd6c-\udd85\udda0-\uddb9\uddd4-\udded\ude08-\ude21\ude3c-\ude55\ude70-\ude89\udea8-\udec0\udee2-\udefa\udf1c-\udf34\udf56-\udf6e\udf90-\udfa8\udfca\udfce-\udfff]){2,}",
      "g",
    );

    NOVA.css.push(
      {
        "text-transform": "uppercase",
      },
      VIDEO_TITLE_SELECTOR.map((e) => `${e}[${ATTR_MARK}]::first-letter`),
      "important",
    );

    NOVA.watchElements({
      selectors: VIDEO_TITLE_SELECTOR,
      attr_mark: ATTR_MARK,
      callback: async (videoTitleEl) => {
        if (NOVA.currentPage == "results") return;
        let countCaps = 0;

        if (user_settings.thumbs_title_clear_emoji) {
          videoTitleEl.textContent = clearOfEmoji(
            videoTitleEl.innerText,
          ).trim();
        }

        if (user_settings.thumbs_title_clear_symbols) {
          videoTitleEl.textContent = clearOfSymbols(
            videoTitleEl.innerText,
          ).trim();
        }

        const normalizedText = videoTitleEl.innerText.replace(
          UpperCaseLetterRegex,
          (match) => {
            ++countCaps;

            return /\d/.test(match) ||
              (match.length === 1 && /[A-Z]/.test(match)) ||
              (match.length < 5 &&
                match.length > 1 &&
                [
                  "HD",
                  "UHD",
                  "USB",
                  "TV",
                  "CPU",
                  "GPU",
                  "APU",
                  "AMD",
                  "XT",
                  "RX",
                  "GTX",
                  "RTX",
                  "GT",
                  "FX",
                  "SE",
                  "HP",
                  "SSD",
                  "RAM",
                  "PC",
                  "FPS",
                  "RDNA",
                  "FSR",
                  "DLSS",
                  "MSI",
                  "VR",
                  "GOTY",
                  "AAA",
                  "UI",
                  "BBC",
                  "WWE",
                  "OS",
                  "OP",
                  "ED",
                  "MV",
                  "PV",
                  "OST",
                  "NCS",
                  "BGM",
                  "EDM",
                  "GMV",
                  "AMV",
                  "MMD",
                  "MAD",
                  "SQL",
                  "CAPS",
                ].includes(match)) ||
              (match.length < 5 &&
                /(M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))/i.test(
                  match,
                ))
              ? match
              : match.toLowerCase();
          },
        );

        if (
          countCaps > MAX_CAPS_LETTERS ||
          (countCaps > 1 && normalizedText.split(/\s+/).length === countCaps)
        ) {
          videoTitleEl.innerText = normalizedText;
        }
      },
    });

    document.addEventListener("yt-action", (evt) => {
      if (evt.detail?.actionName == "yt-chip-cloud-chip-select-action") {
        window.addEventListener("transitionend", restoreTitle, {
          capture: true,
          once: true,
        });
      }
    });
    function restoreTitle() {
      const selectorOldTitle = "#video-title-link[title]";
      if (NOVA.channelTab == "videos") {
        document.body
          .querySelectorAll(
            `${selectorOldTitle} ${VIDEO_TITLE_SELECTOR}[${ATTR_MARK}]`,
          )

          .forEach((el) => {
            if ((oldTitle = el.closest(selectorOldTitle)?.title)) {
              el.innerText = oldTitle;
              el.removeAttribute(ATTR_MARK);
            }
          });
      }
    }
  },
  options: {
    thumbs_title_normalize_smart_max_words: {
      _tagName: "input",
      label: "Max words in uppercase",

      "label:pl": "Maksymalna liczba słów pisanych wielkimi literami",

      type: "number",

      placeholder: "1-10",
      min: 1,
      max: 10,
      value: 2,
    },
    thumbs_title_clear_emoji: {
      _tagName: "input",
      label: "Remove emoji",

      "label:pl": "Usuń emoji",

      type: "checkbox",
    },
    thumbs_title_clear_symbols: {
      _tagName: "input",
      label: "Remove symbols",

      type: "checkbox",
    },
  },
});
console.log(
  "%c /• %s •/",
  "color:#0096fa; font-weight:bold;",
  GM_info.script.name + " v." + GM_info.script.version,
);

const configPage = "https://raingart.github.io/nova/",
  configStoreName = "user_settings",
  user_settings = GM_getValue(configStoreName, {});

actualizeStorageVer();

if (user_settings?.exclude_iframe && window.self !== window.top) {
  return console.warn(
    GM_info.script.name + ": processed in the iframe disable",
  );
}

registerMenuCommand();

if (location.hostname === new URL(configPage).hostname) setupConfigPage();
else {
  if (
    window.self !== window.top &&
    !location.pathname.startsWith("/embed") &&
    !location.pathname.startsWith("/live_chat")
  ) {
    return console.warn("iframe skiped:", location.pathname);
  }

  if (!user_settings?.disable_setting_button) insertSettingButton();

  if (!user_settings || !Object.keys(user_settings).length) {
    if (confirm("Active plugins undetected. Open the settings page now?"))
      window.open(configPage, "_blank");

    user_settings["report_issues"] = "on";
    GM_setValue(configStoreName, user_settings);
  } else {
    appLander();

    const exportedSettings = Object.assign({}, user_settings);
    delete exportedSettings["user-api-key"];
    delete exportedSettings["sponsor_block"];
    delete exportedSettings["sponsor_block_category"];
    delete exportedSettings["sponsor_block_url"];
    delete exportedSettings["thumbs_filter_title_blocklist"];
    delete exportedSettings["search_filter_channels_blocklist"];
    delete exportedSettings["thumbs_hide_live_channels_exception"];
    delete exportedSettings["comments_sort_blocklist"];
    delete exportedSettings["download_video_mode"];
    delete exportedSettings["video_unblock_region_domain"];
    unsafeWindow.window.nova_settings = exportedSettings;
  }
}

function setupConfigPage() {
  document.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      let obj = {};
      for (const [key, value] of new FormData(event.target)) {
        if (obj.hasOwnProperty(key)) {
          obj[key] += "," + value;
          obj[key] = obj[key].split(",");
        } else {
          switch (value) {
            case "true":
              obj[key] = true;
              break;
            case "false":
              obj[key] = false;
              break;

            case "undefined":
              delete obj[key];
              break;
            default:
              obj[key] = value;
          }
        }
      }

      console.debug(`update ${configStoreName}:`, obj);
      GM_setValue(configStoreName, obj);
    },
    { capture: true },
  );

  window.addEventListener("DOMContentLoaded", () => {
    localizePage(user_settings?.lang_code);

    document.body
      .querySelector('a[href$="issues/new"]')
      .addEventListener("click", ({ target }) => {
        target.href +=
          "?body=" +
          encodeURIComponent(
            GM_info.script.version + " | " + navigator.userAgent,
          ) +
          "&labels=bug&template=bug_report.md";
      });
  });

  window.addEventListener("load", () => {
    document.dispatchEvent(
      new CustomEvent("settings-sync", {
        bubbles: true,
        detail: {
          plugins: window.nova_plugins.map((obj) => {
            obj._runtime = function () {};
            return obj;
          }),
          settings: user_settings,
        },
      }),
    );
  });
}

function appLander() {
  if (document.readyState == "loading") {
    document.addEventListener("DOMContentLoaded", appRun);
  } else {
    appRun();
  }

  let prevURL = document.URL;
  const isURLChanged = () =>
    prevURL == document.URL ? false : (prevURL = document.URL);

  if ((isMobile = location.host == "m.youtube.com")) {
    window.addEventListener(
      "transitionend",
      ({ target }) => target.id == "progress" && isURLChanged() && appRun(),
    );
  } else {
    document.addEventListener(
      "yt-navigate-start",
      () => isURLChanged() && appRun(),
    );
    window.addEventListener("popstate", () => isURLChanged() && appRun());

    document.addEventListener("yt-action", reloadAfterMiniplayer);
    function reloadAfterMiniplayer(evt) {
      if (
        location.pathname == "/watch" &&
        evt.detail?.actionName == "yt-cache-miniplayer-page-action" &&
        isURLChanged()
      ) {
        document.removeEventListener("yt-action", reloadAfterMiniplayer);
        appRun();
      }
    }
  }

  function appRun() {
    console.groupCollapsed("plugins status");

    Plugins.run({
      user_settings: user_settings,
      app_ver: GM_info.script.version,
    });
  }
}

function registerMenuCommand() {
  GM_registerMenuCommand("Settings", () => window.open(configPage, "_blank"));

  GM_registerMenuCommand("Import settings", () => {
    if ((json = JSON.parse(prompt("Enter json file context")))) {
      saveImportSettings(json);
    } else if (confirm("Import via file?")) {
      const f = document.createElement("input");
      f.type = "file";
      f.accept = "application/JSON";
      f.style.display = "none";
      f.addEventListener("change", function () {
        if (f.files.length !== 1) return alert("file empty");
        const rdr = new FileReader();
        rdr.addEventListener("load", function () {
          try {
            saveImportSettings(JSON.parse(rdr.result));
          } catch (err) {
            alert(`Error parsing settings\n${err.name}: ${err.message}`);
          }
        });
        rdr.addEventListener("error", (error) =>
          alert("Error loading file\n" + rdr?.error || error),
        );
        rdr.readAsText(f.files[0]);
      });
      document.body.append(f);
      f.click();
      f.remove();
    }

    function saveImportSettings(json) {
      GM_setValue(configStoreName, json);
      actualizeStorageVer();

      alert("Settings imported!");
      location.reload();
    }
  });
  GM_registerMenuCommand("Export settings", () => {
    const d = document.createElement("a");
    d.style.display = "none";
    d.download = "nova-backup.json";
    d.href =
      "data:text/plain;charset=utf-8," +
      encodeURIComponent(JSON.stringify(user_settings));
    document.body.append(d);
    d.click();
    d.remove();
  });
}

function actualizeStorageVer() {
  if (GM_info.script.version == user_settings?.ver) return;

  user_settings.ver = GM_info.script.version;

  renameStorageKeys({
    disable_in_frame: "exclude_iframe",
    "custom-api-key": "user-api-key",
    "shorts-disable": "thumbs_hide_shorts",
    shorts_disable: "thumbs_hide_shorts",
    "premiere-disable": "thumbs_hide_premieres",
    "premieres-disable": "thumbs_hide_premieres",
    premieres_disable: "thumbs_hide_premieres",
    thumbs_min_duration: "thumbs_hide_min_duration",
    shorts_disable_min_duration: "thumbs_hide_min_duration",
    "streams-disable": "thumbs_hide_live",
    streams_disable: "thumbs_hide_live",
    live_disable: "thumbs_hide_live",
    "thumbnails-mix-hide": "thumbs_hide_mix",
    thumb_mix_disable: "thumbs_hide_mix",
    mix_disable: "thumbs_hide_mix",
    player_fullscreen_mode_exit: "player_fullscreen_mode_onpause",
    "subtitle-transparent": "subtitle_transparent",
    "video-description-expand": "description-expand",
    video_quality_in_music: "video_quality_in_music_playlist",
    player_float_progress_bar_color: "player_progress_bar_color",
    "header-short": "header-compact",
    "player-buttons-custom": "player-quick-buttons",
    shorts_thumbnails_time: "shorts-thumbnails-time",
    "comments-sidebar-position-exchange": "move-in-sidebar",
    comments_sidebar_position_exchange_target: "move_in_sidebar_target",
    streamed_disable_channel_exception: "thumbs_hide_live_channels_exception",
    streamed_disable_channels_exception: "thumbs_hide_live_channels_exception",
    video_quality_in_music_quality: "video_quality_for_music",
    volume_normalization: "volume_loudness_normalization",
    button_no_labels_opacity: "details_buttons_opacity",
    details_button_no_labels_opacity: "details_buttons_opacity",
    "button-no-labels": "details_buttons_label_hide",
    details_button_no_labels: "details_buttons_label_hide",
    "volume-wheel": "video-volume",
    "rate-wheel": "video-rate",
    "video-stop-preload": "video-autostop",
    stop_preload_ignore_playlist: "video_autostop_ignore_playlist",
    stop_preload_ignore_live: "video_autostop_ignore_live",
    stop_preload_embed: "video_autostop_embed",
    "disable-video-cards": "pages-clear",
    volume_level_default: "volume_default",
    thumb_filter_title_blocklist: "thumbs_filter_title_blocklist",
    search_filter_channel_blocklist: "search_filter_channels_blocklist",
    streamed_disable: "thumbs_hide_streamed",
    watched_disable: "thumbs_hide_watched",
    watched_disable_percent_complete: "thumbs_hide_watched_percent_complete",
    "sidebar-channel-links-patch": "sidebar-thumbs-channel-link-patch",
    "move-in-sidebar": "move-to-sidebar",
    move_in_sidebar_target: "move_to_sidebar_target",
    skip_into_step: "skip_into_sec",
    "miniplayer-disable": "default-miniplayer-disable",
    thumbnails_title_normalize_show_full: "thumbs_title_show_full",
    thumbnails_title_normalize_smart_max_words:
      "thumbs_title_normalize_smart_max_words",
    thumbnails_title_clear_emoji: "thumbs_title_clear_emoji",
    thumbnails_title_clear_symbols: "thumbs_title_clear_symbols",
    "thumbnails-clear": "thumbs-clear",
    thumbnails_clear_preview_timestamp: "thumbs_clear_preview_timestamp",
    thumbnails_clear_overlay: "thumbs_clear_overlay",
    "thumbnails-grid-count": "thumbs-grid-count",
    thumbnails_grid_count: "thumbs_grid_count",
    "thumbnails-watched": "thumbs-watched",
    thumbnails_watched_frame_color: "thumbs_watched_frame_color",
    thumbnails_watched_title: "thumbs_watched_title",
    thumbnails_watched_title_color: "thumbs_watched_title_color",
    "details-buttons": "details-buttons-visibility",
    comments_sort_words_blocklist: "comments_sort_blocklist",
    "thumbnails-title-normalize": "thumbs-title-normalize",
    time_remaining_mode: "time_remaining_format",
    player_buttons_custom_screenshot: "player_buttons_custom_screenshot_format",
    "description-popup": "description-dropdown",
    "comments-popup": "comments-dropdown",
    comments_popup_width: "comments_dropdown_width",
    comments_popup_hide_textarea: "comments_dropdown_hide_textarea",
    thumbs_title_show_full: "thumbs-title-show-full",
  });

  GM_setValue(configStoreName, user_settings);

  function renameStorageKeys(key_template_obj = required()) {
    for (const oldKey in user_settings) {
      if ((newKey = key_template_obj[oldKey])) {
        console.log("store key rename:", oldKey, "=>", newKey);
        user_settings[newKey] = user_settings[oldKey];
        delete user_settings[oldKey];
      }
    }
  }
}

function insertSettingButton() {
  NOVA.waitSelector("#masthead #end").then((menu) => {
    const btn = document.createElement("a"),
      title = "Nova Settings",
      SETTING_BTN_ID = "nova_settings_button";

    btn.id = SETTING_BTN_ID;

    btn.href = configPage;
    btn.target = "_blank";

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
            </yt-icon-button>`,
    );

    Object.assign(btn.style, {
      "font-size": "24px",
      color: "deepskyblue",
      "text-decoration": "none",
      padding: "0 10px",
    });
    btn.addEventListener("click", null, { capture: true });

    btn.title = title;
    const tooltip = document.createElement("tp-yt-paper-tooltip");
    tooltip.classList.add("style-scope", "ytd-topbar-menu-button-renderer");

    tooltip.textContent = title;
    btn.append(tooltip);

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

            }`,
    );

    menu.prepend(btn);
  });
}

function _pluginsCaptureException({
  trace_name,
  err_stack,
  confirm_msg,
  app_ver,
}) {
  if (
    confirm(
      confirm_msg ||
        `Error in ${GM_info.script.name}. Send the bug raport to developer?`,
    )
  ) {
    openBugReport();
  }

  function openBugReport() {
    window.open(
      "https://docs.google.com/forms/u/0/d/e/1FAIpQLScfpAvLoqWlD5fO3g-fRmj4aCeJP9ZkdzarWB8ge8oLpE5Cpg/viewform" +
        "?entry.35504208=" +
        encodeURIComponent(trace_name) +
        "&entry.151125768=" +
        encodeURIComponent(err_stack) +
        "&entry.744404568=" +
        encodeURIComponent(document.URL) +
        "&entry.1416921320=" +
        encodeURIComponent(
          app_ver +
            " | " +
            navigator.userAgent +
            " [" +
            window.navigator.language +
            "]",
        ),

      "_blank",
    );
  }
}

user_settings.report_issues &&
  window.addEventListener("unhandledrejection", (err) => {
    if (
      (err.reason?.stack || err.stack)?.includes("Nova") &&
      !(err.reason?.stack || err.stack)?.includes("movie_player is not defined")
    ) {
      console.error(
        "[ERROR PROMISE]\n",
        err.reason,
        "\nPlease report the bug: https://github.com/raingart/Nova-YouTube-extension/issues/new?body=" +
          encodeURIComponent(
            GM_info.script.version + " | " + navigator.userAgent,
          ),
      ) + "&labels=bug&template=bug_report.md&title=unhandledrejection";

      _pluginsCaptureException({
        trace_name: "unhandledRejection",
        err_stack: err.reason.stack || err.stack,
        app_ver: GM_info.script.version,
        confirm_msg: `Failure when async-call of one "${GM_info.script.name}" plugin.\nDetails in the console\n\nOpen tab to report the bug?`,
      });
    }
  });
