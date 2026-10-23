// Takes raw rows: { expense_id, paid_by, total_amount, ower_id, amount_owed }
function calculateBalances(rows) {
  let balances = {};
  let processedExpenses = new Set();

  rows.forEach((row) => {
    // credit the payer once per expense, not once per row
    if (!processedExpenses.has(row.expense_id)) {
      balances[row.paid_by] = (balances[row.paid_by] || 0) + Number(row.total_amount);
      processedExpenses.add(row.expense_id);
    }

    // debit each member their real owed share
    balances[row.ower_id] = (balances[row.ower_id] || 0) - Number(row.amount_owed);
  });

  return Object.entries(balances).map(([user_id, balance]) => ({
    user_id,
    balance: Math.round(balance * 100) / 100,
  }));
}

function simplifyDebts(balance_result) {
  let transactions = [];

  while (balance_result.filter((p) => Math.abs(p.balance) > 0.01).length > 0) {
    let creditor = balance_result.reduce((highest, current) =>
      current.balance > highest.balance ? current : highest
    );
    let debtor = balance_result.reduce((lowest, current) =>
      current.balance < lowest.balance ? current : lowest
    );

    let amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    transactions.push({ from: debtor.user_id, to: creditor.user_id, amount });

    creditor.balance -= amount;
    debtor.balance += amount;
  }

  return transactions;
}

export { calculateBalances, simplifyDebts };