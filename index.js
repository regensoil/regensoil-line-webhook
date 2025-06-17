require("dotenv").config();
const express = require("express");
const { middleware, Client } = require("@line/bot-sdk");
const axios = require("axios");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);
const app = express();


app.use(middleware(config));
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const events = req.body.events;
  if (!events || events.length === 0) return res.status(200).end();

  await Promise.all(
    events.map(async (event) => {
      if (event.type === "message" && event.message.type === "text") {
        const userText = event.message.text;
        const replyToken = event.replyToken;

        try {
          const gptResponse = await axios.post(
            process.env.GPT_ENDPOINT,
            {
              model: "gpt-4o",
              messages: [{ role: "user", content: userText }],
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
            }
          );

          const reply = gptResponse.data.choices[0].message.content;
          await client.replyMessage(replyToken, {
            type: "text",
            text: reply,
          });
        } catch (err) {
          console.error("GPT error:", err.response?.data || err.message);
          await client.replyMessage(replyToken, {
            type: "text",
            text: "ขออภัยค่ะ ตอนนี้ระบบของเราขัดข้องชั่วคราว เราจะรีบติดต่อกลับไปนะคะ",
          });
        }
      }
    })
  );

  res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
