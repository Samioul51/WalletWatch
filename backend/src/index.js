import "dotenv/config";

process.env.TZ = process.env.TZ || "Asia/Dhaka";

import connectDB from "./config/db/dbConnect.js";
import app from "./app.js";

const port = process.env.PORT || 3000;

let isConnected = false;

const dbConnection = async () => {
	if (isConnected) 
		return;

	await connectDB();
	isConnected = true;
};

export default async function handler(req, res) {
	try {
		await dbConnection();
		return app(req, res);
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Server initialization failed",
		});
	}
}
