import { useState } from "react";
import axios from "axios";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [riskScore, setRiskScore] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);
  const [reason, setReason] = useState(null);

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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/triage", {
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

      setMessages([...newMessages, { role: "assistant", content: cleanReply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error connecting to backend. Make sure it is running." },
      ]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", background: "#0f172a", color: "white" }}>
      
      {/* Sidebar */}
      <div style={{ width: "280px", background: "#1e293b", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ margin: 0, color: "#38bdf8" }}>🏥 AI Triage</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Describe your symptoms and get instant guidance.</p>

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

        <div style={{ marginTop: "auto", fontSize: "11px", color: "#475569" }}>
          ⚠️ This is not a substitute for professional medical advice. Always consult a doctor.
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#475569", marginTop: "80px" }}>
              <div style={{ fontSize: "48px" }}>🩺</div>
              <h3>Hello! I'm your AI Triage Assistant</h3>
              <p>Tell me what symptoms you're experiencing and I'll help assess your condition.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "70%",
              background: msg.role === "user" ? "#38bdf8" : "#1e293b",
              color: msg.role === "user" ? "#0f172a" : "white",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap"
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

        {/* Input */}
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
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: "12px 24px", borderRadius: "8px", border: "none",
              background: loading ? "#334155" : "#38bdf8",
              color: "#0f172a", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}