# 🎓 Grade Curricular - Engenharia Mecânica UFR

Uma aplicação web interativa e responsiva desenvolvida para auxiliar estudantes de **Engenharia Mecânica da Universidade Federal de Rondonópolis (UFR)** a rastrear, planejar e visualizar o progresso de sua graduação.

**🔗 [Acessar a Aplicação Online](https://shaiderwow.github.io/matrizcurricular/)**

---

## 🚀 Funcionalidades

* **Rastreamento Interativo:** Marque e desmarque disciplinas concluídas com um clique. O progresso é salvo automaticamente no seu navegador (via `localStorage`).
* **Gestão de Pré-requisitos:**
    * Ao clicar no cartão de uma disciplina, o sistema destaca visualmente em **vermelho** os pré-requisitos necessários e em **verde** as matérias que ela libera.
    * Alertas automáticos se você tentar concluir uma disciplina sem ter finalizado seus pré-requisitos.
* **Cálculo de Progresso:** Visualize a carga horária concluída em relação à carga horária exigida para Disciplinas Obrigatórias, Optativas, TCC e Atividades Complementares.
* **Gestão de Optativas:** O sistema monitora o limite de disciplinas optativas específicas e avisa quando o limite (2 disciplinas) é atingido.
* **Exportação de Dados:**
    * **Geração de PDF:** Imprima ou salve sua grade em PDF com um layout limpo, focado apenas nas disciplinas e no seu status.
    * **Exportação CSV:** Baixe planilhas separadas com as disciplinas pendentes, concluídas ou a grade completa.
* **Acessibilidade e Design:** Suporte nativo para **Modo Claro** e **Modo Escuro**, além de um layout flexível que se adapta a dispositivos móveis e desktops.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias web puras (Vanilla), sem dependência de frameworks pesados:

* **HTML5:** Estruturação semântica e interface de popups.
* **CSS3:** Estilização com variáveis para temas claro/escuro, Flexbox e Media Queries para responsividade.
* **JavaScript (ES6):** Manipulação de DOM, lógica de pré-requisitos, manipulação de arquivos (CSV) e armazenamento local.
* **JSON:** A grade curricular inteira (períodos, disciplinas, cargas horárias e dependências) é alimentada de forma dinâmica através do arquivo `dataEM.json`.

---

## 📁 Estrutura do Projeto

* `index.html`: Estrutura principal da página, botões de ação e modais (popups).
* `style.css`: Folha de estilos contendo o design da aplicação, transições e regras específicas para impressão (`@media print`).
* `script.js`: O motor da aplicação. Gerencia eventos de clique, renderização da matriz baseada no JSON e lógicas de validação acadêmica.
* `dataEM.json`: Banco de dados estático que armazena todas as informações das disciplinas organizadas do 1º ao 10º período, além da lista de optativas e requisitos de conclusão.

1. Clone o repositório:
   ```bash
   git clone [https://github.com/SHAIDERWOW/matrizcurricular.git](https://github.com/SHAIDERWOW/matrizcurricular.git)
