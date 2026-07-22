console.log("SCRIPT BUILD: contactfusion-light-dashboard-v3");

/* =========================================================
   Supported file types (mirrors core/consolidator.py + .zip)
   ========================================================= */
const SUPPORTED_EXTENSIONS = [".xlsx", ".xlsm", ".xls", ".xlsb", ".csv", ".zip"];
const BATCH_FILL_CAP = 30; // purely decorative scale for the sidebar batch bar

let selectedFiles = [];
let clearedLogCount = 0;
let userScrolledUp = false;
let autoScrollEnabled = true;
let lastRowsProcessed = 0;

/* =========================================================
   Element refs
   ========================================================= */
const chooseBtn = document.getElementById("chooseBtn");
const folderBtn = document.getElementById("folderBtn");
const zipBtn = document.getElementById("zipBtn");

const fileInput = document.getElementById("fileInput");
const folderInput = document.getElementById("folderInput");
const zipInput = document.getElementById("zipInput");

const uploadBtn = document.getElementById("uploadBtn");
const downloadBtn = document.getElementById("downloadBtn"); // container, not a plain button

const fileList = document.getElementById("fileList");
const dropzone = document.getElementById("dropzone");
const validationMsg = document.getElementById("validationMsg");
const validationMsgText = document.getElementById("validationMsgText");

const logsEl = document.getElementById("logs");
const autoScrollBtn = document.getElementById("autoScrollBtn");
const copyLogsBtn = document.getElementById("copyLogsBtn");
const clearLogsBtn = document.getElementById("clearLogsBtn");

const toastStack = document.getElementById("toastStack");
const batchSummary = document.getElementById("batchSummary");
const batchFill = document.getElementById("batchFill");

/* =========================================================
   Toasts
   ========================================================= */
function toast(message, type = "info") {
  const icons = { success: "bi-check-circle-fill", error: "bi-x-circle-fill", warn: "bi-exclamation-triangle-fill", info: "bi-info-circle-fill" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><div class="toast-msg">${escapeHtml(message)}</div>`;
  toastStack.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s ease, transform .3s ease";
    el.style.opacity = "0";
    el.style.transform = "translateX(16px)";
    setTimeout(() => el.remove(), 300);
  }, 4200);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

/* =========================================================
   Theme (desktop + mobile switches stay in sync)
   ========================================================= */
const themeToggle = document.getElementById("themeToggle");
const themeToggleMobile = document.getElementById("themeToggleMobile");

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("cf_theme", theme);
}

(function initTheme() {
  const saved = localStorage.getItem("cf_theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();

function toggleTheme() {
  const current = document.body.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}
themeToggle.onclick = toggleTheme;
if (themeToggleMobile) themeToggleMobile.onclick = toggleTheme;

/* =========================================================
   Open pickers
   ========================================================= */
chooseBtn.onclick = () => fileInput.click();
folderBtn.onclick = () => folderInput.click();
zipBtn.onclick = () => zipInput.click();
dropzone.onclick = () => fileInput.click();
dropzone.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } };

/* =========================================================
   Drag & drop
   ========================================================= */
["dragenter", "dragover"].forEach(evt => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add("drag-over"); });
});
["dragleave", "drop"].forEach(evt => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("drag-over"); });
});
dropzone.addEventListener("drop", (e) => {
  const dropped = [...(e.dataTransfer.files || [])];
  if (dropped.length) addFiles(dropped);
});

/* =========================================================
   Handle selection (picker inputs)
   ========================================================= */
fileInput.onchange = () => { addFiles([...fileInput.files]); fileInput.value = ""; };
folderInput.onchange = () => { addFiles([...folderInput.files]); folderInput.value = ""; };
zipInput.onchange = () => { addFiles([...zipInput.files]); zipInput.value = ""; };

function addFiles(newFiles) {
  const existingKeys = new Set(selectedFiles.map(f => (f.webkitRelativePath || f.name) + f.size));
  newFiles.forEach(f => {
    const key = (f.webkitRelativePath || f.name) + f.size;
    if (!existingKeys.has(key)) {
      selectedFiles.push(f);
      existingKeys.add(key);
    }
  });
  renderFiles();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFiles();
}

function getExtension(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function iconForExt(ext) {
  if (ext === ".zip") return "bi-file-earmark-zip-fill";
  if (ext === ".csv") return "bi-filetype-csv";
  if ([".xlsx", ".xlsm", ".xls", ".xlsb"].includes(ext)) return "bi-file-earmark-spreadsheet-fill";
  return "bi-file-earmark-fill";
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* =========================================================
   Render file list + validation + sidebar batch summary
   ========================================================= */
function renderFiles() {
  updateBatchSummary();

  if (selectedFiles.length === 0) {
    fileList.innerHTML = "";
    fileList.classList.add("is-empty");
    validationMsg.classList.remove("show");
    return;
  }
  fileList.classList.remove("is-empty");

  let invalidCount = 0;
  let html = "";

  selectedFiles.forEach((file, idx) => {
    const displayName = file.webkitRelativePath || file.name;
    const ext = getExtension(file.name);
    const valid = SUPPORTED_EXTENSIONS.includes(ext);
    if (!valid) invalidCount++;

    html += `
      <div class="file-row ${valid ? "" : "is-invalid"}">
        <i class="bi ${iconForExt(ext)} file-icon"></i>
        <span class="file-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</span>
        <span class="file-size">${formatSize(file.size)}</span>
        <button class="file-remove" type="button" onclick="removeFile(${idx})" aria-label="Remove file">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>`;
  });

  fileList.innerHTML = html;

  if (invalidCount > 0) {
    validationMsgText.textContent = `${invalidCount} file${invalidCount > 1 ? "s" : ""} may not be supported (expected .xlsx, .xls, .xlsm, .xlsb, .csv or .zip).`;
    validationMsg.classList.add("show");
  } else {
    validationMsg.classList.remove("show");
  }
}

function updateBatchSummary() {
  const totalBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0);
  batchSummary.textContent = `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} \u00b7 ${formatSize(totalBytes)}`;
  const pct = Math.min(100, Math.round((selectedFiles.length / BATCH_FILL_CAP) * 100));
  batchFill.style.width = pct + "%";
}

/* =========================================================
   Upload & Start  (endpoints unchanged: /upload, /start, /progress, /download)
   ========================================================= */
uploadBtn.onclick = async function () {

  if (selectedFiles.length === 0) {
    toast("Please select at least one file.", "warn");
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Uploading...`;

  let formData = new FormData();
  selectedFiles.forEach(file => formData.append("files", file));

  let uploadResult;
  try {
    const uploadResponse = await fetch("/upload", { method: "POST", body: formData });
    uploadResult = await uploadResponse.json();
  } catch (err) {
    toast("Upload failed: could not reach server.", "error");
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = `<i class="bi bi-play-fill"></i> Start Processing`;
    return;
  }

  if (!uploadResult.success) {
    toast(uploadResult.message || "Upload failed.", "error");
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = `<i class="bi bi-play-fill"></i> Start Processing`;
    return;
  }

  uploadBtn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Starting...`;

  await fetch("/start", { method: "POST" });

  uploadBtn.innerHTML = `<i class="bi bi-cpu-fill"></i> Processing...`;
  downloadBtn.style.display = "none";
  downloadBtn.innerHTML = "";
  clearedLogCount = 0;
  lastRowsProcessed = 0;
  toast("Processing started.", "success");

  startPolling();
};

/* =========================================================
   Progress polling
   ========================================================= */
let timer = null;

function startPolling() {
  if (timer) clearInterval(timer);
  timer = setInterval(loadProgress, 1000);
}

function flashValue(el) {
  el.classList.remove("just-updated");
  void el.offsetWidth;
  el.classList.add("just-updated");
}

function elapsedToSeconds(str) {
  if (!str) return 0;
  const parts = str.split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

async function loadProgress() {

  let p;
  try {
    const response = await fetch("/progress");
    p = await response.json();
  } catch (err) {
    return;
  }

  document.getElementById("status").innerHTML = p.message || p.status || "";
  document.getElementById("currentFile").innerHTML = p.current_file || "No file in progress";

  document.getElementById("processedFiles").innerHTML = `${p.processed_files} / ${p.total_files}`;
  document.getElementById("processedFilesStat").innerHTML = `${p.processed_files} / ${p.total_files}`;

  const rowsEl = document.getElementById("rows");
  const uniqueEl = document.getElementById("unique");
  const duplicatesEl = document.getElementById("duplicates");

  if (Number(p.rows_processed) !== lastRowsProcessed) {
    flashValue(rowsEl);
    lastRowsProcessed = Number(p.rows_processed) || 0;
  }
  rowsEl.innerHTML = p.rows_processed;
  uniqueEl.innerHTML = p.unique_contacts;
  duplicatesEl.innerHTML = p.duplicates_removed;

  document.getElementById("elapsed").innerHTML = p.elapsed;

  const elapsedSec = elapsedToSeconds(p.elapsed);
  const speedEl = document.getElementById("speedStat");
  const etaEl = document.getElementById("etaStat");

  if (elapsedSec > 0 && p.rows_processed > 0) {
    speedEl.innerHTML = `${Math.round(p.rows_processed / elapsedSec)} rows/s`;
  } else {
    speedEl.innerHTML = "&mdash;";
  }

  if (p.processed_files > 0 && p.total_files > p.processed_files && elapsedSec > 0) {
    const perFile = elapsedSec / p.processed_files;
    const remaining = Math.max(0, Math.round(perFile * (p.total_files - p.processed_files)));
    const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60), s = remaining % 60;
    etaEl.innerHTML = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  } else if ((p.status || "").toLowerCase() === "completed") {
    etaEl.innerHTML = "00:00:00";
  } else {
    etaEl.innerHTML = "&mdash;";
  }

  let progress = p.progress || 0;
  document.getElementById("progressBar").style.width = progress + "%";
  document.getElementById("progressPct").innerHTML = progress + "%";

  renderLogs(p.logs || []);

  if ((p.status || "").toLowerCase() === "completed") {
    const files = (p.output_files && p.output_files.length)
      ? p.output_files
      : (p.output_file ? [p.output_file] : []);
    renderDownloads(files);

    uploadBtn.disabled = false;
    uploadBtn.innerHTML = `<i class="bi bi-play-fill"></i> Start Processing`;
    clearInterval(timer);

    if (files.length > 1) {
      toast(`Processing completed — output split into ${files.length} parts.`, "success");
    } else {
      toast("Processing completed. Output is ready to download.", "success");
    }
  }

  if ((p.status || "").toLowerCase() === "failed") {
    clearInterval(timer);
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = `<i class="bi bi-play-fill"></i> Start Processing`;
    toast(p.message || "Processing failed.", "error");
  }
}

/* =========================================================
   Console / logs
   ========================================================= */
function classifyLog(text) {
  const t = text.toLowerCase();
  if (t.includes("fail") || t.includes("error")) return "error";
  if (t.includes("skip") || t.includes("warn")) return "warn";
  if (t.includes("finish") || t.includes("complet") || t.includes("success")) return "success";
  return "info";
}

function iconForLevel(level) {
  if (level === "success") return "bi-check-circle-fill";
  if (level === "warn") return "bi-exclamation-triangle-fill";
  if (level === "error") return "bi-x-circle-fill";
  return "bi-info-circle-fill";
}

function nowTime() {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

const logTimestamps = new Map();

function renderLogs(fullLogs) {
  const visible = fullLogs.slice(clearedLogCount);

  if (visible.length === 0) {
    logsEl.innerHTML = `<div class="console-empty">Logs will appear here once processing starts&hellip;</div>`;
    return;
  }

  let html = "";
  visible.forEach((line, i) => {
    const idx = clearedLogCount + i;
    if (!logTimestamps.has(idx)) logTimestamps.set(idx, nowTime());
    const level = classifyLog(line);
    html += `
      <div class="log-line ${level}">
        <span class="log-time">${logTimestamps.get(idx)}</span>
        <i class="bi ${iconForLevel(level)}"></i>
        <span class="log-text">${escapeHtml(line)}</span>
      </div>`;
  });

  logsEl.innerHTML = html;

  if (autoScrollEnabled && !userScrolledUp) {
    logsEl.scrollTop = logsEl.scrollHeight;
  }
}

logsEl.addEventListener("scroll", () => {
  const nearBottom = logsEl.scrollHeight - logsEl.scrollTop - logsEl.clientHeight < 24;
  userScrolledUp = !nearBottom;
});

autoScrollBtn.onclick = () => {
  autoScrollEnabled = !autoScrollEnabled;
  autoScrollBtn.classList.toggle("is-active", autoScrollEnabled);
  autoScrollBtn.classList.toggle("is-muted", !autoScrollEnabled);
  autoScrollBtn.title = autoScrollEnabled ? "Auto-scroll: on" : "Auto-scroll: off";
  if (autoScrollEnabled) {
    userScrolledUp = false;
    logsEl.scrollTop = logsEl.scrollHeight;
  }
};

clearLogsBtn.onclick = () => {
  const rows = logsEl.querySelectorAll(".log-line").length;
  clearedLogCount += rows;
  logsEl.innerHTML = `<div class="console-empty">Logs cleared. New activity will appear here&hellip;</div>`;
  toast("Console cleared.", "info");
};

copyLogsBtn.onclick = async () => {
  const lines = [...logsEl.querySelectorAll(".log-line")].map(row => row.textContent.trim());
  if (lines.length === 0) {
    toast("No logs to copy.", "warn");
    return;
  }
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    toast("Logs copied to clipboard.", "success");
  } catch (err) {
    toast("Couldn't copy logs — clipboard permission denied.", "error");
  }
};

/* =========================================================
   Download (supports one or many output parts)
   ========================================================= */
function fileBaseName(path) {
  return String(path).split(/[\\/]/).pop();
}

function renderDownloads(files) {
  if (!files || files.length === 0) {
    downloadBtn.innerHTML = "";
    downloadBtn.style.display = "none";
    return;
  }

  let html = "";
  files.forEach((path, i) => {
    const name = fileBaseName(path);
    const label = files.length > 1 ? `Download Part ${i + 1} of ${files.length}` : "Download Output";
    html += `
      <a class="btn btn-block" href="/download?file=${encodeURIComponent(name)}" download>
        <i class="bi bi-download"></i> ${label}<span class="file-tag">${escapeHtml(name)}</span>
      </a>`;
  });

  downloadBtn.innerHTML = html;
  downloadBtn.style.display = "flex";
}

/* =========================================================
   Init
   ========================================================= */
renderFiles();
