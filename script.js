document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('gameContainer');
    const timerDisplay = document.getElementById('timer');
    const messageDisplay = document.getElementById('message');
    const bestTimeDisplay = document.getElementById('bestTime');
    const averageTimeDisplay = document.getElementById('averageTime');
    const attemptsDisplay = document.getElementById('attempts');

    // Updated: 4 columns × 3 rows = 12 lights
    const lights = [
        [document.getElementById('light1'), document.getElementById('light5'), document.getElementById('light9')],
        [document.getElementById('light2'), document.getElementById('light6'), document.getElementById('light10')],
        [document.getElementById('light3'), document.getElementById('light7'), document.getElementById('light11')],
        [document.getElementById('light4'), document.getElementById('light8'), document.getElementById('light12')]
    ];

    let gameState = 'ready';
    let startTime, lightsOutTimeout;
    let reactionTimes = JSON.parse(localStorage.getItem('reactionTimes')) || [];
    let bestTime = localStorage.getItem('bestTime') || 9999;
    let jumpedEarly = false;
    let lightSequenceInterval;
    let currentCol = 0;

    bestTimeDisplay.textContent = formatTime(bestTime);
    updateAverage();
    attemptsDisplay.textContent = reactionTimes.length;

    gameContainer.addEventListener('click', () => {
        if (gameState === 'ready') {
            startGame();
        } else if (gameState === 'waiting') {
            earlyClick();
        } else if (gameState === 'lights-out') {
            recordReaction();
        } else if (['completed', 'jump-start'].includes(gameState)) {
            resetAndStartNew();
        }
    });

    function startGame() {
        gameState = 'waiting';
        jumpedEarly = false;
        messageDisplay.textContent = "Get ready...";
        timerDisplay.textContent = "00.000";
        clearLights();
        gameContainer.className = "game-container waiting";

        // Start light-up sequence after a small delay
        setTimeout(() => {
            startLightSequence();
        }, 300);
    }

    function startLightSequence() {
        currentCol = 0;
        // First column lights up instantly
        lights[0].forEach(light => light.classList.add('active'));
        currentCol++;

        // Then next columns light up every 300ms
        lightSequenceInterval = setInterval(() => {
            if (currentCol < lights.length) {
                lights[currentCol].forEach(light => light.classList.add('active'));
                currentCol++;
            } else {
                clearInterval(lightSequenceInterval);
                // Random delay before lights out
                lightsOutTimeout = setTimeout(() => {
                    lightsOut();
                }, 800 + Math.random() * 700);
            }
        }, 300);
    }

    function lightsOut() {
        if (gameState !== 'waiting') return;
        gameState = 'lights-out';
        messageDisplay.textContent = "LIGHTS OUT! TAP!";
        gameContainer.className = "game-container lights-out";
        lights.flat().forEach(light => {
            light.classList.remove('active');
            light.classList.add('go');
        });
        startTime = new Date().getTime();
    }

    function earlyClick() {
        clearTimeout(lightsOutTimeout);
        clearInterval(lightSequenceInterval);
        jumpedEarly = true;
        showJumpStart();
    }

    function recordReaction() {
        const reactionTime = new Date().getTime() - startTime;

        if (reactionTime < 50) {
            showJumpStart();
            return;
        }

        gameState = 'completed';
        messageDisplay.textContent = "Click to race again!";
        timerDisplay.textContent = formatTime(reactionTime);
        gameContainer.className = "game-container completed";

        reactionTimes.push(reactionTime);
        localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));
        attemptsDisplay.textContent = reactionTimes.length;

        if (reactionTime < bestTime) {
            bestTime = reactionTime;
            bestTimeDisplay.textContent = formatTime(bestTime);
            localStorage.setItem('bestTime', bestTime);
        }

        updateAverage();
    }

    function resetAndStartNew() {
        gameState = 'ready';
        messageDisplay.textContent = "Ready for another race? Tap to start!";
        timerDisplay.textContent = "00.000";
        clearTimeout(lightsOutTimeout);
        clearInterval(lightSequenceInterval);
        clearLights();
        gameContainer.className = "game-container ready";
    }

    function showJumpStart() {
        gameState = 'jump-start';
        messageDisplay.textContent = "JUMP START!";
        timerDisplay.textContent = "00.000";
        gameContainer.className = "game-container jump-start";
        clearLights();
    }

    function clearLights() {
        lights.flat().forEach(light => {
            light.className = 'light';
        });
    }

    function formatTime(ms) {
        return (ms / 1000).toFixed(3);
    }

    function updateAverage() {
        if (reactionTimes.length > 0) {
            const avg = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
            averageTimeDisplay.textContent = formatTime(avg);
        }
    }
});
