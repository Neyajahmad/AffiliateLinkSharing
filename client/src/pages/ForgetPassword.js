import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { serverEndpoint } from "../config/config";
import { Alert, ButtonSpinner } from "../components/ui";

function ForgetPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccess("");
        setLoading(true);
        try {
            await axios.post(`${serverEndpoint}/auth/send-reset-password-token`, { email: email.trim() });
        } catch (error) {
            // Always show the same message so we don't reveal which emails exist.
        } finally {
            setLoading(false);
            setSuccess("If an account exists for this email, we've sent a 6-digit reset code. Redirecting…");
            setTimeout(() => navigate("/reset-password", { state: { email: email.trim() } }), 1800);
        }
    };

    return (
        <div className="auth-main">
            <div className="auth-card auth-card-boxed">
                <span className="auth-icon" aria-hidden="true"><i className="bi bi-key" /></span>
                <h1 className="auth-title">Forgot your password?</h1>
                <p className="auth-subtitle">Enter your email and we'll send you a code to reset it.</p>

                {success && <Alert variant="success">{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="form-label">Email</label>
                        <div className="input-icon">
                            <i className="bi bi-envelope" aria-hidden="true" />
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading || Boolean(success)}>
                        {loading ? <><ButtonSpinner /> Sending…</> : 'Send reset code'}
                    </button>
                </form>

                <p className="auth-footer mb-0">
                    <Link to="/login"><i className="bi bi-arrow-left" aria-hidden="true" /> Back to log in</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgetPassword;
