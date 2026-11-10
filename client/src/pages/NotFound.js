import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui";

function NotFound() {
    return (
        <div className="status-page">
            <EmptyState
                icon="bi-signpost-split"
                title="Page not found"
                text="The page you're looking for doesn't exist or has moved."
                action={<Link to="/" className="btn btn-primary">Go to home</Link>}
            />
        </div>
    );
}

export default NotFound;
