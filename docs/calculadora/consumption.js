const consumptionForm = document.getElementById('consumption-form');
const consumptionMonthlyFeeInput = document.getElementById('consumption-monthly-fee');
const consumptionMatchYesRadio = document.getElementById('consumption-match-yes');
const consumptionMatchNoRadio = document.getElementById('consumption-match-no');
const consumptionRequestDates = document.getElementById('consumption-request-dates');
const consumptionManualDates = document.getElementById('consumption-manual-dates');
const cancellationDateInput = document.getElementById('cancellation-date');
const nextInvoiceDateInput = document.getElementById('next-invoice-date');
const lastDueDateInput = document.getElementById('last-due-date');
const lastConsumptionDateInput = document.getElementById('last-consumption-date');
const consumptionMonthlyFeeError = document.getElementById('consumption-monthly-fee-error');
const consumptionDateError = document.getElementById('consumption-date-error');

const consumptionEmptyState = document.getElementById('consumption-empty-state');
const consumptionResultContent = document.getElementById('consumption-result-content');
const consumptionResultStatus = document.getElementById('consumption-result-status');
const consumptionHighlightLabel = document.getElementById('consumption-highlight-label');
const consumptionFinalValueEl = document.getElementById('consumption-final-value');
const consumptionResultMessageEl = document.getElementById('consumption-result-message');

const consumptionSummaryMonthlyFee = document.getElementById('consumption-summary-monthly-fee');
const consumptionSummaryStartIcon = document.getElementById('consumption-summary-start-icon');
const consumptionSummaryStartLabel = document.getElementById('consumption-summary-start-label');
const consumptionSummaryCancellationDate = document.getElementById('consumption-summary-cancellation-date');
const consumptionSummaryEndIcon = document.getElementById('consumption-summary-end-icon');
const consumptionSummaryEndLabel = document.getElementById('consumption-summary-end-label');
const consumptionSummaryNextInvoiceDate = document.getElementById('consumption-summary-next-invoice-date');
const consumptionSummaryDaysConsumed = document.getElementById('consumption-summary-days-consumed');
const consumptionSummaryRemainingLabel = document.getElementById('consumption-summary-remaining-label');
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

function getConsumptionBranch() {
  return consumptionMatchNoRadio.checked ? 'no' : 'yes';
}

function updateConsumptionBranchVisibility() {
  const branch = getConsumptionBranch();
  consumptionRequestDates.classList.toggle('hidden', branch !== 'yes');
  consumptionManualDates.classList.toggle('hidden', branch !== 'no');
  consumptionDateError.textContent = '';
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

// Ramo "Sim": a data da solicitação é o último dia consumido (conta), e o
// próximo boleto marca o fim do ciclo de 30 dias (não conta).
function validateRequestDates(cancellationDate, nextInvoiceDate) {
  if (!cancellationDate || !nextInvoiceDate) {
    return 'Informe a data da solicitação e a data do próximo boleto.';
  }

  const daysUntilInvoice = getCommercialDayDifference(cancellationDate, nextInvoiceDate);

  if (daysUntilInvoice < 1) {
    return 'A data do próximo boleto deve ser posterior à data da solicitação.';
  }

  if (daysUntilInvoice > 30) {
    return 'A data do próximo boleto deve estar dentro do ciclo atual (até 30 dias após a solicitação).';
  }

  return '';
}

// Ramo "Não": o último vencimento realizado é o início do ciclo (conta), e o
// último dia de consumo é o último dia efetivamente usado (também conta).
function validateManualDates(lastDueDate, lastConsumptionDate) {
  if (!lastDueDate || !lastConsumptionDate) {
    return 'Informe o último vencimento realizado e o último dia de consumo.';
  }

  const daysSinceDueDate = getCommercialDayDifference(lastDueDate, lastConsumptionDate);

  if (daysSinceDueDate < 0) {
    return 'O último dia de consumo não pode ser anterior ao último vencimento realizado.';
  }

  if (daysSinceDueDate > 29) {
    return 'O último dia de consumo deve estar dentro do ciclo atual (até 30 dias após o último vencimento).';
  }

  return '';
}

function renderConsumptionResult({
  branch,
  monthlyFee,
  startDate,
  endDate,
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

  const originNote = branch === 'yes' ? 'data da solicitação' : 'período informado manualmente';
  consumptionResultMessageEl.textContent =
    `O cliente consumiu ${daysConsumed} ${daysConsumed === 1 ? 'dia' : 'dias'} do ciclo atual (${originNote}), equivalente a ${formatCurrency(proportionalAmount)}.`;

  if (branch === 'yes') {
    consumptionSummaryStartIcon.textContent = 'CA';
    consumptionSummaryStartLabel.textContent = 'Cancelamento';
    consumptionSummaryEndIcon.textContent = 'PB';
    consumptionSummaryEndLabel.textContent = 'Próximo boleto';
    consumptionSummaryRemainingLabel.textContent = 'Dias restantes até o boleto';
  } else {
    consumptionSummaryStartIcon.textContent = 'UV';
    consumptionSummaryStartLabel.textContent = 'Último vencimento realizado';
    consumptionSummaryEndIcon.textContent = 'UC';
    consumptionSummaryEndLabel.textContent = 'Último dia de consumo';
    consumptionSummaryRemainingLabel.textContent = 'Dias não consumidos no ciclo';
  }

  consumptionSummaryMonthlyFee.textContent = formatCurrency(monthlyFee);
  consumptionSummaryCancellationDate.textContent = formatFullDate(startDate);
  consumptionSummaryNextInvoiceDate.textContent = formatFullDate(endDate);
  consumptionSummaryDaysConsumed.textContent = `${daysConsumed} ${daysConsumed === 1 ? 'dia' : 'dias'}`;
  consumptionSummaryDaysRemaining.textContent = `${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
  consumptionSummaryDailyValue.textContent = formatCurrency(dailyValue);
  consumptionSummaryFinalValue.textContent = formatCurrency(proportionalAmount);
}

consumptionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const monthlyFee = parseBrazilianCurrency(consumptionMonthlyFeeInput.value);
  const monthlyFeeValidationMessage = validateConsumptionMonthlyFee(monthlyFee);

  if (monthlyFeeValidationMessage) {
    consumptionMonthlyFeeError.textContent = monthlyFeeValidationMessage;
    consumptionMonthlyFeeInput.focus();
    return;
  }

  consumptionMonthlyFeeError.textContent = '';

  const branch = getConsumptionBranch();
  const dailyValue = monthlyFee / 30;
  let startDate;
  let endDate;
  let daysConsumed;
  let daysRemaining;

  if (branch === 'yes') {
    const cancellationDate = parseFullDate(cancellationDateInput.value);
    const nextInvoiceDate = parseFullDate(nextInvoiceDateInput.value);
    const dateValidationMessage = validateRequestDates(cancellationDate, nextInvoiceDate);

    if (dateValidationMessage) {
      consumptionDateError.textContent = dateValidationMessage;
      cancellationDateInput.focus();
      return;
    }

    const daysUntilInvoice = getCommercialDayDifference(cancellationDate, nextInvoiceDate);
    startDate = cancellationDate;
    endDate = nextInvoiceDate;
    daysConsumed = 30 - daysUntilInvoice + 1;
    daysRemaining = daysUntilInvoice - 1;
  } else {
    const lastDueDate = parseFullDate(lastDueDateInput.value);
    const lastConsumptionDate = parseFullDate(lastConsumptionDateInput.value);
    const dateValidationMessage = validateManualDates(lastDueDate, lastConsumptionDate);

    if (dateValidationMessage) {
      consumptionDateError.textContent = dateValidationMessage;
      lastDueDateInput.focus();
      return;
    }

    const daysSinceDueDate = getCommercialDayDifference(lastDueDate, lastConsumptionDate);
    startDate = lastDueDate;
    endDate = lastConsumptionDate;
    daysConsumed = daysSinceDueDate + 1;
    daysRemaining = 30 - daysConsumed;
  }

  consumptionDateError.textContent = '';

  const proportionalAmount = dailyValue * daysConsumed;

  renderConsumptionResult({
    branch,
    monthlyFee,
    startDate,
    endDate,
    daysConsumed,
    daysRemaining,
    dailyValue,
    proportionalAmount
  });
});

consumptionMonthlyFeeInput.addEventListener('input', () => {
  consumptionMonthlyFeeError.textContent = '';
});

[cancellationDateInput, nextInvoiceDateInput, lastDueDateInput, lastConsumptionDateInput].forEach((input) => {
  input.addEventListener('input', () => {
    consumptionDateError.textContent = '';
  });
});

[consumptionMatchYesRadio, consumptionMatchNoRadio].forEach((radio) => {
  radio.addEventListener('change', updateConsumptionBranchVisibility);
});

updateConsumptionBranchVisibility();
