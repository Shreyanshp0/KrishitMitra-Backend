const { generateChatResponse } = require("../services/chatService");

const handleChat = async (req, res) => {
  try {
    const { message, location, context } = req.body;

    console.log("Incoming Chat:", {
      message,
      location,
      context
    });

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > 300) {
      return res.status(400).json({
        error: "Message too long (max 300 characters)"
      });
    }

    const reply = await generateChatResponse({
      message,
      location,
      context
    });

    return res.json({ reply });

  } catch (error) {
    console.error("Chat Controller Error:", error);

    return res.status(500).json({
      reply: "Sorry, I couldn't process your request. Please try again later."
    });
  }
};

module.exports = {
  handleChat,
};
