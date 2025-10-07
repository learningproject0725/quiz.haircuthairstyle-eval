// script.js (update final)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// -------------------- FIREBASE CONFIG --------------------
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

// -------------------- HELPERS --------------------
function fmtTimestamp(ts) {
  if (!ts) return "";
  try {
    const d = new Date(Number(ts));
    if (isNaN(d)) return ts;
    return d.toLocaleString();
  } catch {
    return ts;
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
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = (e) => reject(new Error("Failed to load script: " + src));
    document.head.appendChild(s);
  });
}

// -------------------- DOM READY --------------------
document.addEventListener("DOMContentLoaded", () => {
  // DOM elements (expected in your HTML)
  const adminBtn = document.getElementById("admin-btn");
  const adminLogin = document.getElementById("admin-login");
  const adminEditor = document.getElementById("admin-editor");
  const loginBtn = document.getElementById("login-btn");
  const editorContainer = document.getElementById("editor-container");
  const addQuestionBtn = document.getElementById("add-question-btn");
  const saveQuestionsBtn = document.getElementById("save-questions-btn");

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

  // If any required element missing, warn (but continue)
  if (!adminBtn || !adminLogin || !adminEditor || !loginBtn) {
    console.warn("Beberapa elemen admin tidak ditemukan — pastikan HTML sesuai.");
  }

  // Create Export button in admin editor if not exist
  let exportBtn = document.getElementById("export-xlsx-btn");
  if (!exportBtn && adminEditor) {
    exportBtn = document.createElement("button");
    exportBtn.id = "export-xlsx-btn";
    exportBtn.textContent = "⬇️ Export Leaderboard (Excel)";
    exportBtn.style.background = "#0077cc";
    exportBtn.style.marginLeft = "6px";
    const saveBtn = saveQuestionsBtn;
    if (saveBtn && saveBtn.parentNode) {
      saveBtn.parentNode.insertBefore(exportBtn, saveBtn.nextSibling);
    } else {
      const box = adminEditor.querySelector(".modal-box");
      if (box) box.appendChild(exportBtn);
      else adminEditor.appendChild(exportBtn);
    }
  }

  // -------------------- ADMIN LOGIN --------------------
  adminBtn?.addEventListener("click", () => {
    // show admin login modal (use class show to avoid CSS overrides)
    adminLogin.classList.add("show");
  });

  loginBtn?.addEventListener("click", async () => {
    const pass = document.getElementById("admin-password")?.value ?? "";
    if (pass === "12345") {
      adminLogin.classList.remove("show");
      adminEditor.classList.add("show");
      await loadQuestionsToEditor();
    } else {
      alert("Password salah!");
    }
  });

  // allow modal "Batal" buttons to close by removing .show (some HTML uses inline onclick)
  document.querySelectorAll("[onclick]").forEach(el => {
    // keep existing inline handlers, but nothing to change here
  });

  // -------------------- EDITOR: Load / Render / CRUD --------------------
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
      Object.entries(data).forEach(([id, q]) => {
        editorContainer.appendChild(createEditorCard(id, q));
      });
    } catch (err) {
      console.error("Gagal load questions for editor:", err);
      editorContainer.innerHTML = "<p>Error saat memuat soal.</p>";
    }
  }

  function createEditorCard(id, q = { text: "", choices: ["", "", "", ""], answer: 0 }) {
    const wrap = document.createElement("div");
    wrap.className = "editor-question";
    wrap.dataset.qid = id ?? "";

    // label pilihan with code (A (0), B (1), ...)
    wrap.innerHTML = `
      <label><strong>Pertanyaan</strong></label><br>
      <textarea class="editor-qtext" rows="2" style="width:100%;">${escapeHtml(q.text ?? q.question ?? "")}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <div style="flex:1"><label>A (0)</label><input class="editor-choice editor-c0" style="width:100%" value="${escapeHtml((q.choices ?? q.options ?? [])[0] ?? "")}"></div>
        <div style="flex:1"><label>B (1)</label><input class="editor-choice editor-c1" style="width:100%" value="${escapeHtml((q.choices ?? q.options ?? [])[1] ?? "")}"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <div style="flex:1"><label>C (2)</label><input class="editor-choice editor-c2" style="width:100%" value="${escapeHtml((q.choices ?? q.options ?? [])[2] ?? "")}"></div>
        <div style="flex:1"><label>D (3)</label><input class="editor-choice editor-c3" style="width:100%" value="${escapeHtml((q.choices ?? q.options ?? [])[3] ?? "")}"></div>
      </div>
      <div style="margin-top:8px;">
        <label>Jawaban benar (index 0-3)</label>
        <input class="editor-answer" type="number" min="0" max="3" value="${Number.isFinite(q.answer ?? q.answerIndex) ? (q.answer ?? q.answerIndex ?? 0) : 0}">
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
      if (!txt || !c0 || !c1 || !c2 || !c3 || isNaN(ans) || ans < 0 || ans > 3) {
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
        // delete by setting null
        await update(ref(db, `questions/${wrap.dataset.qid}`), null);
        wrap.remove();
      } catch (err) {
        console.error("Gagal hapus soal:", err);
        alert("Gagal menghapus soal.");
      }
    });

    return wrap;
  }

  // add new blank question
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

  // save all edited cards
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

  // -------------------- QUIZ: load & play --------------------
  let quizQuestions = [];
  let currentIndex = 0;
  let selectedAnswers = {};
  let quizTimerHandle = null;
  let quizTimeLeft = 20 * 60;

  async function loadQuestionsForQuiz() {
    const snap = await get(child(ref(db), "questions"));
    if (!snap.exists()) {
      quizQuestions = [];
      return;
    }
    const val = snap.val();
    // convert object -> array preserving keys order
    quizQuestions = Object.keys(val).map(k => ({ id: k, ...val[k] }));
  }

  function renderQuizQuestion() {
    const q = quizQuestions[currentIndex];
    if (!q) return;
    // no double numbering — show the text as-is
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
        renderQuizNav(); // update nav indicator color
      });
      choicesEl.appendChild(btn);
    });

    // update next button label
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

  document.getElementById("open-form-btn")?.addEventListener("click", () => {
    startScreen.style.display = "none";
    userForm.style.display = "block";
  });

  document.getElementById("start-btn")?.addEventListener("click", async () => {
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

    // timer
    clearInterval(quizTimerHandle);
    quizTimerHandle = setInterval(() => {
      quizTimeLeft--;
      timerEl.textContent = `Waktu: ${Math.floor(quizTimeLeft / 60)}:${String(quizTimeLeft % 60).padStart(2, "0")}`;
      if (quizTimeLeft <= 0) {
        clearInterval(quizTimerHandle);
        const name = document.getElementById("user-name")?.value.trim();
        const absen = document.getElementById("user-absen")?.value.trim();
        const kelas = document.getElementById("user-kelas")?.value.trim();
        finishQuizForUser(name, absen, kelas);
      }
    }, 1000);
  });

  document.getElementById("next-btn")?.addEventListener("click", () => {
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

  document.getElementById("prev-btn")?.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuizQuestion();
      renderQuizNav();
    }
  });

  async function finishQuizForUser(name, absen, kelas) {
    clearInterval(quizTimerHandle);
    quizScreen.style.display = "none";
    resultScreen.style.display = "block";

    // calculate
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

    // save to leaderboard
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
      const data = Object.values(snap.val());
      data.sort((a, b) => b.score - a.score);
      data.forEach((entry, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${entry.nama} (Absen: ${entry.absen}) - ${entry.score}%`;
        leaderboardListEl.appendChild(li);
      });
    } catch (err) {
      console.error("Gagal load leaderboard:", err);
    }
  }

  // -------------------- EXPORT to EXCEL (Sheet per kelas) --------------------
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
          // FIX: use defined variable names only
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
        const sheetName = sanitizeSheetName(kelas);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      const filename = `leaderboard_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"_")}.xlsx`;
      XLSX.writeFile(wb, filename);
      alert("Export selesai: " + filename);
    } catch (err) {
      console.error("Gagal export:", err);
      alert("Gagal export ke Excel: " + (err.message || err));
    }
  });

  // Utility escapeHtml
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // end DOMContentLoaded
});
