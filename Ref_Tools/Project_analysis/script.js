// Import the pdf.js module
import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf_viewer.min.css";

// Set the worker script path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

let project_data = [];

// === DOM Elements ===
const el = {
    projectName: document.getElementById("project-name"),
    srcLang: document.getElementById("source-language"),
    tgtLang: document.getElementById("target-language"),
    application: document.getElementById("application"),
    task: document.getElementById("task"),
    effortEstimate: document.getElementById("effort-estimate"),
    hideExtension: document.getElementById("hide-extension"),
    folderUpload: document.getElementById("folder-upload"),
    analyzeButton: document.getElementById("analyze-button"),
    // === THIS LINE CONNECTS THE BUTTON ===
    selectProjectFolderButton: document.getElementById("select-project-folder-button"),
    tableBody: document.getElementById("table-body"),
    summaryBar: document.getElementById("summary-bar"),
    loadingSpinner: document.getElementById("loading-spinner"),
    statusText: document.getElementById("status-text"),
    applySrcLang: document.getElementById("apply-src-lang"),
    applyTgtLang: document.getElementById("apply-tgt-lang"),
    applyApp: document.getElementById("apply-app"),
    applyTask: document.getElementById("apply-task"),
    resetEfforts: document.getElementById("reset-efforts"),
    exportExcel: document.getElementById("export-excel"),
    exportTsv: document.getElementById("export-tsv"),
};

// === Event Listeners ===
document.addEventListener("DOMContentLoaded", () => {
    // Both buttons now trigger the same hidden folder upload input
    el.analyzeButton.addEventListener("click", () => el.folderUpload.click());
    // === THIS LINE MAKES THE BUTTON WORK ===
    el.selectProjectFolderButton.addEventListener("click", () => el.folderUpload.click());
    
    el.folderUpload.addEventListener("change", selectPdfFolderAndAnalyze);
    
    el.applySrcLang.addEventListener("click", () => applyFieldToAll("source_language", el.srcLang.value));
    el.applyTgtLang.addEventListener("click", () => applyFieldToAll("language", el.tgtLang.value));
    el.applyApp.addEventListener("click", () => applyFieldToAll("application", el.application.value));
    el.applyTask.addEventListener("click", () => applyFieldToAll("task", el.task.value));
    
    el.resetEfforts.addEventListener("click", resetAllEfforts);
    el.projectName.addEventListener("input", updateProjectName);
    el.hideExtension.addEventListener("change", renderTable);
    
    el.exportExcel.addEventListener("click", () => exportData("excel"));
    el.exportTsv.addEventListener("click", () => exportData("tsv"));

    // Add listeners to the table body for event delegation
    el.tableBody.addEventListener("change", handleTableEdit);
    el.tableBody.addEventListener("focusout", handleTableEdit);
});

// === Core Logic ===

async function selectPdfFolderAndAnalyze(event) {
    const files = event.target.files;
    if (!files.length) return;

    // Filter for PDF files
    const pdfFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith(".pdf"));
    if (!pdfFiles.length) {
        alert("No PDF files found.");
        return;
    }

    // Auto-set project name from folder path
    if (!el.projectName.value && pdfFiles[0].webkitRelativePath) {
        el.projectName.value = pdfFiles[0].webkitRelativePath.split("/")[0];
    }

    el.loadingSpinner.hidden = false;
    el.statusText.textContent = `Analyzing 0 of ${pdfFiles.length} PDFs...`;
    
    project_data = [];
    const src_lang = el.srcLang.value.trim() || "English";
    const tgt_lang = el.tgtLang.value.trim() || "English";
    const proj = el.projectName.value.trim();
    const app = el.application.value;
    const task = el.task.value;

    let processedCount = 0;
    const allPromises = pdfFiles.map(file => 
        checkPdfInfo(file)
            .then(pageCount => {
                project_data.push({
                    effort: 0,
                    invoice: "",
                    project: proj,
                    file: file.name,
                    application: app,
                    task: task,
                    file_type: "Informational",
                    source_language: src_lang,
                    language: tgt_lang,
                    page_count: pageCount
                });
            })
            .catch(err => {
                console.error(`Failed to process ${file.name}:`, err);
                project_data.push({
                    effort: 0,
                    invoice: "",
                    project: proj,
                    file: file.name,
                    application: app,
                    task: task,
                    file_type: "Informational",
                    source_language: src_lang,
                    language: tgt_lang,
                    page_count: "Error"
                });
            })
            .finally(() => {
                processedCount++;
                el.statusText.textContent = `Analyzing ${processedCount} of ${pdfFiles.length} PDFs...`;
            })
    );

    await Promise.all(allPromises);

    el.loadingSpinner.hidden = true;
    el.statusText.textContent = `Analysis complete. ${project_data.length} files found.`;
    
    // Sort data alphabetically by filename
    project_data.sort((a, b) => a.file.localeCompare(b.file));
    
    renderTable();
}

/**
 * Reads a PDF file object and returns its page count.
 */
async function checkPdfInfo(file) {
    try {
        const fileReader = new FileReader();
        const arrayBuffer = await new Promise((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(file);
        });

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        return pdf.numPages;
    } catch (err) {
        console.error(`Error reading PDF ${file.name}:`, err);
        return "Error";
    }
}

/**
 * Re-draws the entire table based on the global project_data.
 */
function renderTable() {
    el.tableBody.innerHTML = ""; // Clear existing table

    let totalPages = 0;
    let totalEffort = 0;
    
    try {
        totalPages = project_data.reduce((sum, item) => {
            const pages = parseInt(item.page_count, 10);
            return sum + (isNaN(pages) ? 0 : pages);
        }, 0);
    } catch (e) {
        console.error("Error calculating total pages", e);
    }
    
    const effortEstimate = safeFloat(el.effortEstimate.value);

    project_data.forEach((item, index) => {
        const pageCount = parseInt(item.page_count, 10);
        let autoEffort = 0;
        if (!isNaN(pageCount) && totalPages > 0) {
            autoEffort = round((effortEstimate / totalPages) * pageCount, 2);
        }

        if (!item.effort || item.effort === 0) {
            item.effort = autoEffort;
        }

        const tr = document.createElement("tr");
        tr.setAttribute("data-index", index);

        // 0. Effort
        tr.innerHTML += `
            <td>
                <input type="number" data-field="effort" value="${item.effort}" class="cell-input">
            </td>`;
        
        // 1. Invoice
        tr.innerHTML += `
            <td>
                <input type="text" data-field="invoice" value="${item.invoice || ''}" class="cell-input">
            </td>`;
        
        // 2. Project
        tr.innerHTML += `<td>${item.project}</td>`;

        // 3. File Name
        let filename_display = item.file;
        if (el.hideExtension.checked && filename_display.toLowerCase().endsWith(".pdf")) {
            filename_display = filename_display.slice(0, -4);
        }
        tr.innerHTML += `<td>${filename_display}</td>`;

        // 4. Application
        tr.innerHTML += `
            <td>
                <select data-field="application" class="cell-input">
                    ${["Word", "INDD", "Excel", "PPT", "FM", "PSD", "AI", "Other"].map(opt => 
                        `<option ${item.application === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('')}
                </select>
            </td>`;

        // 5. Task
        tr.innerHTML += `
            <td>
                <input type="text" data-field="task" value="${item.task}" class="cell-input">
            </td>`;

        // 6. File Type
        tr.innerHTML += `
            <td>
                <select data-field="file_type" class="cell-input">
                    ${["Informational", "Official", "NA"].map(opt => 
                        `<option ${item.file_type === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('')}
                </select>
            </td>`;

        // 7. Source Language
        tr.innerHTML += `
            <td>
                <input type="text" data-field="source_language" value="${item.source_language}" class="cell-input">
            </td>`;
        
        // 8. Target Language
        tr.innerHTML += `
            <td>
                <input type="text" data-field="language" value="${item.language}" class="cell-input">
            </td>`;

        // 9. Page Count
        tr.innerHTML += `<td>${item.page_count}</td>`;

        el.tableBody.appendChild(tr);
        totalEffort += safeFloat(item.effort);
    });

    // Update summary
    el.summaryBar.textContent = `Total Files: ${project_data.length} | Total Pages: ${totalPages} | Total Effort: ${round(totalEffort, 2)} hrs`;
}

/**
 * Handles clicks and changes on table inputs/selects.
 */
function handleTableEdit(e) {
    const target = e.target;
    if (target.classList.contains("cell-input")) {
        const tr = target.closest("tr");
        const index = parseInt(tr.dataset.index, 10);
        const field = target.dataset.field;
        let value = target.value;

        if (field === "effort") {
            value = safeFloat(value);
        }
        
        updateValue(index, field, value);
        
        // Recalculate totals if effort changed
        if (field === "effort" && e.type === 'focusout') {
            renderTable(); // This is simple, but re-renders everything.
        }
    }
}

// === Helper Functions ===

function updateValue(index, field, value) {
    if (index >= 0 && index < project_data.length) {
        project_data[index][field] = value;
    }
}

function applyFieldToAll(field, value) {
    project_data.forEach(item => {
        item[field] = value;
    });
    renderTable();
}

function updateProjectName() {
    const name = el.projectName.value.trim();
    project_data.forEach(item => {
        item["project"] = name;
    });
    renderTable();
}

function resetAllEfforts() {
    let totalPages = 0;
    try {
        totalPages = project_data.reduce((sum, item) => {
            const pages = parseInt(item.page_count, 10);
            return sum + (isNaN(pages) ? 0 : pages);
        }, 0);
    } catch (e) {}

    const effortEstimate = safeFloat(el.effortEstimate.value);

    project_data.forEach(item => {
        const pageCount = parseInt(item.page_count, 10);
        let autoEffort = 0;
        if (!isNaN(pageCount) && totalPages > 0) {
            autoEffort = round((effortEstimate / totalPages) * pageCount, 2);
        }
        item.effort = autoEffort;
    });
    renderTable();
}

function safeFloat(value) {
    try {
        const f = parseFloat(value);
        return isNaN(f) ? 0 : f;
    } catch (e) {
        return 0;
    }
}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

// === Export Functions ===

function exportData(format) {
    if (!project_data.length) {
        alert("No data to export. Analyze a PDF folder first.");
        return;
    }

    const columns = [
        "Effort", "Invoice", "Project", "File Name", "Application",
        "Task", "File Type", "Source Language", "Target Language", "Page Count"
    ];
    
    const default_base = el.projectName.value.trim() || "Project";
    const hideExt = el.hideExtension.checked;

    // Get data rows
    const data = project_data.map(item => {
        let filename = item.file;
        if (format === 'excel' && hideExt && filename.toLowerCase().endsWith(".pdf")) {
            filename = filename.slice(0, -4);
        } else if (format === 'tsv') {
            // Original script did not hide extension for tsv, so we replicate
            filename = item.file;
        }

        return [
            item.effort || "",
            item.invoice || "",
            item.project || "",
            filename,
            item.application || "",
            item.task || "",
            item.file_type || "",
            item.source_language || "",
            item.language || "",
            item.page_count || ""
        ];
    });
    
    // Add header row
    data.unshift(columns);

    if (format === "excel") {
        const default_name = `${default_base}_PAR.xlsx`;
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "ProjectData");
        XLSX.writeFile(wb, default_name);

    } else { // TSV
        const default_name = `${default_base}_PAR.tsv`;
        const tsvContent = data.map(row => row.join("\t")).join("\n");
        
        const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
        downloadBlob(blob, default_name);
    }
}

function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}