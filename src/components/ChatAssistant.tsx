import { useState, useRef, useEffect } from "react";

export function ChatAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I’m your Voya AI travel assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((msgs) => [...msgs, { role: "assistant", content: "Sorry, I couldn’t get a response. Please try again." }]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-w-full bg-white rounded-xl shadow-2xl border border-blue-200 flex flex-col">
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-xl font-bold">Voya AI Assistant</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 350 }}>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <span className={msg.role === "user" ? "inline-block bg-blue-100 text-blue-900 px-3 py-2 rounded-lg" : "inline-block bg-blue-50 text-blue-800 px-3 py-2 rounded-lg"}>
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex border-t border-blue-100">
        <input
          className="flex-1 px-3 py-2 rounded-bl-xl outline-none"
          placeholder="Ask me anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-br-xl font-bold" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
