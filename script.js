// ===== Firebase Setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, push, update, child, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quizhairstyle-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.appspot.com",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== Variabel Global =====
let userData = { nama: "", absen: "", kelas: "" };
let questions = [];
let currentQuestion = 0;
let score = 0;
let userAnswers = [];

// ===== DOM ELEMENTS =====
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const leaderboardScreen = document.getElementById("leaderboard-screen");
const adminScreen = document.getElementById("admin-screen");
const questionBox = document.getElementById("question-box");
const choicesBox = document.getElementById("choices");
const questionNav = document.getElementById("question-nav");

// ===== Ambil Soal dari Database =====
async function loadQuestions() {
  const snapshot = await get(ref(db, "questions"));
  if (snapshot.exists()) {
    questions = Object.values(snapshot.val());
  } else {
    alert("Belum ada soal di database.");
  }
}

// ===== Mulai Quiz =====
document.getElementById("start-btn").addEventListener("click", async () => {
  userData.nama = document.getElementById("nama").value.trim();
  userData.absen = document.getElementById("absen").value.trim();
  userData.kelas = document.getElementById("kelas").value.trim();

  if (!userData.nama || !userData.absen || !userData.kelas) {
    alert("Isi semua data terlebih dahulu!");
    return;
  }

  await loadQuestions();
  if (questions.length === 0) return;

  startScreen.style.display = "none";
  quizScreen.style.display = "block";

  showQuestion(0);
  renderNav();
});

// ===== Tampilkan Soal =====
function showQuestion(index) {
  currentQuestion = index;
  const q = questions[index];

  questionBox.innerText = `${index + 1}. ${q.question}`;
  choicesBox.innerHTML = "";

  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerText = choice;
    btn.onclick = () => selectAnswer(i);
    choicesBox.appendChild(btn);
  });

  highlightNav();
}

// ===== Pilih Jawaban =====
function selectAnswer(i) {
  userAnswers[currentQuestion] = i;
  renderNav();
}

// ===== Navigasi Soal =====
function renderNav() {
  questionNav.innerHTML = "";
  questions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.innerText = i + 1;
    if (userAnswers[i] !== undefined) btn.classList.add("active");
    btn.onclick = () => showQuestion(i);
    questionNav.appendChild(btn);
  });
}

function highlightNav() {
  [...questionNav.children].forEach((btn, i) => {
    btn.classList.toggle("active", userAnswers[i] !== undefined);
  });
}

// ===== Submit Quiz =====
document.getElementById("submit-btn").addEventListener("click", () => {
  score = 0;
  questions.forEach((q, i) => {
    if (userAnswers[i] === q.answer) score++;
  });

  quizScreen.style.display = "none";
  resultScreen.style.display = "block";
  document.getElementById("score-display").innerText = `Skor Anda: ${score}`;

  saveLeaderboard();
  showLeaderboard();
});

// ===== Simpan Skor ke Leaderboard =====
function saveLeaderboard() {
  const userKey = `${userData.absen}_${userData.nama}`;
  const userRef = ref(db, `leaderboard/${userData.kelas}/${userKey}`);

  set(userRef, {
    nama: userData.nama,
    absen: userData.absen,
    kelas: userData.kelas,
    score: score,
    timestamp: Date.now()
  });
}

// ===== Tampilkan Leaderboard =====
function showLeaderboard() {
  leaderboardScreen.style.display = "block";
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  onValue(ref(db, `leaderboard/${userData.kelas}`), (snapshot) => {
    if (!snapshot.exists()) return;

    const data = Object.values(snapshot.val());
    data.sort((a, b) => b.score - a.score);

    list.innerHTML = data.map(d => 
      `<li>${d.absen}. ${d.nama} - ${d.score}</li>`
    ).join("");
  });
}

// ===== ADMIN LOGIN =====
document.getElementById("admin-login-btn").addEventListener("click", () => {
  const kode = document.getElementById("admin-code").value.trim();
  if (kode === "12345") {
    adminScreen.style.display = "block";
    document.querySelector(".modal-overlay").style.display = "none";
    loadEditor();
  } else {
    alert("Kode admin salah!");
  }
});

// ===== Tambah Soal Baru =====
document.getElementById("add-question-btn").addEventListener("click", () => {
  const container = document.getElementById("editor-container");
  const div = document.createElement("div");
  div.className = "editor-question";
  div.innerHTML = `
    <input type="text" placeholder="Pertanyaan">
    <input type="text" placeholder="Pilihan A">
    <input type="text" placeholder="Pilihan B">
    <input type="text" placeholder="Pilihan C">
    <input type="text" placeholder="Pilihan D">
    <input type="number" placeholder="Index jawaban benar (0-3)">
    <button class="save-btn">💾 Simpan</button>
  `;
  container.appendChild(div);

  div.querySelector(".save-btn").onclick = () => {
    const inputs = div.querySelectorAll("input");
    const question = inputs[0].value;
    const choices = [inputs[1].value, inputs[2].value, inputs[3].value, inputs[4].value];
    const answer = parseInt(inputs[5].value);

    if (!question || choices.some(c => !c) || isNaN(answer)) {
      alert("Isi semua field soal!");
      return;
    }

    const newRef = push(ref(db, "questions"));
    set(newRef, { question, choices, answer });

    alert("Soal tersimpan!");
    div.remove();
    loadEditor();
  };
});

// ===== Load Soal ke Editor =====
async function loadEditor() {
  const snapshot = await get(ref(db, "questions"));
  const container = document.getElementById("editor-container");
  container.innerHTML = "";

  if (snapshot.exists()) {
    Object.entries(snapshot.val()).forEach(([key, q]) => {
      const div = document.createElement("div");
      div.className = "editor-question";
      div.innerHTML = `
        <p><b>${q.question}</b></p>
        <p>Pilihan: ${q.choices.join(", ")}</p>
        <p>Jawaban Benar: ${q.choices[q.answer]}</p>
        <button class="delete-btn">🗑 Hapus</button>
      `;
      container.appendChild(div);

      div.querySelector(".delete-btn").onclick = () => {
        set(ref(db, "questions/" + key), null);
        loadEditor();
      };
    });
  }
}

