import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DataGrid } from '@mui/x-data-grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Bar } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
} from 'chart.js';
import { serverEndpoint } from "../../config/config";
import {
    Alert, CountUp, EmptyState, PageHeader, StatCard,
    dataGridSx, formatDate, formatNumber, getErrorMessage
} from "../../components/ui";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);
ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.color = '#64748b';

// Single-series charts: one brand hue, no legend (the card title names the series).
const SERIES_COLOR = '#5b46ea';
const SERIES_HOVER = '#4c37cf';
const CHART_ANIMATION = { duration: 900, easing: 'easeOutQuart' };
const GRID_COLOR = '#f1f5f9';
const DAY_MS = 24 * 60 * 60 * 1000;

const RANGES = [
    { key: '7d', label: '7 days', days: 7 },
    { key: '30d', label: '30 days', days: 30 },
    { key: '90d', label: '90 days', days: 90 },
    { key: 'all', label: 'All time', days: null },
];

const startOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const endOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
};

const dayKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const prettyUrl = (value) => {
    try {
        const url = new URL(value);
        return `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`;
    } catch {
        return value;
    }
};

// Clicks per day (or per month for long ranges), with empty buckets filled in.
const buildTimeSeries = (clicks, from, to) => {
    if (!clicks.length) return { labels: [], values: [], unit: 'day' };

    const times = clicks.map((click) => new Date(click.clickedAt).getTime());
    const start = startOfDay(from || Math.min(...times));
    const end = startOfDay(to || Date.now());
    const spanDays = Math.round((end - start) / DAY_MS) + 1;
    const byMonth = spanDays > 92;

    const counts = {};
    times.forEach((time) => {
        const key = byMonth ? monthKey(new Date(time)) : dayKey(new Date(time));
        counts[key] = (counts[key] || 0) + 1;
    });

    const labels = [];
    const values = [];
    const cursor = new Date(start);
    if (byMonth) cursor.setDate(1);
    while (cursor <= end) {
        const key = byMonth ? monthKey(cursor) : dayKey(cursor);
        labels.push(new Intl.DateTimeFormat('en-US', byMonth
            ? { month: 'short', year: '2-digit' }
            : { month: 'short', day: 'numeric' }).format(cursor));
        values.push(counts[key] || 0);
        if (byMonth) cursor.setMonth(cursor.getMonth() + 1);
        else cursor.setDate(cursor.getDate() + 1);
    }
    return { labels, values, unit: byMonth ? 'month' : 'day' };
};

// Top N categories by count; the remainder is folded into "Other".
const topCounts = (clicks, getLabel, limit = 7) => {
    const counts = {};
    clicks.forEach((click) => {
        const label = getLabel(click) || 'Unknown';
        counts[label] = (counts[label] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length <= limit + 1) return sorted;
    const head = sorted.slice(0, limit);
    const otherTotal = sorted.slice(limit).reduce((sum, [, count]) => sum + count, 0);
    return [...head, ['Other', otherTotal]];
};

const locationLabel = (click) => {
    if (click.city && click.country) return `${click.city}, ${click.country}`;
    return click.city || click.country || 'Unknown';
};

const tooltipStyle = {
    backgroundColor: '#0f172a',
    padding: 10,
    cornerRadius: 8,
    displayColors: false,
    titleFont: { weight: '600' },
};

function ColumnChart({ labels, values }) {
    const data = {
        labels,
        datasets: [{
            data: values,
            backgroundColor: SERIES_COLOR,
            hoverBackgroundColor: SERIES_HOVER,
            borderRadius: { topLeft: 4, topRight: 4 },
            borderSkipped: 'start',
            maxBarThickness: 28,
            categoryPercentage: 0.85,
            barPercentage: 0.9,
        }]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: CHART_ANIMATION,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                ...tooltipStyle,
                callbacks: {
                    label: (context) => `${formatNumber(context.parsed.y)} click${context.parsed.y === 1 ? '' : 's'}`,
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { color: '#e2e8f0' },
                ticks: { maxRotation: 0, autoSkipPadding: 16 }
            },
            y: {
                beginAtZero: true,
                grid: { color: GRID_COLOR },
                border: { display: false },
                ticks: { precision: 0, padding: 8 }
            }
        }
    };
    return <Bar data={data} options={options} aria-label="Clicks over time" role="img" />;
}

function RankedBarChart({ entries, total, label }) {
    const data = {
        labels: entries.map(([name]) => name),
        datasets: [{
            data: entries.map(([, count]) => count),
            backgroundColor: SERIES_COLOR,
            hoverBackgroundColor: SERIES_HOVER,
            borderRadius: { topRight: 4, bottomRight: 4 },
            borderSkipped: 'start',
            maxBarThickness: 18,
            categoryPercentage: 0.8,
            barPercentage: 0.9,
        }]
    };
    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: CHART_ANIMATION,
        plugins: {
            legend: { display: false },
            tooltip: {
                ...tooltipStyle,
                callbacks: {
                    label: (context) => {
                        const count = context.parsed.x;
                        const share = total ? Math.round((count / total) * 100) : 0;
                        return `${formatNumber(count)} click${count === 1 ? '' : 's'} (${share}%)`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: GRID_COLOR },
                border: { display: false },
                ticks: { precision: 0 }
            },
            y: {
                grid: { display: false },
                border: { color: '#e2e8f0' },
                ticks: {
                    color: '#334155',
                    callback(value) {
                        const text = this.getLabelForValue(value);
                        return text.length > 22 ? `${text.slice(0, 21)}…` : text;
                    }
                }
            }
        }
    };
    return <Bar data={data} options={options} aria-label={label} role="img" />;
}

function ChartCard({ title, subtitle, children, isEmpty, small }) {
    return (
        <div className="surface h-100">
            <div className="surface-header">
                <div>
                    <h2 className="surface-title">{title}</h2>
                    {subtitle && <p className="surface-subtitle">{subtitle}</p>}
                </div>
            </div>
            <div className="surface-body">
                <div className={`chart-box ${small ? 'chart-box-sm' : ''}`}>
                    {isEmpty ? <div className="chart-empty">No clicks in this period</div> : children}
                </div>
            </div>
        </div>
    );
}

function AnalyticsDashboard() {
    const { id } = useParams();
    const [link, setLink] = useState(null);
    const [linkError, setLinkError] = useState('');
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rangeKey, setRangeKey] = useState('30d');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [copied, setCopied] = useState(false);
    const isMobile = useMediaQuery('(max-width: 767.98px)');

    // Resolve the active filter into concrete from/to timestamps.
    const range = useMemo(() => {
        if (rangeKey === 'custom') {
            if (!fromDate && !toDate) return { from: null, to: null };
            return {
                from: startOfDay(fromDate || new Date(0)),
                to: endOfDay(toDate || new Date())
            };
        }
        const preset = RANGES.find((item) => item.key === rangeKey);
        if (!preset?.days) return { from: null, to: null };
        const to = endOfDay(new Date());
        const from = startOfDay(new Date(Date.now() - (preset.days - 1) * DAY_MS));
        return { from, to };
    }, [rangeKey, fromDate, toDate]);

    const fromIso = range.from ? range.from.toISOString() : '';
    const toIso = range.to ? range.to.toISOString() : '';

    useEffect(() => {
        const fetchLink = async () => {
            try {
                const response = await axios.get(`${serverEndpoint}/links/${id}`, { withCredentials: true });
                setLink(response.data.data);
            } catch (err) {
                setLinkError(getErrorMessage(err, 'This link could not be found.'));
            }
        };
        fetchLink();
    }, [id]);

    useEffect(() => {
        let cancelled = false;
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${serverEndpoint}/links/analytics`, {
                    params: { linkId: id, from: fromIso || undefined, to: toIso || undefined },
                    withCredentials: true
                });
                if (!cancelled) {
                    setClicks(response.data);
                    setError('');
                }
            } catch (err) {
                if (!cancelled) setError(getErrorMessage(err, 'We couldn\'t load analytics for this link.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchAnalytics();
        return () => { cancelled = true; };
    }, [id, fromIso, toIso]);

    const timeSeries = useMemo(() => buildTimeSeries(clicks, range.from, range.to), [clicks, range]);
    const topLocations = useMemo(() => topCounts(clicks, locationLabel), [clicks]);
    const topBrowsers = useMemo(() => topCounts(clicks, (click) => click.browser, 5), [clicks]);
    const devices = useMemo(() => topCounts(clicks, (click) => click.deviceType, 3), [clicks]);

    const totalClicks = clicks.length;
    const uniqueVisitors = useMemo(() => new Set(clicks.map((click) => click.ip).filter(Boolean)).size, [clicks]);
    const mobileShare = totalClicks
        ? Math.round((clicks.filter((click) => click.deviceType === 'Mobile').length / totalClicks) * 100)
        : 0;
    const topLocation = topLocations[0]?.[0] && topLocations[0][0] !== 'Other' ? topLocations[0][0] : '—';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`${serverEndpoint}/links/r/${id}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // Clipboard not available; ignore.
        }
    };

    const rangeDescription = rangeKey === 'custom'
        ? (range.from ? `${formatDate(range.from)} – ${formatDate(range.to)}` : 'All time')
        : RANGES.find((item) => item.key === rangeKey)?.key === 'all'
            ? 'All time'
            : `Last ${RANGES.find((item) => item.key === rangeKey)?.label}`;

    const columns = [
        {
            field: 'clickedAt', headerName: 'Time', flex: 1.2, minWidth: 170,
            valueFormatter: (value) => formatDate(value, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        },
        {
            field: 'location', headerName: 'Location', flex: 1.4, minWidth: 180, sortable: false,
            valueGetter: (value, row) => [row.city, row.region, row.country].filter(Boolean).join(', ') || 'Unknown'
        },
        {
            field: 'deviceType', headerName: 'Device', flex: 0.8, minWidth: 110,
            renderCell: ({ value }) => (
                <span className="chip chip-neutral">
                    <i className={`bi ${value === 'Mobile' ? 'bi-phone' : 'bi-laptop'}`} aria-hidden="true" /> {value || 'Unknown'}
                </span>
            )
        },
        { field: 'browser', headerName: 'Browser', flex: 0.8, minWidth: 110 },
        { field: 'isp', headerName: 'Network (ISP)', flex: 1.2, minWidth: 160 },
        {
            field: 'referrer', headerName: 'Referrer', flex: 1.2, minWidth: 150,
            valueFormatter: (value) => (value ? prettyUrl(value) : 'Direct')
        },
        { field: 'ip', headerName: 'IP address', flex: 1, minWidth: 130 },
    ];

    if (linkError) {
        return (
            <div className="container page">
                <div className="surface">
                    <EmptyState
                        icon="bi-question-circle"
                        title="Link not available"
                        text={linkError}
                        action={<Link to="/dashboard" className="btn btn-primary">Back to links</Link>}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="container page">
            <PageHeader
                eyebrow={(
                    <Link to="/dashboard" className="page-eyebrow">
                        <i className="bi bi-arrow-left" aria-hidden="true" /> All links
                    </Link>
                )}
                title={(
                    <span className="link-summary">
                        {link?.thumbnail && <img src={link.thumbnail} alt="" className="thumb" />}
                        <span className="min-w-0">{link ? link.campaignTitle : 'Link analytics'}</span>
                    </span>
                )}
                subtitle={link && (
                    <>
                        <span className="chip chip-neutral me-2">{link.category}</span>
                        <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="cell-link d-inline-flex">
                            {prettyUrl(link.originalUrl)} <i className="bi bi-box-arrow-up-right small" aria-hidden="true" />
                        </a>
                    </>
                )}
                actions={(
                    <button type="button" className={`btn btn-outline-primary copy-btn ${copied ? 'is-copied' : ''}`} onClick={handleCopy}>
                        <i className={`bi ${copied ? 'bi-check2' : 'bi-copy'}`} aria-hidden="true" />
                        {copied ? 'Copied' : 'Copy tracking link'}
                    </button>
                )}
            />

            <div className="filter-bar">
                <div className="segmented" role="group" aria-label="Date range">
                    {RANGES.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            className={`range-btn ${rangeKey === item.key ? 'is-active' : ''}`}
                            aria-pressed={rangeKey === item.key}
                            onClick={() => {
                                setRangeKey(item.key);
                                setFromDate(null);
                                setToDate(null);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="date-range">
                    <DatePicker
                        selected={fromDate}
                        onChange={(date) => { setFromDate(date); setRangeKey('custom'); }}
                        selectsStart
                        startDate={fromDate}
                        endDate={toDate}
                        maxDate={toDate || new Date()}
                        className={`form-control ${rangeKey === 'custom' ? 'border-primary' : ''}`}
                        placeholderText="From date"
                        dateFormat="MMM d, yyyy"
                    />
                    <span className="text-muted small">to</span>
                    <DatePicker
                        selected={toDate}
                        onChange={(date) => { setToDate(date); setRangeKey('custom'); }}
                        selectsEnd
                        startDate={fromDate}
                        endDate={toDate}
                        minDate={fromDate}
                        maxDate={new Date()}
                        className={`form-control ${rangeKey === 'custom' ? 'border-primary' : ''}`}
                        placeholderText="To date"
                        dateFormat="MMM d, yyyy"
                    />
                </div>
            </div>

            {error && <Alert>{error}</Alert>}

            <div className="row g-3 mb-4 stat-row-compact">
                <div className="col-6 col-xl-3">
                    <StatCard icon="bi-cursor" tone="brand" label="Total clicks" value={loading ? '—' : <CountUp value={totalClicks} />} hint={rangeDescription} />
                </div>
                <div className="col-6 col-xl-3">
                    <StatCard icon="bi-person" tone="teal" label="Unique visitors" value={loading ? '—' : <CountUp value={uniqueVisitors} />} hint="Distinct IP addresses" />
                </div>
                <div className="col-6 col-xl-3">
                    <StatCard
                        icon="bi-geo-alt"
                        tone="amber"
                        label="Top location"
                        value={loading ? '—' : topLocation.split(', ')[0]}
                        hint={topLocation !== '—'
                            ? [topLocation.split(', ').slice(1).join(', '), `${formatNumber(topLocations[0][1])} clicks`].filter(Boolean).join(' · ')
                            : 'No data yet'}
                    />
                </div>
                <div className="col-6 col-xl-3">
                    <StatCard icon="bi-phone" tone="rose" label="Mobile share" value={loading ? '—' : <CountUp value={mobileShare} suffix="%" />} hint="Of clicks came from phones" />
                </div>
            </div>

            {loading ? (
                <div className="surface d-flex align-items-center justify-content-center" style={{ minHeight: 320 }}>
                    <div className="spinner-border spinner-brand" role="status" aria-label="Loading analytics" />
                </div>
            ) : totalClicks === 0 ? (
                <div className="surface">
                    <EmptyState
                        icon="bi-bar-chart-line"
                        title="No clicks in this period"
                        text="Share your tracking link to start collecting clicks, or choose a longer date range."
                        action={(
                            <button type="button" className="btn btn-primary" onClick={handleCopy}>
                                <i className={`bi ${copied ? 'bi-check2' : 'bi-copy'}`} aria-hidden="true" />
                                {copied ? 'Copied' : 'Copy tracking link'}
                            </button>
                        )}
                    />
                </div>
            ) : (
                <>
                    <div className="mb-3">
                        <ChartCard
                            title={timeSeries.unit === 'month' ? 'Clicks per month' : 'Clicks per day'}
                            subtitle={rangeDescription}
                        >
                            <ColumnChart labels={timeSeries.labels} values={timeSeries.values} />
                        </ChartCard>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-lg-6">
                            <ChartCard title="Top locations" subtitle="Clicks by city" isEmpty={!topLocations.length}>
                                <RankedBarChart entries={topLocations} total={totalClicks} label="Clicks by location" />
                            </ChartCard>
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <ChartCard title="Browsers" subtitle="Clicks by browser" isEmpty={!topBrowsers.length} small>
                                <RankedBarChart entries={topBrowsers} total={totalClicks} label="Clicks by browser" />
                            </ChartCard>
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <ChartCard title="Devices" subtitle="Mobile vs desktop" isEmpty={!devices.length} small>
                                <RankedBarChart entries={devices} total={totalClicks} label="Clicks by device" />
                            </ChartCard>
                        </div>
                    </div>

                    <div className="surface grid-surface">
                        <div className="surface-header">
                            <div>
                                <h2 className="surface-title">Click log</h2>
                                <p className="surface-subtitle">Every click in this period, newest first. Export with the toolbar.</p>
                            </div>
                        </div>
                        <DataGrid
                            getRowId={(row) => row._id}
                            rows={clicks}
                            columns={columns}
                            autoHeight
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                            showToolbar
                            columnVisibilityModel={isMobile
                                ? { isp: false, referrer: false, ip: false, browser: false, deviceType: false }
                                : {}}
                            sx={dataGridSx}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default AnalyticsDashboard;
