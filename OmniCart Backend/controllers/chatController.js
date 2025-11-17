const { generateResponse } = require('../services/ragService');

exports.chatHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat assistant is ready',
  });
};

exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message to process.',
      });
    }

    const result = await generateResponse(message);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Chat handler error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to generate a response at this time.',
    });
  }
};
