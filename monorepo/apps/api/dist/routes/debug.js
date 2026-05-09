import { Router } from 'express';
import { verifyToken } from '../lib/auth.js';
import { getMergedSettings } from '../lib/settings-helper.js';
const router = Router();
// Block debug routes in production
if (process.env.NODE_ENV === 'production') {
    router.use((_req, res) => res.status(404).json({ error: 'Not found' }));
}
// Use raw fetch to bypass SDK versioning constraints and test v1beta
export const listAvailableModels = async (req, res) => {
    try {
        // 1. Get Key from DB
        const appSettings = await getMergedSettings();
        const apiKey = appSettings?.googleApiKey || process.env.GOOGLE_API_KEY;
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
    }
    catch (error) {
        console.error("❌ Debug Route Failure:", error);
        res.status(500).json({ error: error.toString(), stack: error.stack });
    }
};
router.get('/models', verifyToken, listAvailableModels);
export default router;
//# sourceMappingURL=debug.js.map