import { LogIn } from "lucide-react";
import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg-color)",
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          padding: "40px",
          width: "100%",
          maxWidth: "400px",
          margin: "20px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "2rem",
              color: "var(--primary)",
              marginBottom: "8px",
            }}
          >
            AttendancePro
          </h1>
          <p style={{ color: "var(--text-muted)" }}>Management System</p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "var(--danger)",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.9rem",
                color: "var(--text-muted)",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.9rem",
                color: "var(--text-muted)",
              }}
            >
              Password
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ marginTop: "10px" }}
          >
            {isLoading ? (
              "Signing in..."
            ) : (
              <>
                <LogIn size={20} /> Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
