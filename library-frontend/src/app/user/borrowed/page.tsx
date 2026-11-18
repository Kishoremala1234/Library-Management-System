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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Snackbar,
    Alert,
    CircularProgress,
    Stack,
    IconButton,
} from "@mui/material";

import MenuBookTwoToneIcon from "@mui/icons-material/MenuBookTwoTone";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

type BorrowedBook = {
    borrowingId: string;
    bookId: string;
    title: string;
    author: string;
    borrowedDate: string;
    dueDate: string;
    fine: number;
    status: string;
    coverImage?: string | null;
    categoryName?: string | null;
};

export default function BorrowedBooksPage() {
    const router = useRouter();

    const [books, setBooks] =
        useState<BorrowedBook[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [selectedBook, setSelectedBook] =
        useState<BorrowedBook | null>(null);

    const [returningBookId, setReturningBookId] =
        useState<string | null>(null);

    const [snackbar, setSnackbar] =
        useState({
            open: false,
            message: "",
            severity:
                "success" as
                | "success"
                | "error",
        });

    // =====================================================
    // RETURN BUTTON
    // =====================================================

    const handleReturnClick = (
        book: BorrowedBook
    ) => {
        setSelectedBook(book);
    };

    // =====================================================
    // CONFIRM RETURN
    // =====================================================

    const handleConfirmReturn =
        async () => {
            if (!selectedBook) {
                return;
            }

            const borrowingId =
                selectedBook.borrowingId;

            // Close confirmation immediately
            setSelectedBook(null);

            try {
                const token =
                    sessionStorage.getItem(
                        "accessToken"
                    );

                if (!token) {
                    router.replace(
                        "/login"
                    );
                    return;
                }

                setReturningBookId(
                    borrowingId
                );

                const response = await fetch(
                    `http://localhost:5011/api/User/borrowed/${borrowingId}/return`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            paymentMethod: "Wallet",
                        }),
                    }
                );

                const responseText =
                    await response.text();

                let result: {
                    message?: string;
                } = {};

                if (
                    responseText.trim()
                ) {
                    try {
                        result =
                            JSON.parse(
                                responseText
                            );
                    } catch {
                        result = {};
                    }
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

                    setSnackbar({
                        open: true,
                        message:
                            result.message ||
                            responseText ||
                            "Unable to return book.",
                        severity:
                            "error",
                    });

                    return;
                }

                setBooks(
                    (currentBooks) =>
                        currentBooks.filter(
                            (book) =>
                                book.borrowingId !==
                                borrowingId
                        )
                );

                setSnackbar({
                    open: true,
                    message:
                        "Book returned successfully.",
                    severity:
                        "success",
                });
            } catch (error) {
                console.error(
                    "Return book error:",
                    error
                );

                setSnackbar({
                    open: true,
                    message:
                        "Unable to connect to the server.",
                    severity:
                        "error",
                });
            } finally {
                setReturningBookId(
                    null
                );
            }
        };

    // =====================================================
    // FETCH BORROWED BOOKS
    // =====================================================

    useEffect(() => {
        const fetchBorrowedBooks =
            async () => {
                try {
                    const token =
                        sessionStorage.getItem(
                            "accessToken"
                        );

                    if (!token) {
                        router.replace(
                            "/login"
                        );
                        return;
                    }

                    const response =
                        await fetch(
                            "http://localhost:5011/api/User/borrowed",
                            {
                                method: "GET",
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,
                                },
                            }
                        );

                    const responseText =
                        await response.text();

                    let result:
                        | BorrowedBook[]
                        | {
                            message?: string;
                        } = [];

                    if (
                        responseText.trim()
                    ) {
                        try {
                            result =
                                JSON.parse(
                                    responseText
                                );
                        } catch {
                            result = [];
                        }
                    }

                    if (
                        !response.ok
                    ) {
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

                        throw new Error(
                            !Array.isArray(
                                result
                            ) &&
                                result.message
                                ? result.message
                                : "Failed to load borrowed books."
                        );
                    }

                    setBooks(
                        Array.isArray(
                            result
                        )
                            ? result
                            : []
                    );
                } catch (error) {
                    console.error(
                        "Borrowed books API error:",
                        error
                    );

                    setError(
                        error instanceof
                            Error
                            ? error.message
                            : "Unable to load borrowed books."
                    );
                } finally {
                    setLoading(false);
                }
            };

        fetchBorrowedBooks();
    }, [router]);

    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (
        date: string
    ) => {
        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // =====================================================
    // STATUS STYLE
    // =====================================================

    const getStatusStyles = (
        status: string
    ) => {
        if (
            status === "Overdue"
        ) {
            return {
                color: "#B42318",
                backgroundColor:
                    "rgba(180,35,24,0.10)",
            };
        }

        if (
            status === "Due Soon"
        ) {
            return {
                color: "#8B6508",
                backgroundColor:
                    "rgba(184,134,11,0.12)",
            };
        }

        return {
            color: "#4C784B",
            backgroundColor:
                "rgba(76,120,75,0.10)",
        };
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <Box
                component="main"
                sx={{
                    minHeight:
                        "100vh",

                    display:
                        "flex",

                    flexDirection:
                        "column",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    gap: 2,

                    backgroundColor:
                        "#FAF8F5",
                }}
            >
                <CircularProgress
                    sx={{
                        color:
                            "#5C3A21",
                    }}
                />

                <Typography
                    sx={{
                        color:
                            "#6B5E55",
                        fontWeight:
                            500,
                    }}
                >
                    Loading borrowed books...
                </Typography>
            </Box>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <Box
                component="main"
                sx={{
                    minHeight:
                        "100vh",

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    px: 2,

                    backgroundColor:
                        "#FAF8F5",
                }}
            >
                <Typography
                    color="error"
                    sx={{
                        fontWeight:
                            600,
                    }}
                >
                    {error}
                </Typography>
            </Box>
        );
    }

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <Box
            component="main"
            sx={{
                minHeight:
                    "100vh",

                p: {
                    xs: 2.5,
                    sm: 4,
                    md: 6,
                },

                background:
                    "linear-gradient(135deg, #F8F2E7 0%, #E6D6B9 100%)",
            }}
        >
            {/* HEADER */}

            {/* HEADER */}

            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                }}
            >
                <IconButton
                    onClick={() => router.push("/user")}
                    sx={{
                        color: "#5C3A21",
                        backgroundColor:
                            "rgba(255,255,255,0.45)",
                        mt: 4.5,

                        flexShrink: 0,

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
                            color: "#8A6545",
                            fontSize: "0.75rem",
                            letterSpacing: "0.2em",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            mb: 0.5,
                        }}
                    >
                        My Library
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: {
                                xs: "2rem",
                                md: "2.8rem",
                            },
                            fontWeight: 700,
                            color: "#2C1810",
                        }}
                    >
                        My Borrowed Books
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            color: "#6B5E55",
                            fontSize: "0.95rem",
                        }}
                    >
                        Books currently borrowed from the library.
                    </Typography>
                </Box>
            </Box>

            {/* EMPTY STATE */}

            {books.length ===
                0 ? (
                <Card
                    sx={{
                        p: 6,

                        textAlign:
                            "center",

                        borderRadius:
                            4,

                        backgroundColor:
                            "#FFFFFF",

                        border:
                            "1px solid rgba(138,101,69,0.12)",

                        boxShadow:
                            "0 10px 30px rgba(62,38,22,0.05)",
                    }}
                >
                    <MenuBookTwoToneIcon
                        sx={{
                            fontSize:
                                52,

                            color:
                                "#8A6545",

                            mb: 1,

                            opacity:
                                0.7,
                        }}
                    />

                    <Typography
                        sx={{
                            fontSize:
                                "1.1rem",

                            fontWeight:
                                700,

                            color:
                                "#2C1810",
                        }}
                    >
                        No borrowed books
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,

                            color:
                                "#6B5E55",

                            fontSize:
                                "0.85rem",
                        }}
                    >
                        You dont have any
                        books currently
                        borrowed.
                    </Typography>
                </Card>
            ) : (
                <Box
                    sx={{
                        display:
                            "grid",

                        gridTemplateColumns:
                        {
                            xs:
                                "1fr",

                            sm:
                                "repeat(2, 1fr)",

                            md:
                                "repeat(3, 1fr)",

                            lg:
                                "repeat(4, 1fr)",
                        },

                        gap: 3.5,
                    }}
                >
                    {books.map(
                        (book) => {
                            const statusStyles =
                                getStatusStyles(
                                    book.status
                                );

                            const isReturning =
                                returningBookId ===
                                book.borrowingId;

                            return (
                                <Card
                                    key={
                                        book.borrowingId
                                    }
                                    sx={{
                                        height:
                                            "100%",

                                        minHeight:
                                            570,

                                        display:
                                            "flex",

                                        flexDirection:
                                            "column",

                                        borderRadius:
                                            3.5,

                                        backgroundColor:
                                            "#FFFFFF",

                                        border:
                                            "1px solid rgba(138,101,69,0.12)",

                                        boxShadow:
                                            "0 4px 16px rgba(62,38,22,0.04)",

                                        transition:
                                            "all 0.3s cubic-bezier(0.4,0,0.2,1)",

                                        overflow:
                                            "hidden",

                                        "&:hover":
                                        {
                                            transform:
                                                "translateY(-8px)",

                                            boxShadow:
                                                "0 16px 32px rgba(62,38,22,0.12)",

                                            borderColor:
                                                "rgba(138,101,69,0.3)",
                                        },
                                    }}
                                >
                                    {/* COVER */}

                                    <Box
                                        sx={{
                                            position:
                                                "relative",

                                            width:
                                                "100%",

                                            pt:
                                                "120%",

                                            backgroundColor:
                                                "#F3EFEA",

                                            overflow:
                                                "hidden",
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
                                                    position:
                                                        "absolute",

                                                    inset:
                                                        0,

                                                    width:
                                                        "100%",

                                                    height:
                                                        "100%",

                                                    objectFit:
                                                        "cover",

                                                    transition:
                                                        "transform 0.4s ease",
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    position:
                                                        "absolute",

                                                    inset:
                                                        0,

                                                    display:
                                                        "flex",

                                                    flexDirection:
                                                        "column",

                                                    alignItems:
                                                        "center",

                                                    justifyContent:
                                                        "center",

                                                    px: 3,

                                                    background:
                                                        "linear-gradient(145deg, #F5EBE1 0%, #E6D7C3 100%)",
                                                }}
                                            >
                                                <MenuBookTwoToneIcon
                                                    sx={{
                                                        fontSize:
                                                            58,

                                                        color:
                                                            "#8A6545",

                                                        mb: 1.5,

                                                        opacity:
                                                            0.8,
                                                    }}
                                                />

                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            "1rem",

                                                        fontWeight:
                                                            700,

                                                        textAlign:
                                                            "center",

                                                        color:
                                                            "#3E2616",

                                                        lineHeight:
                                                            1.3,

                                                        display:
                                                            "-webkit-box",

                                                        WebkitLineClamp:
                                                            3,

                                                        WebkitBoxOrient:
                                                            "vertical",

                                                        overflow:
                                                            "hidden",
                                                    }}
                                                >
                                                    {
                                                        book.title
                                                    }
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* SINGLE STATUS */}

                                        <Chip
                                            label={
                                                book.status
                                            }
                                            size="small"
                                            sx={{
                                                position:
                                                    "absolute",

                                                top:
                                                    12,

                                                left:
                                                    12,

                                                color:
                                                    statusStyles.color,

                                                backgroundColor:
                                                    "rgba(255,255,255,0.92)",

                                                backdropFilter:
                                                    "blur(6px)",

                                                fontWeight:
                                                    700,

                                                fontSize:
                                                    "0.68rem",

                                                boxShadow:
                                                    "0 2px 8px rgba(0,0,0,0.08)",
                                            }}
                                        />
                                    </Box>

                                    {/* CONTENT */}

                                    <CardContent
                                        sx={{
                                            flex:
                                                1,

                                            display:
                                                "flex",

                                            flexDirection:
                                                "column",

                                            p:
                                                2.5,
                                        }}
                                    >
                                        {/* TITLE */}

                                        <Typography
                                            title={
                                                book.title
                                            }
                                            sx={{
                                                fontSize:
                                                    "1.05rem",

                                                fontWeight:
                                                    700,

                                                color:
                                                    "#2C1810",

                                                lineHeight:
                                                    1.3,

                                                display:
                                                    "-webkit-box",

                                                WebkitLineClamp:
                                                    2,

                                                WebkitBoxOrient:
                                                    "vertical",

                                                overflow:
                                                    "hidden",

                                                minHeight:
                                                    "2.7em",
                                            }}
                                        >
                                            {
                                                book.title
                                            }
                                        </Typography>

                                        {/* AUTHOR */}

                                        <Typography
                                            sx={{
                                                mt:
                                                    0.5,

                                                color:
                                                    "#7A6B63",

                                                fontSize:
                                                    "0.82rem",

                                                fontWeight:
                                                    500,

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
                                            by{" "}
                                            {
                                                book.author
                                            }
                                        </Typography>

                                        {/* DETAILS */}

                                        <Box
                                            sx={{
                                                mt:
                                                    2,

                                                pt:
                                                    1.8,

                                                borderTop:
                                                    "1px dashed rgba(138,101,69,0.18)",
                                            }}
                                        >
                                            {/* BORROWED */}

                                            <Stack
                                                direction="row"
                                                spacing={
                                                    1
                                                }
                                                sx={{
                                                    alignItems:
                                                        "center",

                                                    mb:
                                                        1.5,
                                                }}
                                            >
                                                <CalendarTodayOutlinedIcon
                                                    sx={{
                                                        fontSize:
                                                            16,

                                                        color:
                                                            "#8A6545",
                                                    }}
                                                />

                                                <Box>
                                                    <Typography
                                                        sx={{
                                                            fontSize:
                                                                "0.65rem",

                                                            color:
                                                                "#8A7A70",

                                                            fontWeight:
                                                                500,
                                                        }}
                                                    >
                                                        BORROWED
                                                    </Typography>

                                                    <Typography
                                                        sx={{
                                                            fontSize:
                                                                "0.8rem",

                                                            color:
                                                                "#3E2616",

                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >
                                                        {formatDate(
                                                            book.borrowedDate
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* DUE */}

                                            <Stack
                                                direction="row"
                                                spacing={
                                                    1
                                                }
                                                sx={{
                                                    alignItems:
                                                        "center",

                                                    mb:
                                                        1.5,
                                                }}
                                            >
                                                <EventAvailableOutlinedIcon
                                                    sx={{
                                                        fontSize:
                                                            17,

                                                        color:
                                                            book.status ===
                                                                "Overdue"
                                                                ? "#B42318"
                                                                : "#8A6545",
                                                    }}
                                                />

                                                <Box>
                                                    <Typography
                                                        sx={{
                                                            fontSize:
                                                                "0.65rem",

                                                            color:
                                                                "#8A7A70",

                                                            fontWeight:
                                                                500,
                                                        }}
                                                    >
                                                        DUE DATE
                                                    </Typography>

                                                    <Typography
                                                        sx={{
                                                            fontSize:
                                                                "0.8rem",

                                                            color:
                                                                book.status ===
                                                                    "Overdue"
                                                                    ? "#B42318"
                                                                    : "#3E2616",

                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >
                                                        {formatDate(
                                                            book.dueDate
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* FINE */}

                                            {book.fine >
                                                0 && (
                                                    <Stack
                                                        direction="row"
                                                        spacing={
                                                            1
                                                        }
                                                        sx={{
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <CurrencyRupeeOutlinedIcon
                                                            sx={{
                                                                fontSize:
                                                                    17,

                                                                color:
                                                                    "#B42318",
                                                            }}
                                                        />

                                                        <Box>
                                                            <Typography
                                                                sx={{
                                                                    fontSize:
                                                                        "0.65rem",

                                                                    color:
                                                                        "#8A7A70",

                                                                    fontWeight:
                                                                        500,
                                                                }}
                                                            >
                                                                FINE
                                                            </Typography>

                                                            <Typography
                                                                sx={{
                                                                    fontSize:
                                                                        "0.8rem",

                                                                    color:
                                                                        "#B42318",

                                                                    fontWeight:
                                                                        700,
                                                                }}
                                                            >
                                                                ₹
                                                                {
                                                                    book.fine
                                                                }
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                )}
                                        </Box>

                                        {/* FLEXIBLE SPACE */}

                                        <Box
                                            sx={{
                                                flex:
                                                    1,
                                            }}
                                        />

                                        {/* RETURN */}

                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            disabled={
                                                isReturning
                                            }
                                            onClick={() =>
                                                handleReturnClick(
                                                    book
                                                )
                                            }
                                            sx={{
                                                mt:
                                                    2.5,

                                                minHeight:
                                                    44,

                                                borderColor:
                                                    "#5C3A21",

                                                color:
                                                    "#5C3A21",

                                                borderRadius:
                                                    2,

                                                textTransform:
                                                    "none",

                                                fontWeight:
                                                    600,

                                                fontSize:
                                                    "0.85rem",

                                                "&:hover":
                                                {
                                                    borderColor:
                                                        "#3E2616",

                                                    color:
                                                        "#3E2616",

                                                    backgroundColor:
                                                        "rgba(92,58,33,0.06)",
                                                },
                                            }}
                                        >
                                            {isReturning
                                                ? "Returning..."
                                                : "Return Book"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        }
                    )}
                </Box>
            )}

            {/* =================================================
                RETURN CONFIRMATION
            ================================================= */}

            <Dialog
                open={
                    selectedBook !==
                    null
                }
                onClose={() =>
                    setSelectedBook(
                        null
                    )
                }
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius:
                                3,

                            p: 1,
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight:
                            700,

                        color:
                            "#2C1810",
                    }}
                >
                    Return Book
                </DialogTitle>

                <DialogContent>
                    <DialogContentText
                        sx={{
                            color:
                                "#574C45",

                            fontSize:
                                "0.95rem",

                            lineHeight:
                                1.6,
                        }}
                    >
                        Are you sure you
                        want to return{" "}
                        <strong>
                            {
                                selectedBook?.title
                            }
                        </strong>
                        ?
                    </DialogContentText>
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2,
                        gap: 1,
                        justifyContent: "space-between",
                    }}
                >
                    <Button
                        onClick={() =>
                            setSelectedBook(
                                null
                            )
                        }
                        sx={{
                            textTransform:
                                "none",

                            color:
                                "#7A6B63",

                            fontWeight:
                                600,
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleConfirmReturn
                        }
                        variant="contained"
                        sx={{
                            px: 3,

                            borderRadius:
                                2,

                            textTransform:
                                "none",

                            fontWeight:
                                600,

                            color:
                                "#FFFFFF",

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            "&:hover":
                            {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },
                        }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =================================================
                SNACKBAR
            ================================================= */}

            <Snackbar
                open={
                    snackbar.open
                }
                autoHideDuration={
                    3000
                }
                onClose={() =>
                    setSnackbar({
                        ...snackbar,
                        open: false,
                    })
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
                        setSnackbar({
                            ...snackbar,
                            open: false,
                        })
                    }
                    severity={
                        snackbar.severity
                    }
                    variant="filled"
                    sx={{
                        width:
                            "100%",

                        borderRadius:
                            2.5,

                        fontWeight:
                            500,
                    }}
                >
                    {
                        snackbar.message
                    }
                </Alert>
            </Snackbar>
        </Box>
    );
}