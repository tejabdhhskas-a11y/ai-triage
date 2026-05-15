import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "./supabase";
import Auth from "./Auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [riskScore, setRiskScore] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);
  const [reason, setReason] = useState(null);
  const [pastChats, setPastChats] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const levelColors = {
    home: "#22c55e",
    clinic: "#f59e0b",
    emergency: "#ef4444",
  };

  const levelLabels = {
    home: "🏠 Home Care",
    clinic: "🏥 Visit a Clinic",
    emergency: "🚨 Go to Emergency Room NOW",
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        loadPastChats(session.user.id);
      }
    });
  }, []);

  const loadPastChats = async (userId) => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setPastChats(data);
  };

  const saveChat = async () => {
    if (!user || messages.length === 0) return;
    await supabase.from("chat_sessions").insert({
      user_id: user.id,
      messages: messages,
      risk_score: riskScore,
      risk_level: riskLevel,
    });
    loadPastChats(user.id);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("https://ai-triage-zwo3.onrender.com/triage", {
        messages: newMessages,
      });

      const reply = res.data.reply;
      const jsonMatch = reply.match(/\{.*"risk_score".*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setRiskScore(parsed.risk_score);
        setRiskLevel(parsed.level);
        setReason(parsed.reason);
      }

      const cleanReply = reply.replace(/\{.*"risk_score".*\}/s, "").trim();
      const updatedMessages = [...newMessages, { role: "assistant", content: cleanReply }];
      setMessages(updatedMessages);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Error connecting to backend." }]);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await saveChat();
    await supabase.auth.signOut();
    setUser(null);
    setMessages([]);
    setRiskScore(null);
    setRiskLevel(null);
    setPastChats([]);
  };

  const loadChat = (chat) => {
    setMessages(chat.messages);
    setRiskScore(chat.risk_score);
    setRiskLevel(chat.risk_level);
    setShowHistory(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (!user) return <Auth onLogin={(u) => { setUser(u); loadPastChats(u.id); }} />;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", background: "#0f172a", color: "white" }}>

      {/* Sidebar */}
      <div style={{ width: "280px", background: "#1e293b", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ margin: 0, color: "#38bdf8" }}>🏥 AI Triage</h2>
        <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>{user.email}</p>

        {riskScore !== null && (
          <div style={{ background: "#0f172a", borderRadius: "12px", padding: "16px" }}>
            <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: "12px" }}>RISK SCORE</p>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: levelColors[riskLevel] }}>
              {riskScore}
            </div>
            <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "8px", background: levelColors[riskLevel] + "22", color: levelColors[riskLevel], fontWeight: "bold" }}>
              {levelLabels[riskLevel]}
            </div>
            {reason && <p style={{ marginTop: "12px", fontSize: "13px", color: "#94a3b8" }}>{reason}</p>}
          </div>
        )}

        <button onClick={() => setShowHistory(!showHistory)} style={{
          padding: "10px", borderRadius: "8px", border: "none",
          background: "#334155", color: "white", cursor: "pointer", fontSize: "13px"
        }}>
          {showHistory ? "Hide History" : "📋 Past Chats"}
        </button>

        {showHistory && pastChats.map((chat, i) => (
          <div key={i} onClick={() => loadChat(chat)} style={{
            padding: "10px", background: "#0f172a", borderRadius: "8px",
            cursor: "pointer", fontSize: "12px", color: "#94a3b8"
          }}>
            <div style={{ color: levelColors[chat.risk_level] }}>Score: {chat.risk_score}</div>
            <div>{new Date(chat.created_at).toLocaleDateString()}</div>
          </div>
        ))}

        <button onClick={() => { setMessages([]); setRiskScore(null); setRiskLevel(null); }} style={{
          padding: "10px", borderRadius: "8px", border: "none",
          background: "#334155", color: "white", cursor: "pointer", fontSize: "13px"
        }}>
          + New Chat
        </button>

        <button onClick={handleLogout} style={{
          marginTop: "auto", padding: "10px", borderRadius: "8px", border: "none",
          background: "#ef444422", color: "#ef4444", cursor: "pointer", fontSize: "13px"
        }}>
          Logout
        </button>

        <div style={{ fontSize: "11px", color: "#475569" }}>
          ⚠️ Not a substitute for professional medical advice.
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#475569", marginTop: "80px" }}>
              <div style={{ fontSize: "48px" }}>🩺</div>
              <h3>Hello, {user.email.split("@")[0]}!</h3>
              <p>Tell me what symptoms you're experiencing.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "70%",
              background: msg.role === "user" ? "#38bdf8" : "#1e293b",
              color: msg.role === "user" ? "#0f172a" : "white",
              padding: "12px 16px", borderRadius: "12px",
              fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap"
            }}>
              {msg.content}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: "flex-start", background: "#1e293b", padding: "12px 16px", borderRadius: "12px", color: "#94a3b8" }}>
              Analyzing your symptoms...
            </div>
          )}
        </div>

        <div style={{ padding: "16px", background: "#1e293b", display: "flex", gap: "12px" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe your symptoms..."
            style={{
              flex: 1, padding: "12px 16px", borderRadius: "8px",
              border: "1px solid #334155", background: "#0f172a",
              color: "white", fontSize: "14px", outline: "none"
            }}
          />
          <button onClick={saveChat} style={{
            padding: "12px 16px", borderRadius: "8px", border: "none",
            background: "#334155", color: "white", cursor: "pointer", fontSize: "13px"
          }}>
            💾 Save
          </button>
          <button onClick={sendMessage} disabled={loading} style={{
            padding: "12px 24px", borderRadius: "8px", border: "none",
            background: loading ? "#334155" : "#38bdf8",
            color: "#0f172a", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer"
          }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}