const music = document.getElementById("bgMusic");

  // Autoplay nach User-Interaktion (Browser-Regel)
  function startMusic() {
    music.volume = 0.4; // Lautstärke (0.0 - 1.0)
    music.play().catch(() => {
      console.log("Autoplay blockiert – warte auf Interaktion");
    });
    document.removeEventListener("click", startMusic);
  }

  document.addEventListener("click", startMusic);

  // Stoppen wenn Tab gewechselt oder minimiert
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      music.pause();
     } else {
      music.play().catch(() => {});
      }
   });

  // Sicherheit: Stoppen beim Schließen
    window.addEventListener("beforeunload", () => {
      music.pause();
    });
