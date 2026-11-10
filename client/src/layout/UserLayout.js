import { useLocation } from "react-router-dom";
import UserFooter from "./UserFooter";
import UserHeader from "./UserHeader";

function UserLayout({ children }) {
    const { pathname } = useLocation();
    return (
        <div className="app-shell">
            <UserHeader />
            <main className="app-main page-enter" key={pathname}>{children}</main>
            <UserFooter />
        </div>
    );
}

export default UserLayout;
