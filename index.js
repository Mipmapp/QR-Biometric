const express = require("express");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const multer = require("multer");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");


const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Multer for image uploads (stores in "public/uploads/")
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public/uploads");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // Ensure the folder exists
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

const DATA_FILE = path.join(__dirname, "public/registered.json");

// Ensure `registered.json` exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]"); // Initialize with empty array
}

// Serve main and register pages
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/register", (_, res) => res.sendFile(path.join(__dirname, "public/register.html")));
app.get("/documents", (_, res) => res.sendFile(path.join(__dirname, "public/document.html")));
app.get("/json", (_, res) => res.sendFile(path.join(__dirname, "public/json.html")));
app.get("/haircut", (_, res) => res.sendFile(path.join(__dirname, "public/haircut/index.html")));

// Handle user registration
const cors = require("cors");
app.use(cors());

app.use('/registered.json', express.static(DATA_FILE));
app.post("/register", upload.single("image"), (req, res) => {
    console.log("Received form data:", req.body); // Debugging

    const { id, name, grade, section, mobile_num, userType } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Save image path

    if (userType === "student" && (!id || !name || !mobile_num)) {
        return res.status(400).json({ message: "ID, Name, and Mobile Number are required!" });
    }

    fs.readFile(DATA_FILE, "utf8", (err, data) => {
        if (err) return res.status(500).json({ message: "Error reading data" });

        let users = [];
        try {
            users = data ? JSON.parse(data) : []; // Ensure it doesn't reset to an empty state
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return res.status(500).json({ message: "Invalid JSON format" });
        }

        const existingIndex = users.findIndex(user => user.id === id);
        let message = "User registered successfully!";

        if (existingIndex !== -1) {
            users[existingIndex] = { id, name, grade, section, userType, mobile_num, image: imagePath };
            message = "User details updated successfully!";
        } else {
            users.push({ id, name, grade, section, userType, mobile_num, image: imagePath });
        }

        console.log("Updated Users List:", users);

        fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error("Error saving data:", err);
                return res.status(500).json({ message: "Error saving data" });
            }
            res.json({ message, success: true });
        });
    });
});

// Handle user deletion
app.delete("/delete/:id", (req, res) => {
    const { id } = req.params;

    fs.readFile(DATA_FILE, "utf8", (err, data) => {
        if (err) return res.status(500).json({ message: "Error reading data" });

        let users = [];
        try {
            users = data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return res.status(500).json({ message: "Invalid JSON format" });
        }

        const updatedUsers = users.filter(user => user.id !== id);

        if (users.length === updatedUsers.length) {
            return res.status(404).json({ message: "User  not found" });
        }

        fs.writeFile(DATA_FILE, JSON.stringify(updatedUsers, null, 2), (err) => {
            if (err) {
                console.error("Error saving data:", err);
                return res.status(500).json({ message: "Error saving data" });
            }
            res.json({ message: "User  deleted successfully", success: true });
        });
    });
});

app.put("/update/:id", upload.single("image"), (req, res) => {
    const { id } = req.params;
    const { name, grade, section, mobile_num, userType } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Store the new image path if uploaded

    console.log("Received Update Request:", req.body); // ✅ Debugging log
    // console.log("Uploaded Image:", req.file);

    fs.readFile(DATA_FILE, "utf8", (err, data) => {
        if (err) return res.status(500).json({ message: "Error reading data" });

        let users = [];
        try {
            users = JSON.parse(data) || [];
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return res.status(500).json({ message: "Invalid JSON format" });
        }

        const userIndex = users.findIndex(user => String(user.id) === String(id));
        if (userIndex === -1) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update user details
        users[userIndex] = {
            ...users[userIndex],
            name,
            grade,
            section,
            mobile_num,
            userType,
            image: imagePath || users[userIndex].image, // Keep old image if not updated
        };

        fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error("Error saving data:", err);
                return res.status(500).json({ message: "Error saving data" });
            }
            res.json({ message: "User updated successfully!", success: true });
        });
    });
});

const genAPI = [
    "AIzaSyDdvYCReYbK3C7uw4wnplQDMyDfuWlPYNg",
    "AIzaSyBl74QFcr6JYwHeVSHcFvVNiFsEDyqs9J8",
    "AIzaSyCyh0Wdd4kM97NxIah71VcxyYDqKRSIjUE",
    "AIzaSyAgiGw281bYAWHb0PiPVIr3kvdZP2GN2Bk",
    "AIzaSyDeTgfuEiq7t8FJZQP3IGcLYWbK9hbfqWI"
];

// Function to get a random API key
function getRandomApiKey(usedKeys) {
    const availableKeys = genAPI.filter(key => !usedKeys.has(key));
    return availableKeys.length > 0 ? availableKeys[Math.floor(Math.random() * availableKeys.length)] : null;
}

// Converts image file to Base64 for Gemini API
function fileToGenerativePart(filePath, mimeType) {
    try {
        return {
            inlineData: {
                data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
                mimeType,
            },
        };
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return null;
    }
}

// Image Upload & Gemini Processing
app.post("/haircut-image", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
    }

    try {
        const imagePath = path.join(__dirname, "public", "uploads", req.file.filename);

        // Convert image for Gemini API
        const imagePart = fileToGenerativePart(imagePath, "image/png");
        if (!imagePart) {
            return res.status(500).json({ message: "Failed to read image file." });
        }

        // Delete the image file after conversion (to free up space)
        fs.unlinkSync(imagePath);

        // Prompt for Gemini API
        const prompt = `Analyze the submitted "My Haircut" image and verify if it follows the school's grooming policy. Respond with the appropriate message based on the haircut's compliance.

Key Requirements:
Hair must be freshly groomed and neatly trimmed.
The sides and back must be properly tapered or faded—excessive length or bulk is not allowed. If the sides appear noticeably longer or thicker than the required standard, mark it as unacceptable.
The top hair can be slightly longer, as long as the sides are trimmed, tapered, or faded.
Hair must not cover the ears, eyebrows, or extend past the collar.
No hair coloring or highlights—only natural hair color is allowed.
The image must clearly show the haircut (no accessories, hats, or filters).
Automated System Responses:
"Don't bow your head." – If the person is tilting their head downward.
"No Person Detected" – No person is found in the image.
"Please ensure only one person is in the frame." – Multiple faces detected.
"Image is too blurry, please move closer." – The face is unclear, blurry, too distant, or does not properly show the haircut.
"Acceptable" – The haircut meets the school's requirements.
"Unacceptable - Hair is too long." – The hair exceeds the allowed length.
"Unacceptable - Hair is colored." – Artificial hair dye or highlights are detected.
"Unacceptable - Sides are too long." – The sides are longer than permitted or not properly tapered.
If a response above is selected, do not provide additional reasoning. If another issue is detected, return:

"Unacceptable - [Other Reason]" – The haircut violates other school policies (e.g., unkempt appearance, extreme styles).
Refer to "My Haircut" as the user’s haircut, using "You" or "Your" for clarity. Keep responses simple, concise, direct, and jargon-free.`;

        let usedKeys = new Set();
        let geminiResponse;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            const apiKey = getRandomApiKey(usedKeys);
            if (!apiKey) break;
            usedKeys.add(apiKey);

            try {
                console.log(`Using API Key: ${apiKey}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                geminiResponse = await model.generateContent([prompt, imagePart]);

                console.log("AI Response:", geminiResponse.response.text());

                // Send response to frontend
                return res.json({ result: await geminiResponse.response.text() });
            } catch (error) {
                attempts++;
                console.error(`Attempt ${attempts} failed:`, error.message);

                if (attempts < maxAttempts) {
                    console.log("Retrying in 1 second...");
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.error("Max retry attempts reached. Gemini API failed.");
                    return res.status(500).json({ message: "Failed to analyze image after multiple attempts." });
                }
            }
        }

    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ message: "Failed to process image" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
