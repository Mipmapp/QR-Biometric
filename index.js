const express = require("express");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const multer = require("multer");
const axios = require("axios");

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

const IMAGEBB_API_KEY = "863b264408181e62e7f1b1110f6fbefa";

app.post("/haircut-image", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
    }

    try {
        const imagePath = path.join(__dirname, "public", "uploads", req.file.filename);
        const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

        const formData = new URLSearchParams();
        formData.append("key", IMAGEBB_API_KEY);
        formData.append("image", imageBase64);
        formData.append("expiration", 600);

        // Upload to ImageBB
        const imagebbResponse = await axios.post("https://api.imgbb.com/1/upload", formData);
        const imageUrl = imagebbResponse.data.data.url;

        console.log("Image URL:", imageUrl);

        // Delete the temporary file after successful upload
        fs.unlinkSync(imagePath);

        // Retry mechanism for Gemini API (up to 3 attempts)
        let geminiResponse;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                geminiResponse = await axios.get("https://gemini-api-5k0h.onrender.com/gemini/image", {
                    params: {
                        q: `Ensure the student's haircut complies with school policy. Respond with one of the following:  

- "No Face Detected" if no face is found in the image.  
- "Please one person at a time" if there are more than an individual in the image.
- "Face is too far, please come closer." if the face is not clear or too distant and not that close similar to the required haircut.
- "Acceptable" if the haircut meets the requirements.  
- "Acceptable" if the haircut has a cut on the sides and not too long.  
- "Unacceptable - [Reason]" if it violates the policy (e.g., "Unacceptable - Hair is too long").  
- "Unacceptable - Hair is colored" if the hair is dyed.`,
                        url: imageUrl,
                    },
                    headers: { "Accept": "application/json" }
                });

                // If successful, break out of the loop
                break;

            } catch (error) {
                attempts++;
                console.error(`Attempt ${attempts} failed:`, error.message);

                if (attempts < maxAttempts) {
                    console.log("Retrying in 1 second...");
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
                } else {
                    console.error("Max retry attempts reached. Gemini API failed.");
                    return res.status(500).json({ message: "Failed to analyze image after multiple attempts" });
                }
            }
        }

        // Send response to frontend
        res.json({
            imageUrl,
            result: geminiResponse.data,
        });

        console.log("AI Response:", geminiResponse.data);

    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ message: "Failed to process image" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
