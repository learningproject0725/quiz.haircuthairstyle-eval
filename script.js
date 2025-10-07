document.addEventListener("DOMContentLoaded", () => {
  const startSection = document.getElementById("start-section");
  const quizSection = document.getElementById("quiz-section");
  const resultSection = document.getElementById("result-section");
  const adminSection = document.getElementById("admin-section");
  const editSection = document.getElementById("edit-section");
  const leaderboardSection = document.getElementById("leaderboard-section");

  const startBtn = document.getElementById("start-btn");
  const exportBtn = document.getElementById("export-btn");
  const adminBtn = document.getElementById("admin-btn");
  const adminLoginBtn = document.getElementById("admin-login-btn");
  const saveQuestionsBtn = document.getElementById("save-questions-btn");

  const questionTextEl = document.getElementById("question-text");
  const choicesEl = document.getElementById("choices");
  const nextBtn = document.getElementById("next-btn");
  const questionNavEl = document.getElementById("question-nav");

  const nameInput = document.getElementById("nama");
  const absenInput = document.getElementById("absen");
  const kelasInput = document.getElementById("kelas");

  const scoreText = document.getElementById("score-text");
  const leaderboardTable = document.getElementById("leaderboard-table");

  // Firebase setup
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DB_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MSG_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  let quizQuestions = [];
  let currentIndex = 0;
  let selectedAnswers = [];
  let userName = "";
  let userAbsen = "";
  let userKelas = "";

  async function loadQuestions() {
    const snapshot = await db.ref("questions").once("value");
    const data = snapshot.val();
    quizQuestions = data ? Object.values(data) : [];
  }

  function showSection(section) {
    [startSection, quizSection, resultSection, adminSection, editSection, leaderboardSection].forEach(s => {
      if (s) s.style.display = "none";
    });
    if (section) section.style.display = "block";
  }

  function renderQuizQuestion() {
    const q = quizQuestions[currentIndex];
    if (!q) return;
    questionTextEl.textContent = q.text ?? q.question ?? "";
    choicesEl.innerHTML = "";

    (q.choices ?? q.options ?? []).forEach((c, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = c;
      if (selectedAnswers[currentIndex] === i) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        selectedAnswers[currentIndex] = i;
        renderQuizQuestion();
        renderQuizNav();
      });
      choicesEl.appendChild(btn);
    });

    nextBtn.textContent = currentIndex === quizQuestions.length - 1 ? "Selesai" : "Lanjut";
  }

  function renderQuizNav() {
    questionNavEl.innerHTML = "";
    quizQuestions.forEach((_, i) => {
      const b = document.createElement("button");
      b.textContent = i + 1;
      b.className = "question-btn";
      if (i === currentIndex) b.classList.add("active");
      if (selectedAnswers[i] !== undefined) b.classList.add("answered");
      b.addEventListener("click", () => {
        currentIndex = i;
        renderQuizQuestion();
        renderQuizNav();
      });
      questionNavEl.appendChild(b);
    });
  }

  nextBtn.addEventListener("click", () => {
    if (currentIndex < quizQuestions.length - 1) {
      currentIndex++;
      renderQuizQuestion();
      renderQuizNav();
    } else {
      calculateResult();
    }
  });

  function calculateResult() {
    let correct = 0;
    quizQuestions.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) correct++;
    });
    const score = Math.round((correct / quizQuestions.length) * 100);
    scoreText.textContent = `${score}%`;
    saveToLeaderboard(score);
    showSection(resultSection);
    loadLeaderboard();
  }

  function saveToLeaderboard(score) {
    const refPath = `leaderboard/${userKelas}/${userName}_${userAbsen}`;
    db.ref(refPath).set({
      nama: userName,
      absen: userAbsen,
      kelas: userKelas,
      score: score,
      timestamp: new Date().toISOString()
    });
  }

  async function loadLeaderboard() {
    const snapshot = await db.ref("leaderboard").once("value");
    const data = snapshot.val();
    leaderboardTable.innerHTML = `
      <tr>
        <th>Kelas</th><th>Nama</th><th>Absen</th><th>Skor</th><th>Waktu</th>
      </tr>
    `;
    if (data) {
      for (const kelas in data) {
        for (const key in data[kelas]) {
          const row = data[kelas][key];
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${kelas}</td>
            <td>${row.nama}</td>
            <td>${row.absen}</td>
            <td>${row.score}</td>
            <td>${new Date(row.timestamp).toLocaleString()}</td>
          `;
          leaderboardTable.appendChild(tr);
        }
      }
    }
  }

  startBtn.addEventListener("click", async () => {
    userName = nameInput.value.trim();
    userAbsen = absenInput.value.trim();
    userKelas = kelasInput.value.trim();
    if (!userName || !userAbsen || !userKelas) {
      alert("Isi semua data dulu!");
      return;
    }
    await loadQuestions();
    if (!quizQuestions.length) {
      alert("Soal belum tersedia.");
      return;
    }
    currentIndex = 0;
    selectedAnswers = [];
    showSection(quizSection);
    renderQuizQuestion();
    renderQuizNav();
  });

  adminBtn.addEventListener("click", () => {
    showSection(adminSection);
  });

  adminLoginBtn.addEventListener("click", () => {
    const pass = document.getElementById("admin-pass").value.trim();
    if (pass === "12345") {
      loadQuestionsToEditor();
      showSection(editSection);
    } else {
      alert("Password salah!");
    }
  });

  async function loadQuestionsToEditor() {
    await loadQuestions();
    const container = document.getElementById("edit-questions-container");
    container.innerHTML = "";
    quizQuestions.forEach((q, i) => {
      const div = document.createElement("div");
      div.className = "edit-block";
      div.innerHTML = `
        <label>Soal ${i + 1}</label>
        <textarea class="edit-text">${q.text ?? ""}</textarea>
        <label>Pilihan A (0)</label><input class="edit-choice-a" value="${q.choices?.[0] ?? ""}">
        <label>Pilihan B (1)</label><input class="edit-choice-b" value="${q.choices?.[1] ?? ""}">
        <label>Pilihan C (2)</label><input class="edit-choice-c" value="${q.choices?.[2] ?? ""}">
        <label>Pilihan D (3)</label><input class="edit-choice-d" value="${q.choices?.[3] ?? ""}">
        <label>Kunci Jawaban (0-3)</label><input type="number" class="edit-answer" value="${q.answer ?? 0}" min="0" max="3">
        <hr>
      `;
      container.appendChild(div);
    });
  }

  saveQuestionsBtn.addEventListener("click", () => {
    const edits = document.querySelectorAll(".edit-block");
    const newQs = [];
    edits.forEach(e => {
      const text = e.querySelector(".edit-text").value.trim();
      const a = e.querySelector(".edit-choice-a").value.trim();
      const b = e.querySelector(".edit-choice-b").value.trim();
      const c = e.querySelector(".edit-choice-c").value.trim();
      const d = e.querySelector(".edit-choice-d").value.trim();
      const ans = parseInt(e.querySelector(".edit-answer").value.trim());
      newQs.push({ text, choices: [a, b, c, d], answer: ans });
    });
    db.ref("questions").set(newQs);
    alert("Soal berhasil disimpan!");
  });

  exportBtn?.addEventListener("click", async () => {
    try {
      await ensureScriptLoaded("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
      if (typeof XLSX === "undefined") throw new Error("Library XLSX tidak tersedia.");

      const snap = await db.ref("leaderboard").once("value");
      if (!snap.exists()) {
        alert("Tidak ada data leaderboard untuk diexport.");
        return;
      }
      const data = snap.val();
      const wb = XLSX.utils.book_new();

      for (const kelas of Object.keys(data)) {
        const entries = data[kelas];
        const rows = [];

        for (const key of Object.keys(entries)) {
          const row = entries[key];
          const nama = row.nama ?? row.name ?? key;
          const absen = row.absen ?? row.absenNumber ?? row.absenNo ?? "";
          const score = row.score ?? row.skor ?? row.point ?? "";
          const ts = row.timestamp ?? row.time ?? row.date ?? "";
          rows.push({
            Nama: nama,
            Absen: absen,
            Skor: score,
            Timestamp: ts
          });
        }

        const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Nama: "", Absen: "", Skor: "", Timestamp: "" }]);
        XLSX.utils.book_append_sheet(wb, ws, kelas);
      }

      const filename = `leaderboard_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"_")}.xlsx`;
      XLSX.writeFile(wb, filename);
      alert("Export selesai: " + filename);
    } catch (err) {
      console.error("Gagal export:", err);
      alert("Gagal export ke Excel: " + (err.message || err));
    }
  });

  function ensureScriptLoaded(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
});
