import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './figma/Logo';
import { useAuth } from '../context/AuthContext';
import { chatApi, type ChatMessage, API_BASE } from '../api';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const roomId = 'general';

  // Load history from MongoDB
  useEffect(() => {
    chatApi.getHistory(roomId).then(setMessages).catch(() => {});
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect WebSocket
  useEffect(() => {
    const wsUrl = API_BASE.replace(/^http/, 'ws') + '/ws';
    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/chat/${roomId}`, msg => {
          try {
            const chatMsg: ChatMessage = JSON.parse(msg.body);
            setMessages(prev => [...prev, chatMsg]);
          } catch { /* ignore */ }
        });
      },
      onDisconnect: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); };
  }, [user]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify({ 
        content: input.trim(),
        senderUsername: user?.username ?? 'anonymous',
        senderId: user?.username ?? 'anonymous',
      }),
    });
    setInput('');
  }, [input, user]);

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="font-bold text-gray-900">PharmaConnect</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 font-medium flex items-center gap-1">
            <MessageCircle className="w-4 h-4" /> Chat
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-sm font-medium ${connected ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            {connected ? 'Connected' : 'Connecting...'}
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.senderUsername === user?.username;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                isOwn
                  ? 'bg-green-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
              }`}>
                {!isOwn && (
                  <p className="text-xs font-semibold text-green-600 mb-1">{msg.senderUsername}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-400'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="rounded-xl flex-1"
          />
          <Button onClick={sendMessage} disabled={!connected || !input.trim()}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 gap-2">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Logged in as <span className="font-semibold">{user?.username}</span>
          {' '}· Messages saved in MongoDB
        </p>
      </div>
    </div>
  );
}