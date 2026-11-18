"use client";

import Link from "next/link";
import { InfinityLoop } from "@/components/infinity";

import {
    Box,
    Button,
    TextField,
    Typography,
    InputAdornment,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
} from "@mui/material";

import { useRouter } from "next/navigation";

import {
    useForm,
    Controller,
} from "react-hook-form";

import {
    yupResolver,
} from "@hookform/resolvers/yup";

import * as yup from "yup";

import { useState } from "react";

import {
    MenuBook,
    PersonOutlined,
    LockOutlined,
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";

/*

* LOGIN VALIDATION
  */
const loginSchema = yup.object({
    username: yup
        .string()
        .required("Username or email is required")
        .test(
            "username-or-email",
            "Enter a valid username or email",
            (value) => {
                if (!value) {
                    return false;
                }

                const trimmed = value.trim();

                const usernameRegex =
                    /^[A-Za-z0-9._]+$/;

                const emailRegex =
                    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;

                return (
                    usernameRegex.test(trimmed) ||
                    emailRegex.test(trimmed)
                );
            }
        )
        .max(
            100,
            "Username or email must not exceed 100 characters"
        ),


    password: yup
        .string()
        .required("Password is required")
        .min(
            4,
            "Password must be at least 4 characters"
        )
        .max(
            18,
            "Password is too long. Maximum 18 characters allowed."
        ),
});

type LoginFormData =
    yup.InferType<typeof loginSchema>;

type LoginResponse = {
    token?: string;
    role?: string;
    message?: string;
};

export default function LoginPage() {


    const [errorMessage, setErrorMessage] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(false);

    const [showPassword, setShowPassword] =
        useState(false);


    // =========================
    // REQUEST ADMIN STATES
    // =========================

    const [requestAdminOpen, setRequestAdminOpen] =
        useState(false);

    const [adminMessage, setAdminMessage] =
        useState("");

    const [requestAdminLoading, setRequestAdminLoading] =
        useState(false);

    const [requestAdminError, setRequestAdminError] =
        useState("");


    // =========================
    // SNACKBAR STATES
    // =========================

    const [snackbarOpen, setSnackbarOpen] =
        useState(false);

    const [snackbarMessage, setSnackbarMessage] =
        useState("");


    const router = useRouter();


    const {
        control,
        handleSubmit,
        reset,
        getValues,
        formState: {
            errors,
        },
    } = useForm<LoginFormData>({
        resolver:
            yupResolver(loginSchema),

        defaultValues: {
            username: "",
            password: "",
        },

        mode: "onChange",
    });


    // =========================
    // REQUEST ADMIN
    // =========================

    const handleRequestAdmin = async () => {

        if (requestAdminLoading) {
            return;
        }

        if (adminMessage.trim().length < 10) {

            setRequestAdminError(
                "Enter a valid reason in the description."
            );

            return;
        }

        setRequestAdminError("");
        setRequestAdminLoading(true);

        try {

            const response =
                await fetch(
                    "http://localhost:5011/api/Auth/request-admin",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            usernameOrEmail:
                                getValues(
                                    "username"
                                ).trim(),

                            message:
                                adminMessage.trim(),
                        }),
                    }
                );


            const responseText =
                await response.text();


            let result:
                { message?: string } | null =
                null;


            if (responseText) {

                try {

                    result =
                        JSON.parse(
                            responseText
                        );

                } catch {

                    result = null;
                }
            }


            if (!response.ok) {

                setRequestAdminError(
                    result?.message ||
                    "Unable to send the request. Please try again."
                );

                return;
            }


            setRequestAdminOpen(false);

            setAdminMessage("");

            setRequestAdminError("");


            setSnackbarMessage(
                result?.message ||
                "Your request has been sent to the admin successfully."
            );

            setSnackbarOpen(true);


        } catch (error) {

            console.error(
                "Request admin error:",
                error
            );

            setRequestAdminError(
                "Unable to connect to the server."
            );

        } finally {

            setRequestAdminLoading(false);
        }
    };


    // =========================
    // LOGIN
    // =========================

    const onSubmit = async (
        data: LoginFormData
    ) => {

        if (isLoading) {
            return;
        }

        setIsLoading(true);

        setErrorMessage("");

        try {

            const [response] =
                await Promise.all([

                    fetch(
                        "http://localhost:5011/api/Auth/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                username:
                                    data.username.trim(),

                                password:
                                    data.password,
                            }),
                        }
                    ),

                    new Promise<void>(
                        (resolve) => {
                            window.setTimeout(
                                resolve,
                                1500
                            );
                        }
                    ),

                ]);


            const responseText =
                await response.text();


            let result:
                LoginResponse | null =
                null;


            if (responseText) {

                try {

                    result =
                        JSON.parse(
                            responseText
                        ) as LoginResponse;

                } catch {

                    result = null;
                }
            }


            if (!response.ok) {

                setIsLoading(false);


                console.log(
                    "LOGIN STATUS:",
                    response.status
                );

                console.log(
                    "LOGIN RESULT:",
                    result
                );


                if (response.status === 403) {

                    setErrorMessage(
                        result?.message ||
                        "This account has been deactivated/Deleted. Please contact the admin."
                    );

                    setAdminMessage("");

                    setRequestAdminError("");

                    return;
                }


                if (response.status === 401) {

                    setErrorMessage(
                        "You entered an incorrect username/email or password."
                    );

                    return;
                }


                setErrorMessage(
                    result?.message ||
                    "Login failed. Please try again."
                );

                return;
            }


            if (!result?.token) {

                setIsLoading(false);

                setErrorMessage(
                    "Login succeeded, but no access token was returned."
                );

                return;
            }


            sessionStorage.setItem(
                "accessToken",
                result.token
            );


            reset();

            setShowPassword(false);


            if (
                result.role === "Admin"
            ) {

                router.push("/admin");

            } else if (
                result.role === "Librarian"
            ) {

                router.push("/librarian");

            } else {

                router.push("/user");
            }


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            await new Promise<void>(
                (resolve) => {
                    window.setTimeout(
                        resolve,
                        1500
                    );
                }
            );

            setIsLoading(false);

            setErrorMessage(
                "Unable to connect to the server."
            );
        }
    };


    return (
        <Box
            sx={{
                minHeight: "100vh",

                display: "grid",

                gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr 1fr",
                },

                background:
                    "linear-gradient(135deg, #F8F2E7 0%, #E6D6B9 100%)",
            }}
        >

            {/* =========================
            LEFT IMAGE SECTION
        ========================= */}

            <Box
                sx={{
                    display: {
                        xs: "none",
                        md: "flex",
                    },

                    position: "relative",

                    minHeight: "100vh",

                    flex: 1,

                    overflow: "hidden",

                    backgroundImage: `
            linear-gradient(
                135deg,
                rgba(62, 38, 22, 0.78),
                rgba(92, 58, 33, 0.48)
            ),
            url("/images/library-login.png")
        `,

                    backgroundSize: "cover",

                    backgroundPosition: "center",

                    backgroundRepeat: "no-repeat",
                }}
            >
                <Box
                    sx={{
                        position: "absolute",

                        inset: 0,

                        display: "flex",

                        alignItems: "flex-end",

                        p: {
                            md: 5,
                            lg: 7,
                            xl: 8,
                        },

                        color: "#FFFDF7",
                    }}
                >
                    <Box
                        sx={{
                            maxWidth: 500,
                        }}
                    >
                        <MenuBook
                            sx={{
                                fontSize: 42,
                                mb: 2,
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: {
                                    md: "2.3rem",
                                    lg: "3rem",
                                    xl: "3.2rem",
                                },

                                fontWeight: 600,

                                lineHeight: 1.15,

                                mb: 2,

                                letterSpacing: "-0.02em",
                            }}
                        >
                            Welcome back
                            <br />
                            to your library.
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: {
                                    md: "0.85rem",
                                    lg: "0.95rem",
                                },

                                lineHeight: 1.8,

                                opacity: 0.88,

                                maxWidth: 460,
                            }}
                        >
                            Every book opens a door
                            to another world.
                            Continue your reading
                            journey with us.
                        </Typography>
                    </Box>
                </Box>
            </Box>


            {/* =========================
            RIGHT FORM SECTION
        ========================= */}

            <Box
                sx={{
                    minHeight: "100vh",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    px: {
                        xs: 3,
                        sm: 5,
                        md: 7,
                        lg: 10,
                    },

                    py: 6,
                }}
            >

                <Box
                    sx={{
                        width: "100%",
                        maxWidth: 480,
                    }}
                >

                    <Typography
                        sx={{
                            color: "secondary.dark",

                            fontSize: "0.7rem",

                            letterSpacing: "0.25em",

                            fontWeight: 600,

                            mb: 1,
                        }}
                    >
                        MEMBER ACCESS
                    </Typography>


                    <Typography
                        sx={{
                            fontSize: {
                                xs: "2rem",
                                md: "2.8rem",
                            },

                            fontWeight: 600,

                            color: "text.primary",

                            mb: 1,
                        }}
                    >
                        Sign in
                    </Typography>


                    <Typography
                        sx={{
                            color: "text.secondary",

                            fontSize: "0.9rem",

                            mb: 4,
                        }}
                    >
                        Enter your details to continue
                        to your library.
                    </Typography>


                    {/* =========================
                    LOGIN FORM
                ========================= */}

                    <Box
                        component="form"
                        onSubmit={
                            handleSubmit(
                                onSubmit
                            )
                        }
                        sx={{
                            display: "flex",

                            flexDirection: "column",

                            gap: 2.5,
                        }}
                    >

                        {/* USERNAME OR EMAIL */}

                        <Controller
                            name="username"
                            control={control}
                            render={({
                                field,
                            }) => (
                                <TextField
                                    {...field}

                                    value={
                                        field.value ?? ""
                                    }

                                    label="Username or Email*"

                                    size="small"

                                    fullWidth

                                    disabled={
                                        isLoading
                                    }

                                    error={
                                        !!errors.username
                                    }

                                    helperText={
                                        errors
                                            .username
                                            ?.message
                                    }

                                    onChange={(e) => {

                                        field.onChange(
                                            e.target.value
                                        );

                                        if (
                                            errorMessage
                                        ) {
                                            setErrorMessage(
                                                ""
                                            );
                                        }
                                    }}

                                    slotProps={{
                                        htmlInput: {
                                            maxLength: 100,
                                        },

                                        input: {
                                            startAdornment:
                                                (
                                                    <InputAdornment
                                                        position="start"
                                                    >
                                                        <PersonOutlined />
                                                    </InputAdornment>
                                                ),
                                        },
                                    }}
                                />
                            )}
                        />


                        {/* PASSWORD */}

                        <Controller
                            name="password"
                            control={control}
                            render={({
                                field,
                            }) => (
                                <TextField
                                    {...field}

                                    value={
                                        field.value ?? ""
                                    }

                                    label="Password*"

                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }

                                    size="small"

                                    fullWidth

                                    disabled={
                                        isLoading
                                    }

                                    error={
                                        !!errors.password
                                    }

                                    helperText={
                                        errors.password?.message
                                    }

                                    onChange={(e) => {

                                        const value =
                                            e.target.value;

                                        /*
                                         * Do NOT limit the
                                         * value here.
                                         *
                                         * This allows the user
                                         * to type beyond 18
                                         * characters so Yup
                                         * can immediately show:
                                         *
                                         * Password is too long...
                                         */
                                        field.onChange(
                                            value
                                        );

                                        if (
                                            errorMessage
                                        ) {
                                            setErrorMessage(
                                                ""
                                            );
                                        }
                                    }}

                                    sx={{
                                        "& input::-ms-reveal": {
                                            display: "none",
                                        },

                                        "& input::-ms-clear": {
                                            display: "none",
                                        },
                                    }}

                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment
                                                    position="start"
                                                >
                                                    <LockOutlined />
                                                </InputAdornment>
                                            ),

                                            endAdornment: (
                                                <InputAdornment
                                                    position="end"
                                                >
                                                    <IconButton
                                                        onClick={() =>
                                                            setShowPassword(
                                                                (
                                                                    previous
                                                                ) =>
                                                                    !previous
                                                            )
                                                        }

                                                        onMouseDown={(
                                                            event
                                                        ) =>
                                                            event.preventDefault()
                                                        }

                                                        edge="end"

                                                        disabled={
                                                            isLoading
                                                        }

                                                        aria-label={
                                                            showPassword
                                                                ? "Hide password"
                                                                : "Show password"
                                                        }
                                                    >
                                                        {showPassword ? (
                                                            <VisibilityOff />
                                                        ) : (
                                                            <Visibility />
                                                        )}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            )}
                        />


                        {/* LOGIN BUTTON */}

                        <Button
                            type="submit"

                            fullWidth

                            disabled={
                                isLoading
                            }

                            sx={{
                                mt: 1,

                                py: 1.5,

                                minHeight: 50,

                                borderRadius: 1.5,

                                color: "#FFFDF7",

                                background:
                                    "linear-gradient(135deg, #5C3A21, #8A6545)",

                                "&:hover": {
                                    background:
                                        "linear-gradient(135deg, #3E2616, #6D3A32)",
                                },

                                "&.Mui-disabled": {
                                    color: "#FFFDF7",

                                    background:
                                        "linear-gradient(135deg, #5C3A21, #8A6545)",
                                },
                            }}
                        >
                            Login
                        </Button>

                    </Box>


                    {/* =========================
                    ERROR MESSAGE
                ========================= */}

                    {errorMessage && (
                        <Alert
                            severity="error"
                            sx={{
                                mt: 2,
                            }}
                        >
                            {errorMessage}

                            {errorMessage.includes(
                                "deactivated"
                            ) && (
                                    <Box
                                        component="button"
                                        type="button"

                                        onClick={() => {

                                            setRequestAdminOpen(
                                                true
                                            );

                                            setAdminMessage("");

                                            setRequestAdminError("");

                                            setErrorMessage("");
                                        }}

                                        sx={{
                                            display: "block",

                                            mt: 0.8,

                                            p: 0,

                                            border: "none",

                                            background: "transparent",

                                            color: "#5C3A21",

                                            fontWeight: 600,

                                            fontSize: "0.85rem",

                                            cursor: "pointer",

                                            textDecoration: "underline",

                                            fontFamily: "inherit",

                                            "&:hover": {
                                                color: "#3E2616",
                                            },
                                        }}
                                    >
                                        Request an admin
                                    </Box>
                                )}

                        </Alert>
                    )}


                    {/* =========================
                    SIGNUP
                ========================= */}

                    <Typography
                        sx={{
                            mt: 4,

                            textAlign: "center",

                            fontSize: "0.85rem",

                            color: "text.secondary",
                        }}
                    >
                        Don&apos;t have an account?{" "}

                        <Box
                            component={Link}
                            href="/signup"

                            sx={{
                                color: "primary.main",

                                fontWeight: 600,

                                textDecoration: "none",

                                pointerEvents:
                                    isLoading
                                        ? "none"
                                        : "auto",
                            }}
                        >
                            Create one
                        </Box>

                    </Typography>

                </Box>

            </Box>


            {/* =========================
            REQUEST ADMIN DIALOG
        ========================= */}

            <Dialog
                open={requestAdminOpen}

                onClose={() => {

                    if (!requestAdminLoading) {

                        setRequestAdminOpen(
                            false
                        );

                        setAdminMessage("");

                        setRequestAdminError("");
                    }
                }}

                fullWidth

                maxWidth="sm"
            >

                <DialogTitle
                    sx={{
                        color: "#3E2616",

                        fontWeight: 600,
                    }}
                >
                    Request an Admin
                </DialogTitle>


                <DialogContent>

                    <Typography
                        sx={{
                            color: "text.secondary",

                            fontSize: "0.85rem",

                            mb: 2.5,
                        }}
                    >
                        Send a message to the admin
                        requesting access to your account.
                    </Typography>


                    <TextField
                        fullWidth

                        label="Username or Email"

                        value={
                            getValues("username")
                        }

                        size="small"

                        disabled

                        sx={{
                            mb: 2.5,

                            "& .MuiOutlinedInput-root.Mui-disabled": {
                                backgroundColor:
                                    "rgba(62,38,22,0.04)",
                            },

                            "& .MuiInputLabel-root.Mui-disabled": {
                                color: "#6D3A32",
                            },

                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#B49A72",
                            },
                        }}
                    />


                    <TextField
                        fullWidth

                        multiline

                        minRows={4}

                        maxRows={6}

                        label="Description"

                        placeholder="Enter your message to the admin..."

                        value={adminMessage}

                        onChange={(event) => {

                            const value =
                                event.target.value.slice(
                                    0,
                                    150
                                );

                            setAdminMessage(
                                value
                            );

                            if (
                                requestAdminError
                            ) {
                                setRequestAdminError(
                                    ""
                                );
                            }
                        }}

                        disabled={
                            requestAdminLoading
                        }

                        error={
                            !!requestAdminError
                        }

                        slotProps={{
                            htmlInput: {
                                maxLength: 150,
                            },
                        }}

                        helperText={
                            requestAdminError
                                ? requestAdminError
                                : `${adminMessage.length} / 150`
                        }

                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 1.5,
                            },

                            "& .MuiFormHelperText-root": {
                                textAlign:
                                    requestAdminError
                                        ? "left"
                                        : "right",

                                marginRight: 0,
                            },
                        }}
                    />

                </DialogContent>


                <DialogActions
                    sx={{
                        px: 3,

                        pb: 3,

                        gap: 1,

                        justifyContent:
                            "space-between",
                    }}
                >

                    <Button
                        onClick={() => {

                            setRequestAdminOpen(
                                false
                            );

                            setAdminMessage("");

                            setRequestAdminError("");
                        }}

                        disabled={
                            requestAdminLoading
                        }

                        sx={{
                            color: "#5C3A21",

                            textTransform: "none",

                            fontWeight: 600,
                        }}
                    >
                        Cancel
                    </Button>


                    <Button
                        variant="contained"

                        onClick={
                            handleRequestAdmin
                        }

                        disabled={
                            requestAdminLoading
                        }

                        sx={{
                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            color: "#FFFDF7",

                            textTransform: "none",

                            borderRadius: 1.5,

                            px: 3,

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },

                            "&.Mui-disabled": {
                                color: "#FFFDF7",

                                background:
                                    "linear-gradient(135deg, #B49A72, #8A6545)",
                            },
                        }}
                    >
                        {requestAdminLoading
                            ? "Sending..."
                            : "Send Request"}
                    </Button>

                </DialogActions>

            </Dialog>


            {/* =========================
            SUCCESS SNACKBAR
        ========================= */}

            <Snackbar
                open={snackbarOpen}

                autoHideDuration={4000}

                onClose={() =>
                    setSnackbarOpen(false)
                }

                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}

                sx={{
                    bottom: {
                        xs: 24,
                        sm: 30,
                    },
                }}
            >
                <Alert
                    onClose={() =>
                        setSnackbarOpen(false)
                    }

                    severity="success"

                    variant="filled"

                    sx={{
                        width: "100%",
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>


            {/* =========================
            FULL SCREEN LOADER
        ========================= */}

            {isLoading && (
                <Box
                    sx={{
                        position: "fixed",

                        inset: 0,

                        width: "100vw",

                        height: "100vh",

                        zIndex: 99999,

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        backgroundColor:
                            "rgba(248, 242, 231, 0.72)",

                        backdropFilter:
                            "blur(6px)",

                        WebkitBackdropFilter:
                            "blur(6px)",
                    }}
                >

                    <Box
                        sx={{
                            width: 100,

                            height: 100,

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            color: "#5C3A21",

                            flexShrink: 0,
                        }}
                    >

                        <InfinityLoop
                            className="h-16 w-20"
                        />

                    </Box>

                </Box>
            )}

        </Box>
    );

}
