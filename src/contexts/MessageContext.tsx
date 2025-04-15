
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, Channel } from '@/types';
import { useAuth } from './AuthContext';
import { useStorage } from './StorageContext';
import { useEncryption } from './EncryptionContext';
import { StoragePaths } from '@/lib/storage/storage-adapter';

interface MessageContextValue {
  channels: Channel[];
  currentChannelId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  createChannel: (name: string, description?: string, isPrivate?: boolean) => Promise<string>;
  setCurrentChannel: (channelId: string) => void;
  sendMessage: (content: string, channelId: string, parentId?: string) => Promise<Message | null>;
  fetchMessages: (channelId: string) => Promise<Message[]>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  addReaction: (messageId: string, emoji: string) => Promise<boolean>;
  removeReaction: (messageId: string, emoji: string) => Promise<boolean>;
  pinMessage: (messageId: string, channelId: string) => Promise<boolean>;
  unpinMessage: (messageId: string, channelId: string) => Promise<boolean>;
}

const MessageContext = createContext<MessageContextValue>({
  channels: [],
  currentChannelId: null,
  messages: [],
  isLoading: false,
  error: null,
  createChannel: async () => '',
  setCurrentChannel: () => {},
  sendMessage: async () => null,
  fetchMessages: async () => [],
  editMessage: async () => false,
  deleteMessage: async () => false,
  addReaction: async () => false,
  removeReaction: async () => false,
  pinMessage: async () => false,
  unpinMessage: async () => false,
});

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { authState } = useAuth();
  const { storeData, retrieveData, listData } = useStorage();
  const { encryptMessage, decryptMessage, generateChannelKey } = useEncryption();
  
  // Load channels when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      loadChannels();
    } else {
      setChannels([]);
      setCurrentChannelId(null);
      setMessages([]);
    }
  }, [authState.isAuthenticated]);
  
  // Load messages when channel changes
  useEffect(() => {
    if (currentChannelId) {
      fetchMessages(currentChannelId);
    } else {
      setMessages([]);
    }
  }, [currentChannelId]);
  
  // Load all channels
  const loadChannels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // List channels from storage
      const channelKeys = await listData(StoragePaths.CHANNELS);
      const channelPromises = channelKeys.map(async (key) => {
        const channelData = await retrieveData(key, StoragePaths.CHANNELS);
        return JSON.parse(channelData) as Channel;
      });
      
      const loadedChannels = await Promise.all(channelPromises);
      
      // Sort channels by creation date
      loadedChannels.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setChannels(loadedChannels);
      
      // Set current channel to the first one if not set
      if (loadedChannels.length > 0 && !currentChannelId) {
        setCurrentChannelId(loadedChannels[0].id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading channels:', error);
      setError('Failed to load channels');
      setIsLoading(false);
    }
  };
  
  // Create a new channel
  const createChannel = async (
    name: string,
    description = '',
    isPrivate = false
  ): Promise<string> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      setIsLoading(true);
      setError(null);
      
      const newChannel: Channel = {
        id: 'channel-' + Math.random().toString(36).substring(2, 9),
        name,
        description,
        isPrivate,
        members: [authState.user.id],
        createdBy: authState.user.id,
        createdAt: new Date(),
        pinnedMessages: [],
      };
      
      // Store channel data
      await storeData(`${newChannel.id}.json`, JSON.stringify(newChannel), StoragePaths.CHANNELS);
      
      // Generate encryption key for the channel
      await generateChannelKey(newChannel.id);
      
      // Update local state
      setChannels((prev) => [newChannel, ...prev]);
      setCurrentChannelId(newChannel.id);
      
      setIsLoading(false);
      return newChannel.id;
    } catch (error) {
      console.error('Error creating channel:', error);
      setError('Failed to create channel');
      setIsLoading(false);
      throw error;
    }
  };
  
  // Set current channel
  const setCurrentChannel = (channelId: string) => {
    setCurrentChannelId(channelId);
  };
  
  // Send a new message
  const sendMessage = async (
    content: string,
    channelId: string,
    parentId?: string
  ): Promise<Message | null> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Encrypt the message content
      const { ciphertext, iv } = await encryptMessage(content, channelId);
      
      const newMessage: Message = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        content: ciphertext,
        iv,
        senderId: authState.user.id,
        senderName: authState.user.name,
        timestamp: new Date(),
        channelId,
        parentId,
        reactions: [],
        attachments: [],
        mentions: [], // TODO: Parse message for mentions
      };
      
      // Store message data
      await storeData(
        `${newMessage.id}.json`, 
        JSON.stringify(newMessage), 
        `${StoragePaths.MESSAGES}/${channelId}`
      );
      
      // If this is a reply, update the parent message's reply count
      if (parentId) {
        const parentMessageIndex = messages.findIndex((m) => m.id === parentId);
        if (parentMessageIndex !== -1) {
          const parentMessage = { ...messages[parentMessageIndex] };
          parentMessage.replyCount = (parentMessage.replyCount || 0) + 1;
          
          // Update the parent message in storage
          await storeData(
            `${parentMessage.id}.json`, 
            JSON.stringify(parentMessage), 
            `${StoragePaths.MESSAGES}/${channelId}`
          );
          
          // Update local messages
          const updatedMessages = [...messages];
          updatedMessages[parentMessageIndex] = parentMessage;
          setMessages(updatedMessages);
        }
      }
      
      // Update local messages if in the same channel
      if (channelId === currentChannelId) {
        // Add the decrypted content for UI rendering
        const decryptedContent = await decryptMessage(ciphertext, iv, channelId);
        const messageWithDecrypted: Message = {
          ...newMessage,
          content: decryptedContent, // Override with decrypted content
        };
        
        setMessages((prev) => [...prev, messageWithDecrypted]);
      }
      
      // Update the channel's last message
      const channelIndex = channels.findIndex((c) => c.id === channelId);
      if (channelIndex !== -1) {
        const updatedChannel = { ...channels[channelIndex], lastMessage: newMessage };
        
        // Store updated channel
        await storeData(
          `${updatedChannel.id}.json`, 
          JSON.stringify(updatedChannel), 
          StoragePaths.CHANNELS
        );
        
        // Update local channels
        const updatedChannels = [...channels];
        updatedChannels[channelIndex] = updatedChannel;
        setChannels(updatedChannels);
      }
      
      setIsLoading(false);
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setIsLoading(false);
      return null;
    }
  };
  
  // Fetch messages for a channel
  const fetchMessages = async (channelId: string): Promise<Message[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // List all message files in the channel
      const messageKeys = await listData(`${StoragePaths.MESSAGES}/${channelId}`);
      
      // Retrieve each message
      const messagePromises = messageKeys.map(async (key) => {
        const messageData = await retrieveData(
          key, 
          `${StoragePaths.MESSAGES}/${channelId}`
        );
        return JSON.parse(messageData) as Message;
      });
      
      let channelMessages = await Promise.all(messagePromises);
      
      // Sort by timestamp
      channelMessages = channelMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Decrypt all message contents
      const decryptedMessages = await Promise.all(
        channelMessages.map(async (message) => {
          try {
            // Only decrypt if the content is encrypted (has IV)
            if (message.iv) {
              const decryptedContent = await decryptMessage(
                message.content,
                message.iv,
                channelId
              );
              return { ...message, content: decryptedContent };
            }
            return message;
          } catch (err) {
            console.error(`Failed to decrypt message ${message.id}:`, err);
            return { ...message, content: '[ENCRYPTED - Cannot decrypt]' };
          }
        })
      );
      
      setMessages(decryptedMessages);
      setIsLoading(false);
      return decryptedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages');
      setIsLoading(false);
      return [];
    }
  };
  
  // Edit a message
  const editMessage = async (messageId: string, newContent: string): Promise<boolean> => {
    try {
      if (!authState.user || !currentChannelId) {
        throw new Error('User not authenticated or no channel selected');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Find the message to edit
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        throw new Error('Message not found');
      }
      
      const message = messages[messageIndex];
      
      // Only the sender can edit their message
      if (message.senderId !== authState.user.id) {
        throw new Error('Cannot edit another user\'s message');
      }
      
      // Encrypt the new content
      const { ciphertext, iv } = await encryptMessage(newContent, currentChannelId);
      
      // Update the message
      const updatedMessage: Message = {
        ...message,
        content: ciphertext,
        iv,
        edited: true,
      };
      
      // Store the updated message
      await storeData(
        `${messageId}.json`, 
        JSON.stringify(updatedMessage), 
        `${StoragePaths.MESSAGES}/${currentChannelId}`
      );
      
      // Update local state with decrypted content for display
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessage,
        content: newContent, // Use the decrypted content for UI
      };
      setMessages(updatedMessages);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message');
      setIsLoading(false);
      return false;
    }
  };
  
  // Delete a message
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    try {
      if (!authState.user || !currentChannelId) {
        throw new Error('User not authenticated or no channel selected');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Find the message to delete
      const message = messages.find((m) => m.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Only the sender can delete their message
      if (message.senderId !== authState.user.id) {
        throw new Error('Cannot delete another user\'s message');
      }
      
      // Delete the message file
      await storeData(
        `${messageId}.json`, 
        JSON.stringify({ ...message, deleted: true, content: '[This message was deleted]' }), 
        `${StoragePaths.MESSAGES}/${currentChannelId}`
      );
      
      // Update local state
      setMessages((prev) => 
        prev.filter((m) => m.id !== messageId)
      );
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
      setIsLoading(false);
      return false;
    }
  };
  
  // Add a reaction to a message
  const addReaction = async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      if (!authState.user || !currentChannelId) {
        throw new Error('User not authenticated or no channel selected');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Find the message
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        throw new Error('Message not found');
      }
      
      const message = messages[messageIndex];
      
      // Check if user already added this reaction
      const existingReaction = message.reactions?.find(
        (r) => r.userId === authState.user?.id && r.emoji === emoji
      );
      
      if (existingReaction) {
        // Already added, do nothing
        setIsLoading(false);
        return true;
      }
      
      // Add the reaction
      const updatedMessage = { ...message };
      updatedMessage.reactions = [
        ...(updatedMessage.reactions || []),
        {
          emoji,
          userId: authState.user.id,
          userName: authState.user.name,
        },
      ];
      
      // Store the encrypted version
      const encryptedMessage = { ...updatedMessage };
      if (message.iv) {
        // Re-encrypt the content using the same IV
        const { ciphertext } = await encryptMessage(message.content, currentChannelId);
        encryptedMessage.content = ciphertext;
      }
      
      // Store the updated message
      await storeData(
        `${messageId}.json`, 
        JSON.stringify(encryptedMessage), 
        `${StoragePaths.MESSAGES}/${currentChannelId}`
      );
      
      // Update local state
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = updatedMessage;
      setMessages(updatedMessages);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      setError('Failed to add reaction');
      setIsLoading(false);
      return false;
    }
  };
  
  // Remove a reaction from a message
  const removeReaction = async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      if (!authState.user || !currentChannelId) {
        throw new Error('User not authenticated or no channel selected');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Find the message
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        throw new Error('Message not found');
      }
      
      const message = messages[messageIndex];
      
      // Remove the reaction
      const updatedMessage = { ...message };
      updatedMessage.reactions = (updatedMessage.reactions || []).filter(
        (r) => !(r.userId === authState.user?.id && r.emoji === emoji)
      );
      
      // Store the encrypted version
      const encryptedMessage = { ...updatedMessage };
      if (message.iv) {
        // Re-encrypt the content using the same IV
        const { ciphertext } = await encryptMessage(message.content, currentChannelId);
        encryptedMessage.content = ciphertext;
      }
      
      // Store the updated message
      await storeData(
        `${messageId}.json`, 
        JSON.stringify(encryptedMessage), 
        `${StoragePaths.MESSAGES}/${currentChannelId}`
      );
      
      // Update local state
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = updatedMessage;
      setMessages(updatedMessages);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      setError('Failed to remove reaction');
      setIsLoading(false);
      return false;
    }
  };
  
  // Pin a message in a channel
  const pinMessage = async (messageId: string, channelId: string): Promise<boolean> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Find the channel
      const channelIndex = channels.findIndex((c) => c.id === channelId);
      if (channelIndex === -1) {
        throw new Error('Channel not found');
      }
      
      const channel = channels[channelIndex];
      
      // Check if message is already pinned
      if (channel.pinnedMessages?.includes(messageId)) {
        setIsLoading(false);
        return true;
      }
      
      // Add message to pinned messages
      const updatedChannel = { ...channel };
      updatedChannel.pinnedMessages = [
        ...(updatedChannel.pinnedMessages || []),
        messageId,
      ];
      
      // Store the updated channel
      await storeData(
        `${channelId}.json`, 
        JSON.stringify(updatedChannel), 
        StoragePaths.CHANNELS
      );
      
      // Update local state
      const updatedChannels = [...channels];
      updatedChannels[channelIndex] = updatedChannel;
      setChannels(updatedChannels);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error pinning message:', error);
      setError('Failed to pin message');
      setIsLoading(false);
      return false;
    }
  };
  
  // Unpin a message from a channel
  const unpinMessage = async (messageId: string, channelId: string): Promise<boolean> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Find the channel
      const channelIndex = channels.findIndex((c) => c.id === channelId);
      if (channelIndex === -1) {
        throw new Error('Channel not found');
      }
      
      const channel = channels[channelIndex];
      
      // Remove message from pinned messages
      const updatedChannel = { ...channel };
      updatedChannel.pinnedMessages = (updatedChannel.pinnedMessages || []).filter(
        (id) => id !== messageId
      );
      
      // Store the updated channel
      await storeData(
        `${channelId}.json`, 
        JSON.stringify(updatedChannel), 
        StoragePaths.CHANNELS
      );
      
      // Update local state
      const updatedChannels = [...channels];
      updatedChannels[channelIndex] = updatedChannel;
      setChannels(updatedChannels);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error unpinning message:', error);
      setError('Failed to unpin message');
      setIsLoading(false);
      return false;
    }
  };
  
  return (
    <MessageContext.Provider
      value={{
        channels,
        currentChannelId,
        messages,
        isLoading,
        error,
        createChannel,
        setCurrentChannel,
        sendMessage,
        fetchMessages,
        editMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        pinMessage,
        unpinMessage,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};
