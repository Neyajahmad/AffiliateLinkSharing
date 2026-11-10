import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { serverEndpoint } from "../config/config";
import { CLEAR_USER } from "../redux/user/actions";
import { FullPageLoader } from "../components/ui";

function Logout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                await axios.post(`${serverEndpoint}/auth/logout`, {}, { withCredentials: true });
                dispatch({ type: CLEAR_USER });
            } catch (error) {
                console.log(error);
                navigate('/error');
            }
        };
        handleLogout();
    }, [dispatch, navigate]);

    return <FullPageLoader label="Signing you out…" />;
}

export default Logout;
