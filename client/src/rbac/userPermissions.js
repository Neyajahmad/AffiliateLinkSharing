import { useSelector } from "react-redux";

export const ROLE_PERMISSIONS = {
    admin: {
        canViewUser: true,
        canCreateUser: true,
        canDeleteUser: true,
        canEditUser: true,
        canViewLink: true,
        canCreateLink: true,
        canDeleteLink: true,
        canEditLink: true,
        canManageTeam: true,
        canManagePayments: true,
    },
    developer: {
        canViewUser: false,
        canCreateUser: false,
        canDeleteUser: false,
        canEditUser: false,
        canViewLink: true,
        canCreateLink: false,
        canDeleteLink: false,
        canEditLink: false,
        canManageTeam: false,
        canManagePayments: false,
    },
    viewer: {
        canViewUser: true,
        canCreateUser: false,
        canDeleteUser: false,
        canEditUser: false,
        canViewLink: true,
        canCreateLink: false,
        canDeleteLink: false,
        canEditLink: false,
        canManageTeam: false,
        canManagePayments: false,
    },
};

export const ROLE_LABELS = {
    admin: 'Admin',
    developer: 'Developer',
    viewer: 'Viewer',
};

// Custom hook to return the applicable permissions of the logged in user.
export const usePermission = () => {
    const user = useSelector((state) => state.userDetails);
    return ROLE_PERMISSIONS[user?.role] || {};
};
