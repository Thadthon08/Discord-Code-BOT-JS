// โหลดค่าจาก .env
require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- ตั้งค่า Discord Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// --- ตั้งค่า Google Gemini AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
});

// Event รับข้อความ
client.on("messageCreate", async (message) => {
  // ไม่สนใจข้อความจากบอทด้วยกันเอง;
  if (message.author.bot) return;

  if (!message.mentions.has(client.user)) return;

  try {
    await message.channel.sendTyping();

    // เตรียม Prompt สำหรับส่งให้ AI
    const userPrompt = message.content.replace(/<@!?\d+>/, "").trim();

    const fullPrompt = `คุณคือผู้ช่วยเขียนโปรแกรมมืออาชีพชื่อ "Code Helper" หน้าที่ของคุณคือตอบคำถามเกี่ยวกับโค้ดดิ้ง, อธิบายแนวคิด, และให้ตัวอย่างโค้ดที่ชัดเจนและถูกต้อง คำถามคือ: "${userPrompt}"`;

    // ส่ง Prompt ไปให้ Gemini AI
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiText = response.text();

    // Discord จำกัดความยาวข้อความไว้ที่ 2000 ตัวอักษร
    // ถ้าคำตอบยาวเกินไป ให้แบ่งส่งเป็นหลายข้อความ
    if (aiText.length > 2000) {
      const chunks = aiText.match(/[\s\S]{1,2000}/g) || [];
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } else {
      await message.reply(aiText);
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการประมวลผล AI:", error);
    await message.reply(
      "ขออภัยครับ เกิดข้อผิดพลาดบางอย่างในการประมวลผลคำขอของท่าน"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
