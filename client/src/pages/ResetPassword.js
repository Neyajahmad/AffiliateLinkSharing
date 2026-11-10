import { useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { serverEndpoint } from "../config/config";
import { Alert, ButtonSpinner, getErrorMessage } from "../components/ui";

function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const reduxUser = useSelector((state) => state.userDetails);
    // Prefer email from location.state, then redux, then empty
    const initialEmail = location.state?.email || reduxUser?.email || "";
    const hideEmail = Boolean(initialEmail);
    const [form, setForm] = useState({
        email: initialEmail,
        code: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        if (form.newPassword.length < 6) {
            setError("Your new password must be at least 6 characters long.");
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${serverEndpoint}/auth/reset-password`, {
                email: form.email.trim(),
                code: form.code.trim(),
                newPassword: form.newPassword
            });
            setSuccess("Your password has been reset. Taking you to log in…");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to reset password"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-main">
            <div className="auth-card auth-card-boxed">
                <span className="auth-icon" aria-hidden="true"><i className="bi bi-shield-lock" /></span>
                <h1 className="auth-title">Set a new password</h1>
                <p className="auth-subtitle">
                    {hideEmail
                        ? <>Enter the 6-digit code we sent to <strong>{initialEmail}</strong>.</>
                        : 'Enter your email, the 6-digit code we sent you and a new password.'}
                </p>

                {error && <Alert>{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    {!hideEmail && (
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className="mb-3">
                        <label htmlFor="code" className="form-label">Reset code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            className="form-control tabular"
                            id="code"
                            name="code"
                            placeholder="123456"
                            value={form.code}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label">New password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="newPassword"
                            name="newPassword"
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            value={form.newPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            autoComplete="new-password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading || Boolean(success)}>
                        {loading ? <><ButtonSpinner /> Resetting…</> : 'Reset password'}
                    </button>
                </form>

                <p className="auth-footer mb-0">
                    Didn't get a code? <Link to="/forget-password">Send a new one</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;
