import { useState } from "react";
import axios from 'axios';
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { serverEndpoint } from "../config/config";
import { SET_USER } from "../redux/user/actions";
import AuthSplit from "../components/AuthSplit";
import GoogleSignInButton, { isGoogleSignInEnabled } from "../components/GoogleSignInButton";
import { Alert, ButtonSpinner, getErrorMessage } from "../components/ui";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register() {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({ name: '', username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!EMAIL_PATTERN.test(formData.username.trim())) newErrors.username = 'Enter a valid email address';
        if (formData.password.length < 6) newErrors.password = 'Use at least 6 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const response = await axios.post(`${serverEndpoint}/auth/register`, {
                name: formData.name.trim(),
                username: formData.username.trim(),
                password: formData.password
            }, { withCredentials: true });
            dispatch({ type: SET_USER, payload: response.data.user });
        } catch (error) {
            const message = error?.response?.status === 401
                ? 'An account with this email already exists. Try logging in instead.'
                : getErrorMessage(error);
            setErrors({ message });
            setSubmitting(false);
        }
    };

    return (
        <AuthSplit
            heading="Start tracking your links"
            text="Create your free account and share your first trackable link in minutes."
        >
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">
                Already have one? <Link to="/login" className="fw-semibold">Log in</Link>
            </p>

            {errors.message && <Alert>{errors.message}</Alert>}

            <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Full name</label>
                    <div className="input-icon">
                        <i className="bi bi-person" aria-hidden="true" />
                        <input
                            type="text"
                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                            id="name"
                            name="name"
                            autoComplete="name"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                </div>

                <div className="mb-3">
                    <label htmlFor="username" className="form-label">Email</label>
                    <div className="input-icon">
                        <i className="bi bi-envelope" aria-hidden="true" />
                        <input
                            type="email"
                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                            id="username"
                            name="username"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>
                    {errors.username && <div className="invalid-feedback d-block">{errors.username}</div>}
                </div>

                <div className="mb-4">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="input-icon">
                        <i className="bi bi-lock" aria-hidden="true" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={`form-control pe-5 ${errors.password ? 'is-invalid' : ''}`}
                            id="password"
                            name="password"
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            className="input-action"
                            onClick={() => setShowPassword((value) => !value)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                    </div>
                    {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-100" disabled={submitting}>
                    {submitting ? <><ButtonSpinner /> Creating account…</> : 'Create account'}
                </button>
            </form>

            {isGoogleSignInEnabled && (
                <>
                    <div className="auth-divider">or</div>
                    <GoogleSignInButton
                        text="signup_with"
                        onStart={() => setErrors({})}
                        onError={(message) => setErrors({ message })}
                    />
                </>
            )}
        </AuthSplit>
    );
}

export default Register;
