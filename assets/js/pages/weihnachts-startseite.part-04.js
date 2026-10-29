const xmasEl = document.getElementById("xmasCountdown");

  function updateXmasCountdown() {
    const now = new Date();
    const year = now.getFullYear();
    const xmas = new Date(year, 11, 24, 0, 0, 0); // 24.12.

    if (now >= xmas) {
      xmasEl.textContent = "🎄 Frohe Weihnachten!";
      return;
    }

    let diff = xmas - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff %= 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff %= 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));

    xmasEl.textContent =
        `🎁 Heiligabend in ${days} Tagen ${hours} Std ${minutes} Min`;
    }

    updateXmasCountdown();
    setInterval(updateXmasCountdown, 60000);
