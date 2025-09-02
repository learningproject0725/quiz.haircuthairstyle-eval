// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quizhairstyle-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.appspot.com",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
  measurementId: "G-EG2K9M8PM1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ====================
// VARIABEL GLOBAL
// ====================
let currentUser = {};
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let timer;
let timeLeft = 20 * 60; // 20 menit

// ====================
// ADMIN LOGIN
// ====================
const adminBtn = document.getElementById("admin-btn");
const adminLoginModal = document.getElementById("admin-login");
const adminEditorModal = document.getElementById("admin-editor");
const loginBtn = document.getElementById("login-btn");

adminBtn.addEventListener("click", () => {
  adminLoginModal.style.display = "flex";
});

loginBtn.addEventListener("click", () => {
  const username = document.getElementById("admin-username").value;
  const password = document.getElementById("admin-password").value;

  if (username === "admin" && password === "1234") {
    adminLoginModal.style.display = "none";
    loadQuestionsToEditor();
    adminEditorModal.style.display = "flex";
  } else {
    alert("Username/Password salah!");
  }
});

// ====================
// LOAD & SIMPAN SOAL
// ====================
async function loadQuestionsFromDB() {
  const snapshot = await get(ref(db, "questions"));
  if (snapshot.exists()) {
    questions = snapshot.val();
  } else {
    questions = [];
  }
}

async function loadQuestionsToEditor() {
  await loadQuestionsFromDB();
  const container = document.getElementById("editor-container");
  container.innerHTML = "";

  questions.forEach((q, idx) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h4>Soal ${idx + 1}</h4>
      <input type="text" value="${q.text}" class="q-text"><br>
      ${q.choices.map((c, i) =>
        `<input type="text" value="${c}" class="q-choice">`
      ).join("<br>")}
      <br>Jawaban Benar (index 0-3):
      <input type="number" value="${q.answer}" class="q-answer"><hr>
    `;
    container.appendChild(div);
  });
}

document.getElementById("add-question-btn").addEventListener("click", () => {
  questions.push({ text: "Soal baru", choices: ["A", "B", "C", "D"], answer: 0 });
  loadQuestionsToEditor();
});

document.getElementById("save-questions-btn").addEventListener("click", async () => {
  const container = document.getElementById("editor-container");
  const qDivs = container.querySelectorAll("div");

  questions = Array.from(qDivs).map(div => {
    const text = div.querySelector(".q-text").value;
    const choices = Array.from(div.querySelectorAll(".q-choice")).map(c => c.value);
    const answer = parseInt(div.querySelector(".q-answer").value);
    return { text, choices, answer };
  });

  await set(ref(db, "questions"), questions);
  alert("Soal berhasil disimpan!");
});

// ====================
// QUIZ START
// ====================
document.getElementById("open-form-btn").addEventListener("click", () => {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("user-form").style.display = "block";
});

document.getElementById("start-btn").addEventListener("click", async () => {
  const name = document.getElementById("user-name").value.trim();
  const absen = document.getElementById("user-absen").value.trim();
  const kelas = document.getElementById("user-kelas").value.trim();

  if (!name || !absen || !kelas) {
    alert("Harap isi semua data!");
    return;
  }

  currentUser = { name, absen, kelas };

  await loadQuestionsFromDB();
  if (questions.length === 0) {
    alert("Belum ada soal di database!");
    return;
  }

  document.getElementById("user-form").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";

  startTimer();
  showQuestion();
  renderNavigation();
});

// ====================
// TIMER
// ====================
function startTimer() {
  const timerEl = document.getElementById("timer");
  timer = setInterval(() => {
    timeLeft--;
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");
    timerEl.textContent = `Waktu: ${min}:${sec}`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      finishQuiz();
    }
  }, 1000);
}

// ====================
// PERTANYAAN
// ====================
function showQuestion() {
  const q = questions[currentQuestionIndex];
  document.getElementById("question-text").textContent = q.text;

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => {
      answers[currentQuestionIndex] = idx;
      showQuestion();
    };
    if (answers[currentQuestionIndex] === idx) {
      btn.style.background = "#4caf50";
      btn.style.color = "white";
    }
    choicesDiv.appendChild(btn);
  });
}

document.getElementById("prev-btn").addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion();
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    finishQuiz();
  }
});

// ====================
// SELESAI & LEADERBOARD
// ====================
async function finishQuiz() {
  clearInterval(timer);

  let correct = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.answer) correct++;
  });
  const wrong = questions.length - correct;
  const score = Math.round((correct / questions.length) * 100);

  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "block";
  document.getElementById("correct-count").textContent = correct;
  document.getElementById("wrong-count").textContent = wrong;
  document.getElementById("score-text").textContent = `Skor Anda: ${score}`;
  document.getElementById("class-display").textContent = currentUser.kelas;

  const userRef = ref(db, `leaderboard/${currentUser.kelas}/${currentUser.absen}_${currentUser.name}`);
  await update(userRef, { name: currentUser.name, score });

  loadLeaderboard(currentUser.kelas);
}

async function loadLeaderboard(kelas) {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  const snapshot = await get(ref(db, `leaderboard/${kelas}`));
  if (snapshot.exists()) {
    const data = snapshot.val();
    const sorted = Object.values(data).sort((a, b) => b.score - a.score);

    sorted.forEach(entry => {
      const li = document.createElement("li");
      li.textContent = `${entry.name} - ${entry.score}`;
      list.appendChild(li);
    });
  } else {
    list.innerHTML = "<li>Belum ada data</li>";
  }
}
