import {
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { LedgerEntry } from "../../shared/ledger";
import { compareLedgerEntry } from "../../shared/ledger";
import "./BalanceChart.css";

type BalanceChartProps = {
	ledgerEntries: LedgerEntry[];
	accountName: string;
	onPointClick?: (transactionId: number) => void;
};

export type ChartDataPoint = {
	date: string;
	balance: number;
	transactionId: number;
	// Unique key for Recharts to distinguish points with the same date
	uniqueKey: string;
};

const formatDate = (timestampSeconds: number): string => {
	// Convert seconds to milliseconds for Date constructor
	const date = new Date(timestampSeconds * 1000);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

const formatCurrency = (cents: number): string => {
	const euros = cents / 100;
	return euros.toLocaleString("fr-FR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

// Format euros for Y-axis (no decimals, with € symbol)
const formatYAxisLabel = (euros: number): string => {
	return `${euros.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
};

// Exported for testing
export const toChartData = (entries: LedgerEntry[]): ChartDataPoint[] => {
	const sortedEntries = [...entries].sort(compareLedgerEntry);

	return sortedEntries.map((entry, index) => ({
		date: formatDate(entry.date),
		balance: entry.runningBalanceCents / 100,
		transactionId: entry.id,
		// Unique key for Recharts to distinguish points with the same date
		uniqueKey: `${entry.id}-${index}`,
	}));
};

type CustomTooltipProps = {
	active?: boolean;
	payload?: Array<{ value: number; payload: ChartDataPoint }>;
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const data = payload[0];
	return (
		<div className="balance-chart-tooltip">
			<p className="balance-chart-tooltip__date">{data.payload.date}</p>
			<p className="balance-chart-tooltip__value">
				{formatCurrency(data.value * 100)} €
			</p>
		</div>
	);
};

export const BalanceChart = ({
	ledgerEntries,
	accountName,
	onPointClick,
}: BalanceChartProps) => {
	// Don't render if no data
	if (!ledgerEntries.length) return null;

	const chartData = toChartData(ledgerEntries);

	// Recharts LineChart onClick receives { activeIndex, ... } and event
	const handleChartClick = (data: unknown) => {
		const chartEvent = data as { activeIndex?: string | number } | null;
		if (chartEvent?.activeIndex == null || !onPointClick) {
			return;
		}

		const index =
			typeof chartEvent.activeIndex === "string"
				? parseInt(chartEvent.activeIndex, 10)
				: chartEvent.activeIndex;

		const point = chartData[index];

		if (point?.transactionId) {
			onPointClick(point.transactionId);
		}
	};

	return (
		<div className="balance-chart-section">
			<h3 className="balance-chart-title">Balance History for {accountName}</h3>
			<div className="balance-chart-container">
				<ResponsiveContainer width="100%" height={220}>
					<LineChart
						data={chartData}
						margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
						onClick={handleChartClick}
					>
						<XAxis
							dataKey="uniqueKey"
							stroke="var(--color-text-secondary)"
							fontSize={12}
							tickLine={false}
							axisLine={{ stroke: "var(--color-border)" }}
							tickFormatter={(_, index) => chartData[index].date}
						/>
						<YAxis
							stroke="var(--color-text-secondary)"
							fontSize={12}
							tickLine={false}
							axisLine={{ stroke: "var(--color-border)" }}
							tickFormatter={formatYAxisLabel}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Line
							type="linear"
							dataKey="balance"
							stroke="var(--color-primary)"
							strokeWidth={2}
							dot={{
								fill: "var(--color-primary)",
								strokeWidth: 0,
								r: 4,
								cursor: "pointer",
							}}
							activeDot={{
								fill: "var(--color-primary)",
								strokeWidth: 2,
								stroke: "var(--color-card-bg)",
								r: 6,
								cursor: "pointer",
							}}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};
