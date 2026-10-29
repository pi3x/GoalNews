(() => {
  if (document.getElementById("goalnews-beta-banner")) return;

  const banner = document.createElement("aside");
  banner.id = "goalnews-beta-banner";
  banner.setAttribute("role", "note");
  banner.setAttribute("aria-label", "GoalNews Beta-Hinweis");
  banner.innerHTML = `
    <span class="beta-mark"><span class="beta-dot" aria-hidden="true"></span> GOALNEWS <b>BETA-TEST</b></span>
    <span class="beta-copy">Diese Testversion verwendet die echte Datenbank. Bitte keine privaten Inhalte oder Spam eintragen.</span>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #goalnews-beta-banner {
      position: relative;
      z-index: 10;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 6px 14px;
      width: 100%;
      box-sizing: border-box;
      padding: 11px 16px;
      color: #101827;
      background: linear-gradient(100deg, #d8ff91, #c8f279 52%, #b6e85d);
      border-bottom: 1px solid #a9d953;
      box-shadow: 0 4px 16px #0003;
      font: 600 13px/1.45 Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-align: center;
    }
    #goalnews-beta-banner .beta-mark {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: #101827;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .08em;
      white-space: nowrap;
    }
    #goalnews-beta-banner .beta-mark b {
      padding: 3px 8px;
      border: 1px solid #101827;
      border-radius: 999px;
      color: #d8ff91;
      background: #101827;
      font-size: 10px;
      letter-spacing: .1em;
    }
    #goalnews-beta-banner .beta-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #238636;
      box-shadow: 0 0 0 3px #23863622;
    }
    #goalnews-beta-banner .beta-copy { color: #263449; }
    @media (max-width: 600px) {
      #goalnews-beta-banner { gap: 4px 8px; padding: 9px 12px; font-size: 12px; }
      #goalnews-beta-banner .beta-copy { flex-basis: 100%; }
    }
  `;

  document.head.append(style);
  document.body.prepend(banner);
})();
