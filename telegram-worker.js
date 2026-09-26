export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("MPPSC IQ Telegram Bot is running.");
    }

    try {
      const update = await request.json();
      const msg = update.message;

      if (!msg || !msg.text) {
        return new Response("OK");
      }

      const text = msg.text.trim().split(/\s+/)[0].toLowerCase();

      if (text !== "/test" && text !== "/start") {
        return new Response("OK");
      }

      const chatId = msg.chat.id;

      const message =
        "📚 <b>MPPSC IQ TEST 01</b>\n\n" +
        "100 MCQs • +3 / −1 / 0\n" +
        "⏱️ समय: 60 मिनट\n\n" +
        "नीचे दिए बटन से टेस्ट शुरू करें 👇";

      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            {
              text: "🚀 TEST START करें",
              web_app: {
                url: "https://riturajgautam007-afk.github.io/MPPSC-IQ-TEST-/?v=60"
              }
            }
          ]]
        }
      };

      const response = await fetch(
        "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      return new Response(await response.text(), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response("Bad request", { status: 400 });
    }
  }
};
