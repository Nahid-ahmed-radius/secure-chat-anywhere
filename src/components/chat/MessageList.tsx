
import { useEffect, useRef } from "react";
import { useMessages } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Message as MessageType } from "@/types";
import { Message } from "@/components/chat/Message";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MessageList() {
  const { messages, isLoading } = useMessages();
  const { authState } = useAuth();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to the bottom when messages change
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Group messages by sender and date
  const groupMessages = (messages: MessageType[]): MessageType[][] => {
    const groups: MessageType[][] = [];
    let currentGroup: MessageType[] = [];
    
    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      
      // Start a new group if:
      // 1. This is the first message
      // 2. Different sender from previous message
      // 3. Time gap > 5 minutes from previous message
      if (
        index === 0 ||
        message.senderId !== prevMessage.senderId ||
        new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 5 * 60 * 1000
      ) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  };
  
  const messageGroups = groupMessages(messages);
  
  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="flex flex-col p-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-pulse text-muted-foreground">
              Loading messages...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60">
            <div className="text-4xl mb-2">👋</div>
            <h3 className="text-lg font-medium">No messages yet</h3>
            <p className="text-muted-foreground text-sm">
              Be the first to send a message!
            </p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              {group.map((message, messageIndex) => (
                <Message
                  key={message.id}
                  message={message}
                  isCurrentUser={message.senderId === authState.user?.id}
                  showHeader={messageIndex === 0}
                />
              ))}
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </ScrollArea>
  );
}
