import { Link } from "react-router-dom";
import { EmptyState } from "./ui";

function UnauthorizedAccess() {
    return (
        <div className="status-page">
            <EmptyState
                icon="bi-shield-lock"
                title="You don't have access to this page"
                text="Your role doesn't include permission for this action. Ask your workspace admin if you need access."
                action={<Link to="/dashboard" className="btn btn-primary">Back to links</Link>}
            />
        </div>
    );
}

export default UnauthorizedAccess;
