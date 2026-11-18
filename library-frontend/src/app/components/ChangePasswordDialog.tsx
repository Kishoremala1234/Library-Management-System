"use client";

import { useState } from "react";

import {
    Box,
    Button,
    Dialog,
    DialogContent,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from "@mui/material";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

type ChangePasswordDialogProps = {
    open: boolean;
    onClose: () => void;
    onSave: (
        currentPassword: string,
        newPassword: string
    ) => Promise<boolean>;
};

export default function ChangePasswordDialog({
    open,
    onClose,
    onSave,
}: ChangePasswordDialogProps) {
    // =========================================================
    // FORM STATE
    // =========================================================

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // =========================================================
    // ERROR STATE
    // =========================================================

    const [currentPasswordError, setCurrentPasswordError] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [apiError, setApiError] = useState("");

    // =========================================================
    // SAVING STATE
    // =========================================================

    const [saving, setSaving] = useState(false);

    // =========================================================
    // PASSWORD VISIBILITY
    // =========================================================

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // =========================================================
    // PASSWORD VALIDATION
    // =========================================================

    const validateCurrentPassword = (value: string): string => {
        if (!value.trim()) {
            return "Current password is required.";
        }

        if (value.length < 4) {
            return "Password must be at least 4 characters.";
        }

        if (value.length > 18) {
            return "Password is too long. Maximum 18 characters allowed.";
        }

        return "";
    };

    const validateNewPassword = (value: string): string => {
        if (!value) {
            return "New password is required.";
        }

        if (value.length > 18) {
            return "Password is too long. Maximum 18 characters allowed.";
        }

        if (value.length < 4) {
            return "Password must be at least 4 characters.";
        }

        if (!/[A-Z]/.test(value)) {
            return "Password must contain at least one uppercase letter.";
        }

        if (!/[a-z]/.test(value)) {
            return "Password must contain at least one lowercase letter.";
        }

        if (!/[0-9]/.test(value)) {
            return "Password must contain at least one number.";
        }

        if (!/[^A-Za-z0-9]/.test(value)) {
            return "Password must contain at least one special character.";
        }

        if (currentPassword && value === currentPassword) {
            return "New password cannot be the same as your current password.";
        }

        return "";
    };

    const validateConfirmPassword = (value: string): string => {
        if (!value) {
            return "Please confirm your new password.";
        }

        if (value.length > 18) {
            return "Password is too long. Maximum 18 characters allowed.";
        }

        if (value.length < 4) {
            return "Password must be at least 4 characters.";
        }

        if (value !== newPassword) {
            return "Passwords do not match.";
        }

        return "";
    };

    // =========================================================
    // RESET FORM
    // =========================================================

    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setCurrentPasswordError("");
        setNewPasswordError("");
        setConfirmPasswordError("");

        setApiError("");

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    // =========================================================
    // CLOSE
    // =========================================================

    const handleClose = () => {
        if (saving) {
            return;
        }

        resetForm();
        onClose();
    };

    // =========================================================
    // SAVE / CHANGE PASSWORD
    // =========================================================

    const handleSave = async () => {
        // -----------------------------------------------------
        // FRONTEND VALIDATION
        // -----------------------------------------------------

        const currentError =
            validateCurrentPassword(currentPassword);

        const newError =
            validateNewPassword(newPassword);

        const confirmError =
            validateConfirmPassword(confirmPassword);

        setCurrentPasswordError(currentError);
        setNewPasswordError(newError);
        setConfirmPasswordError(confirmError);
        setApiError("");

        if (
            currentError ||
            newError ||
            confirmError
        ) {
            return;
        }

        // -----------------------------------------------------
        // CALL PARENT
        // -----------------------------------------------------

        setSaving(true);

        try {
            const success = await onSave(
                currentPassword,
                newPassword
            );

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            if (success) {
                resetForm();
                onClose();
            }
        } catch (error) {
            console.error(
                "Change password error:",
                error
            );

            setApiError(
                "Unable to change password. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // COMMON TEXT FIELD STYLE
    // =========================================================

    const textFieldSx = {
        mb: 2.5,

        "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": {
                borderColor: "#5C3A21",
            },
        },

        // Hide browser password eye
        "& input::-ms-reveal": {
            display: "none",
        },

        "& input::-ms-clear": {
            display: "none",
        },

        // Hide WebKit password reveal button
        "& input::-webkit-credentials-auto-fill-button": {
            visibility: "hidden",
            display: "none !important",
            pointerEvents: "none",
        },

        "& input::-webkit-textfield-decoration-container": {
            display: "none",
        },

        "& .MuiInputLabel-root.Mui-focused": {
            color: "#5C3A21",
        },
    };

    // =========================================================
    // UI
    // =========================================================

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        backgroundColor: "#FFFDF7",
                        boxShadow:
                            "0 10px 30px rgba(62,38,22,0.15)",
                    },
                },
            }}
        >
            {/* =================================================
                HEADER
            ================================================= */}

            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    px: {
                        xs: 2.5,
                        sm: 3.5,
                    },
                    pt: 3,
                    pb: 1,
                }}
            >
                <Box>
                    <Typography
                        sx={{
                            fontSize: "1.35rem",
                            fontWeight: 600,
                            color: "#3E2616",
                        }}
                    >
                        Change Password
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            fontSize: "0.8rem",
                            color: "text.secondary",
                        }}
                    >
                        Update your account password securely
                    </Typography>
                </Box>

                <IconButton
                    onClick={handleClose}
                    size="small"
                    disabled={saving}
                    sx={{
                        color: "#5C3A21",
                        "&:hover": {
                            backgroundColor:
                                "rgba(92,58,33,0.08)",
                        },
                    }}
                >
                    <CloseOutlinedIcon />
                </IconButton>
            </Box>

            {/* =================================================
                CONTENT
            ================================================= */}

            <DialogContent
                sx={{
                    px: {
                        xs: 2.5,
                        sm: 3.5,
                    },
                    pb: 3.5,
                }}
            >
                {/* =================================================
                    API ERROR
                ================================================= */}

                {apiError && (
                    <Box
                        sx={{
                            mb: 2.5,
                            px: 2,
                            py: 1.5,
                            borderRadius: 1.5,
                            backgroundColor:
                                "rgba(211,47,47,0.08)",
                            border:
                                "1px solid rgba(211,47,47,0.2)",
                        }}
                    >
                        <Typography
                            sx={{
                                color: "#D32F2F",
                                fontSize: "0.8rem",
                            }}
                        >
                            {apiError}
                        </Typography>
                    </Box>
                )}

                {/* =================================================
                    CURRENT PASSWORD
                ================================================= */}

                <TextField
                    fullWidth
                    label="Current Password*"
                    type={
                        showCurrentPassword
                            ? "text"
                            : "password"
                    }
                    value={currentPassword}
                    disabled={saving}
                    onChange={(event) => {
                        const value = event.target.value;

                        setCurrentPassword(value);
                        setApiError("");

                        if (value.length > 18) {
                            setCurrentPasswordError(
                                "Password is too long. Maximum 18 characters allowed."
                            );
                        } else if (
                            value.length > 0 &&
                            value.length < 4
                        ) {
                            setCurrentPasswordError(
                                "Password must be at least 4 characters."
                            );
                        } else {
                            setCurrentPasswordError("");
                        }

                        if (
                            newPassword &&
                            value === newPassword
                        ) {
                            setNewPasswordError(
                                "New password cannot be the same as your current password."
                            );
                        } else if (
                            newPassword.length <= 18
                        ) {
                            setNewPasswordError("");
                        }
                    }}
                    error={Boolean(currentPasswordError)}
                    helperText={currentPasswordError}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() =>
                                            setShowCurrentPassword(
                                                (previous) =>
                                                    !previous
                                            )
                                        }
                                        edge="end"
                                        disabled={saving}
                                        aria-label={
                                            showCurrentPassword
                                                ? "Hide current password"
                                                : "Show current password"
                                        }
                                    >
                                        {showCurrentPassword ? (
                                            <VisibilityOffOutlinedIcon />
                                        ) : (
                                            <VisibilityOutlinedIcon />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={textFieldSx}
                />

                {/* =================================================
                    NEW PASSWORD
                ================================================= */}

                <TextField
                    fullWidth
                    label="New Password*"
                    type={
                        showNewPassword
                            ? "text"
                            : "password"
                    }
                    value={newPassword}
                    disabled={saving}
                    onChange={(event) => {
                        const value = event.target.value;

                        setNewPassword(value);
                        setApiError("");

                        if (value.length > 18) {
                            setNewPasswordError(
                                "Password is too long. Maximum 18 characters allowed."
                            );
                        } else if (
                            value.length > 0 &&
                            value.length < 4
                        ) {
                            setNewPasswordError(
                                "Password must be at least 4 characters."
                            );
                        } else if (
                            value &&
                            currentPassword &&
                            value === currentPassword
                        ) {
                            setNewPasswordError(
                                "New password cannot be the same as your current password."
                            );
                        } else if (
                            value &&
                            !/[A-Z]/.test(value)
                        ) {
                            setNewPasswordError(
                                "Password must contain at least one uppercase letter."
                            );
                        } else if (
                            value &&
                            !/[a-z]/.test(value)
                        ) {
                            setNewPasswordError(
                                "Password must contain at least one lowercase letter."
                            );
                        } else if (
                            value &&
                            !/[0-9]/.test(value)
                        ) {
                            setNewPasswordError(
                                "Password must contain at least one number."
                            );
                        } else if (
                            value &&
                            !/[^A-Za-z0-9]/.test(value)
                        ) {
                            setNewPasswordError(
                                "Password must contain at least one special character."
                            );
                        } else {
                            setNewPasswordError("");
                        }

                        /*
                         * Re-check confirm password
                         * whenever new password changes.
                         */

                        if (confirmPassword) {
                            if (
                                confirmPassword.length > 18
                            ) {
                                setConfirmPasswordError(
                                    "Password is too long. Maximum 18 characters allowed."
                                );
                            } else if (
                                confirmPassword !== value
                            ) {
                                setConfirmPasswordError(
                                    "Passwords do not match."
                                );
                            } else {
                                setConfirmPasswordError("");
                            }
                        }
                    }}
                    error={Boolean(newPasswordError)}
                    helperText={newPasswordError}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() =>
                                            setShowNewPassword(
                                                (previous) =>
                                                    !previous
                                            )
                                        }
                                        edge="end"
                                        disabled={saving}
                                        aria-label={
                                            showNewPassword
                                                ? "Hide new password"
                                                : "Show new password"
                                        }
                                    >
                                        {showNewPassword ? (
                                            <VisibilityOffOutlinedIcon />
                                        ) : (
                                            <VisibilityOutlinedIcon />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={textFieldSx}
                />

                {/* =================================================
                    CONFIRM PASSWORD
                ================================================= */}

                <TextField
                    fullWidth
                    label="Confirm New Password*"
                    type={
                        showConfirmPassword
                            ? "text"
                            : "password"
                    }
                    value={confirmPassword}
                    disabled={saving}
                    onChange={(event) => {
                        const value = event.target.value;

                        setConfirmPassword(value);
                        setApiError("");

                        if (value.length > 18) {
                            setConfirmPasswordError(
                                "Password is too long. Maximum 18 characters allowed."
                            );
                        } else if (
                            value.length > 0 &&
                            value.length < 4
                        ) {
                            setConfirmPasswordError(
                                "Password must be at least 4 characters."
                            );
                        } else if (
                            value &&
                            value !== newPassword
                        ) {
                            setConfirmPasswordError(
                                "Passwords do not match."
                            );
                        } else {
                            setConfirmPasswordError("");
                        }
                    }}
                    error={Boolean(confirmPasswordError)}
                    helperText={confirmPasswordError}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (previous) =>
                                                    !previous
                                            )
                                        }
                                        edge="end"
                                        disabled={saving}
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide confirm password"
                                                : "Show confirm password"
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <VisibilityOffOutlinedIcon />
                                        ) : (
                                            <VisibilityOutlinedIcon />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        ...textFieldSx,
                        mb: 3,
                    }}
                />

                {/* =================================================
                    BUTTONS
                ================================================= */}

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    {/* CANCEL */}

                    <Button
                        onClick={handleClose}
                        disabled={saving}
                        sx={{
                            px: 2.5,
                            py: 1,
                            color: "#5C3A21",
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontWeight: 500,
                            "&:hover": {
                                backgroundColor:
                                    "rgba(92,58,33,0.07)",
                            },
                        }}
                    >
                        Cancel
                    </Button>

                    {/* CHANGE PASSWORD */}

                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving}
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#FFFDF7",
                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",
                            boxShadow: "none",
                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #4A2E1A, #765538)",
                                boxShadow: "none",
                            },
                            "&.Mui-disabled": {
                                color: "#FFFDF7",
                                background:
                                    "linear-gradient(135deg, #8A6545, #A68B70)",
                            },
                        }}
                    >
                        {saving
                            ? "Changing..."
                            : "Change Password"}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}