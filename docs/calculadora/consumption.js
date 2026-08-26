const consumptionForm = document.getElementById('consumption-form');
const consumptionMonthlyFeeInput = document.getElementById('consumption-monthly-fee');
const cancellationDateInput = document.getElementById('cancellation-date');
const nextInvoiceDateInput = document.getElementById('next-invoice-date');
const consumptionConfirmCheckbox = document.getElementById('consumption-confirm-checkbox');
const consumptionMonthlyFeeError = document.getElementById('consumption-monthly-fee-error');
const consumptionDateError = document.getElementById('consumption-date-error');
const consumptionCheckboxError = document.getElementById('consumption-checkbox-error');

const consumptionEmptyState = document.getElementById('consumption-empty-state');
const consumptionResultContent = document.getElementById('consumption-result-content');
const consumptionResultStatus = document.getElementById('consumption-result-status');
const consumptionHighlightLabel = document.getElementById('consumption-highlight-label');
const consumptionFinalValueEl = document.getElementById('consumption-final-value');
const consumptionResultMessageEl = document.getElementById('consumption-result-message');

const consumptionSummaryMonthlyFee = document.getElementById('consumption-summary-monthly-fee');
const consumptionSummaryCancellationDate = document.getElementById('consumption-summary-cancellation-date');
const consumptionSummaryNextInvoiceDate = document.getElementById('consumption-summary-next-invoice-date');
const consumptionSummaryDaysConsumed = document.getElementById('consumption-summary-days-consumed');
const consumptionSummaryDaysRemaining = document.getElementById('consumption-summary-days-remaining');
const consumptionSummaryDailyValue = document.getElementById('consumption-summary-daily-value');
const consumptionSummaryFinalValue = document.getElementById('consumption-summary-final-value');

const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
});

function parseFullDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function formatFullDate(dateData) {
  return fullDateFormatter.format(new Date(dateData.year, dateData.month - 1, dateData.day));
}

// Regra de negócio: mês comercial de 30 dias, independentemente do mês ter 28,
// 29, 30 ou 31 dias no calendário.
function getCommercialDayDifference(fromDate, toDate) {
  const monthDifference = getMonthDifference(
    { year: fromDate.year, month: fromDate.month },
    { year: toDate.year, month: toDate.month }
  );

  return (monthDifference * 30) + (toDate.day - fromDate.day);
}

function validateConsumptionMonthlyFee(monthlyFee) {
  if (!consumptionMonthlyFeeInput.value.trim()) {
    return 'Informe o valor da mensalidade.';
  }

  if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
    return 'Informe um valor válido maior que zero.';
  }

  return '';
}

function validateConsumptionDates(cancellationDate, nextInvoiceDate) {
  if (!cancellationDate || !nextInvoiceDate) {
    return 'Informe a data de cancelamento e a data do próximo boleto.';
  }

  const daysRemaining = getCommercialDayDifference(cancellationDate, nextInvoiceDate);

  if (daysRemaining < 0) {
    return 'A data do próximo boleto não pode ser anterior à data de cancelamento.';
  }

  if (daysRemaining > 30) {
    return 'A data do próximo boleto deve estar dentro do ciclo atual (até 30 dias após o cancelamento).';
  }

  return '';
}

function validateConsumptionCheckbox() {
  if (!consumptionConfirmCheckbox.checked) {
    return 'Confirme que o período condiz com o consumo real do cliente antes de continuar.';
  }

  return '';
}

function renderConsumptionResult({
  monthlyFee,
  cancellationDate,
  nextInvoiceDate,
  daysConsumed,
  daysRemaining,
  dailyValue,
  proportionalAmount
}) {
  consumptionEmptyState.classList.add('hidden');
  consumptionResultContent.classList.remove('hidden');
  consumptionResultContent.classList.remove('change-addition', 'change-discount', 'change-none');
  consumptionResultContent.classList.add('change-addition');

  consumptionResultStatus.className = 'status-pill status-addition';
  consumptionResultStatus.textContent = 'Proporcional calculado';

  consumptionHighlightLabel.textContent = 'Valor proporcional de consumo';
  consumptionFinalValueEl.textContent = formatCurrency(proportionalAmount);
  consumptionResultMessageEl.textContent =
    `O cliente consumiu ${daysConsumed} ${daysConsumed === 1 ? 'dia' : 'dias'} do ciclo atual, equivalente a ${formatCurrency(proportionalAmount)}.`;

  consumptionSummaryMonthlyFee.textContent = formatCurrency(monthlyFee);
  consumptionSummaryCancellationDate.textContent = formatFullDate(cancellationDate);
  consumptionSummaryNextInvoiceDate.textContent = formatFullDate(nextInvoiceDate);
  consumptionSummaryDaysConsumed.textContent = `${daysConsumed} ${daysConsumed === 1 ? 'dia' : 'dias'}`;
  consumptionSummaryDaysRemaining.textContent = `${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
  consumptionSummaryDailyValue.textContent = formatCurrency(dailyValue);
  consumptionSummaryFinalValue.textContent = formatCurrency(proportionalAmount);
}

consumptionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const monthlyFee = parseBrazilianCurrency(consumptionMonthlyFeeInput.value);
  const monthlyFeeValidationMessage = validateConsumptionMonthlyFee(monthlyFee);
  const cancellationDate = parseFullDate(cancellationDateInput.value);
  const nextInvoiceDate = parseFullDate(nextInvoiceDateInput.value);
  const dateValidationMessage = validateConsumptionDates(cancellationDate, nextInvoiceDate);

  if (monthlyFeeValidationMessage) {
    consumptionMonthlyFeeError.textContent = monthlyFeeValidationMessage;
    consumptionMonthlyFeeInput.focus();
    return;
  }

  consumptionMonthlyFeeError.textContent = '';

  if (dateValidationMessage) {
    consumptionDateError.textContent = dateValidationMessage;
    cancellationDateInput.focus();
    return;
  }

  consumptionDateError.textContent = '';

  const checkboxValidationMessage = validateConsumptionCheckbox();

  if (checkboxValidationMessage) {
    consumptionCheckboxError.textContent = checkboxValidationMessage;
    consumptionConfirmCheckbox.focus();
    return;
  }

  consumptionCheckboxError.textContent = '';

  const daysRemaining = getCommercialDayDifference(cancellationDate, nextInvoiceDate);
  const daysConsumed = 30 - daysRemaining;
  const dailyValue = monthlyFee / 30;
  const proportionalAmount = dailyValue * daysConsumed;

  renderConsumptionResult({
    monthlyFee,
    cancellationDate,
    nextInvoiceDate,
    daysConsumed,
    daysRemaining,
    dailyValue,
    proportionalAmount
  });
});

consumptionMonthlyFeeInput.addEventListener('input', () => {
  consumptionMonthlyFeeError.textContent = '';
});

cancellationDateInput.addEventListener('input', () => {
  consumptionDateError.textContent = '';
});

nextInvoiceDateInput.addEventListener('input', () => {
  consumptionDateError.textContent = '';
});

consumptionConfirmCheckbox.addEventListener('change', () => {
  consumptionCheckboxError.textContent = '';
});
