import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import "./Auth.css";
import { API_BASE_URL } from "../../config/config";
import type { User } from "../../types/auth";
import { useUser } from "../../context/UserContext";
import { PASSWORD_RULES } from "../../config/passwordRules";
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from "react-icons/fa";

interface ApiResponse {
  message: string;
  user?: User;
  token?: string;
  userId?: number;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z\s.'-]+$/;

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
  const [dob, setDob] = useState("");

  // Visibility toggle states (default: hidden)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showReactivatePrompt, setShowReactivatePrompt] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const allRulesPassed = PASSWORD_RULES.every((rule) =>
    rule.check(password)
  );

  const isConfirmValid =
    confirmPassword.length > 0 && confirmPassword === password;

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;

    const birthDate = new Date(`${dobString}`);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  };

  const getMaxSelectableDob = (): string => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 16);

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const resetFormFields = () => {
    setName("");
    setEmail("");
    setDob("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordFocused(false);
    setConfirmFocused(false);
    setError(null);
    setNameError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setError(null);

    if (!val) {
      setNameError(null);
      return;
    }

    if (!NAME_REGEX.test(val)) {
      setNameError("Name can only contain letters and spaces (no numbers or special characters).");
    } else {
      setNameError(null);
    }
  };

  const handleSuccessfulAuth = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    onSuccess(authenticatedUser);

    resetFormFields();
    onClose();

    const normalizedRole =
      authenticatedUser.role?.toUpperCase().trim().replace(/[\s-]+/g, "_") ||
      "";
    const isAdmin =
      normalizedRole === "SUPER_ADMIN" ||
      normalizedRole === "SUPERADMIN" ||
      normalizedRole === "ADMIN";

    if (redirectOnSuccess) {
      if (normalizedRole === "ORGANIZER" || normalizedRole === "ORGANISER") {
        navigate("/organiser");
      } else if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isLogin) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        setError("Please enter your full name.");
        return;
      }

      if (!NAME_REGEX.test(trimmedName)) {
        setError("Name can only contain letters and spaces.");
        return;
      }

      if (trimmedName.length < 2) {
        setError("Name must be at least 2 characters long.");
        return;
      }

      if (!dob) {
        setError("Please select your date of birth.");
        return;
      }

      const age = calculateAge(dob);

      if (age < 16) {
        setError(
          "You are not eligible to register for CityPass. You must be at least 16 years old."
        );
        return;
      }

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
      if (isLogin) {
        const response = await axios.post<ApiResponse>(
          `${API_BASE_URL}/v1/auth/login`,
          { email: trimmedEmail, password },
          { withCredentials: true }
        );

        if (!response.data.user) {
          setError("User details were not returned.");
          return;
        }

        handleSuccessfulAuth(response.data.user);
      } else {
        const regResponse = await axios.post<ApiResponse>(
          `${API_BASE_URL}/v1/auth/register`,
          {
            name: name.trim(),
            email: trimmedEmail,
            dob,
            password,
            confirmpassword: confirmPassword,
            role: "USER",
          },
          { withCredentials: true }
        );

        if (regResponse.data.user) {
          handleSuccessfulAuth(regResponse.data.user);
          return;
        }

        try {
          const loginResponse = await axios.post<ApiResponse>(
            `${API_BASE_URL}/v1/auth/login`,
            { email: trimmedEmail, password },
            { withCredentials: true }
          );

          if (loginResponse.data.user) {
            handleSuccessfulAuth(loginResponse.data.user);
            return;
          }
        } catch {
          // Fallback if auto-login fails
        }

        const fallbackUser: User = {
          name: name.trim(),
          email: trimmedEmail,
          dob,
          role: "USER",
          status: "ACTIVE",
          ...(regResponse.data.userId
            ? { id: String(regResponse.data.userId) }
            : {}),
        } as User;

        handleSuccessfulAuth(fallbackUser);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      const serverMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "";

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
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/v1/users/reactivate-login`,
        { email: email.trim(), password },
        { withCredentials: true }
      );

      const reactivatedUser = response.data.user;

      if (reactivatedUser) {
        setUser(reactivatedUser);
        onSuccess(reactivatedUser);
      }

      setShowReactivatePrompt(false);
      resetFormFields();
      onClose();

      navigate("/settings/profile");
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
          <>
            <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
            <p>
              {isLogin
                ? "Login to explore CityPass"
                : "Join CityPass and explore your city"}
            </p>

            {error && (
              <div className="auth-error-banner" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {!isLogin && (
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={handleNameChange}
                    className={nameError ? "input-match-fail" : ""}
                    required
                  />
                  {nameError && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.8rem",
                        color: "#ef4444",
                        marginTop: "4px",
                        paddingLeft: "4px",
                      }}
                    >
                      <FaTimesCircle />
                      <span>{nameError}</span>
                    </div>
                  )}
                </div>
              )}

              {!isLogin && (
                <input
                  type="date"
                  placeholder="Enter your DOB"
                  value={dob}
                  max={getMaxSelectableDob()}
                  onChange={(e) => {
                    setDob(e.target.value);
                    setError(null);
                  }}
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
              />

              {/* Password field with visibility toggle */}
              <div className="input-group" style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  style={{ paddingRight: "42px" }}
                  onFocus={() => setPasswordFocused(true)}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "22px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>

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

              {/* Confirm Password field with visibility toggle */}
              {!isLogin && (
                <div className="input-group" style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    style={{ paddingRight: "42px" }}
                    onFocus={() => setConfirmFocused(true)}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    className={
                      confirmPassword.length > 0
                        ? isConfirmValid
                          ? "input-match-success"
                          : "input-match-fail"
                        : ""
                    }
                    required
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "22px",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>

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
                  (!isLogin && (Boolean(nameError) || !allRulesPassed || !isConfirmValid))
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
                      resetFormFields();
                      setIsLogin(false);
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
                      resetFormFields();
                      setIsLogin(true);
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