const nav = document.querySelector(".site-nav");
const toggle = document.querySelector(".nav-toggle");

if (nav && toggle) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "메뉴 열기");
    });
  });
}

document.querySelectorAll("[data-current-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const forcedVideos = document.querySelectorAll("video[data-force-play]");
if (forcedVideos.length) {
  const playVideo = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;

    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
  };

  forcedVideos.forEach((video) => {
    video.preload = "auto";
    video.addEventListener("loadeddata", () => playVideo(video), { once: true });
    video.addEventListener("canplay", () => playVideo(video));
    video.addEventListener("pause", () => {
      if (!document.hidden) playVideo(video);
    });
    video.load();
    playVideo(video);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) forcedVideos.forEach(playVideo);
  });
}

const toc = document.querySelector(".sub-toc");
if (toc) {
  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  const sections = links
    .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
    .filter((item) => item.section);

  const setActiveToc = (activeLink) => {
    links.forEach((link) => link.classList.toggle("active", link === activeLink));
  };

  links.forEach((link) => {
    link.addEventListener("click", () => setActiveToc(link));
  });

  const updateActiveToc = () => {
    const probe = window.scrollY + 140;
    let current = sections[0];

    sections.forEach((item) => {
      if (item.section.offsetTop <= probe) current = item;
    });

    if (current) setActiveToc(current.link);
  };

  window.addEventListener("scroll", updateActiveToc, { passive: true });
  updateActiveToc();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cert-scroll]");
  if (!button) return;

  const rail = document.getElementById("certRail");
  const firstCard = rail && rail.querySelector(".cert-card-modern");
  if (!rail || !firstCard) return;

  event.preventDefault();

  const direction = Number(button.getAttribute("data-cert-scroll")) || 1;
  const styles = window.getComputedStyle(rail);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "18") || 18;
  const cardsPerStep = window.matchMedia("(max-width: 820px)").matches ? 1 : 3;
  const step = Math.round((firstCard.getBoundingClientRect().width + gap) * cardsPerStep);
  const max = rail.scrollWidth - rail.clientWidth;
  let next = rail.scrollLeft + direction * step;

  if (direction > 0) next = rail.scrollLeft >= max - 8 ? 0 : Math.min(next, max);
  if (direction < 0) next = rail.scrollLeft <= 8 ? max : Math.max(next, 0);

  rail.scrollTo({ left: next, behavior: "smooth" });
});
