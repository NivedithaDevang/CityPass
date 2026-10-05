import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
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
  token?: string;
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
  redirectOnSuccess?: boolean;
}

function Auth({
  onClose,
  onSuccess,
  initialLogin = false,
  redirectOnSuccess = true,
}: AuthProps) {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [isLogin, setIsLogin] = useState(initialLogin);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State to track deactivation modal and loading status
  const [showReactivatePrompt, setShowReactivatePrompt] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const allRulesPassed = PASSWORD_RULES.every((rule) =>
    rule.check(password)
  );

  const isConfirmValid =
    confirmPassword.length > 0 && confirmPassword === password;

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

      if (!response.data.user) {
        setError("User details were not returned.");
        return;
      }

      const loggedUser = response.data.user;

setUser(loggedUser);

onSuccess(loggedUser);

setName("");
setEmail("");
setPassword("");
setConfirmPassword("");
setPasswordFocused(false);
setConfirmFocused(false);

onClose();


const isAdmin =
  loggedUser.role === "SUPER_ADMIN" ||
  loggedUser.role === "ADMIN";


if (loggedUser.role === "ORGANIZER") {

  navigate("/organiser/home");

} else if (isAdmin) {

  navigate("/admin");

} else if (redirectOnSuccess) {

  navigate("/");

}
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const serverMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "";

      // Detect deactivated account response
      if (
        serverMessage.toLowerCase().includes("deactivated") ||
        axiosError.response?.data?.code === "ACCOUNT_DEACTIVATED"
      ) {
        setShowReactivatePrompt(true);
        return;
      }

      setError(
        serverMessage ||
          axiosError.response?.data?.errors
            ?.map((e) => e.msg)
            .filter(Boolean)
            .join(". ") ||
          "Authentication failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    setError(null);

    try {
      // Call your reactivation API endpoint
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/v1/users/reactivate-login`,
        { email, password },
        { withCredentials: true }
      );

      const reactivatedUser = response.data.user;
      if (reactivatedUser) {
        setUser(reactivatedUser);
        onSuccess(reactivatedUser);
      }

      setShowReactivatePrompt(false);
      onClose();

      // Redirect user directly to their account page
      navigate("/account"); // or "/profile", update to your account route
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "Failed to reactivate account."
      );
      setShowReactivatePrompt(false);
    } finally {
      setIsReactivating(false);
    }
  };

  return createPortal(
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        {showReactivatePrompt ? (
          /* Confirmation Dialog for Reactivation */
          <div className="reactivate-modal-body">
            <h2>Account Deactivated</h2>
            <p>
              Your account is currently deactivated. Would you like to reactivate
              it and continue?
            </p>

            <div className="reactivate-actions">
              <button
                type="button"
                className="auth-submit reactivate-confirm-btn"
                onClick={handleReactivate}
                disabled={isReactivating}
              >
                {isReactivating ? "Reactivating..." : "Yes, Reactivate"}
              </button>
              <button
                type="button"
                className="auth-cancel-btn"
                onClick={() => setShowReactivatePrompt(false)}
                disabled={isReactivating}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Standard Auth Form */
          <>
            <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>

            <p>
              {isLogin
                ? "Login to explore CityPass"
                : "Join CityPass and explore your city"}
            </p>

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

                {!isLogin && (passwordFocused || password.length > 0) && (
                  <div className="live-rule-tray">
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.check(password);

                      return (
                        <span
                          key={rule.id}
                          className={`rule-badge ${
                            passed ? "valid" : "invalid"
                          }`}
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

                  {(confirmFocused || confirmPassword.length > 0) &&
                    confirmPassword.length > 0 && (
                      <div
                        className={`live-match-hint ${
                          isConfirmValid ? "valid" : "invalid"
                        }`}
                      >
                        {isConfirmValid ? (
                          <>
                            <FaCheckCircle />
                            Passwords match
                          </>
                        ) : (
                          <>
                            <FaTimesCircle />
                            Passwords do not match
                          </>
                        )}
                      </div>
                    )}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={
                  isLoading ||
                  (!isLogin && (!allRulesPassed || !isConfirmValid))
                }
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError(null);
                    }}
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError(null);
                    }}
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Auth;