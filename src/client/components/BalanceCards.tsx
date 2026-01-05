import type React from "react";
import { useEffect, useState } from "react";
import type { AccountBalance } from "../../shared/account";
import { BalanceCard } from "./BalanceCard";
import "./BalanceCards.css";

type BalanceCardsProps = {
	balances: AccountBalance[];
	selectedAccountId: number;
	onSelectAccount: (accountId: number) => void;
};

const MOBILE_BREAKPOINT = 640;
const CARDS_PER_PAGE_DESKTOP = 3;
const CARDS_PER_PAGE_MOBILE = 1;

export const BalanceCards: React.FC<BalanceCardsProps> = ({
	balances,
	selectedAccountId,
	onSelectAccount,
}) => {
	const [currentPage, setCurrentPage] = useState(0);
	const [isMobile, setIsMobile] = useState(
		window.innerWidth < MOBILE_BREAKPOINT,
	);

	// Handle window resize for responsive behavior
	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < MOBILE_BREAKPOINT;
			setIsMobile(mobile);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const cardsPerPage = isMobile
		? CARDS_PER_PAGE_MOBILE
		: CARDS_PER_PAGE_DESKTOP;
	const totalPages = Math.ceil(balances.length / cardsPerPage);

	// Ensure currentPage stays in bounds when cardsPerPage changes
	useEffect(() => {
		if (currentPage >= totalPages && totalPages > 0) {
			setCurrentPage(totalPages - 1);
		}
	}, [currentPage, totalPages]);

	// Check if selected card is visible on current page
	const selectedCardIndex = balances.findIndex(
		(b) => b.accountId === selectedAccountId,
	);
	const selectedCardPage = Math.floor(selectedCardIndex / cardsPerPage);
	const isSelectedVisible = selectedCardPage === currentPage;
	const selectedAccountName =
		selectedCardIndex >= 0 ? balances[selectedCardIndex].accountName : null;

	// Scroll to show selected card (puts it in first position of its page)
	const scrollToSelected = () => {
		if (selectedCardIndex >= 0) {
			setCurrentPage(selectedCardPage);
		}
	};

	// Calculate transform for sliding animation
	const translateX = -(currentPage * 100);

	// If fewer cards than cardsPerPage, no carousel needed
	if (balances.length <= cardsPerPage) {
		return (
			<div>
				<h2 className="section-title">Balances</h2>
				<div className="balances">
					{balances.map((balance) => (
						<BalanceCard
							key={balance.accountId}
							balance={balance}
							isSelected={balance.accountId === selectedAccountId}
							onClick={() => onSelectAccount(balance.accountId)}
						/>
					))}
				</div>
			</div>
		);
	}

	return (
		<div>
			<h2 className="section-title">Balances</h2>

			{/* Carousel viewport */}
			<div className="carousel-viewport">
				<div
					className="carousel-track"
					style={{ transform: `translateX(${translateX}%)` }}
				>
					{balances.map((balance) => (
						<div
							key={balance.accountId}
							className={`carousel-card ${isMobile ? "carousel-card--mobile" : ""}`}
						>
							<BalanceCard
								balance={balance}
								isSelected={balance.accountId === selectedAccountId}
								onClick={() => onSelectAccount(balance.accountId)}
							/>
						</div>
					))}
				</div>
			</div>

			{/* Dot indicators */}
			<div className="carousel-dots">
				{Array.from({ length: totalPages }, (_, pageIndex) => {
					// Using index as key is safe here because dots are static
					// and only change count when balances change
					const dotKey = `dot-${totalPages}-${pageIndex}`;
					return (
						<button
							key={dotKey}
							type="button"
							className={`carousel-dot ${pageIndex === currentPage ? "carousel-dot--active" : ""}`}
							onClick={() => setCurrentPage(pageIndex)}
							aria-label={`Go to page ${pageIndex + 1}`}
						/>
					);
				})}
			</div>

			{/* Off-screen selected indicator */}
			{!isSelectedVisible && selectedAccountName && (
				<button
					type="button"
					className="carousel-selected-indicator"
					onClick={scrollToSelected}
				>
					Selected: {selectedAccountName} (click to view)
				</button>
			)}
		</div>
	);
};
