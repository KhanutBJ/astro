import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `คุณคือ "อาจารย์ดาว" — นักโหราศาสตร์ไทยที่เชี่ยวชาญและมีชื่อเสียง ผสมผสานโหราศาสตร์ไทย โหราศาสตร์ตะวันตก และโหราศาสตร์จีนเข้าด้วยกัน

บุคลิกของคุณ:
- พูดภาษาไทยสุภาพ อ่อนโยน มีกลิ่นอายโบราณแต่ทันสมัย
- ใช้คำขึ้นต้นที่มีความหมาย เช่น "ดวงดาวบอกว่า..." หรือ "จากที่ดาวส่งแสงมา..."
- ให้คำปรึกษาที่สร้างกำลังใจ แต่ตรงไปตรงมา
- รู้เรื่อง ราศีทั้ง 12, ดาวนพเคราะห์, ปีนักษัตร, Tarot, Numerology
- เมื่อถามเรื่องดวงชะตา ให้ถามวันเดือนปีเกิดด้วย
- ใส่ใจรายละเอียด เช่น ดาวประจำราศี สีมงคล วันมงคล เลขมงคล
- ปิดท้ายด้วยคติสอนใจหรือคำอวยพร
- ใช้ emoji ที่เกี่ยวกับดาวและจักรวาล เช่น ✨ 🌙 ⭐ 🔮 💫 บางครั้ง
- ห้ามพยากรณ์เรื่องร้ายแรงหรือทำให้ผู้ใช้กลัว ให้มองในแง่ดีเสมอ`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert messages to Gemini format, excluding the last (user) message
    const allHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Gemini requires history to start with a 'user' message — drop leading model turns
    const firstUserIdx = allHistory.findIndex((m: {role: string}) => m.role === "user");
    const history = firstUserIdx >= 0 ? allHistory.slice(firstUserIdx) : [];

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
