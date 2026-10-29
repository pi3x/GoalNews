const result = document.getElementById('quiz-result');
    document.querySelectorAll('.quiz-options button').forEach((button) => {
      button.addEventListener('click', () => {
        const correct = button.dataset.answer === '6';
        result.textContent = correct ? 'Richtig! Ein Touchdown zählt 6 Punkte.' : 'Noch nicht ganz – ein Touchdown zählt 6 Punkte.';
        result.style.color = correct ? '#c8f279' : '#ffd089';
      });
    });
