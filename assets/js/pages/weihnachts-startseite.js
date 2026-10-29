// Countdown
      const countdownEl = document.getElementById("countdown");
      const targetDate = new Date("2025-12-12 20:30:00");
      function updateCountdown() {
        const now = new Date();
        let diff = targetDate - now;
        if (diff <= 0) {
          countdownEl.textContent = "läuft!";
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff %= 1000 * 60 * 60 * 24;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff %= 1000 * 60 * 60;
        const minutes = Math.floor(diff / (1000 * 60));
        diff %= 1000 * 60;
        const seconds = Math.floor(diff / 1000);
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
        countdownEl.textContent = parts.join(" ");
      }
      updateCountdown();
      setInterval(updateCountdown, 1000);

      // Schnee / Geschenke / Glitter
      const snowContainer = document.getElementById("snowflakes");
      const giftContainer = document.getElementById("gifts");
      const glitterContainer = document.getElementById("glitters");

      function createSnowflake() {
        const f = document.createElement("div");
        f.className = "snowflake";
        f.textContent = "❄";
        f.style.left = Math.random() * window.innerWidth + "px";
        f.style.fontSize = 12 + Math.random() * 24 + "px";
        f.style.animationDuration = 5 + Math.random() * 10 + "s";
        f.style.opacity = Math.random();
        snowContainer.appendChild(f);
        setTimeout(() => f.remove(), 15000);
      }
      function createGift() {
        const g = document.createElement("div");
        g.className = "gift";
        g.textContent = "🎁";
        g.style.left = Math.random() * window.innerWidth + "px";
        g.style.animationDuration = 6 + Math.random() * 8 + "s";
        giftContainer.appendChild(g);
        setTimeout(() => g.remove(), 20000);
      }
      function createGlitter() {
        const g = document.createElement("div");
        g.className = "glitter";
        g.style.left = Math.random() * window.innerWidth + "px";
        g.style.top = Math.random() * window.innerHeight + "px";
        glitterContainer.appendChild(g);
        setTimeout(() => g.remove(), 4000);
      }
      setInterval(createSnowflake, 200);
      setInterval(createGift, 1000);
      setInterval(createGlitter, 300);

      // Geschwungene Lichterkette
      const canvas = document.getElementById("lightGarland");
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = 100;
      const lights = [];
      for (let i = 0; i < 20; i++) {
        lights.push({
          x: i * (canvas.width / 20),
          y: 50 + 20 * Math.sin(i / 2),
          color: ["red", "yellow", "green", "blue"][i % 4],
          phase: Math.random() * Math.PI * 2,
        });
      }
      function drawLights() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        for (let i = 0; i < lights.length; i++) {
          const l = lights[i];
          l.y = 50 + 20 * Math.sin(i / 2 + Date.now() / 1000 + l.phase);
          ctx.fillStyle = l.color;
          ctx.beginPath();
          ctx.arc(l.x, l.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        requestAnimationFrame(drawLights);
      }
      drawLights();
