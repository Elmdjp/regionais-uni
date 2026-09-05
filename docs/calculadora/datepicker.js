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
 *
 * O calendário/seletor de mês abre como um popup modal
 * centralizado, com uma pequena animação 3D (escala + rotação
 * sutil) ao abrir. Cliques dentro do card NUNCA borbulham até o
 * listener global de "fechar ao clicar fora" — isso evita que o
 * card seja fechado sozinho ao navegar entre meses/anos (o
 * re-render troca os botões de lugar a cada clique, então sem
 * esse corte de propagação o clique "vazava" até o document e
 * fechava o popup no mesmo instante em que ele deveria só trocar
 * de mês).
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

  // Fecha ao clicar fora de qualquer campo de data/mês. Cliques que
  // acontecem DENTRO do card (.date-popover-inner) nunca chegam até
  // aqui, porque têm stopPropagation() (ver createPopover abaixo) —
  // então este listener só trata cliques genuinamente externos.
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

  /**
   * Cria a estrutura do popup modal (backdrop + card) e devolve o
   * elemento `card`, que é onde o conteúdo (calendário ou grade de
   * meses) deve ser renderizado a cada re-render.
   */
  function createPopover(wrapper) {
    var popover = document.createElement('div');
    popover.className = 'date-popover';
    wrapper.appendChild(popover);

    var card = document.createElement('div');
    card.className = 'date-popover-inner';
    popover.appendChild(card);

    // Clique no fundo (fora do card) fecha o popup.
    popover.addEventListener('click', function (event) {
      if (event.target === popover) {
        popover.classList.remove('open');
      }
    });

    // Nenhum clique dentro do card deve borbulhar além dele — é
    // isso que impede o listener global de fechar o popup no meio
    // de uma navegação de mês/ano (ver comentário no topo do arquivo).
    card.addEventListener('click', function (event) {
      event.stopPropagation();
    });

    return { popover: popover, card: card };
  }

  function open(popover) {
    closeAllPopovers(popover);
    popover.classList.add('open');
  }

  function close(popover) {
    popover.classList.remove('open');
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

    var popoverRefs = createPopover(wrapper);
    var popover = popoverRefs.popover;
    var card = popoverRefs.card;

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

      card.innerHTML =
        '<div class="calendar-header">' +
        '<div class="calendar-nav-group">' +
        '<button type="button" class="calendar-nav-btn calendar-nav-btn--year" data-nav="year-prev" aria-label="Ano anterior">&#171;</button>' +
        '<button type="button" class="calendar-nav-btn" data-nav="month-prev" aria-label="Mês anterior">&#8249;</button>' +
        '</div>' +
        '<span class="calendar-title">' + MESES[viewMonth - 1] + ' de ' + viewYear + '</span>' +
        '<div class="calendar-nav-group">' +
        '<button type="button" class="calendar-nav-btn" data-nav="month-next" aria-label="Próximo mês">&#8250;</button>' +
        '<button type="button" class="calendar-nav-btn calendar-nav-btn--year" data-nav="year-next" aria-label="Próximo ano">&#187;</button>' +
        '</div>' +
        '</div>' +
        '<div class="calendar-weekdays">' + DIAS_SEMANA.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
        '<div class="calendar-grid">' + cells + '</div>' +
        '<div class="calendar-footer">' +
        '<button type="button" class="calendar-action" data-action="clear">Limpar</button>' +
        '<button type="button" class="calendar-action calendar-action--primary" data-action="today">Hoje</button>' +
        '</div>';

      card.querySelectorAll('[data-day]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          input.value = viewYear + '-' + pad(viewMonth) + '-' + pad(Number(btn.dataset.day));
          fireChange(input);
          updateTriggerText();
          close(popover);
        });
      });

      card.querySelector('[data-nav="month-prev"]').addEventListener('click', function () {
        viewMonth -= 1;
        if (viewMonth < 1) {
          viewMonth = 12;
          viewYear -= 1;
        }
        renderCalendar();
      });
      card.querySelector('[data-nav="month-next"]').addEventListener('click', function () {
        viewMonth += 1;
        if (viewMonth > 12) {
          viewMonth = 1;
          viewYear += 1;
        }
        renderCalendar();
      });
      card.querySelector('[data-nav="year-prev"]').addEventListener('click', function () {
        viewYear -= 1;
        renderCalendar();
      });
      card.querySelector('[data-nav="year-next"]').addEventListener('click', function () {
        viewYear += 1;
        renderCalendar();
      });
      card.querySelector('[data-action="clear"]').addEventListener('click', function () {
        input.value = '';
        fireChange(input);
        updateTriggerText();
        close(popover);
      });
      card.querySelector('[data-action="today"]').addEventListener('click', function () {
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
      open(popover);
    }

    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      if (popover.classList.contains('open')) {
        close(popover);
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

    var popoverRefs = createPopover(wrapper);
    var popover = popoverRefs.popover;
    var card = popoverRefs.card;
    popover.classList.add('month-popover-overlay');

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

      card.innerHTML =
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

      card.querySelectorAll('[data-month]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          input.value = viewYear + '-' + pad(Number(btn.dataset.month));
          fireChange(input);
          updateTriggerText();
          close(popover);
        });
      });

      card.querySelector('[data-nav="-1"]').addEventListener('click', function () {
        viewYear -= 1;
        renderMonths();
      });
      card.querySelector('[data-nav="1"]').addEventListener('click', function () {
        viewYear += 1;
        renderMonths();
      });
      card.querySelector('[data-action="clear"]').addEventListener('click', function () {
        input.value = '';
        fireChange(input);
        updateTriggerText();
        close(popover);
      });
      card.querySelector('[data-action="current"]').addEventListener('click', function () {
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
      open(popover);
    }

    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      if (popover.classList.contains('open')) {
        close(popover);
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
