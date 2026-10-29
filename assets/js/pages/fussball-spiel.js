const gameArea = document.getElementById('gameArea');
const goalkeeper = document.getElementById('goalkeeper');
const ball = document.getElementById('ball');
const scoreEl = document.getElementById('score');
const shotsEl = document.getElementById('shots');
const message = document.getElementById('message');
const powerBar = document.getElementById('powerBar');

let score = 0, shots = 0, maxShots = 10, isShooting = false, power = 0, charging = false;
let baseReaction = 400; // Torwart reagiert schneller
let level = 1; // Schwierigkeit steigt pro Treffer

gameArea.addEventListener('mousedown', ()=>{
    if(isShooting || shots>=maxShots) return;
    charging = true;
    power = 0;
    powerBar.style.width = '0%';
    const interval = setInterval(()=>{
        if(!charging) { clearInterval(interval); return; }
        power += 1;
        powerBar.style.width = power + '%';
        if(power>=120){
            charging = false;
            clearInterval(interval);
            powerBar.style.width = '100%';
            message.textContent = "Zu stark! Ball fliegt übers Tor!";
            shoot(power, true);
        }
    },10);
});

gameArea.addEventListener('mouseup', (e)=>{
    if(!charging || isShooting) return;
    charging = false;
    shoot(power, false, e);
});

function shoot(power, overpower=false, e=null){
    isShooting = true;
    shots++;
    shotsEl.textContent = `Schüsse: ${shots} / ${maxShots}`;

    let targetX, targetY;
    if(overpower){
        targetX = 200 + Math.random()*50 - 25;
        targetY = -50;
    } else {
        const rect = gameArea.getBoundingClientRect();
        targetX = e.clientX - rect.left + (Math.random()*10-5); // leichte Zufallsabweichung
        targetY = e.clientY - rect.top + (Math.random()*5-2);
    }

    const flightDuration = 1000 - Math.min(power*5, 800);
    ball.style.transition = `left ${flightDuration/1000}s linear, bottom ${flightDuration/1000}s linear`;
    ball.style.left = targetX-15 + 'px';
    ball.style.bottom = (gameArea.clientHeight - targetY - 15) + 'px';

    // Torwart KI: nur im Torbereich reagieren
    const goalLeft = 100;
    const goalRight = 300;
    if(targetX >= goalLeft && targetX <= goalRight){
        let keeperTargetX = targetX - 25;
        keeperTargetX = Math.min(Math.max(keeperTargetX, goalLeft), goalRight - 50);
        const tilt = (keeperTargetX < 175)? -45 : (keeperTargetX > 175)? 45 : 0;
        const reactionDelay = baseReaction - level*20 + (Math.random()*150 - 75); // schneller bei höheren Level

        setTimeout(()=>{
            goalkeeper.style.left = keeperTargetX + 'px';
            goalkeeper.style.transform = `rotate(${tilt}deg)`;
        }, Math.max(50, reactionDelay));
    }

    setTimeout(()=>{
        const keeperRect = goalkeeper.getBoundingClientRect();
        const ballRect = ball.getBoundingClientRect();
        let held = false;

        if(!overpower && targetX >= goalLeft && targetX <= goalRight){
            const holdChance = Math.min(95, Math.max(20, 70 - power*0.5 - level*2)); // Torwart schwieriger
            held = Math.random()*100 < holdChance && ballRect.right > keeperRect.left && ballRect.left < keeperRect.right && ballRect.top < keeperRect.bottom;
        }

        if(overpower){
            message.textContent += " Ball ist übers Tor!";
        } else if(!held && (targetX < goalLeft || targetX > goalRight)){
            message.textContent = "Daneben! Ball geht am Tor vorbei!";
        } else if(held){
            message.textContent = "Gehalten! Torwart reagiert!";
        } else {
            message.textContent = "Tor! Gut geschossen!";
            score++;
            scoreEl.textContent = "Punkte: "+score;
            level++; // Schwierigkeit steigt
            gameArea.classList.add('torjubel');
            setTimeout(()=>gameArea.classList.remove('torjubel'),900);
        }

        // Reset
        ball.style.left = '185px';
        ball.style.bottom = '10px';
        ball.style.transition = '';
        goalkeeper.style.left = '175px';
        goalkeeper.style.transform = 'rotate(0deg)';
        powerBar.style.width = '0%';
        isShooting = false;

        if(shots===maxShots){
            message.textContent += " Spiel beendet!";
        }
    }, flightDuration);
}
