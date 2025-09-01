const { supabaseAdmin } = require('../config/supabase');

class ChatService {
  constructor() {
    this.serviceName = 'ChatService';
  }

  // Get or create conversation between two users
  async getOrCreateConversation(userId1, userId2) {
    try {
      console.log(`🔍 Getting/creating conversation between ${userId1} and ${userId2}`);
      
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${userId1},participant2_id.eq.${userId1}`)
        .or(`participant1_id.eq.${userId2},participant2_id.eq.${userId2}`)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Error checking conversation:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingConversation) {
        console.log(`✅ Found existing conversation: ${existingConversation.id}`);
        return { 
          success: true, 
          conversation: existingConversation,
          conversationId: existingConversation.id,
          isNew: false
        };
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert({
          participant1_id: userId1,
          participant2_id: userId2
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating conversation:', createError);
        return { success: false, error: createError.message };
      }

      console.log(`✅ Created new conversation: ${newConversation.id}`);
      return { 
        success: true, 
        conversation: newConversation,
        conversationId: newConversation.id,
        isNew: true
      };

    } catch (error) {
      console.error('❌ Get/create conversation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send a message
  async sendMessage(senderId, receiverId, content, messageType = 'text', mediaUrl = null) {
    try {
      console.log(`📤 Sending message from ${senderId} to ${receiverId}`);
      
      // Insert message
      const { data: message, error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          message_text: content,
          message_type: messageType,
          media_url: mediaUrl
        })
        .select(`
          id,
          sender_id,
          receiver_id,
          message_text,
          message_type,
          media_url,
          is_read,
          read_at,
          created_at,
          sender:users!messages_sender_id_fkey(
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (messageError) {
        console.error('❌ Error sending message:', messageError);
        return { success: false, error: messageError.message };
      }

      // Update conversation with last message
      const conversationResult = await this.getOrCreateConversation(senderId, receiverId);
      if (conversationResult.success) {
        await supabaseAdmin
          .from('conversations')
          .update({
            last_message_id: message.id,
            last_message_at: message.created_at
          })
          .eq('id', conversationResult.conversationId);
      }

      console.log(`✅ Message sent successfully: ${message.id}`);
      return { 
        success: true, 
        message: message,
        conversationId: conversationResult.conversationId
      };
    } catch (error) {
      console.error('❌ Send message error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get messages between two users
  async getConversationMessages(userId1, userId2, page = 1, limit = 50) {
    try {
      console.log(`📥 Getting messages between ${userId1} and ${userId2}`);
      
      const offset = (page - 1) * limit;
      
      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          message_text,
          message_type,
          media_url,
          is_read,
          read_at,
          created_at,
          sender:users!messages_sender_id_fkey(
            id,
            name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error getting messages:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Retrieved ${messages.length} messages`);
      return { 
        success: true, 
        messages: messages.reverse() // Reverse to show oldest first
      };
    } catch (error) {
      console.error('❌ Get messages error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's conversations
  async getUserConversations(userId, page = 1, limit = 20) {
    try {
      console.log(`📋 Getting conversations for user ${userId}`);
      
      const offset = (page - 1) * limit;
      
      const { data: conversations, error } = await supabaseAdmin
        .from('conversations')
        .select(`
          id,
          participant1_id,
          participant2_id,
          last_message_id,
          last_message_at,
          created_at,
          participant1:users!conversations_participant1_id_fkey(
            id,
            name,
            avatar_url,
            status
          ),
          participant2:users!conversations_participant2_id_fkey(
            id,
            name,
            avatar_url,
            status
          ),
          last_message:messages!conversations_last_message_id_fkey(
            id,
            message_text,
            message_type,
            created_at
          )
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error getting conversations:', error);
        return { success: false, error: error.message };
      }

      // Process conversations to identify the other participant
      const processedConversations = conversations.map(conv => {
        const otherParticipant = conv.participant1_id === userId ? conv.participant2 : conv.participant1;
        return {
          id: conv.id,
          other_user: otherParticipant,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          created_at: conv.created_at
        };
      });

      console.log(`✅ Retrieved ${processedConversations.length} conversations`);
      return { 
        success: true, 
        conversations: processedConversations
      };
    } catch (error) {
      console.error('❌ Get conversations error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(userId, otherUserId) {
    try {
      console.log(`👁️ Marking messages as read for ${userId} from ${otherUserId}`);
      
      const { error } = await supabaseAdmin
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('receiver_id', userId)
        .eq('sender_id', otherUserId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error marking messages as read:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Messages marked as read`);
      return { success: true };
    } catch (error) {
      console.error('❌ Mark messages as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a message
  async deleteMessage(messageId, userId) {
    try {
      console.log(`🗑️ Deleting message ${messageId} by user ${userId}`);
      
      const { error } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (error) {
        console.error('❌ Error deleting message:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Message deleted successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Delete message error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread message count
  async getUnreadCount(userId) {
    try {
      console.log(`📊 Getting unread count for user ${userId}`);
      
      const { count, error } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error getting unread count:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Unread count: ${count}`);
      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('❌ Get unread count error:', error);
      return { success: false, error: error.message };
    }
  }

  // Add reaction to message
  async addReaction(messageId, userId, reactionType) {
    try {
      console.log(`😊 Adding reaction ${reactionType} to message ${messageId} by user ${userId}`);
      
      const { data: reaction, error } = await supabaseAdmin
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: userId,
          reaction_type: reactionType
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding reaction:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Reaction added successfully`);
      return { success: true, reaction };
    } catch (error) {
      console.error('❌ Add reaction error:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, userId) {
    try {
      console.log(`🗑️ Removing reaction from message ${messageId} by user ${userId}`);
      
      const { error } = await supabaseAdmin
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error removing reaction:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Reaction removed successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Remove reaction error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ChatService();
