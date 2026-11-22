// AI-Powered Real-World Workflow Simulator & Optimizer
// Multi-Page SPA Engine, CPM Scheduler & Interactive DAG Visualizer

let workflows = JSON.parse(localStorage.getItem("workflows") || "[]");
let simulationCount = Number(localStorage.getItem("simulationCount") || 0);
let totalTimeSaved = Number(localStorage.getItem("totalTimeSaved") || 0);
let selectedWorkflow = null;

// Chart Instances
let comparisonChartInstance = null;
let taskDurationChartInstance = null;
let domainChartInstance = null;
let overviewDomainChartInstance = null;
let chartLoadWarningShown = false;
let databaseSaveQueue = Promise.resolve();

// Page Metadata for Topbar
const pageMetadata = {
    "dashboard": {
        title: "Dashboard",
        subtitle: "Manage, simulate and optimize business workflows with intelligent scheduling."
    },
    "create-workflow": {
        title: "Create Workflow",
        subtitle: "Select a business domain or build custom workflows with parallel dependencies."
    },
    "recent-workflows": {
        title: "My Workflows",
        subtitle: "Manage, inspect, and switch between your created business workflows."
    },
    "workflow-diagram": {
        title: "Workflow Dependency Graph",
        subtitle: "Interactive Directed Acyclic Graph (DAG) with directional SVG arrows and execution states."
    },
    "edit-workflow": {
        title: "Task Editor",
        subtitle: "Configure task names, durations in minutes, and prerequisite dependencies."
    },
    "results": {
        title: "Simulation & Optimization",
        subtitle: "Analyze execution bottlenecks, compute CPM critical paths, and calculate savings."
    },
    "analytics-section": {
        title: "Performance Analytics",
        subtitle: "Visual comparison of execution times, critical-path parallelization, and task breakdown."
    }
};

// Realistic Domain Presets with Multi-branch DAG Dependencies
const domainTasks = {
    "IT & Software": [
        { id: "T1", name: "Requirements & Architecture", time: 30, dependencies: [], status: "pending" },
        { id: "T2", name: "Frontend Development", time: 60, dependencies: ["T1"], status: "pending" },
        { id: "T3", name: "Backend & API Services", time: 80, dependencies: ["T1"], status: "pending" },
        { id: "T4", name: "QA & Integration Testing", time: 40, dependencies: ["T2", "T3"], status: "pending" },
        { id: "T5", name: "Cloud Deployment & CI/CD", time: 20, dependencies: ["T4"], status: "pending" }
    ],
    "E-Commerce": [
        { id: "T1", name: "Order Placement & Validation", time: 5, dependencies: [], status: "pending" },
        { id: "T2", name: "Payment Gateway Processing", time: 10, dependencies: ["T1"], status: "pending" },
        { id: "T3", name: "Warehouse Inventory Allocation", time: 15, dependencies: ["T1"], status: "pending" },
        { id: "T4", name: "Packaging & Quality Inspection", time: 20, dependencies: ["T2", "T3"], status: "pending" },
        { id: "T5", name: "Carrier Dispatch & Shipping", time: 15, dependencies: ["T4"], status: "pending" }
    ],
    "Healthcare": [
        { id: "T1", name: "Patient Registration & Triage", time: 10, dependencies: [], status: "pending" },
        { id: "T2", name: "Vitals & Nursing Assessment", time: 15, dependencies: ["T1"], status: "pending" },
        { id: "T3", name: "Diagnostic Laboratory Tests", time: 45, dependencies: ["T2"], status: "pending" },
        { id: "T4", name: "Physician Clinical Consultation", time: 30, dependencies: ["T2"], status: "pending" },
        { id: "T5", name: "Treatment & Discharge Plan", time: 15, dependencies: ["T3", "T4"], status: "pending" }
    ],
    "Banking & Finance": [
        { id: "T1", name: "Loan Application Intake", time: 15, dependencies: [], status: "pending" },
        { id: "T2", name: "KYC & Document Verification", time: 30, dependencies: ["T1"], status: "pending" },
        { id: "T3", name: "Credit Bureau & Risk Scoring", time: 40, dependencies: ["T1"], status: "pending" },
        { id: "T4", name: "Underwriting Manager Review", time: 25, dependencies: ["T2", "T3"], status: "pending" },
        { id: "T5", name: "Disbursement & Account Setup", time: 15, dependencies: ["T4"], status: "pending" }
    ],
    "Human Resources": [
        { id: "T1", name: "Application Intake", time: 10, dependencies: [], status: "pending" },
        { id: "T2", name: "Resume & Skill Screening", time: 20, dependencies: ["T1"], status: "pending" },
        { id: "T3", name: "Technical Assessment", time: 50, dependencies: ["T2"], status: "pending" },
        { id: "T4", name: "HR Behavioral Interview", time: 40, dependencies: ["T2"], status: "pending" },
        { id: "T5", name: "Offer Letter & Onboarding", time: 20, dependencies: ["T3", "T4"], status: "pending" }
    ],
    "Education": [
        { id: "T1", name: "Student Application Submission", time: 15, dependencies: [], status: "pending" },
        { id: "T2", name: "Academic Transcript Review", time: 25, dependencies: ["T1"], status: "pending" },
        { id: "T3", name: "Financial Aid & Scholarship", time: 30, dependencies: ["T1"], status: "pending" },
        { id: "T4", name: "Course Scheduling & Advising", time: 20, dependencies: ["T2", "T3"], status: "pending" },
        { id: "T5", name: "Campus Orientation & Portal", time: 15, dependencies: ["T4"], status: "pending" }
    ],
    "Manufacturing": [
        { id: "T1", name: "Raw Material Inbound Inspection", time: 20, dependencies: [], status: "pending" },
        { id: "T2", name: "Mechanical Part Fabrication", time: 60, dependencies: ["T1"], status: "pending" },
        { id: "T3", name: "Circuit Board Assembly", time: 50, dependencies: ["T1"], status: "pending" },
        { id: "T4", name: "Assembly & Quality Assurance", time: 35, dependencies: ["T2", "T3"], status: "pending" },
        { id: "T5", name: "Packaging & Logistics Staging", time: 20, dependencies: ["T4"], status: "pending" }
    ],
    "Logistics": [
        { id: "T1", name: "Shipment Receipt & Unloading", time: 15, dependencies: [], status: "pending" },
        { id: "T2", name: "Barcode Scanning & Sorting", time: 25, dependencies: ["T1"], status: "pending" },
        { id: "T3", name: "Customs & Manifest Clearance", time: 35, dependencies: ["T2"], status: "pending" },
        { id: "T4", name: "Route Optimization & Dispatch", time: 20, dependencies: ["T2"], status: "pending" },
        { id: "T5", name: "Fleet Loading & Last-Mile Delivery", time: 30, dependencies: ["T3", "T4"], status: "pending" }
    ]
};

// Multi-Page SPA Navigation Router
function switchPage(pageId) {
    if (!pageId) pageId = "dashboard";
    const cleanId = pageId.replace("#", "").replace("page-", "");

    const pages = document.querySelectorAll(".app-page");
    let found = false;

    pages.forEach(page => {
        if (page.id === cleanId) {
            page.classList.add("active");
            found = true;
        } else {
            page.classList.remove("active");
        }
    });

    if (!found && pages.length > 0) {
        pages[0].classList.add("active");
    }

    // Update Topbar
    const meta = pageMetadata[cleanId] || { title: "Workflow AI", subtitle: "Process Optimizer" };
    const titleEl = document.getElementById("topbarTitle");
    const subEl = document.getElementById("topbarSubtitle");
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.subtitle;

    // Update Sidebar Navigation Link active class
    const links = document.querySelectorAll(".sidebar-link");
    links.forEach(link => {
        const href = (link.getAttribute("href") || "").replace("#", "");
        if (href === cleanId) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    window.location.hash = cleanId;

    // Reactivate Views & Charts when becoming visible
    if (cleanId === "workflow-diagram") {
        if (selectedWorkflow) {
            renderWorkflowDiagram(selectedWorkflow);
        }
    } else if (cleanId === "analytics-section" || cleanId === "dashboard") {
        if (selectedWorkflow) {
            syncAnalytics(selectedWorkflow);
        }
    }

    requestAnimationFrame(() => {
        [comparisonChartInstance, taskDurationChartInstance, domainChartInstance, overviewDomainChartInstance]
            .forEach(chart => {
                if (chart) chart.resize();
            });
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Normalize tasks from legacy format if needed
function normalizeWorkflowTasks(wf) {
    if (!wf || !wf.tasks) return;
    wf.tasks.forEach((task, idx) => {
        if (!task.id) task.id = `T${idx + 1}`;
        if (!Array.isArray(task.dependencies)) {
            task.dependencies = idx > 0 ? [`T${idx}`] : [];
        }
        if (!task.status) task.status = "pending";
    });
}

function createWorkflow() {
    const domainSelect = document.getElementById("domain");
    if (!domainSelect) return;
    const domain = domainSelect.value;

    let workflow = workflows.find(item => item.domain === domain);

    if (workflow) {
        selectedWorkflow = workflow;
        normalizeWorkflowTasks(selectedWorkflow);
        setMessage("Existing " + domain + " workflow selected.", "message");
    } else {
        workflow = {
            id: Date.now(),
            domain: domain,
            tasks: (domainTasks[domain] || []).map(task => ({
                id: task.id,
                name: task.name,
                time: task.time,
                dependencies: [...task.dependencies],
                status: "pending"
            }))
        };

        workflows.push(workflow);
        selectedWorkflow = workflow;
        setMessage("Workflow created successfully!", "message");
    }

    renderWorkflows();
    updateStats();
    showTasks(selectedWorkflow);
    renderTaskEditor(selectedWorkflow);
    renderWorkflowDiagram(selectedWorkflow);
    syncAnalytics(selectedWorkflow);
    saveToLocalStorage();

    // Automatically navigate to the Workflow Graph page
    setTimeout(() => switchPage("workflow-diagram"), 500);
}

function createNewCustomWorkflow() {
    const customName = prompt("Enter workflow title / domain:", "Custom Operations");
    if (!customName || !customName.trim()) return;

    const newWf = {
        id: Date.now(),
        domain: customName.trim(),
        tasks: [
            { id: "T1", name: "Initial Intake", time: 15, dependencies: [], status: "pending" },
            { id: "T2", name: "Verification Step", time: 30, dependencies: ["T1"], status: "pending" }
        ]
    };

    workflows.push(newWf);
    selectedWorkflow = newWf;
    saveToLocalStorage();
    renderWorkflows();
    updateStats();
    showTasks(selectedWorkflow);
    renderTaskEditor(selectedWorkflow);
    renderWorkflowDiagram(selectedWorkflow);
    syncAnalytics(selectedWorkflow);

    switchPage("edit-workflow");
}

function renderWorkflows() {
    const list = document.getElementById("workflowList");
    if (!list) return;

    if (workflows.length === 0) {
        list.innerHTML = '<p class="empty-message">No workflows created yet.</p>';
        return;
    }

    list.innerHTML = workflows.map(workflow => {
        const isSelected = selectedWorkflow && selectedWorkflow.id === workflow.id;
        return `
            <div class="workflow-item ${isSelected ? 'active-workflow-item' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3>${workflow.domain} Workflow</h3>
                        <p>${workflow.tasks.length} tasks included &bull; Multi-branch DAG</p>
                    </div>
                    <div>
                        <button type="button" onclick="selectAndOpen(${workflow.id}, 'workflow-diagram')">
                            ${isSelected ? 'Active &bull; Open Graph' : 'Select Workflow'}
                        </button>
                        <button type="button" class="delete-button" onclick="deleteWorkflow(${workflow.id})">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function selectAndOpen(id, targetPage = "workflow-diagram") {
    selectWorkflow(id);
    switchPage(targetPage);
}

function selectWorkflow(id) {
    selectedWorkflow = workflows.find(workflow => workflow.id === id);
    if (!selectedWorkflow) return;

    normalizeWorkflowTasks(selectedWorkflow);
    showTasks(selectedWorkflow);
    renderTaskEditor(selectedWorkflow);
    renderWorkflowDiagram(selectedWorkflow);
    renderWorkflows();
    syncAnalytics(selectedWorkflow);

    const outputEl = document.getElementById("simulationOutput");
    if (outputEl) outputEl.innerHTML = "";

    const resultEl = document.getElementById("resultText");
    if (resultEl) resultEl.textContent = "Ready to simulate " + selectedWorkflow.domain + ".";
}

function showTasks(workflow) {
    const resultEl = document.getElementById("resultText");
    const dashSummary = document.getElementById("dashboardActiveSummary");

    if (dashSummary && workflow) {
        dashSummary.textContent = `${workflow.domain} Workflow (${workflow.tasks.length} tasks) currently selected.`;
    }

    const graphTitle = document.getElementById("graphActiveTitle");
    if (graphTitle && workflow) {
        graphTitle.textContent = `${workflow.domain} Workflow &mdash; Dependency Graph`;
    }

    const editTitle = document.getElementById("editorActiveTitle");
    if (editTitle && workflow) {
        editTitle.textContent = `${workflow.domain} Workflow &mdash; Tasks`;
    }

    if (!resultEl || !workflow || !workflow.tasks) return;

    const taskDetails = workflow.tasks.map((task) =>
        `<strong>[${task.id}]</strong> ${task.name} &mdash; <em>${task.time} min</em> (Prereqs: ${task.dependencies.length > 0 ? task.dependencies.join(", ") : "None"})`
    ).join("<br>");

    resultEl.innerHTML = `<strong>${workflow.domain} Workflow Schedule</strong><br>${taskDetails}`;
}

// CPM & Dependency Analysis Algorithm
function analyzeWorkflowCPM(workflow) {
    const tasks = workflow.tasks;
    const taskMap = new Map();
    tasks.forEach(t => taskMap.set(t.id, t));

    const inDegree = new Map();
    const adj = new Map();
    tasks.forEach(t => {
        inDegree.set(t.id, 0);
        adj.set(t.id, []);
    });

    tasks.forEach(t => {
        t.dependencies.forEach(depId => {
            if (adj.has(depId)) {
                adj.get(depId).push(t.id);
                inDegree.set(t.id, inDegree.get(t.id) + 1);
            }
        });
    });

    const queue = [];
    inDegree.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
    });

    const topoOrder = [];
    while (queue.length > 0) {
        const u = queue.shift();
        topoOrder.push(u);
        (adj.get(u) || []).forEach(v => {
            inDegree.set(v, inDegree.get(v) - 1);
            if (inDegree.get(v) === 0) queue.push(v);
        });
    }

    if (topoOrder.length < tasks.length) {
        return { hasCycle: true, error: "Dependency cycle detected! Workflow has deadlock." };
    }

    const ES = new Map();
    const EF = new Map();
    topoOrder.forEach(id => {
        const t = taskMap.get(id);
        let maxPredEF = 0;
        t.dependencies.forEach(depId => {
            if (EF.has(depId)) {
                maxPredEF = Math.max(maxPredEF, EF.get(depId));
            }
        });
        ES.set(id, maxPredEF);
        EF.set(id, maxPredEF + t.time);
    });

    let totalCriticalDuration = 0;
    EF.forEach(val => {
        if (val > totalCriticalDuration) totalCriticalDuration = val;
    });

    const LF = new Map();
    const LS = new Map();
    tasks.forEach(t => LF.set(t.id, totalCriticalDuration));

    for (let i = topoOrder.length - 1; i >= 0; i--) {
        const id = topoOrder[i];
        const t = taskMap.get(id);
        const children = adj.get(id) || [];
        if (children.length > 0) {
            let minSuccLS = Infinity;
            children.forEach(cid => {
                minSuccLS = Math.min(minSuccLS, LS.get(cid));
            });
            LF.set(id, minSuccLS);
        }
        LS.set(id, LF.get(id) - t.time);
    }

    const criticalPathIds = [];
    const slackMap = new Map();
    tasks.forEach(t => {
        const slack = LF.get(t.id) - EF.get(t.id);
        slackMap.set(t.id, slack);
        if (Math.abs(slack) === 0) {
            criticalPathIds.push(t.id);
        }
    });

    let primaryBottleneck = null;
    let maxImpactScore = -1;
    criticalPathIds.forEach(id => {
        const t = taskMap.get(id);
        const fanOut = (adj.get(id) || []).length;
        const impactScore = t.time * 2 + fanOut * 10;
        if (impactScore > maxImpactScore) {
            maxImpactScore = impactScore;
            primaryBottleneck = t;
        }
    });

    const layers = new Map();
    topoOrder.forEach(id => {
        const t = taskMap.get(id);
        let maxDepLayer = -1;
        t.dependencies.forEach(depId => {
            if (layers.has(depId)) {
                maxDepLayer = Math.max(maxDepLayer, layers.get(depId));
            }
        });
        layers.set(id, maxDepLayer + 1);
    });

    return {
        hasCycle: false,
        topoOrder,
        ES,
        EF,
        LS,
        LF,
        slackMap,
        criticalPathIds,
        primaryBottleneck,
        totalCriticalDuration,
        layers
    };
}

// Visual DAG Graph Renderer with Dynamic SVG Connectors
function renderWorkflowDiagram(workflow, activeBottleneckId = null, highlightCritical = false) {
    const container = document.getElementById("diagramContainer");
    if (!container) return;

    if (!workflow || !workflow.tasks || workflow.tasks.length === 0) {
        container.innerHTML = '<p class="empty-message">Generate a workflow to view its diagram.</p>';
        return;
    }

    normalizeWorkflowTasks(workflow);
    const analysis = analyzeWorkflowCPM(workflow);

    if (analysis.hasCycle) {
        container.innerHTML = `<div class="p-3 bg-red-100 text-red-800 rounded">Error: ${analysis.error}</div>`;
        return;
    }

    const bottleneckId = activeBottleneckId || (analysis.primaryBottleneck ? analysis.primaryBottleneck.id : null);
    const criticalSet = new Set(analysis.criticalPathIds || []);

    const layerGroups = [];
    workflow.tasks.forEach(task => {
        const layerIdx = analysis.layers.get(task.id) || 0;
        if (!layerGroups[layerIdx]) layerGroups[layerIdx] = [];
        layerGroups[layerIdx].push(task);
    });

    let layersHtml = `<div class="dag-layers-container" id="dagLayers">`;
    layerGroups.forEach((group, layerIdx) => {
        layersHtml += `<div class="dag-layer-column" data-layer="${layerIdx}">`;
        group.forEach(task => {
            const isBottleneck = task.id === bottleneckId;
            const isCritical = criticalSet.has(task.id);
            const statusClass = task.status || "pending";

            layersHtml += `
                <div class="dag-node ${statusClass} ${isBottleneck ? 'bottleneck' : ''}" 
                     id="node-${task.id}" data-id="${task.id}" title="Task: ${task.name}">
                    <div class="dag-node-header">
                        <span class="dag-node-id">${task.id}</span>
                        <span class="dag-node-badge badge-${isBottleneck ? 'bottleneck' : statusClass}">
                            ${isBottleneck ? 'Bottleneck' : statusClass}
                        </span>
                    </div>
                    <div class="dag-node-title">${task.name}</div>
                    <div class="dag-node-meta">
                        <span>${task.time} min</span>
                        <span>${isCritical ? '&starf; Critical' : 'Slack: ' + (analysis.slackMap.get(task.id) || 0) + 'm'}</span>
                    </div>
                </div>
            `;
        });
        layersHtml += `</div>`;
    });
    layersHtml += `</div>`;

    container.innerHTML = `
        <svg class="dag-svg-canvas" id="dagSvg">
            <defs>
                <marker id="arrow-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#94a3b8" />
                </marker>
                <marker id="arrow-critical" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#e11d48" />
                </marker>
                <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
                </marker>
            </defs>
        </svg>
        ${layersHtml}
    `;

    requestAnimationFrame(() => drawSvgEdges(workflow, analysis, bottleneckId, highlightCritical));
}

function drawSvgEdges(workflow, analysis, bottleneckId, highlightCritical) {
    const container = document.getElementById("diagramContainer");
    const svg = document.getElementById("dagSvg");
    if (!container || !svg) return;

    const containerRect = container.getBoundingClientRect();
    const criticalSet = new Set(analysis.criticalPathIds || []);

    let pathsHtml = svg.querySelector("defs").outerHTML;

    workflow.tasks.forEach(task => {
        const targetNode = document.getElementById(`node-${task.id}`);
        if (!targetNode) return;
        const targetRect = targetNode.getBoundingClientRect();

        const endX = targetRect.left - containerRect.left + container.scrollLeft;
        const endY = targetRect.top - containerRect.top + targetRect.height / 2;

        task.dependencies.forEach(depId => {
            const srcNode = document.getElementById(`node-${depId}`);
            if (!srcNode) return;
            const srcRect = srcNode.getBoundingClientRect();

            const startX = srcRect.right - containerRect.left + container.scrollLeft;
            const startY = srcRect.top - containerRect.top + srcRect.height / 2;

            const isCriticalEdge = highlightCritical && criticalSet.has(task.id) && criticalSet.has(depId);
            const deltaX = (endX - startX) * 0.5;

            const d = `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;
            const marker = isCriticalEdge ? "url(#arrow-critical)" : "url(#arrow-default)";
            const edgeClass = isCriticalEdge ? "dag-edge-path critical" : "dag-edge-path";

            pathsHtml += `<path d="${d}" class="${edgeClass}" marker-end="${marker}" />`;
        });
    });

    svg.innerHTML = pathsHtml;
}

// Dependency-Aware Simulation Engine Execution
function runSimulation() {
    if (!selectedWorkflow) {
        alert("Please generate or select a workflow first.");
        return;
    }

    normalizeWorkflowTasks(selectedWorkflow);
    const analysis = analyzeWorkflowCPM(selectedWorkflow);

    if (analysis.hasCycle) {
        alert("Cannot simulate: Dependency cycle detected in this workflow!");
        return;
    }

    const tasks = selectedWorkflow.tasks;
    const sequentialDuration = tasks.reduce((sum, t) => sum + t.time, 0);
    const criticalParallelDuration = analysis.totalCriticalDuration;
    const bottleneck = analysis.primaryBottleneck;

    const bottleneckSaving = bottleneck ? Math.round(bottleneck.time * 0.25) : 0;
    const optimizedDuration = Math.max(1, criticalParallelDuration - bottleneckSaving);
    const totalSaved = sequentialDuration - optimizedDuration;
    const pctSaved = sequentialDuration > 0 ? ((totalSaved / sequentialDuration) * 100).toFixed(1) : "0.0";
// Store the latest simulation report for CSV export
const simulationReport = {
    workflowId: selectedWorkflow.id,
    workflowName: selectedWorkflow.name || "",
    domain: selectedWorkflow.domain || "",
    sequentialDuration: sequentialDuration,
    parallelDuration: criticalParallelDuration,
    optimizedDuration: optimizedDuration,
    totalSaved: totalSaved,
    pctSaved: pctSaved,
    bottleneckName: bottleneck ? bottleneck.name : "None",
    bottleneckDuration: bottleneck ? bottleneck.time : 0,
    criticalPathTasks: analysis.criticalPathIds.length
};

localStorage.setItem(
    "latestSimulationReport",
    JSON.stringify(simulationReport)
);
    simulationCount++;
    totalTimeSaved += totalSaved;

    const outputEl = document.getElementById("simulationOutput");
    if (outputEl) {
        outputEl.innerHTML = `
            <div class="simulation-result">
                <h3>Simulation & Critical Path Analysis Complete</h3>
                <p>Sequential Sum Duration: <strong>${sequentialDuration} minutes</strong></p>
                <p>Dependency-Aware Parallel Runtime: <strong>${criticalParallelDuration} minutes</strong></p>
                <p>Critical Bottleneck: <strong class="text-rose-600">${bottleneck ? bottleneck.name : "None"}</strong> (${bottleneck ? bottleneck.time + " min" : ""})</p>
                <p>Optimized Target Schedule: <strong class="text-emerald-700">${optimizedDuration} minutes</strong></p>
                <p>Total Estimated Time Saved: <strong>${totalSaved} minutes (${pctSaved}%)</strong></p>
                <p><em>Optimization applied: Parallel concurrency scheduling across independent branches plus targeted 25% duration compression on primary critical bottleneck.</em></p>
            </div>
        `;
    }

    const compEl = document.getElementById("comparisonContainer");
    if (compEl) {
        compEl.innerHTML = `
            <div class="comparison-card">
                <h3>Original Sequential Execution</h3>
                <p>Total Tasks: <strong>${tasks.length}</strong></p>
                <p>Total Sequential Time: <strong>${sequentialDuration} minutes</strong></p>
                <p>Dependency Scheduling: <strong>Unoptimized Serial</strong></p>
            </div>

            <div class="comparison-card optimized">
                <h3>Optimized Parallel Execution</h3>
                <p>Critical Path Tasks: <strong>${analysis.criticalPathIds.length}</strong></p>
                <p>Optimized Schedule: <strong>${optimizedDuration} minutes</strong></p>
                <p>Time Saved: <strong>${totalSaved} minutes (${pctSaved}%)</strong></p>
            </div>
        `;
    }

    const progEl = document.getElementById("savingProgress");
    if (progEl) progEl.style.width = Math.min(Number(pctSaved), 100) + "%";

    const progTextEl = document.getElementById("savingProgressText");
    if (progTextEl) progTextEl.textContent = `${pctSaved}% time saved over sequential baseline`;

    // Step-by-Step Animated Status Simulation on DAG Graph
    let stepIndex = 0;
    tasks.forEach(t => t.status = "pending");
    renderWorkflowDiagram(selectedWorkflow, bottleneck ? bottleneck.id : null, true);

    const interval = setInterval(() => {
        if (stepIndex < analysis.topoOrder.length) {
            const taskId = analysis.topoOrder[stepIndex];
            const t = tasks.find(item => item.id === taskId);
            if (t) {
                t.status = "running";
                renderWorkflowDiagram(selectedWorkflow, bottleneck ? bottleneck.id : null, true);
                setTimeout(() => {
                    t.status = "completed";
                    renderWorkflowDiagram(selectedWorkflow, bottleneck ? bottleneck.id : null, true);
                }, 350);
            }
            stepIndex++;
        } else {
            clearInterval(interval);
        }
    }, 450);

    updateComparisonChart(sequentialDuration, criticalParallelDuration, optimizedDuration);
    updateTaskDurationChart(tasks, bottleneck ? bottleneck.id : null);
    updateDomainChart();
    updateStats();
    saveToLocalStorage();
}

function chartLibraryAvailable() {
    if (typeof Chart !== "undefined") return true;
    if (!chartLoadWarningShown) {
        console.error("Chart.js did not load. Check the workflow/chart.umd.min.js static file URL.");
        chartLoadWarningShown = true;
    }
    return false;
}

// Performance Analytics Charts Engine (Chart.js)
function updateComparisonChart(sequential = 230, parallel = 170, optimized = 145) {
    if (!chartLibraryAvailable()) return;
    const canvas = document.getElementById("comparisonChart");
    if (!canvas) return;

    const dataVals = [sequential, parallel, optimized];

    if (comparisonChartInstance) {
        comparisonChartInstance.data.datasets[0].data = dataVals;
        comparisonChartInstance.update();
        return;
    }

    const ctx = canvas.getContext("2d");
    comparisonChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Sequential Total", "Parallel Critical-Path", "Optimized Schedule"],
            datasets: [{
                label: "Duration (min)",
                data: dataVals,
                backgroundColor: ["#2563eb", "#0284c7", "#0f766e"],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.parsed.y} minutes`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Minutes" }
                }
            }
        }
    });
}

function updateTaskDurationChart(tasks = [], bottleneckId = null) {
    if (!chartLibraryAvailable()) return;
    const canvas = document.getElementById("taskDurationChart");
    if (!canvas) return;

    const labels = tasks.map(t => `${t.id}: ${t.name.substring(0, 16)}...`);
    const dataVals = tasks.map(t => t.time);
    const bgColors = tasks.map(t => (t.id === bottleneckId ? "#e11d48" : "#2563eb"));

    if (taskDurationChartInstance) {
        taskDurationChartInstance.data.labels = labels;
        taskDurationChartInstance.data.datasets[0].data = dataVals;
        taskDurationChartInstance.data.datasets[0].backgroundColor = bgColors;
        taskDurationChartInstance.update();
        return;
    }

    const ctx = canvas.getContext("2d");
    taskDurationChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Task Duration (min)",
                data: dataVals,
                backgroundColor: bgColors,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.parsed.x} minutes ${ctx.dataset.backgroundColor[ctx.dataIndex] === '#e11d48' ? '(Critical Bottleneck)' : ''}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: "Minutes" }
                }
            }
        }
    });
}

function updateDomainChart() {
    if (!chartLibraryAvailable()) return;

    const counts = {};
    workflows.forEach(wf => {
        counts[wf.domain] = (counts[wf.domain] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const dataVals = Object.values(counts);

    const colors = [
        "#2563eb", "#0f766e", "#f59e0b", "#ec4899",
        "#8b5cf6", "#10b981", "#64748b", "#f97316"
    ];

    const chartConfig = {
        type: "doughnut",
        data: {
            labels: labels.length > 0 ? labels : ["No Workflows"],
            datasets: [{
                data: dataVals.length > 0 ? dataVals : [1],
                backgroundColor: dataVals.length > 0 ? colors.slice(0, labels.length) : ["#e2e8f0"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "right" }
            }
        }
    };

    // Analytics Page Chart
    const canvas = document.getElementById("domainChart");
    if (canvas) {
        if (domainChartInstance) {
            domainChartInstance.data.labels = chartConfig.data.labels;
            domainChartInstance.data.datasets[0].data = chartConfig.data.datasets[0].data;
            domainChartInstance.data.datasets[0].backgroundColor = chartConfig.data.datasets[0].backgroundColor;
            domainChartInstance.update();
        } else {
            domainChartInstance = new Chart(canvas.getContext("2d"), chartConfig);
        }
    }

    // Dashboard Overview Chart
    const overviewCanvas = document.getElementById("domainChartOverview");
    if (overviewCanvas) {
        if (overviewDomainChartInstance) {
            overviewDomainChartInstance.data.labels = chartConfig.data.labels;
            overviewDomainChartInstance.data.datasets[0].data = chartConfig.data.datasets[0].data;
            overviewDomainChartInstance.data.datasets[0].backgroundColor = chartConfig.data.datasets[0].backgroundColor;
            overviewDomainChartInstance.update();
        } else {
            overviewDomainChartInstance = new Chart(overviewCanvas.getContext("2d"), {
                ...chartConfig,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom" }
                    }
                }
            });
        }
    }
}

function syncAnalytics(workflow) {
    if (!workflow || !workflow.tasks) return;
    normalizeWorkflowTasks(workflow);
    const analysis = analyzeWorkflowCPM(workflow);
    const sequential = workflow.tasks.reduce((sum, t) => sum + t.time, 0);
    const parallel = analysis.totalCriticalDuration || sequential;
    const bottleneckSaving = analysis.primaryBottleneck ? Math.round(analysis.primaryBottleneck.time * 0.25) : 0;
    const optimized = Math.max(1, parallel - bottleneckSaving);

    updateComparisonChart(sequential, parallel, optimized);
    updateTaskDurationChart(workflow.tasks, analysis.primaryBottleneck ? analysis.primaryBottleneck.id : null);
    updateDomainChart();
}

// Task Editor with ID, Name, Duration, Dependencies & Add/Remove
function renderTaskEditor(workflow) {
    const editor = document.getElementById("taskEditor");
    if (!editor) return;

    if (!workflow || !workflow.tasks) {
        editor.innerHTML = '<p class="empty-message">Generate a workflow to edit its tasks.</p>';
        return;
    }

    normalizeWorkflowTasks(workflow);

    editor.innerHTML = `
        <table class="task-grid-table">
            <thead>
                <tr>
                    <th style="width: 70px;">ID</th>
                    <th>Task Name</th>
                    <th style="width: 100px;">Duration (m)</th>
                    <th style="width: 140px;">Dependencies</th>
                    <th style="width: 70px;">Action</th>
                </tr>
            </thead>
            <tbody>
                ${workflow.tasks.map((task, idx) => `
                    <tr>
                        <td><strong>${task.id}</strong></td>
                        <td>
                            <input id="edit-name-${idx}" type="text" value="${escapeHtml(task.name)}" />
                        </td>
                        <td>
                            <input id="edit-time-${idx}" type="number" min="1" step="1" value="${task.time}" />
                        </td>
                        <td>
                            <input id="edit-deps-${idx}" type="text" placeholder="e.g. T1, T2" value="${(task.dependencies || []).join(', ')}" />
                        </td>
                        <td>
                            <button type="button" class="delete-button" style="margin-left:0; padding:4px 8px;" onclick="deleteTask(${idx})" title="Remove task">&times;</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function addNewTask() {
    if (!selectedWorkflow) {
        alert("Please generate or select a workflow first.");
        return;
    }
    const newId = `T${selectedWorkflow.tasks.length + 1}`;
    const defaultDep = selectedWorkflow.tasks.length > 0 ? [selectedWorkflow.tasks[selectedWorkflow.tasks.length - 1].id] : [];
    selectedWorkflow.tasks.push({
        id: newId,
        name: `New Task ${newId}`,
        time: 20,
        dependencies: defaultDep,
        status: "pending"
    });
    renderTaskEditor(selectedWorkflow);
    renderWorkflowDiagram(selectedWorkflow);
    syncAnalytics(selectedWorkflow);
    saveToLocalStorage();
}

function deleteTask(index) {
    if (!selectedWorkflow) return;
    if (selectedWorkflow.tasks.length <= 1) {
        alert("A workflow must have at least one task.");
        return;
    }
    const removedId = selectedWorkflow.tasks[index].id;
    selectedWorkflow.tasks.splice(index, 1);

    selectedWorkflow.tasks.forEach(t => {
        t.dependencies = t.dependencies.filter(id => id !== removedId);
    });

    renderTaskEditor(selectedWorkflow);
    renderWorkflowDiagram(selectedWorkflow);
    syncAnalytics(selectedWorkflow);
    saveToLocalStorage();
}

function saveTaskChanges() {
    if (!selectedWorkflow) {
        alert("Please generate or select a workflow first.");
        return;
    }

    const tasks = selectedWorkflow.tasks;
    let hasError = false;

    tasks.forEach((task, idx) => {
        const nameInput = document.getElementById(`edit-name-${idx}`);
        const timeInput = document.getElementById(`edit-time-${idx}`);
        const depsInput = document.getElementById(`edit-deps-${idx}`);

        if (nameInput) task.name = nameInput.value.trim() || `Task ${task.id}`;
        if (timeInput) {
            const val = Number(timeInput.value);
            if (!Number.isInteger(val) || val < 1) hasError = true;
            else task.time = val;
        }
        if (depsInput) {
            const raw = depsInput.value.trim();
            task.dependencies = raw ? raw.split(",").map(s => s.trim().toUpperCase()).filter(s => s.length > 0 && s !== task.id) : [];
        }
    });

    if (hasError) {
        alert("Please enter a positive whole number for all task durations.");
        return;
    }

    const analysis = analyzeWorkflowCPM(selectedWorkflow);
    if (analysis.hasCycle) {
        alert("Warning: " + analysis.error);
        return;
    }

    saveToLocalStorage();
    showTasks(selectedWorkflow);
    renderTaskEditor(selectedWorkflow);
    renderWorkflowDiagram(selectedWorkflow);
    syncAnalytics(selectedWorkflow);
    alert("Task durations & dependencies saved successfully!");
}

function validateCurrentWorkflow() {
    if (!selectedWorkflow) {
        alert("Select or create a workflow to validate.");
        return;
    }
    const analysis = analyzeWorkflowCPM(selectedWorkflow);
    if (analysis.hasCycle) {
        alert("Validation Failed: " + analysis.error);
    } else {
        alert(`Workflow is Valid!\nDomain: ${selectedWorkflow.domain}\nTotal Tasks: ${selectedWorkflow.tasks.length}\nCritical Path: ${analysis.criticalPathIds.join(" -> ")}\nMinimum Parallel Duration: ${analysis.totalCriticalDuration} min`);
    }
}

function deleteWorkflow(id) {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    workflows = workflows.filter(w => w.id !== id);

    if (selectedWorkflow && selectedWorkflow.id === id) {
        selectedWorkflow = workflows.length > 0 ? workflows[0] : null;
    }

    saveToLocalStorage();
    deleteWorkflowFromDatabase(id);
    renderWorkflows();
    updateStats();

    if (selectedWorkflow) {
        selectWorkflow(selectedWorkflow.id);
    } else {
        const ed = document.getElementById("taskEditor");
        if (ed) ed.innerHTML = '<p class="empty-message">No workflows available.</p>';
        const dg = document.getElementById("diagramContainer");
        if (dg) dg.innerHTML = '<p class="empty-message">Generate a workflow to view its diagram.</p>';
        updateComparisonChart(0, 0, 0);
        updateTaskDurationChart([], null);
        updateDomainChart();
    }
    setMessage("Workflow removed.", "message");
}

function updateStats() {
    const totalEl = document.getElementById("totalWorkflows");
    const countEl = document.getElementById("simulationsRun");
    const savedEl = document.getElementById("timeSaved");

    if (totalEl) totalEl.textContent = workflows.length;
    if (countEl) countEl.textContent = simulationCount;
    if (savedEl) savedEl.textContent = totalTimeSaved + " min";
}


function setMessage(txt, id) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getWorkflowApiUrl() {
    const meta = document.querySelector('meta[name="workflow-api-url"]');
    return meta ? meta.content : "/save-workflow/";
}

function getCsrfToken() {
    const cookie = document.cookie.split("; ").find(item => item.startsWith("csrftoken="));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

function setApiStatus(connected) {
    const badge = document.getElementById("apiStatusBadge");
    if (!badge) return;
    badge.classList.toggle("online", connected);
    badge.classList.toggle("offline", !connected);
    badge.textContent = connected ? "● Django Database Connected" : "● Local Fallback Mode";
    badge.title = connected ? "Workflows are syncing with Django." : "Workflows are saved in this browser; Django is unavailable.";
}

async function loadWorkflowsFromDatabase() {
    const response = await fetch(getWorkflowApiUrl(), {
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
        throw new Error(`Workflow database returned HTTP ${response.status}.`);
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.workflows)) {
        throw new Error("Workflow database returned an invalid response.");
    }

    const savedWorkflows = new Map();
    payload.workflows.forEach(workflow => {
        const numericId = Number(workflow.id);
        const id = Number.isSafeInteger(numericId) ? numericId : workflow.id;
        savedWorkflows.set(String(id), { ...workflow, id });
    });
    workflows.forEach(workflow => savedWorkflows.set(String(workflow.id), workflow));
    workflows = Array.from(savedWorkflows.values());
    workflows.forEach(normalizeWorkflowTasks);
    localStorage.setItem("workflows", JSON.stringify(workflows));
    setApiStatus(true);
}

function persistWorkflowsToDatabase() {
    databaseSaveQueue = databaseSaveQueue.then(async () => {
        for (const workflow of workflows) {
            const response = await fetch(getWorkflowApiUrl(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCsrfToken()
                },
                body: JSON.stringify({
                    id: workflow.id,
                    name: `${workflow.domain} Workflow`,
                    domain: workflow.domain,
                    tasks: workflow.tasks
                })
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || `Workflow save failed with HTTP ${response.status}.`);
            }
        }
        setApiStatus(true);
    }).catch(error => {
        setApiStatus(false);
        console.error("Could not save workflows to Django:", error);
    });
}

function deleteWorkflowFromDatabase(id) {
    databaseSaveQueue = databaseSaveQueue.then(async () => {
        const response = await fetch(`${getWorkflowApiUrl()}?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: { "X-CSRFToken": getCsrfToken() }
        });
        if (!response.ok) {
            throw new Error(`Workflow deletion failed with HTTP ${response.status}.`);
        }
        setApiStatus(true);
    }).catch(error => {
        setApiStatus(false);
        console.error("Could not delete workflow from Django:", error);
    });
}

function saveToLocalStorage() {
    localStorage.setItem("workflows", JSON.stringify(workflows));
    localStorage.setItem("simulationCount", simulationCount);
    localStorage.setItem("totalTimeSaved", totalTimeSaved);
    persistWorkflowsToDatabase();
}

async function bootApplication() {
    try {
        await loadWorkflowsFromDatabase();
    } catch (error) {
        setApiStatus(false);
        console.error("Could not load workflows from Django; using browser storage:", error);
    }

    // If no workflows in storage, create a default realistic workflow
    if (workflows.length === 0) {
        const defaultWf = {
            id: Date.now(),
            domain: "IT & Software",
            tasks: domainTasks["IT & Software"].map(t => ({
                id: t.id,
                name: t.name,
                time: t.time,
                dependencies: [...t.dependencies],
                status: "pending"
            }))
        };
        workflows.push(defaultWf);
        saveToLocalStorage();
    }

    workflows.forEach(normalizeWorkflowTasks);
    selectedWorkflow = workflows[0];

    renderWorkflows();
    updateStats();
    showTasks(selectedWorkflow);
    renderTaskEditor(selectedWorkflow);
    renderWorkflowDiagram(selectedWorkflow);
    syncAnalytics(selectedWorkflow);

    // Initial Route Detection from URL Hash
    const initialHash = window.location.hash ? window.location.hash.replace("#", "") : "dashboard";
    switchPage(initialHash);

    // Listen to Back/Forward browser navigation
    window.addEventListener("hashchange", () => {
        const currentHash = window.location.hash.replace("#", "");
        if (currentHash) switchPage(currentHash);
    });

    // Redraw SVG edges on window resize
    window.addEventListener("resize", () => {
        if (selectedWorkflow) {
            const analysis = analyzeWorkflowCPM(selectedWorkflow);
            drawSvgEdges(selectedWorkflow, analysis, analysis.primaryBottleneck ? analysis.primaryBottleneck.id : null, true);
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootApplication);
} else {
    bootApplication();
}


function exportReportCSV() {
    if (!selectedWorkflow) {
        alert("Please select a workflow first!");
        return;
    }

    const savedReport = localStorage.getItem("latestSimulationReport");

    if (!savedReport) {
        alert("Please run the simulation before exporting!");
        return;
    }

    const report = JSON.parse(savedReport);

    if (String(report.workflowId) !== String(selectedWorkflow.id)) {
        alert("Please run the simulation for the currently selected workflow first!");
        return;
    }

    const rows = [[
        "Workflow ID",
        "Workflow Name",
        "Domain",
        "Task Name",
        "Duration (Minutes)",
        "Dependencies",
        "Sequential Time",
        "Parallel Time",
        "Optimized Time",
        "Time Saved",
        "Time Saved (%)",
        "Bottleneck Task",
        "Bottleneck Duration",
        "Critical Path Tasks"
    ]];

    // Export only the selected workflow's tasks
    selectedWorkflow.tasks.forEach(task => {
        rows.push([
            selectedWorkflow.id,
            selectedWorkflow.name || "",
            selectedWorkflow.domain || "",
            task.name || "",
            task.time || 0,
            Array.isArray(task.dependsOn)
                ? task.dependsOn.join("; ")
                : "",
            "", "", "", "", "", "", "", ""
        ]);
    });

    // Add simulation summary for the selected workflow
    rows.push([
        selectedWorkflow.id,
        selectedWorkflow.name || "",
        selectedWorkflow.domain || "",
        "SIMULATION SUMMARY",
        "", "",
        report.sequentialDuration,
        report.parallelDuration,
        report.optimizedDuration,
        report.totalSaved,
        report.pctSaved + "%",
        report.bottleneckName,
        report.bottleneckDuration,
        report.criticalPathTasks
    ]);

    const csv = "\uFEFF" + rows.map(row =>
        row.map(value =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
    ).join("\r\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selected_workflow_report.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}



function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.add("active");
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.remove("active");
}

function closeAuthModalOnBackdrop(event) {
    if (event.target && event.target.id === "authModal") closeAuthModal();
}

function switchAuthTab(tab) {
    const isRegister = tab === "register";
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const loginButton = document.getElementById("tabLoginBtn");
    const registerButton = document.getElementById("tabRegisterBtn");
    const title = document.getElementById("modalTitle");
    if (loginForm) loginForm.style.display = isRegister ? "none" : "block";
    if (registerForm) registerForm.style.display = isRegister ? "block" : "none";
    if (loginButton) loginButton.classList.toggle("active", !isRegister);
    if (registerButton) registerButton.classList.toggle("active", isRegister);
    if (title) title.textContent = isRegister ? "Create an Account" : "Account Authentication";
}

function showAuthUnavailable(event) {
    event.preventDefault();
    const message = document.getElementById("authErrorMsg");
    const success = document.getElementById("authSuccessMsg");
    if (success) success.textContent = "";
    if (message) message.textContent = "Sign-in and registration are not connected to this project's backend yet.";
}

function handleLoginSubmit(event) {
    showAuthUnavailable(event);
}

function handleRegisterSubmit(event) {
    showAuthUnavailable(event);
}
