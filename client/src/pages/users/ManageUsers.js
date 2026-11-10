import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Modal } from 'react-bootstrap';
import { serverEndpoint } from "../../config/config";
import { ROLE_LABELS } from '../../rbac/userPermissions';
import {
    Alert, ButtonSpinner, EmptyState, PageHeader, Toast,
    dataGridSx, getErrorMessage, getInitials
} from '../../components/ui';

const ROLE_OPTIONS = [
    {
        value: 'viewer',
        icon: 'bi-eye',
        title: 'Viewer',
        text: 'Can view links, analytics and the team list.'
    },
    {
        value: 'developer',
        icon: 'bi-code-slash',
        title: 'Developer',
        text: 'Can view links and analytics.'
    }
];

const EMPTY_FORM = { id: null, email: '', name: '', role: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NoMembersOverlay({ onInvite }) {
    return (
        <div className="d-flex justify-content-center pt-3">
            <EmptyState
                icon="bi-people"
                title="No team members yet"
                text="Invite teammates so they can see your links and analytics without being able to change them."
                action={(
                    <button type="button" className="btn btn-primary" onClick={onInvite}>
                        <i className="bi bi-person-plus" aria-hidden="true" /> Invite member
                    </button>
                )}
            />
        </div>
    );
}

function ManageUsers() {
    const isMobile = useMediaQuery('(max-width: 575.98px)');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [notice, setNotice] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${serverEndpoint}/users`, { withCredentials: true });
            setUsers(response.data);
            setPageError('');
        } catch (error) {
            setPageError('We couldn\'t load your team right now. Please refresh the page to try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(''), 4000);
        return () => clearTimeout(timer);
    }, [notice]);

    const openInvite = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
        setFormError('');
        setIsEdit(false);
        setShowForm(true);
    };

    const openEdit = (row) => {
        setForm({ id: row._id, email: row.email, name: row.name, role: row.role });
        setFormErrors({});
        setFormError('');
        setIsEdit(true);
        setShowForm(true);
    };

    const closeForm = () => {
        if (!saving) setShowForm(false);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const errors = {};
        if (!form.name.trim()) errors.name = 'Name is required';
        if (!isEdit && !EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address';
        if (!form.role) errors.role = 'Choose a role';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;

        setSaving(true);
        setFormError('');
        const body = { email: form.email.trim(), name: form.name.trim(), role: form.role };
        try {
            if (isEdit) {
                await axios.put(`${serverEndpoint}/users/${form.id}`, body, { withCredentials: true });
                setNotice('Team member updated.');
            } else {
                await axios.post(`${serverEndpoint}/users`, body, { withCredentials: true });
                setNotice(`Invite sent. ${body.name} will get a temporary password at ${body.email}.`);
            }
            setShowForm(false);
            await fetchUsers();
        } catch (error) {
            setFormError(getErrorMessage(error, 'We couldn\'t save this team member. Please try again.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError('');
        try {
            await axios.delete(`${serverEndpoint}/users/${deleteTarget._id}`, { withCredentials: true });
            setDeleteTarget(null);
            setNotice('Team member removed.');
            await fetchUsers();
        } catch (error) {
            setDeleteError(getErrorMessage(error, 'We couldn\'t remove this team member. Please try again.'));
        } finally {
            setDeleting(false);
        }
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Member',
            flex: 2,
            minWidth: 240,
            renderCell: ({ row }) => (
                <div className="cell-stack">
                    <span className="avatar avatar-soft">{getInitials(row.name)}</span>
                    <div className="min-w-0">
                        <div className="cell-title">{row.name}</div>
                        <div className="cell-sub">
                            {isMobile ? `${ROLE_LABELS[row.role] || row.role} · ${row.email}` : row.email}
                        </div>
                    </div>
                </div>
            )
        },
        {
            field: 'role',
            headerName: 'Role',
            flex: 1,
            minWidth: 130,
            renderCell: ({ value }) => (
                <span className={`chip ${value === 'developer' ? 'chip-success' : 'chip-info'}`}>
                    <i className={`bi ${value === 'developer' ? 'bi-code-slash' : 'bi-eye'}`} aria-hidden="true" />
                    {ROLE_LABELS[value] || value}
                </span>
            )
        },
        {
            field: 'actions',
            headerName: '',
            sortable: false,
            disableColumnMenu: true,
            width: 110,
            align: 'right',
            renderCell: ({ row }) => (
                <div className="row-actions">
                    <Tooltip title="Edit member">
                        <button type="button" className="icon-btn" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
                            <i className="bi bi-pencil" />
                        </button>
                    </Tooltip>
                    <Tooltip title="Remove member">
                        <button type="button" className="icon-btn danger" onClick={() => { setDeleteError(''); setDeleteTarget(row); }} aria-label={`Remove ${row.name}`}>
                            <i className="bi bi-trash3" />
                        </button>
                    </Tooltip>
                </div>
            )
        }
    ];

    return (
        <div className="container page">
            <PageHeader
                title="Team members"
                subtitle="Give teammates read-only access to your links and analytics."
                actions={(
                    <button type="button" className="btn btn-primary" onClick={openInvite}>
                        <i className="bi bi-person-plus" aria-hidden="true" /> Invite member
                    </button>
                )}
            />

            <Toast message={notice} onClose={() => setNotice('')} />
            {pageError && <Alert>{pageError}</Alert>}

            <div className="surface grid-surface">
                <DataGrid
                    getRowId={(row) => row._id}
                    rows={users}
                    columns={columns}
                    loading={loading}
                    rowHeight={64}
                    autoHeight
                    initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    disableColumnFilter
                    columnVisibilityModel={{ role: !isMobile }}
                    slots={{ noRowsOverlay: NoMembersOverlay }}
                    slotProps={{
                        noRowsOverlay: { onInvite: openInvite },
                        loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' }
                    }}
                    sx={dataGridSx}
                />
            </div>

            <Modal show={showForm} onHide={closeForm} centered>
                <Modal.Header closeButton={!saving}>
                    <div>
                        <Modal.Title>{isEdit ? 'Edit team member' : 'Invite a team member'}</Modal.Title>
                        <p className="modal-subtitle">
                            {isEdit
                                ? 'Update their name or change what they can access.'
                                : 'We\'ll email them a temporary password so they can log in.'}
                        </p>
                    </div>
                </Modal.Header>
                <form onSubmit={handleSubmit} noValidate>
                    <Modal.Body>
                        {formError && <Alert>{formError}</Alert>}

                        <div className="mb-3">
                            <label htmlFor="member-name" className="form-label">Full name</label>
                            <input
                                type="text"
                                id="member-name"
                                name="name"
                                className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                                value={form.name}
                                onChange={handleChange}
                                autoFocus
                            />
                            {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="member-email" className="form-label">Email address</label>
                            <input
                                type="email"
                                id="member-email"
                                name="email"
                                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                value={form.email}
                                onChange={handleChange}
                                disabled={isEdit}
                            />
                            {formErrors.email
                                ? <div className="invalid-feedback">{formErrors.email}</div>
                                : isEdit && <div className="form-text">Email can't be changed after inviting.</div>}
                        </div>

                        <fieldset>
                            <legend className="form-label">Role</legend>
                            <div className="d-grid gap-2">
                                {ROLE_OPTIONS.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`pack-option flex-row align-items-center gap-3 ${form.role === option.value ? 'is-selected' : ''}`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={option.value}
                                            checked={form.role === option.value}
                                            onChange={handleChange}
                                            className="form-check-input mt-0"
                                        />
                                        <span className="stat-icon" aria-hidden="true"><i className={`bi ${option.icon}`} /></span>
                                        <span>
                                            <span className="d-block fw-semibold text-body">{option.title}</span>
                                            <span className="d-block small text-muted">{option.text}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {formErrors.role && <div className="invalid-feedback d-block">{formErrors.role}</div>}
                        </fieldset>
                    </Modal.Body>
                    <Modal.Footer>
                        <button type="button" className="btn btn-light" onClick={closeForm} disabled={saving}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <><ButtonSpinner /> Saving…</> : isEdit ? 'Save changes' : 'Send invite'}
                        </button>
                    </Modal.Footer>
                </form>
            </Modal>

            <Modal show={Boolean(deleteTarget)} onHide={() => !deleting && setDeleteTarget(null)} centered>
                <Modal.Header closeButton={!deleting}>
                    <Modal.Title>Remove team member?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {deleteError && <Alert>{deleteError}</Alert>}
                    <p className="mb-0 text-muted">
                        <strong className="text-body">{deleteTarget?.name}</strong> will lose access to your links
                        and analytics immediately. This can't be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-light" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <><ButtonSpinner /> Removing…</> : 'Remove member'}
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ManageUsers;
