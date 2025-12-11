
// State Management
let state = {
    currentTab: "analyzer",
    currentFilter: "all",
};

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    checkAuth();
    renderHistory();
    renderJobs();
});

async function checkAuth() {
    try {
        await axios.get("http://localhost:3000/api/resume/auth", { withCredentials: true });
    } catch (err) {
        window.location.href = "/index.html";
        console.log(err);
    }
}

// Tab Switching
function switchTab(tab) {
    state.currentTab = tab;
    document.getElementById("analyzerSection").className = tab === "analyzer" ? "visible-section" : "hidden-section";
    document.getElementById("trackerSection").className = tab === "tracker" ? "visible-section" : "hidden-section";
    document.getElementById("analyzerTab").style.borderColor = tab === "analyzer" ? "var(--primary)" : "transparent";
    document.getElementById("analyzerTab").style.color = tab === "analyzer" ? "var(--primary)" : "var(--secondary)";
    document.getElementById("trackerTab").style.borderColor = tab === "tracker" ? "var(--primary)" : "transparent";
    document.getElementById("trackerTab").style.color = tab === "tracker" ? "var(--primary)" : "var(--secondary)";
}

// Resume Analysis
async function analyzeResume(e) {
    e.preventDefault();
    const resumeText = document.getElementById("resumeInput").value.trim();
    const errorMsg = document.getElementById("errorMsg");
    const errorText = document.getElementById("errorText");
    if (!resumeText) {
        errorText.textContent = "Please paste your resume text";
        errorMsg.classList.remove("hidden");
        return;
    }
    if (resumeText.length < 50) {
        errorText.textContent = "Resume text must be at least 50 characters";
        errorMsg.classList.remove("hidden");
        return;
    }
    errorMsg.classList.add("hidden");
    document.getElementById("analyzeBtn").disabled = true;
    document.getElementById("analyzeBtn").innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>Analyzing...';
    try {
        const res = await axios.post('http://localhost:3000/api/resume/analyze', { resumeText });
        const aiData = res.data.newResume;
        setTimeout(() => {
            const mockResponse = {
                aiScore: aiData.aiScore,
                atsScore: aiData.atsScore,
                suggestions: aiData.suggestions,
                aiImprovedText: aiData.aiImprovedText,
                createdAt: aiData.createdAt,
            };
            displayResults(mockResponse);
            renderHistory();
            document.getElementById("analyzeBtn").disabled = false;
            document.getElementById("analyzeBtn").innerHTML = '<i class="fas fa-magic mr-2"></i>Analyze Resume';
        }, 5000);
    } catch (err) {
        Swal.fire({
            title: "Error",
            text: "Internal Server Error",
            icon: "error",
            showConfirmButton: false,
            timer: 2000
        });
        console.log(err);
    }
}

function displayResults(data) {
    const overallDash = (data.aiScore / 100) * 283;
    const atsDash = (data.aiScore / 100) * 283;
    document.getElementById("scoreValue").textContent = data.aiScore;
    document.getElementById("atsScoreValue").textContent = data.atsScore;
    document.getElementById("overallCircle").setAttribute("stroke-dasharray", `${overallDash} 283`);
    document.getElementById("atsCircle").setAttribute("stroke-dasharray", `${atsDash} 283`);
    document.getElementById("scoreStatus").innerHTML = data.aiScore >= 80 ? '<i class="fas fa-check-circle mr-1"></i>Excellent' : '<i class="fas fa-alert mr-1"></i>Good';
    document.getElementById("atsStatus").innerHTML = data.atsScore >= 75 ? '<i class="fas fa-thumbs-up mr-1"></i>Optimized' : '<i class="fas fa-wrench mr-1"></i>Needs Work';
    const suggestionsHtml = data.suggestions.map((s, i) => `
                <li class="p-3 rounded-lg border-l-4 flex gap-3" style="background-color: var(--light-bg); border-color: var(--primary);">
                    <div class="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style="background-color: var(--primary);">${i + 1}</div>
                    <span style="color: var(--dark-text);">${s}</span>
                </li>
            `
        ).join("");
    document.getElementById("suggestionsContainer").innerHTML = suggestionsHtml;
    document.getElementById("grammarContainer").textContent = data.aiImprovedText;
    document.getElementById("analysisTime").textContent = `Analyzed on ${new Date(data.createdAt).toLocaleDateString()}`;
    document.getElementById("resultsSection").classList.remove("hidden-section");
    document.getElementById("resultsSection").classList.add("visible-section");
    setTimeout(() => document.getElementById("resultsSection").scrollIntoView({ behavior: "smooth" }), 100);
}

// Job Tracker
function toggleJobForm() {
    document.getElementById("jobForm").classList.toggle("hidden");
}

async function addJob(e) {
    e.preventDefault();
    const company = document.getElementById("jobCompany").value;
    const position = document.getElementById("jobPosition").value;
    const description = document.getElementById("jobDescription").value;
    const status = document.getElementById("jobStatus").value;
    const notes = document.getElementById("jobNotes").value;
    const link = document.getElementById("jobLink").value;
    try {
        if (company.trim() == "" || position.trim() == "" || description.trim() == "" || notes.trim() == "") {
            Swal.fire({
                icon: "error",
                title: "Missing Information!",
                text: "Please fill in all required fields"
            });
            return;
        }
        const job = {
            company,
            position,
            description,
            status,
            link,
            notes,
            appliedDate: Date.now(),
        };
        const res = await axios.post('http://localhost:3000/api/jobs', job);
        Swal.fire({
            title: "Job Published!",
            text: "Your Job has been published successfully",
            icon: "success",
            showConfirmButton: false,
            timer: 2000
        });
        document.getElementById("jobForm").reset();
        renderJobs();
        toggleJobForm();
    } catch (error) {
        console.log(error);
    }
}

async function deleteJob(id) {
    try {
        Swal.fire({
            title: "Are you sure?",
            text: "This Job will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                await axios.delete(`http://localhost:3000/api/jobs/${id}`);
                Swal.fire({
                    title: "Deleted!",
                    text: "The Job has been successfully deleted",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000
                });
                renderJobs();
            }
        });
    } catch (error) {
        console.log(error);
    }
}

function filterJobs(status) {
    state.currentFilter = status;
    document.querySelectorAll(".filterBtn").forEach((btn) => {
        btn.style.backgroundColor = btn.dataset.filter === status ? "var(--primary)" : "";
        btn.style.color = btn.dataset.filter === status ? "white" : "var(--secondary)";
        btn.style.borderColor = btn.dataset.filter === status ? "var(--primary)" : "var(--border)";
    });
    renderJobs();
}

async function renderJobs() {
    try {
        const res = await axios.get('http://localhost:3000/api/jobs');
        const filtered = state.currentFilter === "all" ? res.data : res.data.filter((j) => j.status === state.currentFilter);
        const html = filtered.length === 0 ? '<div class="bg-white rounded-lg border p-12 text-center" style="border-color: var(--border);"><i class="fas fa-briefcase text-4xl mb-4 block" style="color: var(--border);"></i><p class="font-medium" style="color: var(--secondary);">No jobs yet</p><p class="text-sm" style="color: var(--secondary);">Start tracking your applications</p></div>' : filtered.map((job) => getJobCard(job)).join("");
        document.getElementById("jobsList").innerHTML = html;
        document.getElementById("jobCount").textContent = res.data.length;
        document.getElementById("jobCount").style.display = res.data.length > 0 ? "inline-block" : "none";
    } catch (error) {
        console.log(error);
    }
}

function getJobCard(job) {
    const statusColors = {
        applied: { bg: "#e3f2fd", text: "#1976d2", icon: "fa-paper-plane" },
        interviewing: { bg: "#f3e5f5", text: "#000000ff", icon: "fa-phone" },
        offered: { bg: "var(--accent)", text: "white", icon: "fa-check-circle" },
        rejected: { bg: "#ffebee", text: "#c62828", icon: "fa-times-circle" },
    };
    const colors = statusColors[job.status];
    return `
                <div class="bg-white rounded-lg border p-6" style="border-color: var(--border);">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold mb-1" style="color: var(--dark-text);">${job.position}</h3>
                            <p style="color: var(--secondary);">${job.company}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm font-semibold border" style="background-color: ${colors.bg}; color: ${colors.text};">
                            <i class="fas ${colors.icon} mr-2"></i>${job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                    </div>
                    ${job.description ? `<p class="text-sm mb-3 p-3 rounded" style="color: var(--secondary); background-color: var(--light-bg);">${job.description}</p>` : ""}
                    ${job.notes ? `<p class="text-sm mb-3 p-3 rounded" style="color: var(--secondary); background-color: var(--light-bg);">${job.notes}</p>` : ""}
                    <div class="flex items-center justify-between text-sm" style="color: var(--secondary);">
                        <div class="flex items-center gap-4">
                            <span><i class="fas fa-calendar-alt mr-2" style="color: var(--primary);"></i>${new Date(job.appliedDate).toLocaleDateString()}</span>
                            ${job.link ? `<a href="${job.link}" target="_blank" rel="noopener noreferrer" style="color: var(--primary);" class="hover:underline"><i class="fas fa-external-link-alt mr-1"></i>View Posting</a>` : ""}
                        </div>
                        <div class="flex gap-2">
                            <button onclick="openEditModal('${job._id}', '${job.company}', '${job.position}', '${job.description}', '${job.status}', '${job.link}', '${job.notes}')" class="transition-colors" style="color: var(--primary);" title="Edit"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteJob('${job._id}')" class="transition-colors" style="color: #c62828;" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
}

function openEditModal(jobId, company, position, description, status, link, notes) {
    document.getElementById("jobId").value = jobId;
    document.getElementById("editJobCompany").value = company;
    document.getElementById("editJobPosition").value = position;
    document.getElementById("editJobDescription").value = description;
    document.getElementById("editJobStatus").value = status;
    document.getElementById("editJobLink").value = link || "";
    document.getElementById("editJobNotes").value = notes || "";
    document.getElementById("editJobModal").classList.remove("hidden");
}

function closeEditModal() {
    document.getElementById("editJobModal").classList.add("hidden");
    document.getElementById("editJobForm").reset();
}

async function saveJobEdit(e) {
    e.preventDefault();
    const jobId = document.getElementById("jobId").value;
    const company = document.getElementById("editJobCompany").value;
    const position = document.getElementById("editJobPosition").value;
    const description = document.getElementById("editJobDescription").value;
    const status = document.getElementById("editJobStatus").value;
    const link = document.getElementById("editJobLink").value;
    const notes = document.getElementById("editJobNotes").value;
    try {
        if (company.trim() == "" || position.trim() == "" || description.trim() == "" || notes.trim() == "") {
            Swal.fire({
                icon: "error",
                title: "Missing Information!",
                text: "Please fill in all required fields"
            });
            return;
        }
        await axios.put(`http://localhost:3000/api/jobs/${jobId}`, { company, position, description, status, link, notes });
        Swal.fire({
            title: "Updated Successfully",
            text: "Your changes have been saved",
            icon: "success",
            showConfirmButton: false,
            timer: 2000
        });
        closeEditModal();
        renderJobs();
    } catch (error) {
        console.log(error);
    }
}

// History Management
function toggleHistory() {
    document.getElementById("historySidebar").classList.toggle("hidden", window.innerWidth < 768);
}

async function renderHistory() {
    try {
        const res = await axios.get('http://localhost:3000/api/resume/', { withCredentials: true });
        document.getElementById("historyTotal").textContent = res.data.length;
        const html = res.data.length === 0
                ? '<div class="text-center py-12" style="color: var(--secondary);"><i class="fas fa-inbox text-4xl mb-3 block opacity-30"></i><p class="text-sm">No analyses yet</p><p class="text-xs mt-1">Analyze your first resume to see it here</p></div>'
                : res.data.map((item) => `
                <div class="p-4 rounded-lg border cursor-pointer transition-colors" style="background-color: var(--light-bg); border-color: var(--border);">
                    <div onclick="viewHistory('${item._id}')" class="mb-2">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-semibold text-sm" style="color: var(--dark-text);">Score: ${item.aiScore}/100</span>
                            <span class="text-xs font-semibold px-2 py-1 rounded text-white" style="background-color: ${item.aiScore >= 80 ? "var(--accent)" : "#fbc02d"};">${item.aiScore >= 80 ? "Great" : "Good"}</span>
                        </div>
                        <p class="text-xs" style="color: var(--secondary);">${item.aiImprovedText.substring(0, 150) + "..."}</p>
                        <p class="text-xs mt-2" style="color: var(--secondary);">${new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onclick="deleteHistory('${item._id}')" class="w-full mt-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded font-medium transition-colors">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            `).join("");
        document.getElementById("historyContent").innerHTML = html;
        document.getElementById("historyClearBtn").classList.toggle("hidden", res.data.length === 0);
    } catch (err) {
        console.log(err);
    }
}

async function viewHistory(id) {
    try {
        const res = await axios.get('http://localhost:3000/api/resume/', { withCredentials: true });
        const item = res.data.find((h) => h._id === id);
        if (item) {
            document.getElementById("resumeInput").value = item.originalText;
            displayResults(item);
            switchTab("analyzer");
        }
    } catch (err) {
        console.log(err);
    }
}

function deleteHistory(id) {
    try {
        Swal.fire({
            title: "Are you sure?",
            text: "This Resume will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                await axios.delete(`http://localhost:3000/api/resume/deleteResume/${id}`);
                Swal.fire({
                    title: "Deleted!",
                    text: "The Resume has been successfully deleted",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000
                });
                renderHistory();
            }
        });
    } catch (error) {
        console.log(error);
    }
}

function clearAllHistory() {
    try {
        Swal.fire({
            title: "Clear All History?",
            text: "All your resume analysis history will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await axios.delete('http://localhost:3000/api/resume/clearAllHistory', { withCredentials: true });
                Swal.fire({
                    title: "History Cleared!",
                    text: "Your resume history has been successfully deleted",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000
                });
                renderHistory();
            }
        });
    } catch (error) {
        console.log(error);
    }
}

const logout = async () => {
    Swal.fire({
        title: "Logged Out!",
        text: "You have been successfully logged out",
        icon: "success",
        showConfirmButton: false,
        timer: 1250
    });
    try {
        await axios.post("http://localhost:3000/api/logout", { withCredentials: true });
        setTimeout(() => {
            window.location.href = "/index.html";
        }, 1000);
    } catch (err) {
        console.log(err);
    }
}
