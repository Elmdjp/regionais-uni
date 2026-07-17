const form = document.getElementById('calculator-form');
const monthlyFeeInput = document.getElementById('monthly-fee');
const currentDueDaySelect = document.getElementById('current-due-day');
const currentDueMonthInput = document.getElementById('current-due-month');
const newDueDaySelect = document.getElementById('new-due-day');
const newDueMonthInput = document.getElementById('new-due-month');
const monthlyFeeError = document.getElementById('monthly-fee-error');
const dateError = document.getElementById('date-error');

const emptyState = document.getElementById('empty-state');
const resultContent = document.getElementById('result-content');
const resultStatus = document.getElementById('result-status');
const changeTypeLabel = document.getElementById('change-type-label');
const proportionalValue = document.getElementById('proportional-value');
const resultMessage = document.getElementById('result-message');

const summaryMonthlyFee = document.getElementById('summary-monthly-fee');
const summaryCurrentDay = document.getElementById('summary-current-day');
const summaryNewDay = document.getElementById('summary-new-day');
const summaryDayDifference = document.getElementById('summary-day-difference');
const summaryDailyValue = document.getElementById('summary-daily-value');
const summaryChangeType = document.getElementById('summary-change-type');
const summaryFinalValue = document.getElementById('summary-final-value');

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric'
});

function getCurrentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}`;
}

function setDefaultMonths() {
  const currentMonth = getCurrentMonthValue();

  if (!currentDueMonthInput.value) {
    currentDueMonthInput.value = currentMonth;
  }

  if (!newDueMonthInput.value) {
    newDueMonthInput.value = currentMonth;
  }
}

function parseBrazilianCurrency(value) {
  const compactValue = value
    .trim()
    .replace(/\s/g, '');

  // Aceita formatos comuns: 100,00, 100.00, 1.000,50 e 1000.
  if (compactValue.includes(',')) {
    return Number(compactValue.replace(/\./g, '').replace(',', '.'));
  }

  return Number(compactValue);
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function parseMonthValue(value) {
  const [year, month] = value.split('-').map(Number);

  if (!year || !month) {
    return null;
  }

  return { year, month };
}

function getMonthDifference(currentMonth, newMonth) {
  return ((newMonth.year - currentMonth.year) * 12) + (newMonth.month - currentMonth.month);
}

function formatDueDate(day, monthData) {
  const date = new Date(monthData.year, monthData.month - 1, 1);
  const formattedMonth = monthFormatter.format(date);

  return `Dia ${day} de ${formattedMonth}`;
}

function setStatus(type) {
  resultStatus.className = 'status-pill';

  if (type === 'acréscimo') {
    resultStatus.classList.add('status-addition');
    resultStatus.textContent = 'Acréscimo';
    return;
  }

  if (type === 'desconto') {
    resultStatus.classList.add('status-discount');
    resultStatus.textContent = 'Desconto';
    return;
  }

  resultStatus.classList.add('status-none');
  resultStatus.textContent = 'Sem alteração';
}

function validateMonthlyFee(monthlyFee) {
  if (!monthlyFeeInput.value.trim()) {
    return 'Informe o valor da mensalidade.';
  }

  if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
    return 'Informe um valor válido maior que zero.';
  }

  return '';
}

function validateDueMonths(currentMonth, newMonth) {
  if (!currentMonth || !newMonth) {
    return 'Informe o mês atual e o mês da nova data de vencimento.';
  }

  return '';
}

function getChangeType(dayDifference) {
  if (dayDifference > 0) {
    return 'acréscimo';
  }

  if (dayDifference < 0) {
    return 'desconto';
  }

  return 'sem alteração';
}

function getResultMessage(changeType, proportionalAmount) {
  if (changeType === 'acréscimo') {
    return `O cliente terá acréscimo proporcional de ${formatCurrency(proportionalAmount)}.`;
  }

  if (changeType === 'desconto') {
    return `O cliente terá desconto proporcional de ${formatCurrency(proportionalAmount)}.`;
  }

  return 'Não há alteração proporcional para datas de vencimento iguais.';
}

function renderResult({
  monthlyFee,
  currentDueDay,
  currentDueMonth,
  newDueDay,
  newDueMonth,
  dayDifference,
  dailyValue,
  changeType,
  proportionalAmount,
  finalEstimatedValue
}) {
  emptyState.classList.add('hidden');
  resultContent.classList.remove('hidden');
  resultContent.classList.remove('change-addition', 'change-discount', 'change-none');
  resultContent.classList.add(`change-${changeType === 'acréscimo' ? 'addition' : changeType === 'desconto' ? 'discount' : 'none'}`);
  setStatus(changeType);

  changeTypeLabel.textContent = `Tipo de alteração: ${changeType}`;
  proportionalValue.textContent = formatCurrency(proportionalAmount);
  resultMessage.textContent = getResultMessage(changeType, proportionalAmount);

  summaryMonthlyFee.textContent = formatCurrency(monthlyFee);
  summaryCurrentDay.textContent = formatDueDate(currentDueDay, currentDueMonth);
  summaryNewDay.textContent = formatDueDate(newDueDay, newDueMonth);
  summaryDayDifference.textContent = `${dayDifference} ${Math.abs(dayDifference) === 1 ? 'dia' : 'dias'}`;
  summaryDailyValue.textContent = formatCurrency(dailyValue);
  summaryChangeType.textContent = changeType;
  summaryFinalValue.textContent = formatCurrency(finalEstimatedValue);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const monthlyFee = parseBrazilianCurrency(monthlyFeeInput.value);
  const validationMessage = validateMonthlyFee(monthlyFee);
  const currentDueMonth = parseMonthValue(currentDueMonthInput.value);
  const newDueMonth = parseMonthValue(newDueMonthInput.value);
  const dateValidationMessage = validateDueMonths(currentDueMonth, newDueMonth);

  if (validationMessage) {
    monthlyFeeError.textContent = validationMessage;
    monthlyFeeInput.focus();
    return;
  }

  monthlyFeeError.textContent = '';

  if (dateValidationMessage) {
    dateError.textContent = dateValidationMessage;
    currentDueMonthInput.focus();
    return;
  }

  dateError.textContent = '';

  const currentDueDay = Number(currentDueDaySelect.value);
  const newDueDay = Number(newDueDaySelect.value);

  // Regra de negócio: mês comercial de 30 dias.
  const monthDifference = getMonthDifference(currentDueMonth, newDueMonth);
  const dayDifference = (monthDifference * 30) + (newDueDay - currentDueDay);
  const dailyValue = monthlyFee / 30;
  const changeType = getChangeType(dayDifference);
  const proportionalAmount = Math.abs(dailyValue * dayDifference);
  const finalEstimatedValue = proportionalAmount;

  renderResult({
    monthlyFee,
    currentDueDay,
    currentDueMonth,
    newDueDay,
    newDueMonth,
    dayDifference,
    dailyValue,
    changeType,
    proportionalAmount,
    finalEstimatedValue
  });
});

monthlyFeeInput.addEventListener('input', () => {
  monthlyFeeError.textContent = '';
});

currentDueMonthInput.addEventListener('input', () => {
  dateError.textContent = '';
});

newDueMonthInput.addEventListener('input', () => {
  dateError.textContent = '';
});

setDefaultMonths();
