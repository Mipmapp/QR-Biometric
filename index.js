const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.4/html5-qrcode.min.js

const fs = require('fs');

// Path to your SVG file
const svgFilePath = 'account.svg';

// Function to convert SVG to Base64
function convertSvgToBase64(filePath) {
    // Read the SVG file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading SVG file:', err);
            return;
        }

        // Encode the SVG data as Base64
        const base64EncodedSvg = Buffer.from(data).toString('base64');

        // Print or save the Base64 string
        console.log('Base64 Encoded SVG:');
        console.log(`data:image/svg+xml;base64,${base64EncodedSvg}`);

        // Optionally, save to a text file (Base64)
        // fs.writeFileSync('svg_base64.txt', `data:image/svg+xml;base64,${base64EncodedSvg}`);
    });
}

// Call the function with your SVG file path
//convertSvgToBase64(svgFilePath);