import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
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
const SWIPE_THRESHOLD = 30; // Minimum pixels to trigger a swipe
const BOUNCE_RESISTANCE = 0.3; // How much the carousel resists at boundaries (0-1)
const BOUNCE_MAX_OFFSET = 50; // Maximum bounce offset in pixels
const WHEEL_DEBOUNCE_MS = 200; // Debounce for wheel navigation (synced with CSS transition)

export const BalanceCards: React.FC<BalanceCardsProps> = ({
	balances,
	selectedAccountId,
	onSelectAccount,
}) => {
	const [currentPage, setCurrentPage] = useState(0);
	const [isMobile, setIsMobile] = useState(
		window.innerWidth < MOBILE_BREAKPOINT,
	);
	const [swipeOffset, setSwipeOffset] = useState(0);
	const [isSwiping, setIsSwiping] = useState(false);
	const [isWheelActive, setIsWheelActive] = useState(false);
	const viewportRef = useRef<HTMLDivElement>(null);
	const lastWheelTime = useRef(0);
	const currentPageRef = useRef(currentPage);
	const totalPagesRef = useRef(0);

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

	// Ensure the currentPage stays in bounds when cardsPerPage changes
	useEffect(() => {
		if (currentPage >= totalPages && totalPages > 0) {
			setCurrentPage(totalPages - 1);
		}
	}, [currentPage, totalPages]);

	// Auto-select the visible card when the page changes in mobile mode
	useEffect(() => {
		if (isMobile && balances.length > 0) {
			const visibleCardIndex = currentPage;
			if (balances[visibleCardIndex]) {
				onSelectAccount(balances[visibleCardIndex].accountId);
			}
		}
	}, [currentPage, isMobile, balances, onSelectAccount]);

	// Check if the selected card is visible on the current page
	const selectedCardIndex = balances.findIndex(
		(b) => b.accountId === selectedAccountId,
	);
	const selectedCardPage = Math.floor(selectedCardIndex / cardsPerPage);
	const isSelectedVisible = selectedCardPage === currentPage;
	const selectedAccountName =
		selectedCardIndex >= 0 ? balances[selectedCardIndex].accountName : null;

	// Scroll to show the selected card (puts it in the first position of its page)
	const scrollToSelected = () => {
		if (selectedCardIndex >= 0) {
			setCurrentPage(selectedCardPage);
		}
	};

	// Calculate bounce effect at boundaries
	const calculateBounceOffset = (deltaX: number): number => {
		const isAtStart = currentPage === 0;
		const isAtEnd = currentPage === totalPages - 1;

		// Swiping right (positive delta) at the start
		if (isAtStart && deltaX > 0) {
			return Math.min(deltaX * BOUNCE_RESISTANCE, BOUNCE_MAX_OFFSET);
		}
		// Swiping left (negative delta) at the end
		if (isAtEnd && deltaX < 0) {
			return Math.max(deltaX * BOUNCE_RESISTANCE, -BOUNCE_MAX_OFFSET);
		}
		return deltaX;
	};

	// Keep refs in sync for wheel handler (avoids stale closure)
	useEffect(() => {
		currentPageRef.current = currentPage;
		totalPagesRef.current = totalPages;
	}, [currentPage, totalPages]);

	// Wheel handler for desktop navigation (non-passive to allow preventDefault)
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport || isMobile) return;

		const handleWheel = (e: WheelEvent) => {
			const now = Date.now();
			if (now - lastWheelTime.current < WHEEL_DEBOUNCE_MS) return;

			const isAtStart = currentPageRef.current === 0;
			const isAtEnd = currentPageRef.current === totalPagesRef.current - 1;

			// Scroll down (positive deltaY) → next page
			if (e.deltaY > 0 && !isAtEnd) {
				e.preventDefault();
				lastWheelTime.current = now;
				setCurrentPage((prev) => prev + 1);
			}
			// Scroll up (negative deltaY) → previous page
			else if (e.deltaY < 0 && !isAtStart) {
				e.preventDefault();
				lastWheelTime.current = now;
				setCurrentPage((prev) => prev - 1);
			}
			// At boundaries: don't preventDefault, let the page scroll naturally
		};

		// { passive: false } is required for preventDefault() to work
		viewport.addEventListener("wheel", handleWheel, { passive: false });
		return () => viewport.removeEventListener("wheel", handleWheel);
	}, [isMobile]);

	// Hover handlers for wheel-active visual feedback
	const handleMouseEnter = () => {
		if (!isMobile) setIsWheelActive(true);
	};

	const handleMouseLeave = () => {
		setIsWheelActive(false);
	};

	// Swipe handlers
	const handlers = useSwipeable({
		onSwiping: (eventData) => {
			if (!isMobile) return;
			setIsSwiping(true);
			const offset = calculateBounceOffset(eventData.deltaX);
			setSwipeOffset(offset);
		},
		onSwipedLeft: () => {
			if (!isMobile) return;
			setIsSwiping(false);
			setSwipeOffset(0);
			if (currentPage < totalPages - 1) {
				setCurrentPage((prev) => prev + 1);
			}
		},
		onSwipedRight: () => {
			if (!isMobile) return;
			setIsSwiping(false);
			setSwipeOffset(0);
			if (currentPage > 0) {
				setCurrentPage((prev) => prev - 1);
			}
		},
		onTouchEndOrOnMouseUp: () => {
			// Reset state if the swipe action didn't complete (e.g., below threshold)
			setIsSwiping(false);
			setSwipeOffset(0);
		},
		preventScrollOnSwipe: true,
		trackTouch: true,
		trackMouse: false,
		delta: SWIPE_THRESHOLD,
	});

	// Calculate transform for sliding animation
	const getViewportWidth = () => viewportRef.current?.offsetWidth || 0;
	const baseTranslateX = -(currentPage * 100);
	const swipeOffsetPercent =
		getViewportWidth() > 0 ? (swipeOffset / getViewportWidth()) * 100 : 0;
	const totalTranslateX = baseTranslateX + swipeOffsetPercent;

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
		<div {...handlers}>
			<h2 className="section-title">Balances</h2>

			{/* Scroll hint - always rendered to prevent layout shift, visibility controlled by CSS */}
			{!isMobile && totalPages > 1 && (
				<div
					className={`carousel-wheel-hint ${isWheelActive ? "carousel-wheel-hint--visible" : ""}`}
				>
					Scroll to cycle
				</div>
			)}

			{/* Carousel viewport */}
			{/* biome-ignore lint/a11y/useSemanticElements: carousel viewport needs hover handlers for the wheel hint */}
			<div
				role="region"
				aria-label="Balance cards carousel"
				className="carousel-viewport"
				ref={viewportRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				<div
					className={`carousel-track ${isSwiping ? "carousel-track--swiping" : ""}`}
					style={{ transform: `translateX(${totalTranslateX}%)` }}
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
					// Using index as a key is safe here because dots are static
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

			{/* Off-screen selected indicator - only show on desktop since mobile auto-selects */}
			{!isMobile && !isSelectedVisible && selectedAccountName && (
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
