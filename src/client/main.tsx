import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppBootstrap } from "./AppBootstrap";
import { ApiFake } from "./api-client/fake.ts";
import { ApiHttp } from "./api-client/http.ts";
import "./main.css";

// Choose the API implementation based on URL param: ?api=fake
const params = new URLSearchParams(window.location.search);
const api = params.get("api") === "fake" ? ApiFake.init() : ApiHttp.init();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<AppBootstrap api={api} />
		</BrowserRouter>
	</React.StrictMode>,
);
