const pageLoader = document.querySelector("[data-page-loader]");

if (pageLoader) {
  const loaderStartedAt = performance.now();

  window.addEventListener("load", () => {
    const remainingTime = Math.max(0, 900 - (performance.now() - loaderStartedAt));

    window.setTimeout(() => {
      pageLoader.classList.add("is-hidden");
      pageLoader.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("is-loading");
      window.setTimeout(() => pageLoader.remove(), 500);
    }, remainingTime);
  }, { once: true });
}

const sectionLinks = document.querySelectorAll("[data-section-link]");
const navigableSections = document.querySelectorAll("main .section[id]");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      sectionLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${entry.target.id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  }, { rootMargin: "-30% 0px -60% 0px" });

  navigableSections.forEach((section) => sectionObserver.observe(section));
}

if (
  "IntersectionObserver" in window
  && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  document.documentElement.classList.add("has-reveal");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
}

document.querySelectorAll("[data-frame-image]").forEach((image) => {
  const frame = image.closest("[data-image-frame]");

  if (!frame) {
    throw new Error("Image frame is missing its data-image-frame container.");
  }

  const updateFrame = () => {
    const loaded = image.naturalWidth > 0;
    image.hidden = !loaded;
    frame.classList.toggle("has-image", loaded);
  };

  image.addEventListener("load", updateFrame);
  image.addEventListener("error", updateFrame);

  if (image.complete) {
    updateFrame();
  }
});

document.querySelectorAll("[data-preview-toggle]").forEach((button) => {
  const panel = document.getElementById(button.getAttribute("aria-controls"));

  if (!panel) {
    throw new Error(`Preview panel not found for ${button.getAttribute("aria-controls")}.`);
  }

  const iframe = panel.querySelector("iframe[data-preview-src]");
  const stage = panel.querySelector("[data-preview-stage]");
  const loaderLabel = panel.querySelector("[data-preview-loader-label]");
  const progressValue = panel.querySelector("[data-preview-progress]");
  const progressFill = panel.querySelector("[data-preview-progress-fill]");

  if (!iframe) {
    throw new Error(`Preview iframe missing in ${panel.id}.`);
  }

  if (!stage || !loaderLabel || !progressValue || !progressFill) {
    throw new Error(`Preview loader missing in ${panel.id}.`);
  }

  let hideLoaderTimer;
  let progressTimer;

  const setProgress = (value) => {
    const safeValue = Math.min(100, Math.max(0, value));
    progressValue.textContent = `${safeValue}%`;
    progressFill.style.width = `${safeValue}%`;
  };

  const startProgress = () => {
    window.clearInterval(progressTimer);
    setProgress(12);
    let progress = 12;
    progressTimer = window.setInterval(() => {
      progress = Math.min(92, progress + (progress < 40 ? 7 : progress < 70 ? 4 : 2));
      setProgress(progress);
    }, 220);
  };

  iframe.addEventListener("load", () => {
    window.clearInterval(progressTimer);
    setProgress(100);
    window.clearTimeout(hideLoaderTimer);
    hideLoaderTimer = window.setTimeout(() => {
      stage.classList.add("is-loaded");
    }, 280);
  });

  iframe.addEventListener("error", () => {
    window.clearInterval(progressTimer);
    window.clearTimeout(hideLoaderTimer);
    loaderLabel.textContent = "โหลดเดโมไม่สำเร็จ";
  });

  button.addEventListener("click", () => {
    const opening = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(opening));
    button.textContent = opening ? button.dataset.closeLabel : button.dataset.openLabel;
    panel.hidden = !opening;

    if (opening) {
      stage.classList.remove("is-loaded");
      loaderLabel.textContent = "กำลังโหลดเดโม...";
      startProgress();
      if (!iframe.getAttribute("src")) {
        iframe.setAttribute("src", iframe.dataset.previewSrc);
      }
      panel.scrollIntoView({ block: "nearest" });
    } else {
      iframe.removeAttribute("src");
    }
  });
});

document.querySelectorAll("[data-video-player]").forEach((player) => {
  const video = player.querySelector("[data-video]");
  const title = player.querySelector("[data-video-title]");
  const counter = player.querySelector("[data-video-counter]");
  const dotsContainer = player.querySelector("[data-video-dots]");
  const previousButton = player.querySelector("[data-video-prev]");
  const nextButton = player.querySelector("[data-video-next]");
  const muteButton = player.querySelector("[data-video-mute]");
  const playButton = player.querySelector("[data-video-play]");
  const loader = player.querySelector("[data-video-loader]");
  const loaderLabel = player.querySelector("[data-video-loader-label]");

  if (!video || !title || !counter || !dotsContainer || !previousButton || !nextButton || !muteButton || !playButton || !loader || !loaderLabel) {
    throw new Error("Video player is missing required controls.");
  }

  const playlist = [
    { title: "Tenshi Akuma Final", src: "Video/Video/Tenshi Akuma Final.mp4" },
    { title: "NanarisComplete", src: "Video/Video/NanarisComplete.mp4" },
    { title: "Nana 3D Model", src: "Video/Video/Nana 3D Model.mp4" },
    { title: "Nan Final hero", src: "Video/Video/Nan Final hero.mp4" },
  ];

  const frameCanvas = document.createElement("canvas");
  frameCanvas.className = "hobby-player__frame";
  frameCanvas.setAttribute("aria-hidden", "true");
  video.insertAdjacentElement("afterend", frameCanvas);
  const frameContext = frameCanvas.getContext("2d");
  if (!frameContext) {
    throw new Error("Unable to create the video frame canvas.");
  }

  let currentIndex = 0;
  let loadTimer;
  let hideLoaderTimer;
  let slowLoaderTimer;
  let frameTransitionId = 0;
  video.muted = false;

  const showLoader = (message = "กำลังโหลดวิดีโอ...") => {
    window.clearTimeout(hideLoaderTimer);
    loaderLabel.textContent = message;
    loader.classList.remove("is-hidden");
  };

  const hideLoader = () => {
    window.clearTimeout(slowLoaderTimer);
    window.clearTimeout(hideLoaderTimer);
    hideLoaderTimer = window.setTimeout(() => {
      loader.classList.add("is-hidden");
    }, 280);
  };

  const showSlowLoader = (message) => {
    window.clearTimeout(slowLoaderTimer);
    slowLoaderTimer = window.setTimeout(() => {
      showLoader(message);
    }, 700);
  };

  video.addEventListener("loadeddata", () => {
    const transitionId = frameTransitionId;
    const hideTransitionFrame = () => {
      if (transitionId === frameTransitionId) {
        frameCanvas.classList.remove("is-visible");
      }
    };

    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(hideTransitionFrame);
    } else {
      window.requestAnimationFrame(() => window.requestAnimationFrame(hideTransitionFrame));
    }

    hideLoader();
  });
  video.addEventListener("canplay", hideLoader);
  video.addEventListener("playing", hideLoader);
  video.addEventListener("waiting", () => showSlowLoader("กำลังบัฟเฟอร์วิดีโอ..."));
  video.addEventListener("stalled", () => showSlowLoader("กำลังรอวิดีโอโหลด..."));
  video.addEventListener("error", () => showSlowLoader("โหลดวิดีโอไม่สำเร็จ"));

  const updateMuteControl = () => {
    muteButton.textContent = video.muted ? "เสียงปิด" : "เสียงเปิด";
    muteButton.setAttribute("aria-label", video.muted ? "เปิดเสียง" : "ปิดเสียง");
  };
  updateMuteControl();

  const dots = playlist.map((item, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hobby-player__dot";
    dot.setAttribute("aria-label", `เปิดวิดีโอ ${item.title}`);
    dot.addEventListener("click", () => showVideo(index));
    dotsContainer.append(dot);
    return dot;
  });

  const playCurrentVideo = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        video.controls = false;
      });
    }
  };

  const showVideo = (index) => {
    window.clearTimeout(loadTimer);
    currentIndex = (index + playlist.length) % playlist.length;
    const item = playlist[currentIndex];
    frameTransitionId += 1;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      frameCanvas.width = video.videoWidth;
      frameCanvas.height = video.videoHeight;
      frameContext.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
      frameCanvas.classList.add("is-visible");
    } else if (!frameCanvas.classList.contains("is-visible")) {
      frameCanvas.classList.remove("is-visible");
    }

    video.pause();
    video.muted = false;
    updateMuteControl();
    video.innerHTML = "";
    const source = document.createElement("source");
    source.src = item.src;
    source.type = "video/mp4";
    video.append(source);
    video.load();

    title.textContent = item.title;
    counter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(playlist.length).padStart(2, "0")}`;
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
      dot.setAttribute("aria-current", dotIndex === currentIndex ? "true" : "false");
    });

    loadTimer = window.setTimeout(playCurrentVideo, 100);
  };

  previousButton.addEventListener("click", () => showVideo(currentIndex - 1));
  nextButton.addEventListener("click", () => showVideo(currentIndex + 1));
  video.addEventListener("ended", () => showVideo(currentIndex + 1));
  video.addEventListener("error", () => {
    window.clearTimeout(loadTimer);
    loadTimer = window.setTimeout(() => showVideo(currentIndex + 1), 1500);
  });

  muteButton.addEventListener("click", () => {
    video.muted = !video.muted;
    updateMuteControl();
  });

  playButton.addEventListener("click", () => {
    if (video.paused) {
      playCurrentVideo();
    } else {
      video.pause();
    }
  });

  video.addEventListener("play", () => {
    playButton.textContent = "II";
    playButton.setAttribute("aria-label", "หยุดวิดีโอ");
  });

  video.addEventListener("pause", () => {
    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", "เล่นวิดีโอ");
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === 0);
  });

  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      playCurrentVideo();
    } else {
      video.pause();
    }
  }, { threshold: 0.45 });

  observer.observe(player);
});

document.querySelectorAll("[data-copy-email]").forEach((button) => {
  const status = document.querySelector("[data-copy-status]");
  const toast = button.parentElement?.querySelector("[data-copy-toast]");
  const toastImage = toast?.querySelector("[data-copy-toast-image]");
  const toastLabel = toast?.querySelector("[data-copy-toast-label]");
  const email = button.dataset.copyEmail;

  if (!status || !toast || !toastImage || !toastLabel || !email) {
    throw new Error("Email copy button is missing its email or feedback elements.");
  }

  let dismissTimer;
  const showFeedback = (message, isError = false) => {
    window.clearTimeout(dismissTimer);
    status.textContent = message;
    toastImage.hidden = isError;
    toastLabel.hidden = !isError;
    toastLabel.textContent = isError ? "คัดลอกไม่สำเร็จ" : "";
    toast.classList.toggle("contact__copy-toast--image", !isError);
    toast.dataset.state = isError ? "error" : "success";
    toast.classList.remove("is-visible");
    document.body.append(toast);
    const buttonBounds = button.getBoundingClientRect();
    if (isError) {
      toast.style.left = `${buttonBounds.left + 8}px`;
      toast.style.top = `${buttonBounds.top - 8}px`;
      toast.style.setProperty("--toast-x-apex", `${-Math.min(toast.offsetWidth * 0.28, buttonBounds.width * 0.24)}px`);
      toast.style.setProperty("--toast-x-land", `${-(toast.offsetWidth * 0.4 + 16)}px`);
      toast.style.setProperty("--toast-y-apex", "-38px");
      toast.style.setProperty("--toast-y-land", `${window.innerHeight - (buttonBounds.top - 8) - toast.offsetHeight * 0.6}px`);
      toast.style.setProperty("--toast-y-exit", `${window.innerHeight - (buttonBounds.top - 8) + toast.offsetHeight + 24}px`);
    } else {
      const centeredLeft = buttonBounds.left + (buttonBounds.width - toast.offsetWidth) / 2;
      const maxLeft = window.innerWidth - toast.offsetWidth - 8;
      toast.style.left = `${Math.max(8, Math.min(centeredLeft, maxLeft))}px`;
      toast.style.top = `${Math.max(8, buttonBounds.top - toast.offsetHeight - 8)}px`;
    }
    toast.getBoundingClientRect();
    toast.classList.add("is-visible");
    dismissTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 1800);
  };

  button.addEventListener("click", async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const input = document.createElement("textarea");
        input.value = email;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.append(input);
        let copied;
        try {
          input.select();
          copied = document.execCommand("copy");
        } finally {
          input.remove();
        }

        if (!copied) {
          throw new Error("Clipboard copy command was rejected.");
        }
      }

      showFeedback("คัดลอกอีเมลแล้ว");
    } catch (error) {
      showFeedback("คัดลอกไม่สำเร็จ กรุณาคัดลอกอีเมลด้วยตนเอง", true);
      console.error("Could not copy the contact email.", error);
    }
  });
});
