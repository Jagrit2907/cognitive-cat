console.log("Cognitive Cat Loaded 🐱");

// -------------------- CAT UI --------------------

const cat = document.createElement("div");

cat.textContent = "😺";
cat.style.position = "fixed";
cat.style.top = "18px";
cat.style.left = "20px";
cat.style.zIndex = "999999";
cat.style.fontSize = "70px";
cat.style.cursor = "pointer";
cat.style.transition = "transform 0.2s ease";

document.body.appendChild(cat);

cat.addEventListener("mouseenter", () => {
    cat.style.transform = "scale(1.1)";
});

cat.addEventListener("mouseleave", () => {
    cat.style.transform = "scale(1)";
});

// -------------------- AUDIO SYSTEM --------------------

let audioUnlocked = false;
let currentAudio = null;

const audioPool = {
    idle: new Audio(chrome.runtime.getURL("sounds/idle.mpeg")),
    tired: new Audio(chrome.runtime.getURL("sounds/crying.mpeg"))
};

// ✅ Preload + loop both sounds
Object.values(audioPool).forEach(audio => {
    audio.preload = "auto";
    audio.loop = true;
});

function unlockAudio() {
    if (!audioUnlocked) {
        audioUnlocked = true;

        // ✅ Wait for ALL audio to finish unlocking before playing
        const unlockPromises = Object.values(audioPool).map(audio => {
            audio.muted = true;
            return audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = false;
            }).catch(() => { });
        });

        // ✅ Only play after everything is primed — no arbitrary timeout
        Promise.all(unlockPromises).then(() => {
            if (stableState && stableState !== "happy") {
                playSound(stableState);
            }
        });
    }
}

["click", "keydown"].forEach(e =>
    window.addEventListener(e, unlockAudio, { once: true })
);

function playSound(state) {
    if (!audioUnlocked) return;

    if (state === "happy") {
        // ✅ Stop and reset current sound when user becomes active
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        return;
    }

    const audio = audioPool[state];
    if (!audio) return;

    // ✅ Don't restart if same sound is already playing
    if (currentAudio === audio) return;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    currentAudio = audio;
    audio.currentTime = 0;
    audio.play().catch(err => console.warn("Audio play failed:", err));
}

// -------------------- FEATURE COLLECTION --------------------

const MOVEMENT_THRESHOLD = 20; // px — ignore jitter below this

let lastX = 0;
let lastY = 0;
let movementSum = 0;
let movementSamples = 0;

// ✅ FIX: lastActivityTime is updated ONLY inside meaningful activity checks
let lastActivityTime = Date.now();

// 🖱️ Mouse — only register if movement exceeds threshold
window.addEventListener("mousemove", (e) => {
    const dx = Math.abs(e.clientX - lastX);
    const dy = Math.abs(e.clientY - lastY);
    const movement = dx + dy;

    lastX = e.clientX;
    lastY = e.clientY;

    // ✅ FIX: Update lastActivityTime ONLY when movement is meaningful
    if (movement > MOVEMENT_THRESHOLD) {
        lastActivityTime = Date.now();
        movementSum += movement;
        movementSamples++;
    }
});

// ⌨️ Keyboard
window.addEventListener("keydown", () => {
    lastActivityTime = Date.now();
});

// 🖱️ Click
window.addEventListener("click", () => {
    lastActivityTime = Date.now();
});


// -------------------- STATE SMOOTHING --------------------

let stateBuffer = [];
let stableState = "happy";

function smoothState(newState) {
    stateBuffer.push(newState);
    if (stateBuffer.length > 4) stateBuffer.shift();

    const count = {};
    stateBuffer.forEach(s => count[s] = (count[s] || 0) + 1);

    stableState = Object.keys(count).reduce((a, b) =>
        count[a] > count[b] ? a : b
    );

    return stableState;
}

// -------------------- STATE MANAGEMENT --------------------

let lastState = null;

async function updateState() {
    try {
        const inactivity = Date.now() - lastActivityTime;

        console.log("Inactivity:", inactivity);

        const avgMovement =
            movementSamples > 0 ? movementSum / movementSamples : 0;

        // Reset movement counters each cycle
        movementSum = 0;
        movementSamples = 0;

        let state = "happy";

        // ✅ ABSOLUTE RULE: Active user is ALWAYS happy — no ML can override this
        if (inactivity < 4000) {
            state = "happy";
            console.log("State: happy (active — override in effect)");
        }

        // 🟡 MIDDLE ZONE: Try ML, fall back to idle
        else if (inactivity < 12000) {
            state = "idle"; // safe default for this zone

            try {
                const features = {
                    Hold_Time_mean: avgMovement * 50,
                    Hold_Time_std: avgMovement * 20,
                    IKD_mean: avgMovement * 100,
                    IKD_std: avgMovement * 40
                };

                const res = await fetch("http://localhost:8000/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ features })
                });

                const data = await res.json();
                console.log("ML RESULT:", data);

                // ✅ ML only allowed to set idle or stay happy — NOT tired in this zone
                if (data.label === "HIGH") state = "idle";
                else if (data.label === "AVERAGE") state = "idle";
                else state = "happy";

            } catch {
                // ML unavailable — stay idle (middle zone default)
                state = "idle";
            }

            console.log("State:", state, "(middle zone)");
        }

        // 🔴 LONG INACTIVITY: User is truly away
        else {
            state = "tired";
            console.log("State: tired (long inactivity)");
        }

        // ✅ Apply smoothing to avoid flickering
        state = smoothState(state);

        // Update cat emoji
        if (state === "happy") cat.textContent = "😺";
        else if (state === "idle") cat.textContent = "🙀";
        else if (state === "tired") cat.textContent = "😿";

        // Play sound only when state changes
        if (state !== lastState) {
            lastState = state;
            playSound(state);
        }

    } catch (e) {
        console.error("updateState error:", e);
    }
}

// -------------------- FAST ACTIVITY SNAP --------------------

// Runs every 500ms — ONLY to snap back to happy instantly when user becomes active.
// Bypasses smoothing buffer so there's no lag when recovering from idle/tired.
setInterval(() => {
    const inactivity = Date.now() - lastActivityTime;

    if (inactivity < 4000 && lastState !== "happy") {
        stateBuffer = []; // clear stale votes
        stableState = "happy";
        lastState = "happy";
        cat.textContent = "😺";
        playSound("happy");
        console.log("State: happy (fast snap)");
    }
}, 500);

// -------------------- LOOP --------------------

setInterval(updateState, 5000);
updateState();
