import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login-postman", {
        username,
        password,
      });

      if (response.data) {
        console.log("Login successful:", response.data);
        // Backend đã lưu cookie, chuyển đến trang upload
        navigate("/upload-video");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🔐 Đăng Nhập</h1>
        <p className="subtitle">Đăng nhập để sử dụng tính năng upload video</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !username || !password}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="login-info">
          <p>
            💡 Tip: Backend sẽ tự động lưu cookie sau khi đăng nhập thành công
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
