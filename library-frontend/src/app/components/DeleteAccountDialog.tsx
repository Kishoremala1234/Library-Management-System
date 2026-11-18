"use client";

import { useState } from "react";

import {
    Alert,
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
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

type DeleteAccountDialogProps = {
    open: boolean;
    onClose: () => void;
    onDelete: (password: string) => void;
};

export default function DeleteAccountDialog({
    open,
    onClose,
    onDelete,
}: DeleteAccountDialogProps) {
    const [step, setStep] = useState<1 | 2>(1);

    const [password, setPassword] = useState("");

    const [passwordError, setPasswordError] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    /*
     * =========================================================
     * RESET DIALOG
     * =========================================================
     */

    const resetDialog = () => {
        setStep(1);
        setPassword("");
        setPasswordError("");
        setShowPassword(false);
    };

    /*
     * =========================================================
     * CLOSE
     * =========================================================
     */

    const handleClose = () => {
        resetDialog();
        onClose();
    };

    /*
     * =========================================================
     * STEP 1
     * =========================================================
     */

    const handleConfirm = () => {
        setStep(2);
        setPassword("");
        setPasswordError("");
        setShowPassword(false);
    };

    /*
     * =========================================================
     * PASSWORD CHANGE
     * =========================================================
     */

    const handlePasswordChange = (
        value: string
    ) => {
        setPassword(value);

        if (passwordError) {
            setPasswordError("");
        }
    };

    /*
     * =========================================================
     * DELETE ACCOUNT
     * =========================================================
     */

    const handleDelete = () => {
        const trimmedPassword =
            password.trim();

        if (!trimmedPassword) {
            setPasswordError(
                "Current password is required."
            );
            return;
        }

        setPasswordError("");

        /*
         * The parent component performs
         * the actual backend API request.
         */
        onDelete(trimmedPassword);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        backgroundColor:
                            "#FFFDF7",
                        boxShadow:
                            "0 12px 35px rgba(62,38,22,0.18)",
                    },
                },
            }}
        >
            {/* =================================================
                STEP 1
                DELETE ACCOUNT CONFIRMATION
            ================================================= */}

            {step === 1 && (
                <>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems:
                                "flex-start",
                            justifyContent:
                                "space-between",
                            px: {
                                xs: 2.5,
                                sm: 3,
                            },
                            pt: 3,
                            pb: 1,
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    fontSize:
                                        "1.3rem",
                                    fontWeight: 600,
                                    color:
                                        "#3E2616",
                                }}
                            >
                                Delete Account
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
                                Account deletion
                            </Typography>
                        </Box>

                        <IconButton
                            onClick={
                                handleClose
                            }
                            size="small"
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
                                sm: 3,
                            },
                            pb: 3,
                        }}
                    >
                        <Alert
                            severity="warning"
                            sx={{
                                mb: 2.5,
                                borderRadius: 2,
                                fontSize:
                                    "0.8rem",
                                alignItems:
                                    "center",
                            }}
                        >
                            Are you sure you want
                            to delete your account?
                        </Alert>

                        <Typography
                            sx={{
                                fontSize:
                                    "0.85rem",
                                lineHeight: 1.6,
                                color:
                                    "text.secondary",
                                mb: 3,
                            }}
                        >
                            Your account and
                            associated information
                            will be permanently
                            deleted. This action
                            cannot be undone.
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
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
                                sx={{
                                    px: 2.5,
                                    py: 1,
                                    borderRadius:
                                        1.5,
                                    textTransform:
                                        "none",
                                    color:
                                        "#5C3A21",
                                    fontWeight: 500,

                                    "&:hover": {
                                        backgroundColor:
                                            "rgba(92,58,33,0.07)",
                                    },
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={
                                    handleConfirm
                                }
                                variant="contained"
                                sx={{
                                    px: 3,
                                    py: 1,
                                    borderRadius:
                                        1.5,
                                    textTransform:
                                        "none",
                                    fontWeight: 600,
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
                                }}
                            >
                                OK
                            </Button>
                        </Box>
                    </DialogContent>
                </>
            )}

            {/* =================================================
                STEP 2
                PASSWORD CONFIRMATION
            ================================================= */}

            {step === 2 && (
                <>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems:
                                "flex-start",
                            justifyContent:
                                "space-between",
                            px: {
                                xs: 2.5,
                                sm: 3,
                            },
                            pt: 3,
                            pb: 1,
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    fontSize:
                                        "1.3rem",
                                    fontWeight: 600,
                                    color:
                                        "#3E2616",
                                }}
                            >
                                Confirm Deletion
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
                                Verify your password
                            </Typography>
                        </Box>

                        <IconButton
                            onClick={
                                handleClose
                            }
                            size="small"
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
                                sm: 3,
                            },
                            pb: 3,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize:
                                    "0.85rem",
                                lineHeight: 1.6,
                                color:
                                    "text.secondary",
                                mb: 2.5,
                            }}
                        >
                            Enter your current
                            password to permanently
                            delete your account.
                        </Typography>

                        <TextField
                            fullWidth
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            label="Current Password"
                            value={password}
                            onChange={(event) =>
                                handlePasswordChange(
                                    event.target.value
                                )
                            }
                            error={Boolean(passwordError)}
                            helperText={passwordError}
                            autoFocus
                            slotProps={{
                                htmlInput: {
                                    autoComplete: "current-password",
                                },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlinedIcon
                                                sx={{
                                                    color: "#8B6508",
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    setShowPassword(
                                                        (previous) =>
                                                            !previous
                                                    )
                                                }
                                                edge="end"
                                                aria-label={
                                                    showPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                            >
                                                {showPassword ? (
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
                                mb: 3,

                                "& input::-ms-reveal": {
                                    display: "none",
                                },

                                "& input::-ms-clear": {
                                    display: "none",
                                },

                                "& .MuiOutlinedInput-root": {
                                    "&.Mui-focused fieldset": {
                                        borderColor:
                                            "#5C3A21",
                                    },
                                },

                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "#5C3A21",
                                },
                            }}
                        />

                        <Box
                            sx={{
                                display: "flex",
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
                                sx={{
                                    px: 2.5,
                                    py: 1,
                                    borderRadius:
                                        1.5,
                                    textTransform:
                                        "none",
                                    color:
                                        "#5C3A21",
                                    fontWeight: 500,

                                    "&:hover": {
                                        backgroundColor:
                                            "rgba(92,58,33,0.07)",
                                    },
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={
                                    handleDelete
                                }
                                variant="contained"
                                startIcon={
                                    <DeleteOutlineOutlinedIcon />
                                }
                                sx={{
                                    px: 2.5,
                                    py: 1,
                                    borderRadius:
                                        1.5,
                                    textTransform:
                                        "none",
                                    fontWeight: 600,
                                    color:
                                        "#FFFFFF",
                                    backgroundColor:
                                        "#C62828",
                                    boxShadow:
                                        "none",

                                    "&:hover": {
                                        backgroundColor:
                                            "#A91F1F",
                                        boxShadow:
                                            "none",
                                    },

                                    "&.Mui-disabled": {
                                        color:
                                            "#FFFFFF",
                                        backgroundColor:
                                            "#E0A0A0",
                                    },
                                }}
                            >
                                Delete Account
                            </Button>
                        </Box>
                    </DialogContent>
                </>
            )}
        </Dialog>
    );
}