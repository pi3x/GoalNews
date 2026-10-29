const quiz = [
      { frage: "Wer ist der Rekordtorschütze der Bundesliga?", antworten: ["Harry Kane", "Kane", "kane", "harry kane"] },
      { frage: "Welches Land gewann die Fußball-WM 2014?", antworten: ["deutschland", "germany", "Deutschland", "DE"] },
      { frage: "Welcher Verein gewann die Champions League 2020?", antworten: ["Bayern München", "FC Bayern", "Bayern", "fc bayern", "bayern", "bayern münchen"] },
      { frage: "Wie viele Spieler einer Manschaft stehen bei Anpfiff auf dem Feld?", antworten: ["11", "elf"] }
    ];

    let i = 0;
    const frageEl = document.getElementById("frage");
    const antwortEl = document.getElementById("antwort");
    const resultEl = document.getElementById("result");
    const nextBtn = document.getElementById("next");

    frageEl.textContent = quiz[i].frage;

    function checkAntwort() {
      const input = antwortEl.value.trim().toLowerCase();
      const richtigeAntworten = quiz[i].antworten;

      if (richtigeAntworten.includes(input)) {
        resultEl.textContent = "✅ Richtig!";
        resultEl.style.color = "#1db954";
        nextBtn.style.display = "inline-block";
      } else {
        resultEl.textContent = "❌ Falsch! Richtige Antworten: " + richtigeAntworten.join(", ");
        resultEl.style.color = "red";
        nextBtn.style.display = "inline-block";
      }
    }

    function nextQuestion() {
      i++;
      if (i >= quiz.length) {
        frageEl.textContent = " Du hast das Quiz beendet!";
        antwortEl.style.display = "none";
        document.querySelector("button").style.display = "none";
        nextBtn.style.display = "none";
        resultEl.textContent = "Danke fürs Mitmachen! ";
      } else {
        frageEl.textContent = quiz[i].frage;
        antwortEl.value = "";
        resultEl.textContent = "";
        nextBtn.style.display = "none";
      }
    }
