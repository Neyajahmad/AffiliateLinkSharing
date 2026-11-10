import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";
import { CREDIT_PACKS, PLAN_IDS } from "../../config/payments";
import { serverEndpoint } from "../../config/config";
import { SET_USER } from "../../redux/user/actions";
import { Alert, ButtonSpinner, CountUp, PageHeader, Reveal, Toast, getErrorMessage } from "../../components/ui";

const PLANS = [
    {
        key: 'UNLIMITED_MONTHLY',
        name: 'Unlimited monthly',
        price: '₹199',
        period: '/ month',
        desc: 'Unlimited links, billed every month.',
        features: ['Unlimited links', 'Full click analytics', 'Team roles', 'Auto-renews, cancel anytime'],
        cta: 'Choose monthly'
    },
    {
        key: 'UNLIMITED_YEARLY',
        name: 'Unlimited yearly',
        price: '₹1990',
        period: '/ year',
        desc: 'Best value: two months free compared to monthly.',
        features: ['Unlimited links', 'Full click analytics', 'Team roles', 'Auto-renews, cancel anytime'],
        cta: 'Choose yearly',
        featured: true
    }
];

const openRazorpay = (options) => {
    if (!window.Razorpay) {
        throw new Error('Payment window could not be loaded. Check your connection and try again.');
    }
    const rzp = new window.Razorpay(options);
    rzp.open();
};

function PurchaseCredit() {
    const dispatch = useDispatch();
    const userDetails = useSelector((state) => state.userDetails);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pending, setPending] = useState(null);

    const handleBuyCredits = async (credits) => {
        setShowModal(false);
        setError('');
        setMessage('');
        setPending(`credits-${credits}`);
        try {
            const { data } = await axios.post(`${serverEndpoint}/payments/create-order`, {
                credits
            }, { withCredentials: true });

            openRazorpay({
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: data.order.currency,
                name: 'Affiliate++',
                description: `${credits} credits pack`,
                order_id: data.order.id,
                prefill: { name: userDetails?.name, email: userDetails?.email },
                handler: async (response) => {
                    try {
                        const verified = await axios.post(`${serverEndpoint}/payments/verify-order`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            credits
                        }, { withCredentials: true });

                        dispatch({ type: SET_USER, payload: verified.data.user });
                        setMessage(`${credits} credits added to your balance.`);
                    } catch (verifyError) {
                        console.error(verifyError);
                        setError('We received your payment but couldn\'t verify it. Please contact support.');
                    }
                },
                modal: { ondismiss: () => setPending(null) },
                theme: { color: '#4f46e5' }
            });
        } catch (purchaseError) {
            console.error(purchaseError);
            setError(getErrorMessage(purchaseError, purchaseError.message || 'Unable to start the purchase. Please try again.'));
        } finally {
            setPending(null);
        }
    };

    const handleSubscribe = async (planKey) => {
        setError('');
        setMessage('');
        setPending(planKey);
        try {
            const { data } = await axios.post(`${serverEndpoint}/payments/create-subscription`, {
                plan_name: planKey
            }, { withCredentials: true });

            const plan = PLAN_IDS[planKey];
            openRazorpay({
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                name: plan.planName,
                description: plan.description,
                subscription_id: data.subscription.id,
                prefill: { name: userDetails?.name, email: userDetails?.email },
                handler: async (response) => {
                    try {
                        const verified = await axios.post(`${serverEndpoint}/payments/verify-subscription`, {
                            subscription_id: response.razorpay_subscription_id
                        }, { withCredentials: true });

                        dispatch({ type: SET_USER, payload: verified.data.user });
                        setMessage('Subscription started. It can take a minute to show as active.');
                    } catch (verifyError) {
                        setError('We couldn\'t activate your subscription. Please contact support.');
                    }
                },
                theme: { color: '#4f46e5' }
            });
        } catch (subscribeError) {
            console.error(subscribeError);
            setError(getErrorMessage(subscribeError, subscribeError.message || 'Failed to create the subscription. Please try again.'));
        } finally {
            setPending(null);
        }
    };

    const subscriptionPending = userDetails?.subscription?.status && userDetails.subscription.status !== 'active'
        && !['cancelled', 'completed'].includes(userDetails.subscription.status);

    return (
        <div className="container page">
            <PageHeader
                title="Billing & credits"
                subtitle="Buy credits as you need them, or go unlimited with a subscription."
            />

            {error && <Alert>{error}</Alert>}
            <Toast message={message} onClose={() => setMessage('')} />
            {subscriptionPending && (
                <Alert variant="info">
                    Your subscription is being set up (status: {userDetails.subscription.status}). This page
                    will switch to your plan summary once Razorpay confirms it.
                </Alert>
            )}

            <div className="balance-card dark-stage">
                <div className="stage-grid" />
                <div className="glow glow-violet" />
                <div className="glow glow-teal" />
                <div>
                    <p className="stat-label mb-1">Current balance</p>
                    <div className="balance-value">
                        <CountUp value={userDetails?.credits} /> <span className="plan-period">credits</span>
                    </div>
                    <p className="stat-hint mb-0">Each new link uses 1 credit. Credits never expire.</p>
                </div>
                <button type="button" className="btn btn-white" onClick={() => setShowModal(true)} disabled={Boolean(pending)}>
                    {pending?.startsWith('credits') ? <><ButtonSpinner /> Opening checkout…</> : <><i className="bi bi-plus-lg" aria-hidden="true" /> Buy credits</>}
                </button>
            </div>

            <h2 className="h5 fw-bold mb-1">Go unlimited</h2>
            <p className="text-muted mb-4">Create as many links as you like. Billed through Razorpay, cancel anytime.</p>

            <div className="row g-4">
                {PLANS.map((plan, index) => (
                    <Reveal className="col-md-6" key={plan.key} delay={index * 100}>
                        <div className={`surface plan-card ${plan.featured ? 'is-featured' : ''}`}>
                            {plan.featured && <span className="plan-badge">Best value</span>}
                            <p className="plan-name">{plan.name}</p>
                            <div>
                                <span className="plan-price">{plan.price}</span>{' '}
                                <span className="plan-period">{plan.period}</span>
                            </div>
                            <p className="plan-desc">{plan.desc}</p>
                            <ul className="plan-features">
                                {plan.features.map((item) => (
                                    <li key={item}><i className="bi bi-check2-circle" aria-hidden="true" /> {item}</li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                className={`btn w-100 ${plan.featured ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => handleSubscribe(plan.key)}
                                disabled={Boolean(pending) || subscriptionPending}
                            >
                                {pending === plan.key ? <><ButtonSpinner /> Opening checkout…</> : plan.cta}
                            </button>
                        </div>
                    </Reveal>
                ))}
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <div>
                        <Modal.Title>Buy credits</Modal.Title>
                        <p className="modal-subtitle">1 credit = 1 link. Pay securely with Razorpay.</p>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <div className="pack-grid">
                        {CREDIT_PACKS.map((credits) => (
                            <button
                                key={credits}
                                type="button"
                                className="pack-option"
                                onClick={() => handleBuyCredits(credits)}
                            >
                                <span className="pack-credits">{credits} credits</span>
                                <span className="pack-price">₹{credits}</span>
                            </button>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default PurchaseCredit;
