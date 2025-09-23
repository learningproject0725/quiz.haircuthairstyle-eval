import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// ======================= FIREBASE CONFIG =======================
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

// ======================= STATE =======================
let questions = [];
let currentQuestion = 0;
let answers = {};
let timer;

// ======================= DOM =======================
document.addEventListener("DOMContentLoaded", () => {
  const adminBtn = document.getElementById("admin-btn");
  const adminLogin = document.getElementById("admin-login");
  const adminEditor = document.getElementById("admin-editor");
  const loginBtn = document.getElementById("login-btn");

  // ======================= ADMIN LOGIN =======================
  adminBtn.addEventListener("click", () => {
    adminLogin.style.display = "flex";
  });

  loginBtn.addEventListener("click", () => {
    const pass = document.getElementById("admin-password").value;
    if (pass === "12345") {
      adminLogin.style.display = "none";
      adminEditor.style.display = "flex";
      loadQuestionsToEditor();
    } else {
      alert("Password salah!");
    }
  });

  // ======================= QUIZ FLOW =======================
  document.getElementById("open-form-btn").onclick = () => {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("user-form").style.display = "block";
  };

  document.getElementById("start-btn").onclick = () => {
    document.getElementById("user-form").style.display = "none";
    document.getElementById("quiz-screen").style.display = "block";
    startTimer(20 * 60);
    loadQuestions();
  };

  document.getElementById("next-btn").onclick = () => {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      renderQuestion();
      updateNavButtons();
    } else {
      finishQuiz();
    }
  };

  document.getElementById("prev-btn").onclick = () => {
    if (currentQuestion > 0) {
      currentQuestion--;
      renderQuestion();
      updateNavButtons();
    }
  };

  // ======================= FUNCTIONS =======================

  async function loadQuestions() {
    const snapshot = await get(child(ref(db), "questions"));
    if (snapshot.exists()) {
      questions = Object.values(snapshot.val());
      currentQuestion = 0;
      answers = {};
      renderQuestion();
      renderNavButtons();
    } else {
      alert("Belum ada soal di database.");
    }
  }

  function renderQuestion() {
    const q = questions[currentQuestion];
    if (!q) return;
    document.getElementById("question-text").innerText = q.text;

    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";
    q.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.classList.add("choice-btn");
      btn.innerText = choice;
      if (answers[currentQuestion] === i) btn.style.background = "#4CAF50";
      btn.addEventListener("click", () => {
        answers[currentQuestion] = i;
        renderQuestion();
        updateNavButtons();
      });
      choicesDiv.appendChild(btn);
    });
  }

  function renderNavButtons() {
    const nav = document.getElementById("question-nav");
    nav.innerHTML = "";
    questions.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.innerText = i + 1;
      btn.addEventListener("click", () => {
        currentQuestion = i;
        renderQuestion();
        updateNavButtons();
      });
      nav.appendChild(btn);
    });
    updateNavButtons();
  }

  function updateNavButtons() {
    document.querySelectorAll("#question-nav button").forEach((btn, i) => {
      btn.classList.remove("active");
      if (i === currentQuestion) btn.classList.add("active");
      if (answers[i] !== undefined) btn.style.background = "#4CAF50";
    });
  }

  function startTimer(duration) {
    let time = duration;
    const timerDisplay = document.getElementById("timer");
    timer = setInterval(() => {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      timerDisplay.innerText = `Waktu: ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
      if (--time < 0) {
        clearInterval(timer);
        finishQuiz();
      }
    }, 1000);
  }

  function finishQuiz() {
    document.getElementById("quiz-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "block";

    let benar = 0;
    let salah = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) benar++;
      else salah++;
    });

    document.getElementById("correct-count").innerText = benar;
    document.getElementById("wrong-count").innerText = salah;
    const score = Math.round((benar / questions.length) * 100);
    document.getElementById("score-text").innerText = `Skor: ${score}`;

    const nama = document.getElementById("user-name").value;
    const absen = document.getElementById("user-absen").value;
    const kelas = document.getElementById("user-kelas").value;

    update(ref(db, `leaderboard/${kelas}/${nama}`), {
      absen,
      score,
      timestamp: Date.now()
    });

    get(child(ref(db), `leaderboard/${kelas}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const data = Object.entries(snapshot.val());
        data.sort((a, b) => b[1].score - a[1].score);
        const list = document.getElementById("leaderboard-list");
        list.innerHTML = "";
        data.forEach(([nama, info]) => {
          const li = document.createElement("li");
          li.innerText = `${nama} (Absen ${info.absen}) - Skor ${info.score}`;
          list.appendChild(li);
        });
        document.getElementById("class-display").innerText = kelas;
      }
    });
  }

  function loadQuestionsToEditor() {
    get(child(ref(db), "questions")).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const container = document.getElementById("editor-container");
        container.innerHTML = "";
        Object.entries(data).forEach(([id, q]) => {
          addQuestionEditor(container, id, q);
        });
      }
    });
  }

  function addQuestionEditor(container, id, q = null) {
    const div = document.createElement("div");
    div.classList.add("editor-question");
    div.innerHTML = `
      <input type="text" class="q-text" placeholder="Pertanyaan" value="${q ? q.text : ""}">
      <textarea class="q-choices" placeholder="Pilihan (pisahkan dengan koma)">${q ? q.choices.join(",") : ""}</textarea>
      <input type="number" class="q-answer" placeholder="Index jawaban benar (0-3)" value="${q ? q.answer : ""}">
      <button class="delete-btn">Hapus</button>
    `;
    div.querySelector(".delete-btn").onclick = () => div.remove();
    container.appendChild(div);
  }

  document.getElementById("add-question-btn").onclick = () => {
    addQuestionEditor(document.getElementById("editor-container"), Date.now());
  };

  document.getElementById("save-questions-btn").onclick = () => {
    const container = document.getElementById("editor-container");
    const qDivs = container.querySelectorAll(".editor-question");
    let newQuestions = {};
    qDivs.forEach((div, idx) => {
      const text = div.querySelector(".q-text").value;
      const choices = div.querySelector(".q-choices").value
        .split(",")
        .map((c) => c.trim());
      const answer = parseInt(div.querySelector(".q-answer").value);
      newQuestions[idx] = { text, choices, answer };
    });
    set(ref(db, "questions"), newQuestions).then(() => {
      alert("Soal tersimpan!");
      loadQuestions();
    });
  };
});
