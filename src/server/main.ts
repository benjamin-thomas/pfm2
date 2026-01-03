import createServer from "./createServer";
import { initReposOrAbort } from "./repos/initRepos";

if (!process.env.BE_PORT) throw new Error("Missing mandatory env var: BE_PORT");
if (!process.env.BE_HOST) throw new Error("Missing mandatory env var: BE_HOST");
if (!process.env.FE_BASE_URL)
	throw new Error("Missing mandatory env var: FE_BASE_URL");

const BE_PORT = parseInt(process.env.BE_PORT, 10);
const BE_HOST = process.env.BE_HOST;
const FE_BASE_URL = process.env.FE_BASE_URL;

const repos = initReposOrAbort();
const app = createServer({ corsOrigin: FE_BASE_URL }, repos);

app.listen(BE_PORT, BE_HOST, () => {
	// noinspection HttpUrlsUsage
	console.log(`🚀 Server running on http://${BE_HOST}:${BE_PORT}`);
	console.log(`📡 Expecting frontend at: ${FE_BASE_URL}`);
});
