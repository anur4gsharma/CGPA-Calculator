// ── Grade Point Map ──
const GRADES = [
  { label: 'A+ / AA', value: 10 },
  { label: 'A  / AB', value: 9  },
  { label: 'B+ / BB', value: 8  },
  { label: 'B  / BC', value: 7  },
  { label: 'C+ / CC', value: 6  },
  { label: 'C  / CD', value: 5  },
  { label: 'D  / DD', value: 4  },
  { label: 'F  / FF', value: 0  },
];

// ── State ──
let totalSemesters = 1;
let activeSemester = 0; // 0-indexed
let semesterData = [];  // [ [ {name, credits, grade}, ... ], ... ]

// ── DOM Refs ──
const $semCount    = document.getElementById('sem-count');
const $semMinus    = document.getElementById('sem-minus');
const $semPlus     = document.getElementById('sem-plus');
const $btnStart    = document.getElementById('btn-start');
const $viewSetup   = document.getElementById('view-setup');
const $viewCalc    = document.getElementById('view-calc');
const $btnBack     = document.getElementById('btn-back');
const $semTabs     = document.getElementById('semester-tabs');
const $semTitle    = document.getElementById('sem-title');
const $subjectList = document.getElementById('subject-list');
const $btnAdd      = document.getElementById('btn-add-subject');
const $sgpaValue   = document.getElementById('sgpa-value');
const $cgpaValue   = document.getElementById('cgpa-value');
const $sgpaDetail  = document.getElementById('sgpa-detail');
const $cgpaDetail  = document.getElementById('cgpa-detail');

// ── View 1: Semester Count ──
$semMinus.addEventListener('click', () => {
  if (totalSemesters > 1) {
    totalSemesters--;
    $semCount.textContent = totalSemesters;
  }
});

$semPlus.addEventListener('click', () => {
  if (totalSemesters < 12) {
    totalSemesters++;
    $semCount.textContent = totalSemesters;
  }
});

$btnStart.addEventListener('click', () => {
  // Initialize semester data
  semesterData = Array.from({ length: totalSemesters }, () => [
    { name: '', credits: '', grade: 10 },
  ]);
  activeSemester = 0;
  switchView('calc');
});

$btnBack.addEventListener('click', () => switchView('setup'));

// ── View Switching ──
function switchView(view) {
  if (view === 'calc') {
    $viewSetup.classList.remove('active');
    $viewCalc.classList.remove('active');
    // Force reflow for animation
    void $viewCalc.offsetWidth;
    $viewCalc.classList.add('active');
    renderTabs();
    renderSubjects();
    calculate();
  } else {
    $viewCalc.classList.remove('active');
    $viewSetup.classList.remove('active');
    void $viewSetup.offsetWidth;
    $viewSetup.classList.add('active');
  }
}

// ── Tabs ──
function renderTabs() {
  $semTabs.innerHTML = '';
  for (let i = 0; i < totalSemesters; i++) {
    const tab = document.createElement('button');
    tab.className = 'sem-tab' + (i === activeSemester ? ' active' : '');
    tab.textContent = `Sem ${i + 1}`;
    tab.addEventListener('click', () => {
      activeSemester = i;
      renderTabs();
      renderSubjects();
      calculate();
    });
    $semTabs.appendChild(tab);
  }
  $semTitle.textContent = `Semester ${activeSemester + 1} — Subjects`;
}

// ── Subjects ──
function renderSubjects() {
  $subjectList.innerHTML = '';
  const subjects = semesterData[activeSemester];

  subjects.forEach((subj, idx) => {
    const row = document.createElement('div');
    row.className = 'subject-row';

    // Name
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = `Subject ${idx + 1}`;
    nameInput.value = subj.name;
    nameInput.id = `subj-name-${activeSemester}-${idx}`;
    nameInput.addEventListener('input', (e) => {
      subj.name = e.target.value;
    });

    // Credits
    const credInput = document.createElement('input');
    credInput.type = 'number';
    credInput.placeholder = 'Cr';
    credInput.min = '1';
    credInput.max = '20';
    credInput.value = subj.credits;
    credInput.id = `subj-cred-${activeSemester}-${idx}`;
    credInput.addEventListener('input', (e) => {
      subj.credits = e.target.value;
      calculate();
    });

    // Grade
    const gradeSelect = document.createElement('select');
    gradeSelect.id = `subj-grade-${activeSemester}-${idx}`;
    GRADES.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.value;
      opt.textContent = g.label;
      if (g.value === subj.grade) opt.selected = true;
      gradeSelect.appendChild(opt);
    });
    gradeSelect.addEventListener('change', (e) => {
      subj.grade = parseInt(e.target.value);
      calculate();
    });

    // Delete
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.innerHTML = '×';
    delBtn.title = 'Remove subject';
    delBtn.id = `subj-del-${activeSemester}-${idx}`;
    delBtn.addEventListener('click', () => {
      if (subjects.length > 1) {
        subjects.splice(idx, 1);
        renderSubjects();
        calculate();
      }
    });

    row.append(nameInput, credInput, gradeSelect, delBtn);
    $subjectList.appendChild(row);
  });
}

// ── Add Subject ──
$btnAdd.addEventListener('click', () => {
  semesterData[activeSemester].push({ name: '', credits: '', grade: 10 });
  renderSubjects();
  // Focus the new name input
  const last = $subjectList.lastElementChild;
  if (last) last.querySelector('input').focus();
});

// ── Calculation ──
function calculate() {
  // SGPA for active semester
  const sgpa = calcSGPA(semesterData[activeSemester]);

  // CGPA across all semesters
  let totalGradePoints = 0;
  let totalCredits = 0;
  for (let i = 0; i < totalSemesters; i++) {
    const sems = semesterData[i];
    sems.forEach(subj => {
      const cr = parseFloat(subj.credits);
      if (!isNaN(cr) && cr > 0) {
        totalGradePoints += cr * subj.grade;
        totalCredits += cr;
      }
    });
  }
  const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits) : null;

  // Display
  if (sgpa !== null) {
    $sgpaValue.textContent = sgpa.toFixed(2);
    const semSubjs = semesterData[activeSemester];
    const semCr = semSubjs.reduce((s, sub) => { const c = parseFloat(sub.credits); return s + (isNaN(c) ? 0 : c); }, 0);
    $sgpaDetail.textContent = `${semCr} credits`;
  } else {
    $sgpaValue.textContent = '—';
    $sgpaDetail.textContent = 'Enter credits';
  }

  if (cgpa !== null) {
    $cgpaValue.textContent = cgpa.toFixed(2);
    $cgpaDetail.textContent = `${totalCredits} total credits`;
  } else {
    $cgpaValue.textContent = '—';
    $cgpaDetail.textContent = 'Enter credits';
  }
}

function calcSGPA(subjects) {
  let totalGP = 0;
  let totalCr = 0;
  subjects.forEach(subj => {
    const cr = parseFloat(subj.credits);
    if (!isNaN(cr) && cr > 0) {
      totalGP += cr * subj.grade;
      totalCr += cr;
    }
  });
  return totalCr > 0 ? (totalGP / totalCr) : null;
}
