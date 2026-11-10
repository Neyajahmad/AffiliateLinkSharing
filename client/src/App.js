import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Error from "./pages/Error";
import NotFound from "./pages/NotFound";
import Logout from "./pages/Logout";
import { serverEndpoint } from "./config/config";
import { SET_USER } from "./redux/user/actions";
import UserLayout from "./layout/UserLayout";
import Register from "./pages/Register";
import ManageUsers from "./pages/users/ManageUsers";
import UnauthorizedAccess from "./components/UnauthorizedAccess";
import ProtectedRoute from "./rbac/ProtectedRoute";
import ManagePayments from "./pages/payments/ManagePayments";
import AnalyticsDashboard from "./pages/links/AnalyticsDashboard";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import { FullPageLoader, ScrollToTop } from "./components/ui";

function App() {
  const dispatch = useDispatch();
  const userDetails = useSelector((state) => state.userDetails);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isUserLoggedIn = async () => {
      try {
        const response = await axios.post(`${serverEndpoint}/auth/is-user-logged-in`, {}, {
          withCredentials: true
        });
        dispatch({
          type: SET_USER,
          payload: response.data.user
        });
      } catch (error) {
        // 401 simply means "not signed in".
      } finally {
        setLoading(false);
      }
    };

    isUserLoggedIn();
  }, [dispatch]);

  if (loading) {
    return <FullPageLoader />;
  }

  const signedIn = (element) => userDetails ? <UserLayout>{element}</UserLayout> : <Navigate to="/login" replace />;
  const signedOut = (element) => userDetails ? <Navigate to="/dashboard" replace /> : <AppLayout>{element}</AppLayout>;

  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={signedOut(<Home />)} />
      <Route path="/login" element={signedOut(<Login />)} />
      <Route path="/register" element={signedOut(<Register />)} />
      <Route path="/forget-password" element={<AppLayout><ForgetPassword /></AppLayout>} />
      <Route path="/reset-password" element={<AppLayout><ResetPassword /></AppLayout>} />

      <Route path="/dashboard" element={signedIn(<Dashboard />)} />
      <Route path="/analytics/:id" element={signedIn(<AnalyticsDashboard />)} />
      <Route path="/users" element={userDetails ?
        <ProtectedRoute roles={['admin']}>
          <UserLayout><ManageUsers /></UserLayout>
        </ProtectedRoute> :
        <Navigate to="/login" replace />
      } />
      <Route path="/manage-payments" element={userDetails ?
        <ProtectedRoute roles={['admin']}>
          <UserLayout><ManagePayments /></UserLayout>
        </ProtectedRoute> :
        <Navigate to="/login" replace />
      } />
      <Route path="/unauthorized-access" element={signedIn(<UnauthorizedAccess />)} />
      <Route path="/logout" element={userDetails ? <Logout /> : <Navigate to="/login" replace />} />

      <Route path="/error" element={userDetails ?
        <UserLayout><Error /></UserLayout> :
        <AppLayout><Error /></AppLayout>} />
      <Route path="*" element={userDetails ?
        <UserLayout><NotFound /></UserLayout> :
        <AppLayout><NotFound /></AppLayout>} />
    </Routes>
    </>
  );
}

export default App;
