"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type { ChangeEvent } from "react";

import { useRouter } from "next/navigation";

import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    MenuItem,
    Pagination,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import { InfinityLoop } from "@/components/infinity";

// =====================================================
// TYPES
// =====================================================

type AdminUser = {
    userId: string;
    username: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;

    notReturned: number;
    overdueBooks: number;
    outstandingFine: number;
};

type ConfirmAction = "delete" | "status" | null;

type UserFilter =
    | "all"
    | "admin"
    | "library-administrative"
    | "active"
    | "inactive";

type AddUserForm = {
    username: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
};

type AddUserErrors = {
    username: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
};

// =====================================================
// CONSTANTS
// =====================================================

const emptyUserForm: AddUserForm = {
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "User",
};

const emptyUserErrors: AddUserErrors = {
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
};

const USERS_PER_PAGE = 10;

const API_BASE_URL =
    "http://localhost:5011/api/Admin";

// =====================================================
// PAGE
// =====================================================

export default function AdminUsersPage() {
    const router = useRouter();

    // =====================================================
    // USERS
    // =====================================================

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // SEARCH
    // =====================================================

    const [search, setSearch] = useState("");

    // =====================================================
    // FILTER
    // =====================================================

    const [userFilter, setUserFilter] =
        useState<UserFilter>("all");

    // =====================================================
    // CONFIRMATION
    // =====================================================

    const [confirmOpen, setConfirmOpen] =
        useState(false);

    const [confirmAction, setConfirmAction] =
        useState<ConfirmAction>(null);

    const [selectedUser, setSelectedUser] =
        useState<AdminUser | null>(null);

    const [processing, setProcessing] =
        useState(false);

    // =====================================================
    // ADD USER
    // =====================================================

    const [addUserOpen, setAddUserOpen] =
        useState(false);

    const [addUserForm, setAddUserForm] =
        useState<AddUserForm>({
            ...emptyUserForm,
        });

    const [addUserErrors, setAddUserErrors] =
        useState<AddUserErrors>({
            ...emptyUserErrors,
        });

    const [addingUser, setAddingUser] =
        useState(false);

    // =====================================================
    // NOTIFY USER
    // =====================================================

    const [notifyingUserId, setNotifyingUserId] =
        useState<string | null>(null);

    // =====================================================
    // SNACKBAR
    // =====================================================

    const [snackbarOpen, setSnackbarOpen] =
        useState(false);

    const [snackbarMessage, setSnackbarMessage] =
        useState("");

    const [snackbarSeverity, setSnackbarSeverity] =
        useState<"success" | "error">("success");

    // =====================================================
    // PAGINATION
    // =====================================================

    const [currentPage, setCurrentPage] =
        useState(1);

    // =====================================================
    // FILTER CHANGE
    // =====================================================

    const handleUserFilterChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const value =
            event.target.value as UserFilter;

        setUserFilter(value);
        setCurrentPage(1);
    };

    // =====================================================
    // GET TOKEN
    // =====================================================

    const getToken = useCallback(() => {
        const token =
            sessionStorage.getItem("accessToken");

        if (!token) {
            router.replace("/login");
            return null;
        }

        return token;
    }, [router]);

    // =====================================================
    // SNACKBAR
    // =====================================================

    const showSnackbar = (
        message: string,
        severity: "success" | "error"
    ) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // =====================================================
    // PARSE RESPONSE
    // =====================================================

    const parseResponse = async (
        response: Response
    ): Promise<unknown> => {
        const text = await response.text();

        if (!text.trim()) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                message: text,
            };
        }
    };

    // =====================================================
    // FETCH USERS
    // =====================================================

    const fetchUsers = useCallback(
        async (
            token: string
        ): Promise<AdminUser[] | null> => {
            const response = await fetch(
                `${API_BASE_URL}/users`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const result =
                await parseResponse(response);

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return null;
                }

                if (response.status === 403) {
                    router.replace("/user");
                    return null;
                }

                if (
                    typeof result === "object" &&
                    result !== null &&
                    "message" in result
                ) {
                    const message =
                        (
                            result as {
                                message?: string;
                            }
                        ).message;

                    throw new Error(
                        message ||
                        "Failed to load users."
                    );
                }

                throw new Error(
                    "Failed to load users."
                );
            }

            if (Array.isArray(result)) {
                return result as AdminUser[];
            }

            return [];
        },
        [router]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        let cancelled = false;

        const loadUsers = async () => {
            try {
                setError("");

                const token =
                    sessionStorage.getItem(
                        "accessToken"
                    );

                if (!token) {
                    router.replace("/login");
                    return;
                }

                const result =
                    await fetchUsers(token);

                if (
                    !cancelled &&
                    result !== null
                ) {
                    setUsers(result);
                }
            } catch (error) {
                console.error(
                    "Admin users API error:",
                    error
                );

                if (!cancelled) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load users."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, [
        fetchUsers,
        router,
    ]);

    // =====================================================
    // REFRESH USERS
    // =====================================================

    const refreshUsers = useCallback(
        async () => {
            const token =
                sessionStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const result =
                    await fetchUsers(token);

                if (result !== null) {
                    setUsers(result);
                }
            } catch (error) {
                console.error(
                    "Refresh users error:",
                    error
                );
            }
        },
        [
            fetchUsers,
            router,
        ]
    );

    // =====================================================
    // REFRESH ON WINDOW FOCUS
    // =====================================================

    useEffect(() => {
        const handleFocus = () => {
            refreshUsers();
        };

        window.addEventListener(
            "focus",
            handleFocus
        );

        return () => {
            window.removeEventListener(
                "focus",
                handleFocus
            );
        };
    }, [refreshUsers]);

    // =====================================================
    // FILTER + SEARCH
    // =====================================================

    const filteredUsers = useMemo(() => {
        let result = [...users];

        if (userFilter === "admin") {
            result = result.filter(
                (user) =>
                    user.role
                        .trim()
                        .toLowerCase() ===
                    "admin"
            );
        }

        if (
            userFilter ===
            "library-administrative"
        ) {
            result = result.filter(
                (user) =>
                    user.role
                        .trim()
                        .toLowerCase() ===
                    "library administrative"
            );
        }

        if (userFilter === "active") {
            result = result.filter(
                (user) => user.isActive
            );
        }

        if (userFilter === "inactive") {
            result = result.filter(
                (user) => !user.isActive
            );
        }

        const searchValue =
            search
                .trim()
                .toLowerCase();

        if (!searchValue) {
            return result;
        }

        return result.filter(
            (user) =>
                user.name
                    .toLowerCase()
                    .includes(searchValue) ||

                user.username
                    .toLowerCase()
                    .includes(searchValue) ||

                user.email
                    .toLowerCase()
                    .includes(searchValue) ||

                (
                    user.phone ?? ""
                )
                    .toLowerCase()
                    .includes(searchValue) ||

                user.role
                    .toLowerCase()
                    .includes(searchValue) ||

                (
                    user.isActive
                        ? "active"
                        : "inactive"
                ).includes(searchValue)
        );
    }, [
        users,
        search,
        userFilter,
    ]);

    // =====================================================
    // PAGINATION
    // =====================================================

    const totalPages =
        Math.ceil(
            filteredUsers.length /
            USERS_PER_PAGE
        );

    const safeCurrentPage =
        totalPages === 0
            ? 1
            : Math.min(
                currentPage,
                totalPages
            );

    const startIndex =
        (safeCurrentPage - 1) *
        USERS_PER_PAGE;

    const paginatedUsers =
        filteredUsers.slice(
            startIndex,
            startIndex + USERS_PER_PAGE
        );

    // =====================================================
    // SEARCH CHANGE
    // =====================================================

    const handleSearchChange = (
        value: string
    ) => {
        setSearch(value);
        setCurrentPage(1);
    };

    // =====================================================
    // PAGE CHANGE
    // =====================================================

    const handlePageChange = (
        _event: ChangeEvent<unknown>,
        page: number
    ) => {
        setCurrentPage(page);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // =====================================================
    // ADD USER
    // =====================================================

    const handleAddUserClick = () => {
        setAddUserForm({
            ...emptyUserForm,
        });

        setAddUserErrors({
            ...emptyUserErrors,
        });

        setAddUserOpen(true);
    };

    const closeAddUserDialog = () => {
        if (addingUser) {
            return;
        }

        setAddUserOpen(false);

        setAddUserForm({
            ...emptyUserForm,
        });

        setAddUserErrors({
            ...emptyUserErrors,
        });
    };

    // =====================================================
    // ADD USER FORM CHANGE
    // =====================================================

    const handleAddUserFormChange = (
        field: keyof AddUserForm,
        value: string
    ) => {
        setAddUserForm(
            (current) => ({
                ...current,
                [field]: value,
            })
        );

        setAddUserErrors(
            (current) => ({
                ...current,
                [field]: "",
            })
        );
    };

    // =====================================================
    // VALIDATE ADD USER
    // =====================================================

    const validateAddUserForm = (): boolean => {
        const errors: AddUserErrors = {
            ...emptyUserErrors,
        };

        const username =
            addUserForm.username.trim();

        const name =
            addUserForm.name.trim();

        const email =
            addUserForm.email.trim();

        const phone =
            addUserForm.phone.trim();

        const password =
            addUserForm.password;

        const role =
            addUserForm.role.trim();

        // =====================================================
        // NAME
        // Required + maximum 15 characters
        // Only letters and spaces
        // =====================================================

        if (!name) {
            errors.name =
                "Name is required.";
        } else if (name.length > 15) {
            errors.name =
                "Name must not exceed 15 characters.";
        } else if (!/^[A-Za-z ]+$/.test(name)) {
            errors.name =
                "Name can contain only letters and spaces.";
        }

        // =====================================================
        // USERNAME
        // Required + maximum 15 characters
        // Letters, numbers, dot and underscore only
        // =====================================================

        if (!username) {
            errors.username =
                "Username is required.";
        } else if (username.length > 15) {
            errors.username =
                "Username must not exceed 15 characters.";
        } else if (!/^[A-Za-z0-9._]+$/.test(username)) {
            errors.username =
                "Username can contain only letters, numbers, dot and underscore.";
        }

        // =====================================================
        // EMAIL
        // Required + valid .com email
        // =====================================================

        if (!email) {
            errors.email =
                "Email is required.";
        } else if (
            !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/i.test(
                email
            )
        ) {
            errors.email =
                "Please enter a valid Email";
        }

        // =====================================================
        // PHONE
        // Required + exactly 10 digits
        // =====================================================

        if (!phone) {
            errors.phone =
                "Phone is required.";
        } else if (!/^\d{10}$/.test(phone)) {
            errors.phone =
                "Phone number must contain exactly 10 digits.";
        }

        // =====================================================
        // PASSWORD
        // Required + maximum 12 characters
        // =====================================================

        if (!password) {
            errors.password =
                "Password is required.";
        } else if (password.length > 12) {
            errors.password =
                "Password must not exceed 12 characters.";
        }

        // =====================================================
        // ROLE
        // =====================================================

        if (!role) {
            errors.role =
                "Role is required.";
        }

        setAddUserErrors(errors);

        return !Object.values(errors).some(
            (message) => message !== ""
        );
    };

    // =====================================================
    // ADD USER API
    // =====================================================

    const handleAddUser = async () => {
        if (!validateAddUserForm()) {
            return;
        }

        try {
            setAddingUser(true);

            const token = getToken();

            if (!token) {
                return;
            }

            const response =
                await fetch(
                    `${API_BASE_URL}/users`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body:
                            JSON.stringify({
                                username:
                                    addUserForm.username.trim(),

                                name:
                                    addUserForm.name.trim(),

                                email:
                                    addUserForm.email.trim(),

                                phone:
                                    addUserForm.phone.trim() ||
                                    null,

                                password:
                                    addUserForm.password,

                                role:
                                    addUserForm.role.trim(),
                            }),
                    }
                );

            const result =
                await parseResponse(response);

            if (!response.ok) {
                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (
                    response.status === 403
                ) {
                    router.replace("/user");
                    return;
                }

                let message =
                    "Unable to add user.";

                if (
                    typeof result === "object" &&
                    result !== null &&
                    "message" in result
                ) {
                    message =
                        (
                            result as {
                                message?: string;
                            }
                        ).message ||
                        message;
                }

                setAddUserErrors(
                    (current) => ({
                        ...current,
                        username: message,
                    })
                );

                return;
            }

            await refreshUsers();

            setCurrentPage(1);
            setSearch("");
            setUserFilter("all");

            setAddUserOpen(false);

            setAddUserForm({
                ...emptyUserForm,
            });

            setAddUserErrors({
                ...emptyUserErrors,
            });

            showSnackbar(
                "User has been added successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Add user error:",
                error
            );

            setAddUserErrors(
                (current) => ({
                    ...current,
                    username:
                        error instanceof Error
                            ? error.message
                            : "Unable to add user.",
                })
            );
        } finally {
            setAddingUser(false);
        }
    };

    // =====================================================
    // OPEN DELETE CONFIRMATION
    // =====================================================

    const openDeleteConfirmation = (
        user: AdminUser
    ) => {
        setSelectedUser(user);
        setConfirmAction("delete");
        setConfirmOpen(true);
    };

    // =====================================================
    // OPEN STATUS CONFIRMATION
    // =====================================================

    const openStatusConfirmation = (
        user: AdminUser
    ) => {
        setSelectedUser(user);
        setConfirmAction("status");
        setConfirmOpen(true);
    };

    // =====================================================
    // NOTIFY USER
    // =====================================================

    const handleNotifyUser = async (
        user: AdminUser
    ) => {
        try {
            setNotifyingUserId(user.userId);

            const token = getToken();

            if (!token) {
                return;
            }

            const message =
                user.overdueBooks > 0
                    ? `You have ${user.overdueBooks} overdue book${user.overdueBooks === 1 ? "" : "s"} in the library. Please return ${user.overdueBooks === 1 ? "it" : "them"} as soon as possible.`
                    : user.notReturned > 0
                        ? `You currently have ${user.notReturned} unreturned book${user.notReturned === 1 ? "" : "s"}. Please return ${user.notReturned === 1 ? "it" : "them"} to the library.`
                        : user.outstandingFine > 0
                            ? `You have an outstanding library fine of ₹${Number(user.outstandingFine).toFixed(2)}. Please clear the outstanding amount.`
                            : "Please review your library account.";

            const response =
                await fetch(
                    `${API_BASE_URL}/users/${user.userId}/notify`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body:
                            JSON.stringify({
                                message,
                            }),
                    }
                );

            const result =
                await parseResponse(response);

            if (!response.ok) {
                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (
                    response.status === 403
                ) {
                    router.replace("/user");
                    return;
                }

                let errorMessage =
                    "Unable to send notification.";

                if (
                    typeof result === "object" &&
                    result !== null &&
                    "message" in result
                ) {
                    errorMessage =
                        (
                            result as {
                                message?: string;
                            }
                        ).message ||
                        errorMessage;
                }

                throw new Error(
                    errorMessage
                );
            }

            showSnackbar(
                `Notification sent successfully to @${user.username}.`,
                "success"
            );
        } catch (error) {
            console.error(
                "Send user notification error:",
                error
            );

            showSnackbar(
                error instanceof Error
                    ? error.message
                    : "Unable to send notification.",
                "error"
            );
        } finally {
            setNotifyingUserId(null);
        }
    };

    // =====================================================
    // CLOSE CONFIRMATION
    // =====================================================

    const closeConfirmation = () => {
        if (processing) {
            return;
        }

        setConfirmOpen(false);
        setConfirmAction(null);
        setSelectedUser(null);
    };

    // =====================================================
    // STATUS CHANGE
    // =====================================================

    const handleStatusChange = async (
        user: AdminUser
    ) => {
        const newStatus =
            !user.isActive;

        try {
            setProcessing(true);

            const token = getToken();

            if (!token) {
                return;
            }

            const response =
                await fetch(
                    `${API_BASE_URL}/users/${user.userId}/status`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body:
                            JSON.stringify({
                                isActive:
                                    newStatus,
                            }),
                    }
                );

            const result =
                await parseResponse(response);

            if (!response.ok) {
                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (
                    response.status === 403
                ) {
                    router.replace("/user");
                    return;
                }

                let message =
                    `Request failed with status ${response.status}.`;

                if (
                    typeof result === "object" &&
                    result !== null &&
                    "message" in result
                ) {
                    message =
                        (
                            result as {
                                message?: string;
                            }
                        ).message ||
                        message;
                }

                throw new Error(message);
            }

            setUsers(
                (currentUsers) =>
                    currentUsers.map(
                        (currentUser) =>
                            currentUser.userId ===
                                user.userId
                                ? {
                                    ...currentUser,
                                    isActive:
                                        newStatus,
                                }
                                : currentUser
                    )
            );

            showSnackbar(
                user.isActive
                    ? "User has been deactivated successfully."
                    : "User has been activated successfully.",
                user.isActive
                    ? "error"
                    : "success"
            );
        } catch (error) {
            console.error(
                "User status change error:",
                error
            );

            showSnackbar(
                error instanceof Error
                    ? error.message
                    : "Unable to change user status.",
                "error"
            );
        } finally {
            setProcessing(false);
        }
    };

    // =====================================================
    // CONFIRM STATUS CHANGE
    // =====================================================

    const handleConfirmStatusChange =
        async () => {
            if (
                !selectedUser ||
                confirmAction !== "status"
            ) {
                return;
            }

            const user =
                selectedUser;

            setConfirmOpen(false);
            setConfirmAction(null);
            setSelectedUser(null);

            await handleStatusChange(user);
        };

    // =====================================================
    // DELETE USER
    // =====================================================

    const handleDeleteUser = async () => {
        if (
            !selectedUser ||
            confirmAction !== "delete"
        ) {
            return;
        }

        try {
            setProcessing(true);

            const token = getToken();

            if (!token) {
                return;
            }

            const deletedUserId =
                selectedUser.userId;

            const response =
                await fetch(
                    `${API_BASE_URL}/users/${deletedUserId}`,
                    {
                        method: "DELETE",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const result =
                await parseResponse(response);

            if (!response.ok) {
                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (
                    response.status === 403
                ) {
                    router.replace("/user");
                    return;
                }

                let message =
                    `Request failed with status ${response.status}.`;

                if (
                    typeof result === "object" &&
                    result !== null &&
                    "message" in result
                ) {
                    message =
                        (
                            result as {
                                message?: string;
                            }
                        ).message ||
                        message;
                }

                throw new Error(message);
            }

            setUsers(
                (currentUsers) =>
                    currentUsers.filter(
                        (user) =>
                            user.userId !==
                            deletedUserId
                    )
            );

            showSnackbar(
                "User has been deleted successfully.",
                "success"
            );

            setConfirmOpen(false);
            setConfirmAction(null);
            setSelectedUser(null);
        } catch (error) {
            console.error(
                "Admin user delete error:",
                error
            );

            showSnackbar(
                error instanceof Error
                    ? error.message
                    : "Unable to delete user.",
                "error"
            );
        } finally {
            setProcessing(false);
        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography color="text.secondary">
                    Loading users...
                </Typography>
            </Box>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 2,
                }}
            >
                <Typography color="error">
                    {error}
                </Typography>
            </Box>
        );
    }

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <Box
            component="main"
            sx={{
                minHeight: "100vh",

                p: {
                    xs: 2,
                    sm: 3,
                    md: 5,
                },
            }}
        >
            {/* =================================================
                HEADER
            ================================================= */}

            <Box
                sx={{
                    display: "flex",

                    justifyContent:
                        "space-between",

                    alignItems: {
                        xs: "flex-start",
                        sm: "center",
                    },

                    gap: 2,

                    mb: 4,

                    flexWrap: {
                        xs: "wrap",
                        sm: "nowrap",
                    },
                }}
            >
                {/* LEFT */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        ml: 2,
                        transform:
                            "translateX(-20px)",
                    }}
                >
                    <IconButton
                        onClick={() =>
                            router.push("/admin")
                        }
                        sx={{
                            color: "#5C3A21",

                            backgroundColor:
                                "rgba(255,255,255,0.45)",

                            mt: 4.7,

                            "&:hover": {
                                backgroundColor:
                                    "rgba(255,255,255,0.7)",
                            },
                        }}
                    >
                        <ArrowBackOutlinedIcon />
                    </IconButton>

                    <Box>
                        <Typography
                            sx={{
                                color:
                                    "secondary.dark",

                                fontSize:
                                    "0.7rem",

                                letterSpacing:
                                    "0.2em",

                                fontWeight:
                                    600,

                                mb: 1,
                            }}
                        >
                            MEMBER MANAGEMENT
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: {
                                    xs: "1.8rem",
                                    md: "2.6rem",
                                },

                                fontWeight: 600,
                            }}
                        >
                            Users
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.5,
                                color:
                                    "text.secondary",
                                fontSize:
                                    "0.85rem",
                            }}
                        >
                            View and manage
                            library members.
                        </Typography>
                    </Box>
                </Box>

                {/* RIGHT */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            "flex-end",
                        gap: 1.5,
                        flexWrap: "nowrap",
                        flexShrink: 0,

                        mr: {
                            xs: 0,
                            md: 1,
                        },
                    }}
                >
                    <TextField
                        select
                        value={userFilter}
                        onChange={
                            handleUserFilterChange
                        }
                        size="small"
                        sx={{
                            minWidth: {
                                xs: 145,
                                sm: 170,
                            },

                            "& .MuiOutlinedInput-root":
                            {
                                backgroundColor:
                                    "#FFFFFF",

                                borderRadius:
                                    1.5,

                                "& fieldset":
                                {
                                    borderColor:
                                        "#5C3A21",
                                    borderWidth:
                                        1.5,
                                },

                                "&:hover fieldset":
                                {
                                    borderColor:
                                        "#3E2616",
                                },

                                "&.Mui-focused fieldset":
                                {
                                    borderColor:
                                        "#5C3A21",
                                    borderWidth:
                                        2,
                                },
                            },

                            "& .MuiSelect-select":
                            {
                                color:
                                    "#3E2616",
                                fontSize:
                                    "1rem",
                            },

                            "& .MuiSelect-icon":
                            {
                                color:
                                    "#5C3A21",
                            },
                        }}
                    >
                        <MenuItem value="all">
                            All Users
                        </MenuItem>

                        <MenuItem value="admin">
                            Admin
                        </MenuItem>

                        <MenuItem value="library-administrative">
                            Library Administrative
                        </MenuItem>

                        <MenuItem value="active">
                            Active
                        </MenuItem>

                        <MenuItem value="inactive">
                            Inactive
                        </MenuItem>
                    </TextField>

                    <Button
                        startIcon={
                            <AddOutlinedIcon />
                        }
                        onClick={
                            handleAddUserClick
                        }
                        sx={{
                            color: "#FFFDF7",

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            borderRadius: 1.5,

                            px: 2.5,

                            py: 1.2,

                            whiteSpace:
                                "nowrap",

                            textTransform:
                                "none",

                            flexShrink: 0,

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },
                        }}
                    >
                        Add User
                    </Button>
                </Box>
            </Box>

            {/* =================================================
                SEARCH
            ================================================= */}

            <Box
                sx={{
                    mb: 3,
                    maxWidth: 640,
                }}
            >
                <TextField
                    fullWidth
                    value={search}
                    onChange={(event) =>
                        handleSearchChange(
                            event.target.value
                        )
                    }
                    placeholder="Search name, username, email, phone, or role..."
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment
                                    position="start"
                                >
                                    <SearchOutlinedIcon
                                        sx={{
                                            color:
                                                "#8A6545",
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        backgroundColor:
                            "#FFFFFF",

                        borderRadius: 3,

                        boxShadow:
                            "0 4px 20px rgba(62, 38, 22, 0.05)",

                        "& .MuiOutlinedInput-root":
                        {
                            borderRadius: 3,

                            backgroundColor:
                                "#FFFFFF",

                            "& fieldset":
                            {
                                borderColor:
                                    "#5C3A21",
                                borderWidth:
                                    1.5,
                            },

                            "&:hover fieldset":
                            {
                                borderColor:
                                    "#3E2616",
                            },

                            "&.Mui-focused fieldset":
                            {
                                borderColor:
                                    "#5C3A21",
                                borderWidth:
                                    2,
                            },
                        },
                    }}
                />
            </Box>

            {/* =================================================
                RESULT COUNT
            ================================================= */}

            <Typography
                sx={{
                    mb: 3,
                    fontSize: "0.85rem",
                    color: "#7A6B63",
                    fontWeight: 600,
                }}
            >
                {filteredUsers.length}{" "}
                {filteredUsers.length === 1
                    ? "user"
                    : "users"}{" "}
                found
            </Typography>

            {/* =================================================
                USER LIST
            ================================================= */}

            <Card
                sx={{
                    borderRadius: 3,
                    overflow: "hidden",

                    background:
                        "rgba(255,253,247,0.92)",

                    boxShadow:
                        "0 10px 30px rgba(62,38,22,0.08)",
                }}
            >
                {/* TABLE HEADER */}

                {filteredUsers.length > 0 && (
                    <Box
                        sx={{
                            display: {
                                xs: "none",
                                md: "grid",
                            },

                            gridTemplateColumns:
                                "1.2fr 1fr 1.5fr 0.8fr 0.8fr 200px",

                            gap: 2,

                            px: 3,
                            py: 2,

                            backgroundColor:
                                "rgba(92,58,33,0.2)",

                            borderBottom:
                                "1px solid rgba(92,58,33,0.08)",
                        }}
                    >
                        {[
                            "NAME",
                            "USERNAME",
                            "EMAIL",
                            "ROLE",
                            "STATUS",
                            "ACTION",
                        ].map((heading) => (
                            <Typography
                                key={heading}
                                sx={{
                                    fontSize:
                                        "0.7rem",

                                    fontWeight:
                                        700,

                                    color:
                                        "#5C3A21",

                                    textAlign:
                                        heading ===
                                            "ACTION"
                                            ? "center"
                                            : heading ===
                                                "EMAIL"
                                                ? "center"
                                                : "left",

                                    transform:
                                        heading ===
                                            "EMAIL"
                                            ? "translateX(-12px)"
                                            : heading ===
                                                "ROLE"
                                                ? "translateX(8px)"
                                                : "none",
                                }}
                            >
                                {heading}
                            </Typography>
                        ))}
                    </Box>
                )}

                {/* USERS */}

                {paginatedUsers.map(
                    (user, index) => (
                        <Box
                            key={user.userId}
                            sx={{
                                display: {
                                    xs: "flex",
                                    md: "grid",
                                },

                                gridTemplateColumns:
                                    "1.2fr 1fr 1.5fr 0.8fr 0.8fr 200px",

                                flexDirection: {
                                    xs: "column",
                                    md: "row",
                                },

                                gap: {
                                    xs: 1.5,
                                    md: 2,
                                },

                                alignItems: {
                                    xs:
                                        "flex-start",
                                    md:
                                        "center",
                                },

                                px: {
                                    xs: 2,
                                    md: 3,
                                },

                                py: {
                                    xs: 2.5,
                                    md: 2.2,
                                },

                                backgroundColor:
                                    index % 2 === 0
                                        ? "rgba(92,58,33,0.025)"
                                        : "rgba(92,58,33,0.07)",

                                borderBottom:
                                    index <
                                        paginatedUsers.length -
                                        1
                                        ? "1px solid rgba(92,58,33,0.08)"
                                        : "none",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 600,
                                    fontSize:
                                        "0.9rem",
                                    alignSelf:
                                        "center",
                                }}
                            >
                                {user.name}
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.78rem",
                                    color:
                                        "text.secondary",
                                    alignSelf:
                                        "center",
                                }}
                            >
                                @{user.username}
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.78rem",
                                    color:
                                        "text.secondary",
                                    overflow:
                                        "hidden",
                                    textOverflow:
                                        "ellipsis",
                                    whiteSpace:
                                        "nowrap",
                                    alignSelf:
                                        "center",
                                }}
                            >
                                {user.email}
                            </Typography>

                            <Box
                                sx={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    height:
                                        "100%",
                                }}
                            >
                                <Chip
                                    label={
                                        user.role
                                    }
                                    size="small"
                                    sx={{
                                        backgroundColor:
                                            "rgba(184,134,11,0.10)",

                                        color:
                                            "#8B6508",

                                        fontSize:
                                            "0.68rem",
                                    }}
                                />
                            </Box>

                            <Box
                                sx={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    height:
                                        "100%",
                                }}
                            >
                                <Chip
                                    label={
                                        user.isActive
                                            ? "Active"
                                            : "Inactive"
                                    }
                                    size="small"
                                    sx={{
                                        backgroundColor:
                                            user.isActive
                                                ? "rgba(76,120,75,0.10)"
                                                : "rgba(180,60,40,0.10)",

                                        color:
                                            user.isActive
                                                ? "#4C784B"
                                                : "#B42318",

                                        fontSize:
                                            "0.68rem",
                                    }}
                                />
                            </Box>

                            {/* ACTION */}

                            <Box
                                sx={{
                                    display:
                                        "flex",
                                    gap: 1.2,
                                    alignItems:
                                        "center",
                                    flexWrap:
                                        "nowrap",
                                }}
                            >
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                        openStatusConfirmation(
                                            user
                                        )
                                    }
                                    disabled={
                                        processing ||
                                        notifyingUserId !==
                                        null
                                    }
                                    sx={{
                                        width: 105,
                                        minWidth:
                                            105,
                                        height: 36,
                                        minHeight:
                                            36,

                                        borderRadius:
                                            1.5,

                                        textTransform:
                                            "none",

                                        whiteSpace:
                                            "nowrap",

                                        color:
                                            user.isActive
                                                ? "#B42318"
                                                : "#4C784B",

                                        borderColor:
                                            user.isActive
                                                ? "#B42318"
                                                : "#4C784B",

                                        flexShrink:
                                            0,

                                        "&:hover":
                                        {
                                            borderColor:
                                                user.isActive
                                                    ? "#8F1C13"
                                                    : "#365A36",

                                            backgroundColor:
                                                user.isActive
                                                    ? "rgba(180,60,40,0.05)"
                                                    : "rgba(76,120,75,0.05)",
                                        },
                                    }}
                                >
                                    {user.isActive
                                        ? "Deactivate"
                                        : "Activate"}
                                </Button>

                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={
                                        <DeleteOutlineOutlinedIcon />
                                    }
                                    onClick={() =>
                                        openDeleteConfirmation(
                                            user
                                        )
                                    }
                                    disabled={
                                        processing ||
                                        notifyingUserId !==
                                        null
                                    }
                                    sx={{
                                        width: 80,
                                        minWidth: 80,
                                        height: 36,
                                        minHeight: 36,

                                        borderRadius:
                                            1.5,

                                        textTransform:
                                            "none",

                                        whiteSpace:
                                            "nowrap",

                                        flexShrink:
                                            0,

                                        color:
                                            "#B42318",

                                        borderColor:
                                            "#B42318",

                                        "&:hover":
                                        {
                                            borderColor:
                                                "#8F1C13",

                                            backgroundColor:
                                                "rgba(180,60,40,0.05)",
                                        },
                                    }}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Box>
                    )
                )}

                {/* NO USERS */}

                {filteredUsers.length === 0 && (
                    <Box
                        sx={{
                            p: 5,
                            textAlign:
                                "center",
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight:
                                    600,
                            }}
                        >
                            No users found
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.7,
                                fontSize:
                                    "0.8rem",
                                color:
                                    "text.secondary",
                            }}
                        >
                            {search
                                ? `We couldn't find any users matching "${search}".`
                                : userFilter ===
                                    "active"
                                    ? "There are no active users."
                                    : userFilter ===
                                        "inactive"
                                        ? "There are no inactive users."
                                        : userFilter ===
                                            "admin"
                                            ? "There are no admin users."
                                            : userFilter ===
                                                "library-administrative"
                                                ? "There are no library administrative users."
                                                : "There are no users in the library."}
                        </Typography>
                    </Box>
                )}

                {/* PAGINATION */}

                {filteredUsers.length >
                    USERS_PER_PAGE && (
                        <Box
                            sx={{
                                display:
                                    "flex",

                                justifyContent:
                                    "center",

                                alignItems:
                                    "center",

                                py: 3,

                                borderTop:
                                    "1px solid rgba(92,58,33,0.08)",

                                backgroundColor:
                                    "rgba(92,58,33,0.02)",
                            }}
                        >
                            <Pagination
                                count={
                                    totalPages
                                }
                                page={
                                    safeCurrentPage
                                }
                                onChange={
                                    handlePageChange
                                }
                                color="primary"
                                shape="rounded"
                                size="medium"
                            />
                        </Box>
                    )}
            </Card>

            {/* =================================================
                DELETE / DEACTIVATE / ACTIVATE DIALOG
            ================================================= */}

            <Dialog
                open={confirmOpen}
                onClose={
                    closeConfirmation
                }
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle
                    sx={{
                        color:
                            "#3E2616",
                        fontWeight:
                            600,
                    }}
                >
                    {confirmAction ===
                        "delete"
                        ? "Delete User"
                        : selectedUser?.isActive
                            ? "Deactivate User"
                            : "Activate User"}
                </DialogTitle>

                <DialogContent>
                    {/* ACTION MESSAGE */}

                    <Typography
                        sx={{
                            color:
                                "text.secondary",

                            lineHeight:
                                1.7,

                            mb: 2,
                        }}
                    >
                        Are you sure you want
                        to{" "}

                        {confirmAction ===
                            "delete"
                            ? "delete"
                            : selectedUser?.isActive
                                ? "deactivate"
                                : "activate"}{" "}

                        <Box
                            component="span"
                            sx={{
                                fontWeight:
                                    700,

                                color:
                                    "#3E2616",
                            }}
                        >
                            @{selectedUser?.username}
                        </Box>
                        ?
                    </Typography>

                    {/* BORROWING DETAILS */}

                    <Box
                        sx={{
                            display:
                                "flex",

                            flexDirection:
                                "column",

                            gap: 1.3,

                            mt: 1,

                            mb: 1,
                        }}
                    >
                        {/* NOT RETURNED */}

                        <Box
                            sx={{
                                display:
                                    "flex",

                                justifyContent:
                                    "space-between",

                                alignItems:
                                    "center",

                                px: 2,

                                py: 1.2,

                                borderRadius:
                                    1.5,

                                backgroundColor:
                                    "rgba(92,58,33,0.05)",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize:
                                        "0.85rem",

                                    color:
                                        "#6B5A50",
                                }}
                            >
                                Not Returned
                            </Typography>

                            <Typography
                                sx={{
                                    fontWeight:
                                        700,

                                    color:
                                        "#3E2616",
                                }}
                            >
                                {selectedUser?.notReturned ??
                                    0}
                            </Typography>
                        </Box>

                        {/* OVERDUE BOOKS */}

                        <Box
                            sx={{
                                display:
                                    "flex",

                                justifyContent:
                                    "space-between",

                                alignItems:
                                    "center",

                                px: 2,

                                py: 1.2,

                                borderRadius:
                                    1.5,

                                backgroundColor:
                                    "rgba(180,60,40,0.06)",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize:
                                        "0.85rem",

                                    color:
                                        "#6B5A50",
                                }}
                            >
                                Overdue Books
                            </Typography>

                            <Typography
                                sx={{
                                    fontWeight:
                                        700,

                                    color:
                                        "#B42318",
                                }}
                            >
                                {selectedUser?.overdueBooks ??
                                    0}
                            </Typography>
                        </Box>

                        {/* OUTSTANDING FINE */}

                        <Box
                            sx={{
                                display:
                                    "flex",

                                justifyContent:
                                    "space-between",

                                alignItems:
                                    "center",

                                px: 2,

                                py: 1.2,

                                borderRadius:
                                    1.5,

                                backgroundColor:
                                    "rgba(184,134,11,0.08)",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize:
                                        "0.85rem",

                                    color:
                                        "#6B5A50",
                                }}
                            >
                                Outstanding Fine
                            </Typography>

                            <Typography
                                sx={{
                                    fontWeight:
                                        700,

                                    color:
                                        "#8B6508",
                                }}
                            >
                                ₹
                                {Number(
                                    selectedUser?.outstandingFine ??
                                    0
                                ).toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>

                {/* =================================================
                    ACTION BUTTONS
                ================================================= */}

                <DialogActions
                    sx={{
                        p: 2,

                        justifyContent:
                            "space-between",

                        gap: 1,
                    }}
                >
                    {/* CANCEL */}

                    <Button
                        onClick={
                            closeConfirmation
                        }
                        disabled={
                            processing ||
                            notifyingUserId !==
                            null
                        }
                        sx={{
                            color:
                                "#5C3A21",

                            textTransform:
                                "none",
                        }}
                    >
                        Cancel
                    </Button>

                    {/* =================================================
                        NOTIFY

                        Direct API action.
                        No separate confirmation.
                    ================================================= */}

                    {selectedUser &&
                        (
                            selectedUser.notReturned >
                            0 ||
                            selectedUser.overdueBooks >
                            0 ||
                            selectedUser.outstandingFine >
                            0
                        ) && (
                            <Button
                                variant="outlined"
                                disabled={
                                    processing ||
                                    notifyingUserId !==
                                    null
                                }
                                onClick={() => {
                                    handleNotifyUser(selectedUser);
                                    closeConfirmation();
                                }}
                                sx={{
                                    color:
                                        "#8B6508",

                                    borderColor:
                                        "#B8860B",

                                    borderRadius:
                                        1.5,

                                    px: 2.5,

                                    py: 1.2,

                                    minWidth:
                                        90,

                                    textTransform:
                                        "none",

                                    "&:hover":
                                    {
                                        borderColor:
                                            "#8B6508",

                                        backgroundColor:
                                            "rgba(184,134,11,0.06)",
                                    },
                                }}
                            >
                                {notifyingUserId ===
                                    selectedUser.userId ? (
                                    <InfinityLoop />
                                ) : (
                                    "Notify"
                                )}
                            </Button>
                        )}

                    {/* OK */}

                    <Button
                        onClick={
                            confirmAction ===
                                "delete"
                                ? handleDeleteUser
                                : handleConfirmStatusChange
                        }
                        variant="contained"
                        disabled={
                            processing ||
                            notifyingUserId !==
                            null
                        }
                        sx={{
                            color:
                                "#FFFDF7",

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            borderRadius:
                                1.5,

                            px: 2.5,

                            py: 1.2,

                            minWidth:
                                90,

                            textTransform:
                                "none",

                            "&:hover":
                            {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },
                        }}
                    >
                        {processing ? (
                            <InfinityLoop />
                        ) : (
                            "OK"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =================================================
                ADD USER DIALOG
            ================================================= */}

            <Dialog
                open={addUserOpen}
                onClose={
                    closeAddUserDialog
                }
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle
                    sx={{
                        color:
                            "#3E2616",

                        fontWeight:
                            600,
                    }}
                >
                    Add User
                </DialogTitle>

                <DialogContent>
                    <Box
                        sx={{
                            display:
                                "grid",

                            gridTemplateColumns:
                            {
                                xs: "1fr",
                                sm:
                                    "repeat(2, 1fr)",
                            },

                            gap: 2,

                            mt: 1,
                        }}
                    >
                        <TextField
                            fullWidth
                            label="Name*"
                            value={
                                addUserForm.name
                            }
                            onChange={(
                                event
                            ) =>
                                handleAddUserFormChange(
                                    "name",
                                    event.target
                                        .value
                                )
                            }
                            error={Boolean(
                                addUserErrors.name
                            )}
                            helperText={
                                addUserErrors.name
                            }
                        />

                        <TextField
                            fullWidth
                            label="Username*"
                            value={
                                addUserForm.username
                            }
                            onChange={(
                                event
                            ) =>
                                handleAddUserFormChange(
                                    "username",
                                    event.target
                                        .value
                                )
                            }
                            error={Boolean(
                                addUserErrors.username
                            )}
                            helperText={
                                addUserErrors.username
                            }
                        />

                        <TextField
                            fullWidth
                            label="Email*"
                            type="email"
                            value={
                                addUserForm.email
                            }
                            onChange={(
                                event
                            ) =>
                                handleAddUserFormChange(
                                    "email",
                                    event.target
                                        .value
                                )
                            }
                            error={Boolean(
                                addUserErrors.email
                            )}
                            helperText={
                                addUserErrors.email
                            }
                        />

                        <TextField
                            fullWidth
                            label="Phone*"
                            value={addUserForm.phone}
                            onChange={(event) => {
                                const value = event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 10);

                                handleAddUserFormChange(
                                    "phone",
                                    value
                                );
                            }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            +91
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            error={Boolean(addUserErrors.phone)}
                            helperText={addUserErrors.phone}
                        />

                        <TextField
                            fullWidth
                            label="Password*"
                            type="password"
                            value={
                                addUserForm.password
                            }
                            onChange={(
                                event
                            ) =>
                                handleAddUserFormChange(
                                    "password",
                                    event.target
                                        .value
                                )
                            }
                            error={Boolean(
                                addUserErrors.password
                            )}
                            helperText={
                                addUserErrors.password
                            }
                        />

                        <TextField
                            select
                            fullWidth
                            label="Role*"
                            value={
                                addUserForm.role
                            }
                            onChange={(
                                event
                            ) =>
                                handleAddUserFormChange(
                                    "role",
                                    event.target
                                        .value
                                )
                            }
                            error={Boolean(
                                addUserErrors.role
                            )}
                            helperText={
                                addUserErrors.role
                            }
                        >
                            <MenuItem value="User">
                                User
                            </MenuItem>

                            <MenuItem value="Admin">
                                Admin
                            </MenuItem>

                            <MenuItem value="Library Administrative">
                                Library Administrative
                            </MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{
                        p: 2,

                        justifyContent:
                            "space-between",

                        gap: 1,
                    }}
                >
                    <Button
                        onClick={
                            closeAddUserDialog
                        }
                        disabled={
                            addingUser
                        }
                        sx={{
                            color:
                                "#5C3A21",

                            textTransform:
                                "none",
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleAddUser}
                        variant="contained"
                        disabled={addingUser}
                        sx={{
                            color: "#FFFDF7",

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            borderRadius: 1.5,

                            px: 2.5,

                            py: 1.2,

                            minWidth: 110,

                            textTransform: "none",

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },

                            "&.Mui-disabled": {
                                color: "#FFFFFF",

                                background:
                                    "rgba(92, 58, 33, 0.35)",
                            },
                        }}
                    >
                        Add User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =================================================
                SNACKBAR
            ================================================= */}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() =>
                    setSnackbarOpen(false)
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={() =>
                        setSnackbarOpen(false)
                    }
                    severity={
                        snackbarSeverity
                    }
                    variant="filled"
                    sx={{
                        width: "100%",

                        minWidth: {
                            xs: "auto",
                            sm: 320,
                        },

                        borderRadius: 2,

                        fontWeight: 500,
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}