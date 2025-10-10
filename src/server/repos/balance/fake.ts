import type { AccountBalance } from '../../../shared/account';
import type { BalanceRepo } from './interface';
import type { TransactionRepo } from '../transaction/interface';
import type { AccountRepo, CategoryRepo } from '../account/interface';

// Fake implementation that mimics the SQL balance calculation logic:
// Balance = COALESCE(added, 0) - COALESCE(removed, 0)
// Where:
//   - removed = SUM(cents) for from_account_id (outgoing transactions)
//   - added = SUM(cents) for to_account_id (incoming transactions)

const init = (
  transactionRepo: TransactionRepo,
  accountRepo: AccountRepo,
  categoryRepo: CategoryRepo
): BalanceRepo => {
    return {
      getBalances: async (budgetId: number): Promise<AccountBalance[]> => {
        const [transactions, accounts, categories] = await Promise.all([
          transactionRepo.listByBudget(budgetId),
          accountRepo.listAll(),
          categoryRepo.listAll(),
        ]);

        // Calculate balance for each account using double-entry logic
        const balanceMap = new Map<number, { added: number; removed: number }>();

        for (const tx of transactions) {
          // Outgoing: from_account_id loses money
          const from = balanceMap.get(tx.fromAccountId) || { added: 0, removed: 0 };
          from.removed += tx.cents;
          balanceMap.set(tx.fromAccountId, from);

          // Incoming: to_account_id gains money
          const to = balanceMap.get(tx.toAccountId) || { added: 0, removed: 0 };
          to.added += tx.cents;
          balanceMap.set(tx.toAccountId, to);
        }

        // Build AccountBalance objects
        const categoryMap = new Map(categories.map(c => [c.categoryId, c.name]));

        return accounts
          .map(account => {
            const balances = balanceMap.get(account.accountId) || { added: 0, removed: 0 };
            return {
              accountId: account.accountId,
              accountName: account.name,
              categoryId: account.categoryId,
              categoryName: categoryMap.get(account.categoryId) || 'Unknown',
              balance: balances.added - balances.removed,
            };
          })
          .filter(ab => ab.balance !== 0); // Only show accounts with non-zero balances
      },
    };
  };

export const BalanceRepoFake = { init } as const;
