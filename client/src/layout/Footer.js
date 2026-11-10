import { Link } from "react-router-dom";
import { BrandLogo } from "../components/ui";

function Footer() {
    return (
        <footer className="site-footer">
            <div className="container">
                <div className="row g-4">
                    <div className="col-lg-5">
                        <BrandLogo light />
                        <p className="mt-3 mb-0" style={{ maxWidth: '22rem' }}>
                            Create trackable affiliate links, share them anywhere and see exactly
                            where every click comes from.
                        </p>
                    </div>
                    <div className="col-6 col-md-4 col-lg-2 offset-lg-1">
                        <p className="footer-heading">Product</p>
                        <ul className="footer-links">
                            <li><Link to="/#features">Features</Link></li>
                            <li><Link to="/#how-it-works">How it works</Link></li>
                            <li><Link to="/#pricing">Pricing</Link></li>
                            <li><Link to="/#faq">FAQ</Link></li>
                        </ul>
                    </div>
                    <div className="col-6 col-md-4 col-lg-2">
                        <p className="footer-heading">Account</p>
                        <ul className="footer-links">
                            <li><Link to="/register">Create account</Link></li>
                            <li><Link to="/login">Log in</Link></li>
                            <li><Link to="/forget-password">Reset password</Link></li>
                        </ul>
                    </div>
                    <div className="col-md-4 col-lg-2">
                        <p className="footer-heading">Payments</p>
                        <p className="mb-0">
                            Secure checkout with Razorpay. Prices in INR.
                        </p>
                    </div>
                </div>
                <div className="footer-bottom d-flex flex-wrap justify-content-between gap-2">
                    <span>&copy; {new Date().getFullYear()} Affiliate++. All rights reserved.</span>
                    <span>Made for creators and affiliate marketers.</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
