// Create floating cat container
console.log("EXTENSION WORKING NOW");

const cat = document.createElement("div");

cat.style.position = "fixed";
cat.style.top = "18px";
cat.style.left = "20px";
cat.style.zIndex = "999999";
cat.style.fontSize = "70px";
cat.style.cursor = "pointer";
cat.style.transition = "transform 0.2s ease";

document.body.appendChild(cat);

// Hover animation
cat.addEventListener("mouseenter", () => {
    cat.style.transform = "scale(1.1)";
});

cat.addEventListener("mouseleave", () => {
    cat.style.transform = "scale(1)";
});

// -------------------- AUDIO SYSTEM --------------------

// Single global audio controller
let currentAudio = null;

// Only idle + crying sounds
const soundPaths = {
    idle: chrome.runtime.getURL("sounds/idle.mpeg"),
    crying: chrome.runtime.getURL("sounds/crying.mpeg"),
};

let audioUnlocked = false;

function unlockAudio() {
    if (!audioUnlocked) {
        audioUnlocked = true;

        // Preload sounds silently
        Object.values(soundPaths).forEach(src => {
            const a = new Audio(src);
            a.play().then(() => {
                a.pause();
                a.currentTime = 0;
            }).catch(() => { });
        });
    }
}

// Unlock on first interaction
["click", "keydown"].forEach(e =>
    window.addEventListener(e, unlockAudio, { once: true })
);

// Play sound with instant switching
function playSound(state) {
    if (!audioUnlocked) return;

    const src = soundPaths[state];

    // 🔴 Stop previous sound ALWAYS
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    // ❌ No sound for happy → just stop
    if (!src) return;

    // ▶️ Play new sound
    currentAudio = new Audio(src);
    currentAudio.play().catch(() => { });
}

// -------------------- STATE MANAGEMENT --------------------

let lastState = null;

async function updateState() {
    try {
        const res = await fetch("http://localhost:8000/state");
        const data = await res.json();

        let state = data.state;

        // Safety check
        if (!["happy", "idle", "crying"].includes(state)) {
            state = "idle";
        }

        // Update emoji
        if (state === "happy") cat.textContent = "😺";
        else if (state === "idle") cat.textContent = "🙀";
        else if (state === "crying") cat.textContent = "😿";

        // Play sound only on change
        if (state !== lastState) {
            lastState = state;
            playSound(state);
        }

    } catch (e) {
        console.log("Backend not reachable");
    }
}

// -------------------- ACTIVITY TRACKING --------------------

function sendActivity() {
    fetch("http://localhost:8000/activity", { method: "POST" });
}

["mousemove", "keydown", "scroll", "click"].forEach(e =>
    window.addEventListener(e, sendActivity)
);

// -------------------- LOOP --------------------

setInterval(updateState, 1000);
updateState();