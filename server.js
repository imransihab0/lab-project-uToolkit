const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const convertapi = require('convertapi')(process.env.CONVERTAPI_SECRET);
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// Ensure an 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: 'uploads/' });

// ============================================================================
// 1. AI AGENT ORCHESTRATION ENDPOINT
// Uses Model Fallback Loop to maximize uptime and bypass rate limits
// ============================================================================
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, fileName } = req.body;
        const hasFile = !!fileName;
        
        const systemInstruction = `You are the Unified-Toolkit AI Agent. 
        Your job is to read the user's prompt and map it to one of the following system actions:
        - IMAGE_RESIZE (Shrink image to 50%)
        - IMAGE_GRAYSCALE (Convert image to B&W)
        - IMAGE_COMPRESS (Compress image size)
        - REMOVE_BG (Remove background from image)
        - TEXT_UPPERCASE (Make text uppercase)
        - TEXT_LOWERCASE (Make text lowercase)
        - TEXT_REMOVE_SPACES (Clean up extra spaces)
        - JSON_FORMAT (Beautify/format JSON)
        - JSON_MINIFY (Minify JSON)
        - CSV_TABLE (Generate a visual table from CSV data)
        - GENERATE_PASSWORD (Create a strong secure password)
        - EXCEL_CSV (Convert uploaded Excel sheet to CSV)
        - DOC_PDF (Convert uploaded Word/PPT to PDF)
        - NONE (Use this if it's general chat or if you need to ask them a question)

        CRITICAL RULE: The user has ${hasFile ? `ATTACHED A FILE named "${fileName}"` : 'NOT ATTACHED A FILE'}. 
        If the user asks to process a file but has NOT attached one, set action to "NONE" and ask them to upload it.
        If they uploaded a file but didn't give a command, set action to "NONE" and ask what they want to do with "${fileName}".

        Respond ONLY with a valid JSON object:
        {
            "reply": "Your friendly, short response.",
            "action": "THE_ACTION_CODE",
            "extractedText": "Raw text/JSON/CSV data if found in prompt"
        }`;

        // Fallback Priority: Highest RPM (Gemma) -> Highest RPD (Flash Lite) -> Stable Flash
        const fallbackModels = [
            "gemma-3n-e2b-it",               // 30 RPM / 14.4K RPD
            "gemma-3-4b-it",                 // 30 RPM / 14.4K RPD
            "gemini-3.1-flash-lite-preview", // 15 RPM / 250K RPD
            "gemini-2.5-flash-lite",          // 10 RPM / 250K RPD
            "gemini-2.5-flash"               // 5 RPM / 250K RPD
        ];

        let lastError = null;
        let aiResult = null;

        // Model Fallback Loop
        for (const modelId of fallbackModels) {
            try {
                console.log(`🤖 AI Agent: Attempting with ${modelId}...`);
                const model = genAI.getGenerativeModel({ model: modelId });
                
                const response = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
                    generationConfig: { responseMimeType: "application/json" }
                });

                aiResult = JSON.parse(response.response.text());
                console.log(`✅ AI Agent: Success with ${modelId}`);
                break; // Exit loop on success

            } catch (err) {
                lastError = err;
                console.error(`⚠️ AI Agent: ${modelId} failed (${err.status || err.message}). Retrying next...`);
                // Continue to next model in array
            }
        }

        if (!aiResult) {
            throw lastError || new Error("All models exhausted");
        }

        res.json(aiResult);

    } catch (err) {
        console.error("❌ Final AI Error:", err);
        res.status(500).json({ 
            reply: "I'm currently overwhelmed by requests! Please wait a moment and try again.", 
            action: "NONE" 
        });
    }
});

// ============================================================================
// 2. BACKGROUND REMOVAL ENDPOINT
// ============================================================================
app.post('/remove-bg', upload.single('image_file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const inputPath = path.join(__dirname, req.file.path);
    const outputPath = path.join(__dirname, `${req.file.path}_nobg.png`);

    try {
        const formData = new FormData();
        formData.append('size', 'auto');
        formData.append('image_file', fs.createReadStream(inputPath));

        const response = await axios({
            method: 'post',
            url: 'https://api.remove.bg/v1.0/removebg',
            data: formData,
            responseType: 'arraybuffer',
            headers: {
                ...formData.getHeaders(),
                'X-Api-Key': process.env.REMOVE_BG_API_KEY,
            },
        });

        fs.writeFileSync(outputPath, response.data);

        res.sendFile(outputPath, (err) => {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });
    } catch (error) {
        console.error(`BG API Error:`, error.message);
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        res.status(500).json({ error: 'Background removal failed.' });
    }
});

// ============================================================================
// 3. DOCUMENT TO PDF CONVERSION ENDPOINT
// ============================================================================
app.post('/convert-pdf', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' });

    const inputPathNoExt = path.join(__dirname, req.file.path);
    const extWithDot = path.extname(req.file.originalname).toLowerCase(); 
    const inputPath = inputPathNoExt + extWithDot;
    
    fs.renameSync(inputPathNoExt, inputPath);
    const format = extWithDot.substring(1);

    try {
        console.log(`📄 Converting ${req.file.originalname} via ConvertAPI...`);
        const result = await convertapi.convert('pdf', { File: inputPath }, format);
        
        const response = await axios({
            method: 'get',
            url: result.file.url,
            responseType: 'arraybuffer'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.split('.')[0]}.pdf"`);
        res.send(response.data);

    } catch (err) {
        console.error(`PDF API Error:`, err.message);
        res.status(500).json({ error: 'PDF Conversion failed.' });
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(inputPathNoExt)) fs.unlinkSync(inputPathNoExt);
    }
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 AI Agent Server running at http://localhost:${PORT}`);
    console.log(`=========================================`);
});