const express = require('express');
const { chatHealth, handleChat } = require('../controllers/chatController');

const router = express.Router();

router.get('/health', chatHealth);
router.post('/', handleChat);

module.exports = router;
