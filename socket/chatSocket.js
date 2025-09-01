const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');

class ChatSocket {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socketId mapping
    this.socketUsers = new Map(); // socketId -> userId mapping
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // Setup authentication middleware
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('❌ No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userPhone = decoded.phoneNumber;
        
        console.log(`✅ Socket authenticated for user: ${socket.userId}`);
        next();
      } catch (error) {
        console.log('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User ${socket.userId} connected with socket ${socket.id}`);
      
      // Store user socket mapping
      this.userSockets.set(socket.userId, socket.id);
      this.socketUsers.set(socket.id, socket.userId);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          console.log(`📤 Socket message from ${socket.userId}:`, data);
          
          const { receiver_id, message_text, message_type = 'text', media_url } = data;
          
          // Validate required fields
          if (!receiver_id || !message_text) {
            socket.emit('message_error', { error: 'Missing required fields' });
            return;
          }

          // Send message to database
          const result = await chatService.sendMessage(
            socket.userId,
            receiver_id,
            message_text,
            message_type,
            media_url
          );

          if (!result.success) {
            socket.emit('message_error', { error: result.error });
            return;
          }

          // Emit to sender (confirmation)
          socket.emit('message_sent', {
            message: result.message,
            conversation_id: result.conversationId
          });

          // Emit to receiver if they're online
          const receiverSocketId = this.userSockets.get(receiver_id);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('new_message', {
              message: result.message,
              conversation_id: result.conversationId
            });
          } else {
            // Receiver is offline, you could store for later delivery
            console.log(`📱 User ${receiver_id} is offline, message stored in database`);
          }

        } catch (error) {
          console.error('❌ Socket send message error:', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        try {
          const { receiver_id } = data;
          
          if (!receiver_id) {
            return;
          }

          console.log(`⌨️ User ${socket.userId} started typing to ${receiver_id}`);
          
          // Emit to receiver
          const receiverSocketId = this.userSockets.get(receiver_id);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('user_typing', {
              user_id: socket.userId,
              is_typing: true
            });
          }
        } catch (error) {
          console.error('❌ Socket typing start error:', error);
        }
      });

      socket.on('typing_stop', (data) => {
        try {
          const { receiver_id } = data;
          
          if (!receiver_id) {
            return;
          }

          console.log(`⌨️ User ${socket.userId} stopped typing to ${receiver_id}`);
          
          // Emit to receiver
          const receiverSocketId = this.userSockets.get(receiver_id);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('user_typing', {
              user_id: socket.userId,
              is_typing: false
            });
          }
        } catch (error) {
          console.error('❌ Socket typing stop error:', error);
        }
      });

      // Handle marking messages as read
      socket.on('mark_read', async (data) => {
        try {
          const { other_user_id } = data;
          
          if (!other_user_id) {
            socket.emit('read_error', { error: 'Missing other_user_id' });
            return;
          }

          console.log(`👁️ User ${socket.userId} marking messages as read from ${other_user_id}`);
          
          // Mark messages as read in database
          const result = await chatService.markMessagesAsRead(socket.userId, other_user_id);
          
          if (!result.success) {
            socket.emit('read_error', { error: result.error });
            return;
          }

          // Emit confirmation
          socket.emit('messages_read', {
            other_user_id: other_user_id,
            success: true
          });

          // Notify the other user that their messages were read
          const otherUserSocketId = this.userSockets.get(other_user_id);
          if (otherUserSocketId) {
            this.io.to(otherUserSocketId).emit('messages_read_by', {
              user_id: socket.userId,
              read_at: new Date().toISOString()
            });
          }

        } catch (error) {
          console.error('❌ Socket mark read error:', error);
          socket.emit('read_error', { error: 'Failed to mark messages as read' });
        }
      });

      // Handle user going online/offline
      socket.on('user_status', (data) => {
        try {
          const { status } = data; // 'online' or 'offline'
          
          console.log(`📱 User ${socket.userId} status changed to: ${status}`);
          
          // Broadcast status change to all connected users
          socket.broadcast.emit('user_status_changed', {
            user_id: socket.userId,
            status: status,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('❌ Socket user status error:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        try {
          console.log(`🔌 User ${socket.userId} disconnected: ${reason}`);
          
          // Remove from mappings
          this.userSockets.delete(socket.userId);
          this.socketUsers.delete(socket.id);
          
          // Broadcast user went offline
          socket.broadcast.emit('user_status_changed', {
            user_id: socket.userId,
            status: 'offline',
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error('❌ Socket disconnect error:', error);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for user ${socket.userId}:`, error);
      });
    });
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.userSockets.size;
  }

  // Get online users list
  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Broadcast to all users
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Broadcast to all users except sender
  broadcastExcept(senderId, event, data) {
    this.io.except(`user_${senderId}`).emit(event, data);
  }
}

module.exports = ChatSocket;
