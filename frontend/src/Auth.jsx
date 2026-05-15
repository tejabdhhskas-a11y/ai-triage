import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("Check your email to confirm signup!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", background: "#0f172a", fontFamily: "sans-serif"
    }}>
      <div style={{
        background: "#1e293b", padding: "40px", borderRadius: "16px",
        width: "360px", display: "flex", flexDirection: "column", gap: "16px"
      }}>
        <h2 style={{ color: "#38bdf8", margin: 0, textAlign: "center" }}>
          🏥 AI Triage Assistant
        </h2>
        <p style={{ color: "#94a3b8", textAlign: "center", margin: 0, fontSize: "14px" }}>
          {isSignup ? "Create an account" : "Sign in to continue"}
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "12px", borderRadius: "8px", border: "1px solid #334155",
            background: "#0f172a", color: "white", fontSize: "14px", outline: "none"
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "12px", borderRadius: "8px", border: "1px solid #334155",
            background: "#0f172a", color: "white", fontSize: "14px", outline: "none"
          }}
        />

        {error && <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "12px", borderRadius: "8px", border: "none",
            background: loading ? "#334155" : "#38bdf8",
            color: "#0f172a", fontWeight: "bold", cursor: "pointer", fontSize: "14px"
          }}
        >
          {loading ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
        </button>

        <p
          onClick={() => setIsSignup(!isSignup)}
          style={{ color: "#38bdf8", textAlign: "center", cursor: "pointer", fontSize: "13px", margin: 0 }}
        >
          {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </p>
      </div>
    </div>
  );
}