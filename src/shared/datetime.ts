// Date/time helpers - using Unix timestamps

export const unixToDate = (timestamp: number): Date =>
	new Date(timestamp * 1000);

export const dateToUnix = (date: Date): number =>
	Math.floor(date.getTime() / 1000);

export const formatDate = (timestamp: number): string => {
	const date = unixToDate(timestamp);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};
