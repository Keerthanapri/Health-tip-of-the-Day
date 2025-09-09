const tipText = document.getElementById("tip-text");
const tipIcon = document.getElementById("tip-icon");
const randomBtn = document.getElementById("random-btn");
const categoryBtns = document.querySelectorAll(".category-btn");
const darkModeCheckbox = document.getElementById("dark-mode-btn");
const tipHistoryList = document.getElementById("tip-history");
const confettiCanvas = document.getElementById("confetti-canvas");
const popSound = document.getElementById("pop-sound");
const confettiSound = document.getElementById("confetti-sound");
const dateElement = document.getElementById("daily-date");

function updateDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-US', options);
}

// Initial display
updateDate();

// Update at next midnight and every 24 hours
const now = new Date();
const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
const msUntilMidnight = nextMidnight - now;

setTimeout(() => {
    updateDate();
    setInterval(updateDate, 24 * 60 * 60 * 1000); // every 24 hours
}, msUntilMidnight);

let currentCategory = "All";
let tipHistory = [];
let unusedTips = {};

// Function to start confetti
function startConfetti() {
    // Your existing confetti code here
    confetti(); // or whatever function triggers confetti

    // Play the sound
    confettiSound.currentTime = 0; // rewind to start
    confettiSound.play().catch((err) => {
        console.log("Sound could not play:", err);
    });
}

// Example: Trigger on random tip button click
document.getElementById("random-btn").addEventListener("click", () => {
    startConfetti();
});


// --- CONFETTI SETUP ---
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiAnimating = false;

// Resize canvas
function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Create a burst of confetti
function createConfetti() {
    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: -10, // start at top
            r: Math.random() * 6 + 4,
            d: Math.random() * 10 + 5,
            color: `hsl(${Math.random()*360}, 70%, 50%)`,
            tilt: Math.random() * 10 - 10,
            tiltAngleIncrement: Math.random() * 0.1 + 0.05,
            tiltAngle: 0
        });
    }
}

// Draw and update confetti
function drawConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach(p => {
        confettiCtx.beginPath();
        confettiCtx.lineWidth = p.r / 2;
        confettiCtx.strokeStyle = p.color;
        confettiCtx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        confettiCtx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        confettiCtx.stroke();

        // Update position
        p.tiltAngle += p.tiltAngleIncrement;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.d);
        p.tilt = Math.sin(p.tiltAngle) * 15;
    });

    // Remove confetti that has fallen off the screen
    confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height + 20);
}

// Animate confetti until all particles fall off
function animateConfetti() {
    if (confettiParticles.length === 0) {
        confettiAnimating = false; // stop animation when done
        return;
    }
    drawConfetti();
    requestAnimationFrame(animateConfetti);
}

// Trigger confetti burst
function triggerConfetti() {
    createConfetti(); // add new burst
    confettiSound.currentTime = 0;
    confettiSound.play();

     if (!confettiAnimating) {
        confettiAnimating = true;
        animateConfetti();
    }
}

function unlockSounds() {
    if (!firstTipDisplayed) {
        // Unlock popSound and confettiSound
        popSound.play().catch(() => {});
        popSound.pause();
        popSound.currentTime = 0;

        confettiSound.play().catch(() => {});
        confettiSound.pause();
        confettiSound.currentTime = 0;

        firstTipDisplayed = true;

        // Now safe to play sounds in displayTip
        displayTip(getTipOfTheDay(currentCategory), true);

        document.removeEventListener('click', unlockSounds);
        document.removeEventListener('touchstart', unlockSounds);
    }
}

// Wait for first user interaction to unlock audio
document.addEventListener('click', unlockSounds);
document.addEventListener('touchstart', unlockSounds);

// Category icons mapping
const categoryIcons = {
    "Physical": "🏃‍♂️",
    "Mental": "🧠",
    "Nutrition": "🥗",
    "All": "💡"
};

// Initialize unused tips
function initializeUnusedTips() {
    const categories = ["Physical", "Mental", "Nutrition", "All"];
    categories.forEach(cat => {
        if (cat === "All") {
            unusedTips[cat] = [...healthTips];
        } else {
            unusedTips[cat] = healthTips.filter(t => t.category === cat);
        }
    });
}

// Random non-repeating tip
function getRandomTip(category) {
    if (unusedTips[category].length === 0) {
        if (category === "All") {
            unusedTips[category] = [...healthTips];
        } else {
            unusedTips[category] = healthTips.filter(t => t.category === category);
        }
    }
    const index = Math.floor(Math.random() * unusedTips[category].length);
    const tip = unusedTips[category][index];
    unusedTips[category].splice(index, 1);
    return tip;
}

// Tip of the day
function getTipOfTheDay(category) {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const filteredTips = (category === "All") ? healthTips : healthTips.filter(t => t.category === category);
    const index = dayOfYear % filteredTips.length;
    return filteredTips[index];
}

// Display tip with animation, confetti & sound
function displayTip(tipObj, playSound = true) {
    tipText.style.opacity = 0;
    tipText.style.transform = "translateY(-10px)";
    tipIcon.style.opacity = 0;

    setTimeout(() => {
        tipText.textContent = tipObj.tip;
        tipIcon.textContent = categoryIcons[tipObj.category] || "💡";

        tipText.style.opacity = 1;
        tipText.style.transform = "translateY(0)";
        tipIcon.style.opacity = 1;

        if (playSound) {
            popSound.currentTime = 0;
            popSound.play();
            triggerConfetti();
        }

        // Add to history
        tipHistory.unshift(`${categoryIcons[tipObj.category]} ${tipObj.tip}`);
        if (tipHistory.length > 5) tipHistory.pop();
        renderHistory();
    }, 300);
}

// Render history
function renderHistory() {
    tipHistoryList.innerHTML = "";
    tipHistory.forEach(tip => {
        const li = document.createElement("li");
        li.textContent = tip;
        tipHistoryList.appendChild(li);
    });
}

// Category buttons
categoryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        currentCategory = btn.dataset.category;

        categoryBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        displayTip(getTipOfTheDay(currentCategory));
    });
});

// Random tip
randomBtn.addEventListener("click", () => {
    displayTip(getRandomTip(currentCategory));
});

// Dark mode toggle
darkModeCheckbox.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    document.querySelector(".container").classList.toggle("dark");
    document.querySelector(".tip-card").classList.toggle("dark");
    document.querySelector(".tip-icon-circle").classList.toggle("dark");
});

// Initialize unused tips
initializeUnusedTips();

// --- SOUND FIX FOR FIRST TIP ---
let firstTipDisplayed = false;

// Show tip text immediately without sound
displayTip(getTipOfTheDay(currentCategory), false);

// Wait for user interaction to enable sound for first tip
function playFirstTipSound() {
    if (!firstTipDisplayed) {
        displayTip(getTipOfTheDay(currentCategory), true);
        firstTipDisplayed = true;
        document.removeEventListener('click', playFirstTipSound);
        document.removeEventListener('touchstart', playFirstTipSound);
    }
}

document.addEventListener('click', playFirstTipSound);
document.addEventListener('touchstart', playFirstTipSound);
