import express from "express";
import dotenv from "dotenv";
import { connect } from "mongoose";

import controller from "./controller";

dotenv.config();

const app = express();

const PORT = process.env.PORT;

// CORS
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	next();
});

app.use(express.json());

if (process.env.DB_URI) {
	try {
		await connect(process.env.DB_URI);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
} else {
	console.error("Mongo database connection string not found in the environment variable");
	process.exit(1);
}

app.use("/v1", controller);

app.listen(PORT || 3000, () => {
	console.log("\x1b[32m ➜ %s\x1b[0m", ` Server:  http://localhost:${PORT || 3000}`);
});
