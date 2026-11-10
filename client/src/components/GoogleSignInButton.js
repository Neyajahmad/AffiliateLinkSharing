import axios from 'axios';
import { useDispatch } from 'react-redux';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { serverEndpoint } from '../config/config';
import { SET_USER } from '../redux/user/actions';
import { getErrorMessage } from './ui';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export const isGoogleSignInEnabled = Boolean(googleClientId);

// Renders the Google button and exchanges the Google ID token for an app
// session. Renders nothing when no client ID is configured, instead of
// sending users into Google's "invalid_client" error page.
function GoogleSignInButton({ text = 'signin_with', onError, onStart }) {
    const dispatch = useDispatch();

    if (!googleClientId) {
        return null;
    }

    const handleSuccess = async (authResponse) => {
        onStart?.();
        try {
            const response = await axios.post(`${serverEndpoint}/auth/google-auth`, {
                idToken: authResponse.credential
            }, { withCredentials: true });

            dispatch({ type: SET_USER, payload: response.data.user });
        } catch (error) {
            console.log(error);
            onError?.(getErrorMessage(error, 'Google sign-in failed. Please try again.'));
        }
    };

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <div className="google-btn-wrap">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => onError?.('Google sign-in was cancelled or failed. Please try again.')}
                    theme="outline"
                    size="large"
                    text={text}
                    shape="rectangular"
                    width="356"
                />
            </div>
        </GoogleOAuthProvider>
    );
}

export default GoogleSignInButton;
