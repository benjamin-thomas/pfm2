import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	type Locale,
	type Translations,
	formatDateLocale,
	formatMoney,
	formatNumber,
	translateAccount,
	translateCategory,
	translateDescription,
	translations,
} from "./translations";

type I18nContextType = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: Translations;
	// Helper functions for demo data translation
	tAccount: (accountName: string) => string;
	tCategory: (categoryName: string) => string;
	tDescription: (description: string) => string;
	// Locale-aware formatting
	fMoney: (cents: number) => string;
	fNumber: (value: number, decimals?: number) => string;
	fDate: (timestampSeconds: number) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

const LOCALE_STORAGE_KEY = "pfm2-locale";

const getInitialLocale = (): Locale => {
	const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
	if (stored === "en" || stored === "fr") {
		return stored;
	}
	// Default to English
	return "en";
};

type I18nProviderProps = {
	children: React.ReactNode;
};

export const I18nProvider = ({ children }: I18nProviderProps) => {
	const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

	const setLocale = useCallback((newLocale: Locale) => {
		setLocaleState(newLocale);
		localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
	}, []);

	// Sync with localStorage on mount (in case it changed in another tab)
	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (
				e.key === LOCALE_STORAGE_KEY &&
				(e.newValue === "en" || e.newValue === "fr")
			) {
				setLocaleState(e.newValue);
			}
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);

	const t = translations[locale];

	const tAccount = useCallback(
		(accountName: string) => translateAccount(locale, accountName),
		[locale],
	);

	const tCategory = useCallback(
		(categoryName: string) => translateCategory(locale, categoryName),
		[locale],
	);

	const tDescription = useCallback(
		(description: string) => translateDescription(locale, description),
		[locale],
	);

	const fMoney = useCallback(
		(cents: number) => formatMoney(locale, cents),
		[locale],
	);

	const fNumber = useCallback(
		(value: number, decimals = 2) => formatNumber(locale, value, decimals),
		[locale],
	);

	const fDate = useCallback(
		(timestampSeconds: number) => formatDateLocale(locale, timestampSeconds),
		[locale],
	);

	const value: I18nContextType = {
		locale,
		setLocale,
		t,
		tAccount,
		tCategory,
		tDescription,
		fMoney,
		fNumber,
		fDate,
	};

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextType => {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useTranslation must be used within an I18nProvider");
	}
	return context;
};
