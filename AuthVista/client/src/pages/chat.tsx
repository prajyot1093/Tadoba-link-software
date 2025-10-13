import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Image as ImageIcon, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${user?.firstName || 'there'}! I'm your AI assistant for Tadoba wildlife conservation. I can help you with information about animals, safety tips, conservation efforts, and identify wildlife from images. How can I assist you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, image }: { message: string; image?: File }) => {
      const formData = new FormData();
      formData.append('message', message);
      if (image) {
        formData.append('image', image);
      }
      
      // For now, return a simulated response since AI integration is pending
      return new Promise<{ response: string }>((resolve) => {
        setTimeout(() => {
          const responses = [
            "Based on the data in our system, tigers in Tadoba are most active during early mornings and late evenings. It's important to stay alert during these times.",
            "The safe zones marked in green on your map are regularly patrolled and have minimal wildlife activity. These are the best areas for cattle grazing.",
            "If you encounter a tiger, remain calm, do not run, maintain eye contact, and slowly back away. Never turn your back on the animal.",
            "Tadoba is home to over 80 tigers, along with leopards, sloth bears, and various deer species. The reserve covers 1,727 sq km of protected forest.",
            "To identify an animal from markings: Tigers have unique stripe patterns, leopards have rosette spots, and sloth bears have a distinctive V-shaped chest mark.",
          ];
          resolve({ response: responses[Math.floor(Math.random() * responses.length)] });
        }, 1000);
      });
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
      }]);
      setInput('');
      setSelectedImage(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (selectedImage ? 'Uploaded an image for identification' : ''),
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ message: input, image: selectedImage || undefined });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Wildlife Assistant</h1>
            <p className="text-sm text-muted-foreground">Ask questions or upload images for identification</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollBehavior: 'smooth' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            data-testid={`message-${message.role}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className={`max-w-[70%] ${message.role === 'user' ? 'order-first' : ''}`}>
              <Card className={`p-4 ${
                message.role === 'user' 
                  ? 'bg-orange/10 border-orange/20' 
                  : 'bg-card/50 backdrop-blur-sm border-card-border'
              }`}>
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="Uploaded"
                    className="w-full max-h-48 object-cover rounded-lg mb-2"
                  />
                )}
                <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
              </Card>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-orange" />
              </div>
            )}
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <Card className="p-4 bg-card/50 backdrop-blur-sm border-card-border">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-border">
        {selectedImage && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-card rounded-lg border border-card-border">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground flex-1 truncate">{selectedImage.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImage(null)}
            >
              Remove
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-upload-image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about wildlife, safety tips, or upload an image..."
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || chatMutation.isPending}
            className="bg-primary"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
