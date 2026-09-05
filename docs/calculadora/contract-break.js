const CONTRACT_TERM_MONTHS = 12;

const contractForm = document.getElementById('contract-form');
const contractValueSelect = document.getElementById('contract-value-select');
const customValueGroup = document.getElementById('custom-value-group');
const customContractValueInput = document.getElementById('custom-contract-value');
const signingDateInput = document.getElementById('signing-date');
const contractDueDaySelect = document.getElementById('contract-due-day');
const referenceMonthInput = document.getElementById('reference-month');
const contractValueError = document.getElementById('contract-value-error');
const contractDateError = document.getElementById('contract-date-error');

const contractEmptyState = document.getElementById('contract-empty-state');
const contractResultContent = document.getElementById('contract-result-content');
const contractResultStatus = document.getElementById('contract-result-status');
const contractHighlightLabel = document.getElementById('contract-highlight-label');
const contractFinalValueEl = document.getElementById('contract-final-value');
const contractResultMessageEl = document.getElementById('contract-result-message');

const contractSummaryReferenceValue = document.getElementById('contract-summary-reference-value');
const contractSummarySigningDate = document.getElementById('contract-summary-signing-date');
const contractSummaryDueDay = document.getElementById('contract-summary-due-day');
const contractSummaryReferenceMonth = document.getElementById('contract-summary-reference-month');
const contractSummaryMonthsCompleted = document.getElementById('contract-summary-months-completed');
const contractSummaryMonthsRemaining = document.getElementById('contract-summary-months-remaining');
const contractSummaryFinalValue = document.getElementById('contract-summary-final-value');

function setDefaultReferenceMonth() {
  if (!referenceMonthInput.value) {
    referenceMonthInput.value = getCurrentMonthValue();
  }
}

function parseSigningDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function getContractReferenceValue() {
  if (contractValueSelect.value === 'custom') {
    return parseBrazilianCurrency(customContractValueInput.value);
  }

  return Number(contractValueSelect.value);
}

function validateContractValue(referenceValue) {
  if (contractValueSelect.value === 'custom' && !customContractValueInput.value.trim()) {
    return 'Informe o valor personalizado da quebra de contrato.';
  }

  if (!Number.isFinite(referenceValue) || referenceValue <= 0) {
    return 'Informe um valor válido maior que zero.';
  }

  return '';
}

function validateContractDates(signingDate, referenceMonth) {
  if (!signingDate || !referenceMonth) {
    return 'Informe a data de assinatura e o mês de referência.';
  }

  const signingMonth = { year: signingDate.year, month: signingDate.month };

  if (getMonthDifference(signingMonth, referenceMonth) < 0) {
    return 'O mês de referência não pode ser anterior ao mês de assinatura do contrato.';
  }

  return '';
}

// Regra de negócio: se o dia de vencimento da mensalidade for maior que o dia de
// assinatura, o mês de referência já ultrapassou o aniversário do contrato e conta
// como cumprido (não é desconsiderado).
function getMonthsCompleted(signingDate, dueDay, referenceMonth) {
  const signingMonth = { year: signingDate.year, month: signingDate.month };
  const baseMonths = getMonthDifference(signingMonth, referenceMonth);
  const extraMonth = dueDay > signingDate.day ? 1 : 0;

  return Math.min(Math.max(baseMonths + extraMonth, 0), CONTRACT_TERM_MONTHS);
}

function setContractStatus(hasPenalty) {
  contractResultStatus.className = 'status-pill';

  if (hasPenalty) {
    contractResultStatus.classList.add('status-addition');
    contractResultStatus.textContent = 'Multa aplicável';
    return;
  }

  contractResultStatus.classList.add('status-none');
  contractResultStatus.textContent = 'Sem multa';
}

function getContractResultMessage(monthsCompleted, finalValue) {
  if (monthsCompleted >= CONTRACT_TERM_MONTHS) {
    return 'O contrato já cumpriu os 12 meses de vigência. Não há multa por quebra de contrato.';
  }

  return `O cliente terá multa proporcional de ${formatCurrency(finalValue)} pela quebra de contrato.`;
}

function renderContractResult({
  referenceValue,
  signingDate,
  contractDueDay,
  referenceMonth,
  monthsCompleted,
  monthsRemaining,
  finalValue
}) {
  contractEmptyState.classList.add('hidden');
  contractResultContent.classList.remove('hidden');
  contractResultContent.classList.remove('change-addition', 'change-none');

  const hasPenalty = monthsCompleted < CONTRACT_TERM_MONTHS;
  contractResultContent.classList.add(hasPenalty ? 'change-addition' : 'change-none');
  setContractStatus(hasPenalty);

  contractHighlightLabel.textContent = hasPenalty ? 'Valor da multa' : 'Contrato cumprido';
  contractFinalValueEl.textContent = formatCurrency(finalValue);
  contractResultMessageEl.textContent = getContractResultMessage(monthsCompleted, finalValue);

  contractSummaryReferenceValue.textContent = formatCurrency(referenceValue);
  contractSummarySigningDate.textContent = formatDueDate(signingDate.day, {
    year: signingDate.year,
    month: signingDate.month
  });
  contractSummaryDueDay.textContent = `Dia ${contractDueDay}`;
  contractSummaryReferenceMonth.textContent = monthFormatter.format(
    new Date(referenceMonth.year, referenceMonth.month - 1, 1)
  );
  contractSummaryMonthsCompleted.textContent = `${monthsCompleted} de ${CONTRACT_TERM_MONTHS}`;
  contractSummaryMonthsRemaining.textContent = `${monthsRemaining} de ${CONTRACT_TERM_MONTHS}`;
  contractSummaryFinalValue.textContent = formatCurrency(finalValue);
}

contractValueSelect.addEventListener('change', () => {
  const isCustom = contractValueSelect.value === 'custom';
  customValueGroup.classList.toggle('hidden', !isCustom);
  contractValueError.textContent = '';
});

contractForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const referenceValue = getContractReferenceValue();
  const contractValueValidationMessage = validateContractValue(referenceValue);
  const signingDate = parseSigningDate(signingDateInput.value);
  const referenceMonth = parseMonthValue(referenceMonthInput.value);
  const dateValidationMessage = validateContractDates(signingDate, referenceMonth);

  if (contractValueValidationMessage) {
    contractValueError.textContent = contractValueValidationMessage;
    (contractValueSelect.value === 'custom' ? customContractValueInput : contractValueSelect).focus();
    return;
  }

  contractValueError.textContent = '';

  if (dateValidationMessage) {
    contractDateError.textContent = dateValidationMessage;
    signingDateInput.focus();
    return;
  }

  contractDateError.textContent = '';

  const contractDueDay = Number(contractDueDaySelect.value);
  const monthsCompleted = getMonthsCompleted(signingDate, contractDueDay, referenceMonth);
  const monthsRemaining = CONTRACT_TERM_MONTHS - monthsCompleted;
  const finalValue = referenceValue * (monthsRemaining / CONTRACT_TERM_MONTHS);

  renderContractResult({
    referenceValue,
    signingDate,
    contractDueDay,
    referenceMonth,
    monthsCompleted,
    monthsRemaining,
    finalValue
  });
});

customContractValueInput.addEventListener('input', () => {
  contractValueError.textContent = '';
});

signingDateInput.addEventListener('input', () => {
  contractDateError.textContent = '';
});

referenceMonthInput.addEventListener('input', () => {
  contractDateError.textContent = '';
});

setDefaultReferenceMonth();

// --- Botão "Limpar": reseta o formulário e volta ao estado inicial. ---
// Não altera nenhuma lógica de cálculo existente acima, só adiciona
// um novo comportamento independente.
const clearContractButton = document.getElementById('clear-contract');

if (clearContractButton) {
  clearContractButton.addEventListener('click', () => {
    contractValueSelect.value = '790';
    customContractValueInput.value = '';
    customValueGroup.classList.add('hidden');
    contractValueError.textContent = '';

    signingDateInput.value = '';
    signingDateInput.dispatchEvent(new Event('change', { bubbles: true }));

    contractDueDaySelect.value = '1';
    contractDueDaySelect.dispatchEvent(new Event('change', { bubbles: true }));

    referenceMonthInput.value = '';
    setDefaultReferenceMonth();
    referenceMonthInput.dispatchEvent(new Event('change', { bubbles: true }));

    contractDateError.textContent = '';

    contractResultContent.classList.add('hidden');
    contractResultContent.classList.remove('change-addition', 'change-none');
    contractEmptyState.classList.remove('hidden');
    contractResultStatus.className = 'status-pill status-neutral';
    contractResultStatus.textContent = 'Aguardando';
  });
}
