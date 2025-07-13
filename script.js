document.addEventListener('DOMContentLoaded', () => {
    const tagline = document.getElementById('tagline');
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

    let celebration = JSON.parse(localStorage.getItem('celebration')) || {
        firstUnder180: null,
        firstIndex: null,
        remainingAttempts: 0,
        successfulAttempts: []
    };

    gameContainer.addEventListener('click', () => {
        if (gameState === 'ready') {
            startGame();
        } else if (gameState === 'waiting') {
            earlyClick();
        } else if (gameState === 'lights-out') {
            recordReaction();
        } else if (gameState === 'completed') {
            setTagline('postGame');
            resetAndStartNew();
        } else if (gameState === 'postGame' || gameState === 'jump-start') {
            resetAndStartNew();
        }
    });

    const lastTaglineIndex = {
        initial: -1,
        fast: -1,
        average: -1,
        slow: -1,
        jumpStart: -1
    };

    function startGame() {
        gameState = 'waiting';
        jumpedEarly = false;
        setTagline('preGame');
        timerDisplay.textContent = "00.000";
        clearLights();
        gameContainer.className = "game-container waiting";

        setTimeout(() => {
            startLightSequence();
        }, 300);
    }

    function startLightSequence() {
        currentCol = 0;
        lights[0].forEach(light => light.classList.add('active'));
        currentCol++;

        lightSequenceInterval = setInterval(() => {
            if (currentCol < lights.length) {
                lights[currentCol].forEach(light => light.classList.add('active'));
                currentCol++;
            } else {
                clearInterval(lightSequenceInterval);
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

    function showCelebrationBanner(text) {
    const modal = document.getElementById('celebrationModal');
    const modalText = document.getElementById('celebrationText');
    const closeBtn = document.getElementById('closeCelebration');

    modalText.innerText = text;
    modal.classList.remove('hidden');

    closeBtn.onclick = () => {
        modal.classList.add('hidden');
    };
}


    function recordReaction() {
        const reactionTime = new Date().getTime() - startTime;

        if (reactionTime < 50) {
            showJumpStart();
            return;
        }

        gameState = 'completed';
        const category = getPerformanceCategory(reactionTime);
        setTagline(category);
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
        checkCelebrationProgress(reactionTime);
    }

 function checkCelebrationProgress(time) {
    const attemptNumber = reactionTimes.length;

    if (time < 180) {
        if (!celebration.firstUnder180) {
            // First sub-180ms trigger
            celebration.firstUnder180 = attemptNumber;
            celebration.firstIndex = reactionTimes.length - 1; // index-based
            celebration.remainingAttempts = 7;
            celebration.successfulAttempts = [{
                attemptNumber,
                time,
                offset: 0
            }];

            showCelebrationBanner(`🔥 Attempt #${attemptNumber}: First sub-180ms!\nYou now have 7 more attempts to get two more.`);
        } else {
            // Check if we're still within the 7 following attempts
            const offset = (reactionTimes.length - 1) - celebration.firstIndex;
            if (offset > 7) {
                showCelebrationBanner("❌ Challenge failed. You used all 7 attempts. Progress reset.");
                celebration = {
                    firstUnder180: null,
                    firstIndex: null,
                    remainingAttempts: 0,
                    successfulAttempts: []
                };
            } else {
                celebration.successfulAttempts.push({
                    attemptNumber,
                    time,
                    offset
                });
                celebration.remainingAttempts--;

                if (celebration.successfulAttempts.length >= 3) {
                    const [first, second, third] = celebration.successfulAttempts;
                    const totalSpan = third.attemptNumber - first.attemptNumber;

                    showCelebrationBanner(
                        `🎉 You're featured!\n` +
                        `✅ Attempt #${first.attemptNumber}-0 → ${first.time}ms\n` +
                        `✅ Attempt #${second.attemptNumber}-${second.offset} → ${second.time}ms\n` +
                        `✅ Attempt #${third.attemptNumber}-${third.offset} → ${third.time}ms\n\n` +
                        `🏁 Completed in ${totalSpan} attempts after the first.\n📩 Send a screenshot to be featured!`
                    );

                    // Reset after success
                    celebration = {
                        firstUnder180: null,
                        firstIndex: null,
                        remainingAttempts: 0,
                        successfulAttempts: []
                    };
                } else {
                    const latest = celebration.successfulAttempts[celebration.successfulAttempts.length - 1];
                    showCelebrationBanner(`✅ Sub-180ms (#${latest.attemptNumber}-${latest.offset}, ${latest.time}ms)\n${celebration.successfulAttempts.length}/3 done. ${celebration.remainingAttempts} left.`);
                }
            }
        }
    } else if (celebration.firstUnder180) {
        // Not a sub-180 but within 7 attempts
        const offset = (reactionTimes.length - 1) - celebration.firstIndex;
        if (offset >= 7) {
            showCelebrationBanner("❌ Challenge failed. You used all 7 attempts. Progress reset.");
            celebration = {
                firstUnder180: null,
                firstIndex: null,
                remainingAttempts: 0,
                successfulAttempts: []
            };
        } else {
            celebration.remainingAttempts--;
        }
    }

    localStorage.setItem('celebration', JSON.stringify(celebration));
}


    function getPerformanceCategory(timeMs) {
        if (timeMs < 180) return 'fast';
        else if (timeMs < 280) return 'average';
        else return 'slow';
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
        setTagline('jumpStart');
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

    const taglines = {
        initial: [
            "Channel your inner warrior — it's time.",
            "Only the fastest stand a chance. Are you the legend?",
            "Your moment of truth begins now."
        ],
        fast: [
            "You moved like lightning! Impressive!",
            "Ultra Instinct? You might be close.",
            "Blazing fast! The gods are watching."
        ],
        average: [
            "Not bad! You've got potential.",
            "You're getting there — keep grinding.",
            "You're at Shikai level, aiming for Bankai!"
        ],
        slow: [
            "Your reaction was… philosophical.",
            "Even Master Roshi would be disappointed.",
            "You blinked after the lights went out."
        ],
        jumpStart: [
            "Jumped the lights — patience, warrior.",
            "Too early! Even Goku waits for the bell.",
            "Easy there — speed without control is nothing."
        ],
        preGame: [
            "Brace yourself… reflex test loading.",
            "Eyes open, fingers ready!",
            "The lights await your reaction."
        ],
        postGame: [
            "Wanna go again? The track's hot.",
            "That was wild! Try another round?",
            "One more run to prove your power?"
        ]
    };

    function setRandomInitialTagline() {
        const initialLines = taglines.initial;
        if (!initialLines || initialLines.length === 0) return;

        const lastIndex = parseInt(localStorage.getItem('lastInitialIndex'), 10);
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * initialLines.length);
        } while (newIndex === lastIndex && initialLines.length > 1);

        localStorage.setItem('lastInitialIndex', newIndex);
        tagline.textContent = initialLines[newIndex];
    }
    setRandomInitialTagline();

    function setTagline(type) {
        const lines = taglines[type];
        if (!lines || lines.length === 0) return;

        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * lines.length);
        } while (newIndex === lastTaglineIndex[type] && lines.length > 1);

        lastTaglineIndex[type] = newIndex;
        tagline.textContent = lines[newIndex];
    }
});
