const readingBox = document.getElementById("readingBox");
    const readConfirm = document.getElementById("readConfirm");
    const launchBeta = document.getElementById("launchBeta");
    const gateStatus = document.getElementById("gateStatus");
    const betaUrl = "https://eliga99.github.io/GoalNews-Beta/GoalNewsDE%20Beta%20Codes/";
    let reachedEnd = false;

    readingBox.addEventListener("scroll", () => {
      if (readingBox.scrollTop + readingBox.clientHeight >= readingBox.scrollHeight - 8) {
        reachedEnd = true;
        readConfirm.disabled = false;
        gateStatus.textContent = "Danke fürs Lesen. Bestätige die Checkbox, um fortzufahren.";
      }
    });
    readConfirm.addEventListener("change", () => {
      launchBeta.disabled = !(reachedEnd && readConfirm.checked);
      if (readConfirm.checked) gateStatus.textContent = "Alles klar — du kannst jetzt den Beta-Server öffnen.";
    });
    launchBeta.addEventListener("click", () => {
      if (reachedEnd && readConfirm.checked) window.open(betaUrl, "_blank", "noopener,noreferrer");
    });
