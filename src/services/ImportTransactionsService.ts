import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, filename);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: TransactionCSV[] = [];

    parseCSV.on('data', line => {
      lines.push({
        title: line[0],
        type: line[1],
        value: line[2],
        category: line[3],
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const createTransaction = new CreateTransactionService();

    const transactions: Transaction[] = [];

    const lastTransaction = await lines.reduce(
      async (acc: Promise<void> | Promise<Transaction>, data) => {
        const result = await acc;
        if (result instanceof Transaction) {
          transactions.push(result);
        }

        return createTransaction.execute(data);
      },
      Promise.resolve(),
    );

    if (lastTransaction) {
      transactions.push(lastTransaction);
    }

    const csvFileExists = await fs.promises.stat(csvFilePath);

    if (csvFileExists) {
      await fs.promises.unlink(csvFilePath);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
