// AI Engineer Course — page behaviour: diagrams, math, TOC, progress, question links.
(function () {
  // Mermaid: light, low-contrast palette that matches the page.
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "loose",
      fontFamily: "Inter, -apple-system, sans-serif",
      themeVariables: {
        fontSize: "16px",
        background: "#fafaf8",
        primaryColor: "#e3eefc",
        primaryBorderColor: "#3b7dd8",
        primaryTextColor: "#163a66",
        secondaryColor: "#e2f4e9",
        secondaryBorderColor: "#2f9e5f",
        tertiaryColor: "#fdf0d8",
        tertiaryBorderColor: "#d9962b",
        lineColor: "#7d8796",
        clusterBkg: "#f8f6fe",
        clusterBorder: "#cbbff0",
        titleColor: "#38267a",
        quadrant1Fill: "#e2f4e9",
        quadrant2Fill: "#fce6ea",
        quadrant3Fill: "#fdf0d8",
        quadrant4Fill: "#e3eefc",
        quadrantPointFill: "#7b5cd6",
        quadrantPointTextFill: "#242424",
        quadrantTitleFill: "#38267a",
        xyChart: { plotColorPalette: "#2f9e5f, #3b7dd8, #d9962b, #7b5cd6", backgroundColor: "#fbfcfe" },
        noteBkgColor: "#fdf6e9",
        noteBorderColor: "#e8d3a8",
        actorBkg: "#ffffff",
        actorBorder: "#c9c9c4",
        signalColor: "#4a4a4a",
        edgeLabelBackground: "#fafaf8",
      },
      flowchart: { curve: "basis", htmlLabels: true, padding: 14 },
    });
  }

  // Draw diagrams only after the web fonts (Inter + Font Awesome) are ready,
  // otherwise Mermaid measures labels too narrow and clips the text.
  if (window.mermaid) {
    var fontsWanted = [
      document.fonts.load('16px "Inter"'),
      document.fonts.load('900 16px "Font Awesome 6 Free"'),
      document.fonts.load('400 16px "Font Awesome 6 Free"'),
    ];
    Promise.all(fontsWanted).catch(function () {}).then(function () { return document.fonts.ready; })
      .then(function () { return mermaid.run({ querySelector: "pre.mermaid" }); })
      .then(function () { initDiagramViewer(); });
  }

  // ==========================================
  // Interactive Diagram Viewer & Lightbox Modal
  // ==========================================
  function initDiagramViewer() {
    var diagrams = document.querySelectorAll("figure.diagram");
    var images = document.querySelectorAll("figure img, .hero img, .gallery img");
    if (!diagrams.length && !images.length) return;

    // Create Lightbox singleton if not already present
    var backdrop = document.getElementById("diagramLightboxBackdrop");
    var modal = document.getElementById("diagramLightbox");

    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "diagram-lightbox-backdrop";
      backdrop.id = "diagramLightboxBackdrop";
      document.body.appendChild(backdrop);
    }

    if (!modal) {
      modal = document.createElement("div");
      modal.className = "diagram-lightbox";
      modal.id = "diagramLightbox";
      modal.innerHTML = `
        <div class="diagram-lightbox-header">
          <div class="diagram-lightbox-title">
            <h4><i data-lucide="network" class="ico"></i> Interactive Diagram Viewer</h4>
            <span class="diagram-vector-badge">Vector SVG · Lossless</span>
          </div>
          <div class="diagram-lightbox-controls">
            <button type="button" class="diagram-ctrl-btn" id="diagramZoomOut" title="Zoom Out (-)">
              <i data-lucide="zoom-out" class="ico"></i>
            </button>
            <span class="diagram-zoom-level" id="diagramZoomLevel" title="Click to reset zoom (1:1)">100%</span>
            <button type="button" class="diagram-ctrl-btn" id="diagramZoomIn" title="Zoom In (+)">
              <i data-lucide="zoom-in" class="ico"></i>
            </button>
            <button type="button" class="diagram-ctrl-btn" id="diagramReset" title="Reset View (1:1)">
              <i data-lucide="rotate-ccw" class="ico"></i> Reset
            </button>
            <button type="button" class="diagram-ctrl-btn close" id="diagramClose" title="Close Viewer (Esc)">
              ✕
            </button>
          </div>
        </div>
        <div class="diagram-lightbox-viewport" id="diagramViewport">
          <div class="diagram-stage" id="diagramStage"></div>
          <div class="diagram-lightbox-hint">Scroll to Zoom • Drag to Pan • Double-click to Reset</div>
        </div>
      `;
      document.body.appendChild(modal);

      var stage = modal.querySelector("#diagramStage");
      var viewport = modal.querySelector("#diagramViewport");
      var zoomLevelLabel = modal.querySelector("#diagramZoomLevel");
      var zoomInBtn = modal.querySelector("#diagramZoomIn");
      var zoomOutBtn = modal.querySelector("#diagramZoomOut");
      var resetBtn = modal.querySelector("#diagramReset");
      var closeBtn = modal.querySelector("#diagramClose");

      var currentScale = 1;
      var panX = 0;
      var panY = 0;
      var isDragging = false;
      var startX = 0;
      var startY = 0;

      function applyTransform() {
        stage.style.transform = "translate(" + panX + "px, " + panY + "px) scale(" + currentScale + ")";
        zoomLevelLabel.textContent = Math.round(currentScale * 100) + "%";
      }

      function resetView() {
        currentScale = 1;
        panX = 0;
        panY = 0;
        applyTransform();
      }

      function setScale(newScale) {
        currentScale = Math.min(Math.max(0.35, newScale), 5.0);
        applyTransform();
      }

      window._openDiagramModal = function (svgEl) {
        stage.innerHTML = "";
        var cloned = svgEl.cloneNode(true);
        // CRITICAL: Preserve the original SVG id so scoped Mermaid styles (#mermaid-XXX) apply.
        // Stripping the id breaks cluster rect fills, text colors, and node alignments.
        if (svgEl.id) cloned.id = svgEl.id;

        // Extract native dimensions from viewBox or bounding box
        var vb = svgEl.viewBox && svgEl.viewBox.baseVal;
        var nativeWidth = (vb && vb.width > 0) ? vb.width : (svgEl.getBoundingClientRect().width || 1000);
        var nativeHeight = (vb && vb.height > 0) ? vb.height : (svgEl.getBoundingClientRect().height || 400);

        cloned.setAttribute("width", nativeWidth);
        cloned.setAttribute("height", nativeHeight);
        cloned.style.width = nativeWidth + "px";
        cloned.style.height = nativeHeight + "px";
        cloned.style.maxWidth = "none";
        cloned.style.maxHeight = "none";
        cloned.style.display = "block";
        cloned.style.overflow = "visible";

        stage.innerHTML = "";
        stage.appendChild(cloned);
        stage.style.width = nativeWidth + "px";
        stage.style.height = nativeHeight + "px";

        // Auto-fit to viewport so diagram is fully visible upon opening
        var vpWidth = viewport.clientWidth || (window.innerWidth - 60);
        var vpHeight = viewport.clientHeight || (window.innerHeight - 120);
        var fitScale = Math.min((vpWidth - 80) / nativeWidth, (vpHeight - 80) / nativeHeight, 1.0);
        if (fitScale <= 0 || !isFinite(fitScale)) fitScale = 1.0;
        fitScale = Math.max(fitScale, 0.4);

        currentScale = fitScale;
        panX = 0;
        panY = 0;
        applyTransform();

        backdrop.classList.add("open");
        modal.classList.add("open");
        document.body.style.overflow = "hidden";
        if (window.lucide) lucide.createIcons();
      };

      window._openImageModal = function (imgEl) {
        stage.innerHTML = "";
        var cloned = document.createElement("img");
        cloned.src = imgEl.src;
        cloned.alt = imgEl.alt || "";
        var nativeWidth = imgEl.naturalWidth || imgEl.width || 1080;
        var nativeHeight = imgEl.naturalHeight || imgEl.height || 1920;
        cloned.style.maxWidth = "none";
        cloned.style.maxHeight = "none";
        cloned.style.width = nativeWidth + "px";
        cloned.style.height = nativeHeight + "px";
        cloned.style.display = "block";
        cloned.style.borderRadius = "8px";

        stage.innerHTML = "";
        stage.appendChild(cloned);
        stage.style.width = nativeWidth + "px";
        stage.style.height = nativeHeight + "px";

        var vpWidth = viewport.clientWidth || (window.innerWidth - 60);
        var vpHeight = viewport.clientHeight || (window.innerHeight - 120);
        var fitScale = Math.min((vpWidth - 80) / nativeWidth, (vpHeight - 80) / nativeHeight, 1.0);
        if (fitScale <= 0 || !isFinite(fitScale)) fitScale = 1.0;
        fitScale = Math.max(fitScale, 0.25);

        currentScale = fitScale;
        panX = 0;
        panY = 0;
        applyTransform();

        backdrop.classList.add("open");
        modal.classList.add("open");
        document.body.style.overflow = "hidden";
        if (window.lucide) lucide.createIcons();
      };

      function closeModal() {
        backdrop.classList.remove("open");
        modal.classList.remove("open");
        document.body.style.overflow = "";
        setTimeout(function () {
          stage.innerHTML = "";
        }, 250);
      }

      zoomInBtn.addEventListener("click", function () {
        setScale(currentScale + 0.25);
      });
      zoomOutBtn.addEventListener("click", function () {
        setScale(currentScale - 0.25);
      });
      resetBtn.addEventListener("click", resetView);
      zoomLevelLabel.addEventListener("click", resetView);
      closeBtn.addEventListener("click", closeModal);
      backdrop.addEventListener("click", closeModal);

      // Mouse wheel zoom
      viewport.addEventListener("wheel", function (e) {
        e.preventDefault();
        var delta = e.deltaY < 0 ? 0.15 : -0.15;
        setScale(currentScale + delta);
      }, { passive: false });

      // Drag / Pan
      viewport.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        viewport.classList.add("dragging");
      });
      window.addEventListener("mousemove", function (e) {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        applyTransform();
      });
      window.addEventListener("mouseup", function () {
        if (isDragging) {
          isDragging = false;
          viewport.classList.remove("dragging");
        }
      });

      // Double-click to reset
      viewport.addEventListener("dblclick", function (e) {
        if (e.target.closest(".diagram-lightbox-controls")) return;
        resetView();
      });

      // Keyboard shortcuts
      document.addEventListener("keydown", function (e) {
        if (!modal.classList.contains("open")) return;
        if (e.key === "Escape") {
          closeModal();
        } else if (e.key === "+" || e.key === "=") {
          setScale(currentScale + 0.25);
        } else if (e.key === "-" || e.key === "_") {
          setScale(currentScale - 0.25);
        } else if (e.key === "0") {
          resetView();
        }
      });
    }

    // Attach toolbar to each figure.diagram
    diagrams.forEach(function (fig) {
      if (fig.querySelector(".diagram-toolbar")) return;

      var tb = document.createElement("div");
      tb.className = "diagram-toolbar";
      tb.innerHTML = '<button type="button" class="diagram-tool-btn" title="Open Interactive Diagram Viewer (Zoom & Pan)"><i data-lucide="maximize-2" class="ico"></i><span>Expand & Zoom</span></button>';
      fig.appendChild(tb);

      var btn = tb.querySelector("button");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var svg = fig.querySelector("svg");
        if (svg && window._openDiagramModal) window._openDiagramModal(svg);
      });

      fig.style.cursor = "zoom-in";
      fig.addEventListener("click", function (e) {
        if (e.target.closest(".diagram-toolbar")) return;
        var svg = fig.querySelector("svg");
        if (svg && window._openDiagramModal) window._openDiagramModal(svg);
      });
    });

    
    images.forEach(function (img) {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", function () {
        if (window._openImageModal) window._openImageModal(img);
      });
    });

    if (window.lucide) lucide.createIcons();
  }


  // Lucide SVG icons (headings, callouts, inline shortcodes).
  if (window.lucide) lucide.createIcons();

  // KaTeX rendering: poll and auto-render math formulas as soon as KaTeX is ready
  function renderMath() {
    if (window.renderMathInElement) {
      renderMathInElement(document.querySelector(".article") || document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    }
  }

  var mathCheckCount = 0;
  var mathTimer = setInterval(function () {
    mathCheckCount++;
    if (window.renderMathInElement) {
      clearInterval(mathTimer);
      renderMath();
    } else if (mathCheckCount > 40) {
      clearInterval(mathTimer);
    }
  }, 50);

  window.addEventListener("load", renderMath);


  // Table of contents from h2s.
  var toc = document.getElementById("toc");
  var heads = Array.prototype.slice.call(document.querySelectorAll(".article h2[id]"));
  if (toc) {
    heads.forEach(function (h) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      toc.appendChild(li);
    });
  }
  var links = toc ? toc.querySelectorAll("a") : [];

  // Reading progress + active TOC entry.
  var bar = document.querySelector(".progress span");
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + "%";
    var current = 0;
    heads.forEach(function (h, i) { if (h.getBoundingClientRect().top < 120) current = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === current); });
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Question links open (and highlight) the inline answer.
  function openQuestion(id) {
    var d = document.getElementById(id);
    if (!d || d.tagName !== "DETAILS") return;
    d.open = true;
    d.classList.remove("flash");
    void d.offsetWidth;
    d.classList.add("flash");
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-open]");
    if (a) openQuestion(a.getAttribute("data-open"));
  });
  if (location.hash) openQuestion(location.hash.slice(1));

  // ==========================================
  // Modern Code Editor Blocks & Copy Buttons
  // ==========================================
  function initCodeBlocks() {
    var pres = document.querySelectorAll("pre:not(.mermaid)");
    pres.forEach(function (pre) {
      if (pre.closest(".diagram") || pre.classList.contains("mermaid")) return;
      if (pre.parentElement && pre.parentElement.classList.contains("code-block-wrapper")) return;

      var code = pre.querySelector("code");
      var lang = "code";
      if (code) {
        var cls = Array.from(code.classList).find(function(c) { return c.startsWith("language-"); });
        if (cls) {
          lang = cls.replace("language-", "").trim();
        }
      }

      // Create wrapper
      var wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";

      // Header
      var header = document.createElement("div");
      header.className = "code-block-header";

      // Meta: macOS dots + language badge
      var meta = document.createElement("div");
      meta.className = "code-block-meta";
      meta.innerHTML = '<span class="code-dots"><span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span></span>' +
                       '<span class="code-lang">' + (lang ? lang.toUpperCase() : "CODE") + '</span>';

      // Copy Button
      var copyBtn = document.createElement("button");
      copyBtn.className = "code-copy-btn";
      copyBtn.setAttribute("type", "button");
      copyBtn.setAttribute("aria-label", "Copy code");
      copyBtn.innerHTML = '<i data-lucide="copy" class="ico"></i><span>Copy</span>';

      copyBtn.addEventListener("click", function () {
        var textToCopy = code ? code.innerText : pre.innerText;
        navigator.clipboard.writeText(textToCopy).then(function () {
          copyBtn.innerHTML = '<i data-lucide="check" class="ico"></i><span>Copied!</span>';
          copyBtn.classList.add("copied");
          if (window.lucide) lucide.createIcons();
          setTimeout(function () {
            copyBtn.innerHTML = '<i data-lucide="copy" class="ico"></i><span>Copy</span>';
            copyBtn.classList.remove("copied");
            if (window.lucide) lucide.createIcons();
          }, 2000);
        }).catch(function () {
          copyBtn.innerHTML = '<span>Failed</span>';
        });
      });

      header.appendChild(meta);
      header.appendChild(copyBtn);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      // Trigger Prism highlighting if loaded
      if (window.Prism && code) {
        Prism.highlightElement(code);
      }
    });

    if (window.lucide) lucide.createIcons();
  }

  // Run on load and after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCodeBlocks);
  } else {
    initCodeBlocks();
  }

  // ==========================================
  // Interactive In-Browser Notes Scratchpad
  // ==========================================
  function initNotesDrawer() {
    var pathname = window.location.pathname;
    var filename = pathname.split("/").pop() || "index.html";
    var slug = filename.replace(/\.html$/, "") || "home";
    if (pathname.indexOf("/notes/") !== -1 || pathname.endsWith("/notes") || pathname.endsWith("/notes.html")) {
      if (slug === "notes" || slug === "index") slug = "notes-index";
      else slug = "note-" + slug;
    }
    var pageTitle = (document.querySelector("h1") ? document.querySelector("h1").textContent.trim() : document.title) || slug;
    var storagePrefix = "student_note_";
    var currentStorageKey = storagePrefix + slug;
    var indexStorageKey = "student_notes_index";

    function getNotesIndex() {
      try {
        return JSON.parse(localStorage.getItem(indexStorageKey) || "{}");
      } catch (e) {
        return {};
      }
    }

    function saveNotesIndex(idx) {
      try {
        localStorage.setItem(indexStorageKey, JSON.stringify(idx));
      } catch (e) {}
    }

    function loadCurrentNote() {
      try {
        return localStorage.getItem(currentStorageKey) || "";
      } catch (e) {
        return "";
      }
    }

    // Floating Action Button
    var fab = document.createElement("button");
    fab.className = "notes-fab";
    fab.id = "notesFab";
    fab.setAttribute("aria-label", "Open Notes Scratchpad");
    fab.innerHTML = '<i data-lucide="notebook-pen" class="ico"></i><span>Take Notes</span><span class="fab-dot" id="fabNoteDot" style="display:none;"></span><span class="fab-kbd">⌥N</span>';
    document.body.appendChild(fab);

    // Topbar shortcut button
    var topbarNav = document.querySelector(".topbar-nav");
    var topbarBtn = null;
    if (topbarNav) {
      topbarBtn = document.createElement("button");
      topbarBtn.className = "topbar-notes-btn";
      topbarBtn.id = "topbarNotesBtn";
      topbarBtn.setAttribute("type", "button");
      topbarBtn.setAttribute("title", "Open Notes Scratchpad (Alt+N)");
      topbarBtn.innerHTML = '<i data-lucide="notebook-pen" class="ico"></i><span>Notes</span><span class="note-indicator" id="topbarNoteDot" style="display:none;"></span>';
      topbarNav.appendChild(topbarBtn);
    }

    // Backdrop
    var backdrop = document.createElement("div");
    backdrop.className = "notes-drawer-backdrop";
    backdrop.id = "notesBackdrop";
    document.body.appendChild(backdrop);

    // Drawer Container
    var drawer = document.createElement("div");
    drawer.className = "notes-drawer";
    drawer.id = "notesDrawer";
    drawer.innerHTML = `
      <div class="notes-drawer-header">
        <div class="notes-drawer-title-group">
          <h3><i data-lucide="notebook-pen" class="ico"></i> Study Scratchpad</h3>
          <div class="notes-drawer-meta">
            <span class="notes-module-badge">${slug}</span>
            <span id="notesHeaderStatus" style="font-size:12px;color:var(--ink-3);">Auto-saved</span>
          </div>
        </div>
        <button class="notes-drawer-close" id="notesCloseBtn" aria-label="Close notes drawer">✕</button>
      </div>
      <div class="notes-drawer-tabs">
        <button class="notes-tab-btn active" id="tabCurrent">This Module</button>
        <button class="notes-tab-btn" id="tabAll">All Notes <span id="tabAllCount" style="font-weight:normal;opacity:0.8;"></span></button>
      </div>
      <div class="notes-drawer-view" id="viewCurrent">
        <div class="notes-drawer-toolbar">
          <div class="notes-tool-buttons">
            <button class="notes-tool-btn" data-insert="- ">• List</button>
            <button class="notes-tool-btn" data-insert="- [ ] ">✓ Task</button>
            <button class="notes-tool-btn" data-insert="> ">Quote</button>
            <button class="notes-tool-btn" data-insert="\`\`\`\\n\\n\`\`\`\\n">Code</button>
            <button class="notes-tool-btn" data-insert="time">Time</button>
          </div>
          <span class="notes-save-indicator saved" id="saveIndicator">✓ Saved</span>
        </div>
        <div class="notes-textarea-container">
          <textarea class="notes-textarea" id="notesTextarea" placeholder="Write your thoughts, questions, derivations, or takeaways here...&#10;&#10;• Everything auto-saves to your local browser storage.&#10;• You can export notes as Markdown at any time."></textarea>
        </div>
        <div class="notes-drawer-footer">
          <div class="notes-stats" id="notesStats">0 words • 0 chars</div>
          <div class="notes-actions">
            <button class="notes-act-btn" id="notesClearBtn" title="Clear this note">Clear</button>
            <button class="notes-act-btn" id="notesCopyBtn" title="Copy to clipboard">Copy</button>
            <button class="notes-act-btn primary" id="notesDownloadBtn" title="Download Markdown file">Download .md</button>
          </div>
        </div>
      </div>
      <div class="notes-drawer-view hidden" id="viewAll">
        <div class="notes-all-list" id="notesAllList"></div>
      </div>
    `;
    document.body.appendChild(drawer);

    var textarea = drawer.querySelector("#notesTextarea");
    var saveIndicator = drawer.querySelector("#saveIndicator");
    var statsEl = drawer.querySelector("#notesStats");
    var tabCurrent = drawer.querySelector("#tabCurrent");
    var tabAll = drawer.querySelector("#tabAll");
    var tabAllCount = drawer.querySelector("#tabAllCount");
    var viewCurrent = drawer.querySelector("#viewCurrent");
    var viewAll = drawer.querySelector("#viewAll");
    var notesAllList = drawer.querySelector("#notesAllList");
    var closeBtn = drawer.querySelector("#notesCloseBtn");
    var downloadBtn = drawer.querySelector("#notesDownloadBtn");
    var copyBtn = drawer.querySelector("#notesCopyBtn");
    var clearBtn = drawer.querySelector("#notesClearBtn");
    var fabDot = document.getElementById("fabNoteDot");
    var topbarDot = document.getElementById("topbarNoteDot");

    function updateStats(text) {
      var words = text.trim() ? text.trim().split(/\s+/).length : 0;
      var chars = text.length;
      statsEl.textContent = words + (words === 1 ? " word • " : " words • ") + chars + " chars";
    }

    function updateIndicators(hasContent) {
      if (fabDot) fabDot.style.display = hasContent ? "inline-block" : "none";
      if (topbarDot) topbarDot.style.display = hasContent ? "inline-block" : "none";
      if (topbarBtn) topbarBtn.classList.toggle("has-notes", hasContent);
    }

    function refreshAllNotesView() {
      var idx = getNotesIndex();
      var keys = Object.keys(idx);
      tabAllCount.textContent = keys.length ? "(" + keys.length + ")" : "";
      if (keys.length === 0) {
        notesAllList.innerHTML = '<div class="notes-all-empty">No notes taken yet. Jot down takeaways on any page!</div>';
        return;
      }
      var html = "";
      keys.sort(function(a, b) {
        return (idx[b].updated || 0) - (idx[a].updated || 0);
      });
      keys.forEach(function(k) {
        var item = idx[k];
        var isCurrent = k === slug;
        var dateStr = item.updated ? new Date(item.updated).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
        html += `
          <div class="notes-card-item" data-slug="${item.slug}" data-href="${item.url || '#'}">
            <div class="notes-card-header">
              <span class="notes-module-badge">${item.slug}${isCurrent ? ' • Current' : ''}</span>
              <span style="color:var(--ink-3);">${dateStr}</span>
            </div>
            <div class="notes-card-title">${item.title}</div>
            <div class="notes-card-preview">${(item.preview || "").replace(/</g, "&lt;")}</div>
          </div>
        `;
      });
      notesAllList.innerHTML = html;
      notesAllList.querySelectorAll(".notes-card-item").forEach(function(card) {
        card.addEventListener("click", function() {
          var href = card.getAttribute("data-href");
          var cardSlug = card.getAttribute("data-slug");
          if (cardSlug === slug) {
            tabCurrent.click();
          } else if (href && href !== "#") {
            window.location.href = href;
          }
        });
      });
    }

    var saveTimeout = null;
    function saveNote(silent) {
      var val = textarea.value;
      try {
        if (val.trim()) {
          localStorage.setItem(currentStorageKey, val);
          var idx = getNotesIndex();
          idx[slug] = {
            slug: slug,
            title: pageTitle,
            url: window.location.pathname,
            updated: Date.now(),
            preview: val.trim().slice(0, 160)
          };
          saveNotesIndex(idx);
          updateIndicators(true);
        } else {
          localStorage.removeItem(currentStorageKey);
          var idx = getNotesIndex();
          delete idx[slug];
          saveNotesIndex(idx);
          updateIndicators(false);
        }
        if (!silent) {
          saveIndicator.textContent = "✓ Saved";
          saveIndicator.className = "notes-save-indicator saved";
        }
      } catch (e) {}
    }

    // Load initial note
    var initialNote = loadCurrentNote();
    textarea.value = initialNote;
    updateStats(initialNote);
    updateIndicators(Boolean(initialNote.trim()));
    refreshAllNotesView();

    textarea.addEventListener("input", function() {
      updateStats(textarea.value);
      saveIndicator.textContent = "Saving...";
      saveIndicator.className = "notes-save-indicator unsaved";
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(function() {
        saveNote(false);
      }, 400);
    });

    // Indent with Tab key inside textarea
    textarea.addEventListener("keydown", function(e) {
      if (e.key === "Tab") {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
        textarea.dispatchEvent(new Event("input"));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveNote(false);
      }
    });

    // Formatting insertion tools
    drawer.querySelectorAll(".notes-tool-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var ins = btn.getAttribute("data-insert");
        if (ins === "time") {
          var now = new Date();
          ins = "[" + now.toTimeString().slice(0, 5) + "] ";
        }
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var val = textarea.value;
        textarea.value = val.substring(0, start) + ins + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + ins.length;
        textarea.focus();
        textarea.dispatchEvent(new Event("input"));
      });
    });

    // Tabs toggle
    tabCurrent.addEventListener("click", function() {
      tabCurrent.classList.add("active");
      tabAll.classList.remove("active");
      viewCurrent.classList.remove("hidden");
      viewAll.classList.add("hidden");
    });
    tabAll.addEventListener("click", function() {
      tabAll.classList.add("active");
      tabCurrent.classList.remove("active");
      viewAll.classList.remove("hidden");
      viewCurrent.classList.add("hidden");
      refreshAllNotesView();
    });

    function openDrawer() {
      drawer.classList.add("open");
      backdrop.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(function() { textarea.focus(); }, 150);
    }
    function closeDrawer() {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
    function toggleDrawer() {
      if (drawer.classList.contains("open")) closeDrawer();
      else openDrawer();
    }

    fab.addEventListener("click", toggleDrawer);
    if (topbarBtn) topbarBtn.addEventListener("click", toggleDrawer);
    closeBtn.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);

    // Keyboard shortcuts
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) {
        closeDrawer();
      }
      if (e.altKey && (e.key === "n" || e.key === "N" || e.code === "KeyN")) {
        e.preventDefault();
        toggleDrawer();
      }
    });

    // Download action
    downloadBtn.addEventListener("click", function() {
      var val = textarea.value;
      if (!val.trim()) {
        alert("Your notes are empty for this page.");
        return;
      }
      var frontmatter = [
        "---",
        "title: " + JSON.stringify("Notes: " + pageTitle),
        "module: " + JSON.stringify(slug),
        "date: " + new Date().toISOString(),
        "url: " + JSON.stringify(window.location.href),
        "---",
        "",
        "# Study Notes: " + pageTitle,
        "",
        val
      ].join("\n");

      var blob = new Blob([frontmatter], { type: "text/markdown;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = slug + "-notes.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Copy action
    copyBtn.addEventListener("click", function() {
      var val = textarea.value;
      if (!val) return;
      navigator.clipboard.writeText(val).then(function() {
        var orig = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(function() { copyBtn.textContent = orig; }, 1800);
      }).catch(function() {
        alert("Unable to copy to clipboard.");
      });
    });

    // Clear action
    clearBtn.addEventListener("click", function() {
      if (!textarea.value.trim()) return;
      if (confirm("Are you sure you want to clear your notes for this page?")) {
        textarea.value = "";
        saveNote(false);
        updateStats("");
      }
    });

    if (window.lucide) lucide.createIcons();
  }

  // ==========================================================================
  // Spotlight Command Palette (⌘K / Ctrl+K) System
  // ==========================================================================
  function initCommandPalette() {
    var searchData = window.__SEARCH_INDEX__ || [];

    // Backdrop & Modal elements
    var backdrop = document.createElement("div");
    backdrop.className = "cmd-palette-backdrop";
    backdrop.id = "cmdPaletteBackdrop";

    var modal = document.createElement("div");
    modal.className = "cmd-palette-modal";
    modal.id = "cmdPaletteModal";
    modal.innerHTML = [
      '<div class="cmd-palette-header">',
      '  <span class="cmd-palette-search-icon"><i data-lucide="search" class="ico"></i></span>',
      '  <input type="text" id="cmdPaletteInput" class="cmd-palette-input" placeholder="Type a concept, topic, or command (e.g. sharding, cache, attention, Round Robin)..." autocomplete="off" />',
      '  <button type="button" class="cmd-palette-close-btn" id="cmdPaletteCloseBtn" title="Close (Esc)">ESC</button>',
      '</div>',
      '<div class="cmd-palette-tabs">',
      '  <button type="button" class="cmd-palette-tab active" data-filter="all">All Topics</button>',
      '  <button type="button" class="cmd-palette-tab" data-filter="modules">Modules</button>',
      '  <button type="button" class="cmd-palette-tab" data-filter="notes">Notes</button>',
      '  <button type="button" class="cmd-palette-tab" data-filter="system-design">System Design</button>',
      '  <button type="button" class="cmd-palette-tab" data-filter="ai-engineering">AI Engineering</button>',
      '</div>',
      '<ul class="cmd-palette-results" id="cmdPaletteResults"></ul>',
      '<div class="cmd-palette-footer">',
      '  <div class="cmd-palette-hints">',
      '    <span class="cmd-palette-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>',
      '    <span class="cmd-palette-hint"><kbd>↵</kbd> Select</span>',
      '    <span class="cmd-palette-hint"><kbd>esc</kbd> Close</span>',
      '  </div>',
      '  <span id="cmdPaletteCount" style="color:var(--ink-3);font-size:11.5px;"></span>',
      '</div>'
    ].join("");

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    var input = modal.querySelector("#cmdPaletteInput");
    var resultsList = modal.querySelector("#cmdPaletteResults");
    var countSpan = modal.querySelector("#cmdPaletteCount");
    var closeBtn = modal.querySelector("#cmdPaletteCloseBtn");
    var tabs = modal.querySelectorAll(".cmd-palette-tab");

    var currentFilter = "all";
    var selectedIndex = 0;
    var currentFilteredItems = [];

    // Determine rootRel from body attribute or location
    var rootRel = document.body.getAttribute("data-root-rel") || "";
    if (rootRel === null || rootRel === undefined) rootRel = "";

    function openPalette() {
      backdrop.classList.add("open");
      modal.classList.add("open");
      input.value = "";
      input.focus();
      filterAndRender("");
      if (window.lucide) lucide.createIcons();
    }

    function closePalette() {
      backdrop.classList.remove("open");
      modal.classList.remove("open");
    }

    // Connect topbar search trigger button if present
    var topbarBtn = document.getElementById("openCommandPaletteBtn");
    if (topbarBtn) {
      topbarBtn.addEventListener("click", openPalette);
    }

    // Global keyboard shortcuts
    window.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (modal.classList.contains("open")) closePalette();
        else openPalette();
      } else if (e.key === "/" && document.activeElement && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        openPalette();
      } else if (e.key === "Escape" && modal.classList.contains("open")) {
        e.preventDefault();
        closePalette();
      }
    });

    backdrop.addEventListener("click", closePalette);
    closeBtn.addEventListener("click", closePalette);

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        currentFilter = tab.getAttribute("data-filter");
        filterAndRender(input.value);
      });
    });

    input.addEventListener("input", function () {
      filterAndRender(input.value);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentFilteredItems.length > 0) {
          selectedIndex = (selectedIndex + 1) % currentFilteredItems.length;
          updateActiveSelection();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentFilteredItems.length > 0) {
          selectedIndex = (selectedIndex - 1 + currentFilteredItems.length) % currentFilteredItems.length;
          updateActiveSelection();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (currentFilteredItems[selectedIndex]) {
          navigateItem(currentFilteredItems[selectedIndex]);
        }
      }
    });

    function navigateItem(item) {
      var targetPath = rootRel + item.path;
      window.location.href = targetPath;
      closePalette();
    }

    function highlight(text, query) {
      if (!query || !text) return htmlEscape(text || "");
      var words = query.split(/\s+/).filter(Boolean);
      if (!words.length) return htmlEscape(text || "");
      var safeWords = words.map(function(w) { return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
      var reg = new RegExp("(" + safeWords.join("|") + ")", "gi");
      var safeText = htmlEscape(text);
      return safeText.replace(reg, "<mark>$1</mark>");
    }

    function filterAndRender(query) {
      var q = query.toLowerCase().trim();
      var data = window.__SEARCH_INDEX__ || searchData;
      
      var filtered = data.filter(function (item) {
        if (currentFilter === "modules" && item.type !== "module") return false;
        if (currentFilter === "notes" && item.type !== "note") return false;
        if (currentFilter === "system-design" && item.courseId !== "system-design") return false;
        if (currentFilter === "ai-engineering" && item.courseId !== "ai-engineering") return false;

        if (!q) return true;

        var fullString = [
          item.title || "",
          item.subtitle || "",
          item.track || "",
          item.courseName || "",
          (item.keywords || []).join(" ")
        ].join(" ").toLowerCase();

        return fullString.indexOf(q) !== -1;
      });

      currentFilteredItems = filtered.slice(0, 30);
      selectedIndex = 0;

      if (currentFilteredItems.length === 0) {
        resultsList.innerHTML = '<li class="cmd-palette-empty">No results found for "<strong>' + htmlEscape(query) + '</strong>". Try searching for <em>latency, sharding, attention, cache, tokens, or load balancer</em>.</li>';
        countSpan.textContent = "0 results";
        return;
      }

      countSpan.textContent = filtered.length + " topic" + (filtered.length !== 1 ? "s" : "");

      var htmlParts = [];
      currentFilteredItems.forEach(function (item, idx) {
        var isSelected = idx === selectedIndex ? "active" : "";
        var iconName = item.icon || (item.type === "note" ? "notebook-pen" : (item.courseId === "system-design" ? "network" : "brain"));
        var badgeText = item.courseName || item.courseId;

        htmlParts.push([
          '<li class="cmd-palette-item ' + isSelected + '" data-index="' + idx + '">',
          '  <div class="cmd-palette-item-main">',
          '    <div class="cmd-palette-item-icon"><i data-lucide="' + iconName + '" class="ico"></i></div>',
          '    <div class="cmd-palette-item-text">',
          '      <div class="cmd-palette-item-title">' + highlight(item.title, q) + '</div>',
          '      <div class="cmd-palette-item-desc">' + highlight(item.subtitle, q) + '</div>',
          '    </div>',
          '  </div>',
          '  <div class="cmd-palette-item-meta">',
          '    <span class="cmd-palette-course-badge">' + htmlEscape(badgeText) + '</span>',
          '    <span class="cmd-palette-select-icon">↵</span>',
          '  </div>',
          '</li>'
        ].join(""));
      });

      resultsList.innerHTML = htmlParts.join("");

      var renderedItems = resultsList.querySelectorAll(".cmd-palette-item");
      renderedItems.forEach(function (el, idx) {
        el.addEventListener("mouseenter", function () {
          selectedIndex = idx;
          updateActiveSelection();
        });
        el.addEventListener("click", function () {
          navigateItem(currentFilteredItems[idx]);
        });
      });

      if (window.lucide) lucide.createIcons();
    }

    function updateActiveSelection() {
      var items = resultsList.querySelectorAll(".cmd-palette-item");
      items.forEach(function (item, idx) {
        if (idx === selectedIndex) {
          item.classList.add("active");
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.classList.remove("active");
        }
      });
    }

    function htmlEscape(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }

  // Initialize once DOM is ready
  function initAll() {
    initDiagramViewer();
    initNotesDrawer();
    initCommandPalette();
    if (window.lucide) lucide.createIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();


