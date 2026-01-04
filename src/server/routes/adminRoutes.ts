import type { Router } from "express";
import type { Repos } from "../repos/initRepos";
import { resetAllData } from "../repos/seedData";

export const registerAdminRoutes = (router: Router, repos: Repos): void => {
	router.post("/api/admin/reset", (_req, res) => {
		try {
			resetAllData(repos);
			res.sendStatus(204);
		} catch (error) {
			console.error("Error in POST /api/admin/reset:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});
};
