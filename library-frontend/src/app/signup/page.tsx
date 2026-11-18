"use client";

import Link from "next/link";
import {
    Box,
    Button,
    TextField,
    Typography,
    InputAdornment,
    Alert,
    IconButton,
} from "@mui/material";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
    useForm,
    Controller,
} from "react-hook-form";

import {
    yupResolver,
} from "@hookform/resolvers/yup";

import * as yup from "yup";

import {
    PhoneOutlined,
    MenuBook,
    PersonOutlined,
    BadgeOutlined,
    EmailOutlined,
    LockOutlined,
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";

import { InfinityLoop } from "@/components/infinity";

const API_URL = "http://localhost:5011/api/Auth";

/* =========================================================
   VALIDATION
========================================================= */

const signupSchema = yup.object({
    name: yup
        .string()
        .required("Full name is required")
        .matches(
            /^[A-Za-z ]+$/,
            "Full name can contain only letters and spaces"
        )
        .max(
            15,
            "Name must be 15 characters or less"
        ),

    username: yup
        .string()
        .required("Username is required")
        .matches(
            /^[A-Za-z0-9._]+$/,
            "Username can contain only letters, numbers, dots and underscores"
        )
        .max(
            15,
            "Username must be 15 characters or less"
        ),

    email: yup
        .string()
        .required("Email is required")
        .matches(
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/,
            "Enter a valid email"
        ),

    phone: yup
        .string()
        .required("Phone number is required")
        .matches(
            /^[0-9]{10}$/,
            "Phone number must contain exactly 10 digits"
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
            "Password must not exceed 18 characters"
        )
        .matches(
            /[A-Z]/,
            "Password must contain at least one uppercase letter"
        )
        .matches(
            /[a-z]/,
            "Password must contain at least one lowercase letter"
        )
        .matches(
            /[0-9]/,
            "Password must contain at least one number"
        )
        .matches(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character"
        ),

    confirmPassword: yup
        .string()
        .required("Please confirm your password")
        .max(
            18,
            "Confirm password must not exceed 18 characters"
        )
        .oneOf(
            [yup.ref("password")],
            "Passwords must match"
        ),
});

type SignupFormData =
    yup.InferType<typeof signupSchema>;

/* =========================================================
   API TYPES
========================================================= */

type SignupResponse = {
    message?: string;
    error?: string;
    detail?: string;
    title?: string;

    userId?: string;

    token?: string;
    Token?: string;
    accessToken?: string;

    username?: string;
    role?: string;

    errors?: Record<
        string,
        string[] | string
    >;
};

type CheckResponse = {
    exists: boolean;
};

/* =========================================================
   API ERROR MESSAGE
========================================================= */

const getApiErrorMessage = (
    result: SignupResponse,
    fallback: string
): string => {
    if (result.message) {
        return result.message;
    }

    if (result.error) {
        return result.error;
    }

    if (result.detail) {
        return result.detail;
    }

    if (result.title) {
        return result.title;
    }

    if (result.errors) {
        const messages = Object.values(
            result.errors
        ).flatMap((value) =>
            Array.isArray(value)
                ? value
                : [value]
        );

        if (messages.length > 0) {
            return messages[0];
        }
    }

    return fallback;
};

/* =========================================================
   PAGE
========================================================= */

export default function SignupPage() {
    const router = useRouter();

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        setError,
        clearErrors,
        formState: {
            errors,
        },
    } = useForm<SignupFormData>({
        resolver:
            yupResolver(signupSchema),

        defaultValues: {
            name: "",
            username: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
        },

        mode: "onChange",
    });

    /* =====================================================
       CHECK USERNAME
    ===================================================== */

    const checkUsername = async (
        username: string
    ) => {
        const value = username.trim();

        if (
            !value ||
            value.length < 4 ||
            !/^[A-Za-z0-9._]+$/.test(value)
        ) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/check-username?username=${encodeURIComponent(
                    value
                )}`
            );

            if (!response.ok) {
                return;
            }

            const result: CheckResponse =
                await response.json();

            if (result.exists) {
                setError("username", {
                    type: "manual",
                    message:
                        "Username already exists.",
                });
            }
        } catch (error) {
            console.error(
                "Username check error:",
                error
            );
        }
    };

    /* =====================================================
       CHECK EMAIL
    ===================================================== */

    const checkEmail = async (
        email: string
    ) => {
        const value = email.trim();

        if (
            !value ||
            !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/.test(
                value
            )
        ) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/check-email?email=${encodeURIComponent(
                    value
                )}`
            );

            if (!response.ok) {
                return;
            }

            const result: CheckResponse =
                await response.json();

            if (result.exists) {
                setError("email", {
                    type: "manual",
                    message:
                        "Email already exists.",
                });
            }
        } catch (error) {
            console.error(
                "Email check error:",
                error
            );
        }
    };

    /* =====================================================
       SUBMIT
    ===================================================== */

    const onSubmit = async (
        data: SignupFormData
    ) => {
        if (isSubmitting) {
            return;
        }

        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const name = data.name.trim();
            const username =
                data.username.trim();
            const email =
                data.email.trim();
            const phone =
                data.phone.trim();

            /* =============================================
               FINAL USERNAME CHECK
            ============================================= */

            const usernameResponse =
                await fetch(
                    `${API_URL}/check-username?username=${encodeURIComponent(
                        username
                    )}`
                );

            if (usernameResponse.ok) {
                const usernameResult: CheckResponse =
                    await usernameResponse.json();

                if (usernameResult.exists) {
                    setError("username", {
                        type: "manual",
                        message:
                            "Username already exists.",
                    });

                    return;
                }
            }

            /* =============================================
               FINAL EMAIL CHECK
            ============================================= */

            const emailResponse =
                await fetch(
                    `${API_URL}/check-email?email=${encodeURIComponent(
                        email
                    )}`
                );

            if (emailResponse.ok) {
                const emailResult: CheckResponse =
                    await emailResponse.json();

                if (emailResult.exists) {
                    setError("email", {
                        type: "manual",
                        message:
                            "Email already exists.",
                    });

                    return;
                }
            }

            /* =============================================
               CREATE ACCOUNT
            ============================================= */

            const [signupResponse] =
                await Promise.all([
                    fetch(
                        `${API_URL}/signup`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                name,
                                username,
                                email,
                                phone,
                                password:
                                    data.password,
                            }),
                        }
                    ),

                    new Promise<void>((resolve) => {
                        window.setTimeout(
                            resolve,
                            1500
                        );
                    }),
                ]);

            /* =============================================
               READ RESPONSE SAFELY
            ============================================= */

            let signupResult:
                SignupResponse = {};

            const responseText =
                await signupResponse.text();

            if (responseText) {
                try {
                    signupResult =
                        JSON.parse(
                            responseText
                        );
                } catch {
                    signupResult = {};
                }
            }

            console.log(
                "SIGNUP STATUS:",
                signupResponse.status
            );

            console.log(
                "SIGNUP RESULT:",
                signupResult
            );

            /* =============================================
               SIGNUP FAILED
            ============================================= */

            if (!signupResponse.ok) {
                /*
                 * USERNAME DUPLICATE
                 */

                if (
                    signupResponse.status ===
                    409 &&
                    signupResult.message
                        ?.toLowerCase()
                        .includes(
                            "username"
                        )
                ) {
                    setError(
                        "username",
                        {
                            type: "manual",
                            message:
                                "Username already exists.",
                        }
                    );

                    return;
                }

                /*
                 * EMAIL DUPLICATE
                 */

                if (
                    signupResponse.status ===
                    409 &&
                    signupResult.message
                        ?.toLowerCase()
                        .includes(
                            "email"
                        )
                ) {
                    setError(
                        "email",
                        {
                            type: "manual",
                            message:
                                "Email already exists.",
                        }
                    );

                    return;
                }

                /*
                 * OTHER BACKEND ERROR
                 */

                setErrorMessage(
                    getApiErrorMessage(
                        signupResult,
                        "Signup failed. Please try again."
                    )
                );

                return;
            }

            /* =============================================
               SIGNUP SUCCESS

               Your backend already creates JWT here.
               So DO NOT call /login again.
            ============================================= */

            const token =
                signupResult.token ||
                signupResult.Token ||
                signupResult.accessToken;

            if (!token) {
                console.error(
                    "Signup succeeded but no JWT token was returned:",
                    signupResult
                );

                setErrorMessage(
                    "Account created successfully, but access token was not received."
                );

                return;
            }

            /* =============================================
               SAVE TOKEN
            ============================================= */

            sessionStorage.setItem(
                "accessToken",
                token
            );

            /* =============================================
               SAVE USERNAME
            ============================================= */

            sessionStorage.setItem(
                "username",
                signupResult.username ||
                username
            );

            /* =============================================
               SAVE ROLE
            ============================================= */

            sessionStorage.setItem(
                "role",
                signupResult.role ||
                "User"
            );

            /* =============================================
               OPTIONAL USER ID
            ============================================= */

            if (signupResult.userId) {
                sessionStorage.setItem(
                    "userId",
                    signupResult.userId
                );
            }

            /* =============================================
               CLEAR FORM
            ============================================= */

            reset();

            setShowPassword(false);
            setShowConfirmPassword(false);

            /* =============================================
               GO TO USER DASHBOARD
            ============================================= */

            router.replace("/user");
        } catch (error) {
            console.error(
                "Signup error:",
                error
            );

            setErrorMessage(
                "Unable to connect to the server."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    /* =====================================================
       UI
    ===================================================== */

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
            {/* =================================================
                LEFT IMAGE
            ================================================= */}

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
            url("/images/library-signup.png")
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

                        pb: {
                            md: 8,
                            lg: 10,
                            xl: 11,
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
                            Begin your
                            <br />
                            reading journey.
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
                            Join a community
                            of readers and
                            discover stories
                            waiting to become
                            part of yours.
                        </Typography>
                    </Box>
                </Box>
            </Box>


            {/* =================================================
                RIGHT FORM
            ================================================= */}

            <Box
                sx={{
                    minHeight:
                        "100vh",

                    display: "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    px: {
                        xs: 3,
                        sm: 5,
                        md: 7,
                        lg: 10,
                    },

                    py: 5,
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        maxWidth: 520,
                    }}
                >
                    {/* HEADER */}

                    <Typography
                        sx={{
                            color:
                                "secondary.dark",

                            fontSize:
                                "0.7rem",

                            letterSpacing:
                                "0.25em",

                            fontWeight:
                                600,

                            mb: 1,
                        }}
                    >
                        BECOME A MEMBER
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: {
                                xs:
                                    "2rem",
                                md:
                                    "2.8rem",
                            },

                            fontWeight:
                                600,

                            color:
                                "text.primary",

                            mb: 1,
                        }}
                    >
                        Create account
                    </Typography>

                    <Typography
                        sx={{
                            color:
                                "text.secondary",

                            fontSize:
                                "0.9rem",

                            mb: 3,
                        }}
                    >
                        Create your library
                        account and start
                        exploring.
                    </Typography>

                    {/* FORM */}

                    <Box
                        component="form"
                        onSubmit={handleSubmit(
                            onSubmit
                        )}
                        sx={{
                            display:
                                "flex",

                            flexDirection:
                                "column",

                            gap: 2,
                        }}
                    >
                        {/* =================================================
                            FULL NAME
                        ================================================= */}

                        <Controller
                            name="name"
                            control={control}
                            render={({
                                field,
                            }) => (
                                <TextField
                                    {...field}
                                    value={
                                        field.value ??
                                        ""
                                    }
                                    label="Full Name*"
                                    size="small"
                                    fullWidth
                                    disabled={
                                        isSubmitting
                                    }
                                    error={
                                        !!errors.name
                                    }
                                    helperText={
                                        errors
                                            .name
                                            ?.message
                                    }
                                    onChange={(
                                        e
                                    ) => {
                                        const value =
                                            e
                                                .target
                                                .value
                                                .replace(
                                                    /[^A-Za-z ]/g,
                                                    ""
                                                )

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
                                    slotProps={{

                                        input: {
                                            startAdornment:
                                                (
                                                    <InputAdornment position="start">
                                                        <PersonOutlined />
                                                    </InputAdornment>
                                                ),
                                        },
                                    }}
                                />
                            )}
                        />

                        {/* =================================================
                            USERNAME
                        ================================================= */}

                        <Controller
                            name="username"
                            control={control}
                            render={({
                                field,
                            }) => (
                                <TextField
                                    {...field}
                                    value={
                                        field.value ??
                                        ""
                                    }
                                    label="Username*"
                                    size="small"
                                    fullWidth
                                    disabled={
                                        isSubmitting
                                    }
                                    error={
                                        !!errors.username
                                    }
                                    helperText={
                                        errors
                                            .username
                                            ?.message
                                    }
                                    onBlur={async (
                                        e
                                    ) => {
                                        field.onBlur();

                                        await checkUsername(
                                            e
                                                .target
                                                .value
                                        );
                                    }}
                                    onChange={(
                                        e
                                    ) => {
                                        const value =
                                            e
                                                .target
                                                .value
                                                .replace(
                                                    /[^A-Za-z0-9._]/g,
                                                    ""
                                                )

                                        field.onChange(
                                            value
                                        );

                                        if (
                                            errors
                                                .username
                                                ?.type ===
                                            "manual"
                                        ) {
                                            clearErrors(
                                                "username"
                                            );
                                        }

                                        if (
                                            errorMessage
                                        ) {
                                            setErrorMessage(
                                                ""
                                            );
                                        }
                                    }}
                                    slotProps={{

                                        input: {
                                            startAdornment:
                                                (
                                                    <InputAdornment position="start">
                                                        <BadgeOutlined />
                                                    </InputAdornment>
                                                ),
                                        },
                                    }}
                                />
                            )}
                        />

                        {/* =================================================
                            EMAIL
                        ================================================= */}

                        <Controller
                            name="email"
                            control={control}
                            render={({
                                field,
                            }) => (
                                <TextField
                                    {...field}
                                    value={
                                        field.value ??
                                        ""
                                    }
                                    label="Email*"
                                    type="email"
                                    size="small"
                                    fullWidth
                                    disabled={
                                        isSubmitting
                                    }
                                    error={
                                        !!errors.email
                                    }
                                    helperText={
                                        errors
                                            .email
                                            ?.message
                                    }
                                    onBlur={async (
                                        e
                                    ) => {
                                        field.onBlur();

                                        await checkEmail(
                                            e
                                                .target
                                                .value
                                        );
                                    }}
                                    onChange={(
                                        e
                                    ) => {
                                        field.onChange(
                                            e
                                                .target
                                                .value
                                        );

                                        if (
                                            errors
                                                .email
                                                ?.type ===
                                            "manual"
                                        ) {
                                            clearErrors(
                                                "email"
                                            );
                                        }

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
                                            maxLength:
                                                100,
                                        },

                                        input: {
                                            startAdornment:
                                                (
                                                    <InputAdornment position="start">
                                                        <EmailOutlined />
                                                    </InputAdornment>
                                                ),
                                        },
                                    }}
                                />
                            )}
                        />

                        {/* =================================================
                            PHONE
                        ================================================= */}

                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={
                                        field.value
                                            ? field.value
                                                .replace(/\D/g, "")
                                                .slice(0, 10)
                                                .replace(
                                                    /(\d{5})(\d{0,5})/,
                                                    "$1 $2"
                                                )
                                                .trim()
                                            : ""
                                    }
                                    label="Phone*"
                                    type="tel"
                                    size="small"
                                    fullWidth
                                    disabled={isSubmitting}
                                    error={!!errors.phone}
                                    helperText={errors.phone?.message}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 10);

                                        field.onChange(value);

                                        if (errorMessage) {
                                            setErrorMessage("");
                                        }
                                    }}
                                    slotProps={{
                                        htmlInput: {
                                            maxLength: 11,
                                            inputMode: "numeric",
                                        },

                                        input: {
                                            startAdornment: (
                                                <InputAdornment
                                                    position="start"
                                                    sx={{
                                                        marginRight: "6px",
                                                        color: "inherit",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <PhoneOutlined sx={{ mr: 0.5 }} />

                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            fontSize: "inherit",
                                                            fontWeight: "inherit",
                                                            lineHeight: "inherit",
                                                            color: "inherit",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        +91
                                                    </Typography>
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            )}
                        />

                        {/* =================================================
                            PASSWORD
                        ================================================= */}

                        <Controller
                            name="password"
                            control={control}
                            render={({
                                field,
                            }) => (
                                <TextField
                                    {...field}
                                    value={
                                        field.value ??
                                        ""
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
                                        isSubmitting
                                    }
                                    error={
                                        !!errors.password
                                    }
                                    helperText={
                                        errors
                                            .password
                                            ?.message
                                    }
                                    autoComplete="new-password"
                                    onChange={(
                                        e
                                    ) => {
                                        const value =
                                            e.target.value;

                                        /*
                                         * IMPORTANT:
                                         * Do NOT limit the
                                         * input to 18 here.
                                         *
                                         * This allows the user
                                         * to type the 19th
                                         * character so Yup can
                                         * immediately display:
                                         *
                                         * "Password must not
                                         * exceed 18 characters"
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
                                        "& input::-ms-reveal":
                                        {
                                            display:
                                                "none",
                                        },

                                        "& input::-ms-clear":
                                        {
                                            display:
                                                "none",
                                        },

                                        "& input::-webkit-credentials-auto-fill-button":
                                        {
                                            visibility:
                                                "hidden",

                                            pointerEvents:
                                                "none",

                                            position:
                                                "absolute",

                                            right: 0,
                                        },
                                    }}
                                    slotProps={{
                                        htmlInput: {
                                            autoComplete:
                                                "new-password",
                                        },

                                        input: {
                                            startAdornment:
                                                (
                                                    <InputAdornment position="start">
                                                        <LockOutlined />
                                                    </InputAdornment>
                                                ),

                                            endAdornment:
                                                (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            type="button"
                                                            edge="end"
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                            onClick={() =>
                                                                setShowPassword(
                                                                    (
                                                                        previous
                                                                    ) =>
                                                                        !previous
                                                                )
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

                        {/* =================================================
                            CONFIRM PASSWORD
                        ================================================= */}

                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({
                                field,
                            }) => (
                                <TextField
                                    {...field}
                                    value={
                                        field.value ??
                                        ""
                                    }
                                    label="Confirm Password*"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    size="small"
                                    fullWidth
                                    disabled={
                                        isSubmitting
                                    }
                                    error={
                                        !!errors.confirmPassword
                                    }
                                    helperText={
                                        errors
                                            .confirmPassword
                                            ?.message
                                    }
                                    autoComplete="new-password"
                                    onChange={(
                                        e
                                    ) => {
                                        const value =
                                            e.target.value;

                                        /*
                                         * IMPORTANT:
                                         * Do NOT limit the
                                         * input to 18 here.
                                         *
                                         * The user can type
                                         * beyond 18 and Yup
                                         * will show the error
                                         * immediately.
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
                                        "& input::-ms-reveal":
                                        {
                                            display:
                                                "none",
                                        },

                                        "& input::-ms-clear":
                                        {
                                            display:
                                                "none",
                                        },

                                        "& input::-webkit-credentials-auto-fill-button":
                                        {
                                            visibility:
                                                "hidden",

                                            pointerEvents:
                                                "none",

                                            position:
                                                "absolute",

                                            right: 0,
                                        },
                                    }}
                                    slotProps={{
                                        htmlInput: {
                                            autoComplete:
                                                "new-password",
                                        },

                                        input: {
                                            startAdornment:
                                                (
                                                    <InputAdornment position="start">
                                                        <LockOutlined />
                                                    </InputAdornment>
                                                ),

                                            endAdornment:
                                                (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            type="button"
                                                            edge="end"
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                            onClick={() =>
                                                                setShowConfirmPassword(
                                                                    (
                                                                        previous
                                                                    ) =>
                                                                        !previous
                                                                )
                                                            }
                                                            aria-label={
                                                                showConfirmPassword
                                                                    ? "Hide confirm password"
                                                                    : "Show confirm password"
                                                            }
                                                        >
                                                            {showConfirmPassword ? (
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

                        {/* =================================================
                            CREATE ACCOUNT BUTTON
                        ================================================= */}

                        <Button
                            type="submit"
                            fullWidth
                            disabled={
                                isSubmitting
                            }
                            sx={{
                                mt: 1,

                                py: 1.5,

                                minHeight: 50,

                                borderRadius: 1.5,

                                color:
                                    "#FFFDF7",

                                background:
                                    "linear-gradient(135deg, #5C3A21, #8A6545)",

                                "&:hover":
                                {
                                    background:
                                        "linear-gradient(135deg, #3E2616, #6D3A32)",
                                },

                                "&.Mui-disabled":
                                {
                                    color:
                                        "#FFFDF7",

                                    background:
                                        "linear-gradient(135deg, #5C3A21, #8A6545)",
                                },
                            }}
                        >
                            {isSubmitting
                                ? "Creating Account..."
                                : "Create Account"}
                        </Button>

                        {/* =================================================
                            ERROR MESSAGE
                        ================================================= */}

                        {errorMessage && (
                            <Alert
                                severity="error"
                                sx={{
                                    mt: 2,
                                }}
                            >
                                {errorMessage}
                            </Alert>
                        )}
                    </Box>

                    {/* =================================================
                        LOGIN LINK
                    ================================================= */}

                    <Typography
                        sx={{
                            mt: 3,

                            textAlign:
                                "center",

                            fontSize:
                                "0.85rem",

                            color:
                                "text.secondary",
                        }}
                    >
                        Already have an account?{" "}

                        <Box
                            component={Link}
                            href="/login"
                            sx={{
                                color:
                                    "primary.main",

                                fontWeight:
                                    600,

                                textDecoration:
                                    "none",

                                pointerEvents:
                                    isSubmitting
                                        ? "none"
                                        : "auto",
                            }}
                        >
                            Sign in
                        </Box>
                    </Typography>
                </Box>
            </Box>

            {/* =================================================
                FULL SCREEN LOADER
            ================================================= */}

            {isSubmitting && (
                <Box
                    sx={{
                        position:
                            "fixed",

                        inset: 0,

                        width:
                            "100vw",

                        height:
                            "100vh",

                        zIndex:
                            99999,

                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",

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

                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "center",

                            color:
                                "#5C3A21",

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
