// Wait for the page to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuration ---
    
    // !!! WARNING: HARD-CODED API KEY !!!
    // This is a MAJOR security risk for a public website.
    // Anyone can view your page source and steal this key.
    // Use this for personal, local-only testing.
    // For production, this call MUST be made from a secure backend server.
    const API_KEY = "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";
    
    const MODEL = "llama-3.1-8b-instant";
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";

    // --- Element References ---
    const modeSelect = document.getElementById("mode-select");
    const btnRun = document.getElementById("btn-run");
    const btnCopy = document.getElementById("btn-copy");
    const btnSave = document.getElementById("btn-save");
    const appearanceSelect = document.getElementById("appearance-select");
    
    const txtInput = document.getElementById("txt-input");
    const txtOutput = document.getElementById("txt-output");
    
    const statusLabel = document.getElementById("status-label");
    const loader = document.getElementById("loader");

    // --- Event Listeners ---
    btnRun.addEventListener("click", onRun);
    btnCopy.addEventListener("click", copyOutput);
    btnSave.addEventListener("click", saveOutput);
    appearanceSelect.addEventListener("change", onAppearanceChange);

    // --- Main Actions ---

    /**
     * Main function to run the AI processing
     */
    async function onRun() {
        const text = txtInput.value.trim();
        if (!text) {
            alert("Please paste or type your text first.");
            return;
        }

        const mode = modeSelect.value;
        setBusy(true, `Processing (${mode})…`);

        try {
            const result = await callAi(text, mode);
            txtOutput.value = result;
            
            const stamp = new Date().toLocaleString();
            setBusy(false, `Done (${mode}) at ${stamp}.`);
            
        } catch (e) {
            console.error(e);
            setBusy(false, "Error.");
            alert("An error occurred: " + e.message);
        }
    }

    /**
     * Makes the actual API call to Groq
     */
    async function callAi(prompt, mode) {
        const systemMap = {
            "Enhance Text": "You are a world-class writing assistant. Improve clarity, grammar, flow, and concision for general text. Preserve meaning and technical details. Return only the improved text.",
            "Polish Email": "You are an expert email writing assistant. Rewrite drafts into clear, professional emails with correct grammar and tone. Preserve meaning. Return only the final email body (no explanations).",
            "Grammar Fix (Preserve Structure)": "You are a precise grammar corrector. Return the text with the EXACT SAME STRUCTURE, order, and line breaks as the input. Do NOT add or remove sentences or lines. Do NOT rephrase beyond strict grammar, spelling, capitalization, and punctuation fixes. Keep headings, list markers, folder names/paths, quotes, and code blocks EXACTLY as they are, unless a minimal grammar/punctuation correction is needed. No summaries, no explanations."
        };
        
        const userPrefixMap = {
            "Enhance Text": "TASK: Improve the following text for clarity, grammar, and flow. Keep the original meaning and technical detail.\n\nTEXT:\n",
            "Polish Email": "TASK: Rewrite the following email draft into a clean, grammatically correct, professional email. Keep the meaning and improve clarity.\n\nDRAFT:\n",
            "Grammar Fix (Preserve Structure)": "TASK: Fix only grammar, spelling, capitalization, and punctuation while preserving the EXACT structure and line breaks. Do not add, remove, or reorder lines. Return ONLY the corrected text.\n\nTEXT:\n"
        };

        const systemMsg = systemMap[mode];
        const userMsg = userPrefixMap[mode] + prompt;
        const temp = (mode === "Grammar Fix (Preserve Structure)") ? 0.1 : 0.3;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { "role": "system", "content": systemMsg },
                    { "role": "user", "content": userMsg }
                ],
                temperature: temp,
                max_tokens: 8000 // Increased from your 800
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.statusText} - ${errorData.error.message}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // --- Utility Functions ---

    /**
     * Copies the output text to the clipboard
     */
    function copyOutput() {
        const text = txtOutput.value.trim();
        if (!text) {
            alert("Nothing to copy. Output is empty.");
            return;
        }
        navigator.clipboard.writeText(text)
            .then(() => {
                statusLabel.textContent = "Output copied to clipboard.";
            })
            .catch(err => {
                alert("Failed to copy text.");
            });
    }

    /**
     * Saves the output text to a .txt file
     */
    function saveOutput() {
        const text = txtOutput.value.trim();
        if (!text) {
            alert("Nothing to save. Output is empty.");
            return;
        }
        
        try {
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "output.txt";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            statusLabel.textContent = "Output saved as output.txt";
        } catch (e) {
            alert("Failed to save file: " + e.message);
        }
    }

    /**
     * Toggles the UI between light and dark modes
     */
    function onAppearanceChange() {
        if (appearanceSelect.value === "light") {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
        } else {
            document.body.classList.add("dark-mode");
            document.body.classList.remove("light-mode");
        }
    }

    /**
     * Updates the UI state (buttons, loader, status)
     */
    function setBusy(busy, msg = "") {
        if (busy) {
            btnRun.disabled = true;
            btnCopy.disabled = true;
            btnSave.disabled = true;
            loader.hidden = false;
        } else {
            btnRun.disabled = false;
            btnCopy.disabled = false;
            btnSave.disabled = false;
            loader.hidden = true;
        }
        statusLabel.textContent = msg || "Ready.";
    }


});






