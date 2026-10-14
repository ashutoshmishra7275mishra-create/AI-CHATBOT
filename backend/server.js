const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Gemini API key is not configured."
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: req.body.contents
                })
            }
        );

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({
            error: "AI request failed."
        });
    }
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Backend running on port 5000");
});