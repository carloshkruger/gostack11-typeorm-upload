import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      const totalAfterTransaction = balance.total - value;

      if (totalAfterTransaction < 0) {
        throw new AppError('Insufficient balance.');
      }
    }

    let categoryModel = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryModel) {
      categoryModel = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(categoryModel);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryModel.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
