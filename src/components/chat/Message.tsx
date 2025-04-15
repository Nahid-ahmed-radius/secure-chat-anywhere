
import { useState } from "react";
import { Message as MessageType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessages } from "@/contexts/MessageContext";
import { Edit, Trash, MoreHorizontal, Reply, Pin, Bookmark, Copy, Smile } from "lucide-react";

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
  showHeader: boolean;
}

export function Message({ message, isCurrentUser, showHeader }: MessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const { editMessage, deleteMessage, addReaction, pinMessage } = useMessages();
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editedContent.trim() && editedContent !== message.content) {
      await editMessage(message.id, editedContent);
    }
    setIsEditing(false);
  };
  
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(message.id);
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    
    // Group reactions by emoji
    const reactionGroups: Record<string, { count: number; users: string[] }> = {};
    
    message.reactions.forEach(reaction => {
      if (!reactionGroups[reaction.emoji]) {
        reactionGroups[reaction.emoji] = { count: 0, users: [] };
      }
      reactionGroups[reaction.emoji].count += 1;
      reactionGroups[reaction.emoji].users.push(reaction.userName);
    });
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(reactionGroups).map(([emoji, { count, users }]) => (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="inline-flex items-center bg-background/80 hover:bg-background rounded-full px-2 py-0.5 text-xs border border-border"
                  onClick={() => addReaction(message.id, emoji)}
                >
                  <span>{emoji}</span>
                  <span className="ml-1">{count}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">{users.join(", ")}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };
  
  return (
    <div className={`group flex items-start gap-3 ${showHeader ? "mt-4" : "mt-1"}`}>
      {showHeader && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.senderName}`} />
          <AvatarFallback>{message.senderName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      
      {!showHeader && <div className="w-8" />}
      
      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-medium">{message.senderName}</span>
            <span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>
          </div>
        )}
        
        <div className="relative">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex items-end gap-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={1}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditedContent(message.content);
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEditSubmit(e);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Save</Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(message.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
                {message.edited && (
                  <span className="text-xs text-muted-foreground ml-2">(edited)</span>
                )}
              </div>
              
              {renderReactions()}
              
              <div className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => addReaction(message.id, "👍")}>
                      <Smile className="mr-2 h-4 w-4" />
                      <span>Add reaction</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Reply className="mr-2 h-4 w-4" />
                      <span>Reply</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => pinMessage(message.id, message.channelId)}>
                      <Pin className="mr-2 h-4 w-4" />
                      <span>Pin message</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Copy text</span>
                    </DropdownMenuItem>
                    {isCurrentUser && (
                      <>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
