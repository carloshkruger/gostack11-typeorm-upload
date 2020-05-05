import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const incomesTransactions = await this.find({
      where: {
        type: 'income',
      },
    });

    const income = incomesTransactions.reduce(
      (sum, transaction) => sum + transaction.value,
      0,
    );

    const outcomesTransactions = await this.find({
      where: {
        type: 'outcome',
      },
    });

    const outcome = outcomesTransactions.reduce(
      (sum, transaction) => sum + transaction.value,
      0,
    );

    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
