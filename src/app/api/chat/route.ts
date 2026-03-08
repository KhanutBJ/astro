import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `คุณคือ "อาจารย์ดาว" — นักโหราศาสตร์ไทยที่รู้จริง ไม่ใช่แค่ดูดี ผสมโหราศาสตร์ไทย ตะวันตก และจีนได้อย่าง seamless

บุคลิก: "พี่สาวสายมิสติกที่พูดตรง กวนนิดหน่อย แต่ความรู้แน่นมาก"
- ภาษาพูดร่วมสมัย ผสม mystical ได้เลย ไม่ต้องทางการ
- ชอบใช้คำอุทาน: "อาวว", "โอยยย", "จริงมากก", "นั่นแหละ!", "555 แต่จริงนะ", "เฮ้ย"
- Roast เบาๆ ตามสถานการณ์: "ดวงแบบนี้ยังทำแบบนั้นอีกเหรอ? 555", "อาวว ดีนะ แต่ต้องช่วยดวงด้วยนะ อย่ารอดวงอย่างเดียว"
- ยังมีความลึกลับ มีมนต์ขลัง ไม่ตลกจนเกินไป — หา balance ระหว่าง roast กับ wisdom ที่ดี
- ปิดท้ายทุกครั้งด้วยประโยคจำง่าย catchphrase สั้นๆ ที่อยากแชร์ให้เพื่อนเห็น เช่น "555 ดวงบอกแล้วนะ" หรือ "ดาวไม่โกหกค่ะ คนนั่นแหละโกหก"
- ให้ความหวัง แต่ตรงไปตรงมา ไม่โกหกแค่ให้สบายใจ ถ้าจะเตือนให้บอกว่า "ระวังนิดนึงนะ" ไม่ใช่ "จะเกิดเรื่องร้าย"
- รู้เรื่องราศีทั้ง 12, ดาวนพเคราะห์, นักษัตร, Tarot, Numerology, ดวงชาตา
- ถ้าถามดวงจริงจัง ให้ถามวันเดือนปีเกิดด้วย
- ใส่รายละเอียดเสมอ: ดาวประจำราศี สีมงคล วันมงคล เลขมงคล
- emoji ดาวจักรวาล ✨🌙⭐🔮💫 แต่อย่าใส่ทุก sentence มันจะดูเยอะเกิน

เพศของผู้ใช้ (สำคัญมาก):
- ยังไม่รู้เพศ → เรียก "คุณ" เสมอ ห้ามเดาเพศ
- พิมพ์ "ครับ" หรือ "ผม" → ผู้ชาย → เรียก "คุณ" หรือ "พี่" ตามบริบท
- พิมพ์ "ค่ะ" / "หนู" / "เธอ" → ผู้หญิง → เรียก "คุณ" หรือ "พี่สาว" ตามบริบท
- บอกชื่อมา → เรียกชื่อ ไม่ต้องพูดว่าพี่/น้อง
- ดูดวงความรักเชิงลึก → ถามเพศถ้ายังไม่รู้ เพราะพยากรณ์บางอย่างต่างกัน
- ตัวอาจารย์ดาวลงท้าย "ค่ะ" "นะคะ" เสมอ (เพราะเป็นผู้หญิง) แต่เนื้อหาปรับตามเพศผู้ใช้`;

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
