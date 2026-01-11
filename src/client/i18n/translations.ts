// Internationalization translations for EN and FR

export type Locale = "en" | "fr";

// Locale codes for Intl APIs
const localeCode: Record<Locale, string> = {
	en: "en-US",
	fr: "fr-FR",
};

// Format money with locale-aware decimal separator
export const formatMoney = (locale: Locale, cents: number): string => {
	const decimal = cents / 100;
	if (locale === "en") {
		const formatted = new Intl.NumberFormat(localeCode[locale], {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(decimal);
		return `${formatted}\u00a0€`;
	}
	return new Intl.NumberFormat(localeCode[locale], {
		style: "currency",
		currency: "EUR",
	}).format(decimal);
};

// Format number with locale-aware decimal separator (no currency)
export const formatNumber = (
	locale: Locale,
	value: number,
	decimals = 2,
): string => {
	return value.toLocaleString(localeCode[locale], {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
};

// Format date with locale
export const formatDateLocale = (
	locale: Locale,
	timestampSeconds: number,
): string => {
	const date = new Date(timestampSeconds * 1000);
	return date.toLocaleDateString(localeCode[locale], {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

export type Translations = {
	// App title and general
	appTitle: string;
	loadingAccounts: string;
	loadingFinancialData: string;
	errorLoadingAccounts: string;
	errorLoadingFinancialData: string;

	// Header buttons
	resetToDemo: string;
	switchToLightMode: string;
	switchToDarkMode: string;
	switchToFrench: string;
	switchToEnglish: string;

	// Transaction list
	transactions: string;
	transactionCount: (filtered: number, total: number) => string;
	addTransaction: string;
	noTransactionsFound: (accountName: string) => string;

	// Transaction filters
	description: string;
	searchByDescription: string;
	minAmount: string;
	maxAmount: string;
	clear: string;
	unknownExpenses: string;

	// Transaction dialog
	addTransactionTitle: string;
	editTransactionTitle: string;
	fromAccount: string;
	toAccount: string;
	amount: string;
	date: string;
	save: string;
	cancel: string;
	delete: string;
	amountDecimalError: string;

	// Delete confirmation
	deleteQuestion: string;
	deleteWarning: string;
	confirmDelete: string;

	// Balance cards
	balances: string;
	scrollToCycle: string;
	selectedClickToView: (accountName: string) => string;

	// Balance chart
	balanceHistoryFor: (accountName: string) => string;

	// Errors
	failedToResetData: string;
	failedToDelete: string;
	failedToSave: string;
	failedToLoadLedger: string;
	failedToLoadBalances: string;
	transactionNotVisible: string;

	// Demo data translations (accounts)
	accounts: Record<string, string>;

	// Demo data translations (categories)
	categories: Record<string, string>;

	// Demo data translations (transaction descriptions)
	transactionDescriptions: Record<string, string>;
};

export const translations: Record<Locale, Translations> = {
	en: {
		// App title and general
		appTitle: "PFM2 - A Simple Personal Finance Manager Demo",
		loadingAccounts: "Loading accounts...",
		loadingFinancialData: "Loading financial data...",
		errorLoadingAccounts: "Error loading accounts:",
		errorLoadingFinancialData: "Error loading financial data:",

		// Header buttons
		resetToDemo: "Reset to demo data",
		switchToLightMode: "Switch to light mode",
		switchToDarkMode: "Switch to dark mode",
		switchToFrench: "Francais",
		switchToEnglish: "English",

		// Transaction list
		transactions: "Transactions",
		transactionCount: (filtered, total) =>
			`${filtered} of ${total} transactions`,
		addTransaction: "Add Transaction",
		noTransactionsFound: (accountName) =>
			`No transactions found for ${accountName}.`,

		// Transaction filters
		description: "Description",
		searchByDescription: "Search by description",
		minAmount: "Min Amount",
		maxAmount: "Max Amount",
		clear: "Clear",
		unknownExpenses: "Unknown expenses",

		// Transaction dialog
		addTransactionTitle: "Add Transaction",
		editTransactionTitle: "Edit Transaction",
		fromAccount: "From Account",
		toAccount: "To Account",
		amount: "Amount",
		date: "Date",
		save: "Save",
		cancel: "Cancel",
		delete: "Delete",
		amountDecimalError: "Amount can have at most 2 decimal places",

		// Delete confirmation
		deleteQuestion: "Delete this transaction?",
		deleteWarning: "This action cannot be undone.",
		confirmDelete: "Confirm Delete",

		// Balance cards
		balances: "Balances",
		scrollToCycle: "Scroll to cycle",
		selectedClickToView: (accountName) =>
			`Selected: ${accountName} (click to view)`,

		// Balance chart
		balanceHistoryFor: (accountName) => `Balance History for ${accountName}`,

		// Errors
		failedToResetData: "Failed to reset data",
		failedToDelete: "Failed to delete:",
		failedToSave: "Failed to save:",
		failedToLoadLedger: "Failed to load ledger",
		failedToLoadBalances: "Failed to load balances",
		transactionNotVisible: "Transaction not visible (filtered out)",

		// Demo data translations (accounts) - English originals
		accounts: {
			"Checking account": "Checking account",
			OpeningBalance: "OpeningBalance",
			"Savings account": "Savings account",
			Unknown_INCOME: "Unknown_INCOME",
			"Employer ABC": "Employer ABC",
			Unknown_EXPENSE: "Unknown_EXPENSE",
			Groceries: "Groceries",
			Communications: "Communications",
			Transport: "Transport",
			Health: "Health",
			Energy: "Energy",
			Clothing: "Clothing",
			Leisure: "Leisure",
		},

		// Demo data translations (categories) - English originals
		categories: {
			Equity: "Equity",
			Assets: "Assets",
			Income: "Income",
			Expenses: "Expenses",
		},

		// Demo data translations (transaction descriptions) - English originals
		transactionDescriptions: {
			"Opening Balance": "Opening Balance",
			"Metro Monthly Pass": "Metro Monthly Pass",
			"Weekly Groceries - SuperMart": "Weekly Groceries - SuperMart",
			"Fresh Produce Market": "Fresh Produce Market",
			"Electricity Bill": "Electricity Bill",
			"Internet & Phone Bill": "Internet & Phone Bill",
			"Gas Station Fill-up": "Gas Station Fill-up",
			"Electronics Store - Headphones": "Electronics Store - Headphones",
			"Pharmacy - Prescriptions": "Pharmacy - Prescriptions",
			"Electronics Store - Headphones Refund":
				"Electronics Store - Headphones Refund",
			"Monthly Rent": "Monthly Rent",
			"Work Clothes": "Work Clothes",
			"Side hustle": "Side hustle",
			"Monthly Salary": "Monthly Salary",
			"Dinner & Movie": "Dinner & Movie",
		},
	},
	fr: {
		// App title and general
		appTitle: "PFM2 - Démo d'un Gestionnaire de Finances Personnelles",
		loadingAccounts: "Chargement des comptes...",
		loadingFinancialData: "Chargement des données financières...",
		errorLoadingAccounts: "Erreur lors du chargement des comptes :",
		errorLoadingFinancialData:
			"Erreur lors du chargement des données financières :",

		// Header buttons
		resetToDemo: "Réinitialiser les données de démo",
		switchToLightMode: "Passer en mode clair",
		switchToDarkMode: "Passer en mode sombre",
		switchToFrench: "Français",
		switchToEnglish: "English",

		// Transaction list
		transactions: "Transactions",
		transactionCount: (filtered, total) =>
			`${filtered} sur ${total} transactions`,
		addTransaction: "Ajouter une transaction",
		noTransactionsFound: (accountName) =>
			`Aucune transaction trouvée pour ${accountName}.`,

		// Transaction filters
		description: "Description",
		searchByDescription: "Rechercher par description",
		minAmount: "Montant min",
		maxAmount: "Montant max",
		clear: "Effacer",
		unknownExpenses: "Dépenses inconnues",

		// Transaction dialog
		addTransactionTitle: "Ajouter une transaction",
		editTransactionTitle: "Modifier la transaction",
		fromAccount: "Compte source",
		toAccount: "Compte destination",
		amount: "Montant",
		date: "Date",
		save: "Enregistrer",
		cancel: "Annuler",
		delete: "Supprimer",
		amountDecimalError: "Le montant ne peut avoir que 2 décimales maximum",

		// Delete confirmation
		deleteQuestion: "Supprimer cette transaction ?",
		deleteWarning: "Cette action est irréversible.",
		confirmDelete: "Confirmer la suppression",

		// Balance cards
		balances: "Soldes",
		scrollToCycle: "Utilisez la molette pour naviguer",
		selectedClickToView: (accountName) =>
			`Sélectionné : ${accountName} (cliquer pour voir)`,

		// Balance chart
		balanceHistoryFor: (accountName) =>
			`Historique du solde pour ${accountName}`,

		// Errors
		failedToResetData: "Échec de la réinitialisation des données",
		failedToDelete: "Échec de la suppression :",
		failedToSave: "Échec de l'enregistrement :",
		failedToLoadLedger: "Échec du chargement du journal",
		failedToLoadBalances: "Échec du chargement des soldes",
		transactionNotVisible: "Transaction non visible (filtrée)",

		// Demo data translations (accounts) - French translations
		accounts: {
			"Checking account": "Compte courant",
			OpeningBalance: "Solde d'ouverture",
			"Savings account": "Compte épargne",
			Unknown_INCOME: "Revenu_INCONNU",
			"Employer ABC": "Employeur ABC",
			Unknown_EXPENSE: "Dépense_INCONNUE",
			Groceries: "Courses",
			Communications: "Communications",
			Transport: "Transport",
			Health: "Santé",
			Energy: "Énergie",
			Clothing: "Vêtements",
			Leisure: "Loisirs",
		},

		// Demo data translations (categories) - French translations
		categories: {
			Equity: "Capitaux propres",
			Assets: "Actifs",
			Income: "Revenus",
			Expenses: "Dépenses",
		},

		// Demo data translations (transaction descriptions) - French translations
		transactionDescriptions: {
			"Opening Balance": "Solde d'ouverture",
			"Metro Monthly Pass": "Abonnement métro mensuel",
			"Weekly Groceries - SuperMart": "Courses hebdomadaires - SuperMart",
			"Fresh Produce Market": "Marché de produits frais",
			"Electricity Bill": "Facture d'électricité",
			"Internet & Phone Bill": "Facture internet et téléphone",
			"Gas Station Fill-up": "Plein d'essence",
			"Electronics Store - Headphones": "Magasin électronique - Casque audio",
			"Pharmacy - Prescriptions": "Pharmacie - Ordonnances",
			"Electronics Store - Headphones Refund":
				"Magasin électronique - Remboursement casque",
			"Monthly Rent": "Loyer mensuel",
			"Work Clothes": "Vêtements de travail",
			"Side hustle": "Activité complémentaire",
			"Monthly Salary": "Salaire mensuel",
			"Dinner & Movie": "Restaurant et cinéma",
		},
	},
};

// Helper to translate demo data (falls back to original if no translation)
export const translateAccount = (
	locale: Locale,
	accountName: string,
): string => {
	return translations[locale].accounts[accountName] || accountName;
};

export const translateCategory = (
	locale: Locale,
	categoryName: string,
): string => {
	return translations[locale].categories[categoryName] || categoryName;
};

export const translateDescription = (
	locale: Locale,
	description: string,
): string => {
	return (
		translations[locale].transactionDescriptions[description] || description
	);
};
