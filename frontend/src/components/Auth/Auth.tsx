import { useState } from "react";
import axios, { AxiosError } from "axios";
import "./Auth.css";
import { API_BASE_URL } from "../../config/config";
import type { User } from "../../types/auth";
import { useUser } from "../../context/UserContext";
import { PASSWORD_RULES } from "../../config/passwordRules";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface ApiResponse {
  message: string;
  user?: User;
}

interface ApiErrorResponse {
  code?: string;
  userId?: number;
  message?: string;
  error?: string;
  errors?: Array<{ msg?: string }>;
}

interface AuthProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialLogin?: boolean;
}

function Auth({ onClose, onSuccess, initialLogin = false }: AuthProps) {
  const { setUser } = useUser();
  const [isLogin, setIsLogin] = useState(initialLogin);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Track focus so hints don't show before the user reaches the fields
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Live condition checks
  const allRulesPassed = PASSWORD_RULES.every((rule) => rule.check(password));
  const isConfirmValid = confirmPassword.length > 0 && confirmPassword === password;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isLogin) {
      if (!allRulesPassed) {
        setError("Please fulfill all password requirements.");
        return;
      }
      if (!isConfirmValid) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const url = isLogin
        ? `${API_BASE_URL}/v1/auth/login`
        : `${API_BASE_URL}/v1/auth/register`;

      const payload = isLogin
        ? { email, password }
        : {
            name,
            email,
            password,
            confirmpassword: confirmPassword,
            role: "USER",
          };

      const response = await axios.post<ApiResponse>(url, payload, {
        withCredentials: true,
      });

      if (response.data.user) {
        setUser(response.data.user);
        onSuccess(response.data.user);
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        setError("User details were not returned.");
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.errors?.map((e) => e.msg).join(". ") ||
          "Authentication failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>&times;</button>

        <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
        <p>{isLogin ? "Login to explore CityPass" : "Join CityPass and explore your city"}</p>

        {error && <div className="auth-error-banner">{error}</div>}

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

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onFocus={() => setPasswordFocused(true)}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Live requirement badges appear once user clicks or types */}
            {!isLogin && (passwordFocused || password.length > 0) && (
              <div className="live-rule-tray">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.check(password);
                  return (
                    <span
                      key={rule.id}
                      className={`rule-badge ${passed ? "valid" : "invalid"}`}
                    >
                      {passed ? (
                        <FaCheckCircle className="badge-icon" />
                      ) : (
                        <span className="dot" />
                      )}
                      {rule.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="input-group">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onFocus={() => setConfirmFocused(true)}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={
                  confirmPassword.length > 0
                    ? isConfirmValid
                      ? "input-match-success"
                      : "input-match-fail"
                    : ""
                }
                required
              />

              {/* Dynamic match notification while typing */}
              {(confirmFocused || confirmPassword.length > 0) && confirmPassword.length > 0 && (
                <div className={`live-match-hint ${isConfirmValid ? "valid" : "invalid"}`}>
                  {isConfirmValid ? (
                    <>
                      <FaCheckCircle /> Passwords match
                    </>
                  ) : (
                    <>
                      <FaTimesCircle /> Passwords do not match
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading || (!isLogin && (!allRulesPassed || !isConfirmValid))}
          >
            {isLoading
              ? isLogin ? "Logging in..." : "Creating account..."
              : isLogin ? "Login" : "Create account"}
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
      </div>
    </div>
  );
}

export default Auth;