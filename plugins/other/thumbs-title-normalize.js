window.nova_plugins.push({
   id: 'thumbnails-title-normalize',
   title: 'Decapitalize thumbnails title',
   'title:zh': '从大写中删除缩略图标题',
   'title:ja': 'サムネイルのタイトルを大文字から外す',
   'title:ko': '썸네일 제목을 대문자로',
   'title:es': 'Descapitalizar el título de las miniaturas',
   'title:pt': 'Decapitalize o título das miniaturas',
   'title:fr': 'Démajuscule le titre des vignettes',
   'title:tr': 'Küçük resim başlığının büyük harflerini kaldır',
   'title:de': 'Thumbnails-Titel entfernen',
   run_on_pages: 'home, feed, channel, watch, -results',
   // run_on_pages: 'home, results, feed, channel, watch',
   // run_on_pages: 'all, -embed, -results',
   section: 'other',
   // desc: '',
   _runtime: user_settings => {

      const
         VIDEO_TITLE_SELECTOR = '#video-title:not(:empty):not([hidden]), a > h3.large-media-item-headline:not(:empty):not([hidden])', // '.title';
         MAX_TITLE_WORDS = +user_settings.thumbnails_title_normalize_smart_max_words || 2,
         ATTR_MARK = 'title-normalized';

      // dirty fix bug with not updating thumbnails
      document.addEventListener('yt-navigate-finish', () =>
         document.querySelectorAll(`[${ATTR_MARK}]`).forEach(e => e.removeAttribute(ATTR_MARK)));

      if (user_settings.thumbnails_title_normalize_show_full) {
         NOVA.css.push(
            VIDEO_TITLE_SELECTOR + `{
               display: block !important;
               max-height: unset !important;
            }`);
      }

      if (user_settings.thumbnails_title_normalize_smart) {
         // Letters (Lu): Upper case letter unicode - https://apps.timwhitlock.info/js/regex
         const UpperCaseLetterRegex = new RegExp("([A-ZÀ-ÖØ-ÞĀĂĄĆĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬĮİĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŘŚŜŞŠŢŤŦŨŪŬŮŰŲŴŶŸ-ŹŻŽƁ-ƂƄƆ-ƇƉ-ƋƎ-ƑƓ-ƔƖ-ƘƜ-ƝƟ-ƠƢƤƦ-ƧƩƬƮ-ƯƱ-ƳƵƷ-ƸƼǄǇǊǍǏǑǓǕǗǙǛǞǠǢǤǦǨǪǬǮǱǴǶ-ǸǺǼǾȀȂȄȆȈȊȌȎȐȒȔȖȘȚȜȞȠȢȤȦȨȪȬȮȰȲȺ-ȻȽ-ȾɁɃ-ɆɈɊɌɎͰͲͶΆΈ-ΊΌΎ-ΏΑ-ΡΣ-ΫϏϒ-ϔϘϚϜϞϠϢϤϦϨϪϬϮϴϷϹ-ϺϽ-ЯѠѢѤѦѨѪѬѮѰѲѴѶѸѺѼѾҀҊҌҎҐҒҔҖҘҚҜҞҠҢҤҦҨҪҬҮҰҲҴҶҸҺҼҾӀ-ӁӃӅӇӉӋӍӐӒӔӖӘӚӜӞӠӢӤӦӨӪӬӮӰӲӴӶӸӺӼӾԀԂԄԆԈԊԌԎԐԒԔԖԘԚԜԞԠԢԱ-ՖႠ-ჅḀḂḄḆḈḊḌḎḐḒḔḖḘḚḜḞḠḢḤḦḨḪḬḮḰḲḴḶḸḺḼḾṀṂṄṆṈṊṌṎṐṒṔṖṘṚṜṞṠṢṤṦṨṪṬṮṰṲṴṶṸṺṼṾẀẂẄẆẈẊẌẎẐẒẔẞẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸỺỼỾἈ-ἏἘ-ἝἨ-ἯἸ-ἿὈ-ὍὙὛὝὟὨ-ὯᾸ-ΆῈ-ΉῘ-ΊῨ-ῬῸ-Ώℂℇℋ-ℍℐ-ℒℕℙ-ℝℤΩℨK-ℭℰ-ℳℾ-ℿⅅↃⰀ-ⰮⱠⱢ-ⱤⱧⱩⱫⱭ-ⱯⱲⱵⲀⲂⲄⲆⲈⲊⲌⲎⲐⲒⲔⲖⲘⲚⲜⲞⲠⲢⲤⲦⲨⲪⲬⲮⲰⲲⲴⲶⲸⲺⲼⲾⳀⳂⳄⳆⳈⳊⳌⳎⳐⳒⳔⳖⳘⳚⳜⳞⳠⳢꙀꙂꙄꙆꙈꙊꙌꙎꙐꙒꙔꙖꙘꙚꙜꙞꙢꙤꙦꙨꙪꙬꚀꚂꚄꚆꚈꚊꚌꚎꚐꚒꚔꚖꜢꜤꜦꜨꜪꜬꜮꜲꜴꜶꜸꜺꜼꜾꝀꝂꝄꝆꝈꝊꝌꝎꝐꝒꝔꝖꝘꝚꝜꝞꝠꝢꝤꝦꝨꝪꝬꝮꝹꝻꝽ-ꝾꞀꞂꞄꞆꞋＡ-Ｚ]|\ud801[\udc00-\udc27]|\ud835[\udc00-\udc19\udc34-\udc4d\udc68-\udc81\udc9c\udc9e-\udc9f\udca2\udca5-\udca6\udca9-\udcac\udcae-\udcb5\udcd0-\udce9\udd04-\udd05\udd07-\udd0a\udd0d-\udd14\udd16-\udd1c\udd38-\udd39\udd3b-\udd3e\udd40-\udd44\udd46\udd4a-\udd50\udd6c-\udd85\udda0-\uddb9\uddd4-\udded\ude08-\ude21\ude3c-\ude55\ude70-\ude89\udea8-\udec0\udee2-\udefa\udf1c-\udf34\udf56-\udf6e\udf90-\udfa8\udfca]){2,}", 'g');

         // first letter uppercase
         NOVA.css.push({
            'text-transform': 'uppercase',
            // color: '#8A2BE2', // indicator
         }, `[${ATTR_MARK}]:first-letter`, 'important');

         NOVA.watchElement({
            selectors: VIDEO_TITLE_SELECTOR,
            attr_mark: ATTR_MARK,
            callback: title => {
               let counterUpperCase = 0;
               const normalizedText = title.textContent.replace(UpperCaseLetterRegex, match => {
                  // console.debug('match', match);
                  counterUpperCase++;
                  return match.toLowerCase();
               });

               // Upper case
               if (counterUpperCase > MAX_TITLE_WORDS) {
                  title.textContent = normalizedText.trim();
                  // console.debug('normalize:', counterUpperCase, '\n' + title.title, '\n' + title.textContent);
               }
            }
         });

      } else {
         NOVA.css.push(
            VIDEO_TITLE_SELECTOR + ` {
               text-transform: lowercase !important;
            }

            ${VIDEO_TITLE_SELECTOR}:first-letter {
               text-transform: uppercase !important;
            }`);
      }

   },
   options: {
      thumbnails_title_normalize_show_full: {
         _tagName: 'input',
         label: 'Show full title',
         'label:zh': '显示完整标题',
         'label:ja': '完全なタイトルを表示',
         'label:ko': '전체 제목 표시',
         'label:es': 'Mostrar título completo',
         'label:pt': 'Mostrar título completo',
         'label:fr': 'Afficher le titre complet',
         'label:tr': 'Tam başlığı göster',
         'label:de': 'Vollständigen Titel anzeigen',
         type: 'checkbox'
      },
      thumbnails_title_normalize_smart: {
         _tagName: 'input',
         label: 'Smart mode',
         'label:zh': '智能模式',
         'label:ja': 'Smart モード',
         'label:ko': '스마트 모드',
         'label:es': 'Modo inteligente',
         'label:pt': 'Modo inteligente',
         'label:fr': 'Mode intelligent',
         'label:tr': 'Akıllı mod',
         'label:de': 'Smart-Modus',
         type: 'checkbox',
         title: 'Filter words by regex pattern',
         'title:ja': '正規表現パターンで単語をフィルタリングする',
         'title:zh': '按正则表达式过滤单词',
         'title:ko': '정규식 패턴으로 단어 필터링',
         'title:es': 'Filtrar palabras por patrón de expresiones regulares',
         'title:pt': 'Filtrar palavras por padrão regex',
         'title:fr': 'Filtrer les mots par modèle regex',
         'title:tr': 'Kelimeleri normal ifade kalıbına göre filtrele',
         'title:de': 'Wörter nach Regex-Muster filtern',
      },
      thumbnails_title_normalize_smart_max_words: {
         _tagName: 'input',
         label: 'Uppercase word limit',
         'label:zh': '大写字数限制',
         'label:ja': '大文字の単語制限',
         'label:ko': '대문자 단어 제한',
         'label:es': 'Límite de palabras en mayúsculas',
         'label:pt': 'Limite de palavras maiúsculas',
         'label:fr': 'Limite de mots en majuscules',
         'label:tr': 'Büyük harfli kelime sınırı',
         'label:de': 'Wortbeschränkung in Großbuchstaben',
         type: 'number',
         // title: '',
         placeholder: '1-10',
         min: 1,
         max: 10,
         value: 2,
         'data-dependent': '{"thumbnails_title_normalize_smart":"true"}',
      },
   }
});
