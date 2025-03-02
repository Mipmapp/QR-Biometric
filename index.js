const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

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

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
