/* ═══════════════════════════════════════════════════
   AegisGuard – Chatbot Logic v2
   ═══════════════════════════════════════════════════ */

// ── Threat Detection ──────────────────────────────────
const THREAT_PHRASES = [
    'forget all previous',
    'forget previous',
    'ignore all previous',
    'ignore previous',
    'ignore instructions',
    'ignore rules',
    'ignore your instructions',
    'developer mode',
    'devmode',
    'jailbreak',
    'system prompt',
    'bypass',
    'override',
    'override instructions',
    'override your',
    'act as if',
    'pretend you are',
    'pretend to be',
    'disregard',
    'you are now',
    'new persona',
    'roleplay as',
    'simulate being',
    'ignore your previous',
    'unlock',
    'unrestricted mode',
    'no restrictions',
    'without restrictions',
    'do anything now',
    'dan mode',
];

// ── Safe AI Response Bank ─────────────────────────────
// These give contextual, helpful answers when input is clean.
const SAFE_RESPONSES = {
    hello: [
        "Hello! I'm AegisGuard — your intelligent security assistant. I'm here to help you stay protected. What can I do for you?",
        "Hi there! I'm AegisGuard. Your session is secure and I'm ready to assist. What would you like to know?",
    ],
    help: [
        "Of course! I can assist with security questions, explain threats, guide you through best practices, or analyse suspicious content. What do you need?",
        "I'm fully equipped to help. You can ask me about cybersecurity, data protection, password hygiene, or phishing threats. Where shall we start?",
    ],
    password: [
        "Great password hygiene is critical. Use at least 16 characters, mix uppercase, lowercase, numbers, and symbols. Never reuse passwords — use a reputable password manager like Bitwarden or 1Password.",
        "Strong passwords should be long, random, and unique per service. I'd recommend a passphrase like 'GreenMango!River42' — memorable yet secure. Always enable 2FA where possible.",
    ],
    security: [
        "Security is my speciality. Here are the top 3 practices: (1) Enable MFA on all accounts, (2) Keep software updated, (3) Use a VPN on public networks. Anything specific you'd like to dive into?",
        "Excellent question. Modern security relies on layered defence — endpoint protection, encrypted communications, and zero-trust architecture. What aspect interests you most?",
    ],
    vpn: [
        "A VPN (Virtual Private Network) encrypts your internet traffic and masks your IP address. This is especially important on public Wi-Fi. I recommend using WireGuard-based VPNs for best performance and security.",
    ],
    phishing: [
        "Phishing is one of the most common attacks. Red flags include: urgent language, mismatched sender domains, unexpected attachments, and requests for credentials. Always verify links before clicking.",
    ],
    encryption: [
        "Encryption converts your data into unreadable ciphertext. AES-256 is the gold standard for symmetric encryption. For communications, Signal protocol (used in WhatsApp, Signal) provides end-to-end encryption.",
    ],
    malware: [
        "Malware comes in many forms: viruses, trojans, ransomware, spyware. Keep your OS and antivirus updated, avoid pirated software, and never open email attachments from unknown senders.",
    ],
    firewall: [
        "Firewalls act as gatekeepers between your network and the internet. They filter traffic based on defined rules. AegisGuard itself operates a real-time neural firewall on all inputs to this session.",
    ],
    default: [
        "Understood. Your prompt has passed all security checks. Based on my analysis: that's a solid question! To give you the most accurate guidance, could you provide a bit more context?",
        "Message received and verified. I'm processing your request through AegisGuard's neural engine. Everything looks clean — here's my response: this is a great topic in the security domain. Feel free to ask for specifics!",
        "Your session remains secure. I've scanned and cleared your message. Happy to dig deeper — what aspect would you like me to elaborate on?",
        "All clear! That's an interesting point. In the realm of cybersecurity, context is everything. Could you tell me more about your specific use case so I can tailor my response?",
    ],
};

// ── State ─────────────────────────────────────────────
let isDanger = false;
let currentScore = 12;
let targetScore = 12;
let animFrame = null;

// ── Gauge Animation ───────────────────────────────────
// Circumference for r=48: 2π×48 ≈ 301.59
const CIRC = 301.59;

function scoreToOffset(score) {
    return CIRC - (score / 100) * CIRC;
}

function setGaugeImmediate(score, danger, warn) {
    const fill       = document.getElementById('gauge-fill');
    const scoreEl    = document.getElementById('gauge-score');
    const labelEl    = document.getElementById('gauge-label');
    const statusEl   = document.getElementById('gauge-status');
    const levelTag   = document.getElementById('gauge-level-tag');
    const alertBan   = document.getElementById('alert-banner');
    const execBtn    = document.getElementById('exec-btn');
    const statusDot  = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const intVal     = document.getElementById('integrity-val');
    const inputEl    = document.getElementById('chat-input');
    const inputArea  = document.getElementById('input-area');

    // Update SVG arc
    fill.style.strokeDashoffset = scoreToOffset(score);
    scoreEl.textContent = Math.round(score);

    if (danger) {
        fill.classList.remove('warn');
        fill.classList.add('danger');
        scoreEl.classList.remove('warn');
        scoreEl.classList.add('danger');
        labelEl.textContent    = 'DANGER ZONE';
        statusEl.textContent   = '● CRITICAL THREAT';
        statusEl.className     = 'gauge-status danger';
        levelTag.textContent   = 'CRITICAL';
        levelTag.style.color   = 'var(--red)';
        alertBan.classList.add('show');
        execBtn.classList.add('danger');
        statusDot.classList.add('danger');
        statusText.textContent = 'THREAT DETECTED';
        statusText.style.color = 'var(--red)';
        intVal.classList.add('danger');
        intVal.textContent     = '12.3%';
        inputEl.classList.add('threat-input');
        inputArea.classList.add('danger-input');
        document.body.classList.add('danger-mode');
    } else if (warn) {
        fill.classList.add('warn');
        fill.classList.remove('danger');
        scoreEl.classList.add('warn');
        scoreEl.classList.remove('danger');
        labelEl.textContent    = 'CAUTION';
        statusEl.textContent   = '● ELEVATED RISK';
        statusEl.className     = 'gauge-status warn';
        levelTag.textContent   = 'CAUTION';
        levelTag.style.color   = 'var(--amber)';
        alertBan.classList.remove('show');
        execBtn.classList.remove('danger');
        statusDot.classList.remove('danger');
        statusText.textContent = 'MONITORING';
        statusText.style.color = 'var(--amber)';
        intVal.classList.remove('danger');
        intVal.textContent     = '78.1%';
        inputEl.classList.remove('threat-input');
        inputArea.classList.remove('danger-input');
        document.body.classList.remove('danger-mode');
    } else {
        fill.classList.remove('warn', 'danger');
        scoreEl.classList.remove('warn', 'danger');
        labelEl.textContent    = 'SAFE ZONE';
        statusEl.textContent   = '● MINIMAL THREAT';
        statusEl.className     = 'gauge-status';
        levelTag.textContent   = 'SAFE';
        levelTag.style.color   = 'var(--green)';
        alertBan.classList.remove('show');
        execBtn.classList.remove('danger');
        statusDot.classList.remove('danger');
        statusText.textContent = 'SYSTEM ACTIVE';
        statusText.style.color = 'var(--green)';
        intVal.classList.remove('danger');
        intVal.textContent     = '99.8%';
        inputEl.classList.remove('threat-input');
        inputArea.classList.remove('danger-input');
        document.body.classList.remove('danger-mode');
    }
}

// Smooth animated counter for gauge score
function animateGauge(from, to, danger, warn) {
    if (animFrame) cancelAnimationFrame(animFrame);
    const duration = 600;
    const start = performance.now();

    function step(now) {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const current = from + (to - from) * eased;
        setGaugeImmediate(current, danger, warn);
        if (t < 1) animFrame = requestAnimationFrame(step);
    }
    animFrame = requestAnimationFrame(step);
}

// ── Real-time Input Scanning (live gauge on keyup) ─────
document.getElementById('chat-input').addEventListener('input', function () {
    const text = this.value.toLowerCase();
    const hasThreat = THREAT_PHRASES.some(p => text.includes(p));

    if (hasThreat && !isDanger) {
        animateGauge(currentScore, 95, true, false);
        currentScore = 95;
    } else if (!hasThreat && (isDanger || currentScore > 20)) {
        animateGauge(currentScore, 12, false, false);
        currentScore = 12;
        isDanger = false;
    }
});

// ── Send Message ──────────────────────────────────────
function sendMessage() {
    const input   = document.getElementById('chat-input');
    const rawText = input.value.trim();
    if (!rawText) return;

    const text      = rawText.toLowerCase();
    const wasDanger = isDanger;
    isDanger        = THREAT_PHRASES.some(p => text.includes(p));
    const score     = isDanger ? 95 : 12;

    animateGauge(currentScore, score, isDanger, false);
    currentScore = score;

    // Append user bubble
    appendMessage('user', rawText);
    input.value = '';

    // Reset input style if safe
    if (!isDanger) {
        document.getElementById('chat-input').classList.remove('threat-input');
    }

    // Add to threat log
    addLogEntry(rawText, isDanger);

    // Show typing indicator
    const typingEl = document.getElementById('typing-indicator');
    typingEl.classList.add('show');

    // Scroll
    const msgs = document.getElementById('messages');
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(() => {
        typingEl.classList.remove('show');
        const reply = isDanger ? buildDangerReply() : buildSafeReply(text);
        appendMessage('ai', reply, isDanger);
        msgs.scrollTop = msgs.scrollHeight;
    }, isDanger ? 600 : 1000);
}

// ── Build AI Replies ──────────────────────────────────
function buildDangerReply() {
    return `<span class="threat-badge">SECURITY INTERCEPT</span><br>This prompt violates my safety protocols. Your request has been flagged and logged. <strong>Access denied.</strong> 🛑`;
}

function buildSafeReply(text) {
    // Keyword-aware contextual responses
    const keys = [
        ['hello', 'hi', 'hey', 'greetings'],
        ['help', 'assist', 'support', 'guide'],
        ['password', 'passwd', 'credentials', 'login'],
        ['security', 'secure', 'protection', 'protect'],
        ['vpn', 'virtual private'],
        ['phishing', 'phish', 'scam', 'spam'],
        ['encrypt', 'encryption', 'cipher'],
        ['malware', 'virus', 'ransomware', 'trojan', 'spyware'],
        ['firewall', 'filter', 'gateway'],
    ];

    const banks = [
        SAFE_RESPONSES.hello,
        SAFE_RESPONSES.help,
        SAFE_RESPONSES.password,
        SAFE_RESPONSES.security,
        SAFE_RESPONSES.vpn,
        SAFE_RESPONSES.phishing,
        SAFE_RESPONSES.encryption,
        SAFE_RESPONSES.malware,
        SAFE_RESPONSES.firewall,
    ];

    for (let i = 0; i < keys.length; i++) {
        if (keys[i].some(k => text.includes(k))) {
            const bank = banks[i];
            return bank[Math.floor(Math.random() * bank.length)];
        }
    }

    const def = SAFE_RESPONSES.default;
    return def[Math.floor(Math.random() * def.length)];
}

// ── DOM Helpers ───────────────────────────────────────
function appendMessage(role, content, danger = false) {
    const msgs = document.getElementById('messages');
    const typingEl = document.getElementById('typing-indicator');

    const row    = document.createElement('div');
    row.className = `msg ${role}`;

    const avatar = document.createElement('div');
    avatar.className = role === 'user' ? 'msg-avatar user-av' : 'msg-avatar';
    avatar.textContent = role === 'user' ? 'ME' : 'AG';

    const bubble = document.createElement('div');
    bubble.className = danger ? 'msg-bubble danger-msg' : 'msg-bubble';
    bubble.innerHTML = content;

    row.appendChild(avatar);
    row.appendChild(bubble);
    msgs.insertBefore(row, typingEl);
}

function addLogEntry(text, threat) {
    const log   = document.getElementById('threat-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const now   = new Date();
    const time  = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const label = threat
        ? `Blocked: "${text.slice(0, 22)}${text.length > 22 ? '…' : ''}"`
        : `Cleared: "${text.slice(0, 22)}${text.length > 22 ? '…' : ''}"`;

    entry.innerHTML = `
        <div class="log-dot ${threat ? 'threat' : 'safe'}"></div>
        <span>${label}</span>
        <span class="log-time">${time}</span>
    `;

    log.prepend(entry);

    // Keep max 8 entries
    while (log.children.length > 8) {
        log.removeChild(log.lastChild);
    }
}

// ── Enter key to send ─────────────────────────────────
document.getElementById('chat-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
});

// ── Health Bars Animation ─────────────────────────────
function buildHealthBars() {
    const container = document.getElementById('health-bars');
    container.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar-col';
        bar.style.height = Math.floor(Math.random() * 80 + 10) + '%';
        container.appendChild(bar);
    }
}
buildHealthBars();

setInterval(() => {
    const bars = document.querySelectorAll('.bar-col');
    const dangerMode = document.body.classList.contains('danger-mode');
    bars.forEach(bar => {
        const h = dangerMode
            ? Math.floor(Math.random() * 60 + 40)
            : Math.floor(Math.random() * 70 + 10);
        bar.style.height = h + '%';
        bar.className = dangerMode ? 'bar-col danger' : 'bar-col';
    });
}, 450);

// ── BPM counter ───────────────────────────────────────
setInterval(() => {
    const dangerMode = document.body.classList.contains('danger-mode');
    const bpm = dangerMode
        ? Math.floor(Math.random() * 30 + 95)
        : Math.floor(Math.random() * 10 + 64);
    const el = document.getElementById('health-ping');
    el.textContent = bpm + ' BPM';
    el.style.color = dangerMode ? 'var(--red)' : 'var(--green)';
}, 1200);

// ── Scan Rate ─────────────────────────────────────────
setInterval(() => {
    const ms = (Math.random() * 1.5 + 0.5).toFixed(1);
    document.getElementById('h-scan').textContent = ms + 'ms';
}, 2000);

// ── Uptime clock ──────────────────────────────────────
let uptimeSeconds = 0;
setInterval(() => {
    uptimeSeconds++;
    const h = String(Math.floor(uptimeSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(uptimeSeconds % 60).padStart(2, '0');
    // We'll just keep 99.9% shown — uptime display is static for aesthetics
}, 1000);

// ── Pulse Canvas ──────────────────────────────────────
(function drawPulse() {
    const canvas = document.getElementById('pulse-canvas');
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const W      = canvas.parentElement.clientWidth || 250;
    const H      = 36;
    canvas.width  = W;
    canvas.height = H;

    const points = Array.from({ length: W }, () => H / 2);
    let x = 0;

    function animate() {
        const dangerMode = document.body.classList.contains('danger-mode');
        const color      = dangerMode ? '#FF4B5C' : '#00FFC2';
        const amplitude  = dangerMode ? H * 0.45 : H * 0.3;
        const freq       = dangerMode ? 0.25 : 0.15;

        // Shift points left
        points.shift();
        const newY = H / 2 + amplitude * Math.sin(x * freq) * (0.6 + 0.4 * Math.random());
        points.push(newY);
        x += 1;

        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = dangerMode ? 6 : 4;
        ctx.shadowColor = color;
        ctx.moveTo(0, points[0]);
        points.forEach((py, px) => ctx.lineTo(px, py));
        ctx.stroke();

        requestAnimationFrame(animate);
    }
    animate();
})();
