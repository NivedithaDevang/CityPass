import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import "./Auth.css";
import { API_BASE_URL } from "../../config/config";
import type { User } from "../../types/auth";

interface ApiResponse {
  message: string;
  user?: User;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

interface AuthProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

function Auth({ onClose, onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("Form submitted");
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = isLogin
        ? `${API_BASE_URL}/v1/auth/login`
        : `${API_BASE_URL}/v1/auth/register`;

      // Include 'name' during registration
      const payload = isLogin
        ? { email, password }
        : { name, email, password, role: "USER" };


      const response = 
        await axios.post<ApiResponse>(url, payload,
        {
          withCredentials : true,
        });
        console.log(response.data);
      
      if (isLogin) {
  // Successful login
  console.log("LOGIN RESPONSE:", response.data);

  if (response.data.user) {
    console.log("User found: ", response.data.user);
    onSuccess(response.data.user);
  }
  else{
    console.log("No user in login respoonse");
    setError("login successful, but user details not returned");
    return;
  }

  setEmail("");
  setPassword("");
  onClose();
} else {
        // Successful registration -> trigger success screen
        setName("");
        setEmail("");
        setPassword("");
        setIsRegisteredSuccess(true);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.log("Error : ", axiosError);
      console.log("Status: ", axiosError.response?.status);
      console.log("Response:", axiosError.response?.data);
    console.log("Request URL:", axiosError.config?.url);


      
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setIsRegisteredSuccess(false);
    setIsLogin(true);
    setError(null);
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>
          &times;
        </button>

        {isRegisteredSuccess ? (
          /* Success Screen after Registration */
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Registration Successful!</h2>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Your account has been created. Please login to continue.
            </p>
            <button
              type="button"
              className="auth-submit"
              onClick={handleGoToLogin}
            >
              Go to Login
            </button>
          </div>
        ) : (
          /* Normal Auth Form (Login or Register) */
          <>
            {!isLogin ? (
              <>
                <h2>Create your account</h2>
                <p>Join CityPass and explore your city</p>
              </>
            ) : (
              <>
                <h2>Welcome back</h2>
                <p>Login to continue exploring CityPass</p>
              </>
            )}

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
              >
                {isLoading
                  ? isLogin
                    ? "Logging in..."
                    : "Creating account..."
                  : isLogin
                  ? "Login"
                  : "Create account"}
              </button>
            </form>

            <div className="auth-switch">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setIsLogin(false)}>
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setIsLogin(true)}>
                    Login
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Auth;


