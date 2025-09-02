// === Firebase Setup ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, push, update, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quizhairstyle-default-rtdb.firebaseio.com/",
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.appspot.com",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
  measurementId: "G-EG2K9M8PM1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Elemen DOM ===
const startScreen = document.getElementById("start-screen");
const userForm = document.getElementById("user-form");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const adminBtn = document.getElementById("admin-btn");
const adminLoginModal = document.getElementById("admin-login");
const adminEditorModal = document.getElementById("admin-editor");

const loginBtn = document.getElementById("login-btn");
const addQuestionBtn = document.getElementById("add-question-btn");
const saveQuestionsBtn = document.getElementById("save-questions-btn");

const questionText = document.getElementById("question-text");
const choicesContainer = document.getElementById("choices");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const leaderboardList = document.getElementById("leaderboard-list");

let currentUser = { name: "", absen: "", kelas: "" };
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let timer;

// === Admin Login ===
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
    alert("Username atau password salah!");
  }
});

// === Tambah Soal Baru di Editor ===
addQuestionBtn.addEventListener("click", () => {
  const container = document.getElementById("editor-container");

  const div = document.createElement("div");
  div.classList.add("editor-question");
  div.innerHTML = `
    <input type="text" placeholder="Pertanyaan">
    <input type="text" placeholder="Pilihan A">
    <input type="text" placeholder="Pilihan B">
    <input type="text" placeholder="Pilihan C">
    <input type="text" placeholder="Pilihan D">
    <input type="text" placeholder="Jawaban Benar (A/B/C/D)">
    <hr>
  `;
  container.appendChild(div);
});

// === Simpan Soal ke Firebase ===
saveQuestionsBtn.addEventListener("click", async () => {
  const editorQuestions = document.querySelectorAll(".editor-question");
  const newQuestions = [];

  editorQuestions.forEach(div => {
    const inputs = div.querySelectorAll("input");
    if (inputs[0].value.trim() !== "") {
      newQuestions.push({
        text: inputs[0].value,
        choices: [inputs[1].value, inputs[2].value, inputs[3].value, inputs[4].value],
        answer: inputs[5].value.toUpperCase()
      });
    }
  });

  await set(ref(db, "questions"), newQuestions);
  alert("Soal berhasil disimpan!");
  loadQuestions();
});

// === Load Soal ke Editor ===
async function loadQuestionsToEditor() {
  const snapshot = await get(ref(db, "questions"));
  if (snapshot.exists()) {
    const data = snapshot.val();
    const container = document.getElementById("editor-container");
    container.innerHTML = "";

    data.forEach(q => {
      const div = document.createElement("div");
      div.classList.add("editor-question");
      div.innerHTML = `
        <input type="text" value="${q.text}">
        <input type="text" value="${q.choices[0]}">
        <input type="text" value="${q.choices[1]}">
        <input type="text" value="${q.choices[2]}">
        <input type="text" value="${q.choices[3]}">
        <input type="text" value="${q.answer}">
        <hr>
      `;
      container.appendChild(div);
    });
  }
}

// === User Mulai Kuis ===
document.getElementById("open-form-btn").addEventListener("click", () => {
  startScreen.style.display = "none";
  userForm.style.display = "block";
});

document.getElementById("start-btn").addEventListener("click", () => {
  const name = document.getElementById("user-name").value.trim();
  const absen = document.getElementById("user-absen").value.trim();
  const kelas = document.getElementById("user-kelas").value.trim();

  if (!name || !absen || !kelas) {
    alert("Lengkapi semua data terlebih dahulu!");
    return;
  }

  currentUser = { name, absen, kelas };
  userForm.style.display = "none";
  quizScreen.style.display = "block";
  loadQuestions();
});

// === Load Soal dari Firebase ===
async function loadQuestions() {
  const snapshot = await get(ref(db, "questions"));
  if (snapshot.exists()) {
    questions = snapshot.val();
    currentQuestionIndex = 0;
    showQuestion();
  } else {
    alert("Belum ada soal!");
  }
}

// === Tampilkan Soal ===
function showQuestion() {
  const q = questions[currentQuestionIndex];
  questionText.textContent = `${currentQuestionIndex + 1}. ${q.text}`;
  choicesContainer.innerHTML = "";

  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.addEventListener("click", () => {
      answers[currentQuestionIndex] = String.fromCharCode(65 + idx); // A/B/C/D
      nextBtn.click();
    });
    choicesContainer.appendChild(btn);
  });

  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? "Selesai" : "Selanjutnya";
}

prevBtn.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    finishQuiz();
  }
});

// === Selesai Kuis ===
async function finishQuiz() {
  quizScreen.style.display = "none";
  resultScreen.style.display = "block";

  let correct = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.answer) correct++;
  });

  const wrong = questions.length - correct;
  const score = Math.round((correct / questions.length) * 100);

  document.getElementById("correct-count").textContent = correct;
  document.getElementById("wrong-count").textContent = wrong;
  document.getElementById("score-text").textContent = `Skor: ${score}`;

  await update(ref(db, `leaderboard/${currentUser.kelas}/${currentUser.absen}`), {
    name: currentUser.name,
    absen: currentUser.absen,
    score: score
  });

  loadLeaderboard(currentUser.kelas);
}

// === Tampilkan Leaderboard ===
async function loadLeaderboard(kelas) {
  const snapshot = await get(ref(db, `leaderboard/${kelas}`));
  leaderboardList.innerHTML = "";
  if (snapshot.exists()) {
    const data = Object.values(snapshot.val());
    data.sort((a, b) => b.score - a.score);

    data.forEach((entry, idx) => {
      const li = document.createElement("li");
      li.textContent = `${idx + 1}. ${entry.absen} - ${entry.name} : ${entry.score}`;
      leaderboardList.appendChild(li);
    });

    document.getElementById("class-display").textContent = kelas;
  }
}
