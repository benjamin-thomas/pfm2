import type { IO } from "./interface";

export const RealIO: IO = {
	logInfo: (...args) => console.log(...args),
	logErr: (...args) => console.error(...args),
	now: () => Math.floor(Date.now() / 1000),
};
