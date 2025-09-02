// ====== Import Firebase SDK ====== //
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-database.js";

// ====== Konfigurasi Firebase ====== //
const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quizhairstyle-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.appspot.com",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
  measurementId: "G-EG2K9M8PM1"
};

// ====== Inisialisasi Firebase ====== //
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ====== Variabel global ====== //
let currentUser = {};
let questions = [];
let currentQuestion = 0;
let score = 0;

// ====== FORM LOGIN PESERTA ====== //
const loginForm = document.getElementById("login-form");
const quizContainer = document.getElementById("quiz-container");
const questionBox = document.getElementById("question-box");
const startBtn = document.getElementById("start-btn");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  currentUser = {
    nama: document.getElementById("nama").value,
    absen: document.getElementById("absen").value,
    kelas: document.getElementById("kelas").value
  };
  loginForm.style.display = "none";
  startBtn.style.display = "block";
});

// ====== LOAD PERTANYAAN DARI FIREBASE ====== //
async function loadQuestions() {
  const snapshot = await get(child(ref(db), "questions"));
  if (snapshot.exists()) {
    questions = snapshot.val();
  } else {
    alert("Belum ada soal di database!");
  }
}

// ====== TAMPILKAN PERTANYAAN ====== //
function showQuestion() {
  if (currentQuestion >= questions.length) {
    endQuiz();
    return;
  }
  const q = questions[currentQuestion];
  questionBox.innerHTML = `
    <h3>Soal ${currentQuestion + 1}</h3>
    <p>${q.text}</p>
    ${q.choices
      .map(
        (c, i) =>
          `<button class="choice-btn" data-index="${i}">${c}</button>`
      )
      .join("")}
  `;
  document.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", checkAnswer);
  });
}

// ====== CEK JAWABAN ====== //
function checkAnswer(e) {
  const choice = parseInt(e.target.dataset.index);
  if (choice === questions[currentQuestion].answer) {
    score++;
  }
  currentQuestion++;
  showQuestion();
}

// ====== SELESAI QUIZ ====== //
function endQuiz() {
  quizContainer.innerHTML = `<h2>Skor kamu: ${score}</h2>`;
  saveLeaderboard();
}

// ====== SIMPAN SKOR KE LEADERBOARD ====== //
async function saveLeaderboard() {
  const userRef = ref(db, `leaderboard/${currentUser.kelas}/${currentUser.absen}`);
  await set(userRef, {
    nama: currentUser.nama,
    absen: currentUser.absen,
    kelas: currentUser.kelas,
    score: score,
    timestamp: Date.now()
  });
  alert("Skor tersimpan di leaderboard!");
}

// ====== START QUIZ ====== //
startBtn.addEventListener("click", async () => {
  startBtn.style.display = "none";
  quizContainer.style.display = "block";
  await loadQuestions();
  showQuestion();
});

// ================== ADMIN MODE ================== //
const adminBtn = document.getElementById("admin-btn");
const adminPanel = document.getElementById("admin-panel");
const adminLogin = document.getElementById("admin-login");
const adminForm = document.getElementById("admin-form");
const editorContainer = document.getElementById("editor-container");
const addQuestionBtn = document.getElementById("add-question-btn");
const saveQuestionsBtn = document.getElementById("save-questions-btn");

let questionsData = [];

// Tombol masuk admin
adminBtn.addEventListener("click", () => {
  adminLogin.style.display = "block";
});

// Login admin
adminForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const pass = document.getElementById("admin-pass").value;
  if (pass === "12345") {
    adminLogin.style.display = "none";
    adminPanel.style.display = "block";
    renderEditor();
  } else {
    alert("Password salah!");
  }
});

// Render editor soal
function renderEditor() {
  editorContainer.innerHTML = "";
  questionsData.forEach((q, index) => {
    const box = document.createElement("div");
    box.className = "editor-question";
    box.innerHTML = `
      <h4>Soal ${index + 1}</h4>
      <input type="text" placeholder="Teks soal" value="${q.text}" class="q-text">
      <div class="choices">
        ${q.choices
          .map(
            (c, i) =>
              `<input type="text" value="${c}" class="q-choice" data-choice="${i}" placeholder="Pilihan ${i + 1}">`
          )
          .join("")}
      </div>
      <label>Kunci jawaban:
        <select class="q-answer">
          ${q.choices
            .map(
              (c, i) =>
                `<option value="${i}" ${i == q.answer ? "selected" : ""}>${i + 1}</option>`
            )
            .join("")}
        </select>
      </label>
      <hr>
    `;
    editorContainer.appendChild(box);
  });
}

// Tambah soal baru
addQuestionBtn.addEventListener("click", () => {
  questionsData.push({
    text: "",
    choices: ["", "", "", ""],
    answer: 0
  });
  renderEditor();
});

// Simpan soal ke Firebase
saveQuestionsBtn.addEventListener("click", async () => {
  const editorQuestions = document.querySelectorAll(".editor-question");
  questionsData = Array.from(editorQuestions).map((box) => {
    const text = box.querySelector(".q-text").value;
    const choices = Array.from(box.querySelectorAll(".q-choice")).map((c) => c.value);
    const answer = parseInt(box.querySelector(".q-answer").value);
    return { text, choices, answer };
  });

  await set(ref(db, "questions"), questionsData);
  alert("Soal berhasil disimpan ke database!");
});

