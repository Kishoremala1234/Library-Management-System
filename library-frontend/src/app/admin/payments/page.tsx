"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Box,
    Card,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    Pagination,
    TextField,
    Typography,
    Button,
    Divider,
} from "@mui/material";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

const API_BASE_URL = "http://localhost:5011";

const PAYMENTS_PER_PAGE = 10;

type PaymentStatus =
    | "Paid"
    | "Pending"
    | "Failed";

type PaymentPurpose =
    | "Book"
    | "Fine"
    | "Unknown";

type Payment = {
    paymentId: string;
    userId: string;
    bookId: string | null;
    userName: string;
    email: string;
    bookTitle: string | null;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    transactionReference: string | null;
    paymentPurpose?: string | null;
    createdAt: string;
    completedAt: string | null;
};

type AdminWallet = {
    walletId: string;
    balance: number;
};

export default function AdminPaymentsPage() {
    const router = useRouter();

    const [payments, setPayments] =
        useState<Payment[]>([]);

    const [wallet, setWallet] =
        useState<AdminWallet | null>(null);

    const [showBalance, setShowBalance] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [walletLoading, setWalletLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [walletError, setWalletError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [selectedStatus, setSelectedStatus] =
        useState("");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [actionAnchorEl, setActionAnchorEl] =
        useState<null | HTMLElement>(null);

    const [selectedPayment, setSelectedPayment] =
        useState<Payment | null>(null);

    const [detailsOpen, setDetailsOpen] =
        useState(false);

    const [actionPayment, setActionPayment] =
        useState<Payment | null>(null);

    const actionMenuOpen =
        Boolean(actionAnchorEl);

    /* =========================================================
       FETCH PAYMENTS
    ========================================================= */

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                setError("");

                const token =
                    sessionStorage.getItem(
                        "accessToken"
                    );

                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch(
                    `${API_BASE_URL}/api/Admin/payments`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 401) {
                    router.push("/login");
                    return;
                }

                if (response.status === 403) {
                    router.push("/user");
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        "Failed to load payments."
                    );
                }

                const data =
                    await response.json();

                setPayments(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (err) {
                console.error(
                    "Payment fetch error:",
                    err
                );

                setError(
                    "Unable to load payment data."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [router]);

    /* =========================================================
       FETCH ADMIN WALLET
    ========================================================= */

    useEffect(() => {
        const fetchAdminWallet = async () => {
            try {
                setWalletLoading(true);
                setWalletError("");

                const token =
                    sessionStorage.getItem(
                        "accessToken"
                    );

                if (!token) {
                    router.push("/login");
                    return;
                }

                let response = await fetch(
                    `${API_BASE_URL}/api/Admin/wallet`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    response = await fetch(
                        `${API_BASE_URL}/api/Payment/admin/balance`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                }

                if (response.status === 401) {
                    router.push("/login");
                    return;
                }

                if (response.status === 403) {
                    router.push("/user");
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        "Failed to load admin wallet."
                    );
                }

                const data =
                    await response.json();

                setWallet({
                    walletId: data.walletId || "",
                    balance:
                        typeof data.balance === "number"
                            ? data.balance
                            : Number(data.balance ?? 0),
                });
            } catch (err) {
                console.error(
                    "Admin wallet fetch error:",
                    err
                );

                setWalletError(
                    "Unable to load account balance."
                );
            } finally {
                setWalletLoading(false);
            }
        };

        fetchAdminWallet();
    }, [router]);

    /* =========================================================
       NORMALIZE STATUS
    ========================================================= */

    const getDisplayStatus = (
        status: string
    ): PaymentStatus => {
        const normalized =
            status
                ?.trim()
                .toLowerCase();

        if (
            normalized === "paid" ||
            normalized === "completed" ||
            normalized === "success" ||
            normalized === "successful"
        ) {
            return "Paid";
        }

        if (
            normalized === "pending" ||
            normalized === "processing"
        ) {
            return "Pending";
        }

        return "Failed";
    };

    /* =========================================================
       PAYMENT PURPOSE
    ========================================================= */

    const getPaymentPurpose = (
        payment: Payment
    ): PaymentPurpose => {
        const purpose =
            payment.paymentPurpose
                ?.trim()
                .toLowerCase();

        if (
            purpose === "book" ||
            purpose === "book payment" ||
            purpose === "purchase"
        ) {
            return "Book";
        }

        if (
            purpose === "fine" ||
            purpose === "fine payment" ||
            purpose === "late fine"
        ) {
            return "Fine";
        }

        return "Unknown";
    };

    /* =========================================================
       PURPOSE STYLE
    ========================================================= */

    const getPurposeStyles = (
        purpose: PaymentPurpose
    ) => {
        if (purpose === "Book") {
            return {
                backgroundColor:
                    "rgba(92,58,33,0.10)",
                color: "#5C3A21",
            };
        }

        if (purpose === "Fine") {
            return {
                backgroundColor:
                    "rgba(184,134,11,0.12)",
                color: "#8B6508",
            };
        }

        return {
            backgroundColor:
                "rgba(111,98,91,0.10)",
            color: "#6F625B",
        };
    };

    /* =========================================================
       FORMAT DATE
    ========================================================= */

    const formatDate = (
        date: string | null
    ) => {
        if (!date) {
            return "—";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "—";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatDateTime = (
        date: string | null
    ) => {
        if (!date) {
            return "—";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "—";
        }

        return parsedDate.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    /* =========================================================
       ACTION MENU
    ========================================================= */

    const handleActionMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        payment: Payment
    ) => {
        setActionAnchorEl(
            event.currentTarget
        );

        setActionPayment(payment);
    };

    const handleActionMenuClose = () => {
        setActionAnchorEl(null);
    };

    /* =========================================================
       VIEW DETAILS
    ========================================================= */

    const handleViewDetails = () => {
        if (!actionPayment) {
            return;
        }

        setSelectedPayment(
            actionPayment
        );

        handleActionMenuClose();

        setDetailsOpen(true);
    };

    /* =========================================================
       VIEW USER
    ========================================================= */

    const handleViewUser = () => {
        if (!actionPayment) {
            return;
        }

        handleActionMenuClose();

        router.push(
            `/admin/users?userId=${actionPayment.userId}`
        );
    };

    /* =========================================================
       FILTER
    ========================================================= */

    const filteredPayments = useMemo(() => {
        const searchValue =
            search
                .trim()
                .toLowerCase();

        return payments.filter(
            (payment) => {
                const displayStatus =
                    getDisplayStatus(
                        payment.paymentStatus
                    );

                const transactionId =
                    payment.transactionReference ||
                    "";

                const purpose =
                    getPaymentPurpose(
                        payment
                    );

                const matchesSearch =
                    !searchValue ||
                    payment.userName
                        ?.toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    payment.email
                        ?.toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    transactionId
                        .toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    payment.bookTitle
                        ?.toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    payment.paymentMethod
                        ?.toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    purpose
                        .toLowerCase()
                        .includes(
                            searchValue
                        );

                const matchesStatus =
                    !selectedStatus ||
                    displayStatus ===
                    selectedStatus;

                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );
    }, [
        payments,
        search,
        selectedStatus,
    ]);

    /* =========================================================
       CALCULATED REVENUE / BALANCE
    ========================================================= */

    const totalCalculatedBalance = useMemo(() => {
        return payments
            .filter((p) => {
                const status = getDisplayStatus(p.paymentStatus);
                return status === "Paid";
            })
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }, [payments]);

    const displayBalance =
        wallet?.balance !== undefined && wallet?.balance !== null
            ? wallet.balance
            : totalCalculatedBalance;

    /* =========================================================
       PAGINATION
    ========================================================= */

    const totalPages = Math.ceil(
        filteredPayments.length /
        PAYMENTS_PER_PAGE
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
        PAYMENTS_PER_PAGE;

    const paginatedPayments =
        filteredPayments.slice(
            startIndex,
            startIndex +
            PAYMENTS_PER_PAGE
        );

    const handleSearchChange = (
        value: string
    ) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleStatusChange = (
        value: string
    ) => {
        setSelectedStatus(value);
        setCurrentPage(1);
    };

    const handlePageChange = (
        _event: React.ChangeEvent<unknown>,
        page: number
    ) => {
        setCurrentPage(page);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /* =========================================================
       STATUS STYLE
    ========================================================= */

    const getStatusStyles = (
        status: PaymentStatus
    ) => {
        if (status === "Paid") {
            return {
                backgroundColor:
                    "rgba(76,120,75,0.10)",
                color: "#4C784B",
            };
        }

        if (status === "Pending") {
            return {
                backgroundColor:
                    "rgba(184,134,11,0.10)",
                color: "#8B6508",
            };
        }

        return {
            backgroundColor:
                "rgba(180,35,24,0.10)",
            color: "#B42318",
        };
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
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
                <Typography
                    sx={{
                        color: "#5C3A21",
                        fontWeight: 600,
                    }}
                >
                    Loading payments...
                </Typography>
            </Box>
        );
    }

    /* =========================================================
       PAGE
    ========================================================= */

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
            {/* =====================================================
                HEADER
            ===================================================== */}

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
                    mb: 3,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems:
                            "flex-start",
                        gap: 1.5,
                        ml: 2,
                        transform:
                            "translateX(-20px)",
                    }}
                >
                    <IconButton
                        onClick={() =>
                            router.push(
                                "/admin"
                            )
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
                                fontWeight: 600,
                                mb: 1,
                            }}
                        >
                            PAYMENT MANAGEMENT
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
                            Payments
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
                            Manage user payments
                            and transaction
                            history.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* =====================================================
                ADMIN ACCOUNT BALANCE
            ===================================================== */}

            <Card
                sx={{
                    maxWidth: 900,
                    mb: 4,
                    borderRadius: 4,
                    overflow: "hidden",
                    background:
                        "linear-gradient(135deg, #5C3A21, #8A6545)",
                    color: "#FFFDF7",
                    boxShadow:
                        "0 12px 35px rgba(62,38,22,0.18)",
                }}
            >
                <Box
                    sx={{
                        p: {
                            xs: 3,
                            md: 4,
                        },
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "center",
                            gap: 3,
                            flexWrap:
                                "wrap",
                        }}
                    >
                        <Box>
                            <Box
                                sx={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <AccountBalanceWalletOutlinedIcon />

                                <Typography
                                    sx={{
                                        fontSize:
                                            "0.8rem",
                                        letterSpacing:
                                            "0.12em",
                                        opacity:
                                            0.85,
                                    }}
                                >
                                    ADMIN ACCOUNT
                                    BALANCE
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap: 1,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: {
                                            xs: "2rem",
                                            md: "3rem",
                                        },
                                        fontWeight:
                                            700,
                                        letterSpacing:
                                            "0.02em",
                                    }}
                                >
                                    {walletLoading && payments.length === 0
                                        ? "₹..."
                                        : showBalance
                                            ? `₹${displayBalance.toLocaleString(
                                                "en-IN",
                                                {
                                                    minimumFractionDigits:
                                                        2,
                                                    maximumFractionDigits:
                                                        2,
                                                }
                                            )}`
                                            : "₹XXXX.XX"}
                                </Typography>

                                <IconButton
                                    onClick={() =>
                                        setShowBalance(
                                            (
                                                previous
                                            ) =>
                                                !previous
                                        )
                                    }
                                    aria-label={
                                        showBalance
                                            ? "Hide balance"
                                            : "Show balance"
                                    }
                                    sx={{
                                        color:
                                            "#FFFDF7",

                                        ml: 0.5,

                                        "&:hover": {
                                            backgroundColor:
                                                "rgba(255,255,255,0.12)",
                                        },
                                    }}
                                >
                                    {showBalance ? (
                                        <VisibilityOffOutlinedIcon />
                                    ) : (
                                        <VisibilityOutlinedIcon />
                                    )}
                                </IconButton>
                            </Box>

                            {walletError && payments.length === 0 && (
                                <Typography
                                    sx={{
                                        mt: 1,
                                        fontSize:
                                            "0.75rem",
                                        color:
                                            "#F5D7C8",
                                    }}
                                >
                                    {walletError}
                                </Typography>
                            )}
                        </Box>

                        {/* NO ADD MONEY BUTTON FOR ADMIN */}

                        <Box
                            sx={{
                                px: 2.5,
                                py: 1.5,
                                borderRadius: 2,
                                backgroundColor:
                                    "rgba(255,255,255,0.10)",
                                border:
                                    "1px solid rgba(255,255,255,0.16)",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize:
                                        "0.72rem",
                                    opacity:
                                        0.75,
                                    mb: 0.3,
                                }}
                            >
                                PAYMENT RECEIVED
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.85rem",
                                    fontWeight:
                                        600,
                                }}
                            >
                                Books & Fines
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Card>

            {/* =====================================================
                ERROR
            ===================================================== */}

            {error && (
                <Card
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 3,
                        backgroundColor:
                            "rgba(180,35,24,0.06)",
                        border:
                            "1px solid rgba(180,35,24,0.15)",
                    }}
                >
                    <Typography
                        sx={{
                            color: "#B42318",
                            fontSize:
                                "0.85rem",
                        }}
                    >
                        {error}
                    </Typography>
                </Card>
            )}

            {/* =====================================================
                SEARCH + FILTER
            ===================================================== */}

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 3,
                    flexWrap: "wrap",
                }}
            >
                <Box
                    sx={{
                        flex: 1,
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
                        placeholder="Search user, transaction ID, book, or payment type..."
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlinedIcon
                                            sx={{
                                                color: "#8A6545",
                                            }}
                                        />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: 3,

                            boxShadow:
                                "0 4px 20px rgba(62, 38, 22, 0.05)",

                            "& .MuiOutlinedInput-root": {
                                borderRadius: 3,
                                backgroundColor:
                                    "#FFFFFF",

                                "& fieldset": {
                                    borderColor:
                                        "#5C3A21",
                                    borderWidth: 1.5,
                                },

                                "&:hover fieldset": {
                                    borderColor:
                                        "#3E2616",
                                },

                                "&.Mui-focused fieldset": {
                                    borderColor:
                                        "#5C3A21",
                                    borderWidth: 2,
                                },
                            },
                        }}
                    />
                </Box>

                <TextField
                    select
                    value={selectedStatus}
                    onChange={(event) =>
                        handleStatusChange(
                            event.target.value
                        )
                    }
                    size="medium"
                    sx={{
                        minWidth: {
                            xs: 145,
                            sm: 170,
                        },

                        "& .MuiOutlinedInput-root": {
                            backgroundColor:
                                "#FFFFFF",

                            borderRadius: 1.5,

                            "& fieldset": {
                                borderColor:
                                    "#5C3A21",
                                borderWidth: 1.5,
                            },

                            "&:hover fieldset": {
                                borderColor:
                                    "#3E2616",
                            },

                            "&.Mui-focused fieldset": {
                                borderColor:
                                    "#5C3A21",
                                borderWidth: 2,
                            },
                        },

                        "& .MuiSelect-select": {
                            color: "#3E2616",
                            fontSize:
                                "1rem",
                        },

                        "& .MuiSelect-icon": {
                            color:
                                "#5C3A21",
                        },
                    }}
                    slotProps={{
                        select: {
                            displayEmpty: true,
                        },
                    }}
                >
                    <MenuItem value="">
                        All Status
                    </MenuItem>

                    <MenuItem value="Paid">
                        Paid
                    </MenuItem>

                    <MenuItem value="Pending">
                        Pending
                    </MenuItem>

                    <MenuItem value="Failed">
                        Failed
                    </MenuItem>
                </TextField>
            </Box>

            {/* =====================================================
                RESULT COUNT
            ===================================================== */}

            <Typography
                sx={{
                    mb: 2.5,
                    fontSize: "0.85rem",
                    color: "#7A6B63",
                    fontWeight: 600,
                }}
            >
                {filteredPayments.length}{" "}
                {filteredPayments.length === 1
                    ? "payment"
                    : "payments"}{" "}
                found
            </Typography>

            {/* =====================================================
                PAYMENT LIST
            ===================================================== */}

            {filteredPayments.length === 0 ? (
                <Card
                    sx={{
                        p: 5,
                        textAlign: "center",
                        borderRadius: 3,
                        background:
                            "rgba(255,253,247,0.92)",
                        boxShadow:
                            "0 10px 30px rgba(62,38,22,0.08)",
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 600,
                            color: "#3E2616",
                        }}
                    >
                        No payments found
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
                            ? `No payments match "${search}".`
                            : "There are no payments to display."}
                    </Typography>
                </Card>
            ) : (
                <>
                    <Card
                        sx={{
                            borderRadius: 3,
                            overflow: "hidden",
                            background:
                                "rgba(255,253,247,0.95)",
                            boxShadow:
                                "0 10px 30px rgba(62,38,22,0.08)",
                        }}
                    >
                        {/* =================================================
                            TABLE HEADER
                        ================================================= */}

                        <Box
                            sx={{
                                display: {
                                    xs: "none",
                                    md: "grid",
                                },

                                gridTemplateColumns:
                                    "minmax(150px, 1.2fr) minmax(150px, 1.1fr) minmax(120px, 0.9fr) 100px 110px 100px 120px 52px",

                                alignItems:
                                    "center",

                                px: 3,
                                py: 1.8,

                                backgroundColor:
                                    "rgba(92,58,33,0.2)",

                                borderBottom:
                                    "1px solid rgba(92,58,33,0.12)",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize:
                                        "0.72rem",
                                    fontWeight:
                                        700,
                                    color:
                                        "#5C3A21",
                                    letterSpacing:
                                        "0.04em",
                                }}
                            >
                                USER
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.72rem",
                                    fontWeight:
                                        700,
                                    color:
                                        "#5C3A21",
                                    letterSpacing:
                                        "0.04em",
                                    transform:
                                        "translateX(-36px)",
                                }}
                            >
                                TRANSACTION
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.72rem",
                                    fontWeight:
                                        700,
                                    color:
                                        "#5C3A21",
                                    letterSpacing:
                                        "0.04em",
                                    transform:
                                        "translateX(4px)",
                                }}
                            >
                                BOOK
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.72rem",
                                    fontWeight:
                                        700,
                                    color:
                                        "#5C3A21",
                                    letterSpacing:
                                        "0.04em",
                                    textAlign:
                                        "right",
                                    transform: "translateX(-20px)",

                                }}
                            >
                                TYPE
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.72rem",
                                    fontWeight:
                                        700,
                                    color:
                                        "#5C3A21",
                                    letterSpacing:
                                        "0.04em",
                                    textAlign:
                                        "right",
                                    transform: "translateX(-25px)",
                                }}
                            >
                                AMOUNT
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.72rem",
                                    fontWeight:
                                        700,
                                    color:
                                        "#5C3A21",
                                    letterSpacing:
                                        "0.04em",
                                    textAlign:
                                        "right",
                                    transform: "translateX(-30px)",
                                }}
                            >
                                DATE
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.72rem",
                                    fontWeight:
                                        700,
                                    color:
                                        "#5C3A21",
                                    letterSpacing:
                                        "0.04em",
                                    textAlign:
                                        "right",
                                    transform: "translateX(-30px)",
                                }}
                            >
                                STATUS
                            </Typography>

                            <Box />
                        </Box>

                        {/* =================================================
                            PAYMENT ROWS
                        ================================================= */}

                        {paginatedPayments.map(
                            (
                                payment,
                                index
                            ) => {
                                const status =
                                    getDisplayStatus(
                                        payment.paymentStatus
                                    );

                                const purpose =
                                    getPaymentPurpose(
                                        payment
                                    );

                                return (
                                    <Box
                                        key={
                                            payment.paymentId
                                        }
                                        sx={{
                                            display: {
                                                xs: "flex",
                                                md: "grid",
                                            },

                                            gridTemplateColumns:
                                            {
                                                md:
                                                    "minmax(150px, 1.2fr) minmax(150px, 1.1fr) minmax(120px, 0.9fr) 100px 110px 100px 120px 52px",
                                            },

                                            alignItems:
                                                "center",

                                            gap: {
                                                xs: 1.5,
                                                md: 2,
                                            },

                                            px: {
                                                xs: 1.5,
                                                sm: 2,
                                                md: 3,
                                            },

                                            py: {
                                                xs: 1.7,
                                                md: 1.8,
                                            },

                                            backgroundColor:
                                                index % 2 === 0
                                                    ? "rgba(92,58,33,0.025)"
                                                    : "rgba(92,58,33,0.07)",

                                            borderBottom:
                                                index <
                                                    paginatedPayments.length -
                                                    1
                                                    ? "1px solid rgba(92,58,33,0.08)"
                                                    : "none",

                                            transition:
                                                "background-color 0.2s ease",

                                            // "&:hover": {
                                            //     backgroundColor:
                                            //         "rgba(92,58,33,0.035)",
                                            // },
                                        }}
                                    >
                                        {/* USER */}

                                        <Box
                                            sx={{
                                                minWidth:
                                                    0,
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize:
                                                        "0.85rem",
                                                    fontWeight:
                                                        600,
                                                    color:
                                                        "#3E2616",
                                                    overflow:
                                                        "hidden",
                                                    textOverflow:
                                                        "ellipsis",
                                                    whiteSpace:
                                                        "nowrap",
                                                }}
                                            >
                                                {
                                                    payment.userName
                                                }
                                            </Typography>
                                        </Box>

                                        {/* TRANSACTION */}

                                        <Typography
                                            sx={{
                                                display:
                                                {
                                                    xs:
                                                        "none",
                                                    md:
                                                        "block",
                                                },

                                                minWidth:
                                                    0,

                                                fontSize:
                                                    "0.8rem",

                                                color:
                                                    "#6F625B",

                                                fontWeight:
                                                    500,

                                                overflow:
                                                    "hidden",

                                                textOverflow:
                                                    "ellipsis",

                                                whiteSpace:
                                                    "nowrap",

                                                ml: -8,
                                            }}
                                        >
                                            {payment.transactionReference
                                                ? `${payment.transactionReference.slice(0, 15)}...`
                                                : "—"}
                                        </Typography>

                                        {/* BOOK */}

                                        <Typography
                                            sx={{
                                                display:
                                                {
                                                    xs:
                                                        "none",
                                                    md:
                                                        "block",
                                                },

                                                minWidth:
                                                    0,

                                                fontSize:
                                                    "0.8rem",

                                                color:
                                                    "#6F625B",

                                                overflow:
                                                    "hidden",

                                                textOverflow:
                                                    "ellipsis",

                                                whiteSpace:
                                                    "nowrap",

                                                ml: -6,
                                            }}
                                        >
                                            {payment.bookTitle ||
                                                (purpose ===
                                                    "Fine"
                                                    ? "Late return fine"
                                                    : "—")}
                                        </Typography>

                                        {/* PAYMENT TYPE */}

                                        <Box
                                            sx={{
                                                display:
                                                {
                                                    xs:
                                                        "none",
                                                    md:
                                                        "flex",
                                                },

                                                justifyContent:
                                                    "flex-end",
                                                transform: "translateX(-65px)",
                                            }}
                                        >
                                            <Chip
                                                label={
                                                    purpose
                                                }
                                                size="small"
                                                sx={{
                                                    ...getPurposeStyles(
                                                        purpose
                                                    ),

                                                    fontSize:
                                                        "0.65rem",

                                                    height:
                                                        25,

                                                    fontWeight:
                                                        600,

                                                }}
                                            />
                                        </Box>

                                        {/* AMOUNT */}

                                        <Typography
                                            sx={{
                                                display:
                                                {
                                                    xs:
                                                        "none",
                                                    md:
                                                        "block",
                                                },

                                                fontSize:
                                                    "0.85rem",

                                                fontWeight:
                                                    700,

                                                color:
                                                    "#3E2616",

                                                textAlign:
                                                    "right",

                                                whiteSpace:
                                                    "nowrap",

                                                transform:
                                                    "translateX(-95px)",
                                            }}
                                        >
                                            ₹
                                            {Number(
                                                payment.amount
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </Typography>

                                        {/* DATE */}

                                        <Typography
                                            sx={{
                                                display:
                                                {
                                                    xs:
                                                        "none",
                                                    md:
                                                        "block",
                                                },

                                                fontSize:
                                                    "0.78rem",

                                                color:
                                                    "#6F625B",

                                                textAlign:
                                                    "right",

                                                whiteSpace:
                                                    "nowrap",

                                                transform:
                                                    "translateX(-85px)",
                                            }}
                                        >
                                            {formatDate(
                                                payment.createdAt
                                            )}
                                        </Typography>

                                        {/* STATUS */}

                                        <Box
                                            sx={{
                                                display:
                                                {
                                                    xs:
                                                        "none",
                                                    md:
                                                        "flex",
                                                },

                                                justifyContent:
                                                    "flex-end",

                                                alignItems:
                                                    "center",

                                                width:
                                                    "100%",

                                                transform:
                                                    "translateX(-130px)",
                                            }}
                                        >
                                            <Chip
                                                label={
                                                    status
                                                }
                                                size="small"
                                                sx={{
                                                    ...getStatusStyles(
                                                        status
                                                    ),

                                                    fontSize:
                                                        "0.68rem",

                                                    height:
                                                        25,

                                                    fontWeight:
                                                        600,
                                                }}
                                            />
                                        </Box>

                                        {/* MOBILE INFO */}

                                        <Box
                                            sx={{
                                                display:
                                                {
                                                    xs:
                                                        "flex",
                                                    md:
                                                        "none",
                                                },

                                                alignItems:
                                                    "center",

                                                gap: 1,

                                                ml:
                                                    "auto",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    textAlign:
                                                        "right",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            "0.82rem",
                                                        fontWeight:
                                                            700,
                                                        color:
                                                            "#3E2616",
                                                    }}
                                                >
                                                    ₹
                                                    {Number(
                                                        payment.amount
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </Typography>

                                                <Chip
                                                    label={
                                                        purpose
                                                    }
                                                    size="small"
                                                    sx={{
                                                        ...getPurposeStyles(
                                                            purpose
                                                        ),

                                                        mt:
                                                            0.4,

                                                        fontSize:
                                                            "0.6rem",

                                                        height:
                                                            22,

                                                        fontWeight:
                                                            600,
                                                    }}
                                                />

                                                <Chip
                                                    label={
                                                        status
                                                    }
                                                    size="small"
                                                    sx={{
                                                        ...getStatusStyles(
                                                            status
                                                        ),

                                                        mt:
                                                            0.4,

                                                        ml:
                                                            0.5,

                                                        fontSize:
                                                            "0.6rem",

                                                        height:
                                                            22,

                                                        fontWeight:
                                                            600,
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        {/* ACTIONS */}

                                        <Box
                                            sx={{
                                                display:
                                                    "flex",

                                                justifyContent:
                                                    "flex-end",

                                                transform:
                                                    "translateX(-8px)",
                                            }}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={(
                                                    event
                                                ) =>
                                                    handleActionMenuOpen(
                                                        event,
                                                        payment
                                                    )
                                                }
                                                sx={{
                                                    color:
                                                        "#5C3A21",

                                                    width:
                                                        36,

                                                    height:
                                                        36,

                                                    "&:hover":
                                                    {
                                                        backgroundColor:
                                                            "rgba(92,58,33,0.08)",
                                                    },
                                                }}
                                            >
                                                <MoreVertOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                );
                            }
                        )}
                    </Card>

                    {/* =================================================
                        ACTION MENU
                    ================================================= */}

                    <Menu
                        anchorEl={
                            actionAnchorEl
                        }
                        open={
                            actionMenuOpen
                        }
                        onClose={
                            handleActionMenuClose
                        }
                        anchorOrigin={{
                            vertical:
                                "bottom",
                            horizontal:
                                "right",
                        }}
                        transformOrigin={{
                            vertical:
                                "top",
                            horizontal:
                                "right",
                        }}
                        slotProps={{
                            paper: {
                                sx: {
                                    mt: 0.5,
                                    minWidth: 175,
                                    borderRadius: 2,
                                    boxShadow:
                                        "0 8px 25px rgba(62,38,22,0.15)",
                                    border:
                                        "1px solid rgba(92,58,33,0.08)",
                                },
                            },
                        }}
                    >
                        <MenuItem
                            onClick={
                                handleViewDetails
                            }
                            sx={{
                                py: 1.1,
                                color:
                                    "#5C3A21",
                            }}
                        >
                            <VisibilityOutlinedIcon
                                fontSize="small"
                                sx={{
                                    mr: 1.5,
                                    color:
                                        "#5C3A21",
                                }}
                            />

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.85rem",
                                }}
                            >
                                View Details
                            </Typography>
                        </MenuItem>

                        <MenuItem
                            onClick={
                                handleViewUser
                            }
                            sx={{
                                py: 1.1,
                                color:
                                    "#5C3A21",
                            }}
                        >
                            <PersonOutlinedIcon
                                fontSize="small"
                                sx={{
                                    mr: 1.5,
                                    color:
                                        "#5C3A21",
                                }}
                            />

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.85rem",
                                }}
                            >
                                View User
                            </Typography>
                        </MenuItem>
                    </Menu>

                    {/* =================================================
                        PAGINATION
                    ================================================= */}

                    {filteredPayments.length >
                        PAYMENTS_PER_PAGE && (
                            <Box
                                sx={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "center",
                                    alignItems:
                                        "center",
                                    py: 3,
                                    mt: 2,
                                    borderRadius: 3,
                                    backgroundColor:
                                        "rgba(255,253,247,0.92)",
                                    boxShadow:
                                        "0 6px 20px rgba(62,38,22,0.05)",
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
                </>
            )}

            {/* =====================================================
                PAYMENT DETAILS DIALOG
            ===================================================== */}

            <Dialog
                open={detailsOpen}
                onClose={() =>
                    setDetailsOpen(false)
                }
                fullWidth
                maxWidth="sm"
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            backgroundColor:
                                "#FFFDF7",
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "space-between",
                        color: "#3E2616",
                        fontWeight: 600,
                    }}
                >
                    Payment Details

                    <IconButton
                        onClick={() =>
                            setDetailsOpen(
                                false
                            )
                        }
                        sx={{
                            color:
                                "#6F625B",
                        }}
                    >
                        <CloseOutlinedIcon />
                    </IconButton>
                </DialogTitle>

                <Divider />

                <DialogContent
                    sx={{
                        py: 3,
                    }}
                >
                    {selectedPayment && (
                        <Box
                            sx={{
                                display:
                                    "flex",
                                flexDirection:
                                    "column",
                                gap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                    {
                                        xs:
                                            "1fr",
                                        sm:
                                            "160px 1fr",
                                    },
                                    gap: 1.5,
                                }}
                            >
                                {/* USER */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    User
                                </Typography>

                                <Typography
                                    sx={{
                                        color:
                                            "#3E2616",
                                        fontWeight:
                                            600,
                                        fontSize:
                                            "0.85rem",
                                    }}
                                >
                                    {
                                        selectedPayment.userName
                                    }
                                </Typography>

                                {/* EMAIL */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Email
                                </Typography>

                                <Typography
                                    sx={{
                                        color:
                                            "#6F625B",
                                        fontSize:
                                            "0.85rem",
                                    }}
                                >
                                    {
                                        selectedPayment.email
                                    }
                                </Typography>

                                {/* PAYMENT PURPOSE */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Payment For
                                </Typography>

                                <Box>
                                    <Chip
                                        label={getPaymentPurpose(
                                            selectedPayment
                                        )}
                                        size="small"
                                        sx={{
                                            ...getPurposeStyles(
                                                getPaymentPurpose(
                                                    selectedPayment
                                                )
                                            ),
                                            fontSize:
                                                "0.68rem",
                                            height:
                                                25,
                                            fontWeight:
                                                600,
                                        }}
                                    />
                                </Box>

                                {/* BOOK */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Book
                                </Typography>

                                <Typography
                                    sx={{
                                        color:
                                            "#3E2616",
                                        fontWeight:
                                            600,
                                        fontSize:
                                            "0.85rem",
                                    }}
                                >
                                    {
                                        selectedPayment.bookTitle ||
                                        (getPaymentPurpose(
                                            selectedPayment
                                        ) ===
                                            "Fine"
                                            ? "Late return fine"
                                            : "—")
                                    }
                                </Typography>

                                {/* TRANSACTION */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Transaction ID
                                </Typography>

                                <Typography
                                    sx={{
                                        color:
                                            "#3E2616",
                                        fontWeight:
                                            600,
                                        fontSize:
                                            "0.85rem",
                                        wordBreak:
                                            "break-all",
                                    }}
                                >
                                    {selectedPayment.transactionReference ||
                                        "—"}
                                </Typography>

                                {/* AMOUNT */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Amount
                                </Typography>

                                <Typography
                                    sx={{
                                        color:
                                            "#3E2616",
                                        fontSize:
                                            "0.95rem",
                                        fontWeight:
                                            700,
                                    }}
                                >
                                    ₹
                                    {Number(
                                        selectedPayment.amount
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </Typography>

                                {/* PAYMENT METHOD */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Payment Method
                                </Typography>

                                <Typography
                                    sx={{
                                        color:
                                            "#6F625B",
                                        fontSize:
                                            "0.85rem",
                                    }}
                                >
                                    {
                                        selectedPayment.paymentMethod
                                    }
                                </Typography>

                                {/* CREATED AT */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Created At
                                </Typography>

                                <Typography
                                    sx={{
                                        color:
                                            "#6F625B",
                                        fontSize:
                                            "0.85rem",
                                    }}
                                >
                                    {formatDateTime(
                                        selectedPayment.createdAt
                                    )}
                                </Typography>

                                {/* COMPLETED AT */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Completed At
                                </Typography>

                                <Typography
                                    sx={{
                                        color:
                                            "#6F625B",
                                        fontSize:
                                            "0.85rem",
                                    }}
                                >
                                    {formatDateTime(
                                        selectedPayment.completedAt
                                    )}
                                </Typography>

                                {/* STATUS */}

                                <Typography
                                    sx={{
                                        color:
                                            "#8A7B72",
                                        fontSize:
                                            "0.8rem",
                                    }}
                                >
                                    Status
                                </Typography>

                                <Box>
                                    <Chip
                                        label={getDisplayStatus(
                                            selectedPayment.paymentStatus
                                        )}
                                        size="small"
                                        sx={{
                                            ...getStatusStyles(
                                                getDisplayStatus(
                                                    selectedPayment.paymentStatus
                                                )
                                            ),
                                            fontSize:
                                                "0.68rem",
                                            height:
                                                25,
                                            fontWeight:
                                                600,
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <Box
                    sx={{
                        p: 2,
                        display: "flex",
                        justifyContent:
                            "flex-end",
                    }}
                >
                    <Button
                        onClick={() =>
                            setDetailsOpen(
                                false
                            )
                        }
                        sx={{
                            color:
                                "#5C3A21",
                            textTransform:
                                "none",
                            fontWeight:
                                500,
                        }}
                    >
                        Close
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}