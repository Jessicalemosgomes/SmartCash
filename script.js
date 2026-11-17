(() => {
  const STORAGE_KEY = 'smartcash_transactions_v1';
  const form = document.getElementById('transactionForm');
  const descriptionInput = document.getElementById('description');
  const amountInput = document.getElementById('amount');
  const message = document.getElementById('formMessage');
  const list = document.getElementById('transactionList');

  const money = value => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).format(value);

  const dateLabel = value => new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(value));

  function loadTransactions() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(stored) ? stored.filter(item =>
        item && typeof item.id === 'string' &&
        typeof item.description === 'string' &&
        Number.isFinite(item.amount) && Number.isFinite(item.date)
      ) : [];
    } catch {
      return [];
    }
  }

  let transactions = loadTransactions();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      return true;
    } catch {
      message.textContent = 'Não foi possível salvar. Verifique o espaço disponível no navegador.';
      return false;
    }
  }

  function render() {
    const income = transactions.reduce((sum, item) => sum + (item.amount > 0 ? item.amount : 0), 0);
    const expense = transactions.reduce((sum, item) => sum + (item.amount < 0 ? Math.abs(item.amount) : 0), 0);
    const balance = income - expense;

    document.getElementById('totalIncome').textContent = money(income);
    document.getElementById('totalExpense').textContent = money(expense);
    const balanceElement = document.getElementById('totalBalance');
    balanceElement.textContent = money(balance);
    balanceElement.style.color = balance < 0 ? 'var(--red)' : balance > 0 ? 'var(--green)' : 'var(--ink)';
    document.getElementById('balanceCaption').textContent =
      balance < 0 ? 'Atenção: suas saídas superam as entradas' : 'Seu resultado acumulado';
    document.getElementById('transactionCount').textContent =
      `${transactions.length} ${transactions.length === 1 ? 'item' : 'itens'}`;

    const ordered = [...transactions].sort((a, b) => b.date - a.date);
    if (!ordered.length) {
      list.innerHTML = '<div class="empty"><span class="empty-icon">▤</span>Nenhuma transação por aqui ainda.<br>Adicione sua primeira movimentação ao lado.</div>';
      return;
    }

    list.innerHTML = ordered.map(item => {
      const positive = item.amount > 0;
      const safeDescription = escapeHTML(item.description);
      return `<div class="transaction">
        <div class="tx-icon ${positive ? 'positive' : 'negative'}">${positive ? '↙' : '↗'}</div>
        <div class="tx-info"><div class="tx-title">${safeDescription}</div><div class="tx-date">${dateLabel(item.date)}</div></div>
        <div class="tx-right">
          <span class="tx-value ${positive ? 'positive' : 'negative'}">${positive ? '+' : '−'} ${money(Math.abs(item.amount))}</span>
          <button class="delete-btn" type="button" data-delete="${item.id}" aria-label="Excluir ${safeDescription}" title="Excluir transação">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  function escapeHTML(value) {
    return value.replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    if (!description) {
      message.textContent = 'Informe uma descrição para a transação.';
      descriptionInput.focus();
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      message.textContent = 'Informe um valor diferente de zero.';
      amountInput.focus();
      return;
    }
    if (Math.abs(amount) > 999999999999) {
      message.textContent = 'O valor informado é muito alto.';
      amountInput.focus();
      return;
    }

    const transaction = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      date: Date.now()
    };
    transactions.push(transaction);
    if (!save()) {
      transactions = transactions.filter(item => item.id !== transaction.id);
      return;
    }
    form.reset();
    message.style.color = 'var(--green)';
    message.textContent = '✓ Transação adicionada com sucesso.';
    render();
    descriptionInput.focus();
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;
    const id = button.dataset.delete;
    const previous = transactions;
    transactions = transactions.filter(item => item.id !== id);
    if (!save()) {
      transactions = previous;
      render();
      return;
    }
    message.style.color = 'var(--green)';
    message.textContent = 'Transação excluída.';
    render();
  });

  amountInput.addEventListener('input', () => {
    message.textContent = '';
    message.style.color = 'var(--red)';
  });
  descriptionInput.addEventListener('input', () => {
    message.textContent = '';
    message.style.color = 'var(--red)';
  });

  document.getElementById('today').textContent = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric'
  }).format(new Date());
  document.getElementById('year').textContent = new Date().getFullYear();
  render();
})();
