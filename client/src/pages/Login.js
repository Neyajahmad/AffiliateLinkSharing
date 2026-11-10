import { useState } from "react";
import axios from 'axios';
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { serverEndpoint } from "../config/config";
import { SET_USER } from "../redux/user/actions";
import AuthSplit from "../components/AuthSplit";
import GoogleSignInButton, { isGoogleSignInEnabled } from "../components/GoogleSignInButton";
import { Alert, ButtonSpinner, getErrorMessage } from "../components/ui";

function Login() {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({ username: '', password: '' });
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
        if (!formData.username.trim()) newErrors.username = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const response = await axios.post(`${serverEndpoint}/auth/login`, {
                username: formData.username.trim(),
                password: formData.password
            }, { withCredentials: true });
            dispatch({ type: SET_USER, payload: response.data.user });
        } catch (error) {
            const message = error?.response?.status === 401
                ? 'Incorrect email or password. Please try again.'
                : getErrorMessage(error);
            setErrors({ message });
            setSubmitting(false);
        }
    };

    return (
        <AuthSplit
            heading="Welcome back"
            text="Pick up where you left off and see how your links are performing."
        >
            <h1 className="auth-title">Log in to your account</h1>
            <p className="auth-subtitle">
                New here? <Link to="/register" className="fw-semibold">Create an account</Link>
            </p>

            {errors.message && <Alert>{errors.message}</Alert>}

            <form onSubmit={handleSubmit} noValidate>
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
                    <div className="d-flex justify-content-between align-items-center">
                        <label htmlFor="password" className="form-label">Password</label>
                        <Link to="/forget-password" className="label-link mb-1">Forgot password?</Link>
                    </div>
                    <div className="input-icon">
                        <i className="bi bi-lock" aria-hidden="true" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={`form-control pe-5 ${errors.password ? 'is-invalid' : ''}`}
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
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
                    {submitting ? <><ButtonSpinner /> Signing in…</> : 'Log in'}
                </button>
            </form>

            {isGoogleSignInEnabled && (
                <>
                    <div className="auth-divider">or</div>
                    <GoogleSignInButton
                        text="signin_with"
                        onStart={() => setErrors({})}
                        onError={(message) => setErrors({ message })}
                    />
                </>
            )}
        </AuthSplit>
    );
}

export default Login;
