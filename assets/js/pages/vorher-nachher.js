const slider = document.getElementById("slider");
  const beforeMask = document.getElementById("beforeMask");
  const sliderLine = document.getElementById("sliderLine");

  slider.addEventListener("input", (e) => {
    const p = e.target.value;

    // Masken-Cut verschieben (Vorher)
    beforeMask.style.maskImage =
      `linear-gradient(to right, black ${p}%, transparent ${p}%)`;
    beforeMask.style.webkitMaskImage =
      `linear-gradient(to right, black ${p}%, transparent ${p}%)`;

    // Sliderlinie bewegen
    sliderLine.style.left = p + "%";
  });
