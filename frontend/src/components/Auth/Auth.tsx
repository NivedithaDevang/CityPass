import { useState } from "react";
import axios, { AxiosError } from "axios";
import "./Auth.css";
import { API_BASE_URL } from "../../config/config";
import type { User } from "../../types/auth";
import { useUser } from "../../context/UserContext";
import { getPasswordErrors } from "../../config/passwordCheck";

// This tells TypeScript what your successful API response looks like.
interface ApiResponse {
  message: string;
  user?: User;
}

// This describes possible error responses from your backend.
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
  const { setUser } = useUser(); //stores logged in user's details globally
  const [isLogin, setIsLogin] = useState(initialLogin); //whether the form is in login or reg
  const [name, setName] = useState(""); //store name while registering
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); //whether an API request is running
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false); //reg success screen

  // Reactivation modal states
    // Stores whether the inactive-account reactivation modal should be displayed.
  const [showReactivatePrompt, setShowReactivatePrompt] = useState(false);
    // Stores the ID of the inactive user who wants to reactivate the account.
  const [inactiveUserId, setInactiveUserId] = useState<number | null>(null);
    // Tracks whether the account reactivation request is in progress.
  const [reactivating, setReactivating] = useState(false);

  // Only validate the password when we're in registration mode.
  const passwordErrors = !isLogin ? getPasswordErrors(password) : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && passwordErrors.length > 0) {
      setError(passwordErrors.join(". "));
      return;
    }

    setIsLoading(true);

    try {
      const url = isLogin
        ? `${API_BASE_URL}/v1/auth/login`
        : `${API_BASE_URL}/v1/auth/register`;

      const payload = isLogin
        ? { email, password }
        : { name, email, password, role: "USER" };

      const response = await axios.post<ApiResponse>(url, payload, {
        withCredentials: true,
      });

      if (isLogin) {
        if (response.data.user) {
          setUser(response.data.user);
          onSuccess(response.data.user);
        } else {
          setError("Login successful, but user details were not returned.");
          return;
        }

        setEmail("");
        setPassword("");
        onClose();
      } else {
        setName("");
        setEmail("");
        setPassword("");
        setIsRegisteredSuccess(true);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      // check whether the backend says that the accouont is inactive
      if (
        axiosError.response?.status === 403 &&
        axiosError.response?.data?.code === "ACCOUNT_INACTIVE"
      ) {
        //stores the inactive user's id so that it can be sent during reactivating
        setInactiveUserId(axiosError.response.data.userId ?? null);
        setShowReactivatePrompt(true);
        return;
      }

      //error message returned by the backend
      setError(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.errors
            ?.map((validationError) => validationError.msg)
            .filter(Boolean)
            .join(". ") ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  //user's confirmation to reactivate a deactivated account
  const handleConfirmReactivation = async () => {
    if (!inactiveUserId) return;

    try {
      setReactivating(true); //show reactivation loading state
      setError(null);

      //send inactive user's id to backend to reactivate and log in
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/v1/users/reactivate-login`,
        { userId: inactiveUserId },
        { withCredentials: true }
      );

      if (response.data.user) {
        setUser(response.data.user);
        onSuccess(response.data.user);
      }

      setShowReactivatePrompt(false);
      setEmail("");
      setPassword("");
      onClose();
    } catch (err) {
      //convert axios error to expected backend error-response type 
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "Unable to reactivate account."
      );
      setShowReactivatePrompt(false);
    } finally {
      setReactivating(false);
    }
  };

  const handleGoToLogin = () => {
    setIsRegisteredSuccess(false);
    setIsLogin(true);
    setError(null);
  };

  return (
    <>
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <button className="auth-close" onClick={onClose}>
            &times;
          </button>

          {isRegisteredSuccess ? (
            /* Success Screen after Registration */
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                Registration Successful!
              </h2>
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

                {!isLogin && password && passwordErrors.length > 0 && (
                  <div className="password-errors" role="alert">
                    {passwordErrors.map((passwordError) => (
                      <div key={passwordError}>{passwordError}</div>
                    ))}
                  </div>
                )}

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

      {/* Account Deactivated / Reactivation Prompt Modal */}
      {showReactivatePrompt && (
        <div
          className="reactivate-modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="reactivate-modal-card">
            <h3>Your account is currently deactivated.</h3>
            <p>
              Would you like to reactivate your CityPass account and continue?
            </p>

            <div className="reactivate-modal-actions">
              <button
                type="button"
                className="reactivate-cancel-btn"
                onClick={() => {
                  setShowReactivatePrompt(false);
                  setInactiveUserId(null);
                }}
                disabled={reactivating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="reactivate-confirm-btn"
                onClick={handleConfirmReactivation}
                disabled={reactivating}
              >
                {reactivating ? "Reactivating..." : "Reactivate Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Auth;