
// funtion to get the balance of every member 
function calculateBalances(expenses){

  // Expense of each person
  let eachPersonSum = expenses.reduce((sum, current) => {
  if (sum[current.paidBy]) {
    sum[current.paidBy] = sum[current.paidBy] + current.amount;
  } else {
    sum[current.paidBy] = current.amount;
  }
  return sum;
  }, {});

  // Number of Members 
  let members = Object.entries(eachPersonSum).length;

  // total amount spent in the group
  let total_amount = expenses.reduce((sum,current) => { return sum + current.amount;},0);

  // Split calculation (If split is equal)
  let split = total_amount / members;

  // for getting name and balance of all members
  let balances = Object.entries(eachPersonSum).map((pair) => {
    let name = pair[0];
    let amountPaid = pair[1];
    let balance = amountPaid - split;
    return {name : name , balance : balance};
  });

  return balances;
}

// sample dataset
let myExpenses = [   
  { description: "Dinner", amount: 450, paidBy: "Meet" },
  { description: "Movie", amount: 180, paidBy: "Priya" },
  { description: "Groceries", amount: 620, paidBy: "Meet" },
  { description: "Cab", amount: 90, paidBy: "Rahul" },
  { description: "Rent", amount: 5000, paidBy: "Meet" }
  ];

// printing the members and their respective balance
let balance_result = calculateBalances(myExpenses);
console.log(balance_result);


// Returning the member with highest balance value 
let highestBalance = balance_result.reduce((highest,current) => {
  if (current.balance > highest.balance){
    return current;
  }else{
    return highest;
  }
});
console.log(highestBalance);

// highest debitor
let lowestBalance = balance_result.reduce((lowest, current) => {
  if (current.balance < lowest.balance) {
    return current;
  } else {
    return lowest;
  }
});

// FUNCTION debtSimplification

function simplifyDebts(balance_result) {
  let transactions = []; // array, since we're collecting multiple transaction records

  while (balance_result.filter((p) => Math.abs(p.balance) > 0.01).length > 0) {
    
    // recalculate creditor/debtor FRESH, every single pass -- this is the key fix
    let creditor = balance_result.reduce((highest, current) => {
      if (current.balance > highest.balance) {
        return current;
      } else {
        return highest;
      }
    }); // REDUCE to find the one with HIGHEST BALANCE

    let debtor = balance_result.reduce((lowest, current) => {
      if (current.balance < lowest.balance) {
        return current;
      } else {
        return lowest;
      }
    }); // REDUCE to find the one with LOWEST BALANCE

    let amount = Math.min(creditor.balance, Math.abs(debtor.balance)); //get smallest of them

    transactions.push({ from: debtor.name, to: creditor.name, amount: amount }); // that smallest amount trasnaction is then recorded in trasnaction log  

    creditor.balance = creditor.balance - amount; // The updateion at the end of the loop
    debtor.balance = debtor.balance + amount; // Highest guy gets the amount and debtor debits it
  }

  return transactions;
}
  