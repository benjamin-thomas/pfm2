import type { IO } from "./interface";

type FakeIO_Options = {
	now: number;
};

export const makeFakeIO = ({ now }: FakeIO_Options) => {
	const logInfoLines: unknown[][] = [];
	const logErrLines: unknown[][] = [];

	const io: IO = {
		logInfo: (...args) => logInfoLines.push(args),
		logErr: (...args) => logErrLines.push(args),
		now: () => now,
	};

	const advanceTime = (ms: number) => {
		now += ms;
	};

	const setTime = (newTime: number) => {
		now = newTime;
	};

	return { io, logInfoLines, logErrLines, advanceTime, setTime };
};
