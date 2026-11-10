import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { serverEndpoint } from '../../config/config';
import { ROLE_LABELS, usePermission } from '../../rbac/userPermissions';
import { SET_USER } from '../../redux/user/actions';
import {
    Alert, ButtonSpinner, CountUp, EmptyState, PageHeader, StatCard, Toast,
    dataGridSx, formatDate, formatNumber, getErrorMessage
} from '../../components/ui';

const EMPTY_FORM = { id: null, campaignTitle: '', originalUrl: '', category: '', thumbnail: '' };

const isValidUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const prettyUrl = (value) => {
    try {
        const url = new URL(value);
        const path = url.pathname === '/' ? '' : url.pathname;
        return `${url.hostname.replace(/^www\./, '')}${path}`;
    } catch {
        return value;
    }
};

const trackingUrl = (linkId) => `${serverEndpoint}/links/r/${linkId}`;

const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // Fallback for browsers that block the async clipboard API.
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
};

function NoLinksOverlay({ searching, canCreate, onCreate }) {
    return (
        <div className="d-flex justify-content-center pt-3">
            {searching ? (
                <EmptyState
                    icon="bi-search"
                    title="No links match your search"
                    text="Try a different campaign title, URL or category."
                />
            ) : (
                <EmptyState
                    icon="bi-link-45deg"
                    title="No links yet"
                    text={canCreate
                        ? 'Create your first trackable link and start seeing where your clicks come from.'
                        : 'Your admin hasn\'t created any links yet.'}
                    action={canCreate && (
                        <button type="button" className="btn btn-primary" onClick={onCreate}>
                            <i className="bi bi-plus-lg" aria-hidden="true" /> Create link
                        </button>
                    )}
                />
            )}
        </div>
    );
}

function LinksDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.userDetails);
    const permission = usePermission();
    const isMobile = useMediaQuery('(max-width: 767.98px)');
    const isTablet = useMediaQuery('(max-width: 991.98px)');
    const isCompact = useMediaQuery('(max-width: 1199.98px)');

    const isSubscribed = user?.subscription?.status === 'active';
    const credits = user?.credits ?? 0;
    const outOfCredits = permission.canCreateLink && !isSubscribed && credits < 1;

    // Table state
    const [links, setLinks] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [notice, setNotice] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [sortModel, setSortModel] = useState([{ field: 'createdAt', sort: 'desc' }]);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const requestId = useRef(0);

    // Add / edit modal state
    const [showForm, setShowForm] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Debounce the search box so we don't hit the API on every keystroke.
    useEffect(() => {
        const next = searchInput.trim();
        if (next === searchQuery) return undefined;
        const timer = setTimeout(() => {
            setSearchQuery(next);
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput, searchQuery]);

    const fetchLinks = useCallback(async () => {
        const currentRequest = ++requestId.current;
        setLoading(true);
        try {
            const response = await axios.get(`${serverEndpoint}/links`, {
                params: {
                    currentPage: paginationModel.page,
                    pageSize: paginationModel.pageSize,
                    searchQuery: searchQuery,
                    sortField: sortModel[0]?.field || 'createdAt',
                    sortOrder: sortModel[0]?.sort || 'desc'
                },
                withCredentials: true
            });
            if (currentRequest !== requestId.current) return;
            setLinks(response.data.links);
            setTotal(response.data.total);
            setPageError('');
        } catch (error) {
            if (currentRequest !== requestId.current) return;
            console.log(error);
            setPageError('We couldn\'t load your links right now. Please refresh the page to try again.');
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    }, [paginationModel, searchQuery, sortModel]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(''), 3500);
        return () => clearTimeout(timer);
    }, [notice]);

    useEffect(() => () => {
        if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    // ----- Add / edit -----
    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
        setFormError('');
        setThumbnailFile(null);
        setPreviewUrl('');
        setIsEdit(false);
        setShowForm(true);
    };

    const openEdit = (row) => {
        setForm({
            id: row._id,
            campaignTitle: row.campaignTitle || '',
            originalUrl: row.originalUrl || '',
            category: row.category || '',
            thumbnail: row.thumbnail || ''
        });
        setFormErrors({});
        setFormError('');
        setThumbnailFile(null);
        setPreviewUrl(row.thumbnail || '');
        setIsEdit(true);
        setShowForm(true);
    };

    const closeForm = () => {
        if (!saving) setShowForm(false);
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleThumbnailChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setFormErrors((prev) => ({ ...prev, thumbnail: 'Please choose an image file' }));
            return;
        }
        setThumbnailFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
    };

    const validate = () => {
        const errors = {};
        if (!form.campaignTitle.trim()) errors.campaignTitle = 'Campaign title is required';
        if (!form.originalUrl.trim()) {
            errors.originalUrl = 'Destination URL is required';
        } else if (!isValidUrl(form.originalUrl.trim())) {
            errors.originalUrl = 'Enter a full URL starting with https://';
        }
        if (!form.category.trim()) errors.category = 'Category is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const uploadToCloudinary = async (file) => {
        const { data } = await axios.post(`${serverEndpoint}/links/generate-upload-signature`, {},
            { withCredentials: true });

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('signature', data.signature);
        uploadData.append('api_key', data.apikey);
        uploadData.append('timestamp', data.timestamp);

        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
            uploadData
        );
        return response.data.secure_url;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;

        setSaving(true);
        setFormError('');
        try {
            const body = {
                campaign_title: form.campaignTitle.trim(),
                original_url: form.originalUrl.trim(),
                category: form.category.trim()
            };

            if (thumbnailFile) {
                try {
                    body.thumbnail = await uploadToCloudinary(thumbnailFile);
                } catch (uploadError) {
                    console.log(uploadError);
                    setFormError('The thumbnail could not be uploaded. Remove it or try a different image.');
                    setSaving(false);
                    return;
                }
            }

            const config = { withCredentials: true };
            if (isEdit) {
                await axios.put(`${serverEndpoint}/links/${form.id}`, body, config);
            } else {
                await axios.post(`${serverEndpoint}/links`, body, config);
                if (!isSubscribed) {
                    dispatch({ type: SET_USER, payload: { ...user, credits: Math.max(0, credits - 1) } });
                }
            }

            setShowForm(false);
            setNotice(isEdit ? 'Link updated.' : 'Link created. Copy it from the table to start sharing.');
            if (!isEdit && paginationModel.page !== 0) {
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
            } else {
                await fetchLinks();
            }
        } catch (error) {
            console.log(error);
            setFormError(getErrorMessage(error, 'We couldn\'t save this link. Please try again.'));
        } finally {
            setSaving(false);
        }
    };

    // ----- Delete -----
    const openDelete = (row) => {
        setDeleteError('');
        setDeleteTarget(row);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError('');
        try {
            await axios.delete(`${serverEndpoint}/links/${deleteTarget._id}`, { withCredentials: true });
            setDeleteTarget(null);
            setNotice('Link deleted.');
            if (links.length === 1 && paginationModel.page > 0) {
                setPaginationModel((prev) => ({ ...prev, page: prev.page - 1 }));
            } else {
                await fetchLinks();
            }
        } catch (error) {
            setDeleteError(getErrorMessage(error, 'We couldn\'t delete this link. Please try again.'));
        } finally {
            setDeleting(false);
        }
    };

    const handleCopy = async (linkId) => {
        await copyText(trackingUrl(linkId));
        setCopiedId(linkId);
        setTimeout(() => setCopiedId((current) => (current === linkId ? null : current)), 1800);
    };

    const categories = [...new Set(links.map((link) => link.category).filter(Boolean))];

    const columns = [
        {
            field: 'campaignTitle',
            headerName: 'Campaign',
            flex: 2,
            minWidth: 240,
            renderCell: ({ row }) => (
                <div className="cell-stack">
                    {row.thumbnail ? (
                        <img src={row.thumbnail} alt="" className="thumb" loading="lazy" />
                    ) : (
                        <span className="thumb thumb-placeholder" aria-hidden="true"><i className="bi bi-image" /></span>
                    )}
                    <div className="min-w-0">
                        <div className="cell-title" title={row.campaignTitle}>{row.campaignTitle}</div>
                        <div className="cell-sub">
                            {isCompact ? prettyUrl(row.originalUrl) : `Created ${formatDate(row.createdAt)}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            field: 'category',
            headerName: 'Category',
            flex: 1,
            minWidth: 130,
            renderCell: ({ value }) => <span className="chip chip-neutral">{value}</span>
        },
        {
            field: 'originalUrl',
            headerName: 'Destination',
            flex: 1.8,
            minWidth: 200,
            sortable: false,
            renderCell: ({ value }) => (
                <a href={value} target="_blank" rel="noopener noreferrer" className="cell-link" title={value}>
                    <span className="text-truncate">{prettyUrl(value)}</span>
                    <i className="bi bi-box-arrow-up-right small" aria-hidden="true" />
                </a>
            )
        },
        {
            field: 'clickCount',
            headerName: 'Clicks',
            type: 'number',
            flex: 0.7,
            minWidth: 90,
            renderCell: ({ value }) => <strong className="tabular w-100 text-end">{formatNumber(value)}</strong>
        },
        {
            field: 'share',
            headerName: 'Tracking link',
            sortable: false,
            flex: 1.1,
            minWidth: 150,
            renderCell: ({ row }) => {
                const copied = copiedId === row._id;
                return (
                    <button
                        type="button"
                        className={`btn btn-outline-primary btn-sm copy-btn ${copied ? 'is-copied' : ''}`}
                        onClick={() => handleCopy(row._id)}
                        aria-label={`Copy tracking link for ${row.campaignTitle}`}
                    >
                        <i className={`bi ${copied ? 'bi-check2' : 'bi-copy'}`} aria-hidden="true" />
                        {copied ? 'Copied' : 'Copy link'}
                    </button>
                );
            }
        },
        {
            field: 'actions',
            headerName: '',
            sortable: false,
            disableColumnMenu: true,
            width: 140,
            align: 'right',
            renderCell: ({ row }) => (
                <div className="row-actions">
                    {permission.canViewLink && (
                        <Tooltip title="View analytics">
                            <button type="button" className="icon-btn" onClick={() => navigate(`/analytics/${row._id}`)} aria-label={`Analytics for ${row.campaignTitle}`}>
                                <i className="bi bi-bar-chart-line" />
                            </button>
                        </Tooltip>
                    )}
                    {permission.canEditLink && (
                        <Tooltip title="Edit link">
                            <button type="button" className="icon-btn" onClick={() => openEdit(row)} aria-label={`Edit ${row.campaignTitle}`}>
                                <i className="bi bi-pencil" />
                            </button>
                        </Tooltip>
                    )}
                    {permission.canDeleteLink && (
                        <Tooltip title="Delete link">
                            <button type="button" className="icon-btn danger" onClick={() => openDelete(row)} aria-label={`Delete ${row.campaignTitle}`}>
                                <i className="bi bi-trash3" />
                            </button>
                        </Tooltip>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="container page">
            <PageHeader
                title="Affiliate links"
                subtitle="Create trackable links, share them anywhere and see how each one performs."
                actions={permission.canCreateLink && (
                    <button type="button" className="btn btn-primary" onClick={openCreate}>
                        <i className="bi bi-plus-lg" aria-hidden="true" /> New link
                    </button>
                )}
            />

            <div className="row g-3 mb-4 stat-row-compact">
                <div className="col-6 col-lg-4">
                    <StatCard
                        icon="bi-link-45deg"
                        tone="brand"
                        label={searchQuery ? 'Matching links' : 'Total links'}
                        value={loading && !links.length ? '—' : <CountUp value={total} />}
                        hint={searchQuery ? `For "${searchQuery}"` : 'Across all campaigns'}
                    />
                </div>
                {permission.canManagePayments ? (
                    <>
                        <div className="col-6 col-lg-4">
                            <StatCard
                                icon={isSubscribed ? 'bi-infinity' : 'bi-coin'}
                                tone={outOfCredits ? 'amber' : 'teal'}
                                label="Credits"
                                value={isSubscribed ? 'Unlimited' : <CountUp value={credits} />}
                                hint={isSubscribed
                                    ? 'Your plan includes unlimited links'
                                    : <>1 credit per new link · <Link to="/manage-payments">Buy credits</Link></>}
                            />
                        </div>
                        <div className="col-sm-12 col-lg-4">
                            <StatCard
                                icon="bi-stars"
                                tone="amber"
                                label="Plan"
                                value={isSubscribed ? 'Unlimited' : 'Pay as you go'}
                                hint={isSubscribed
                                    ? (user?.subscription?.nextBillDate ? `Renews ${formatDate(user.subscription.nextBillDate)}` : 'Active subscription')
                                    : <Link to="/manage-payments">Compare plans</Link>}
                            />
                        </div>
                    </>
                ) : (
                    <div className="col-6 col-lg-4">
                        <StatCard
                            icon="bi-person-badge"
                            tone="teal"
                            label="Your access"
                            value={ROLE_LABELS[user?.role] || user?.role}
                            hint="You can view links and analytics"
                        />
                    </div>
                )}
            </div>

            {outOfCredits && (
                <div className="callout" role="status">
                    <span className="callout-icon" aria-hidden="true"><i className="bi bi-coin" /></span>
                    <div className="callout-body">
                        <div className="callout-title">You're out of credits</div>
                        Each new link uses 1 credit. Buy a credit pack or go unlimited to keep creating links.
                    </div>
                    <Link to="/manage-payments" className="btn btn-primary btn-sm">Get credits</Link>
                </div>
            )}

            <Toast message={notice} onClose={() => setNotice('')} />
            {pageError && <Alert>{pageError}</Alert>}

            <div className="surface grid-surface">
                <div className="grid-toolbar">
                    <div className="input-icon">
                        <i className="bi bi-search" aria-hidden="true" />
                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search by campaign, URL or category"
                            aria-label="Search links"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                        />
                    </div>
                    <span className="text-muted small">
                        {formatNumber(total)} link{total === 1 ? '' : 's'}
                    </span>
                </div>
                {isMobile ? (
                    <>
                        {loading && !links.length ? (
                            <div className="link-list">
                                {[0, 1, 2].map((index) => (
                                    <div className="link-card" key={index}>
                                        <div className="d-flex gap-3 align-items-center">
                                            <span className="thumb skeleton" />
                                            <div className="flex-grow-1">
                                                <div className="skeleton mb-2" style={{ height: 14, width: '70%' }} />
                                                <div className="skeleton" style={{ height: 12, width: '40%' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : links.length === 0 ? (
                            <NoLinksOverlay
                                searching={Boolean(searchQuery)}
                                canCreate={Boolean(permission.canCreateLink)}
                                onCreate={openCreate}
                            />
                        ) : (
                            <div className="link-list">
                                {links.map((row, index) => {
                                    const copied = copiedId === row._id;
                                    return (
                                        <article className="link-card" key={row._id} style={{ '--i': index }}>
                                            <div className="cell-stack">
                                                {row.thumbnail ? (
                                                    <img src={row.thumbnail} alt="" className="thumb" loading="lazy" />
                                                ) : (
                                                    <span className="thumb thumb-placeholder" aria-hidden="true"><i className="bi bi-image" /></span>
                                                )}
                                                <div className="min-w-0 flex-grow-1">
                                                    <div className="cell-title">{row.campaignTitle}</div>
                                                    <a href={row.originalUrl} target="_blank" rel="noopener noreferrer" className="cell-link small">
                                                        <span className="text-truncate">{prettyUrl(row.originalUrl)}</span>
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="link-card-meta">
                                                <span className="chip chip-neutral">{row.category}</span>
                                                <span><strong>{formatNumber(row.clickCount)}</strong> clicks</span>
                                                <span>{formatDate(row.createdAt)}</span>
                                            </div>
                                            <div className="link-card-actions">
                                                <button
                                                    type="button"
                                                    className={`btn btn-outline-primary btn-sm copy-btn ${copied ? 'is-copied' : ''}`}
                                                    onClick={() => handleCopy(row._id)}
                                                >
                                                    <i className={`bi ${copied ? 'bi-check2' : 'bi-copy'}`} aria-hidden="true" />
                                                    {copied ? 'Copied' : 'Copy link'}
                                                </button>
                                                {permission.canViewLink && (
                                                    <button type="button" className="icon-btn" onClick={() => navigate(`/analytics/${row._id}`)} aria-label={`Analytics for ${row.campaignTitle}`}>
                                                        <i className="bi bi-bar-chart-line" />
                                                    </button>
                                                )}
                                                {permission.canEditLink && (
                                                    <button type="button" className="icon-btn" onClick={() => openEdit(row)} aria-label={`Edit ${row.campaignTitle}`}>
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                )}
                                                {permission.canDeleteLink && (
                                                    <button type="button" className="icon-btn danger" onClick={() => openDelete(row)} aria-label={`Delete ${row.campaignTitle}`}>
                                                        <i className="bi bi-trash3" />
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                        {total > paginationModel.pageSize && (
                            <div className="mobile-pager">
                                <button
                                    type="button"
                                    className="btn btn-light btn-sm"
                                    disabled={paginationModel.page === 0 || loading}
                                    onClick={() => setPaginationModel((prev) => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    <i className="bi bi-chevron-left" aria-hidden="true" /> Prev
                                </button>
                                <span className="tabular">
                                    {paginationModel.page * paginationModel.pageSize + 1}–{Math.min(total, (paginationModel.page + 1) * paginationModel.pageSize)} of {formatNumber(total)}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-light btn-sm"
                                    disabled={(paginationModel.page + 1) * paginationModel.pageSize >= total || loading}
                                    onClick={() => setPaginationModel((prev) => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Next <i className="bi bi-chevron-right" aria-hidden="true" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <DataGrid
                        getRowId={(row) => row._id}
                        rows={links}
                        columns={columns}
                        loading={loading}
                        rowHeight={64}
                        autoHeight
                        paginationMode="server"
                        sortingMode="server"
                        rowCount={total}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        columnVisibilityModel={{ originalUrl: !isCompact, category: !isTablet }}
                        pageSizeOptions={[10, 25, 50]}
                        sortModel={sortModel}
                        onSortModelChange={(model) => {
                            setSortModel(model);
                            setPaginationModel((prev) => ({ ...prev, page: 0 }));
                        }}
                        disableRowSelectionOnClick
                        disableColumnFilter
                        slots={{ noRowsOverlay: NoLinksOverlay }}
                        slotProps={{
                            noRowsOverlay: {
                                searching: Boolean(searchQuery),
                                canCreate: Boolean(permission.canCreateLink),
                                onCreate: openCreate
                            },
                            loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' }
                        }}
                        sx={dataGridSx}
                    />
                )}
            </div>

            {/* Add / edit link */}
            <Modal show={showForm} onHide={closeForm} centered>
                <Modal.Header closeButton={!saving}>
                    <div>
                        <Modal.Title>{isEdit ? 'Edit link' : 'Create a new link'}</Modal.Title>
                        <p className="modal-subtitle">
                            {isEdit
                                ? 'Changes apply to the existing tracking link.'
                                : isSubscribed ? 'Unlimited plan: no credits needed.' : `Uses 1 credit · you have ${credits}.`}
                        </p>
                    </div>
                </Modal.Header>
                <form onSubmit={handleSubmit} noValidate>
                    <Modal.Body>
                        {formError && (
                            <Alert>
                                {formError}
                                {outOfCredits && !isEdit && <> <Link to="/manage-payments">Get credits</Link></>}
                            </Alert>
                        )}

                        <div className="mb-3">
                            <label htmlFor="campaignTitle" className="form-label">Campaign title</label>
                            <input
                                type="text"
                                className={`form-control ${formErrors.campaignTitle ? 'is-invalid' : ''}`}
                                id="campaignTitle"
                                name="campaignTitle"
                                placeholder="e.g. Diwali headphones deal"
                                value={form.campaignTitle}
                                onChange={handleFormChange}
                                autoFocus
                            />
                            {formErrors.campaignTitle && <div className="invalid-feedback">{formErrors.campaignTitle}</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="originalUrl" className="form-label">Destination URL</label>
                            <input
                                type="url"
                                className={`form-control ${formErrors.originalUrl ? 'is-invalid' : ''}`}
                                id="originalUrl"
                                name="originalUrl"
                                placeholder="https://www.amazon.in/..."
                                value={form.originalUrl}
                                onChange={handleFormChange}
                            />
                            {formErrors.originalUrl
                                ? <div className="invalid-feedback">{formErrors.originalUrl}</div>
                                : <div className="form-text">Your affiliate URL. Visitors are redirected here.</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="category" className="form-label">Category</label>
                            <input
                                type="text"
                                className={`form-control ${formErrors.category ? 'is-invalid' : ''}`}
                                id="category"
                                name="category"
                                list="category-options"
                                placeholder="e.g. Electronics"
                                value={form.category}
                                onChange={handleFormChange}
                            />
                            <datalist id="category-options">
                                {categories.map((category) => <option key={category} value={category} />)}
                            </datalist>
                            {formErrors.category && <div className="invalid-feedback">{formErrors.category}</div>}
                        </div>

                        <div>
                            <span className="form-label d-block">Thumbnail <span className="text-muted fw-normal">(optional)</span></span>
                            <label className="upload-field w-100 mb-0" htmlFor="thumbnail" style={{ cursor: 'pointer' }}>
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Thumbnail preview" className="upload-preview" />
                                ) : (
                                    <span className="upload-placeholder" aria-hidden="true"><i className="bi bi-image" /></span>
                                )}
                                <span className="min-w-0">
                                    <span className="d-block fw-semibold text-truncate">
                                        {thumbnailFile ? thumbnailFile.name : previewUrl ? 'Replace image' : 'Upload an image'}
                                    </span>
                                    <span className="d-block small text-muted">PNG or JPG, shown next to the link</span>
                                </span>
                            </label>
                            <input
                                type="file"
                                id="thumbnail"
                                accept="image/*"
                                className="visually-hidden"
                                onChange={handleThumbnailChange}
                            />
                            {formErrors.thumbnail && <div className="invalid-feedback d-block">{formErrors.thumbnail}</div>}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button type="button" className="btn btn-light" onClick={closeForm} disabled={saving}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <><ButtonSpinner /> Saving…</> : isEdit ? 'Save changes' : 'Create link'}
                        </button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Delete confirmation */}
            <Modal show={Boolean(deleteTarget)} onHide={() => !deleting && setDeleteTarget(null)} centered>
                <Modal.Header closeButton={!deleting}>
                    <Modal.Title>Delete this link?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {deleteError && <Alert>{deleteError}</Alert>}
                    <p className="mb-0 text-muted">
                        <strong className="text-body">{deleteTarget?.campaignTitle}</strong> will be removed and its
                        tracking link will stop working. This can't be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-light" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <><ButtonSpinner /> Deleting…</> : 'Delete link'}
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default LinksDashboard;
