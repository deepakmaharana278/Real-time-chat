import { useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import '../auth.css';

const API_URL = "http://localhost:8000/user";

export default function Authentication({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    username: "",
    password: "",
    password2: ""
  });
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isLogin) {
      try {
        const res = await fetch(`${API_URL}/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          localStorage.setItem("user", JSON.stringify(data.user));
          if (onLogin) onLogin(data.user);
          navigate('/chat');
        } else setError(data.error || "Login failed");
      } catch { setError("Network error. Please try again."); }
    } else {
      try {
        const res = await fetch(`${API_URL}/reg/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            username: formData.username,
            password: formData.password,
            password2: formData.password2
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMessage(data.message || "Registration successful! Please check your email for verification link.");
          setFormData({ email: "", username: "", password: "", password2: "" });
          
        } else {
          let msg = "Registration failed";
          if (data.errors) {
            const first = Object.values(data.errors)[0];
            msg = Array.isArray(first) ? first[0] : first;
          }
          setError(msg);
        }
      } catch { setError("Network error. Please try again."); }
    }
    setLoading(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setMessage("");
    setFormData({ email: "", username: "", password: "", password2: "" });
  };

  return (
    <div className="auth-root">
      <div className="container">
      <div className="left-panel">
        <div className="decorative-circle-1" />
        <div className="decorative-circle-2" />
        <div className="decorative-circle-3" />

        <div>
          <div className="brand-logo">
            <div className="brand-dot" />
          </div>

          <div>
            <p className="brand-badge">
              {isLogin ? "Welcome back" : "Getting started"}
            </p>
            <h1 className="brand-title">
              {isLogin
                ? <>Sign in to<br /><em>your space</em></>
                : <>Create your<br /><em>account</em></>}
            </h1>
          </div>
        </div>

        <p className="footer-note">
          Secure, verified access. Your credentials are encrypted end-to-end.
        </p>
      </div>

      <div className="right-panel">
        <div className="form-wrapper fade-in">
          <div className="toggle-container">
            {["Sign in", "Register"].map((label, i) => {
              const active = (i === 0) === isLogin;
              return (
                <button
                  key={label}
                  className="mode-link toggle-btn"
                  onClick={() => { if ((i === 0) !== isLogin) switchMode(); }}
                  style={{
                    color: active ? "#c9a84c" : "#4a4640",
                    borderBottom: active ? "1.5px solid #c9a84c" : "1.5px solid transparent",
                    fontWeight: active ? 500 : 400,
                    marginBottom: "-1px",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {message && (
            <div className="message-success">
              {message}
            </div>
          )}
          {error && (
            <div className="message-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <label className="field-label">Email address</label>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="field-row fade-in">
                <label className="field-label">Username</label>
                <input
                  className="auth-input"
                  type="text"
                  name="username"
                  placeholder="your_handle"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength="3"
                />
              </div>
            )}

            <div className="field-row">
              <label className="field-label">Password</label>
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="min. 8 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
              />
            </div>

            {!isLogin && (
              <div className="field-row fade-in">
                <label className="field-label">Confirm password</label>
                <input
                  className="auth-input"
                  type="password"
                  name="password2"
                  placeholder="repeat password"
                  value={formData.password2}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <button
              className="auth-submit submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  Processing
                </span>
              ) : (isLogin ? "Continue" : "Create account")}
            </button>
          </form>

          {!isLogin && (
            <p className="register-note">
              A verification link will be sent to your email.
              <br />
              <span>Check terminal for the link in dev mode.</span>
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}