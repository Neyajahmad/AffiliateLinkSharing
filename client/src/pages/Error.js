import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui";

function Error() {
    return (
        <div className="status-page">
            <EmptyState
                icon="bi-exclamation-octagon"
                title="Something went wrong"
                text="We couldn't complete that request. Please try again in a moment."
                action={<Link to="/" className="btn btn-primary">Go to home</Link>}
            />
        </div>
    );
}

export default Error;
