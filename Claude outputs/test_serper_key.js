const axios = require('axios');

let data = JSON.stringify({
  "q": "D&G THE ONLY ONE perfume bottle",
  "num": 5,
  "tbs": "isz:l"
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://google.serper.dev/images',
  headers: {
    'X-API-KEY': '0f35f7f0227d1f67a96be7e2f55e053468fa5013',
    'Content-Type': 'application/json'
  },
  data: data
};

async function makeRequest() {
  try {
    const response = await axios.request(config);
    console.log("STATUS:", response.status);
    console.log("credits/results:", JSON.stringify(response.data).slice(0, 500));
    console.log("image count:", (response.data.images || []).length);
  } catch (error) {
    console.log("ERROR STATUS:", error.response ? error.response.status : "no response");
    console.log("ERROR BODY:", error.response ? JSON.stringify(error.response.data) : error.message);
  }
}
makeRequest();
