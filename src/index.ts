import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "./config/database";
import app from "./app"; // Rename app.ts to app.ts if it's not already

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
	.then(() => {
		console.log("Database connection established");
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.error("Error connecting to database:", error);
	});
