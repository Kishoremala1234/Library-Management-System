"use client";

import { useEffect, useState } from "react";
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
    MenuItem,
    Snackbar,
    TextField,
    Typography,
    Pagination,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

type Borrowing = {
    borrowingId: string;
    userId: string;
    username: string;
    name: string;
    bookId: string;
    title: string;
    author: string;
    borrowedDate: string;
    dueDate: string;
    returnedDate: string | null;
    fine: number;
    status: string;
};

type AdminUser = {
    userId: string;
    username: string;
    name: string;
    isActive: boolean;
};

type AdminBook = {
    bookId: string;
    title: string;
    author: string;
    availableCopies: number;
};

type ConfirmAction = "notify" | null;

type BorrowingFilter =
    | "all"
    | "borrowed"
    | "due"
    | "completed";

const BORROWINGS_PER_PAGE = 10;

export default function AdminBorrowingsPage() {
    const router = useRouter();

    const [borrowings, setBorrowings] =
        useState<Borrowing[]>([]);

    const [users, setUsers] =
        useState<AdminUser[]>([]);

    const [books, setBooks] =
        useState<AdminBook[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // =========================================================
    // BORROWING FILTER
    // =========================================================

    const [borrowingFilter, setBorrowingFilter] =
        useState<BorrowingFilter>("all");

    // =========================================================
    // PAGINATION
    // =========================================================

    const [currentPage, setCurrentPage] =
        useState(1);

    // =========================================================
    // BORROW DIALOG
    // =========================================================

    const [openDialog, setOpenDialog] =
        useState(false);

    const [selectedUser, setSelectedUser] =
        useState("");

    const [selectedBook, setSelectedBook] =
        useState("");

    const [dueDate, setDueDate] =
        useState("");

    // Separate errors for each mandatory field
    const [userError, setUserError] =
        useState("");

    const [bookError, setBookError] =
        useState("");

    const [dueDateError, setDueDateError] =
        useState("");

    // General/API error
    const [formError, setFormError] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    // =========================================================
    // NOTIFY CONFIRMATION
    // =========================================================

    const [confirmOpen, setConfirmOpen] =
        useState(false);

    const [confirmAction, setConfirmAction] =
        useState<ConfirmAction>(null);

    const [
        selectedBorrowing,
        setSelectedBorrowing,
    ] = useState<Borrowing | null>(null);

    const [
        processingNotification,
        setProcessingNotification,
    ] = useState(false);

    // =========================================================
    // SNACKBAR
    // =========================================================

    const [snackbarOpen, setSnackbarOpen] =
        useState(false);

    const [snackbarMessage, setSnackbarMessage] =
        useState("");

    const [snackbarSeverity, setSnackbarSeverity] =
        useState<"success" | "error">("success");

    const showSnackbar = (
        message: string,
        severity: "success" | "error" = "success"
    ) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // =========================================================
    // LOAD DATA
    // =========================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                const token =
                    sessionStorage.getItem(
                        "accessToken"
                    );

                if (!token) {
                    router.replace("/login");
                    return;
                }

                const getData = async (
                    url: string,
                    name: string
                ) => {
                    const response =
                        await fetch(url, {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        });

                    const text =
                        await response.text();

                    let result;

                    try {
                        result = text
                            ? JSON.parse(text)
                            : null;
                    } catch {
                        throw new Error(
                            `${name} API returned a non-JSON response:\n${text}`
                        );
                    }

                    if (!response.ok) {
                        if (
                            response.status ===
                            401
                        ) {
                            sessionStorage.removeItem(
                                "accessToken"
                            );

                            router.replace(
                                "/login"
                            );

                            return null;
                        }

                        if (
                            response.status ===
                            403
                        ) {
                            router.replace(
                                "/user"
                            );

                            return null;
                        }

                        throw new Error(
                            result?.message ||
                            `${name} API failed with status ${response.status}`
                        );
                    }

                    return result;
                };

                const borrowingsResult =
                    await getData(
                        "http://localhost:5011/api/Admin/borrowings",
                        "Borrowings"
                    );

                const usersResult =
                    await getData(
                        "http://localhost:5011/api/Admin/users",
                        "Users"
                    );

                const booksResult =
                    await getData(
                        "http://localhost:5011/api/Admin/books",
                        "Books"
                    );

                if (
                    borrowingsResult !==
                    null
                ) {
                    setBorrowings(
                        Array.isArray(
                            borrowingsResult
                        )
                            ? borrowingsResult
                            : []
                    );
                }

                if (
                    usersResult !== null
                ) {
                    setUsers(
                        Array.isArray(
                            usersResult
                        )
                            ? usersResult
                            : []
                    );
                }

                if (
                    booksResult !== null
                ) {
                    setBooks(
                        Array.isArray(
                            booksResult
                        )
                            ? booksResult
                            : []
                    );
                }
            } catch (error) {
                console.error(
                    "Admin borrowing data error:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load borrowing data."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    // =========================================================
    // BACK BUTTON
    // =========================================================

    const handleBack = () => {
        router.push("/admin");
    };

    // =========================================================
    // DEFAULT DUE DATE
    // =========================================================

    const getDefaultDueDate = () => {
        const date = new Date();

        date.setDate(
            date.getDate() + 7
        );

        date.setHours(17, 0, 0, 0);

        const year =
            date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        const hours = String(
            date.getHours()
        ).padStart(2, "0");

        const minutes = String(
            date.getMinutes()
        ).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // =========================================================
    // OPEN BORROW DIALOG
    // =========================================================

    const handleBorrowClick = () => {
        setSelectedUser("");
        setSelectedBook("");
        setDueDate(
            getDefaultDueDate()
        );

        setUserError("");
        setBookError("");
        setDueDateError("");
        setFormError("");

        setOpenDialog(true);
    };

    // =========================================================
    // BORROW BOOK
    // =========================================================

    const handleBorrow = async () => {
        // Clear previous validation errors
        setUserError("");
        setBookError("");
        setDueDateError("");
        setFormError("");

        let hasValidationError = false;

        // USER VALIDATION
        if (!selectedUser) {
            setUserError(
                "Please select a user."
            );

            hasValidationError = true;
        }

        // BOOK VALIDATION
        if (!selectedBook) {
            setBookError(
                "Please select a book."
            );

            hasValidationError = true;
        }

        // DUE DATE VALIDATION
        if (!dueDate) {
            setDueDateError(
                "Please select a due date."
            );

            hasValidationError = true;
        }

        // Stop only after showing all respective errors
        if (hasValidationError) {
            return;
        }

        const selectedBookData =
            books.find(
                (book) =>
                    book.bookId ===
                    selectedBook
            );

        if (
            selectedBookData &&
            selectedBookData.availableCopies <=
            0
        ) {
            setBookError(
                "No copies are available for this book."
            );

            return;
        }

        try {
            setSaving(true);

            const token =
                sessionStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                router.replace("/login");
                return;
            }

            const response =
                await fetch(
                    "http://localhost:5011/api/Admin/borrowings",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body: JSON.stringify({
                            userId:
                                selectedUser,

                            bookId:
                                selectedBook,

                            dueDate:
                                new Date(
                                    dueDate
                                ).toISOString(),
                        }),
                    }
                );

            const text =
                await response.text();

            let result = null;

            try {
                result = text
                    ? JSON.parse(text)
                    : null;
            } catch {
                result = null;
            }

            if (!response.ok) {
                if (
                    response.status ===
                    401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace(
                        "/login"
                    );

                    return;
                }

                if (
                    response.status ===
                    403
                ) {
                    router.replace(
                        "/user"
                    );

                    return;
                }

                setFormError(
                    result?.message ||
                    "Unable to borrow book."
                );

                return;
            }

            setOpenDialog(false);

            setSelectedUser("");
            setSelectedBook("");
            setDueDate("");

            setUserError("");
            setBookError("");
            setDueDateError("");
            setFormError("");

            // =================================================
            // REFRESH BORROWINGS
            // =================================================

            const borrowingsResponse =
                await fetch(
                    "http://localhost:5011/api/Admin/borrowings",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const borrowingsText =
                await borrowingsResponse.text();

            if (
                borrowingsResponse.ok
            ) {
                const borrowingsResult =
                    borrowingsText
                        ? JSON.parse(
                            borrowingsText
                        )
                        : [];

                const updatedBorrowings =
                    Array.isArray(
                        borrowingsResult
                    )
                        ? borrowingsResult
                        : [];

                setBorrowings(
                    updatedBorrowings
                );

                setCurrentPage(1);
            }

            // =================================================
            // REFRESH BOOKS
            // =================================================

            const booksResponse =
                await fetch(
                    "http://localhost:5011/api/Admin/books",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const booksText =
                await booksResponse.text();

            if (booksResponse.ok) {
                const booksResult =
                    booksText
                        ? JSON.parse(
                            booksText
                        )
                        : [];

                setBooks(
                    Array.isArray(
                        booksResult
                    )
                        ? booksResult
                        : []
                );
            }

            showSnackbar(
                "Book borrowed successfully."
            );
        } catch (error) {
            console.error(
                "Borrow book error:",
                error
            );

            setFormError(
                "Unable to connect to the server."
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // OPEN NOTIFY CONFIRMATION
    // =========================================================

    const openNotifyConfirmation = (
        borrowing: Borrowing
    ) => {
        setSelectedBorrowing(
            borrowing
        );

        setConfirmAction("notify");
        setConfirmOpen(true);
    };

    // =========================================================
    // CLOSE CONFIRMATION
    // =========================================================

    const closeConfirmation = () => {
        if (
            processingNotification
        ) {
            return;
        }

        setConfirmOpen(false);
        setConfirmAction(null);
        setSelectedBorrowing(null);
    };

    // =========================================================
    // SEND NOTIFICATION
    // =========================================================

    const handleConfirmNotify = async () => {
        if (
            !selectedBorrowing ||
            confirmAction !== "notify"
        ) {
            return;
        }

        try {
            setProcessingNotification(
                true
            );

            const token =
                sessionStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                router.replace("/login");
                return;
            }

            const response =
                await fetch(
                    `http://localhost:5011/api/Admin/borrowings/${selectedBorrowing.borrowingId}/notify`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const text =
                await response.text();

            let result = null;

            try {
                result = text
                    ? JSON.parse(text)
                    : null;
            } catch {
                result = null;
            }

            if (!response.ok) {
                if (
                    response.status ===
                    401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace(
                        "/login"
                    );

                    return;
                }

                if (
                    response.status ===
                    403
                ) {
                    router.replace(
                        "/user"
                    );

                    return;
                }

                showSnackbar(
                    result?.message ||
                    "Unable to send notification.",
                    "error"
                );

                return;
            }

            setConfirmOpen(false);
            setConfirmAction(null);
            setSelectedBorrowing(null);

            showSnackbar(
                "Return notification sent successfully."
            );
        } catch (error) {
            console.error(
                "Notify user error:",
                error
            );

            showSnackbar(
                "Unable to connect to the server.",
                "error"
            );
        } finally {
            setProcessingNotification(
                false
            );
        }
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (
        date: string
    ) => {
        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }
        );
    };

    // =========================================================
    // FILTER BORROWINGS
    // =========================================================

    const filteredBorrowings =
        borrowings.filter((item) => {
            if (
                borrowingFilter ===
                "all"
            ) {
                return true;
            }

            if (
                borrowingFilter ===
                "borrowed"
            ) {
                return (
                    item.status !==
                    "Returned"
                );
            }

            if (
                borrowingFilter ===
                "due"
            ) {
                return (
                    item.status ===
                    "Due" ||
                    item.status ===
                    "Overdue"
                );
            }

            if (
                borrowingFilter ===
                "completed"
            ) {
                return (
                    item.status ===
                    "Returned"
                );
            }

            return true;
        });

    // =========================================================
    // FILTER CHANGE
    // =========================================================

    const handleBorrowingFilterChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setBorrowingFilter(
            event.target
                .value as BorrowingFilter
        );

        setCurrentPage(1);
    };

    // =========================================================
    // PAGINATION CALCULATION
    // =========================================================

    const totalPages = Math.ceil(
        filteredBorrowings.length /
        BORROWINGS_PER_PAGE
    );

    const startIndex =
        (currentPage - 1) *
        BORROWINGS_PER_PAGE;

    const endIndex =
        startIndex +
        BORROWINGS_PER_PAGE;

    const paginatedBorrowings =
        filteredBorrowings.slice(
            startIndex,
            endIndex
        );

    // =========================================================
    // PAGE CHANGE
    // =========================================================

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

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        "center",
                }}
            >
                <Typography color="text.secondary">
                    Loading borrowings...
                </Typography>
            </Box>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        "center",
                    px: 2,
                }}
            >
                <Typography color="error">
                    {error}
                </Typography>
            </Box>
        );
    }

    // =========================================================
    // UI
    // =========================================================

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
                    mb: 3,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        minWidth: 0,
                    }}
                >
                    <IconButton
                        onClick={handleBack}
                        sx={{
                            color: "#5C3A21",
                            backgroundColor:
                                "rgba(255,255,255,0.45)",
                            mt: {
                                xs: 3.7,
                                sm: 4.7,
                            },

                            flexShrink: 0,

                            "&:hover": {
                                backgroundColor:
                                    "rgba(255,255,255,0.7)",
                            },
                        }}
                    >
                        <ArrowBackOutlinedIcon />
                    </IconButton>

                    <Box
                        sx={{
                            minWidth: 0,
                        }}
                    >
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
                            BORROWING MANAGEMENT
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: {
                                    xs:
                                        "1.8rem",
                                    md:
                                        "2.6rem",
                                },
                                fontWeight:
                                    600,
                            }}
                        >
                            Borrowings
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
                            Manage book borrowing
                            and return records.
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            "flex-end",
                        gap: 1.5,
                        flexWrap: "wrap",
                        flexShrink: 0,
                    }}
                >
                    <TextField
                        select
                        value={
                            borrowingFilter
                        }
                        onChange={
                            handleBorrowingFilterChange
                        }
                        size="small"
                        sx={{
                            minWidth: {
                                xs: 150,
                                sm: 180,
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
                                fontFamily:
                                    "Poppins, sans-serif",
                            },

                            "& .MuiSelect-icon":
                            {
                                color:
                                    "#5C3A21",
                            },
                        }}
                    >
                        <MenuItem value="all">
                            All Borrowings
                        </MenuItem>

                        <MenuItem value="borrowed">
                            Currently Borrowed
                        </MenuItem>

                        <MenuItem value="due">
                            Due / Overdue
                        </MenuItem>

                        <MenuItem value="completed">
                            Completed
                        </MenuItem>
                    </TextField>

                    <Button
                        startIcon={
                            <AddOutlinedIcon />
                        }
                        onClick={
                            handleBorrowClick
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

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },
                        }}
                    >
                        Borrow Book
                    </Button>
                </Box>
            </Box>

            {/* =================================================
                BORROWINGS
            ================================================= */}

            {filteredBorrowings.length ===
                0 ? (
                <Card
                    sx={{
                        p: 5,
                        textAlign:
                            "center",
                        borderRadius: 3,
                        background:
                            "rgba(255,253,247,0.9)",
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 600,
                        }}
                    >
                        No borrowing records
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
                        No records found for
                        the selected borrowing
                        type.
                    </Typography>
                </Card>
            ) : (
                <Card
                    sx={{
                        borderRadius: 3,
                        background:
                            "transparent",
                        boxShadow:
                            "none",
                    }}
                >
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                        }}
                    >
                        {paginatedBorrowings.map(
                            (item) => (
                                <Card
                                    key={
                                        item.borrowingId
                                    }
                                    sx={{
                                        p: {
                                            xs: 2,
                                            md: 3,
                                        },

                                        borderRadius:
                                            3,

                                        background:
                                            "rgba(255,253,247,0.9)",

                                        boxShadow:
                                            "0 10px 30px rgba(62,38,22,0.08)",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display:
                                                "grid",

                                            gridTemplateColumns:
                                            {
                                                xs: "1fr",
                                                md: "1fr 1fr 190px",
                                            },

                                            gap: 3,

                                            alignItems:
                                                "center",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                minWidth:
                                                    0,
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize:
                                                        "0.7rem",
                                                    color:
                                                        "text.secondary",
                                                }}
                                            >
                                                MEMBER
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.4,
                                                    fontWeight:
                                                        600,
                                                    fontSize:
                                                        "0.9rem",
                                                }}
                                            >
                                                {
                                                    item.name
                                                }
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.2,
                                                    fontSize:
                                                        "0.75rem",
                                                    color:
                                                        "text.secondary",
                                                }}
                                            >
                                                @
                                                {
                                                    item.username
                                                }
                                            </Typography>
                                        </Box>

                                        <Box
                                            sx={{
                                                minWidth:
                                                    0,
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize:
                                                        "0.7rem",
                                                    color:
                                                        "text.secondary",
                                                }}
                                            >
                                                BOOK
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.4,
                                                    fontWeight:
                                                        600,
                                                    fontSize:
                                                        "0.9rem",
                                                    overflow:
                                                        "hidden",
                                                    textOverflow:
                                                        "ellipsis",
                                                    whiteSpace:
                                                    {
                                                        xs:
                                                            "normal",
                                                        md:
                                                            "nowrap",
                                                    },
                                                }}
                                            >
                                                {
                                                    item.title
                                                }
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.2,
                                                    fontSize:
                                                        "0.75rem",
                                                    color:
                                                        "text.secondary",
                                                }}
                                            >
                                                {
                                                    item.author
                                                }
                                            </Typography>
                                        </Box>

                                        <Box
                                            sx={{
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                {
                                                    xs:
                                                        "space-between",
                                                    md:
                                                        "flex-end",
                                                },
                                                gap: 1.5,
                                                minWidth:
                                                    0,
                                            }}
                                        >
                                            <Chip
                                                label={
                                                    item.status
                                                }
                                                size="small"
                                                sx={{
                                                    color:
                                                        item.status ===
                                                            "Overdue"
                                                            ? "#B42318"
                                                            : item.status ===
                                                                "Returned"
                                                                ? "#4C784B"
                                                                : "#8B6508",

                                                    backgroundColor:
                                                        item.status ===
                                                            "Overdue"
                                                            ? "rgba(180,60,40,0.10)"
                                                            : item.status ===
                                                                "Returned"
                                                                ? "rgba(76,120,75,0.10)"
                                                                : "rgba(184,134,11,0.10)",

                                                    minWidth:
                                                        "72px",
                                                }}
                                            />

                                            <Box
                                                sx={{
                                                    width:
                                                        "82px",

                                                    display:
                                                        "flex",

                                                    justifyContent:
                                                        "flex-end",
                                                }}
                                            >
                                                {item.status !==
                                                    "Returned" && (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() =>
                                                            openNotifyConfirmation(
                                                                item
                                                            )
                                                        }
                                                        disabled={
                                                            processingNotification
                                                        }
                                                        sx={{
                                                            width:
                                                                "78px",

                                                            borderRadius:
                                                                1.5,

                                                            textTransform:
                                                                "none",

                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {processingNotification &&
                                                        selectedBorrowing?.borrowingId ===
                                                            item.borrowingId
                                                            ? "Sending..."
                                                            : "Notify"}
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box
                                        sx={{
                                            display:
                                                "flex",
                                            flexWrap:
                                                "wrap",
                                            gap: 3,
                                            mt: 2.5,
                                            pt: 2,

                                            borderTop:
                                                "1px solid rgba(92,58,33,0.08)",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize:
                                                    "0.75rem",
                                                color:
                                                    "text.secondary",
                                            }}
                                        >
                                            Borrowed:{" "}
                                            {formatDate(
                                                item.borrowedDate
                                            )}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontSize:
                                                    "0.75rem",
                                                color:
                                                    "text.secondary",
                                            }}
                                        >
                                            Due:{" "}
                                            {formatDate(
                                                item.dueDate
                                            )}
                                        </Typography>

                                        {item.returnedDate && (
                                            <Typography
                                                sx={{
                                                    fontSize:
                                                        "0.75rem",
                                                    color:
                                                        "text.secondary",
                                                }}
                                            >
                                                Returned:{" "}
                                                {formatDate(
                                                    item.returnedDate
                                                )}
                                            </Typography>
                                        )}

                                        {item.fine >
                                            0 && (
                                            <Typography
                                                sx={{
                                                    fontSize:
                                                        "0.75rem",
                                                    color:
                                                        "#B42318",
                                                    fontWeight:
                                                        500,
                                                }}
                                            >
                                                Fine: ₹
                                                {
                                                    item.fine
                                                }
                                            </Typography>
                                        )}
                                    </Box>
                                </Card>
                            )
                        )}
                    </Box>

                    {filteredBorrowings.length >
                        BORROWINGS_PER_PAGE && (
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
                                    "rgba(255,253,247,0.9)",

                                boxShadow:
                                    "0 10px 30px rgba(62,38,22,0.05)",
                            }}
                        >
                            <Pagination
                                count={
                                    totalPages
                                }
                                page={
                                    currentPage
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
            )}

            {/* =================================================
                BORROW BOOK DIALOG
            ================================================= */}

            <Dialog
                open={openDialog}
                onClose={() => {
                    if (!saving) {
                        setOpenDialog(false);
                    }
                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle
                    sx={{
                        fontFamily:
                            "Poppins, sans-serif",
                        fontWeight: 600,
                    }}
                >
                    Borrow Book
                </DialogTitle>

                <DialogContent>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection:
                                "column",
                            gap: 2.5,
                            mt: 1,
                        }}
                    >
                        {/* SELECT USER */}

                        <TextField
                            select
                            fullWidth
                            label="Select User"
                            value={
                                selectedUser
                            }
                            onChange={(
                                event
                            ) => {
                                setSelectedUser(
                                    event.target
                                        .value
                                );

                                setUserError("");
                                setFormError("");
                            }}
                            disabled={saving}
                            error={
                                !!userError
                            }
                            helperText={
                                userError
                            }
                            sx={{
                                "& .MuiInputBase-input":
                                {
                                    fontFamily:
                                        "Poppins, sans-serif",
                                },

                                "& .MuiInputLabel-root":
                                {
                                    fontFamily:
                                        "Poppins, sans-serif",
                                },
                            }}
                        >
                            {users
                                .filter(
                                    (user) =>
                                        user.isActive
                                )
                                .map(
                                    (
                                        user
                                    ) => (
                                        <MenuItem
                                            key={
                                                user.userId
                                            }
                                            value={
                                                user.userId
                                            }
                                            sx={{
                                                fontFamily:
                                                    "Poppins, sans-serif",
                                            }}
                                        >
                                            {
                                                user.name
                                            }{" "}
                                            (@
                                            {
                                                user.username
                                            }
                                            )
                                        </MenuItem>
                                    )
                                )}
                        </TextField>

                        {/* SELECT BOOK */}

                        <TextField
                            select
                            fullWidth
                            label="Select Book"
                            value={
                                selectedBook
                            }
                            onChange={(
                                event
                            ) => {
                                setSelectedBook(
                                    event.target
                                        .value
                                );

                                setBookError("");
                                setFormError("");
                            }}
                            disabled={saving}
                            error={
                                !!bookError
                            }
                            helperText={
                                bookError
                            }
                            sx={{
                                "& .MuiInputBase-input":
                                {
                                    fontFamily:
                                        "Poppins, sans-serif",
                                },

                                "& .MuiInputLabel-root":
                                {
                                    fontFamily:
                                        "Poppins, sans-serif",
                                },
                            }}
                        >
                            {books.map(
                                (book) => (
                                    <MenuItem
                                        key={
                                            book.bookId
                                        }
                                        value={
                                            book.bookId
                                        }
                                        disabled={
                                            book.availableCopies <=
                                            0
                                        }
                                        sx={{
                                            fontFamily:
                                                "Poppins, sans-serif",
                                        }}
                                    >
                                        {
                                            book.title
                                        }{" "}
                                        —{" "}
                                        {
                                            book.author
                                        }{" "}
                                        (
                                        {
                                            book.availableCopies
                                        }{" "}
                                        available)
                                    </MenuItem>
                                )
                            )}
                        </TextField>

                        {/* DUE DATE */}

                        <TextField
                            fullWidth
                            type="datetime-local"
                            label="Due Date"
                            value={
                                dueDate
                            }
                            onChange={(
                                event
                            ) => {
                                setDueDate(
                                    event
                                        .target
                                        .value
                                );

                                setDueDateError("");
                                setFormError("");
                            }}
                            disabled={saving}
                            error={
                                !!dueDateError
                            }
                            helperText={
                                dueDateError
                            }
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            sx={{
                                "& .MuiInputBase-input":
                                {
                                    fontFamily:
                                        "Poppins, sans-serif",
                                },

                                "& .MuiInputLabel-root":
                                {
                                    fontFamily:
                                        "Poppins, sans-serif",
                                },
                            }}
                        />

                        {/* GENERAL/API ERROR */}

                        {formError && (
                            <Typography
                                color="error"
                                sx={{
                                    fontFamily:
                                        "Poppins, sans-serif",
                                    fontSize:
                                        "0.85rem",
                                }}
                            >
                                {
                                    formError
                                }
                            </Typography>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2.5,
                        gap: 1,
                        justifyContent:
                            "space-between",
                    }}
                >
                    {/* CANCEL BUTTON */}

                    <Button
                        onClick={() =>
                            setOpenDialog(
                                false
                            )
                        }
                        disabled={saving}
                        sx={{
                            color:
                                "#5C3A21",

                            fontFamily:
                                "Poppins, sans-serif",

                            fontWeight: 500,

                            textTransform:
                                "none",
                        }}
                    >
                        Cancel
                    </Button>

                    {/* BORROW BOOK BUTTON */}

                    <Button
                        onClick={
                            handleBorrow
                        }
                        variant="contained"
                        disabled={
                            saving
                        }
                        sx={{
                            color:
                                "#FFFDF7",

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            borderRadius: 1.5,

                            px: 2.5,
                            py: 1.2,

                            fontFamily:
                                "Poppins, sans-serif",

                            fontWeight: 500,

                            textTransform:
                                "none",

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },

                            "&:disabled": {
                                color:
                                    "#FFFDF7",
                                opacity: 0.6,
                            },
                        }}
                    >
                        {saving
                            ? "Borrowing..."
                            : "Borrow Book"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =================================================
                NOTIFY CONFIRMATION POPUP
            ================================================= */}

            <Dialog
                open={
                    confirmOpen &&
                    confirmAction ===
                        "notify"
                }
                onClose={
                    closeConfirmation
                }
                fullWidth
                maxWidth="xs"
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        color:
                            "#3E2616",
                        fontWeight:
                            600,
                    }}
                >
                    Notify User
                </DialogTitle>

                <DialogContent>
                    <Typography
                        sx={{
                            color:
                                "text.secondary",
                            lineHeight:
                                1.7,
                        }}
                    >
                        Are you sure you
                        want to notify{" "}
                        <strong>
                            @
                            {
                                selectedBorrowing?.username
                            }
                        </strong>{" "}
                        to return{" "}
                        <strong>
                            {
                                selectedBorrowing?.title
                            }
                        </strong>{" "}
                        as soon as
                        possible?
                    </Typography>
                </DialogContent>

                <DialogActions
                    sx={{
                        p: 2,
                        gap: 1,
                        justifyContent:
                            "space-between",
                    }}
                >
                    <Button
                        onClick={
                            closeConfirmation
                        }
                        disabled={
                            processingNotification
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
                        onClick={
                            handleConfirmNotify
                        }
                        variant="contained"
                        disabled={
                            processingNotification
                        }
                        sx={{
                            color:
                                "#FFFDF7",

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },

                            textTransform:
                                "none",
                        }}
                    >
                        {processingNotification
                            ? "Sending..."
                            : "OK"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =================================================
                SNACKBAR
            ================================================= */}

            <Snackbar
                open={
                    snackbarOpen
                }
                autoHideDuration={
                    3000
                }
                onClose={() =>
                    setSnackbarOpen(
                        false
                    )
                }
                anchorOrigin={{
                    vertical:
                        "bottom",
                    horizontal:
                        "center",
                }}
            >
                <Alert
                    onClose={() =>
                        setSnackbarOpen(
                            false
                        )
                    }
                    severity={
                        snackbarSeverity
                    }
                    variant="filled"
                    sx={{
                        width:
                            "100%",
                    }}
                >
                    {
                        snackbarMessage
                    }
                </Alert>
            </Snackbar>
        </Box>
    );
}