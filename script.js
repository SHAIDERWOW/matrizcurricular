document.addEventListener("DOMContentLoaded", function () {
  const
    body = document.body,
    darkModeToggle = document.getElementById("dark-mode-toggle"),
    container = document.getElementById("curricular-container"),
    courseSelector = document.getElementById("course-selector"),
    btnCompact = document.getElementById("btn-compact"),
    btnExport = document.getElementById("btn-export"),
    btnPopup = document.getElementById("btn-popup"),
    btnBackToCourses = document.getElementById("btn-back-to-courses"),
    popupOverlay = document.getElementById("popup-overlay"),
    requirementsPopup = document.getElementById("requirements-popup"),
    exportPopup = document.getElementById("export-popup");

  let gradeData = {};
  let completedCourses = new Set();
  let currentCourse = "";

  const courseFileMapping = {
    "engenharia-mecanica": "dataEM.json",
    "curso-2": "dataC2.json",
  };

  const saveState = () => {
    if (!currentCourse) return;
    localStorage.setItem(`${currentCourse}_completed`, JSON.stringify(Array.from(completedCourses)));
    localStorage.setItem("darkMode", body.classList.contains("dark"));
  };

  const loadState = () => {
    const savedCourses = localStorage.getItem(`${currentCourse}_completed`);
    const savedDarkMode = localStorage.getItem("darkMode");
    completedCourses = savedCourses ? new Set(JSON.parse(savedCourses)) : new Set();
    if (savedDarkMode === null || savedDarkMode === "true") body.classList.add("dark");
    else body.classList.remove("dark");
    updateDarkModeButton();
  };

  const showPopup = (popupElement) => {
    popupOverlay.classList.remove('hidden');
    popupElement.classList.remove('hidden');
  }

  const hideAllPopups = () => {
    popupOverlay.classList.add('hidden');
    requirementsPopup.classList.add('hidden');
    exportPopup.classList.add('hidden');
  }

  const updateDarkModeButton = () => {
    darkModeToggle.textContent = body.classList.contains("dark") ? "Modo Claro" : "Modo Escuro";
  };
  
  const updateCompactView = () => {
    const isCompact = container.classList.contains("compact");
    container.querySelectorAll(".disciplina strong").forEach(strong => {
        const block = strong.parentElement;
        strong.textContent = isCompact && block.dataset.apelido ? block.dataset.apelido : block.dataset.nome;
    });
    btnCompact.textContent = isCompact ? "Expandir Visualização" : "Compactar Visualização";
  };

  const renderCurricularMatrix = () => {
    container.innerHTML = "";
    container.classList.add("compact");

    const courseName = courseSelector.querySelector(`[data-course="${currentCourse}"]`).textContent;
    document.querySelector("header h1").innerHTML = `<img src="https://cdn.glitch.global/ab1e181f-e611-442d-9125-65bc043647cf/club-penguin.gif?v=1743474666434" alt="Pinguim" class="header-gif"> Grade Curricular - ${courseName}`;

    for (const periodo in gradeData.grade_curricular) {
      const column = document.createElement("div");
      column.className = "column";
      column.innerHTML = `<h2>${periodo}</h2>`;

      gradeData.grade_curricular[periodo].forEach((disciplina) => {
        const block = document.createElement("div");
        block.className = "disciplina";
        if (completedCourses.has(disciplina.nome)) block.classList.add("completed");
        
        block.dataset.nome = disciplina.nome;
        block.dataset.apelido = disciplina.apelido || "";
        block.dataset.preRequisitos = JSON.stringify(disciplina.pre_requisitos || []);

        block.innerHTML = `
            <span class="complete-button">✓</span>
            <strong></strong>
            <div class="details">${disciplina.componente} | ${disciplina.carga_horaria}</div>
        `;
        column.appendChild(block);
      });
      container.appendChild(column);
    }
    updateCompactView();
  };
  
  const loadCourseData = (courseId) => {
    const fileName = courseFileMapping[courseId];
    if (!fileName) return console.error(`Arquivo JSON para o curso "${courseId}" não encontrado.`);
    
    currentCourse = courseId;
    fetch(fileName)
      .then(response => response.json())
      .then(data => {
        gradeData = data;
        loadState();
        renderCurricularMatrix();
        courseSelector.classList.add("hidden");
        container.classList.remove("hidden");
        btnBackToCourses.classList.remove("hidden");
        [btnCompact, btnExport, btnPopup].forEach(b => b.style.display = 'inline-block');
      })
      .catch(error => console.error("Erro ao carregar o arquivo JSON:", error));
  };
  
  const showCourseSelection = () => {
      container.classList.add("hidden");
      courseSelector.classList.remove("hidden");
      btnBackToCourses.classList.add("hidden");
      [btnCompact, btnExport, btnPopup].forEach(b => b.style.display = 'none');
      document.querySelector("header h1").innerHTML = 'Grade Curricular - UFR';
  }

  const calculateProgress = () => {
    const progress = {};
    const requisitos = gradeData.requisitos_conclusao;

    for (const req in requisitos) {
        if (req !== 'total') {
            progress[req] = {
                completedHours: 0,
                totalHours: parseInt(requisitos[req].ch_prevista) || 0
            };
        }
    }
    
    const allDisciplines = Object.values(gradeData.grade_curricular).flat();

    completedCourses.forEach(courseName => {
        const disciplina = allDisciplines.find(d => d.nome === courseName);
        if(!disciplina) return;
        
        let reqCategory = "Disciplinas Obrigatórias"; // Default
        if (disciplina.nome === "TRABALHO DE CONCLUSÃO DE CURSO") {
            reqCategory = "Disciplinas de TCC";
        } else if (gradeData.grade_curricular["Optativas"]?.some(d => d.nome === courseName)) {
            reqCategory = "Disciplinas Optativas";
        }
        
        if(progress[reqCategory]) {
           progress[reqCategory].completedHours += parseInt(disciplina.carga_horaria) || 0;
        }
    });
    return progress;
  };

  const generateCsv = (exportType) => {
    const periodMap = new Map();
    const periodOrder = [];

    for (const periodo in gradeData.grade_curricular) {
        periodOrder.push(periodo);
        const disciplines = gradeData.grade_curricular[periodo];
        let filteredDisciplines = [];

        if (exportType === 'pending') {
            filteredDisciplines = disciplines.filter(d => !completedCourses.has(d.nome));
        } else if (exportType === 'completed') {
            filteredDisciplines = disciplines.filter(d => completedCourses.has(d.nome));
        } else {
            filteredDisciplines = disciplines;
        }
        periodMap.set(periodo, filteredDisciplines.map(d => d.nome));
    }

    const maxRows = Math.max(...Array.from(periodMap.values()).map(p => p.length));
    let csvContent = `\uFEFF${periodOrder.join(',')}\n`;

    for (let i = 0; i < maxRows; i++) {
        const row = periodOrder.map(periodo => {
            const subjects = periodMap.get(periodo);
            const subject = subjects[i] || "";
            return `"${subject.replace(/"/g, '""')}"`;
        });
        csvContent += row.join(',') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `grade_${currentCourse}_${exportType}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  
  darkModeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    updateDarkModeButton();
    saveState();
  });

  btnCompact.addEventListener("click", () => {
    container.classList.toggle("compact");
    updateCompactView();
  });
  
  btnBackToCourses.addEventListener('click', showCourseSelection);

  courseSelector.addEventListener("click", (e) => {
    if (e.target.matches("button[data-course]")) {
      loadCourseData(e.target.getAttribute("data-course"));
    }
  });

  container.addEventListener("click", (e) => {
    const block = e.target.closest(".disciplina");
    if (!block) return;
    
    // Ação: Marcar como concluído
    if (e.target.matches('.complete-button')) {
        e.stopPropagation(); // Impede que o clique no botão ative o clique no card
        const disciplinaNome = block.dataset.nome;
        block.classList.toggle("completed");
        if (completedCourses.has(disciplinaNome)) completedCourses.delete(disciplinaNome);
        else completedCourses.add(disciplinaNome);
        saveState();
        return;
    }
    
    // Ação: Destacar pré/co-requisitos
    const disciplinaBlocks = document.querySelectorAll(".disciplina");
    disciplinaBlocks.forEach(b => b.classList.remove("selected", "pre", "core"));
    
    block.classList.add("selected");
    const preReqs = JSON.parse(block.dataset.preRequisitos);
    const disciplinaNome = block.dataset.nome;

    disciplinaBlocks.forEach(b => {
      if (preReqs.includes(b.dataset.nome)) b.classList.add("pre");
      const bPreReqs = JSON.parse(b.dataset.preRequisitos);
      if (bPreReqs.includes(disciplinaNome)) b.classList.add("core");
    });
  });

  btnPopup.addEventListener("click", () => {
    const content = document.getElementById("popup-content");
    const progress = calculateProgress();
    let html = "<ul>";
    for(const req in progress) {
        const p = progress[req];
        const percentage = p.totalHours > 0 ? Math.min(100, (p.completedHours / p.totalHours) * 100).toFixed(1) : 0;
        html += `<li><strong>${req}:</strong> ${p.completedHours}h / ${p.totalHours}h
                <div class="progress-bar"><div class="progress-bar-fill" style="width: ${percentage}%">${percentage}%</div></div></li>`;
    }
    html += "</ul>";
    content.innerHTML = html;
    showPopup(requirementsPopup);
  });
  
  btnExport.addEventListener("click", () => showPopup(exportPopup));
  exportPopup.addEventListener('click', (e) => {
      if(e.target.matches('[data-export-type]')) {
          generateCsv(e.target.dataset.exportType);
          hideAllPopups();
      }
  });

  document.querySelectorAll('.close-popup').forEach(btn => btn.addEventListener('click', hideAllPopups));
  popupOverlay.addEventListener('click', hideAllPopups);

  showCourseSelection();
});