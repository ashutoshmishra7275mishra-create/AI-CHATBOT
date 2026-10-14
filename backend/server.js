
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check: confirm that the backend is running
app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "AI Chatbot backend is running"
    });
});

// Chat API
app.post("/api/chat", async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing.");

            return res.status(500).json({
                error: "GEMINI_API_KEY is not configured on the server."
            });
        }

        const contents = req.body?.contents;

        if (!Array.isArray(contents) || contents.length === 0) {
            return res.status(400).json({
                error: "Invalid request: contents are required."
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({ contents })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            // Log the API error, never log the API key.
            console.error("Gemini API returned:", response.status, data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Gemini API request failed.",
                status: response.status
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("Backend error:", error.message);

        return res.status(500).json({
            error: "AI request failed.",
            details: error.message
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
});
