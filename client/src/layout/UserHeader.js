import { useSelector } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import { Container, Dropdown, Nav, Navbar } from "react-bootstrap";
import { BrandLogo, getInitials, useScrolled } from "../components/ui";
import { ROLE_LABELS, usePermission } from "../rbac/userPermissions";

function CreditPill({ user, canManagePayments }) {
    const isSubscribed = user?.subscription?.status === 'active';
    const credits = user?.credits ?? 0;
    const label = isSubscribed ? 'Unlimited plan' : `${credits} credit${credits === 1 ? '' : 's'}`;
    const className = `credit-pill ${!isSubscribed && credits < 1 ? 'is-empty' : ''}`;
    const content = (
        <>
            <i className={`bi ${isSubscribed ? 'bi-infinity' : 'bi-coin'}`} aria-hidden="true" />
            {label}
        </>
    );

    if (!canManagePayments) return null;
    return (
        <Link to="/manage-payments" className={className} title="Billing & credits">
            {content}
        </Link>
    );
}

function UserHeader() {
    const user = useSelector((state) => state.userDetails);
    const permission = usePermission();
    const scrolled = useScrolled();
    const email = user?.email || user?.username;

    return (
        <Navbar expand="lg" sticky="top" collapseOnSelect className={`app-navbar ${scrolled ? 'is-scrolled' : ''}`}>
            <Container>
                <Navbar.Brand as={Link} to="/dashboard" aria-label="Affiliate++ dashboard">
                    <BrandLogo />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="app-nav" />
                <Navbar.Collapse id="app-nav">
                    <Nav className="app-nav me-auto ms-lg-4 gap-lg-1">
                        <Nav.Link as={NavLink} to="/dashboard" eventKey="links">
                            <i className="bi bi-link-45deg" aria-hidden="true" /> Links
                        </Nav.Link>
                        {permission.canManageTeam && (
                            <Nav.Link as={NavLink} to="/users" eventKey="team">
                                <i className="bi bi-people" aria-hidden="true" /> Team
                            </Nav.Link>
                        )}
                        {permission.canManagePayments && (
                            <Nav.Link as={NavLink} to="/manage-payments" eventKey="billing">
                                <i className="bi bi-credit-card" aria-hidden="true" /> Billing
                            </Nav.Link>
                        )}
                    </Nav>
                    <div className="d-flex align-items-center justify-content-between justify-content-lg-end gap-2 mt-2 mt-lg-0 pt-2 pt-lg-0 border-top border-lg-0">
                        <CreditPill user={user} canManagePayments={permission.canManagePayments} />
                        <Dropdown align="end">
                            <Dropdown.Toggle as="button" className="user-menu-toggle" id="user-menu">
                                <span className="avatar avatar-sm">{getInitials(user?.name)}</span>
                                <span>{user?.name}</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="user-menu">
                                <div className="user-menu-header">
                                    <span className="avatar">{getInitials(user?.name)}</span>
                                    <div className="min-w-0">
                                        <div className="user-menu-name">{user?.name}</div>
                                        {email && <div className="user-menu-email">{email}</div>}
                                        <span className="chip chip-brand mt-1">{ROLE_LABELS[user?.role] || user?.role}</span>
                                    </div>
                                </div>
                                <Dropdown.Divider />
                                <Dropdown.Item as={Link} to="/dashboard">
                                    <i className="bi bi-link-45deg" aria-hidden="true" /> My links
                                </Dropdown.Item>
                                {permission.canManagePayments && (
                                    <Dropdown.Item as={Link} to="/manage-payments">
                                        <i className="bi bi-credit-card" aria-hidden="true" /> Billing &amp; credits
                                    </Dropdown.Item>
                                )}
                                {permission.canManageTeam && (
                                    <Dropdown.Item as={Link} to="/users">
                                        <i className="bi bi-people" aria-hidden="true" /> Team members
                                    </Dropdown.Item>
                                )}
                                <Dropdown.Divider />
                                <Dropdown.Item as={Link} to="/logout" className="text-danger">
                                    <i className="bi bi-box-arrow-right" aria-hidden="true" /> Log out
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default UserHeader;
