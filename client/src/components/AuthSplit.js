import { BrandLogo } from './ui';

const DEFAULT_POINTS = [
    { icon: 'bi-link-45deg', text: 'Create trackable links for any affiliate URL' },
    { icon: 'bi-bar-chart-line', text: 'See clicks by city, browser and device' },
    { icon: 'bi-people', text: 'Share read-only access with your team' }
];

const SPARK = [30, 45, 38, 60, 52, 72, 66, 90];

// Two-column auth layout: dark brand panel on the left (desktop only), form on the right.
function AuthSplit({ heading, text, points = DEFAULT_POINTS, children }) {
    return (
        <div className="auth-page">
            <aside className="auth-aside dark-stage">
                <div className="stage-grid" />
                <div className="glow glow-violet" />
                <div className="glow glow-teal" />
                <div className="auth-aside-inner">
                    <BrandLogo light />
                    <h2>{heading}</h2>
                    <p>{text}</p>
                    <ul className="auth-points">
                        {points.map((point) => (
                            <li key={point.text}>
                                <i className={`bi ${point.icon}`} aria-hidden="true" />
                                <span>{point.text}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="auth-preview" aria-hidden="true">
                        <div>
                            <small>Clicks this week</small>
                            <strong>1,284</strong> <span className="trend"><i className="bi bi-arrow-up-right" /> 24%</span>
                        </div>
                        <div className="auth-spark">
                            {SPARK.map((height, index) => (
                                <span key={index} style={{ height: `${height}%`, '--i': index }} />
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
            <div className="auth-main">
                <div className="auth-card">{children}</div>
            </div>
        </div>
    );
}

export default AuthSplit;
