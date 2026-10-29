// Dark Mode Toggle
        const toggle = document.getElementById('themeToggle');
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            toggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
        });

        // Animate Bars
        window.addEventListener("DOMContentLoaded", () => {
            document.querySelectorAll(".bar").forEach(bar => {
                const points = parseInt(bar.dataset.points);
                const max = parseInt(bar.dataset.max);
                const percent = (points / max) * 100;
                setTimeout(() => { bar.style.width = percent + "%"; }, 100);
                if (points >= 14) { bar.style.background = "linear-gradient(90deg,#1db954,#00d4ff)"; }
                else if (points >= 8) { bar.style.background = "linear-gradient(90deg,#f5d742,#f59e42)"; }
                else { bar.style.background = "linear-gradient(90deg,#ff4c4c,#ff0000)"; }
            });
        });
