const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('[data-tab-panel]');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;

    tabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn === button);
      btn.setAttribute('aria-selected', String(btn === button));
    });

    tabPanels.forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset.tabPanel !== target);
    });
  });
});
