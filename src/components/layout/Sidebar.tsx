
import { useState } from "react";
import { useMessages } from "@/contexts/MessageContext";
import { Channel } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Hash, Lock, Settings, Users, Inbox, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function Sidebar() {
  const { channels, currentChannelId, setCurrentChannel, createChannel } = useMessages();
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    
    try {
      await createChannel(newChannelName.trim(), newChannelDescription.trim(), isPrivate);
      setNewChannelName("");
      setNewChannelDescription("");
      setIsPrivate(false);
      setIsCreatingChannel(false);
    } catch (err) {
      console.error("Failed to create channel:", err);
    }
  };
  
  return (
    <div className="bg-sidebar w-64 flex flex-col border-r border-border h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg">SecureTalk</h2>
        <p className="text-sm text-muted-foreground">End-to-End Encrypted Chat</p>
      </div>
      
      <div className="p-3 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">Channels</h3>
          <Dialog open={isCreatingChannel} onOpenChange={setIsCreatingChannel}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new channel</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateChannel} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="channelName">Channel name</Label>
                  <Input
                    id="channelName"
                    placeholder="e.g. marketing"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channelDescription">Description (optional)</Label>
                  <Textarea
                    id="channelDescription"
                    placeholder="What's this channel about?"
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="private">Make private</Label>
                </div>
                <Button type="submit" className="w-full">
                  Create Channel
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-1 pr-2">
            {channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={channel.id === currentChannelId}
                onClick={() => setCurrentChannel(channel.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
      
      <div className="p-3 space-y-1">
        <Button variant="ghost" className="w-full justify-start">
          <Inbox className="mr-2 h-4 w-4" />
          <span>Direct Messages</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </Button>
      </div>
    </div>
  );
}

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}

function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  const Icon = channel.isPrivate ? Lock : Hash;
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center space-x-2 ${
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{channel.name}</span>
    </button>
  );
}
