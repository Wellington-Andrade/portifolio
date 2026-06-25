(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  document.body.classList.add("is-ready");

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  if (!reducedMotion && finePointer) {
    root.classList.add("custom-cursor");

    const cursor = document.createElement("div");
    cursor.className = "cursor-core";
    cursor.setAttribute("aria-hidden", "true");
    document.body.append(cursor);

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let renderedX = cursorX;
    let renderedY = cursorY;

    window.addEventListener("pointermove", (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      cursor.classList.add("is-active");
      root.style.setProperty("--pointer-x", `${cursorX}px`);
      root.style.setProperty("--pointer-y", `${cursorY}px`);
    });

    const renderCursor = () => {
      renderedX += (cursorX - renderedX) * 0.2;
      renderedY += (cursorY - renderedY) * 0.2;
      cursor.style.transform = `translate3d(${renderedX - 11}px, ${renderedY - 11}px, 0)`;
      requestAnimationFrame(renderCursor);
    };
    renderCursor();
  }

  const getFullscreenElement = () =>
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null;

  const syncFullscreenCursor = () => {
    if (reducedMotion || !finePointer) return;

    if (getFullscreenElement()) {
      root.classList.remove("custom-cursor");
      return;
    }

    if (!document.body.classList.contains("lightbox-open")) {
      root.classList.add("custom-cursor");
    }
  };

  ["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((eventName) => {
    document.addEventListener(eventName, syncFullscreenCursor);
  });

  const scrollCue = document.querySelector(".scroll-cue");
  if (scrollCue) {
    let tickingCue = false;

    const renderScrollCue = () => {
      const fadeDistance = Math.max(180, window.innerHeight * 0.28);
      const opacity = Math.max(0, 1 - window.scrollY / fadeDistance);
      root.style.setProperty("--scroll-cue-opacity", opacity.toFixed(3));
      tickingCue = false;
    };

    const requestScrollCue = () => {
      if (!tickingCue) {
        tickingCue = true;
        requestAnimationFrame(renderScrollCue);
      }
    };

    window.addEventListener("scroll", requestScrollCue, { passive: true });
    window.addEventListener("resize", requestScrollCue);
    renderScrollCue();
  }

  const magneticItems = Array.from(document.querySelectorAll(".magnetic"));
  if (!reducedMotion && finePointer) {
    magneticItems.forEach((item) => {
      item.addEventListener("pointermove", (event) => {
        const rect = item.getBoundingClientRect();
        const relX = event.clientX - rect.left;
        const relY = event.clientY - rect.top;
        const centerX = relX - rect.width / 2;
        const centerY = relY - rect.height / 2;
        const moveX = Math.max(-10, Math.min(10, centerX * 0.08));
        const moveY = Math.max(-10, Math.min(10, centerY * 0.08));
        const tiltY = Math.max(-5, Math.min(5, centerX * 0.03));
        const tiltX = Math.max(-5, Math.min(5, centerY * -0.03));

        item.style.setProperty("--magnet-x", `${moveX}px`);
        item.style.setProperty("--magnet-y", `${moveY}px`);
        item.style.setProperty("--tilt-x", `${tiltX}deg`);
        item.style.setProperty("--tilt-y", `${tiltY}deg`);
      });

      item.addEventListener("pointerleave", () => {
        item.style.setProperty("--magnet-x", "0");
        item.style.setProperty("--magnet-y", "0");
        item.style.setProperty("--tilt-x", "0deg");
        item.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
  if (!reducedMotion && parallaxItems.length) {
    let ticking = false;

    const renderParallax = () => {
      const viewportCenter = window.innerHeight / 2;
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const speed = Number.parseFloat(item.dataset.parallax || "0.06");
        const itemCenter = rect.top + rect.height / 2;
        const offset = (itemCenter - viewportCenter) * speed;
        item.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
      });
      ticking = false;
    };

    const requestParallax = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(renderParallax);
      }
    };

    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax);
    requestParallax();
  }

  document.querySelectorAll(".summary-youtube").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });

  const lightboxButtons = Array.from(document.querySelectorAll("[data-lightbox-kind]"));
  if (lightboxButtons.length) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Fechar visualização ampliada">X</button>
      <div class="lightbox-frame"></div>
    `;
    document.body.append(overlay);

    const frame = overlay.querySelector(".lightbox-frame");
    const closeButton = overlay.querySelector(".lightbox-close");
    let previousFocus = null;

    const closeLightbox = () => {
      overlay.hidden = true;
      frame.replaceChildren();
      document.body.classList.remove("lightbox-open");
      if (!reducedMotion && finePointer && !getFullscreenElement()) root.classList.add("custom-cursor");
      if (previousFocus) previousFocus.focus();
    };

    const openLightbox = (button) => {
      const kind = button.dataset.lightboxKind;
      const src = button.dataset.lightboxSrc;
      previousFocus = document.activeElement;
      frame.replaceChildren();

      if (kind === "video") {
        const video = document.createElement("video");
        const silentLoop = button.dataset.lightboxLoop === "true";
        video.controls = !silentLoop;
        video.autoplay = silentLoop;
        video.muted = silentLoop;
        video.loop = silentLoop;
        video.playsInline = true;
        video.preload = "metadata";
        video.src = src;
        frame.append(video);
        if (silentLoop) video.play().catch(() => {});
      } else {
        const image = document.createElement("img");
        image.src = src;
        image.alt = button.dataset.lightboxAlt || "";
        frame.append(image);
      }

      overlay.hidden = false;
      document.body.classList.add("lightbox-open");
      root.classList.remove("custom-cursor");
      closeButton.focus();
    };

    lightboxButtons.forEach((button) => {
      button.addEventListener("click", () => openLightbox(button));
    });

    document.addEventListener("click", (event) => {
      const image = event.target.closest(".case-media figure img, .edit-media-grid figure img");
      if (!image) return;
      const button = image.parentElement.querySelector("[data-lightbox-kind]");
      if (button) openLightbox(button);
    });

    closeButton.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (!overlay.hidden && event.key === "Escape") closeLightbox();
    });
  }

  const canvases = Array.from(document.querySelectorAll("[data-signal-canvas]"));
  canvases.forEach((canvas) => {
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes = [];
    let rafId = 0;

    const createNodes = () => {
      const count = Math.max(32, Math.min(96, Math.floor((width * height) / 18000)));
      nodes = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.45 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        hue: index % 3,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createNodes();
    };

    const drawGrid = (time) => {
      context.clearRect(0, 0, width, height);
      context.lineWidth = 1;

      for (let y = -80; y < height + 80; y += 38) {
        context.beginPath();
        for (let x = -20; x < width + 20; x += 24) {
          const wave = Math.sin(x * 0.012 + time * 0.0013 + y * 0.006) * 14;
          const px = x;
          const py = y + wave + Math.sin(time * 0.001 + y * 0.01) * 10;
          if (x === -20) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        context.strokeStyle = "rgba(244, 246, 247, 0.08)";
        context.stroke();
      }
    };

    const drawNodes = (time) => {
      nodes.forEach((node, index) => {
        const driftX = Math.cos(time * 0.00035 * node.z + node.phase) * 18;
        const driftY = Math.sin(time * 0.00042 * node.z + node.phase) * 18;
        const x = node.x + driftX;
        const y = node.y + driftY;

        for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
          const next = nodes[nextIndex];
          const nextX = next.x + Math.cos(time * 0.00035 * next.z + next.phase) * 18;
          const nextY = next.y + Math.sin(time * 0.00042 * next.z + next.phase) * 18;
          const dx = x - nextX;
          const dy = y - nextY;
          const distance = Math.hypot(dx, dy);

          if (distance < 118) {
            const opacity = (1 - distance / 118) * 0.28;
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(nextX, nextY);
            context.strokeStyle = `rgba(124, 149, 169, ${opacity.toFixed(3)})`;
            context.stroke();
          }
        }

        context.beginPath();
        context.arc(x, y, 1.2 + node.z, 0, Math.PI * 2);
        const color =
          node.hue === 0
            ? "rgba(238, 243, 245, 0.72)"
            : node.hue === 1
              ? "rgba(124, 149, 169, 0.62)"
              : "rgba(78, 96, 114, 0.58)";
        context.fillStyle = color;
        context.fill();
      });
    };

    const frame = (time) => {
      drawGrid(time);
      drawNodes(time);
      if (!reducedMotion) rafId = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    frame(0);

    if (reducedMotion) {
      cancelAnimationFrame(rafId);
    }
  });
})();
