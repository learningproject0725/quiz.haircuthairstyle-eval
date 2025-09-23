// ==================== Firebase Init ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  child,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quiz-evaluasi-hairstyle-default-rtdb.firebaseio.com/",
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.appspot.com",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// ==================== Global Variables ====================
let questions = [];
let currentQuestion = 0;
let answers = {};
let timer;

// ==================== DOM Elements ====================
const userForm = document.getElementById("user-form");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const adminLogin = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const leaderboardTable = document.querySelector("#leaderboard tbody");
const questionContainer = document.getElementById("question-container");
const navButtons = document.getElementById("nav-buttons");

// ==================== Quiz Functions ====================
async function loadQuestions() {
  const snapshot = await get(child(ref(db), "questions"));
  if (snapshot.exists()) {
    questions = Object.values(snapshot.val());
  } else {
    questions = [];
  }
}

function renderQuestion() {
  if (!questions[currentQuestion]) return;

  const q = questions[currentQuestion];
  questionContainer.innerHTML = `
    <h3>${currentQuestion + 1}. ${q.question}</h3>
    ${q.options
      .map(
        (opt, i) => `
        <button class="option-btn ${
          answers[currentQuestion] === i ? "selected" : ""
        }" onclick="selectOption(${i})">${opt}</button>
      `
      )
      .join("")}
  `;

  renderNavButtons();
}

function renderNavButtons() {
  navButtons.innerHTML = "";

  if (currentQuestion > 0) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Kembali";
    prevBtn.onclick = () => {
      currentQuestion--;
      renderQuestion();
    };
    navButtons.appendChild(prevBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent =
    currentQuestion < questions.length - 1 ? "Lanjut" : "Selesai";
  nextBtn.onclick = () => {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  };
  navButtons.appendChild(nextBtn);
}

window.selectOption = (i) => {
  answers[currentQuestion] = i;
  renderQuestion();
};

function startTimer(duration) {
  let time = duration;
  timer = setInterval(() => {
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;
    document.getElementById(
      "timer"
    ).textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    if (--time < 0) {
      clearInterval(timer);
      finishQuiz();
    }
  }, 1000);
}

function finishQuiz() {
  clearInterval(timer);

  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });

  let percent = ((score / questions.length) * 100).toFixed(2);

  quizScreen.style.display = "none";
  resultScreen.style.display = "block";

  document.getElementById("score").textContent = `Skor Anda: ${score} / ${
    questions.length
  } (${percent}%)`;

  saveLeaderboard(score, percent);
}

// ==================== Leaderboard ====================
async function saveLeaderboard(score, percent) {
  const nama = document.getElementById("nama").value;
  const absen = document.getElementById("absen").value;
  const kelas = document.getElementById("kelas").value;

  const userRef = ref(db, `leaderboard/${kelas}/${nama}_${absen}`);
  await set(userRef, {
    nama,
    absen,
    kelas,
    score,
    percent,
    timestamp: Date.now()
  });

  loadLeaderboard(kelas);
}

async function loadLeaderboard(kelas) {
  const snapshot = await get(child(ref(db), `leaderboard/${kelas}`));
  leaderboardTable.innerHTML = "";

  if (snapshot.exists()) {
    const data = Object.values(snapshot.val());
    data
      .sort((a, b) => b.score - a.score)
      .forEach((row, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${row.nama}</td>
          <td>${row.absen}</td>
          <td>${row.kelas}</td>
          <td>${row.score}</td>
          <td>${row.percent}%</td>
        `;
        leaderboardTable.appendChild(tr);
      });
  }
}

// ==================== Admin ====================
document.getElementById("admin-btn").onclick = () => {
  adminLogin.style.display = "block";
};

document.getElementById("login-admin-btn").onclick = () => {
  const pass = document.getElementById("admin-pass").value;
  if (pass === "12345") {
    adminLogin.style.display = "none";
    adminPanel.style.display = "block";
    loadQuestionsAdmin();
  } else {
    alert("Password salah!");
  }
};

async function loadQuestionsAdmin() {
  const snapshot = await get(child(ref(db), "questions"));
  const container = document.getElementById("admin-questions");
  container.innerHTML = "";

  if (snapshot.exists()) {
    const data = Object.entries(snapshot.val());
    data.forEach(([key, q], idx) => {
      const div = document.createElement("div");
      div.className = "admin-question";
      div.innerHTML = `
        <h4>Soal ${idx + 1}</h4>
        <input type="text" value="${q.question}" id="q-${key}" />
        ${q.options
          .map(
            (opt, i) =>
              `<input type="text" value="${opt}" id="q-${key}-opt${i}" />`
          )
          .join("")}
        <input type="number" value="${q.answer}" id="q-${key}-ans" />
        <button onclick="updateQuestion('${key}')">Update</button>
        <button onclick="deleteQuestion('${key}')">Hapus</button>
      `;
      container.appendChild(div);
    });
  }
}

window.updateQuestion = async (key) => {
  const q = document.getElementById(`q-${key}`).value;
  const opts = [];
  for (let i = 0; i < 4; i++) {
    opts.push(document.getElementById(`q-${key}-opt${i}`).value);
  }
  const ans = parseInt(document.getElementById(`q-${key}-ans`).value);
  await update(ref(db, `questions/${key}`), {
    question: q,
    options: opts,
    answer: ans
  });
  loadQuestionsAdmin();
};

window.deleteQuestion = async (key) => {
  await remove(ref(db, `questions/${key}`));
  loadQuestionsAdmin();
};

document.getElementById("add-question-btn").onclick = async () => {
  const newRef = push(ref(db, "questions"));
  await set(newRef, {
    question: "Tulis pertanyaan di sini",
    options: ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"],
    answer: 0
  });
  loadQuestionsAdmin();
};

// ==================== User Start Quiz ====================
document.getElementById("start-btn").onclick = async () => {
  await loadQuestions();

  if (questions.length === 0) {
    alert("Belum ada soal di database.");
    return;
  }

  currentQuestion = 0;
  answers = {};

  userForm.style.display = "none";
  quizScreen.style.display = "block";

  renderQuestion();
  startTimer(20 * 60);
};
