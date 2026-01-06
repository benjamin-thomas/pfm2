import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppBootstrap } from "./AppBootstrap";
import { ApiFake } from "./api-client/fake.ts";
import { ApiHttp } from "./api-client/http.ts";
import "./main.css";
import type { Api } from "./api-client/interface.ts";

// Redirects to the backend's waking-up page if not ready (for Render.com cold starts)
const ensureBackendAwake = async (apiBaseUrl: string) => {
	const params = new URLSearchParams(window.location.search);
	const attempt = parseInt(params.get("_attempt") || "0", 10);
	const href = `${apiBaseUrl}/waking-up?attempt=${attempt}`;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);
		const res = await fetch(`${apiBaseUrl}/health`, {
			signal: controller.signal,
		});
		clearTimeout(timeout);
		const contentType = res.headers.get("content-type");
		if (!contentType?.includes("application/json")) {
			window.location.href = href;
		}
	} catch {
		window.location.href = href;
	}
};

const renderRoot = (api: Api) => {
	const rootElement = document.getElementById("root");
	if (!rootElement) throw new Error("Root element not found");

	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<BrowserRouter>
				<AppBootstrap api={api} />
			</BrowserRouter>
		</React.StrictMode>,
	);
};

const init = async () => {
	// In dev, Vite proxies /api/* to the backend (see vite.config.ts)
	// In prod, VITE_API_URL must be set at build time to the backend URL
	const apiBaseUrl = import.meta.env.VITE_API_URL || "";

	// Choose the transport-agnostic data retrieval client: real (HTTP) or fake (in-memory)
	const params = new URLSearchParams(window.location.search);
	const useFakeApi = params.get("api") === "fake";
	// Only check for backend wake-up in production (for Render.com cold starts)
	if (!useFakeApi && import.meta.env.PROD) {
		await ensureBackendAwake(apiBaseUrl);
	}

	const api: Api = useFakeApi ? ApiFake.init() : ApiHttp.init(apiBaseUrl);
	return api;
};

init()
	.then((api) => renderRoot(api))
	.catch((err) => console.error(err));
