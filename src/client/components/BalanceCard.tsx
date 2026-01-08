import type React from "react";
import type { AccountBalance } from "../../shared/account";
import styles from "./BalanceCard.module.css";

type BalanceCardProps = {
	balance: AccountBalance;
	isSelected: boolean;
	onClick: () => void;
	tAccount: (accountName: string) => string;
	tCategory: (categoryName: string) => string;
	fMoney: (cents: number) => string;
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
	balance,
	isSelected,
	onClick,
	tAccount,
	tCategory,
	fMoney,
}) => {
	const getColorAccent = (categoryName: string): string => {
		if (categoryName === "Assets") {
			return "#3498db";
		} else if (categoryName === "Expenses") {
			return "#e74c3c";
		} else {
			return "#9b59b6";
		}
	};

	return (
		<button
			type="button"
			className={`${styles.card} ${isSelected ? styles.selected : ""}`}
			style={{ borderLeftColor: getColorAccent(balance.categoryName) }}
			onClick={onClick}
			data-testid={`balance-card-${balance.accountId}`}
			data-test--balance={balance.balance}
		>
			<div className={styles.category}>{tCategory(balance.categoryName)}</div>
			<div className={styles.account}>{tAccount(balance.accountName)}</div>
			<div className={styles.amount}>{fMoney(balance.balance)}</div>
		</button>
	);
};
