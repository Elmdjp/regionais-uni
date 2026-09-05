/**
 * datepicker.js
 * ------------------------------------------------------------
 * Melhora visualmente os campos de data (input[type=date]),
 * mês (input[type=month]) e os selects de "dia de vencimento"
 * (id terminado em -due-day), SEM alterar o comportamento que
 * o restante da aplicação depende:
 *
 *   - o input/select original continua no DOM, com o mesmo
 *     id/name/type, só fica visualmente oculto (.sr-only);
 *   - toda seleção feita no calendário/seletor grava o valor
 *     exatamente no mesmo formato que o input nativo já usava
 *     (YYYY-MM-DD para data, YYYY-MM para mês) e dispara os
 *     eventos 'input' e 'change', que é o que script.js,
 *     contract-break.js e consumption.js escutam para limpar
 *     mensagens de erro;
 *   - script.js e contract-break.js continuam podendo setar
 *     `input.value` diretamente (como fazem em
 *     setDefaultMonths/setDefaultReferenceMonth) sem saber que
 *     esse componente existe — este arquivo só precisa rodar
 *     DEPOIS deles para exibir esse valor inicial corretamente.
 * ------------------------------------------------------------
 */
(function () {
  var MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  var MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  var DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

  var fullDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  var monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function fireChange(input) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function closeAllPopovers(except) {
    document.querySelectorAll('.date-popover.open').forEach(function (el) {
      if (el !== except) {
        el.classList.remove('open');
      }
    });
  }

  document.addEventListener('click', function (event) {
    if (!event.target.closest('.date-field')) {
      closeAllPopovers();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAllPopovers();
    }
  });

  function buildTrigger(placeholder) {
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'date-trigger';
    trigger.innerHTML =
      '<svg class="date-trigger-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M3.5 9.5H20.5" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M8 3V6.5M16 3V6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg><span class="date-trigger-text">' + placeholder + '</span>';
    return trigger;
  }

  /* ---------------------------------------------------------- */
  /* Campo de DATA (input[type=date])                            */
  /* ---------------------------------------------------------- */
  function enhanceDateInput(input) {
    var wrapper = document.createElement('div');
    wrapper.className = 'date-field';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    input.classList.add('sr-only');
    input.setAttribute('tabindex', '-1');

    var placeholderText = input.getAttribute('data-placeholder') || 'Selecionar data';
    var trigger = buildTrigger(placeholderText);
    wrapper.appendChild(trigger);

    var popover = document.createElement('div');
    popover.className = 'date-popover';
    wrapper.appendChild(popover);

    var viewYear;
    var viewMonth;

    function parseValue() {
      if (!input.value) {
        return null;
      }
      var parts = input.value.split('-').map(Number);
      if (!parts[0] || !parts[1] || !parts[2]) {
        return null;
      }
      return { y: parts[0], m: parts[1], d: parts[2] };
    }

    function updateTriggerText() {
      var value = parseValue();
      var span = trigger.querySelector('.date-trigger-text');
      if (value) {
        span.textContent = fullDateFormatter.format(new Date(value.y, value.m - 1, value.d));
        trigger.classList.remove('is-empty');
      } else {
        span.textContent = placeholderText;
        trigger.classList.add('is-empty');
      }
    }

    function renderCalendar() {
      var today = new Date();
      var selected = parseValue();
      var firstWeekday = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7; // 0 = segunda
      var daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
      var daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

      var cells = '';
      for (var i = firstWeekday - 1; i >= 0; i -= 1) {
        cells += '<span class="calendar-day calendar-day--muted">' + (daysInPrevMonth - i) + '</span>';
      }
      for (var d = 1; d <= daysInMonth; d += 1) {
        var isToday = today.getFullYear() === viewYear && (today.getMonth() + 1) === viewMonth && today.getDate() === d;
        var isSelected = !!selected && selected.y === viewYear && selected.m === viewMonth && selected.d === d;
        var classes = ['calendar-day'];
        if (isToday) classes.push('calendar-day--today');
        if (isSelected) classes.push('calendar-day--selected');
        cells += '<button type="button" class="' + classes.join(' ') + '" data-day="' + d + '">' + d + '</button>';
      }
      var totalCells = firstWeekday + daysInMonth;
      var trailing = (7 - (totalCells % 7)) % 7;
      for (var t = 1; t <= trailing; t += 1) {
        cells += '<span class="calendar-day calendar-day--muted">' + t + '</span>';
      }

      popover.innerHTML =
        '<div class="calendar-header">' +
        '<button type="button" class="calendar-nav-btn" data-nav="-1" aria-label="Mês anterior">&#8249;</button>' +
        '<span class="calendar-title">' + MESES[viewMonth - 1] + ' de ' + viewYear + '</span>' +
        '<button type="button" class="calendar-nav-btn" data-nav="1" aria-label="Próximo mês">&#8250;</button>' +
        '</div>' +
        '<div class="calendar-weekdays">' + DIAS_SEMANA.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
        '<div class="calendar-grid">' + cells + '</div>' +
        '<div class="calendar-footer">' +
        '<button type="button" class="calendar-action" data-action="clear">Limpar</button>' +
        '<button type="button" class="calendar-action calendar-action--primary" data-action="today">Hoje</button>' +
        '</div>';

      popover.querySelectorAll('[data-day]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          input.value = viewYear + '-' + pad(viewMonth) + '-' + pad(Number(btn.dataset.day));
          fireChange(input);
          updateTriggerText();
          popover.classList.remove('open');
        });
      });

      popover.querySelector('[data-nav="-1"]').addEventListener('click', function () {
        viewMonth -= 1;
        if (viewMonth < 1) {
          viewMonth = 12;
          viewYear -= 1;
        }
        renderCalendar();
      });
      popover.querySelector('[data-nav="1"]').addEventListener('click', function () {
        viewMonth += 1;
        if (viewMonth > 12) {
          viewMonth = 1;
          viewYear += 1;
        }
        renderCalendar();
      });
      popover.querySelector('[data-action="clear"]').addEventListener('click', function () {
        input.value = '';
        fireChange(input);
        updateTriggerText();
        popover.classList.remove('open');
      });
      popover.querySelector('[data-action="today"]').addEventListener('click', function () {
        var now = new Date();
        input.value = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
        fireChange(input);
        updateTriggerText();
        viewYear = now.getFullYear();
        viewMonth = now.getMonth() + 1;
        renderCalendar();
      });
    }

    function openPopover() {
      var selected = parseValue();
      var today = new Date();
      viewYear = selected ? selected.y : today.getFullYear();
      viewMonth = selected ? selected.m : today.getMonth() + 1;
      renderCalendar();
      closeAllPopovers(popover);
      popover.classList.add('open');
    }

    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      if (popover.classList.contains('open')) {
        popover.classList.remove('open');
      } else {
        openPopover();
      }
    });

    updateTriggerText();
  }

  /* ---------------------------------------------------------- */
  /* Campo de MÊS (input[type=month])                            */
  /* ---------------------------------------------------------- */
  function enhanceMonthInput(input) {
    var wrapper = document.createElement('div');
    wrapper.className = 'date-field';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    input.classList.add('sr-only');
    input.setAttribute('tabindex', '-1');

    var placeholderText = input.getAttribute('data-placeholder') || 'Selecionar mês';
    var trigger = buildTrigger(placeholderText);
    wrapper.appendChild(trigger);

    var popover = document.createElement('div');
    popover.className = 'date-popover month-popover';
    wrapper.appendChild(popover);

    var viewYear;

    function parseValue() {
      if (!input.value) {
        return null;
      }
      var parts = input.value.split('-').map(Number);
      if (!parts[0] || !parts[1]) {
        return null;
      }
      return { y: parts[0], m: parts[1] };
    }

    function updateTriggerText() {
      var value = parseValue();
      var span = trigger.querySelector('.date-trigger-text');
      if (value) {
        var text = monthFormatter.format(new Date(value.y, value.m - 1, 1));
        span.textContent = text.charAt(0).toUpperCase() + text.slice(1);
        trigger.classList.remove('is-empty');
      } else {
        span.textContent = placeholderText;
        trigger.classList.add('is-empty');
      }
    }

    function renderMonths() {
      var selected = parseValue();
      var today = new Date();
      var cells = '';
      for (var m = 1; m <= 12; m += 1) {
        var isToday = today.getFullYear() === viewYear && (today.getMonth() + 1) === m;
        var isSelected = !!selected && selected.y === viewYear && selected.m === m;
        var classes = ['month-cell'];
        if (isToday) classes.push('month-cell--today');
        if (isSelected) classes.push('month-cell--selected');
        cells += '<button type="button" class="' + classes.join(' ') + '" data-month="' + m + '">' + MESES_ABREV[m - 1] + '</button>';
      }

      popover.innerHTML =
        '<div class="calendar-header">' +
        '<button type="button" class="calendar-nav-btn" data-nav="-1" aria-label="Ano anterior">&#8249;</button>' +
        '<span class="calendar-title">' + viewYear + '</span>' +
        '<button type="button" class="calendar-nav-btn" data-nav="1" aria-label="Próximo ano">&#8250;</button>' +
        '</div>' +
        '<div class="month-grid">' + cells + '</div>' +
        '<div class="calendar-footer">' +
        '<button type="button" class="calendar-action" data-action="clear">Limpar</button>' +
        '<button type="button" class="calendar-action calendar-action--primary" data-action="current">Este mês</button>' +
        '</div>';

      popover.querySelectorAll('[data-month]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          input.value = viewYear + '-' + pad(Number(btn.dataset.month));
          fireChange(input);
          updateTriggerText();
          popover.classList.remove('open');
        });
      });

      popover.querySelector('[data-nav="-1"]').addEventListener('click', function () {
        viewYear -= 1;
        renderMonths();
      });
      popover.querySelector('[data-nav="1"]').addEventListener('click', function () {
        viewYear += 1;
        renderMonths();
      });
      popover.querySelector('[data-action="clear"]').addEventListener('click', function () {
        input.value = '';
        fireChange(input);
        updateTriggerText();
        popover.classList.remove('open');
      });
      popover.querySelector('[data-action="current"]').addEventListener('click', function () {
        var now = new Date();
        input.value = now.getFullYear() + '-' + pad(now.getMonth() + 1);
        fireChange(input);
        updateTriggerText();
        viewYear = now.getFullYear();
        renderMonths();
      });
    }

    function openPopover() {
      var selected = parseValue();
      viewYear = selected ? selected.y : new Date().getFullYear();
      renderMonths();
      closeAllPopovers(popover);
      popover.classList.add('open');
    }

    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      if (popover.classList.contains('open')) {
        popover.classList.remove('open');
      } else {
        openPopover();
      }
    });

    updateTriggerText();
  }

  /* ---------------------------------------------------------- */
  /* Seletor de DIA (select id terminado em -due-day)             */
  /* ---------------------------------------------------------- */
  function enhanceDaySelect(select) {
    var wrapper = document.createElement('div');
    wrapper.className = 'day-field';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.classList.add('sr-only');
    select.setAttribute('tabindex', '-1');

    var pillGroup = document.createElement('div');
    pillGroup.className = 'day-pill-group';
    wrapper.appendChild(pillGroup);

    var pills = [];
    Array.prototype.forEach.call(select.options, function (option) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'day-pill';
      pill.textContent = pad(Number(option.value));
      pill.dataset.value = option.value;
      if (option.value === select.value) {
        pill.classList.add('active');
      }
      pill.addEventListener('click', function () {
        select.value = option.value;
        pills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      pills.push(pill);
      pillGroup.appendChild(pill);
    });
  }

  document.querySelectorAll('input[type="date"]').forEach(enhanceDateInput);
  document.querySelectorAll('input[type="month"]').forEach(enhanceMonthInput);
  document.querySelectorAll('select[id$="-due-day"]').forEach(enhanceDaySelect);
}());
