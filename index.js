const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "5mb" })); // Allow image data

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const DATA_FILE = path.join(__dirname, "public/registered.json");

// Serve the register page
app.get("/register", (_, res) => {
    res.sendFile(path.join(__dirname, "public/register.html"));
});

// Register new user
app.post("/register", (req, res) => {
    const { name, grade, section, mobile_num, image } = req.body;

    if (!name || !grade || !section || !mobile_num) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    const newUser = {
        id: crypto.randomUUID(),
        name,
        grade,
        section,
        mobile_num,
        image: image || "",
    };

    console.log(newUser)

    // Read existing data
    fs.readFile(DATA_FILE, "utf8", (err, data) => {
        if (err) return res.status(500).json({ message: "Error reading data" });

        let users = JSON.parse(data);
        users.push(newUser);

        // Save updated data
        fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).json({ message: "Error saving data" });
            res.json({ message: "User registered successfully!" });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

//https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.4/html5-qrcode.min.js