document.addEventListener("DOMContentLoaded", function () {
  const
    body = document.body,
    darkModeToggle = document.getElementById("dark-mode-toggle"),
    container = document.getElementById("curricular-container"),
    btnCompact = document.getElementById("btn-compact"),
    btnExport = document.getElementById("btn-export"),
    btnPopup = document.getElementById("btn-popup"),
    btnReset = document.getElementById("btn-reset"),
    btnPrintPdf = document.getElementById("btn-print-pdf"),
    
    // Popups e Overlay
    popupOverlay = document.getElementById("popup-overlay"),
    requirementsPopup = document.getElementById("requirements-popup"),
    exportPopup = document.getElementById("export-popup"),
    resetPopup = document.getElementById("reset-popup"),
    optativePopup = document.getElementById("optative-popup"),
    prereqPopup = document.getElementById("prereq-popup"),
    
    // Botões dentro de popups
    btnConfirmReset = document.getElementById("confirm-reset"),
    btnForceComplete = document.getElementById("btn-force-complete");

  let gradeData = {};
  let completedCourses = new Set();
  let pendingDisciplineNode = null; // Para guardar qual disciplina está tentando ser marcada no popup de pré-requisito
  
  // Curso fixo
  const currentCourse = "engenharia-mecanica";
  const jsonFileName = "dataEM.json";

  const saveState = () => {
    localStorage.setItem(`${currentCourse}_completed`, JSON.stringify(Array.from(completedCourses)));
    localStorage.setItem("darkMode", body.classList.contains("dark"));
  };

  const loadState = () => {
    const savedCourses = localStorage.getItem(`${currentCourse}_completed`);
    const savedDarkMode = localStorage.getItem("darkMode");
    
    completedCourses = savedCourses ? new Set(JSON.parse(savedCourses)) : new Set();
    
    if (savedDarkMode === null || savedDarkMode === "true") {
        body.classList.add("dark");
    } else {
        body.classList.remove("dark");
    }
    updateDarkModeButton();
  };

  const showPopup = (popupElement) => {
    popupOverlay.classList.remove('hidden');
    popupElement.classList.remove('hidden');
  }

  const hideAllPopups = () => {
    popupOverlay.classList.add('hidden');
    document.querySelectorAll('.popup').forEach(p => p.classList.add('hidden'));
    pendingDisciplineNode = null;
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
    container.classList.add("compact"); // Começa compactado por padrão

    for (const periodo in gradeData.grade_curricular) {
      const column = document.createElement("div");
      column.className = "column";
      
      // Cabeçalho da coluna com botão de marcar tudo
      const header = document.createElement("div");
      header.innerHTML = `<h2>${periodo} <button class="btn-check-all" title="Concluir/Desmarcar semestre">✓</button></h2>`;
      // Adiciona evento ao botão de check do semestre
      header.querySelector('.btn-check-all').addEventListener('click', () => markSemesterComplete(periodo));
      
      column.appendChild(header.firstElementChild); // Adiciona o h2

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
  
  const loadCourseData = () => {
    fetch(jsonFileName)
      .then(response => response.json())
      .then(data => {
        gradeData = data;
        loadState();
        renderCurricularMatrix();
        // Garante que os botões estejam visíveis
        [btnCompact, btnExport, btnPopup, btnReset].forEach(b => b.style.display = 'inline-block');
      })
      .catch(error => console.error("Erro ao carregar o arquivo JSON:", error));
  };
  
  // Função para marcar/desmarcar semestre inteiro
  const markSemesterComplete = (periodo) => {
      const disciplinas = gradeData.grade_curricular[periodo];
      
      // Verifica se TODAS as disciplinas desse período já estão marcadas
      const allCompleted = disciplinas.every(d => completedCourses.has(d.nome));
      
      let hasChanges = false;
      
      if (allCompleted) {
          // Se todas estão marcadas, DESMARCA todas
          disciplinas.forEach(d => {
              if (completedCourses.has(d.nome)) {
                  completedCourses.delete(d.nome);
                  hasChanges = true;
              }
          });
      } else {
          // Se alguma não estiver marcada, MARCA todas (que faltam)
          disciplinas.forEach(d => {
              // Simplificação: ignora verificações complexas de limite de optativas no "marcar tudo"
              // para garantir usabilidade fluida. O usuário pode desmarcar manualmente se necessário.
              if (!completedCourses.has(d.nome)) {
                   completedCourses.add(d.nome);
                   hasChanges = true;
              }
          });
      }
      
      if(hasChanges) {
          saveState();
          // Atualiza visualmente apenas as disciplinas da coluna para não perder scroll/foco
          const columns = container.querySelectorAll('.column');
          columns.forEach(col => {
              if (col.querySelector('h2').textContent.includes(periodo)) {
                  const blocks = col.querySelectorAll('.disciplina');
                  blocks.forEach(block => {
                      const nome = block.dataset.nome;
                      if (completedCourses.has(nome)) {
                          block.classList.add('completed');
                      } else {
                          block.classList.remove('completed');
                      }
                  });
              }
          });
      }
  };

  const calculateProgress = () => {
    const progress = {};
    const requisitos = gradeData.requisitos_conclusao;

    // Inicializa as categorias de progresso
    for (const req in requisitos) {
        if (req !== 'total') {
            progress[req] = {
                completedHours: 0,
                totalHours: parseInt(requisitos[req].ch_prevista) || 0
            };
        }
    }
    
    const allDisciplines = Object.values(gradeData.grade_curricular).flat();
    const optativasList = gradeData.grade_curricular["Optativas"] || [];

    completedCourses.forEach(courseName => {
        const disciplina = allDisciplines.find(d => d.nome === courseName);
        if(!disciplina) return;
        
        let reqCategory = "Disciplinas Obrigatórias";
        
        if (disciplina.nome === "TRABALHO DE CONCLUSÃO DE CURSO") {
            reqCategory = "Disciplinas de TCC";
        } 
        else if (disciplina.nome === "OPTATIVA I" || disciplina.nome === "OPTATIVA II") {
            reqCategory = "Disciplinas Optativas";
        }
        else if (optativasList.some(d => d.nome === courseName)) {
            return; 
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
    
    let csvContent = `\uFEFF${periodOrder.join(';')}\n`;

    for (let i = 0; i < maxRows; i++) {
        const row = periodOrder.map(periodo => {
            const subjects = periodMap.get(periodo);
            const subject = subjects[i] || "";
            return `"${subject.replace(/"/g, '""')}"`;
        });
        csvContent += row.join(';') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `grade_engenharia_mecanica_${exportType}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  
  const printGrade = () => {
    hideAllPopups();
    if (container.classList.contains("compact")) {
        container.classList.remove("compact");
        updateCompactView();
    }
    setTimeout(() => window.print(), 300);
  };
  
  // -- EVENT LISTENERS --
  
  darkModeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    updateDarkModeButton();
    saveState();
  });

  btnCompact.addEventListener("click", () => {
    container.classList.toggle("compact");
    updateCompactView();
  });
  
  // Botão Reset
  btnReset.addEventListener("click", () => showPopup(resetPopup));
  btnConfirmReset.addEventListener("click", () => {
      completedCourses.clear();
      saveState();
      renderCurricularMatrix();
      hideAllPopups();
  });
  
  // Botão Forçar Conclusão (no popup de pré-requisitos)
  btnForceComplete.addEventListener("click", () => {
      if(pendingDisciplineNode) {
          const nome = pendingDisciplineNode.dataset.nome;
          completedCourses.add(nome);
          pendingDisciplineNode.classList.add('completed');
          saveState();
          hideAllPopups();
      }
  });

  // Listener Principal da Grade
  container.addEventListener("click", (e) => {
    const block = e.target.closest(".disciplina");
    if (!block) return;
    
    // Ação: Marcar como concluído
    if (e.target.matches('.complete-button')) {
        e.stopPropagation(); 
        const disciplinaNome = block.dataset.nome;
        
        // 1. Se estiver desmarcando, é direto
        if (completedCourses.has(disciplinaNome)) {
            completedCourses.delete(disciplinaNome);
            block.classList.remove('completed');
            saveState();
            return;
        }

        // 2. Verificação de Limite de Optativas
        const isOptativaEspecifica = gradeData.grade_curricular["Optativas"]?.some(d => d.nome === disciplinaNome);
        if (isOptativaEspecifica) {
            let optativasFeitas = 0;
            completedCourses.forEach(c => {
                if (gradeData.grade_curricular["Optativas"]?.some(d => d.nome === c)) optativasFeitas++;
            });
            if (optativasFeitas >= 2) {
                showPopup(optativePopup);
                return;
            }
        }

        // 3. Verificação de Pré-Requisitos
        const preReqs = JSON.parse(block.dataset.preRequisitos);
        const missingPreReqs = preReqs.filter(req => !completedCourses.has(req));

        if (missingPreReqs.length > 0) {
            // Mostrar Popup de Pré-requisitos
            pendingDisciplineNode = block; // Salva quem foi clicado
            document.getElementById('prereq-target-name').textContent = block.dataset.apelido || disciplinaNome;
            
            const list = document.getElementById('prereq-list');
            list.innerHTML = "";
            missingPreReqs.forEach(req => {
                const li = document.createElement('li');
                li.textContent = req;
                list.appendChild(li);
            });
            
            showPopup(prereqPopup);
            return;
        }

        // Se passou por tudo, marca
        completedCourses.add(disciplinaNome);
        block.classList.add("completed");
        saveState();
        return;
    }
    
    // Ação: Destacar pré/co-requisitos (Clique no corpo do card)
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
  
  if(btnPrintPdf) {
      btnPrintPdf.addEventListener("click", printGrade);
  }

  exportPopup.addEventListener('click', (e) => {
      if(e.target.matches('[data-export-type]')) {
          generateCsv(e.target.dataset.exportType);
          hideAllPopups();
      }
  });

  document.querySelectorAll('.close-popup').forEach(btn => btn.addEventListener('click', hideAllPopups));
  popupOverlay.addEventListener('click', hideAllPopups);

  loadCourseData();
});
