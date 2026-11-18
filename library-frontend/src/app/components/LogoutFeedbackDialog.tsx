"use client";

import { InfinityLoop } from "@/components/infinity";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from "@mui/material";

import { useState } from "react";


type LogoutFeedbackDialogProps = {
    open: boolean;
    onClose: () => void;
    onLogout: () => void;
};

export default function LogoutFeedbackDialog({
    open,
    onClose,
    onLogout,
}: LogoutFeedbackDialogProps) {
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCancel = () => {
        if (loading) {
            return;
        }

        setFeedback("");
        setError("");
        onClose();

    };

    const handleSubmit = async () => {
        const trimmedFeedback = feedback.trim();

        setLoading(true);
        setError("");

        /*
         * Feedback is optional.
         *
         * If the user does not enter anything,
         * directly logout after showing the loader.
         */
        if (!trimmedFeedback) {
            await new Promise((resolve) =>
                setTimeout(resolve, 700)
            );

            onLogout();
            return;
        }

        /*
         * Validate feedback length.
         */
        if (trimmedFeedback.length > 500) {
            setError(
                "Feedback must not exceed 500 characters."
            );

            setLoading(false);
            return;
        }

        try {
            const token =
                sessionStorage.getItem("accessToken");

            /*
             * If token does not exist,
             * logout directly.
             */
            if (!token) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 700)
                );

                onLogout();
                return;
            }

            /*
             * Submit feedback.
             */
            const response = await fetch(
                "http://localhost:5011/api/User/feedback",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        feedback: trimmedFeedback,
                    }),
                }
            );

            const result =
                await response.json().catch(() => null);

            if (!response.ok) {
                setError(
                    result?.message ||
                    "Unable to submit feedback. Please try again."
                );

                setLoading(false);
                return;
            }

            /*
             * Feedback successfully saved.
             */
            setFeedback("");
            setError("");

            /*
             * Logout.
             */
            onLogout();
        } catch (error) {
            console.error(
                "Feedback submission error:",
                error
            );

            setError(
                "Unable to connect to the server. Please try again."
            );

            setLoading(false);
        }

    };

    return (
        <>
            <Dialog
                open={open && !loading}
                onClose={handleCancel}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle
                    sx={{
                        fontWeight: 600,
                        color: "text.primary",
                    }}
                >
                    Before you go </DialogTitle>

                <DialogContent>
                    <Typography
                        sx={{
                            mb: 2.5,
                            fontSize: "0.9rem",
                            color: "text.secondary",
                            lineHeight: 1.6,
                        }}
                    >
                        How was your experience with our
                        library? Your feedback helps us
                        improve.
                    </Typography>

                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={4}
                        label="Your feedback (optional)"
                        placeholder="Tell us about your experience..."
                        value={feedback}
                        disabled={loading}
                        error={!!error}
                        helperText={
                            error ||
                            `${feedback.length}/500`
                        }
                        onChange={(event) => {
                            setFeedback(
                                event.target.value.slice(0, 500)
                            );

                            if (error) {
                                setError("");
                            }
                        }}
                        slotProps={{
                            htmlInput: {
                                maxLength: 500,
                            },
                        }}
                    />
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2.5,

                        display: "flex",

                        justifyContent:
                            "space-between",

                        alignItems: "center",
                    }}
                >
                    {/* LEFT SIDE - CANCEL */}

                    <Button
                        onClick={handleCancel}
                        disabled={loading}
                        sx={{
                            textTransform: "none",
                            color: "text.secondary",
                            minWidth: 80,
                        }}
                    >
                        Cancel
                    </Button>

                    {/* RIGHT SIDE - OK */}

                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        variant="contained"
                        sx={{
                            textTransform: "none",
                            borderRadius: 1.5,
                            px: 3,
                            minWidth: 80,

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },
                        }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =========================
      CUSTOM LOGOUT LOADER
     ========================= */}

            {loading && (
                <Box
                    sx={{
                        position: "fixed",

                        inset: 0,

                        zIndex: 9999,

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        backgroundColor:
                            "rgba(255,253,247,0.92)",

                        backdropFilter:
                            "blur(3px)",
                    }}
                >
                    <InfinityLoop
                        className="h-16 w-20"
                    />
                </Box>
            )}
        </>

    );
}
