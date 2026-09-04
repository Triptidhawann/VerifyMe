require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function main() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that outputs JSON."
        },
        {
          role: "user",
          content: "Return a JSON object with a test key."
        }
      ],
      model: "groq/compound",
      response_format: { type: "json_object" }
    });
    console.log(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error("GROQ ERROR:", error);
  }
}

main();
