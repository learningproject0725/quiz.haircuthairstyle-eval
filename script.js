// ================== Firebase (ES Module) ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 🔧 GANTI config ini sesuai project kamu (ini dari contohmu, sudah ditambah databaseURL)
const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quizhairstyle-default-rtdb.firebaseio.com",
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.firebasestorage.app",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
  measurementId: "G-EG2K9M8PM1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================== Admin Auth (simple) ==================
const ADMIN_USER = "admin";
const ADMIN_PASS = "23121989";

// ================== State ==================
let questions = [];                         // Array of {question, choices[4], answer}
let currentQuestion = 0;
let selectedAnswers = [];                   // index jawaban user per soal
let timeLeft = 20 * 60;                     // 20 menit
let timer = null;

let userName = "";
let userAbsen = "";
let userKelas = "";

// ================== DOM ==================
const startScreen = document.getElementById("start-screen");
const formScreen = document.getElementById("user-form");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const openFormBtn = document.getElementById("open-form-btn");
const startBtn = document.getElementById("start-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

const timerEl = document.getElementById("timer");
const questionText = document.getElementById("question-text");
const choicesEl = document.getElementById("choices");
const questionNav = document.getElementById("question-nav");

const correctCountEl = document.getElementById("correct-count");
const wrongCountEl = document.getElementById("wrong-count");
const scoreTextEl = document.getElementById("score-text");
const leaderboardList = document.getElementById("leaderboard-list");
const classDisplay = document.getElementById("class-display");

// Admin UI
const adminBtn = document.getElementById("admin-btn");
const adminLoginModal = document.getElementById("admin-login");
const adminEditorModal = document.getElementById("admin-editor");
const loginBtn = document.getElementById("login-btn");
const editorContainer = document.getElementById("editor-container");
const addQuestionBtn = document.getElementById("add-question-btn");
const saveQuestionsBtn = document.getElementById("save-questions-btn");

// ================== Helpers ==================
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function keyForUser(absen, name) {
  // key unik per user per kelas
  return `${String(absen).trim()}_${String(name).trim()}`.replace(/[.#$\[\]]/g, "_");
}

// ================== Start flow ==================
openFormBtn.onclick = () => {
  startScreen.style.display = "none";
  formScreen.style.display = "block";
};

startBtn.onclick = async () => {
  const name = document.getElementById("user-name").value.trim();
  const absen = document.getElementById("user-absen").value.trim();
  const kelas = document.getElementById("user-kelas").value.trim();

  if (!name || !absen || !kelas) {
    alert("Isi semua data terlebih dahulu.");
    return;
  }
  userName = name;
  userAbsen = absen;
  userKelas = kelas;

  // Ambil soal dari Firebase
  const snap = await get(ref(db, "questions"));
  if (!snap.exists()) {
    alert("Soal belum tersedia di database.");
    return;
  }

  const raw = snap.val();
  // Support format array atau object (q1,q2,..)
  if (Array.isArray(raw)) {
    questions = raw.filter(Boolean);
  } else if (typeof raw === "object") {
    questions = Object.values(raw);
  } else {
    questions = [];
  }

  if (!questions.length) {
    alert("Soal kosong. Silakan tambah soal di menu Admin.");
    return;
  }

  selectedAnswers = Array(questions.length).fill(null);

  formScreen.style.display = "none";
  quizScreen.style.display = "block";

  renderQuestion();
  renderNav();
  startTimer();
};

// ================== Timer ==================
function startTimer() {
  timerEl.textContent = `Waktu: ${fmtTime(timeLeft)}`;
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Waktu: ${fmtTime(timeLeft)}`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      finishQuiz();
    }
  }, 1000);
}

// ================== Quiz Render ==================
function renderQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = `${currentQuestion + 1}. ${q.question}`;

  choicesEl.innerHTML = "";
  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    if (selectedAnswers[currentQuestion] === i) {
      btn.classList.add("selected");
    }
    btn.onclick = () => {
      selectedAnswers[currentQuestion] = i;
      renderQuestion();
      updateNavStatus();
    };
    choicesEl.appendChild(btn);
  });

  // Nav buttons
  prevBtn.disabled = currentQuestion === 0;
  nextBtn.textContent =
    currentQuestion === questions.length - 1 ? "Selesai" : "Selanjutnya";
}

function renderNav() {
  questionNav.innerHTML = "";
  questions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.className = "question-btn";
    if (i === currentQuestion) btn.classList.add("active");
    if (selectedAnswers[i] !== null) btn.classList.add("answered");
    btn.onclick = () => {
      currentQuestion = i;
      renderQuestion();
      renderNav();
    };
    questionNav.appendChild(btn);
  });
}

function updateNavStatus() {
  const nodes = questionNav.querySelectorAll(".question-btn");
  nodes.forEach((btn, idx) => {
    btn.classList.toggle("active", idx === currentQuestion);
    if (selectedAnswers[idx] !== null) btn.classList.add("answered");
  });
}

// ================== Quiz Navigation ==================
prevBtn.onclick = () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
    renderNav();
  }
};

nextBtn.onclick = () => {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
    renderNav();
  } else {
    // Cek belum dijawab
    const notAnswered = selectedAnswers
      .map((v, i) => (v === null ? i + 1 : null))
      .filter(Boolean);
    if (notAnswered.length) {
      alert("Belum dijawab: " + notAnswered.join(", "));
      return;
    }
    finishQuiz();
  }
};

// ================== Finish & Leaderboard ==================
async function finishQuiz() {
  clearInterval(timer);
  quizScreen.style.display = "none";
  resultScreen.style.display = "block";

  // Hitung skor
  const correct = selectedAnswers.filter(
    (ans, i) => ans === Number(questions[i].answer)
  ).length;
  const wrong = questions.length - correct;
  const score = Math.round((correct / questions.length) * 100);

  correctCountEl.textContent = String(correct);
  wrongCountEl.textContent = String(wrong);

  scoreTextEl.textContent = `Nilai: ${score}%`;
  scoreTextEl.className = score >= 85 ? "green" : score >= 70 ? "yellow" : "red";

  classDisplay.textContent = userKelas;

  // Simpan ke leaderboard (simpan skor tertinggi saja)
  const userKey = keyForUser(userAbsen, userName);
  const userRef = ref(db, `leaderboard/${userKelas}/${userKey}`);

  const snap = await get(userRef);
  if (!snap.exists() || (snap.exists() && (snap.val().score ?? 0) < score)) {
    await set(userRef, {
      name: userName,
      absen: userAbsen,
      kelas: userKelas,
      score: score,
      timestamp: Date.now()
    });
  }

  // Tampilkan leaderboard
  loadLeaderboard(userKelas);
}

function loadLeaderboard(kelas) {
  const kelasRef = ref(db, `leaderboard/${kelas}`);
  onValue(kelasRef, (snapshot) => {
    if (!snapshot.exists()) {
      leaderboardList.innerHTML = "<li>Belum ada data untuk kelas ini.</li>";
      return;
    }
    const arr = Object.values(snapshot.val());
    arr.sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);

    leaderboardList.innerHTML = "";
    arr.forEach((entry, idx) => {
      const li = document.createElement("li");
      li.textContent = `${idx + 1}. ${entry.name} (Absen: ${entry.absen}) - ${entry.score}%`;
      leaderboardList.appendChild(li);
    });
  });
}

// ================== Admin: Login & Editor ==================
adminBtn.onclick = () => {
  adminLoginModal.style.display = "flex";
};

loginBtn.onclick = async () => {
  const u = document.getElementById("admin-username").value.trim();
  const p = document.getElementById("admin-password").value.trim();
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    adminLoginModal.style.display = "none";
    await openEditor();
  } else {
    alert("Username / Password salah.");
  }
};

async function openEditor() {
  // Ambil soal terbaru
  const snap = await get(ref(db, "questions"));
  let current = [];
  if (snap.exists()) {
    const raw = snap.val();
    current = Array.isArray(raw) ? raw.filter(Boolean) : Object.values(raw);
  }

  renderEditor(current);
  adminEditorModal.style.display = "flex";
}

function renderEditor(items) {
  editorContainer.innerHTML = "";
  questions = items.length ? items : [];

  questions.forEach((q, idx) => {
    editorContainer.appendChild(makeQuestionEditor(q, idx));
  });

  // Jika kosong, buat 1 pertanyaan default
  if (questions.length === 0) {
    addEmptyQuestion();
  }
}

function makeQuestionEditor(q, idx) {
  const wrap = document.createElement("div");
  wrap.className = "editor-item";
  wrap.style.border = "1px solid #ddd";
  wrap.style.borderRadius = "10px";
  wrap.style.padding = "12px";
  wrap.style.margin = "10px 0";
  wrap.style.textAlign = "left";

  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin:0;">Soal #${idx + 1}</h3>
      <button class="remove-q" data-idx="${idx}" style="background:#e74c3c;color:#fff;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;">Hapus</button>
    </div>
    <label>Pertanyaan</label>
    <textarea class="q-text" rows="2" style="width:100%;box-sizing:border-box;">${q.question ?? ""}</textarea>

    <div style="margin-top:8px;">
      <label>Pilihan (A)</label>
      <input class="q-c0" type="text" style="width:100%;" value="${q.choices?.[0] ?? ""}">
    </div>
    <div>
      <label>Pilihan (B)</label>
      <input class="q-c1" type="text" style="width:100%;" value="${q.choices?.[1] ?? ""}">
    </div>
    <div>
      <label>Pilihan (C)</label>
      <input class="q-c2" type="text" style="width:100%;" value="${q.choices?.[2] ?? ""}">
    </div>
    <div>
      <label>Pilihan (D)</label>
      <input class="q-c3" type="text" style="width:100%;" value="${q.choices?.[3] ?? ""}">
    </div>

    <div style="margin-top:8px;">
      <label>Jawaban Benar</label>
      <select class="q-ans" style="width:100%;padding:6px;">
        <option value="0" ${Number(q.answer) === 0 ? "selected" : ""}>A (0)</option>
        <option value="1" ${Number(q.answer) === 1 ? "selected" : ""}>B (1)</option>
        <option value="2" ${Number(q.answer) === 2 ? "selected" : ""}>C (2)</option>
        <option value="3" ${Number(q.answer) === 3 ? "selected" : ""}>D (3)</option>
      </select>
    </div>
  `;

  // Hapus pertanyaan
  wrap.querySelector(".remove-q").onclick = () => {
    questions.splice(idx, 1);
    // Re-render dengan index terbaru
    renderEditor(questions);
  };

  // Binding perubahan
  const txt = wrap.querySelector(".q-text");
  const c0 = wrap.querySelector(".q-c0");
  const c1 = wrap.querySelector(".q-c1");
  const c2 = wrap.querySelector(".q-c2");
  const c3 = wrap.querySelector(".q-c3");
  const ans = wrap.querySelector(".q-ans");

  txt.oninput = () => (questions[idx].question = txt.value);
  c0.oninput = () => (questions[idx].choices[0] = c0.value);
  c1.oninput = () => (questions[idx].choices[1] = c1.value);
  c2.oninput = () => (questions[idx].choices[2] = c2.value);
  c3.oninput = () => (questions[idx].choices[3] = c3.value);
  ans.onchange = () => (questions[idx].answer = Number(ans.value));

  return wrap;
}

function addEmptyQuestion() {
  questions.push({
    question: "",
    choices: ["", "", "", ""],
    answer: 0
  });
  renderEditor(questions);
}

addQuestionBtn.onclick = () => addEmptyQuestion();

saveQuestionsBtn.onclick = async () => {
  // Validasi & bereskan data
  const cleaned = questions
    .map((q) => ({
      question: String(q.question || "").trim(),
      choices: Array.isArray(q.choices)
        ? q.choices.map((c) => String(c || "").trim()).slice(0, 4)
        : ["", "", "", ""],
      answer: Number.isInteger(q.answer) ? q.answer : 0
    }))
    .filter((q) => q.question && q.choices.every((c) => c !== ""));

  if (!cleaned.length) {
    alert("Tidak ada soal valid untuk disimpan.");
    return;
  }

  try {
    // Simpan sebagai array — mudah diambil via Object.values() juga
    await set(ref(db, "questions"), cleaned);
    alert("Soal berhasil disimpan!");
  } catch (e) {
    console.error(e);
    alert("Gagal menyimpan soal.");
  }
};

// ================== End of File ==================
