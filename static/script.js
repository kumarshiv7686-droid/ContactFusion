let selectedFiles = [];
console.log("SCRIPT BUILD: no-autodownload-fix-001");
// ----------------------------------------------------
// Buttons
// ----------------------------------------------------

const chooseBtn = document.getElementById("chooseBtn");
const folderBtn = document.getElementById("folderBtn");
const zipBtn = document.getElementById("zipBtn");

const fileInput = document.getElementById("fileInput");
const folderInput = document.getElementById("folderInput");
const zipInput = document.getElementById("zipInput");

const uploadBtn = document.getElementById("uploadBtn");
const downloadBtn = document.getElementById("downloadBtn");

const fileList = document.getElementById("fileList");

// ----------------------------------------------------
// Open Pickers
// ----------------------------------------------------

chooseBtn.onclick = () => fileInput.click();

folderBtn.onclick = () => folderInput.click();

zipBtn.onclick = () => zipInput.click();

// ----------------------------------------------------
// Handle Selection
// ----------------------------------------------------

fileInput.onchange = () => {

    selectedFiles = [...fileInput.files];

    renderFiles();

};

folderInput.onchange = () => {

    selectedFiles = [...folderInput.files];

    renderFiles();

};

zipInput.onchange = () => {

    selectedFiles = [...zipInput.files];

    renderFiles();

};

// ----------------------------------------------------
// Render File List
// ----------------------------------------------------

function renderFiles() {

    if (selectedFiles.length === 0) {

        fileList.innerHTML = "No Files Selected";

        return;

    }

    let html = "";

    selectedFiles.forEach(file => {

        html += `
        <div>
            📄 ${file.webkitRelativePath || file.name}
        </div>
        `;

    });

    fileList.innerHTML = html;

}

// ----------------------------------------------------
// Upload & Start
// ----------------------------------------------------

uploadBtn.onclick = async function () {

    if (selectedFiles.length === 0) {

        alert("Please select files.");

        return;

    }

    uploadBtn.disabled = true;

    uploadBtn.innerHTML = "Uploading...";

    let formData = new FormData();

    selectedFiles.forEach(file => {

        formData.append("files", file);

    });

    const uploadResponse = await fetch("/upload", {

        method: "POST",

        body: formData

    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.success) {

        alert(uploadResult.message);

        uploadBtn.disabled = false;

        uploadBtn.innerHTML = "▶ Start Processing";

        return;

    }

    uploadBtn.innerHTML = "Starting...";

    await fetch("/start", {

        method: "POST"

    });

    uploadBtn.innerHTML = "Processing...";

    startPolling();

};

// ----------------------------------------------------
// Progress Polling
// ----------------------------------------------------

let timer = null;

function startPolling() {

    if (timer)
        clearInterval(timer);

    timer = setInterval(loadProgress, 1000);

}

// ----------------------------------------------------
// Load Progress
// ----------------------------------------------------

async function loadProgress() {

    const response = await fetch("/progress");

    const p = await response.json();

    document.getElementById("status").innerHTML = p.status || "";

    document.getElementById("currentFile").innerHTML = p.current_file || "-";

    document.getElementById("processedFiles").innerHTML =
        `${p.processed_files} / ${p.total_files}`;

    document.getElementById("rows").innerHTML =
        p.rows_processed;

    document.getElementById("unique").innerHTML =
        p.unique_contacts;

    document.getElementById("duplicates").innerHTML =
        p.duplicates_removed;

    document.getElementById("elapsed").innerHTML =
        p.elapsed;

    let progress = p.progress || 0;

    let bar = document.getElementById("progressBar");

    bar.style.width = progress + "%";

    bar.innerHTML = progress + "%";

    // Logs

    let logs = "";

    if (p.logs) {

        p.logs.forEach(log => {

            logs += log + "<br>";

        });

    }

    document.getElementById("logs").innerHTML = logs;

    let logDiv = document.getElementById("logs");

    logDiv.scrollTop = logDiv.scrollHeight;

    // Completed

    if ((p.status || "").toLowerCase() === "completed") {

         console.log("COMPLETED BLOCK");
        const btn = document.getElementById("downloadBtn");

        console.log(btn);
        btn.style.display = "block";

        btn.style.background = "green";
        btn.innerHTML = "DOWNLOAD NOW";

        uploadBtn.disabled = false;
        uploadBtn.innerHTML = "▶ Start Processing";
        clearInterval(timer);
    }

    // Failed

    if ((p.status || "").toLowerCase() === "failed") {

        clearInterval(timer);

        uploadBtn.disabled = false;

        uploadBtn.innerHTML = "▶ Start Processing";

        alert(p.message);

    }

}

// ----------------------------------------------------
// Download
// ----------------------------------------------------

downloadBtn.onclick = function () {

    window.location = "/download";

};