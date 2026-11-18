"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";

import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import EditProfileDialog from "@/app/components/EditProfileDialog";
import ChangePasswordDialog from "@/app/components/ChangePasswordDialog";
import DeleteAccountDialog from "@/app/components/DeleteAccountDialog";

type UserProfile = {
    userId: string;
    username: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
};

type ApiResult = {
    message?: string;
};

export default function ProfilePage() {
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [originalName, setOriginalName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [nameError, setNameError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [menuAnchorEl, setMenuAnchorEl] =
        useState<null | HTMLElement>(null);

    const menuOpen = Boolean(menuAnchorEl);

    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

    /*
     * =========================================================
     * LOAD PROFILE
     * =========================================================
     */

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = sessionStorage.getItem("accessToken");

                if (!token) {
                    router.replace("/login");
                    return;
                }

                const response = await fetch(
                    "http://localhost:5011/api/User/profile",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result =
                    (await response.json()) as UserProfile & ApiResult;

                if (!response.ok) {
                    if (response.status === 401) {
                        sessionStorage.removeItem("accessToken");
                        router.replace("/login");
                        return;
                    }

                    throw new Error(
                        result.message || "Failed to load profile."
                    );
                }

                setProfile(result);
                setOriginalName(result.name);
            } catch (error) {
                console.error("Profile API error:", error);
                setError("Unable to load profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    /*
     * =========================================================
     * GET INITIALS
     * =========================================================
     */

    const getInitials = (name: string) => {
        if (!name) return "U";

        return name
            .trim()
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    /*
     * =========================================================
     * MENU
     * =========================================================
     */

    const handleMenuOpen = (
        event: React.MouseEvent<HTMLElement>
    ) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    /*
     * =========================================================
     * EDIT PROFILE
     * =========================================================
     */

    const handleEditProfile = () => {
        handleMenuClose();
        setEditProfileOpen(true);
    };

    const handleEditProfileClose = () => {
        setEditProfileOpen(false);
    };

    const handleEditProfileSave = async (
        username: string,
        name: string,
        email: string,
        phone: string,
        currentPassword: string
    ) => {
        try {
            setSuccessMessage("");
            setErrorMessage("");

            const token = sessionStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            const response = await fetch(
                "http://localhost:5011/api/User/profile",
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        name,
                        email,
                        phone,
                        currentPassword,
                    }),
                }
            );

            const result = (await response.json()) as ApiResult;

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("accessToken");
                    router.replace("/login");
                    return;
                }

                setErrorMessage(
                    result.message || "Failed to update profile."
                );

                return;
            }

            setProfile((previous) =>
                previous
                    ? {
                        ...previous,
                        username,
                        name,
                        email,
                        phone,
                    }
                    : previous
            );

            setOriginalName(name);
            setEditProfileOpen(false);
            setSuccessMessage("Profile updated successfully.");
        } catch (error) {
            console.error("Update profile error:", error);

            setErrorMessage(
                "An unexpected error occurred. Please try again."
            );
        }
    };

    /*
     * =========================================================
     * CHANGE PASSWORD
     * =========================================================
     */

    const handleChangePassword = () => {
        handleMenuClose();
        setChangePasswordOpen(true);
    };

    const handleChangePasswordClose = () => {
        setChangePasswordOpen(false);
    };

    const handlePasswordChangeSave = async (
        currentPassword: string,
        newPassword: string
    ): Promise<boolean> => {
        try {
            setSuccessMessage("");
            setErrorMessage("");

            const token = sessionStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return false;
            }

            const response = await fetch(
                "http://localhost:5011/api/User/profile/password",
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                }
            );

            const result = (await response.json()) as ApiResult;

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("accessToken");
                    router.replace("/login");
                    return false;
                }

                setErrorMessage(
                    result.message ||
                    "Failed to change password."
                );

                return false;
            }

            setChangePasswordOpen(false);
            setSuccessMessage(
                "Password updated successfully."
            );

            return true;
        } catch (error) {
            console.error("Change password error:", error);

            setErrorMessage(
                "An unexpected error occurred. Please try again."
            );

            return false;
        }
    };

    /*
     * =========================================================
     * DELETE ACCOUNT
     * =========================================================
     */

    const handleDeleteAccount = () => {
        handleMenuClose();

        setErrorMessage("");
        setSuccessMessage("");

        setDeleteAccountOpen(true);
    };

    const handleDeleteAccountClose = () => {
        setDeleteAccountOpen(false);
    };

    const handleAccountDelete = async (
        password: string
    ): Promise<void> => {
        try {
            setSuccessMessage("");
            setErrorMessage("");

            const token = sessionStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            /*
             * =====================================================
             * DELETE ACCOUNT API
             *
             * Backend is responsible for checking:
             *
             * 1. Unreturned books
             * 2. Outstanding fine
             * 3. Password
             * 4. Account status
             * =====================================================
             */

            const response = await fetch(
                "http://localhost:5011/api/User/profile",
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        password: password.trim(),
                    }),
                }
            );

            /*
             * Try to read the backend response safely.
             *
             * This prevents the frontend from crashing if the
             * backend returns an empty response.
             */

            let result: ApiResult = {};

            try {
                result = (await response.json()) as ApiResult;
            } catch {
                result = {};
            }

            /*
             * =====================================================
             * UNAUTHORIZED
             * =====================================================
             */

            if (response.status === 401) {
                sessionStorage.removeItem("accessToken");
                setDeleteAccountOpen(false);
                router.replace("/login");
                return;
            }

            /*
             * =====================================================
             * BACKEND RESTRICTION / ERROR
             * =====================================================
             *
             * IMPORTANT:
             *
             * We do NOT check fines or borrowed books in the
             * frontend.
             *
             * The backend sends the exact reason and the frontend
             * displays it.
             */

            if (!response.ok) {
                setErrorMessage(
                    result.message ||
                    "Unable to delete your account."
                );

                return;
            }

            /*
             * =====================================================
             * DELETE SUCCESS
             * =====================================================
             */

            sessionStorage.removeItem("accessToken");

            setDeleteAccountOpen(false);

            router.replace("/login");
        } catch (error) {
            console.error(
                "Delete account API error:",
                error
            );

            setErrorMessage(
                "An unexpected error occurred. Please try again."
            );
        }
    };

    /*
     * =========================================================
     * SAVE NAME
     * =========================================================
     */

    const handleSave = async () => {
        if (!profile) return;

        const name = profile.name.trim();

        if (!name) {
            setNameError("Name is required.");
            return;
        }

        if (name.length < 4) {
            setNameError(
                "Name must be at least 4 characters."
            );
            return;
        }

        if (name.length > 15) {
            setNameError(
                "Name must not exceed 15 characters."
            );
            return;
        }

        if (!/^[A-Za-z ]+$/.test(name)) {
            setNameError(
                "Name can contain only letters and spaces."
            );
            return;
        }

        if (name === originalName.trim()) {
            setNameError(
                "Your name is already saved as entered."
            );
            return;
        }

        setNameError("");
        setSaving(true);

        try {
            const token = sessionStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            const response = await fetch(
                "http://localhost:5011/api/User/profile/name",
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                    }),
                }
            );

            const result = (await response.json()) as ApiResult;

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("accessToken");
                    router.replace("/login");
                    return;
                }

                setNameError(
                    result.message ||
                    "Unable to update name."
                );

                return;
            }

            setProfile((previous) =>
                previous
                    ? {
                        ...previous,
                        name,
                    }
                    : previous
            );

            setOriginalName(name);
            setSuccessMessage(
                "Name updated successfully."
            );
        } catch (error) {
            console.error(
                "Update name API error:",
                error
            );

            setNameError(
                "Unable to update name. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
     * =========================================================
     * LOADING
     * =========================================================
     */

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
                    Loading profile...
                </Typography>
            </Box>
        );
    }

    /*
     * =========================================================
     * ERROR
     * =========================================================
     */

    if (error || !profile) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography color="error">
                    {error || "Profile not available."}
                </Typography>
            </Box>
        );
    }

    /*
     * =========================================================
     * UI
     * =========================================================
     */

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
            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                }}
            >
                <IconButton
                    onClick={() => router.push("/user")}
                    sx={{
                        color: "#5C3A21",
                        backgroundColor:
                            "rgba(255,255,255,0.45)",
                        mt: 3,
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
                            color: "secondary.dark",
                            fontSize: "0.7rem",
                            letterSpacing: "0.2em",
                            fontWeight: 600,
                            mb: 1,
                        }}
                    >
                        ACCOUNT
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
                        My Profile
                    </Typography>
                </Box>
            </Box>

            <Card
                sx={{
                    maxWidth: 800,
                    borderRadius: 3,
                    backgroundColor:
                        "rgba(255,253,247,0.9)",
                    boxShadow:
                        "0 10px 30px rgba(62,38,22,0.08)",
                }}
            >
                <CardContent
                    sx={{
                        p: {
                            xs: 2,
                            md: 4,
                        },
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 4,
                            width: "100%",
                        }}
                    >
                        <Box
                            sx={{
                                width: 70,
                                height: 70,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                    "linear-gradient(135deg, #5C3A21, #B8860B)",
                                color: "#FFFDF7",
                                fontSize: "1.2rem",
                                fontWeight: 600,
                                flexShrink: 0,
                            }}
                        >
                            {getInitials(profile.name)}
                        </Box>

                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "1.1rem",
                                    color: "#3E2616",
                                }}
                            >
                                {profile.name}
                            </Typography>

                            <Typography
                                sx={{
                                    color: "text.secondary",
                                    fontSize: "0.75rem",
                                }}
                            >
                                Library Member
                            </Typography>
                        </Box>

                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            aria-label="Profile options"
                            sx={{
                                color: "#5C3A21",
                                flexShrink: 0,
                                width: 40,
                                height: 40,
                                "&:hover": {
                                    backgroundColor:
                                        "rgba(92,58,33,0.08)",
                                },
                            }}
                        >
                            <MoreVertOutlinedIcon />
                        </IconButton>

                        <Menu
                            anchorEl={menuAnchorEl}
                            open={menuOpen}
                            onClose={handleMenuClose}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                            slotProps={{
                                paper: {
                                    sx: {
                                        mt: 1,
                                        minWidth: 220,
                                        borderRadius: 2,
                                        backgroundColor:
                                            "#FFFDF7",
                                        boxShadow:
                                            "0 8px 25px rgba(62,38,22,0.15)",
                                        border:
                                            "1px solid rgba(92,58,33,0.10)",
                                    },
                                },
                            }}
                        >
                            <MenuItem
                                onClick={handleEditProfile}
                                sx={{
                                    py: 1.3,
                                    color: "#3E2616",
                                    gap: 1.2,
                                }}
                            >
                                <PersonOutlinedIcon
                                    sx={{
                                        fontSize: 20,
                                        color: "#8B6508",
                                    }}
                                />

                                <Typography
                                    sx={{
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    Edit Profile
                                </Typography>
                            </MenuItem>

                            <MenuItem
                                onClick={handleChangePassword}
                                sx={{
                                    py: 1.3,
                                    color: "#3E2616",
                                    gap: 1.2,
                                }}
                            >
                                <LockOutlinedIcon
                                    sx={{
                                        fontSize: 20,
                                        color: "#8B6508",
                                    }}
                                />

                                <Typography
                                    sx={{
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    Change Password
                                </Typography>
                            </MenuItem>

                            <MenuItem
                                onClick={handleDeleteAccount}
                                sx={{
                                    py: 1.3,
                                    gap: 1.2,
                                    color: "#D32F2F",
                                    "&:hover": {
                                        backgroundColor:
                                            "rgba(211,47,47,0.06)",
                                    },
                                }}
                            >
                                <DeleteOutlineOutlinedIcon
                                    sx={{
                                        fontSize: 20,
                                        color: "#D32F2F",
                                    }}
                                />

                                <Typography
                                    sx={{
                                        fontSize: "0.85rem",
                                        color: "#D32F2F",
                                        fontWeight: 500,
                                    }}
                                >
                                    Delete Account
                                </Typography>
                            </MenuItem>
                        </Menu>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "1fr 1fr",
                            },
                            gap: 2.5,
                        }}
                    >
                        <TextField
                            label="Full Name"
                            value={profile.name}
                            
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    startAdornment:
                                        <PersonOutlinedIcon />,
                                },
                            }}
                        />

                        <TextField
                            label="Email"
                            value={profile.email}
                            slotProps={{
                                input: {
                                    startAdornment:
                                        <EmailOutlinedIcon />,
                                    readOnly: true,
                                },
                            }}
                        />

                        <TextField
                            label="Phone"
                            value={
                                profile.phone
                                    ? profile.phone
                                        .replace(/\D/g, "")
                                        .slice(0, 10)
                                        .replace(
                                            /(\d{5})(\d{0,5})/,
                                            "$1 $2"
                                        )
                                        .trim()
                                    : ""
                            }
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    startAdornment: (
                                        <>
                                            <PhoneOutlinedIcon
                                                sx={{
                                                    mr: 1,
                                                }}
                                            />

                                            <Typography
                                                component="span"
                                                sx={{
                                                    mr: 1,
                                                    fontSize:
                                                        "inherit",
                                                    color:
                                                        "inherit",
                                                }}
                                            >
                                                +91
                                            </Typography>
                                        </>
                                    ),
                                },
                            }}
                        />
                    </Box>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                            mt: 3,
                            px: 4,
                            py: 1.2,
                            color: "#FFFDF7",
                            borderRadius: 1.5,
                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",
                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #4A2E1A, #765538)",
                            },
                            "&.Mui-disabled": {
                                color: "#FFFDF7",
                                background:
                                    "linear-gradient(135deg, #8A6545, #A68B70)",
                            },
                        }}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>

            <EditProfileDialog
                open={editProfileOpen}
                username={profile.username}
                name={profile.name}
                email={profile.email}
                phone={profile.phone}
                onClose={handleEditProfileClose}
                onSave={handleEditProfileSave}
            />

            <ChangePasswordDialog
                open={changePasswordOpen}
                onClose={handleChangePasswordClose}
                onSave={handlePasswordChangeSave}
            />

            <DeleteAccountDialog
                open={deleteAccountOpen}
                onClose={handleDeleteAccountClose}
                onDelete={handleAccountDelete}
            />

            {/* =====================================================
                SUCCESS SNACKBAR
                ===================================================== */}

            <Snackbar
                open={Boolean(successMessage)}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={() => setSuccessMessage("")}
                    severity="success"
                    variant="filled"
                    sx={{
                        width: "100%",
                    }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* =====================================================
                ERROR SNACKBAR

                This displays backend messages such as:

                "You cannot delete your account because you still
                 have unreturned books..."

                "You cannot delete your account because you have
                 an outstanding fine..."

                "Password is incorrect."
                ===================================================== */}

            <Snackbar
                open={Boolean(errorMessage)}
                autoHideDuration={5000}
                onClose={() => setErrorMessage("")}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={() => setErrorMessage("")}
                    severity="error"
                    variant="filled"
                    sx={{
                        width: "100%",
                    }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
