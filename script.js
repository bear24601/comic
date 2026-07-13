(() => {
  "use strict";

  if (typeof comicData === "undefined" || !comicData.chapters) {
    document.body.innerHTML =
      "<p style='padding:20px'>data.js 載入失敗。</p>";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  let chapterIndex = Number(params.get("chapter") || 0);

  if (
    !Number.isInteger(chapterIndex) ||
    !comicData.chapters[chapterIndex]
  ) {
    chapterIndex = 0;
  }

  const chapter = comicData.chapters[chapterIndex];
  const storageKey = `comic-progress-${chapterIndex}`;
  const requestedPage = Number(params.get("page"));

  let currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage - 1
      : Number(localStorage.getItem(storageKey) || 0);

  if (
    !Number.isInteger(currentPage) ||
    currentPage < 0 ||
    currentPage >= chapter.pages.length
  ) {
    currentPage = 0;
  }

  const comicImage = document.getElementById("comicImage");
  const loadingText = document.getElementById("loadingText");
  const imageStage = document.getElementById("imageStage");
  const chapterTitle = document.getElementById("chapterTitle");
  const pageCounter = document.getElementById("pageCounter");
  const nextPageButton = document.getElementById("nextPageButton");
  const previousPageButton =
    document.getElementById("previousPageButton");
  const firstPageButton =
    document.getElementById("firstPageButton");
  const chapterSelect =
    document.getElementById("chapterSelect");
  const pageSelectTop =
    document.getElementById("pageSelectTop");
  const pageSelectBottom =
    document.getElementById("pageSelectBottom");
  const previousChapterButton =
    document.getElementById("previousChapterButton");
  const nextChapterButton =
    document.getElementById("nextChapterButton");
  const fullscreenButton =
    document.getElementById("fullscreenButton");

  chapterTitle.textContent =
    `第 ${chapter.number} 話｜${chapter.title}`;
  document.title = `${chapter.title}｜${comicData.siteTitle}`;

  comicData.chapters.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent =
      `第 ${item.number} 話｜${item.title}`;
    option.selected = index === chapterIndex;
    chapterSelect.appendChild(option);
  });

  function buildPageSelect(selectElement) {
    selectElement.innerHTML = "";

    chapter.pages.forEach((_, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `第 ${index + 1} 頁`;
      selectElement.appendChild(option);
    });
  }

  buildPageSelect(pageSelectTop);
  buildPageSelect(pageSelectBottom);

  function updateControls() {
    pageSelectTop.value = String(currentPage);
    pageSelectBottom.value = String(currentPage);

    previousPageButton.disabled = currentPage === 0;

    nextPageButton.disabled =
      currentPage === chapter.pages.length - 1 &&
      chapterIndex === comicData.chapters.length - 1;
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("chapter", String(chapterIndex));
    url.searchParams.set("page", String(currentPage + 1));
    history.replaceState(null, "", url);
  }

  function showPage() {
    if (!chapter.pages[currentPage]) {
      loadingText.hidden = false;
      loadingText.textContent = "此頁沒有圖片路徑。";
      comicImage.hidden = true;
      return;
    }

    loadingText.hidden = false;
    loadingText.textContent = "圖片讀取中……";
    comicImage.hidden = true;

    const targetPath = chapter.pages[currentPage];

    const preload = new Image();

    preload.onload = () => {
      comicImage.src = targetPath;
      comicImage.hidden = false;
      loadingText.hidden = true;

      imageStage.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    preload.onerror = () => {
      comicImage.hidden = true;
      loadingText.hidden = false;
      loadingText.textContent =
        `圖片載入失敗：${targetPath}`;
    };

    preload.src = `${targetPath}?v=20260714-clean`;

    pageCounter.textContent =
      `第 ${currentPage + 1}／${chapter.pages.length} 頁`;

    updateControls();
    localStorage.setItem(storageKey, String(currentPage));
    updateUrl();
  }

  function nextPage() {
    if (currentPage < chapter.pages.length - 1) {
      currentPage += 1;
      showPage();
      return;
    }

    if (chapterIndex < comicData.chapters.length - 1) {
      location.href =
        `reader.html?chapter=${chapterIndex + 1}&page=1`;
    }
  }

  function previousPage() {
    if (currentPage > 0) {
      currentPage -= 1;
      showPage();
      return;
    }

    if (chapterIndex > 0) {
      location.href =
        `reader.html?chapter=${chapterIndex - 1}&page=1`;
    }
  }

  function goToPage(value) {
    const target = Number(value);

    if (
      Number.isInteger(target) &&
      target >= 0 &&
      target < chapter.pages.length
    ) {
      currentPage = target;
      showPage();
    }
  }

  /* 明確按鈕：下一頁在左，上一頁在右 */
  nextPageButton.addEventListener("click", nextPage);
  previousPageButton.addEventListener(
    "click",
    previousPage
  );

  /* 點圖片：左半邊下一頁，右半邊上一頁 */
  imageStage.addEventListener("click", event => {
    const rect = imageStage.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    if (clickX < rect.width / 2) {
      nextPage();
    } else {
      previousPage();
    }
  });

  firstPageButton.addEventListener("click", () => {
    currentPage = 0;
    showPage();
  });

  pageSelectTop.addEventListener("change", event => {
    goToPage(event.target.value);
  });

  pageSelectBottom.addEventListener("change", event => {
    goToPage(event.target.value);
  });

  chapterSelect.addEventListener("change", () => {
    location.href =
      `reader.html?chapter=${chapterSelect.value}&page=1`;
  });

  previousChapterButton.disabled = chapterIndex === 0;
  nextChapterButton.disabled =
    chapterIndex === comicData.chapters.length - 1;

  previousChapterButton.addEventListener("click", () => {
    if (chapterIndex > 0) {
      location.href =
        `reader.html?chapter=${chapterIndex - 1}&page=1`;
    }
  });

  nextChapterButton.addEventListener("click", () => {
    if (chapterIndex < comicData.chapters.length - 1) {
      location.href =
        `reader.html?chapter=${chapterIndex + 1}&page=1`;
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") nextPage();
    if (event.key === "ArrowRight") previousPage();

    if (event.key === "Home") {
      currentPage = 0;
      showPage();
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;

  comicImage.addEventListener(
    "touchstart",
    event => {
      const touch = event.changedTouches[0];
      touchStartX = touch.screenX;
      touchStartY = touch.screenY;
    },
    { passive: true }
  );

  comicImage.addEventListener(
    "touchend",
    event => {
      const touch = event.changedTouches[0];
      const dx = touch.screenX - touchStartX;
      const dy = touch.screenY - touchStartY;

      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) previousPage();
        if (dx > 0) nextPage();
      }
    },
    { passive: true }
  );

  fullscreenButton.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (_) {}

      document.body.classList.remove("immersive-mode");
      fullscreenButton.textContent = "全螢幕";
      return;
    }

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        fullscreenButton.textContent = "退出全螢幕";
        return;
      }
    } catch (_) {
      // Facebook / Messenger 可能阻擋。
    }

    document.body.classList.toggle("immersive-mode");
    fullscreenButton.textContent =
      document.body.classList.contains("immersive-mode")
        ? "退出全螢幕"
        : "全螢幕";
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      fullscreenButton.textContent = "全螢幕";
    }
  });

  showPage();
})();
