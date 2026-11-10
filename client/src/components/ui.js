import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Motion helpers
// ---------------------------------------------------------------------------

const prefersReducedMotion = () =>
    typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fades/slides its children in the first time they scroll into view.
export function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;
        if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
            setVisible(true);
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
            style={{ '--reveal-delay': `${delay}ms`, ...style }}
            {...rest}
        >
            {children}
        </Tag>
    );
}

// Animates a number from 0 to `value` (eased), e.g. for stat cards.
export function useCountUp(value, duration = 900) {
    const target = Number(value) || 0;
    const [display, setDisplay] = useState(prefersReducedMotion() ? target : 0);
    const fromRef = useRef(0);

    useEffect(() => {
        if (prefersReducedMotion()) {
            setDisplay(target);
            return undefined;
        }
        const from = fromRef.current;
        const start = performance.now();
        let frame;
        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (target - from) * eased));
            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            } else {
                fromRef.current = target;
            }
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return display;
}

export function CountUp({ value, format = formatNumber, suffix = '' }) {
    const display = useCountUp(value);
    return <>{format(display)}{suffix}</>;
}

// True once the page has scrolled past `threshold` px (navbar shadows etc).
export function useScrolled(threshold = 8) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > threshold);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);
    return scrolled;
}

// Scrolls to the top on route changes (keeps #hash navigation working).
export function ScrollToTop() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (hash) {
            const target = document.getElementById(hash.slice(1));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }
        window.scrollTo(0, 0);
    }, [pathname, hash]);
    return null;
}

// ---------------------------------------------------------------------------
// Presentational building blocks
// ---------------------------------------------------------------------------

export function BrandLogo({ light = false }) {
    return (
        <span className={`brand ${light ? 'brand-light' : ''}`}>
            <span className="brand-mark" aria-hidden="true">
                <i className="bi bi-link-45deg" />
            </span>
            <span>
                Affiliate<span className="brand-plus">++</span>
            </span>
        </span>
    );
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
    return (
        <div className="page-header">
            <div className="min-w-0">
                {eyebrow}
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
        </div>
    );
}

export function StatCard({ icon, label, value, hint, tone = 'brand' }) {
    return (
        <div className={`surface stat-card tone-${tone}`}>
            <span className="stat-icon" aria-hidden="true">
                <i className={`bi ${icon}`} />
            </span>
            <div className="min-w-0 flex-grow-1">
                <p className="stat-label">{label}</p>
                <p className="stat-value" title={typeof value === 'string' ? value : undefined}>{value}</p>
                {hint && <p className="stat-hint">{hint}</p>}
            </div>
        </div>
    );
}

export function EmptyState({ icon = 'bi-inbox', title, text, action }) {
    return (
        <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
                <i className={`bi ${icon}`} />
            </span>
            <h2 className="empty-state-title">{title}</h2>
            {text && <p className="empty-state-text">{text}</p>}
            {action}
        </div>
    );
}

export function Alert({ variant = 'danger', children, className = '' }) {
    const icons = {
        danger: 'bi-exclamation-circle-fill',
        success: 'bi-check-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    return (
        <div className={`alert alert-${variant} ${className}`} role={variant === 'danger' ? 'alert' : 'status'}>
            <i className={`bi ${icons[variant]}`} aria-hidden="true" />
            <div>{children}</div>
        </div>
    );
}

// Floating notification in the corner of the screen.
export function Toast({ message, variant = 'success', onClose }) {
    if (!message) return null;
    return (
        <div className="toast-stack" role="status" aria-live="polite">
            <div className={`app-toast app-toast-${variant}`} key={message}>
                <i className={`bi ${variant === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} aria-hidden="true" />
                <span>{message}</span>
                {onClose && (
                    <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">
                        <i className="bi bi-x-lg" />
                    </button>
                )}
            </div>
        </div>
    );
}

export function FullPageLoader({ label = 'Loading…' }) {
    return (
        <div className="full-page-loader" role="status">
            <span className="loader-mark" aria-hidden="true"><i className="bi bi-link-45deg" /></span>
            <span>{label}</span>
        </div>
    );
}

export function ButtonSpinner() {
    return <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export const getInitials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || '?';

export const formatDate = (isoDateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!isoDateString) return '—';
    const date = new Date(isoDateString);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value || 0);
}

// Pulls the most useful message out of an axios error.
export const getErrorMessage = (error, fallback = 'Something went wrong, please try again.') =>
    error?.response?.data?.message || error?.response?.data?.error || fallback;

// Shared MUI DataGrid styling so every table matches the design system.
export const dataGridSx = {
    border: 0,
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    color: 'var(--ink-800)',
    '--DataGrid-containerBackground': 'var(--ink-50)',
    '--DataGrid-rowBorderColor': 'var(--ink-100)',
    '& .MuiDataGrid-columnHeaders': {
        borderBottom: '1px solid var(--ink-200)'
    },
    '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 600,
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--ink-500)'
    },
    '& .MuiDataGrid-cell': {
        display: 'flex',
        alignItems: 'center'
    },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
        outline: 'none'
    },
    '& .MuiDataGrid-row': {
        transition: 'background-color 0.2s ease'
    },
    '& .MuiDataGrid-row:hover': {
        backgroundColor: 'rgba(108, 92, 246, 0.04)'
    },
    '& .MuiDataGrid-footerContainer': {
        borderTop: '1px solid var(--ink-100)'
    },
    '& .MuiDataGrid-overlayWrapper, & .MuiDataGrid-overlayWrapperInner': {
        minHeight: 340
    }
};
