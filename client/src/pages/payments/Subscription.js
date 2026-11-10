import axios from "axios";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Modal } from "react-bootstrap";
import { serverEndpoint } from "../../config/config";
import { PLAN_IDS } from "../../config/payments";
import { Alert, ButtonSpinner, PageHeader, Toast, formatDate, getErrorMessage } from "../../components/ui";

const planNameFor = (planId) =>
    Object.values(PLAN_IDS).find((plan) => plan.id === planId)?.planName || 'Unlimited plan';

function Subscription() {
    const userDetails = useSelector((state) => state.userDetails);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const subscription = userDetails.subscription || {};

    const handleCancel = async () => {
        setCancelling(true);
        setError('');
        try {
            await axios.post(`${serverEndpoint}/payments/cancel-subscription`, {
                subscription_id: subscription.id
            }, { withCredentials: true });
            setConfirming(false);
            setMessage('Your subscription has been cancelled. It can take up to 5 minutes for the status to update.');
        } catch (cancelError) {
            console.log(cancelError);
            setError(getErrorMessage(cancelError, 'Unable to cancel the subscription. Please try again.'));
        } finally {
            setCancelling(false);
        }
    };

    const details = [
        { label: 'Started', value: formatDate(subscription.start) },
        { label: 'Ends', value: formatDate(subscription.end) },
        { label: 'Last payment', value: formatDate(subscription.lastBillDate) },
        { label: 'Next payment', value: formatDate(subscription.nextBillDate) },
        { label: 'Payments made', value: subscription.paymentsMade ?? '—' },
        { label: 'Payments remaining', value: subscription.paymentsRemaining ?? '—' },
    ];

    return (
        <div className="container page">
            <PageHeader
                title="Billing & credits"
                subtitle="You're on an unlimited plan. Create as many links as you like."
            />

            {error && <Alert>{error}</Alert>}
            <Toast message={message} onClose={() => setMessage('')} />

            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="surface">
                        <div className="surface-header">
                            <div className="d-flex align-items-center gap-3">
                                <span className="stat-icon" aria-hidden="true"><i className="bi bi-infinity" /></span>
                                <div>
                                    <h2 className="surface-title">{planNameFor(subscription.planId)}</h2>
                                    <p className="surface-subtitle">Unlimited links · billed through Razorpay</p>
                                </div>
                            </div>
                            <span className="chip chip-success chip-dot text-capitalize">{subscription.status}</span>
                        </div>
                        <div className="surface-body">
                            <div className="detail-grid">
                                {details.map((item) => (
                                    <div className="detail-item" key={item.label}>
                                        <div className="detail-label">{item.label}</div>
                                        <div className="detail-value">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="surface-header border-0 border-top">
                            <p className="text-muted small mb-0">
                                Cancelling stops future payments. You can subscribe again at any time.
                            </p>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => setConfirming(true)}
                                disabled={Boolean(message)}
                            >
                                Cancel subscription
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={confirming} onHide={() => !cancelling && setConfirming(false)} centered>
                <Modal.Header closeButton={!cancelling}>
                    <Modal.Title>Cancel your subscription?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted mb-0">
                        You won't be charged again. Once it's cancelled, creating new links will use credits.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-light" onClick={() => setConfirming(false)} disabled={cancelling}>
                        Keep subscription
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                        {cancelling ? <><ButtonSpinner /> Cancelling…</> : 'Cancel subscription'}
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Subscription;
