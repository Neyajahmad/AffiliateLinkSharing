function UserFooter() {
    return (
        <footer className="app-footer">
            <div className="container d-flex flex-wrap justify-content-between gap-2">
                <span>&copy; {new Date().getFullYear()} Affiliate++</span>
                <span>Trackable affiliate links &amp; click analytics</span>
            </div>
        </footer>
    );
}

export default UserFooter;
