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
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

type EditProfileDialogProps = {
    open: boolean;
    username: string;
    name: string;
    email: string;
    phone: string | null;
    onClose: () => void;
    onSave: (
        username: string,
        name: string,
        email: string,
        phone: string,
        currentPassword: string
    ) => void | Promise<void>;
};

export default function EditProfileDialog({
    open,
    username,
    name,
    email,
    phone,
    onClose,
    onSave,
}: EditProfileDialogProps) {
    const [formUsername, setFormUsername] =
        useState("");

    const [formName, setFormName] =
        useState("");

    const [formEmail, setFormEmail] =
        useState("");

    const [formPhone, setFormPhone] =
        useState("");

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [usernameError, setUsernameError] =
        useState("");

    const [nameError, setNameError] =
        useState("");

    const [emailError, setEmailError] =
        useState("");

    const [phoneError, setPhoneError] =
        useState("");

    const [passwordError, setPasswordError] =
        useState("");

    const [apiError, setApiError] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    /*
     * =========================================================
     * LOAD CURRENT VALUES
     * =========================================================
     */

    const handleOpen = () => {
        setFormUsername(username || "");

        setFormName(name || "");

        setFormEmail(email || "");

        setFormPhone(
            phone
                ? phone
                      .replace(/\D/g, "")
                      .slice(0, 10)
                : ""
        );

        setCurrentPassword("");

        setUsernameError("");
        setNameError("");
        setEmailError("");
        setPhoneError("");
        setPasswordError("");
        setApiError("");
        setSaving(false);
    };

    /*
     * =========================================================
     * USERNAME VALIDATION
     * =========================================================
     */

    const validateUsername = (
        value: string
    ): string => {
        const trimmed = value.trim();

        if (!trimmed) {
            return "Username is required.";
        }

        if (trimmed.length > 15) {
            return "Username must not exceed 15 characters.";
        }

        if (
            !/^[A-Za-z0-9._]+$/.test(
                trimmed
            )
        ) {
            return "Username can contain only letters, numbers, dots and underscores.";
        }

        return "";
    };

    /*
     * =========================================================
     * NAME VALIDATION
     * =========================================================
     */

    const validateName = (
        value: string
    ): string => {
        const trimmed = value.trim();

        if (!trimmed) {
            return "Name is required.";
        }

        if (trimmed.length < 4) {
            return "Name must be at least 4 characters.";
        }

        if (trimmed.length > 15) {
            return "Name must not exceed 15 characters.";
        }

        if (!/^[A-Za-z ]+$/.test(trimmed)) {
            return "Name can contain only letters and spaces.";
        }

        return "";
    };

    /*
     * =========================================================
     * EMAIL VALIDATION
     * =========================================================
     */

    const validateEmail = (
        value: string
    ): string => {
        const trimmed = value.trim();

        if (!trimmed) {
            return "Email is required.";
        }

        if (
            !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/i.test(
                trimmed
            )
        ) {
            return "Enter a valid .com email address.";
        }

        return "";
    };

    /*
     * =========================================================
     * PHONE VALIDATION
     * =========================================================
     */

    const validatePhone = (
        value: string
    ): string => {
        const digits =
            value.replace(/\D/g, "");

        if (!digits) {
            return "Phone number is required.";
        }

        if (digits.length !== 10) {
            return "Phone number must contain exactly 10 digits.";
        }

        if (
            !/^[6-9]\d{9}$/.test(
                digits
            )
        ) {
            return "Enter a valid Indian phone number.";
        }

        return "";
    };

    /*
     * =========================================================
     * PASSWORD VALIDATION
     * =========================================================
     */

    const validatePassword = (
        value: string
    ): string => {
        if (!value.trim()) {
            return "Current password is required.";
        }

        return "";
    };

    /*
     * =========================================================
     * SAVE
     * =========================================================
     */

    const handleSave = async () => {
        const cleanUsername =
            formUsername.trim();

        const cleanName =
            formName.trim();

        const cleanEmail =
            formEmail.trim();

        const cleanPhone =
            formPhone.replace(
                /\D/g,
                ""
            );

        setApiError("");

        setUsernameError("");
        setNameError("");
        setEmailError("");
        setPhoneError("");
        setPasswordError("");

        /*
         * =====================================================
         * CHECK WHICH FIELDS CHANGED
         * =====================================================
         */

        const usernameChanged =
            cleanUsername !==
            (username || "").trim();

        const nameChanged =
            cleanName !==
            (name || "").trim();

        const emailChanged =
            cleanEmail.toLowerCase() !==
            (email || "")
                .trim()
                .toLowerCase();

        const phoneChanged =
            cleanPhone !==
            (phone || "").replace(
                /\D/g,
                ""
            );

        /*
         * =====================================================
         * NOTHING CHANGED
         * =====================================================
         */

        if (
            !usernameChanged &&
            !nameChanged &&
            !emailChanged &&
            !phoneChanged
        ) {
            setApiError(
                "No changes to save."
            );

            return;
        }

        /*
         * =====================================================
         * VALIDATE CHANGED FIELDS
         * =====================================================
         */

        let hasValidationError =
            false;

        if (usernameChanged) {
            const validation =
                validateUsername(
                    cleanUsername
                );

            setUsernameError(
                validation
            );

            if (validation) {
                hasValidationError =
                    true;
            }
        }

        if (nameChanged) {
            const validation =
                validateName(
                    cleanName
                );

            setNameError(
                validation
            );

            if (validation) {
                hasValidationError =
                    true;
            }
        }

        if (emailChanged) {
            const validation =
                validateEmail(
                    cleanEmail
                );

            setEmailError(
                validation
            );

            if (validation) {
                hasValidationError =
                    true;
            }
        }

        if (phoneChanged) {
            const validation =
                validatePhone(
                    cleanPhone
                );

            setPhoneError(
                validation
            );

            if (validation) {
                hasValidationError =
                    true;
            }
        }

        /*
         * =====================================================
         * CURRENT PASSWORD
         * =====================================================
         */

        const passwordValidation =
            validatePassword(
                currentPassword
            );

        setPasswordError(
            passwordValidation
        );

        if (passwordValidation) {
            hasValidationError =
                true;
        }

        if (hasValidationError) {
            return;
        }

        /*
         * =====================================================
         * CHECK LOGIN
         * =====================================================
         */

        const token =
            sessionStorage.getItem(
                "accessToken"
            );

        if (!token) {
            onClose();

            window.location.replace(
                "/login"
            );

            return;
        }

        /*
         * =====================================================
         * SEND ALL 5 FIELDS
         * =====================================================
         */

        setSaving(true);

        try {
            await onSave(
                cleanUsername,
                cleanName,
                cleanEmail,
                cleanPhone,
                currentPassword
            );
        } catch (error) {
            console.error(
                "Edit profile save error:",
                error
            );

            setApiError(
                "Unable to update profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
     * =========================================================
     * USERNAME INPUT
     * =========================================================
     */

    const handleUsernameChange = (
        value: string
    ) => {
        const cleanValue =
            value.slice(0, 15);

        setFormUsername(
            cleanValue
        );

        setUsernameError("");
        setApiError("");
    };

    /*
     * =========================================================
     * NAME INPUT
     * =========================================================
     */

    const handleNameChange = (
        value: string
    ) => {
        const cleanValue =
            value.slice(0, 15);

        setFormName(
            cleanValue
        );

        setNameError("");
        setApiError("");
    };

    /*
     * =========================================================
     * EMAIL INPUT
     * =========================================================
     */

    const handleEmailChange = (
        value: string
    ) => {
        setFormEmail(value);

        setEmailError("");
        setApiError("");
    };

    /*
     * =========================================================
     * PHONE INPUT
     * =========================================================
     */

    const handlePhoneChange = (
        value: string
    ) => {
        const digits =
            value
                .replace(/\D/g, "")
                .slice(0, 10);

        setFormPhone(digits);

        setPhoneError("");
        setApiError("");
    };

    /*
     * =========================================================
     * PASSWORD INPUT
     * =========================================================
     */

    const handlePasswordChange = (
        value: string
    ) => {
        setCurrentPassword(
            value
        );

        setPasswordError("");
        setApiError("");
    };

    /*
     * =========================================================
     * CLOSE
     * =========================================================
     */

    const handleClose = () => {
        if (saving) {
            return;
        }

        setUsernameError("");
        setNameError("");
        setEmailError("");
        setPhoneError("");
        setPasswordError("");
        setApiError("");
        setCurrentPassword("");

        onClose();
    };

    return (
        <Dialog
            open={open}
            onTransitionEnter={handleOpen}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        backgroundColor:
                            "#FFFDF7",
                        boxShadow:
                            "0 10px 30px rgba(62,38,22,0.15)",
                    },
                },
            }}
        >
            {/* HEADER */}

            <Box
                sx={{
                    display: "flex",
                    alignItems:
                        "flex-start",
                    justifyContent:
                        "space-between",
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
                            fontSize:
                                "1.35rem",
                            fontWeight: 600,
                            color:
                                "#3E2616",
                        }}
                    >
                        Edit Profile
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            fontSize:
                                "0.8rem",
                            color:
                                "text.secondary",
                        }}
                    >
                        Update your
                        profile
                        information
                    </Typography>
                </Box>

                <IconButton
                    onClick={
                        handleClose
                    }
                    size="small"
                    disabled={saving}
                    aria-label="Close"
                    sx={{
                        color:
                            "#5C3A21",

                        "&:hover": {
                            backgroundColor:
                                "rgba(92,58,33,0.08)",
                        },
                    }}
                >
                    <CloseOutlinedIcon />
                </IconButton>
            </Box>

            <DialogContent
                sx={{
                    px: {
                        xs: 2.5,
                        sm: 3.5,
                    },
                    pb: 3.5,
                }}
            >
                {/* API ERROR */}

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
                                "1px solid rgba(211,47,47,0.20)",
                        }}
                    >
                        <Typography
                            sx={{
                                color:
                                    "#D32F2F",
                                fontSize:
                                    "0.8rem",
                            }}
                        >
                            {apiError}
                        </Typography>
                    </Box>
                )}

                {/* USERNAME */}

                <TextField
                    fullWidth
                    label="Username"
                    value={
                        formUsername
                    }
                    disabled={saving}
                    onChange={(
                        event
                    ) => {
                        handleUsernameChange(
                            event.target
                                .value
                        );
                    }}
                    error={Boolean(
                        usernameError
                    )}
                    helperText={
                        usernameError
                    }
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonOutlinedIcon
                                        sx={{
                                            color:
                                                "#8B6508",
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: {
                            maxLength: 15,
                        },
                    }}
                    sx={{
                        mb: 2.5,
                    }}
                />

                {/* NAME */}

                <TextField
                    fullWidth
                    label="Full Name"
                    value={
                        formName
                    }
                    disabled={saving}
                    onChange={(
                        event
                    ) => {
                        handleNameChange(
                            event.target
                                .value
                        );
                    }}
                    error={Boolean(
                        nameError
                    )}
                    helperText={
                        nameError
                    }
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonOutlinedIcon
                                        sx={{
                                            color:
                                                "#8B6508",
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: {
                            maxLength: 15,
                        },
                    }}
                    sx={{
                        mb: 2.5,
                    }}
                />

                {/* EMAIL */}

                <TextField
                    fullWidth
                    label="Email"
                    value={
                        formEmail
                    }
                    disabled={saving}
                    onChange={(
                        event
                    ) => {
                        handleEmailChange(
                            event.target
                                .value
                        );
                    }}
                    error={Boolean(
                        emailError
                    )}
                    helperText={
                        emailError
                    }
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailOutlinedIcon
                                        sx={{
                                            color:
                                                "#8B6508",
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        mb: 2.5,
                    }}
                />

                {/* PHONE */}

                <TextField
                    fullWidth
                    label="Phone Number"
                    value={
                        formPhone
                    }
                    disabled={saving}
                    onChange={(
                        event
                    ) => {
                        handlePhoneChange(
                            event.target
                                .value
                        );
                    }}
                    error={Boolean(
                        phoneError
                    )}
                    helperText={
                        phoneError
                    }
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PhoneOutlinedIcon
                                        sx={{
                                            color:
                                                "#8B6508",
                                            mr: 1,
                                        }}
                                    />

                                    <Typography
                                        component="span"
                                        sx={{
                                            color:
                                                "#5C3A21",
                                            fontSize:
                                                "0.9rem",
                                        }}
                                    >
                                        +91
                                    </Typography>
                                </InputAdornment>
                            ),
                        },
                        htmlInput: {
                            inputMode:
                                "numeric",
                            maxLength: 10,
                        },
                    }}
                    sx={{
                        mb: 2.5,
                    }}
                />

                {/* CURRENT PASSWORD */}

                <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={
                        currentPassword
                    }
                    disabled={saving}
                    onChange={(
                        event
                    ) => {
                        handlePasswordChange(
                            event.target
                                .value
                        );
                    }}
                    error={Boolean(
                        passwordError
                    )}
                    helperText={
                        passwordError
                    }
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlinedIcon
                                        sx={{
                                            color:
                                                "#8B6508",
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        mb: 3,
                    }}
                />

                {/* BUTTONS */}

                <Box
                    sx={{
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        gap: 1.5,
                    }}
                >
                    <Button
                        onClick={
                            handleClose
                        }
                        disabled={
                            saving
                        }
                        sx={{
                            px: 2.5,
                            py: 1,
                            color:
                                "#5C3A21",
                            borderRadius:
                                1.5,
                            textTransform:
                                "none",
                            fontWeight:
                                500,
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleSave
                        }
                        variant="contained"
                        disabled={
                            saving
                        }
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius:
                                1.5,
                            textTransform:
                                "none",
                            fontWeight:
                                600,
                            color:
                                "#FFFDF7",

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            boxShadow:
                                "none",

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #4A2E1A, #765538)",
                                boxShadow:
                                    "none",
                            },

                            "&.Mui-disabled":
                                {
                                    color:
                                        "#FFFDF7",
                                    background:
                                        "linear-gradient(135deg, #8A6545, #A68B70)",
                                },
                        }}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}