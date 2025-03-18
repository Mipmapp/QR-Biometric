const axios = require('axios');

const url = 'https://gemini-api-5k0h.onrender.com/gemini/image';
const params = {
  q: `This haircut is required for our school policy. I want you to respond in this format: '[Acceptable/Unacceptable] [Reason]' or, if no face is detected, simply reply with 'No Face Detected.' If the hair is colored, even if the haircut follows the required style, mark it as 'Unacceptable' with the reason being 'Hair is colored.' Please follow the prompt properly.`,
  url: 'https://files.catbox.moe/a13ppy.jpg'
};

axios.get(url, {
  params,
  headers: {
    'Accept': 'application/json'
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error('Error:', error);
});
