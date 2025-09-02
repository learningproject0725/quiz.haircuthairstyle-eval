// -------------------- KONFIGURASI FIREBASE --------------------
const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quizhairstyle-default-rtdb.firebaseio.com/",
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.firebasestorage.app",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
  measurementId: "G-EG2K9M8PM1"
};

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// -------------------- VARIABEL GLOBAL --------------------
let questions = [];
let currentQuestion = 0;
let answers = {};
let userData = { nama: "", absen: "", kelas: "" };

// -------------------- LOAD SOAL --------------------
function loadQuestions() {
  db.ref("questions").once("value").then(snapshot => {
    questions = snapshot.val() || [];
    if (questions.length > 0) {
      showQuestion(0);
      renderNav();
    } else {
      alert("Belum ada soal di database!");
    }
  });
}

// -------------------- TAMPILKAN SOAL --------------------
function showQuestion(index) {
  currentQuestion = index;
  const q = questions[index];
  document.getElementById("question-text").textContent = q.question;

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";
  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => selectAnswer(index, i);
    if (answers[index] === i) btn.classList.add("selected");
    choicesDiv.appendChild(btn);
  });

  updateNav();
}

// -------------------- PILIH JAWABAN --------------------
function selectAnswer(qIndex, choiceIndex) {
  answers[qIndex] = choiceIndex;
  showQuestion(qIndex);
}

// -------------------- NAVIGASI --------------------
function renderNav() {
  const nav = document.getElementById("question-nav");
  nav.innerHTML = "";
  questions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.classList.add("question-btn");
    btn.onclick = () => showQuestion(i);
    nav.appendChild(btn);
  });
}

function updateNav() {
  const buttons = document.querySelectorAll(".question-btn");
  buttons.forEach((btn, i) => {
    btn.classList.remove("active", "answered");
    if (i === currentQuestion) btn.classList.add("active");
    if (answers[i] !== undefined) btn.classList.add("answered");
  });
}

// -------------------- SUBMIT KUIS --------------------
function submitQuiz() {
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });

  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "flex";
  document.getElementById("score-text").textContent = score + "/" + questions.length;

  saveToLeaderboard(userData.nama, userData.absen, userData.kelas, score);
  loadLeaderboard(userData.kelas); // tampilkan leaderboard realtime
}

// -------------------- SIMPAN KE LEADERBOARD --------------------
function saveToLeaderboard(nama, absen, kelas, score) {
  const leaderboardRef = db.ref("leaderboard/" + kelas);

  leaderboardRef.orderByChild("absen").equalTo(absen).once("value", snapshot => {
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const data = child.val();
        if (score > data.score) {
          child.ref.set({ nama, absen, kelas, score });
        }
      });
    } else {
      leaderboardRef.push({ nama, absen, kelas, score });
    }
  });
}

// -------------------- TAMPILKAN LEADERBOARD --------------------
function loadLeaderboard(kelas) {
  const leaderboardRef = db.ref("leaderboard/" + kelas);

  leaderboardRef.orderByChild("score").limitToLast(10).on("value", snapshot => {
    const data = [];
    snapshot.forEach(child => {
      data.push(child.val());
    });

    // urutkan descending skor
    data.sort((a, b) => b.score - a.score);

    const leaderboardDiv = document.getElementById("leaderboard");
    leaderboardDiv.innerHTML = "<h3>Leaderboard Kelas " + kelas + "</h3>";

    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>Peringkat</th>
        <th>Nama</th>
        <th>Absen</th>
        <th>Skor</th>
      </tr>
    `;

    data.forEach((item, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${item.nama}</td>
        <td>${item.absen}</td>
        <td>${item.score}</td>
      `;
      table.appendChild(row);
    });

    leaderboardDiv.appendChild(table);
  });
}

// -------------------- START QUIZ --------------------
function startQuiz() {
  userData.nama = document.getElementById("nama").value.trim();
  userData.absen = document.getElementById("absen").value.trim();
  userData.kelas = document.getElementById("kelas").value.trim();

  if (!userData.nama || !userData.absen || !userData.kelas) {
    alert("Lengkapi data terlebih dahulu!");
    return;
  }

  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";

  loadQuestions();
}
