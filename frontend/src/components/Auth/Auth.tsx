import { useState } from "react";
import axios, { AxiosError } from 'axios';
import "./Auth.css";

interface RegisterResponse {
    message: string;
}

interface ApiErrorResponse {
    message: string;
    error?: string;
}

interface RegisterProps {
    onClose?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onClose }) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            const response = await axios.post<RegisterResponse>('http://localhost:5000/api/v1/auth/register', {
                email,
                password
            });

            setSuccessMessage(response.data.message);
            setEmail("");
            setPassword("");
            if (onClose) onClose();
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            if(axiosError.response?.data?.error){
                setError(axiosError.response.data.error);
            }
            else if (axiosError.message) {
                setError(axiosError.message);
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleRegister}>
                <h2>Register</h2>
                {error && <div className="error">{error}</div>}
                {successMessage && <div className="success">{successMessage}</div>}
                <input
                    type="email"
                    placeholder="Email"
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
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
};