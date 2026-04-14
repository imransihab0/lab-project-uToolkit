# 🛠️ Unified-Toolkit: Agentic AI Workspace

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Unified-Toolkit is a consolidated, high-performance web application that brings essential developer and productivity utilities under one roof. 

Moving beyond traditional static tools, this project introduces an **Agentic AI Orchestration Layer**. Users can switch between a standard Manual Dashboard and an intelligent AI Agent that understands natural language, processes uploaded files, and automatically executes system tools on your behalf.

---

## ✨ Key Features

### 🤖 Agentic AI Workspace
* **Natural Language Processing:** Upload a file and simply tell the AI what to do (e.g., *"Remove the background from this image"* or *"Convert this Word doc to PDF"*).
* **Smart Model Fallback System:** Built-in rate-limit protection prioritizing high-RPM Gemma models to ensure 100% uptime.
* **Inline File Attachments:** Modern chat interface with visual file thumbnails and upload previews.

### 🧰 Manual Utilities
* **Image Studio:** Resize (50%), Grayscale, Compress, and AI Background Removal.
* **Document Converters:** Seamlessly convert DOCX/PPTX to PDF and Excel to CSV.
* **Text & Code Tools:** JSON Beautifier/Minifier, Text Case Converters, and Space Cleaners.
* **Data Tools:** Interactive CSV table visualizer and Secure Password Generator.

---

## 🧠 What is the "AI-Driven Orchestration Layer"?

In traditional applications, users must navigate menus, click buttons, and manually select tools to execute functions. The **AI-Driven Orchestration Layer** replaces this manual routing with an intelligent natural language interface. 

It acts as a smart "translator" between the user's messy human language and the application's strict programmatic functions:

1. **The Input:** The user types a goal, e.g., *"Make this image black and white."*
2. **The Orchestrator:** The Gemini/Gemma model reads the prompt, checks the available system tools, and determines the exact intent.
3. **The Output:** The AI translates the human text into a strict JSON machine command (e.g., `{ "action": "IMAGE_GRAYSCALE" }`).
4. **The Execution:** The backend catches this JSON command and automatically triggers the corresponding hardcoded JavaScript function.

---

## 🏗️ Tech Stack

* **Frontend:** Vanilla JavaScript, HTML5, Tailwind CSS, SheetJS
* **Backend:** Node.js, Express.js, Multer (File parsing)
* **AI & Machine Learning:** `@google/generative-ai` SDK (Gemma 3 & Gemini Flash Lite)
* **External APIs:** ConvertAPI (Document Processing), Remove.bg API (Image Matting)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* API Keys for Gemini, Remove.bg, and ConvertAPI.

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/unified-toolkit.git](https://github.com/yourusername/unified-toolkit.git)
cd unified-toolkit
```

### 2. Set up Environment Variables
To connect the application to the external APIs and AI models, you need to configure your environment variables.
Create a file named .env in the root directory of your project. Copy the template below and paste your specific API keys right after the = sign. Do not include spaces or quotes.

```code
# API key for [https://www.remove.bg/](https://www.remove.bg/)
REMOVE_BG_API_KEY=

# API key for [https://www.convertapi.com/](https://www.convertapi.com/)
CONVERTAPI_SECRET=

# Google Generative AI / Gemini API Key (Get from Google AI Studio)
GEMINI_API_KEY=

# Port details for local development
PORT=3000
```

### 3. Install & Start the Server
Because this project utilizes a custom prestart hook in the package.json, you do not need to run npm install manually. Simply run the start command. Node.js will automatically download all required dependencies (approx. 20-30 MB) and boot up the server in one go:
```bash
npm start
```

### 4. Open the App
Just open the index.html file in any browser and you are good to go!

## 🔁 How the AI Fallback Works
To prevent 429 Too Many Requests errors from interrupting the user experience, our Node.js server implements an automatic fallback loop. When a user sends a prompt, the system tries models in this exact priority:

```code
1. gemma-3n-e2b-it (Fastest, 30 RPM / 14.4k RPD)
2. gemma-3-4b-it
3. gemini-3.1-flash-lite-preview
4. gemini-2.5-flash-lite
5. gemini-2.5-flash
```

If a model's rate limit is exhausted, the server catches the error and instantly routes the prompt to the next available AI brain without the user ever noticing!

## 👨‍💻 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
![MIT](https://choosealicense.com/licenses/mit/)
