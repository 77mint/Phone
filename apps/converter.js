(function () {
  var root = document.getElementById('app-converter');
  if (!root) return;

  var CFG_KEY = 'phone_converter_cfg_v1';
  var cfg = loadCfg();
  var currentTab = 'image'; // 'image' | 'font' | 'novel'
  var currentMode = cfg.mode === 'github' ? 'github' : 'catbox';
  var novelMode = 'epub2txt'; // 'epub2txt' | 'txt2epub' | 'txtfix'
  var qualityVal = cfg.quality || 85;
  var customFontName = cfg.fontName || '';
  var lastImageResult = null;
  var lastFontResult = null;
  var lastNovelResult = null;
  var isBusy = false;

  function loadCfg() {
    try {
      var obj = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function saveCfg() {
    cfg.mode = currentMode;
    cfg.quality = qualityVal;
    cfg.fontName = customFontName;
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function modeLabel(mode, isFont) {
    if (mode === 'github') return '个人 GitHub';
    return isFont ? '公共托管' : '公共图床';
  }

  function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var chunkSize = 0x8000;
    var chunks = [];
    for (var i = 0; i < bytes.length; i += chunkSize) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize)));
    }
    return btoa(chunks.join(''));
  }

  function strToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('cvToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2200);
  }

  function copyText(text, label) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('已复制' + (label || '内容'));
      }).catch(function () {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('已复制' + (label || '内容'));
    } catch (e) {
      showToast('复制失败，请手动长按复制');
    }
    document.body.removeChild(ta);
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ====== 原生 ZIP 读写 + EPUB / TXT 转换（零外部依赖） ====== */
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function inflateRaw(u8) {
    if (typeof DecompressionStream === 'undefined') {
      return Promise.reject(new Error('当前浏览器不支持解压 EPUB'));
    }
    var ds = new DecompressionStream('deflate-raw');
    var writer = ds.writable.getWriter();
    writer.write(u8);
    writer.close();
    return new Response(ds.readable).arrayBuffer().then(function (ab) {
      return new Uint8Array(ab);
    });
  }

  function readZipEntries(buffer) {
    var bytes = new Uint8Array(buffer);
    var dv = new DataView(buffer);
    var eocdOffset = -1;
    var minOff = Math.max(0, bytes.length - 65557);
    for (var i = bytes.length - 22; i >= minOff; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset === -1) return Promise.reject(new Error('不是有效的 EPUB/ZIP 文件'));

    var totalEntries = dv.getUint16(eocdOffset + 10, true);
    var cdOffset = dv.getUint32(eocdOffset + 16, true);
    var pos = cdOffset;
    var entries = [];

    for (var idx = 0; idx < totalEntries; idx++) {
      if (pos + 46 > bytes.length || dv.getUint32(pos, true) !== 0x02014b50) break;
      var method = dv.getUint16(pos + 10, true);
      var compSize = dv.getUint32(pos + 20, true);
      var fnLen = dv.getUint16(pos + 28, true);
      var exLen = dv.getUint16(pos + 30, true);
      var cmLen = dv.getUint16(pos + 32, true);
      var localOff = dv.getUint32(pos + 42, true);
      var name = new TextDecoder('utf-8').decode(bytes.subarray(pos + 46, pos + 46 + fnLen));
      entries.push({ name: name, method: method, compSize: compSize, localOff: localOff });
      pos += 46 + fnLen + exLen + cmLen;
    }

    var map = {};
    var tasks = entries.map(function (ent) {
      if (ent.name.endsWith('/')) return Promise.resolve();
      var lFnLen = dv.getUint16(ent.localOff + 26, true);
      var lExLen = dv.getUint16(ent.localOff + 28, true);
      var dataStart = ent.localOff + 30 + lFnLen + lExLen;
      var slice = bytes.subarray(dataStart, dataStart + ent.compSize);
      if (ent.method === 0) {
        map[ent.name] = slice;
        return Promise.resolve();
      }
      if (ent.method === 8) {
        return inflateRaw(slice).then(function (out) {
          map[ent.name] = out;
        }).catch(function () {});
      }
      return Promise.resolve();
    });

    return Promise.all(tasks).then(function () { return map; });
  }

  function buildZipBlob(files) {
    var enc = new TextEncoder();
    var localParts = [];
    var cdParts = [];
    var offset = 0;

    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var dataBytes = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      var c = crc32(dataBytes);

      var lfh = new Uint8Array(30 + nameBytes.length);
      var ldv = new DataView(lfh.buffer);
      ldv.setUint32(0, 0x04034b50, true);
      ldv.setUint16(4, 20, true);
      ldv.setUint16(8, 0, true);
      ldv.setUint32(14, c, true);
      ldv.setUint32(18, dataBytes.length, true);
      ldv.setUint32(22, dataBytes.length, true);
      ldv.setUint16(26, nameBytes.length, true);
      lfh.set(nameBytes, 30);

      localParts.push(lfh, dataBytes);

      var cdh = new Uint8Array(46 + nameBytes.length);
      var cdv = new DataView(cdh.buffer);
      cdv.setUint32(0, 0x02014b50, true);
      cdv.setUint16(4, 20, true);
      cdv.setUint16(6, 20, true);
      cdv.setUint16(10, 0, true);
      cdv.setUint32(16, c, true);
      cdv.setUint32(20, dataBytes.length, true);
      cdv.setUint32(24, dataBytes.length, true);
      cdv.setUint16(28, nameBytes.length, true);
      cdv.setUint32(42, offset, true);
      cdh.set(nameBytes, 46);

      cdParts.push(cdh);
      offset += lfh.length + dataBytes.length;
    });

    var cdSize = cdParts.reduce(function (s, a) { return s + a.length; }, 0);
    var eocd = new Uint8Array(22);
    var edv = new DataView(eocd.buffer);
    edv.setUint32(0, 0x06054b50, true);
    edv.setUint16(8, files.length, true);
    edv.setUint16(10, files.length, true);
    edv.setUint32(12, cdSize, true);
    edv.setUint32(16, offset, true);

    return new Blob(localParts.concat(cdParts, [eocd]), { type: 'application/epub+zip' });
  }

  function decodeTextSmart(buffer) {
    var u8 = new Uint8Array(buffer);
    if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
      return { text: new TextDecoder('utf-8').decode(u8.subarray(3)), encoding: 'UTF-8' };
    }
    var utf8 = new TextDecoder('utf-8', { fatal: false }).decode(u8);
    var badCount = (utf8.match(/\uFFFD/g) || []).length;
    if (badCount > 3) {
      try {
        return { text: new TextDecoder('gb18030').decode(u8), encoding: 'GBK/GB18030' };
      } catch (e) {}
    }
    return { text: utf8, encoding: 'UTF-8' };
  }

  function extractHtmlText(htmlStr) {
    var doc = new DOMParser().parseFromString(htmlStr, 'text/html');
    var body = doc.body;
    if (!body) return '';
    body.querySelectorAll('script,style,nav').forEach(function (el) { el.remove(); });
    var blocks = body.querySelectorAll('h1,h2,h3,h4,p,div,li,blockquote');
    var lines = [];
    if (blocks.length) {
      blocks.forEach(function (el) {
        if (el.querySelector('p,div,h1,h2,h3,h4,li')) return;
        var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t) lines.push(t);
      });
    }
    if (!lines.length) {
      var raw = (body.textContent || '').replace(/\r/g, '');
      lines = raw.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    return lines.join('\n\n');
  }

  function resolvePath(baseDir, relPath) {
    var full = (baseDir ? baseDir + '/' : '') + relPath;
    var parts = full.split('/');
    var stack = [];
    parts.forEach(function (p) {
      if (!p || p === '.') return;
      if (p === '..') stack.pop();
      else stack.push(p);
    });
    return stack.join('/');
  }

  function convertEpubToTxt(file) {
    return file.arrayBuffer().then(readZipEntries).then(function (filesMap) {
      var dec = new TextDecoder('utf-8');
      var opfPath = '';
      if (filesMap['META-INF/container.xml']) {
        var cXml = dec.decode(filesMap['META-INF/container.xml']);
        var m = cXml.match(/full-path=["']([^"']+)["']/i);
        if (m) opfPath = m[1];
      }
      if (!opfPath) {
        opfPath = Object.keys(filesMap).find(function (k) { return /\.opf$/i.test(k); }) || '';
      }

      var chapterPaths = [];
      var bookTitle = file.name.replace(/\.epub$/i, '');

      if (opfPath && filesMap[opfPath]) {
        var opfStr = dec.decode(filesMap[opfPath]);
        var opfDoc = new DOMParser().parseFromString(opfStr, 'application/xml');
        var titleEl = opfDoc.querySelector('title');
        if (titleEl && titleEl.textContent.trim()) bookTitle = titleEl.textContent.trim();

        var opfDir = opfPath.indexOf('/') !== -1 ? opfPath.slice(0, opfPath.lastIndexOf('/')) : '';
        var manifest = {};
        opfDoc.querySelectorAll('manifest > item').forEach(function (item) {
          var id = item.getAttribute('id');
          var href = item.getAttribute('href');
          var mt = item.getAttribute('media-type') || '';
          if (id && href && (/html/i.test(mt) || /\.(x?html?|htm)$/i.test(href))) {
            manifest[id] = resolvePath(opfDir, decodeURIComponent(href));
          }
        });
        opfDoc.querySelectorAll('spine > itemref').forEach(function (ref) {
          var idref = ref.getAttribute('idref');
          if (idref && manifest[idref]) chapterPaths.push(manifest[idref]);
        });
      }

      if (!chapterPaths.length) {
        chapterPaths = Object.keys(filesMap).filter(function (k) {
          return /\.(x?html?|htm)$/i.test(k) && !/toc|nav/i.test(k);
        }).sort();
      }

      var chapters = [];
      chapterPaths.forEach(function (p) {
        if (!filesMap[p]) return;
        var txt = extractHtmlText(dec.decode(filesMap[p]));
        if (txt) chapters.push(txt);
      });

      if (!chapters.length) throw new Error('未能从该 EPUB 中提取到正文');
      var finalTxt = chapters.join('\n\n\n');
      var outBlob = new Blob([finalTxt], { type: 'text/plain;charset=utf-8' });
      return {
        blob: outBlob,
        filename: bookTitle + '.txt',
        title: bookTitle,
        meta: '提取 ' + chapters.length + ' 个章节 · ' + formatSize(outBlob.size),
        preview: finalTxt.slice(0, 160).replace(/\n+/g, ' ')
      };
    });
  }

  function convertTxtToEpub(file) {
    return file.arrayBuffer().then(function (buf) {
      var decoded = decodeTextSmart(buf);
      var raw = decoded.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      var bookTitle = file.name.replace(/\.txt$/i, '').trim() || '未命名小说';
      var lines = raw.split('\n');
      var chapterRegex = /^\s*(第[零一二三四五六七八九十百千万两0-9]{1,8}[章回节卷集部篇].*|Chapter\s+\d+.*)$/i;

      var chapters = [];
      var curTitle = '正文';
      var curLines = [];

      lines.forEach(function (line) {
        var trimmed = line.trim();
        if (chapterRegex.test(trimmed) && trimmed.length <= 45) {
          if (curLines.length) chapters.push({ title: curTitle, body: curLines });
          curTitle = trimmed;
          curLines = [];
        } else if (trimmed) {
          curLines.push(trimmed);
        }
      });
      if (curLines.length) chapters.push({ title: curTitle, body: curLines });

      if (chapters.length === 1 && chapters[0].body.length > 120) {
        var allBody = chapters[0].body;
        chapters = [];
        for (var i = 0; i < allBody.length; i += 80) {
          chapters.push({
            title: '第 ' + (chapters.length + 1) + ' 节',
            body: allBody.slice(i, i + 80)
          });
        }
      }

      if (!chapters.length) throw new Error('TXT 内容为空');

      var uid = 'urn:uuid:' + Date.now();
      var zipFiles = [
        { name: 'mimetype', data: 'application/epub+zip' },
        {
          name: 'META-INF/container.xml',
          data: '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
        }
      ];

      var manifestItems = '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>';
      var spineItems = '';
      var navPoints = '';

      chapters.forEach(function (ch, idx) {
        var num = idx + 1;
        var fname = 'ch_' + num + '.xhtml';
        manifestItems += '<item id="c' + num + '" href="' + fname + '" media-type="application/xhtml+xml"/>';
        spineItems += '<itemref idref="c' + num + '"/>';
        navPoints += '<navPoint id="n' + num + '" playOrder="' + num + '"><navLabel><text>' + escapeHtml(ch.title) + '</text></navLabel><content src="' + fname + '"/></navPoint>';

        var pHtml = ch.body.map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('');
        var xhtml =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>' + escapeHtml(ch.title) + '</title>' +
          '<style>body{line-height:1.8;padding:4%;font-family:sans-serif;}h2{font-size:1.2em;margin-bottom:1em;}p{text-indent:2em;margin:0.6em 0;}</style>' +
          '</head><body><h2>' + escapeHtml(ch.title) + '</h2>' + pHtml + '</body></html>';
        zipFiles.push({ name: 'OEBPS/' + fname, data: xhtml });
      });

      var opf =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">' +
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>' + escapeHtml(bookTitle) + '</dc:title><dc:language>zh-CN</dc:language><dc:identifier id="BookId">' + uid + '</dc:identifier></metadata>' +
        '<manifest>' + manifestItems + '</manifest>' +
        '<spine toc="ncx">' + spineItems + '</spine>' +
        '</package>';

      var ncx =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">' +
        '<head><meta name="dtb:uid" content="' + uid + '"/></head>' +
        '<docTitle><text>' + escapeHtml(bookTitle) + '</text></docTitle>' +
        '<navMap>' + navPoints + '</navMap></ncx>';

      zipFiles.push({ name: 'OEBPS/content.opf', data: opf });
      zipFiles.push({ name: 'OEBPS/toc.ncx', data: ncx });

      var outBlob = buildZipBlob(zipFiles);
      return {
        blob: outBlob,
        filename: bookTitle + '.epub',
        title: bookTitle,
        meta: '自动分出 ' + chapters.length + ' 章（原编码 ' + decoded.encoding + '）· ' + formatSize(outBlob.size),
        preview: (chapters[0].title + '：' + (chapters[0].body[0] || '')).slice(0, 140)
      };
    });
  }

  function fixTxtEncoding(file) {
    return file.arrayBuffer().then(function (buf) {
      var decoded = decodeTextSmart(buf);
      var clean = decoded.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n');
      var outBlob = new Blob([clean], { type: 'text/plain;charset=utf-8' });
      var base = file.name.replace(/\.txt$/i, '').trim() || 'novel';
      return {
        blob: outBlob,
        filename: base + '_UTF8.txt',
        title: base,
        meta: '原编码 ' + decoded.encoding + ' → UTF-8 · ' + formatSize(outBlob.size),
        preview: clean.slice(0, 160).replace(/\n+/g, ' ')
      };
    });
  }

  /* ====== GitHub OAuth & 上传逻辑 ====== */
  function ensureGithubRepo(token, repoNameOnly) {
    return fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: repoNameOnly,
        description: 'File host for Phone',
        private: false,
        auto_init: true
      })
    }).then(function (res) {
      return res.ok || res.status === 422;
    }).catch(function () {
      return false;
    });
  }

  function handleOAuthCallback() {
    var hash = window.location.hash || '';
    if (!hash) return;

    if (hash.indexOf('gh_token=') !== -1) {
      var m = hash.match(/gh_token=([^&]+)/);
      var token = m ? decodeURIComponent(m[1]) : '';
      history.replaceState(null, '', window.location.pathname + window.location.search);
      if (!token) return;

      cfg.ghToken = token;
      currentMode = 'github';
      saveCfg();
      root.classList.add('open');
      renderActivePanel();
      showToast('正在同步 GitHub 账号...');

      fetch('https://api.github.com/user', {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github+json'
        }
      }).then(function (res) {
        return res.json();
      }).then(function (user) {
        if (user && user.login) {
          cfg.ghUser = user.login;
          if (!cfg.ghRepo) cfg.ghRepo = user.login + '/phone-images';
          if (!cfg.ghBranch) cfg.ghBranch = 'main';
          saveCfg();
          ensureGithubRepo(token, 'phone-images').then(function () {
            renderActivePanel();
            showToast('已登录 GitHub：' + user.login);
          });
        }
      }).catch(function () {
        showToast('已登录 GitHub');
      });
    } else if (hash.indexOf('gh_error=') !== -1) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      currentMode = 'github';
      saveCfg();
      root.classList.add('open');
      renderActivePanel();
      showToast('GitHub 登录未完成，请重试');
    }
  }

  function processImageFile(file, qualityPercent) {
    return new Promise(function (resolve, reject) {
      if (qualityPercent >= 100) {
        var r0 = new FileReader();
        r0.onload = function () {
          resolve({ blob: file, dataUrl: r0.result, ext: (file.name.split('.').pop() || 'png').toLowerCase() });
        };
        r0.onerror = function () { reject(new Error('读取图片失败')); };
        r0.readAsDataURL(file);
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var maxSide = 2048;
          var w = img.width;
          var h = img.height;
          if (w > maxSide || h > maxSide) {
            var ratio = Math.min(maxSide / w, maxSide / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          var q = Math.min(0.98, Math.max(0.4, qualityPercent / 100));
          var dataUrl = canvas.toDataURL('image/jpeg', q);

          canvas.toBlob(function (blob) {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            resolve({ blob: blob, dataUrl: dataUrl, ext: 'jpg' });
          }, 'image/jpeg', q);
        };
        img.onerror = function () { reject(new Error('图片格式不支持')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('读取图片失败')); };
      reader.readAsDataURL(file);
    });
  }

  function uploadToCatbox(blob, filename) {
    var fd = new FormData();
    fd.append('file', blob, filename);
    return fetch('/api/upload', {
      method: 'POST',
      body: fd
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data || !data.ok || !data.url) {
          throw new Error((data && data.error) || '公共托管上传失败');
        }
        return data.url;
      });
    });
  }

  function putGithubFile(token, repo, branch, filePath, base64Content, rawSizeBytes) {
    var apiUrl = 'https://api.github.com/repos/' + repo + '/contents/' + filePath;

    function doPut() {
      return fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'upload via Phone',
          content: base64Content,
          branch: branch
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            throw new Error((data && data.message) || ('GitHub 返回错误 ' + res.status));
          }
          if (rawSizeBytes && rawSizeBytes > 20 * 1024 * 1024) {
            return 'https://raw.githubusercontent.com/' + repo + '/' + branch + '/' + filePath;
          }
          return 'https://cdn.jsdelivr.net/gh/' + repo + '@' + branch + '/' + filePath;
        });
      });
    }

    return doPut().catch(function (err) {
      if (err && String(err.message).indexOf('Not Found') !== -1) {
        var repoOnly = repo.split('/')[1];
        return ensureGithubRepo(token, repoOnly).then(function () {
          return doPut();
        });
      }
      throw err;
    });
  }

  function checkGithubConfig() {
    var token = (cfg.ghToken || '').trim();
    var repo = (cfg.ghRepo || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
    var branch = (cfg.ghBranch || 'main').trim() || 'main';
    if (!token) throw new Error('请先点击上方按钮登录 GitHub');
    if (!repo || repo.indexOf('/') === -1) throw new Error('请填写正确的「用户名/仓库名」');
    return { token: token, repo: repo, branch: branch };
  }

  function renderGithubCardHtml() {
    if (currentMode !== 'github') return '';
    if (!cfg.ghToken) {
      return (
        '<div class="cv-card">' +
          '<div class="cv-label">个人 GitHub 仓库</div>' +
          '<div class="cv-hint" style="margin-top:0;">点下面按钮跳转到 GitHub 授权同意后会自动返回，不用手动复制任何密钥。</div>' +
          '<button class="cv-primary-btn" id="cvGhLoginBtn" type="button">跳转登录 GitHub</button>' +
        '</div>'
      );
    }
    return (
      '<div class="cv-card">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<div>' +
            '<div style="font-weight:700;color:#111111;">已登录 GitHub' + (cfg.ghUser ? '（' + escapeHtml(cfg.ghUser) + '）' : '') + '</div>' +
            '<div class="cv-hint" style="margin-top:2px;">文件将直接上传到你自己的仓库</div>' +
          '</div>' +
          '<button class="cv-mini-btn is-danger" id="cvGhLogoutBtn" type="button">退出</button>' +
        '</div>' +
        '<div class="cv-field">' +
          '<div class="cv-label">存放仓库（默认自动建好 phone-images）</div>' +
          '<div class="cv-input-box"><input type="text" class="cv-input" id="cvGhRepo" value="' + escapeHtml(cfg.ghRepo || '') + '" placeholder="用户名/phone-images"></div>' +
        '</div>' +
        '<div class="cv-field">' +
          '<div class="cv-label">分支（默认 main）</div>' +
          '<div class="cv-input-box"><input type="text" class="cv-input" id="cvGhBranch" value="' + escapeHtml(cfg.ghBranch || 'main') + '" placeholder="main"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function bindGithubInputs() {
    var ghRepoEl = document.getElementById('cvGhRepo');
    var ghBranchEl = document.getElementById('cvGhBranch');
    if (ghRepoEl) {
      ghRepoEl.addEventListener('input', function () {
        cfg.ghRepo = ghRepoEl.value;
        saveCfg();
      });
    }
    if (ghBranchEl) {
      ghBranchEl.addEventListener('input', function () {
        cfg.ghBranch = ghBranchEl.value;
        saveCfg();
      });
    }
  }

  root.innerHTML =
    '<div class="cv-wrap" id="cvWrap">' +
      '<div class="cv-header">' +
        '<div class="cv-header-left">' +
          '<div class="mu-back-sm cv-back" data-close-app>' +
            '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</div>' +
          '<div class="cv-title" id="cvTitle">转换器</div>' +
        '</div>' +
      '</div>' +

      '<div class="cv-body">' +
        '<div class="cv-panel active" id="cvPanelImage"></div>' +
        '<div class="cv-panel" id="cvPanelFont"></div>' +
        '<div class="cv-panel" id="cvPanelNovel"></div>' +
      '</div>' +

      '<div class="lg-bottom-bar cv-bottom-bar" id="cvBottomBar">' +
        '<div class="cv-tab-indicator"></div>' +
        '<div class="cv-tab active" data-cv-tab="image">图片</div>' +
        '<div class="cv-tab" data-cv-tab="font">字体</div>' +
        '<div class="cv-tab" data-cv-tab="novel">小说</div>' +
      '</div>' +

      '<div class="cv-toast" id="cvToast"></div>' +
      '<input type="file" id="cvImageInput" accept="image/*" style="display:none;">' +
      '<input type="file" id="cvFontInput" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" style="display:none;">' +
      '<input type="file" id="cvNovelInput" accept=".epub,.txt,application/epub+zip,text/plain" style="display:none;">' +
    '</div>';

  function renderImagePanel() {
    var box = document.getElementById('cvPanelImage');
    var hintText = currentMode === 'catbox'
      ? '免登录直接上传到公共图床，不占用你的 GitHub，所有人打开小手机都能直接用。'
      : '登录你自己的 GitHub 后，图片只存在你自己的公开仓库里，互不干扰。';

    var resultHtml = '';
    if (lastImageResult) {
      resultHtml =
        '<div class="cv-card">' +
          '<div class="cv-label">转换结果</div>' +
          '<div class="cv-preview-wrap">' +
            '<img class="cv-thumb" src="' + escapeHtml(lastImageResult.preview || lastImageResult.url) + '" alt="">' +
            '<div class="cv-result-meta">' +
              '<div class="cv-result-name">' + escapeHtml(lastImageResult.name) + '</div>' +
              '<div class="cv-result-sub">' + escapeHtml(modeLabel(lastImageResult.mode, false)) + ' · ' + escapeHtml(lastImageResult.sizeText) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cv-url-box">' + escapeHtml(lastImageResult.url) + '</div>' +
          '<div class="cv-copy-grid">' +
            '<button class="cv-copy-btn is-dark" data-img-copy="raw" type="button">复制直链</button>' +
            '<button class="cv-copy-btn" data-img-copy="md" type="button">Markdown</button>' +
            '<button class="cv-copy-btn" data-img-copy="html" type="button">HTML &lt;img&gt;</button>' +
            '<button class="cv-copy-btn" data-img-copy="css" type="button">CSS url()</button>' +
          '</div>' +
        '</div>';
    }

    box.innerHTML =
      '<div class="cv-card">' +
        '<div class="cv-label">上传方式</div>' +
        '<div class="cv-seg">' +
          '<button class="cv-seg-btn' + (currentMode === 'catbox' ? ' active' : '') + '" data-set-mode="catbox" type="button">公共图床</button>' +
          '<button class="cv-seg-btn' + (currentMode === 'github' ? ' active' : '') + '" data-set-mode="github" type="button">个人仓库</button>' +
        '</div>' +
        '<div class="cv-hint">' + hintText + '</div>' +
        '<div class="cv-range-row">' +
          '<span class="cv-label" style="margin:0;white-space:nowrap;">压缩画质</span>' +
          '<input type="range" id="cvQualityRange" min="50" max="100" step="5" value="' + qualityVal + '">' +
          '<span class="cv-range-val" id="cvQualityText">' + (qualityVal >= 100 ? '原图' : qualityVal + '%') + '</span>' +
        '</div>' +
      '</div>' +

      renderGithubCardHtml() +

      '<div class="cv-card">' +
        '<div class="cv-drop" id="cvPickImageBtn">' +
          '<div class="cv-drop-icon">' +
            '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>' +
          '</div>' +
          '<div class="cv-drop-title">' + (isBusy ? '正在上传中，请稍候...' : '点击从相册选择图片') + '</div>' +
          '<div class="cv-drop-sub">上传后自动生成 https:// 图片链接</div>' +
        '</div>' +
      '</div>' +

      resultHtml;

    bindGithubInputs();

    var rangeEl = document.getElementById('cvQualityRange');
    var rangeText = document.getElementById('cvQualityText');
    if (rangeEl) {
      rangeEl.addEventListener('input', function () {
        qualityVal = parseInt(rangeEl.value, 10) || 85;
        rangeText.textContent = qualityVal >= 100 ? '原图' : (qualityVal + '%');
        saveCfg();
      });
    }
  }

  function renderFontPanel() {
    var box = document.getElementById('cvPanelFont');
    var hintText = currentMode === 'catbox'
      ? '支持 .ttf / .otf / .woff / .woff2，最大支持 200MB（33MB 大字体选这个即可），自动生成 .css 引入链接。'
      : '传到你自己的 GitHub 仓库并自动生成 .css 文件（GitHub 限制单文件不超过 25MB）。';

    var resultHtml = '';
    if (lastFontResult) {
      var previewFamily = lastFontResult.previewFamily || 'sans-serif';
      resultHtml =
        '<div class="cv-card">' +
          '<div class="cv-label">字体转换结果</div>' +
          '<div class="cv-preview-wrap">' +
            '<div class="cv-font-badge">Aa</div>' +
            '<div class="cv-result-meta">' +
              '<div class="cv-result-name">' + escapeHtml(lastFontResult.name) + '</div>' +
              '<div class="cv-result-sub">字体名：' + escapeHtml(lastFontResult.fontFamily) + ' · ' + escapeHtml(lastFontResult.sizeText) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cv-font-preview" style="font-family:\'' + escapeHtml(previewFamily) + '\', sans-serif;">山川湖海，月色温柔 · Abc 123456</div>' +
          '<div class="cv-url-box">&lt;link rel="stylesheet" href="' + escapeHtml(lastFontResult.cssUrl) + '"&gt;</div>' +
          '<div class="cv-copy-grid">' +
            '<button class="cv-copy-btn is-dark" data-font-copy="link" type="button">复制 &lt;link&gt;</button>' +
            '<button class="cv-copy-btn" data-font-copy="import" type="button">复制 @import</button>' +
            '<button class="cv-copy-btn" data-font-copy="cssurl" type="button">复制 .css 网址</button>' +
            '<button class="cv-copy-btn" data-font-copy="raw" type="button">复制字体直链</button>' +
          '</div>' +
        '</div>';
    }

    box.innerHTML =
      '<div class="cv-card">' +
        '<div class="cv-label">托管方式</div>' +
        '<div class="cv-seg">' +
          '<button class="cv-seg-btn' + (currentMode === 'catbox' ? ' active' : '') + '" data-set-mode="catbox" type="button">公共托管</button>' +
          '<button class="cv-seg-btn' + (currentMode === 'github' ? ' active' : '') + '" data-set-mode="github" type="button">个人仓库</button>' +
        '</div>' +
        '<div class="cv-hint">' + hintText + '</div>' +
        '<div class="cv-field">' +
          '<div class="cv-label">字体名称 font-family（可选，默认用文件名）</div>' +
          '<div class="cv-input-box"><input type="text" class="cv-input" id="cvFontNameInput" value="' + escapeHtml(customFontName) + '" placeholder="例如：MyFont"></div>' +
        '</div>' +
      '</div>' +

      renderGithubCardHtml() +

      '<div class="cv-card">' +
        '<div class="cv-drop" id="cvPickFontBtn">' +
          '<div class="cv-drop-icon">' +
            '<svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>' +
          '</div>' +
          '<div class="cv-drop-title">' + (isBusy ? '正在上传字体，大文件请稍候...' : '点击选择字体文件') + '</div>' +
          '<div class="cv-drop-sub">支持 .ttf / .otf / .woff / .woff2</div>' +
        '</div>' +
      '</div>' +

      resultHtml;

    bindGithubInputs();

    var fontNameEl = document.getElementById('cvFontNameInput');
    if (fontNameEl) {
      fontNameEl.addEventListener('input', function () {
        customFontName = fontNameEl.value;
        saveCfg();
      });
    }
  }

  function renderNovelPanel() {
    var box = document.getElementById('cvPanelNovel');
    var hintText = novelMode === 'epub2txt'
      ? '把 .epub 电子书提取成干净的 UTF-8 纯文本 .txt（方便导入小手机「图书」）。'
      : (novelMode === 'txt2epub'
        ? '把 .txt 按「第X章」自动分章，打包成标准 .epub（可直接放进苹果图书 / 微信读书）。'
        : '一键把 GBK 乱码的 .txt 小说转成正常中文 UTF-8 格式。');

    var acceptTip = novelMode === 'epub2txt' ? '点击选择 .epub 文件' : '点击选择 .txt 文件';

    var resultHtml = '';
    if (lastNovelResult) {
      resultHtml =
        '<div class="cv-card">' +
          '<div class="cv-label">转换完成</div>' +
          '<div class="cv-preview-wrap">' +
            '<div class="cv-font-badge" style="font-size:16px;">书</div>' +
            '<div class="cv-result-meta">' +
              '<div class="cv-result-name">' + escapeHtml(lastNovelResult.filename) + '</div>' +
              '<div class="cv-result-sub">' + escapeHtml(lastNovelResult.meta) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cv-url-box">' + escapeHtml(lastNovelResult.preview || '已生成文件') + '</div>' +
          '<button class="cv-primary-btn" id="cvNovelDownloadBtn" type="button" style="margin-top:0;">下载 ' + escapeHtml(lastNovelResult.filename) + '</button>' +
        '</div>';
    }

    box.innerHTML =
      '<div class="cv-card">' +
        '<div class="cv-label">转换方向（纯本地处理，不上传）</div>' +
        '<div class="cv-seg is-3">' +
          '<button class="cv-seg-btn' + (novelMode === 'epub2txt' ? ' active' : '') + '" data-novel-mode="epub2txt" type="button">EPUB → TXT</button>' +
          '<button class="cv-seg-btn' + (novelMode === 'txt2epub' ? ' active' : '') + '" data-novel-mode="txt2epub" type="button">TXT → EPUB</button>' +
          '<button class="cv-seg-btn' + (novelMode === 'txtfix' ? ' active' : '') + '" data-novel-mode="txtfix" type="button">TXT 修乱码</button>' +
        '</div>' +
        '<div class="cv-hint">' + hintText + '</div>' +
      '</div>' +

      '<div class="cv-card">' +
        '<div class="cv-drop" id="cvPickNovelBtn">' +
          '<div class="cv-drop-icon">' +
            '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' +
          '</div>' +
          '<div class="cv-drop-title">' + (isBusy ? '正在本地解析转换...' : acceptTip) + '</div>' +
          '<div class="cv-drop-sub">自动识别 UTF-8 / GBK 编码</div>' +
        '</div>' +
      '</div>' +

      resultHtml;
  }

  function renderActivePanel() {
    if (currentTab === 'font') renderFontPanel();
    else if (currentTab === 'novel') renderNovelPanel();
    else renderImagePanel();
  }

  function switchTab(tab) {
    currentTab = tab;
    var isSub = tab !== 'image';
    var bar = document.getElementById('cvBottomBar');
    document.getElementById('cvWrap').classList.toggle('is-subtab', isSub);
    bar.classList.toggle('is-font', tab === 'font');
    bar.classList.toggle('is-novel', tab === 'novel');
    document.getElementById('cvTitle').textContent =
      tab === 'font' ? '字体转换' : (tab === 'novel' ? '小说转换' : '转换器');

    document.getElementById('cvPanelImage').classList.toggle('active', tab === 'image');
    document.getElementById('cvPanelFont').classList.toggle('active', tab === 'font');
    document.getElementById('cvPanelNovel').classList.toggle('active', tab === 'novel');

    root.querySelectorAll('.cv-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-cv-tab') === tab);
    });
    renderActivePanel();
  }

  root.querySelectorAll('.cv-tab').forEach(function (el) {
    el.addEventListener('click', function () {
      if (isBusy) return;
      switchTab(el.getAttribute('data-cv-tab'));
    });
  });

  root.addEventListener('click', function (e) {
    var modeBtn = e.target.closest('[data-set-mode]');
    if (modeBtn && !isBusy) {
      currentMode = modeBtn.getAttribute('data-set-mode');
      saveCfg();
      renderActivePanel();
      return;
    }

    var nModeBtn = e.target.closest('[data-novel-mode]');
    if (nModeBtn && !isBusy) {
      novelMode = nModeBtn.getAttribute('data-novel-mode');
      renderActivePanel();
      return;
    }

    if (e.target.closest('#cvGhLoginBtn')) {
      window.location.href = '/api/github/login';
      return;
    }

    if (e.target.closest('#cvGhLogoutBtn')) {
      cfg.ghToken = '';
      cfg.ghUser = '';
      saveCfg();
      renderActivePanel();
      showToast('已退出 GitHub 登录');
      return;
    }

    if (e.target.closest('#cvPickImageBtn')) {
      if (!isBusy) document.getElementById('cvImageInput').click();
      return;
    }

    if (e.target.closest('#cvPickFontBtn')) {
      if (!isBusy) document.getElementById('cvFontInput').click();
      return;
    }

    if (e.target.closest('#cvPickNovelBtn')) {
      if (isBusy) return;
      var nInput = document.getElementById('cvNovelInput');
      nInput.setAttribute('accept', novelMode === 'epub2txt' ? '.epub,application/epub+zip' : '.txt,text/plain');
      nInput.click();
      return;
    }

    if (e.target.closest('#cvNovelDownloadBtn') && lastNovelResult) {
      downloadBlob(lastNovelResult.blob, lastNovelResult.filename);
      return;
    }

    var imgCopyBtn = e.target.closest('[data-img-copy]');
    if (imgCopyBtn && lastImageResult) {
      var fmt = imgCopyBtn.getAttribute('data-img-copy');
      var u = lastImageResult.url;
      if (fmt === 'raw') copyText(u, '直链');
      else if (fmt === 'md') copyText('[' + u + ']', 'Markdown');
      else if (fmt === 'html') copyText('<img src="' + u + '" alt="">', 'HTML');
      else if (fmt === 'css') copyText('url("' + u + '")', 'CSS');
      return;
    }

    var fontCopyBtn = e.target.closest('[data-font-copy]');
    if (fontCopyBtn && lastFontResult) {
      var fFmt = fontCopyBtn.getAttribute('data-font-copy');
      var cu = lastFontResult.cssUrl;
      var ru = lastFontResult.rawUrl;
      if (fFmt === 'link') copyText('<link rel="stylesheet" href="' + cu + '">', '<link> 代码');
      else if (fFmt === 'import') copyText('@import url("' + cu + '");', '@import 代码');
      else if (fFmt === 'cssurl') copyText(cu, '.css 网址');
      else if (fFmt === 'raw') copyText(ru, '字体直链');
    }
  });

  document.getElementById('cvImageInput').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || isBusy) return;

    isBusy = true;
    renderActivePanel();

    processImageFile(file, qualityVal).then(function (processed) {
      var uploadTask;
      if (currentMode === 'github') {
        var g = checkGithubConfig();
        var base64 = processed.dataUrl.split(',')[1] || '';
        var filePath = 'images/' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '.' + processed.ext;
        uploadTask = putGithubFile(g.token, g.repo, g.branch, filePath, base64, processed.blob.size);
      } else {
        var cleanName = (file.name ? file.name.replace(/\.[^.]+$/, '') : 'image') + '.' + processed.ext;
        uploadTask = uploadToCatbox(processed.blob, cleanName);
      }

      return uploadTask.then(function (url) {
        lastImageResult = {
          name: file.name || 'image.' + processed.ext,
          mode: currentMode,
          url: url,
          preview: processed.dataUrl,
          sizeText: formatSize(processed.blob.size)
        };
        isBusy = false;
        renderActivePanel();
        showToast('上传成功，已生成链接');
      });
    }).catch(function (err) {
      isBusy = false;
      renderActivePanel();
      showToast((err && err.message) ? err.message : '上传失败');
    });
  });

  document.getElementById('cvFontInput').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || isBusy) return;

    if (currentMode === 'github' && file.size > 25 * 1024 * 1024) {
      showToast('超过 GitHub 25MB 限制，请切到「公共托管」上传');
      return;
    }

    var rawBaseName = (file.name || 'CustomFont').replace(/\.[^.]+$/, '').replace(/["'\\\r\n;{}]/g, '').trim() || 'CustomFont';
    var fontFamily = (customFontName || '').replace(/["'\\\r\n;{}]/g, '').trim() || rawBaseName;
    var ext = (file.name.split('.').pop() || 'ttf').toLowerCase();

    isBusy = true;
    renderActivePanel();

    file.arrayBuffer().then(function (buf) {
      var previewFamily = 'CvPreview_' + Date.now();
      var previewPromise = Promise.resolve();
      try {
        var face = new FontFace(previewFamily, buf);
        previewPromise = face.load().then(function (loaded) {
          document.fonts.add(loaded);
        }).catch(function () {});
      } catch (e) {}

      var uploadPromise;
      if (currentMode === 'github') {
        var g = checkGithubConfig();
        var stamp = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        var fontPath = 'fonts/' + stamp + '.' + ext;
        var cssPath = 'fonts/' + stamp + '.css';
        var b64Font = arrayBufferToBase64(buf);

        uploadPromise = putGithubFile(g.token, g.repo, g.branch, fontPath, b64Font, file.size).then(function (rawUrl) {
          var cssText = '@font-face {\n  font-family: "' + fontFamily + '";\n  src: url("' + rawUrl + '");\n  font-display: swap;\n}\n';
          return putGithubFile(g.token, g.repo, g.branch, cssPath, strToBase64(cssText), cssText.length).then(function (cssUrl) {
            return { rawUrl: rawUrl, cssUrl: cssUrl };
          });
        });
      } else {
        uploadPromise = uploadToCatbox(file, file.name || ('font.' + ext)).then(function (rawUrl) {
          var cssUrl = window.location.origin + '/api/font.css?url=' + encodeURIComponent(rawUrl) + '&name=' + encodeURIComponent(fontFamily);
          return { rawUrl: rawUrl, cssUrl: cssUrl };
        });
      }

      return Promise.all([previewPromise, uploadPromise]).then(function (results) {
        var urls = results[1];
        lastFontResult = {
          name: file.name || ('font.' + ext),
          fontFamily: fontFamily,
          previewFamily: previewFamily,
          mode: currentMode,
          rawUrl: urls.rawUrl,
          cssUrl: urls.cssUrl,
          sizeText: formatSize(file.size)
        };
        isBusy = false;
        renderActivePanel();
        showToast('字体上传成功，已生成 .css 链接');
      });
    }).catch(function (err) {
      isBusy = false;
      renderActivePanel();
      showToast((err && err.message) ? err.message : '字体上传失败');
    });
  });

  document.getElementById('cvNovelInput').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || isBusy) return;

    isBusy = true;
    renderActivePanel();

    var task = novelMode === 'epub2txt'
      ? convertEpubToTxt(file)
      : (novelMode === 'txt2epub' ? convertTxtToEpub(file) : fixTxtEncoding(file));

    task.then(function (res) {
      lastNovelResult = res;
      isBusy = false;
      renderActivePanel();
      downloadBlob(res.blob, res.filename);
      showToast('转换成功');
    }).catch(function (err) {
      isBusy = false;
      renderActivePanel();
      showToast((err && err.message) ? err.message : '转换失败');
    });
  });

  renderActivePanel();
  handleOAuthCallback();
})();