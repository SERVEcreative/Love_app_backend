const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const sendMessageSchema = Joi.object({
  receiver_id: Joi.string().uuid().required(),
  message_text: Joi.string().min(1).max(1000).required(),
  message_type: Joi.string().valid('text', 'image', 'video', 'audio', 'file').default('text'),
  media_url: Joi.string().uri().allow(null).optional()
});

const reactionSchema = Joi.object({
  reaction_type: Joi.string().min(1).max(20).required()
});

// Send a message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiver_id, message_text, message_type, media_url } = req.body;

    console.log(`📤 Send message request from ${senderId} to ${receiver_id}`);

    // Validate request
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    // Send message
    const result = await chatService.sendMessage(
      senderId,
      receiver_id,
      message_text,
      message_type,
      media_url
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send message',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: result.message,
      conversation_id: result.conversationId
    });

  } catch (error) {
    console.error('❌ Send message route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get messages between two users
router.get('/messages/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.otherUserId;
    const { page = 1, limit = 50 } = req.query;

    console.log(`📥 Get messages request between ${currentUserId} and ${otherUserId}`);

    // Validate otherUserId
    if (!Joi.string().uuid().validate(otherUserId).error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Get messages
    const result = await chatService.getConversationMessages(
      currentUserId,
      otherUserId,
      parseInt(page),
      parseInt(limit)
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get messages',
        message: result.error
      });
    }

    res.json({
      success: true,
      messages: result.messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.messages.length
      }
    });

  } catch (error) {
    console.error('❌ Get messages route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    console.log(`📋 Get conversations request for user ${userId}`);

    // Get conversations
    const result = await chatService.getUserConversations(
      userId,
      parseInt(page),
      parseInt(limit)
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get conversations',
        message: result.error
      });
    }

    res.json({
      success: true,
      conversations: result.conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.conversations.length
      }
    });

  } catch (error) {
    console.error('❌ Get conversations route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Check or create conversation between two users
router.get('/conversation/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.otherUserId;

    console.log(`🔍 Check/create conversation between ${currentUserId} and ${otherUserId}`);

    // Validate otherUserId
    if (Joi.string().uuid().validate(otherUserId).error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Get or create conversation
    const result = await chatService.getOrCreateConversation(currentUserId, otherUserId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get/create conversation',
        message: result.error
      });
    }

    res.json({
      success: true,
      conversation: result.conversation,
      isNew: result.isNew
    });

  } catch (error) {
    console.error('❌ Check/create conversation route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Mark messages as read
router.post('/read/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.otherUserId;

    console.log(`👁️ Mark messages as read request from ${currentUserId} for ${otherUserId}`);

    // Validate otherUserId
    if (Joi.string().uuid().validate(otherUserId).error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Mark messages as read
    const result = await chatService.markMessagesAsRead(currentUserId, otherUserId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('❌ Mark messages as read route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete a message
router.delete('/message/:messageId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;

    console.log(`🗑️ Delete message request for ${messageId} by user ${userId}`);

    // Validate messageId
    if (Joi.string().uuid().validate(messageId).error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message ID format'
      });
    }

    // Delete message
    const result = await chatService.deleteMessage(messageId, userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete message',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete message route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log(`📊 Get unread count request for user ${userId}`);

    // Get unread count
    const result = await chatService.getUnreadCount(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get unread count',
        message: result.error
      });
    }

    res.json({
      success: true,
      unread_count: result.count
    });

  } catch (error) {
    console.error('❌ Get unread count route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Add reaction to message
router.post('/reaction/:messageId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;
    const { reaction_type } = req.body;

    console.log(`😊 Add reaction request for message ${messageId} by user ${userId}`);

    // Validate messageId
    if (Joi.string().uuid().validate(messageId).error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message ID format'
      });
    }

    // Validate request body
    const { error, value } = reactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    // Add reaction
    const result = await chatService.addReaction(messageId, userId, reaction_type);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add reaction',
        message: result.error
      });
    }

    res.json({
      success: true,
      reaction: result.reaction
    });

  } catch (error) {
    console.error('❌ Add reaction route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Remove reaction from message
router.delete('/reaction/:messageId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.messageId;

    console.log(`🗑️ Remove reaction request for message ${messageId} by user ${userId}`);

    // Validate messageId
    if (Joi.string().uuid().validate(messageId).error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message ID format'
      });
    }

    // Remove reaction
    const result = await chatService.removeReaction(messageId, userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to remove reaction',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('❌ Remove reaction route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
