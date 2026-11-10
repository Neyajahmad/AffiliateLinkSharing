import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";

function AppLayout({ children }) {
    const { pathname } = useLocation();
    return (
        <div className="app-shell">
            <Header />
            <main className="app-main page-enter" key={pathname}>{children}</main>
            <Footer />
        </div>
    );
}

export default AppLayout;
