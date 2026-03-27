import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';

const router: Router = Router();

// Use raw fetch to bypass SDK versioning constraints and test v1beta
export const listAvailableModels = async (req: Request, res: Response) => {
    try {
        // 1. Get Key from DB
        const setting = await db.select().from(settings).limit(1);
        const apiKey = setting[0]?.googleApiKey || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "No API Key found in Database or Environment",
                env_checked: ["Database Settings", "GOOGLE_API_KEY"]
            });
        }

        console.log("🔍 Debug: Fetching models from Google v1beta API using DB key...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Google API Error (v1beta)",
                details: data
            });
        }

        res.json(data);
    } catch (error: any) {
        console.error("❌ Debug Route Failure:", error);
        res.status(500).json({ error: error.toString(), stack: error.stack });
    }
};

router.get('/models', listAvailableModels);

export default router;
