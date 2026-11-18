"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Box,
    Card,
    CardContent,
    Chip,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Divider,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";

type DueBook = {
    borrowingId: string;
    bookId: string;
    title: string;
    author: string;
    coverImage: string | null;
    dueDate: string;
    fine: number;
    status: string;
};

type ApiResponse =
    | DueBook[]
    | {
        message?: string;
    };

const parseResponse = (
    text: string
): ApiResponse | null => {
    if (!text.trim()) {
        return null;
    }

    try {
        return JSON.parse(text) as ApiResponse;
    } catch {
        return {
            message: text,
        };
    }
};

export default function DueBooksPage() {
    const router = useRouter();

    const [books, setBooks] = useState<DueBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [returnDialogOpen, setReturnDialogOpen] =
        useState(false);

    const [selectedBook, setSelectedBook] =
        useState<DueBook | null>(null);

    const [paymentMethod, setPaymentMethod] =
        useState("Wallet");

    const [paymentError, setPaymentError] =
        useState("");

    const [returning, setReturning] = useState(false);

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
        severity: "success" | "error"
    ) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = (
        event?: React.SyntheticEvent | Event,
        reason?: string
    ) => {
        if (reason === "clickaway") {
            return;
        }

        setSnackbarOpen(false);
    };

    useEffect(() => {
        const loadDueBooks = async () => {
            try {
                const token =
                    sessionStorage.getItem("accessToken");

                if (!token) {
                    router.replace("/login");
                    return;
                }

                const response = await fetch(
                    "http://localhost:5011/api/User/due-books",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const responseText =
                    await response.text();

                const result =
                    parseResponse(responseText);

                if (!response.ok) {
                    if (response.status === 401) {
                        sessionStorage.removeItem(
                            "accessToken"
                        );

                        router.replace("/login");
                        return;
                    }

                    if (response.status === 403) {
                        router.replace("/user");
                        return;
                    }

                    const message =
                        result &&
                        !Array.isArray(result)
                            ? result.message
                            : undefined;

                    throw new Error(
                        message ||
                        "Failed to load due books"
                    );
                }

                console.log(
                    "DUE BOOKS API:",
                    result
                );

                if (Array.isArray(result)) {
                    setBooks(result);
                } else {
                    setBooks([]);
                }
            } catch (error) {
                console.error(
                    "Due books API error:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load due books."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDueBooks();
    }, [router]);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }
        );
    };

    const getDaysLeft = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);

        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);

        const difference =
            due.getTime() - today.getTime();

        return Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );
    };

    const openReturnDialog = (
        book: DueBook
    ) => {
        setSelectedBook(book);
        setPaymentMethod("Wallet");
        setPaymentError("");
        setReturnDialogOpen(true);
    };

    const closeReturnDialog = () => {
        if (returning) {
            return;
        }

        setReturnDialogOpen(false);
        setSelectedBook(null);
        setPaymentError("");
    };

    const handlePaymentMethodChange = (
        value: string
    ) => {
        setPaymentMethod(value);

        if (
            value === "UPI" ||
            value === "Net Banking"
        ) {
            setPaymentError(
                "Payment is currently unavailable."
            );
        } else {
            setPaymentError("");
        }
    };

    const handleReturn = async () => {
        if (!selectedBook) {
            return;
        }

        // UPI / Net Banking are currently unavailable.
        // Do not call the backend.
        if (
            paymentMethod === "UPI" ||
            paymentMethod === "Net Banking"
        ) {
            setPaymentError(
                "Payment is currently unavailable."
            );

            return;
        }

        const bookToReturn = selectedBook;

        // Close popup immediately after clicking OK.
        setReturnDialogOpen(false);
        setSelectedBook(null);
        setPaymentError("");

        try {
            setReturning(true);

            const token =
                sessionStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            const response = await fetch(
                `http://localhost:5011/api/User/borrowed/${bookToReturn.borrowingId}/return`,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        paymentMethod,
                    }),
                }
            );

            const responseText =
                await response.text();

            const result =
                parseResponse(responseText);

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (response.status === 403) {
                    router.replace("/user");
                    return;
                }

                const message =
                    result &&
                    !Array.isArray(result)
                        ? result.message
                        : undefined;

                showSnackbar(
                    message ||
                    "Unable to return book.",
                    "error"
                );

                return;
            }

            setBooks((currentBooks) =>
                currentBooks.filter(
                    (book) =>
                        book.borrowingId !==
                        bookToReturn.borrowingId
                )
            );

            const successMessage =
                result &&
                !Array.isArray(result)
                    ? result.message
                    : undefined;

            showSnackbar(
                successMessage ||
                "Book returned successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Return book error:",
                error
            );

            showSnackbar(
                error instanceof Error
                    ? error.message
                    : "Unable to connect to the server.",
                "error"
            );
        } finally {
            setReturning(false);
        }
    };

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
                    Loading due books...
                </Typography>
            </Box>
        );
    }

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
            {/* HEADER */}

            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                }}
            >
                <IconButton
                    onClick={() =>
                        router.push("/user")
                    }
                    sx={{
                        color: "#5C3A21",
                        backgroundColor:
                            "rgba(255,255,255,0.45)",
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
                        DUE TRACKER
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
                        Due Books
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            color: "text.secondary",
                            fontSize: "0.85rem",
                        }}
                    >
                        Keep track of books that need
                        to be returned.
                    </Typography>
                </Box>
            </Box>

            {/* EMPTY STATE */}

            {books.length === 0 ? (
                <Card
                    sx={{
                        p: 5,
                        textAlign: "center",
                        borderRadius: 3,
                        backgroundColor:
                            "rgba(255,253,247,0.9)",
                        boxShadow:
                            "0 10px 30px rgba(62,38,22,0.08)",
                    }}
                >
                    <MenuBookOutlinedIcon
                        sx={{
                            fontSize: 42,
                            color: "secondary.main",
                            mb: 1,
                        }}
                    />

                    <Typography
                        sx={{
                            fontWeight: 600,
                            fontSize: "1rem",
                            mb: 1,
                        }}
                    >
                        No due books
                    </Typography>

                    <Typography
                        sx={{
                            color: "text.secondary",
                            fontSize: "0.8rem",
                        }}
                    >
                        You dont have any books due
                        within the next 7 days.
                    </Typography>
                </Card>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2, 320px)",
                            xl: "repeat(3, 320px)",
                        },
                        gap: 3,
                    }}
                >
                    {books.map((book) => {
                        const daysLeft =
                            getDaysLeft(
                                book.dueDate
                            );

                        const isOverdue =
                            book.status ===
                                "Overdue" ||
                            daysLeft < 0;

                        const isDueToday =
                            daysLeft === 0;

                        return (
                            <Card
                                key={book.borrowingId}
                                sx={{
                                    height: "100%",
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    backgroundColor:
                                        "rgba(255,253,247,0.95)",
                                    boxShadow:
                                        "0 10px 30px rgba(62,38,22,0.08)",
                                    transition:
                                        "transform 0.25s ease, box-shadow 0.25s ease",
                                    "&:hover": {
                                        transform:
                                            "translateY(-4px)",
                                        boxShadow:
                                            "0 15px 35px rgba(62,38,22,0.14)",
                                    },
                                }}
                            >
                                <CardContent
                                    sx={{
                                        p: 0,
                                        height: "100%",
                                        display: "flex",
                                        flexDirection:
                                            "column",
                                    }}
                                >
                                    {/* BOOK TOP SECTION */}

                                    <Box
                                        sx={{
                                            p: 2.5,
                                            display: "flex",
                                            gap: 1.8,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 68,
                                                height: 94,
                                                flexShrink: 0,
                                                borderRadius: 1.5,
                                                overflow: "hidden",
                                                backgroundColor:
                                                    "rgba(92,58,33,0.08)",
                                                display: "flex",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                    "center",
                                            }}
                                        >
                                            {book.coverImage ? (
                                                <Box
                                                    component="img"
                                                    src={
                                                        book.coverImage
                                                    }
                                                    alt={
                                                        book.title
                                                    }
                                                    sx={{
                                                        width:
                                                            "100%",
                                                        height:
                                                            "100%",
                                                        objectFit:
                                                            "cover",
                                                    }}
                                                />
                                            ) : (
                                                <MenuBookOutlinedIcon
                                                    sx={{
                                                        fontSize: 34,
                                                        color:
                                                            "secondary.main",
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <Box
                                            sx={{
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "flex-end",
                                                    mb: 1,
                                                }}
                                            >
                                                <Chip
                                                    label={
                                                        isOverdue
                                                            ? "Overdue"
                                                            : isDueToday
                                                                ? "Due Today"
                                                                : "Due Soon"
                                                    }
                                                    size="small"
                                                    icon={
                                                        isOverdue ? (
                                                            <WarningAmberOutlinedIcon />
                                                        ) : undefined
                                                    }
                                                    sx={{
                                                        height: 28,
                                                        fontSize:
                                                            "0.72rem",
                                                        fontWeight: 600,
                                                        color:
                                                            isOverdue
                                                                ? "#B42318"
                                                                : "#8B6508",
                                                        backgroundColor:
                                                            isOverdue
                                                                ? "rgba(180,60,40,0.10)"
                                                                : "rgba(184,134,11,0.10)",
                                                    }}
                                                />
                                            </Box>

                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize:
                                                        "1rem",
                                                    lineHeight:
                                                        1.35,
                                                    display:
                                                        "-webkit-box",
                                                    WebkitLineClamp:
                                                        2,
                                                    WebkitBoxOrient:
                                                        "vertical",
                                                    overflow:
                                                        "hidden",
                                                }}
                                            >
                                                {book.title}
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.6,
                                                    color:
                                                        "text.secondary",
                                                    fontSize:
                                                        "0.8rem",
                                                    display:
                                                        "-webkit-box",
                                                    WebkitLineClamp:
                                                        1,
                                                    WebkitBoxOrient:
                                                        "vertical",
                                                    overflow:
                                                        "hidden",
                                                }}
                                            >
                                                {book.author}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider />

                                    {/* DUE INFORMATION */}

                                    <Box
                                        sx={{
                                            px: 2.5,
                                            py: 3,
                                            display: "grid",
                                            gridTemplateColumns:
                                                "1fr 1fr",
                                            gap: 2,
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize:
                                                        "0.7rem",
                                                    color:
                                                        "text.secondary",
                                                    mb: 0.5,
                                                }}
                                            >
                                                Due Date
                                            </Typography>

                                            <Box
                                                sx={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: 0.7,
                                                }}
                                            >
                                                <EventOutlinedIcon
                                                    sx={{
                                                        fontSize: 17,
                                                        color:
                                                            "secondary.main",
                                                    }}
                                                />

                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            "0.82rem",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {formatDate(
                                                        book.dueDate
                                                    )}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize:
                                                        "0.7rem",
                                                    color:
                                                        "text.secondary",
                                                    mb: 0.5,
                                                }}
                                            >
                                                {isOverdue
                                                    ? "Overdue By"
                                                    : "Time Left"}
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    fontSize:
                                                        "0.82rem",
                                                    fontWeight: 600,
                                                    color:
                                                        isOverdue
                                                            ? "#B42318"
                                                            : "primary.main",
                                                }}
                                            >
                                                {isOverdue
                                                    ? `${Math.abs(
                                                        daysLeft
                                                    )} days`
                                                    : isDueToday
                                                        ? "Today"
                                                        : `${daysLeft} days`}
                                            </Typography>
                                        </Box>

                                        <Box
                                            sx={{
                                                gridColumn:
                                                    "1 / -1",
                                                p: 1.5,
                                                borderRadius: 1.5,
                                                backgroundColor:
                                                    book.fine > 0
                                                        ? "rgba(180,60,40,0.07)"
                                                        : "rgba(92,58,33,0.05)",
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
                                                Current Fine
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.3,
                                                    fontSize:
                                                        "1rem",
                                                    fontWeight: 700,
                                                    color:
                                                        book.fine > 0
                                                            ? "#B42318"
                                                            : "primary.main",
                                                }}
                                            >
                                                ₹
                                                {book.fine.toFixed(
                                                    2
                                                )}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* ACTION */}

                                    <Box
                                        sx={{
                                            mt: "auto",
                                            px: 2.5,
                                            pb: 2.5,
                                        }}
                                    >
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={() =>
                                                openReturnDialog(
                                                    book
                                                )
                                            }
                                            sx={{
                                                borderRadius: 1.5,
                                                py: 1.1,
                                                textTransform:
                                                    "none",
                                                fontWeight: 600,
                                                backgroundColor:
                                                    "primary.main",
                                                "&:hover": {
                                                    backgroundColor:
                                                        "primary.dark",
                                                },
                                            }}
                                        >
                                            Return Book
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            )}

            {/* RETURN + PAYMENT POPUP */}

            <Dialog
                open={returnDialogOpen}
                onClose={closeReturnDialog}
                fullWidth
                maxWidth="xs"
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
                        fontWeight: 600,
                        color: "#3E2616",
                        pb: 1,
                    }}
                >
                    Return Book
                </DialogTitle>

                <DialogContent>
                    {selectedBook && (
                        <>
                            {/* BOOK */}

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1.5,
                                    alignItems:
                                        "center",
                                    mb: 3,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 64,
                                        borderRadius: 1,
                                        overflow: "hidden",
                                        backgroundColor:
                                            "rgba(92,58,33,0.08)",
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {selectedBook.coverImage ? (
                                        <Box
                                            component="img"
                                            src={
                                                selectedBook.coverImage
                                            }
                                            alt={
                                                selectedBook.title
                                            }
                                            sx={{
                                                width:
                                                    "100%",
                                                height:
                                                    "100%",
                                                objectFit:
                                                    "cover",
                                            }}
                                        />
                                    ) : (
                                        <MenuBookOutlinedIcon
                                            sx={{
                                                color:
                                                    "secondary.main",
                                            }}
                                        />
                                    )}
                                </Box>

                                <Box>
                                    <Typography
                                        sx={{
                                            fontWeight: 600,
                                            fontSize:
                                                "0.9rem",
                                        }}
                                    >
                                        {
                                            selectedBook.title
                                        }
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color:
                                                "text.secondary",
                                            fontSize:
                                                "0.75rem",
                                            mt: 0.3,
                                        }}
                                    >
                                        {
                                            selectedBook.author
                                        }
                                    </Typography>
                                </Box>
                            </Box>

                            {/* FINE */}

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.75rem",
                                    color:
                                        "text.secondary",
                                    mb: 0.7,
                                }}
                            >
                                Fine Amount
                            </Typography>

                            <TextField
                                fullWidth
                                value={`₹ ${selectedBook.fine.toFixed(
                                    2
                                )}`}
                                size="small"
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                    },
                                }}
                                sx={{
                                    mb: 2.5,
                                    "& .MuiOutlinedInput-root":
                                    {
                                        backgroundColor:
                                            "rgba(92,58,33,0.05)",
                                    },
                                }}
                            />

                            {/* PAYMENT METHOD */}

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.75rem",
                                    color:
                                        "text.secondary",
                                    mb: 0.7,
                                }}
                            >
                                Payment Method
                            </Typography>

                            <TextField
                                select
                                fullWidth
                                size="small"
                                value={paymentMethod}
                                onChange={(event) =>
                                    handlePaymentMethodChange(
                                        event.target.value
                                    )
                                }
                                disabled={returning}
                                error={Boolean(
                                    paymentError
                                )}
                                helperText={
                                    paymentError ||
                                    undefined
                                }
                            >
                                <MenuItem value="Wallet">
                                    <Box
                                        sx={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap: 1,
                                        }}
                                    >
                                        <AccountBalanceWalletOutlinedIcon
                                            sx={{
                                                fontSize: 19,
                                            }}
                                        />
                                        Wallet
                                    </Box>
                                </MenuItem>

                                <MenuItem value="UPI">
                                    <Box
                                        sx={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap: 1,
                                        }}
                                    >
                                        <PaymentsOutlinedIcon
                                            sx={{
                                                fontSize: 19,
                                            }}
                                        />
                                        UPI
                                    </Box>
                                </MenuItem>

                                <MenuItem value="Net Banking">
                                    <Box
                                        sx={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap: 1,
                                        }}
                                    >
                                        <AccountBalanceOutlinedIcon
                                            sx={{
                                                fontSize: 19,
                                            }}
                                        />
                                        Net Banking
                                    </Box>
                                </MenuItem>
                            </TextField>
                        </>
                    )}
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
                        onClick={closeReturnDialog}
                        disabled={returning}
                        sx={{
                            textTransform:
                                "none",
                            color:
                                "text.secondary",
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleReturn}
                        disabled={returning}
                        sx={{
                            minWidth: 100,
                            borderRadius: 1.5,
                            textTransform:
                                "none",
                            fontWeight: 600,
                            backgroundColor:
                                "primary.main",
                            "&:hover": {
                                backgroundColor:
                                    "primary.dark",
                            },
                        }}
                    >
                        {returning ? (
                            <CircularProgress
                                size={20}
                                sx={{
                                    color: "white",
                                }}
                            />
                        ) : (
                            "OK"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SNACKBAR */}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={handleSnackbarClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{
                        width: "100%",
                        minWidth: {
                            xs: "auto",
                            sm: 360,
                        },
                        maxWidth: 600,
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
