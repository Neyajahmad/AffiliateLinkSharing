import { Link, NavLink } from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";
import { BrandLogo, useScrolled } from "../components/ui";

function Header() {
    const scrolled = useScrolled();

    return (
        <Navbar
            expand="lg"
            sticky="top"
            collapseOnSelect
            variant="dark"
            className={`site-navbar ${scrolled ? 'is-scrolled' : ''}`}
        >
            <Container>
                <Navbar.Brand as={Link} to="/" aria-label="Affiliate++ home">
                    <BrandLogo light />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="site-nav" />
                <Navbar.Collapse id="site-nav">
                    <Nav className="ms-auto align-items-lg-center gap-lg-1">
                        <Nav.Link as={Link} to="/#features" eventKey="features">Features</Nav.Link>
                        <Nav.Link as={Link} to="/#how-it-works" eventKey="how">How it works</Nav.Link>
                        <Nav.Link as={Link} to="/#pricing" eventKey="pricing">Pricing</Nav.Link>
                        <Nav.Link as={Link} to="/#faq" eventKey="faq">FAQ</Nav.Link>
                        <Nav.Link as={NavLink} to="/login" eventKey="login">Log in</Nav.Link>
                        <Nav.Link as={Link} to="/register" eventKey="register" className="nav-cta ms-lg-2 mt-2 mt-lg-0">
                            <span className="btn btn-primary btn-sm w-100">
                                Get started <i className="bi bi-arrow-right" aria-hidden="true" />
                            </span>
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;
