// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// -------------------- FIREBASE CONFIG --------------------
// Saya isi databaseURL sesuai yang kamu sebutkan sebelumnya.
// Jika kamu punya config lain, ganti seluruh objek ini dengan config project kamu.
const firebaseConfig = {
  apiKey: "AIzaSyDNUme5dcYQi6pKR3gpdRUp1wHxQSiP2q4",
  authDomain: "quiz-evaluasi-hairstyle.firebaseapp.com",
  databaseURL: "https://quiz-evaluasi-hairstyle-default-rtdb.firebaseio.com",
  projectId: "quiz-evaluasi-hairstyle",
  storageBucket: "quiz-evaluasi-hairstyle.appspot.com",
  messagingSenderId: "892621648220",
  appId: "1:892621648220:web:fa83dcec7dc25f4d595199"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// -------------------- UTILS --------------------
function fmtTimestamp(ts) {
  if (!ts) return "";
  try {
    const n = Number(ts);
    const d = isFinite(n) ? new Date(n) : new Date(ts);
    return isNaN(d) ? String(ts) : d.toLocaleString();
  } catch {
    return String(ts);
  }
}

function sanitizeSheetName(name) {
  if (!name) return "Sheet";
  let s = String(name).replace(/[\\\/\?\*\[\]]/g, "_");
  if (s.length > 31) s = s.slice(0, 31);
  return s;
}

function ensureScriptLoaded(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// -------------------- DOM READY --------------------
document.addEventListener("DOMContentLoaded", () => {
  // elements
  const adminBtn = document.getElementById("admin-btn");
  const adminLogin = document.getElementById("admin-login");
  const adminEditor = document.getElementById("admin-editor");
  const loginBtn = document.getElementById("login-btn");
  const adminCancelBtn = document.getElementById("admin-cancel-btn");
  const editorCloseBtn = document.getElementById("editor-close-btn");
  const editorContainer = document.getElementById("editor-container");
  const addQuestionBtn = document.getElementById("add-question-btn");
  const saveQuestionsBtn = document.getElementById("save-questions-btn");
  const exportBtn = document.getElementById("export-xlsx-btn");

  const openFormBtn = document.getElementById("open-form-btn");
  const startScreen = document.getElementById("start-screen");
  const userForm = document.getElementById("user-form");
  const startBtn = document.getElementById("start-btn");
  const quizScreen = document.getElementById("quiz-screen");
  const resultScreen = document.getElementById("result-screen");

  const timerEl = document.getElementById("timer");
  const questionTextEl = document.getElementById("question-text");
  const choicesEl = document.getElementById("choices");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const questionNavEl = document.getElementById("question-nav");

  const correctCountEl = document.getElementById("correct-count");
  const wrongCountEl = document.getElementById("wrong-count");
  const scoreTextEl = document.getElementById("score-text");
  const classDisplayEl = document.getElementById("class-display");
  const leaderboardListEl = document.getElementById("leaderboard-list");

  const backToStartBtn = document.getElementById("back-to-start");

  // state
  let quizQuestions = [];
  let currentIndex = 0;
  let selectedAnswers = {}; // map index -> chosenIndex
  let quizTimerHandle = null;
  let quizTimeLeft = 20 * 60;

  // ================= ADMIN UI =================
  adminBtn?.addEventListener("click", () => {
    adminLogin.classList.add("show");
    adminLogin.style.display = "flex";
  });
  adminCancelBtn?.addEventListener("click", () => {
    adminLogin.classList.remove("show");
    adminLogin.style.display = "none";
  });
  editorCloseBtn?.addEventListener("click", () => {
    adminEditor.classList.remove("show");
    adminEditor.style.display = "none";
  });

  loginBtn?.addEventListener("click", async () => {
    const pass = document.getElementById("admin-password")?.value ?? "";
    if (pass === "12345") {
      adminLogin.classList.remove("show");
      adminLogin.style.display = "none";
      adminEditor.classList.add("show");
      adminEditor.style.display = "flex";
      await loadQuestionsToEditor();
    } else {
      alert("Password salah!");
    }
  });

  // ================= EDITOR FUNCTIONS =================
  async function loadQuestionsToEditor() {
    try {
      const snap = await get(child(ref(db), "questions"));
      editorContainer.innerHTML = "";
      if (!snap.exists()) {
        const p = document.createElement("p");
        p.textContent = "Belum ada soal. Klik + Tambah Soal untuk menambahkan.";
        editorContainer.appendChild(p);
        return;
      }
      const data = snap.val();
      // object of keys -> question
      Object.entries(data).forEach(([id, q]) => {
        const card = createEditorCard(id, q);
        editorContainer.appendChild(card);
      });
    } catch (err) {
      console.error("loadQuestionsToEditor:", err);
      editorContainer.innerHTML = "<p>Error saat memuat soal.</p>";
    }
  }

  function createEditorCard(id, q = { text: "", choices: ["", "", "", ""], answer: 0 }) {
    const wrap = document.createElement("div");
    wrap.className = "editor-question";
    wrap.dataset.qid = id;

    wrap.innerHTML = `
      <label><strong>Pertanyaan</strong></label>
      <textarea class="editor-qtext" rows="2">${escapeHtml(q.text ?? "")}</textarea>

      <div style="display:flex;gap:8px;margin-top:8px;">
        <div style="flex:1"><label>A (0)</label><input class="editor-c0" value="${escapeHtml((q.choices ?? [])[0] ?? "")}"></div>
        <div style="flex:1"><label>B (1)</label><input class="editor-c1" value="${escapeHtml((q.choices ?? [])[1] ?? "")}"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <div style="flex:1"><label>C (2)</label><input class="editor-c2" value="${escapeHtml((q.choices ?? [])[2] ?? "")}"></div>
        <div style="flex:1"><label>D (3)</label><input class="editor-c3" value="${escapeHtml((q.choices ?? [])[3] ?? "")}"></div>
      </div>

      <div style="margin-top:8px;">
        <label>Jawaban benar (index 0-3)</label>
        <input class="editor-answer" type="number" min="0" max="3" value="${Number.isFinite(q.answer) ? q.answer : 0}">
      </div>

      <div style="margin-top:8px;display:flex;gap:8px;">
        <button class="editor-save">Simpan Perubahan</button>
        <button class="editor-delete" style="background:#e74c3c">Hapus Soal</button>
      </div>
    `;

    wrap.querySelector(".editor-save").addEventListener("click", async () => {
      const txt = wrap.querySelector(".editor-qtext").value.trim();
      const c0 = wrap.querySelector(".editor-c0").value.trim();
      const c1 = wrap.querySelector(".editor-c1").value.trim();
      const c2 = wrap.querySelector(".editor-c2").value.trim();
      const c3 = wrap.querySelector(".editor-c3").value.trim();
      const ans = parseInt(wrap.querySelector(".editor-answer").value || "0", 10);
      if (!txt || !c0 || !c1 || !c2 || !c3 || isNaN(ans)) {
        alert("Lengkapi semua field (pertanyaan, 4 pilihan, jawaban 0-3).");
        return;
      }
      const payload = { text: txt, choices: [c0, c1, c2, c3], answer: ans };
      try {
        await update(ref(db, `questions/${wrap.dataset.qid}`), payload);
        alert("Perubahan disimpan.");
        await loadQuestionsToEditor();
      } catch (err) {
        console.error("Gagal update soal:", err);
        alert("Gagal menyimpan perubahan.");
      }
    });

    wrap.querySelector(".editor-delete").addEventListener("click", async () => {
      if (!confirm("Hapus soal ini?")) return;
      try {
        await remove(ref(db, `questions/${wrap.dataset.qid}`));
        wrap.remove();
      } catch (err) {
        console.error("Gagal hapus:", err);
        alert("Gagal menghapus soal.");
      }
    });

    return wrap;
  }

  addQuestionBtn?.addEventListener("click", async () => {
    try {
      const newKey = Date.now().toString();
      await set(ref(db, `questions/${newKey}`), {
        text: "Soal baru — edit di sini",
        choices: ["Pilihan A (0)", "Pilihan B (1)", "Pilihan C (2)", "Pilihan D (3)"],
        answer: 0,
        createdAt: Date.now()
      });
      await loadQuestionsToEditor();
    } catch (err) {
      console.error("Gagal tambah soal:", err);
      alert("Gagal menambah soal.");
    }
  });

  saveQuestionsBtn?.addEventListener("click", async () => {
    try {
      const cards = editorContainer.querySelectorAll(".editor-question");
      if (!cards.length) {
        alert("Tidak ada soal untuk disimpan.");
        return;
      }
      for (const card of cards) {
        const id = card.dataset.qid;
        const txt = card.querySelector(".editor-qtext").value.trim();
        const c0 = card.querySelector(".editor-c0").value.trim();
        const c1 = card.querySelector(".editor-c1").value.trim();
        const c2 = card.querySelector(".editor-c2").value.trim();
        const c3 = card.querySelector(".editor-c3").value.trim();
        const ans = parseInt(card.querySelector(".editor-answer").value || "0", 10);
        if (!txt || !c0 || !c1 || !c2 || !c3 || isNaN(ans)) {
          throw new Error("Semua field harus terisi pada tiap soal.");
        }
        await update(ref(db, `questions/${id}`), { text: txt, choices: [c0, c1, c2, c3], answer: ans });
      }
      alert("Semua perubahan disimpan.");
      await loadQuestionsToEditor();
    } catch (err) {
      console.error("Gagal menyimpan semua perubahan:", err);
      alert("Gagal menyimpan: " + (err.message || err));
    }
  });

  // ================= QUIZ functions =================
  async function loadQuestionsForQuiz() {
    const snap = await get(child(ref(db), "questions"));
    if (!snap.exists()) {
      quizQuestions = [];
      return;
    }
    const val = snap.val();
    quizQuestions = Object.keys(val).map(k => ({ id: k, ...val[k] }));
  }

  function renderQuizQuestion() {
    const q = quizQuestions[currentIndex];
    if (!q) {
      questionTextEl.textContent = "Soal tidak ada.";
      choicesEl.innerHTML = "";
      return;
    }
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
    nextBtn.textContent = currentIndex < quizQuestions.length - 1 ? "Selanjutnya" : "Selesai";
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

  openFormBtn?.addEventListener("click", () => {
    startScreen.style.display = "none";
    userForm.style.display = "block";
  });

  startBtn?.addEventListener("click", async () => {
    const name = document.getElementById("user-name")?.value.trim();
    const absen = document.getElementById("user-absen")?.value.trim();
    const kelas = document.getElementById("user-kelas")?.value.trim();
    if (!name || !absen || !kelas) {
      alert("Isi semua data!");
      return;
    }

    await loadQuestionsForQuiz();
    if (!quizQuestions.length) {
      alert("Belum ada soal di database.");
      return;
    }

    // init
    selectedAnswers = {};
    currentIndex = 0;
    quizTimeLeft = 20 * 60;

    userForm.style.display = "none";
    quizScreen.style.display = "block";
    renderQuizQuestion();
    renderQuizNav();

    clearInterval(quizTimerHandle);
    quizTimerHandle = setInterval(() => {
      quizTimeLeft--;
      timerEl.textContent = `Waktu: ${Math.floor(quizTimeLeft / 60)}:${String(quizTimeLeft % 60).padStart(2, "0")}`;
      if (quizTimeLeft <= 0) {
        clearInterval(quizTimerHandle);
        finishQuizForUser(name, absen, kelas);
      }
    }, 1000);
  });

  prevBtn?.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuizQuestion();
      renderQuizNav();
    }
  });

  nextBtn?.addEventListener("click", () => {
    if (currentIndex < quizQuestions.length - 1) {
      currentIndex++;
      renderQuizQuestion();
      renderQuizNav();
    } else {
      const name = document.getElementById("user-name")?.value.trim();
      const absen = document.getElementById("user-absen")?.value.trim();
      const kelas = document.getElementById("user-kelas")?.value.trim();
      finishQuizForUser(name, absen, kelas);
    }
  });

  backToStartBtn?.addEventListener("click", () => {
    // reset and go to start
    resultScreen.style.display = "none";
    startScreen.style.display = "block";
    location.reload();
  });

  async function finishQuizForUser(name, absen, kelas) {
    clearInterval(quizTimerHandle);
    quizScreen.style.display = "none";
    resultScreen.style.display = "block";

    let benar = 0;
    quizQuestions.forEach((q, idx) => {
      if ((selectedAnswers[idx] ?? -1) === Number((q.answer ?? q.correct ?? 0))) benar++;
    });
    const salah = quizQuestions.length - benar;
    const score = Math.round((benar / quizQuestions.length) * 100);

    correctCountEl.textContent = benar;
    wrongCountEl.textContent = salah;
    scoreTextEl.textContent = `Skor: ${score}%`;
    classDisplayEl.textContent = kelas;

    try {
      const userPath = `leaderboard/${kelas}/${name}_${absen}`;
      const payload = { nama: name, absen, kelas, score, timestamp: Date.now() };
      await set(ref(db, userPath), payload);
      await loadLeaderboardForClass(kelas);
    } catch (err) {
      console.error("Gagal menyimpan leaderboard:", err);
    }
  }

  async function loadLeaderboardForClass(kelas) {
    try {
      const snap = await get(child(ref(db), `leaderboard/${kelas}`));
      leaderboardListEl.innerHTML = "";
      if (!snap.exists()) {
        leaderboardListEl.innerHTML = "<li>Belum ada data untuk kelas ini.</li>";
        return;
      }
      const arr = Object.values(snap.val());
      arr.sort((a, b) => (b.score || 0) - (a.score || 0));
      arr.forEach((entry, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${entry.nama} (Absen: ${entry.absen}) - ${entry.score}%`;
        leaderboardListEl.appendChild(li);
      });
    } catch (err) {
      console.error("Gagal load leaderboard:", err);
    }
  }

  // ================= EXPORT Excel =================
  exportBtn?.addEventListener("click", async () => {
    try {
      await ensureScriptLoaded("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
      if (typeof XLSX === "undefined") throw new Error("Library XLSX tidak tersedia.");

      const snap = await get(child(ref(db), "leaderboard"));
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
            Timestamp: fmtTimestamp(ts)
          });
        }
        const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Nama: "", Absen: "", Skor: "", Timestamp: "" }]);
        XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(kelas));
      }

      const filename = `leaderboard_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"_")}.xlsx`;
      XLSX.writeFile(wb, filename);
      alert("Export selesai: " + filename);
    } catch (err) {
      console.error("Gagal export:", err);
      alert("Gagal export ke Excel: " + (err.message || err));
    }
  });

  // end DOMContentLoaded
});
