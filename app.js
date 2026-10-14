(() => {
  const data = window.NIGHTLIST || {};
  const ticketStage = document.getElementById("ticketStage");
  const posterStage = document.getElementById("posterStage");
  const ticket = document.getElementById("ticket");
  const modal = document.getElementById("modalLayer");
  const form = document.getElementById("rsvpForm");
  const rsvpFrame = document.getElementById("rsvpFrame");
  const rsvpDirectLink = document.getElementById("rsvpDirectLink");
  const result = document.getElementById("formResult");
  const enterButton = document.getElementById("enterButton");
  const requestButton = document.getElementById("requestButton");
  const closeButton = document.getElementById("closeModal");
  const musicSegments = Array.isArray(data.musicSegments) ? data.musicSegments.filter((part) => part.src && part.duration > 0) : [];
  const segmentStarts = [];
  const totalDuration = musicSegments.reduce((elapsed, part) => {
    segmentStarts.push(elapsed);
    return elapsed + part.duration;
  }, 0);
  const musicDock = document.getElementById("musicDock");
  const musicToggle = document.getElementById("musicToggle");
  const musicToggleIcon = document.getElementById("musicToggleIcon");
  const musicMessage = document.getElementById("musicMessage");
  const musicProgress = document.getElementById("musicProgress");
  const musicElapsed = document.getElementById("musicElapsed");
  const musicDuration = document.getElementById("musicDuration");
  const audio = document.getElementById("partyAudio");
  let entered = false;
  let previousFocus = null;
  let musicWanted = false;
  let musicState = "paused";
  let segmentIndex = 0;
  let changingSegment = false;
  let seekVersion = 0;
  let submissionId = crypto.randomUUID();

  const formatTime = (seconds) => {
    const whole = Math.max(0, Math.floor(seconds || 0));
    return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  };
  const showMusicState = (state, message) => {
    musicState = state;
    musicDock.dataset.state = state;
    musicMessage.textContent = message;
    musicToggleIcon.textContent = musicWanted ? "Ⅱ" : "▶";
    musicToggle.setAttribute("aria-label", musicWanted ? "Pause the music" : "Play the music");
  };
  const updateProgress = (elapsed = segmentStarts[segmentIndex] + (audio.currentTime || 0)) => {
    const time = Math.max(0, Math.min(totalDuration, elapsed));
    musicProgress.value = String(Math.round(time));
    musicProgress.style.setProperty("--progress", `${totalDuration ? (time / totalDuration) * 100 : 0}%`);
    musicProgress.setAttribute("aria-valuetext", `${formatTime(time)} of ${formatTime(totalDuration)}`);
    musicElapsed.textContent = formatTime(time);
  };
  const playAudio = () => {
    if (!entered || !musicSegments.length) return;
    musicWanted = true;
    showMusicState("loading", "STARTING THE DIWALI MIX…");
    const attempt = audio.play();
    attempt?.catch(() => {
      if (!musicWanted) return;
      musicWanted = false;
      changingSegment = false;
      showMusicState("paused", "TAP PLAY TO START THE MIX");
    });
  };
  const switchSegment = (index, localTime, resume) => {
    changingSegment = true;
    audio.pause();
    segmentIndex = index;
    audio.src = musicSegments[index].src;
    audio.load();
    const version = ++seekVersion;
    if (localTime > 0) {
      audio.addEventListener("loadedmetadata", () => {
        if (version !== seekVersion) return;
        audio.currentTime = Math.min(localTime, Math.max(0, audio.duration - 0.1));
        updateProgress();
      }, { once: true });
    }
    updateProgress(segmentStarts[index] + localTime);
    if (resume) playAudio();
    else changingSegment = false;
  };
  if (musicSegments.length) audio.src = musicSegments[0].src;
  musicProgress.max = String(Math.round(totalDuration));
  musicDuration.textContent = formatTime(totalDuration);
  updateProgress(0);

  audio.addEventListener("playing", () => {
    changingSegment = false;
    if (musicWanted) showMusicState("playing", "@theprathambatra's set is playing");
  });
  audio.addEventListener("waiting", () => {
    if (musicWanted) showMusicState("loading", "BUFFERING THE MIX…");
  });
  audio.addEventListener("pause", () => {
    if (changingSegment || audio.ended || musicState !== "playing") return;
    musicWanted = false;
    showMusicState("paused", "PAUSED · TAP PLAY TO RESUME");
  });
  audio.addEventListener("timeupdate", () => updateProgress());
  audio.addEventListener("ended", () => {
    if (!musicWanted) return;
    if (segmentIndex + 1 < musicSegments.length) {
      showMusicState("loading", "KEEPING THE MIX GOING…");
      switchSegment(segmentIndex + 1, 0, true);
    } else {
      musicWanted = false;
      updateProgress(totalDuration);
      showMusicState("paused", "SET FINISHED · TAP PLAY TO REPLAY");
    }
  });
  audio.addEventListener("error", () => {
    if (!musicSegments.length) return;
    musicWanted = false;
    changingSegment = false;
    showMusicState("paused", "AUDIO COULDN’T LOAD · TAP PLAY TO RETRY");
  });
  musicToggle.addEventListener("click", () => {
    if (musicWanted) {
      musicWanted = false;
      audio.pause();
      showMusicState("paused", "PAUSED · TAP PLAY TO RESUME");
    } else {
      if (audio.ended && segmentIndex === musicSegments.length - 1) switchSegment(0, 0, false);
      playAudio();
    }
  });
  musicProgress.addEventListener("input", () => updateProgress(Number(musicProgress.value)));
  musicProgress.addEventListener("change", () => {
    if (!musicSegments.length) return;
    const time = Math.max(0, Math.min(totalDuration - 0.1, Number(musicProgress.value)));
    const index = musicSegments.findIndex((part, i) => time < segmentStarts[i] + part.duration);
    const targetIndex = index < 0 ? musicSegments.length - 1 : index;
    const localTime = time - segmentStarts[targetIndex];
    if (targetIndex === segmentIndex) {
      audio.currentTime = localTime;
      updateProgress(time);
    } else {
      switchSegment(targetIndex, localTime, musicWanted);
    }
  });

  document.querySelectorAll("[data-copy]").forEach((node) => {
    const value = data[node.dataset.copy];
    if (typeof value === "string") node.textContent = value;
  });
  if (Array.isArray(data.organisers)) {
    const names = data.organisers.filter(Boolean);
    const hostNames = document.getElementById("hostNames");
    hostNames.textContent = names.join(" · ");
    document.getElementById("ticketHosts").textContent = `HOSTED BY ${names.join(" · ")}`;
    document.getElementById("modalHosts").textContent = names.join(" · ");
  }
  if (data.mapUrl) document.querySelectorAll("[data-map-link]").forEach((link) => { link.href = data.mapUrl; });

  const pictures = Array.isArray(data.photos) ? data.photos.filter(Boolean) : [];
  const photoWindow = document.getElementById("polaroidWindow");
  pictures.forEach((src, index) => {
    const img = new Image();
    img.src = src;
    img.alt = index === 0 ? "Friends dancing at a Diwali party" : "";
    img.decoding = "async";
    img.className = index === 0 ? "active" : "";
    photoWindow.append(img);
  });
  let photoIndex = 0;
  if (pictures.length > 1) {
    setInterval(() => {
      if (!entered || document.hidden) return;
      const images = [...photoWindow.querySelectorAll("img")];
      images[photoIndex].classList.remove("active");
      photoIndex = (photoIndex + 1) % images.length;
      images[photoIndex].classList.add("active");
    }, 3200);
  }

  const reveal = () => {
    if (entered) return;
    entered = true;
    playAudio(); // Runs directly from the visitor's ticket tap.
    document.body.classList.add("entered");
    posterStage.inert = false;
    ticketStage.inert = true;
    window.setTimeout(() => {
      ticketStage.hidden = true;
      requestButton.focus({ preventScroll: true });
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850);
  };
  enterButton.addEventListener("click", reveal);
  ticket.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    if (event.target !== enterButton && !enterButton.contains(event.target)) reveal();
  });
  ticketStage.addEventListener("pointermove", (event) => {
    if (entered || event.pointerType === "touch") return;
    const x = (event.clientX / innerWidth - .5) * 7;
    const y = (event.clientY / innerHeight - .5) * -6;
    ticket.style.setProperty("--tilt-x", `${y}deg`);
    ticket.style.setProperty("--tilt-y", `${x}deg`);
  });
  ticketStage.addEventListener("pointerleave", () => {
    ticket.style.setProperty("--tilt-x", "0deg");
    ticket.style.setProperty("--tilt-y", "0deg");
  });

  const openModal = () => {
    if (typeof data.rsvpFormUrl === "string" &&
        /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(data.rsvpFormUrl) &&
        !rsvpFrame.dataset.loaded) {
      rsvpFrame.src = data.rsvpFormUrl;
      rsvpFrame.hidden = false;
      rsvpDirectLink.href = data.rsvpFormUrl;
      rsvpDirectLink.hidden = false;
      form.hidden = true;
      rsvpFrame.dataset.loaded = "true";
    }
    previousFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    posterStage.inert = true;
    closeButton.focus({ preventScroll: true });
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    posterStage.inert = false;
    previousFocus?.focus({ preventScroll: true });
  };
  requestButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  document.getElementById("modalBackdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
    if (event.key !== "Tab" || modal.hidden) return;
    const focusable = [...modal.querySelectorAll("button, input:not([disabled])")].filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) {
      focusable.at(-1).focus(); event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
      focusable[0].focus(); event.preventDefault();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form));
    payload.full_name = payload.full_name.trim();
    payload.contact = payload.contact.trim();
    payload.submission_id = submissionId;
    if (!payload.full_name || !payload.contact || !["Yes", "No"].includes(payload.alcohol)) return;
    button.disabled = true;
    result.hidden = true;
    try {
      if (data.rsvpEndpoint) {
        const response = await fetch(data.rsvpEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const receipt = await response.json();
        if (receipt.ok !== true) throw new Error("RSVP was not confirmed");
        result.textContent = "REQUEST RECEIVED. SEE YOU AT DIWALI NIGHT.";
        form.reset();
        submissionId = crypto.randomUUID();
      } else {
        result.textContent = "RSVP SUBMISSIONS ARE BEING CONNECTED. PLEASE CONTACT AN ORGANISER.";
      }
    } catch (error) {
      result.textContent = "THE REQUEST DIDN’T GO THROUGH. PLEASE TRY AGAIN.";
      console.error(error);
    } finally {
      result.hidden = false;
      button.disabled = false;
    }
  });
})();
