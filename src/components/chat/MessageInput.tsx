
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/contexts/MessageContext";
import { Paperclip, Send, Smile } from "lucide-react";

export function MessageInput() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentChannelId, sendMessage } = useMessages();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set the height to scrollHeight to fit all content
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [message]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChannelId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendMessage(message.trim(), currentChannelId);
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-t border-border p-4 bg-background">
      <div className="flex items-end space-x-2">
        <Button variant="ghost" size="icon" className="shrink-0" disabled={isSubmitting}>
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            className="resize-none py-3 pr-12 min-h-[60px] max-h-[200px] overflow-y-auto"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting || !currentChannelId}
            rows={1}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 bottom-2 h-8 w-8"
            disabled={isSubmitting}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>
        
        <Button 
          size="icon" 
          className="shrink-0" 
          disabled={!message.trim() || isSubmitting || !currentChannelId}
          onClick={handleSendMessage}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
