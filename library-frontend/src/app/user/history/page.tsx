"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Pagination,
    Snackbar,
    Typography,
} from "@mui/material";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";

type HistoryBook = {
    borrowingId: string;
    bookId: string;
    title: string;
    author: string;
    coverImage: string | null;
    borrowedDate: string;
    returnedDate: string;
    fine: number;
    status: string;
};

type WalletTransaction = {
    transactionId: string;
    transactionType: string;
    amount: number;
    description: string;
    referenceId: string | null;
    createdAt: string;
};

type HistoryItem =
    | {
        id: string;
        type: "borrowing";
        date: string;
        book: HistoryBook;
    }
    | {
        id: string;
        type: "wallet";
        date: string;
        transaction: WalletTransaction;
    };

type ApiError = {
    message?: string;
};

const HISTORY_PER_PAGE = 10;

export default function HistoryPage() {
    const router = useRouter();

    const [historyBooks, setHistoryBooks] = useState<
        HistoryBook[]
    >([]);

    const [walletTransactions, setWalletTransactions] =
        useState<WalletTransaction[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    /*
     * =====================================================
     * SAFE JSON RESPONSE
     * =====================================================
     */

    const readJson = async <T,>(
        response: Response
    ): Promise<T | null> => {
        const text = await response.text();

        if (!text.trim()) {
            return null;
        }

        try {
            return JSON.parse(text) as T;
        } catch {
            return null;
        }
    };

    /*
     * =====================================================
     * FORMAT DATE
     * =====================================================
     */

    const formatDate = (date: string) => {
        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Unknown date";
        }

        const day = parsedDate
            .getDate()
            .toString()
            .padStart(2, "0");

        const month = parsedDate
            .toLocaleString("en-US", {
                month: "short",
            })
            .toUpperCase();

        const year = parsedDate
            .getFullYear()
            .toString()
            .slice(-2);

        const time = parsedDate.toLocaleTimeString(
            "en-US",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }
        );

        return `${day} ${month} ${year} at ${time}`;
    };

    /*
     * =====================================================
     * LOAD COMPLETE HISTORY
     * =====================================================
     */

    useEffect(() => {
        let cancelled = false;

        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError("");

                const token =
                    sessionStorage.getItem(
                        "accessToken"
                    );

                if (!token) {
                    router.replace("/login");
                    return;
                }

                /*
                 * -------------------------------------------------
                 * FETCH BORROWING HISTORY
                 * -------------------------------------------------
                 */

                const borrowingResponse =
                    await fetch(
                        "http://localhost:5011/api/User/history",
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                            cache: "no-store",
                        }
                    );

                const borrowingResult =
                    await readJson<
                        HistoryBook[] | ApiError
                    >(borrowingResponse);

                if (
                    borrowingResponse.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (!borrowingResponse.ok) {
                    const message =
                        borrowingResult &&
                            !Array.isArray(
                                borrowingResult
                            )
                            ? borrowingResult.message
                            : undefined;

                    throw new Error(
                        message ||
                        "Unable to load borrowing history."
                    );
                }

                /*
                 * -------------------------------------------------
                 * FETCH WALLET TRANSACTIONS
                 * -------------------------------------------------
                 */

                const transactionResponse =
                    await fetch(
                        "http://localhost:5011/api/Payment/wallet/transactions",
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                            cache: "no-store",
                        }
                    );

                const transactionResult =
                    await readJson<
                        WalletTransaction[] | ApiError
                    >(transactionResponse);

                if (
                    transactionResponse.status ===
                    401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (!transactionResponse.ok) {
                    const message =
                        transactionResult &&
                            !Array.isArray(
                                transactionResult
                            )
                            ? transactionResult.message
                            : undefined;

                    throw new Error(
                        message ||
                        "Unable to load wallet transactions."
                    );
                }

                /*
                 * -------------------------------------------------
                 * SET DATA
                 * -------------------------------------------------
                 */

                if (cancelled) {
                    return;
                }

                setHistoryBooks(
                    Array.isArray(
                        borrowingResult
                    )
                        ? borrowingResult
                        : []
                );

                setWalletTransactions(
                    Array.isArray(
                        transactionResult
                    )
                        ? transactionResult
                        : []
                );

                setCurrentPage(1);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "History API error:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load history."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchHistory();

        return () => {
            cancelled = true;
        };
    }, [router]);

    /*
     * =====================================================
     * COMBINE BORROWING + WALLET HISTORY
     * =====================================================
     */

    const combinedHistory = useMemo<HistoryItem[]>(
        () => {
            const borrowingItems: HistoryItem[] =
                historyBooks.map((book) => ({
                    id: book.borrowingId,
                    type: "borrowing",
                    date: book.returnedDate,
                    book,
                }));

            const walletItems: HistoryItem[] =
                walletTransactions.map(
                    (transaction) => ({
                        id: transaction.transactionId,
                        type: "wallet",
                        date: transaction.createdAt,
                        transaction,
                    })
                );

            return [
                ...borrowingItems,
                ...walletItems,
            ].sort(
                (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
            );
        },
        [
            historyBooks,
            walletTransactions,
        ]
    );

    /*
     * =====================================================
     * PAGINATION
     * =====================================================
     */

    const totalPages = Math.ceil(
        combinedHistory.length /
        HISTORY_PER_PAGE
    );

    const startIndex =
        (currentPage - 1) *
        HISTORY_PER_PAGE;

    const endIndex =
        startIndex + HISTORY_PER_PAGE;

    const paginatedHistory =
        combinedHistory.slice(
            startIndex,
            endIndex
        );

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

    /*
     * =====================================================
     * LOADING
     * =====================================================
     */

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
                <CircularProgress
                    sx={{
                        color: "#5C3A21",
                    }}
                />
            </Box>
        );
    }

    /*
     * =====================================================
     * PAGE
     * =====================================================
     */

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
                        mt: 0.5,
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
                        ACCOUNT ACTIVITY
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: {
                                xs: "1.8rem",
                                md: "2.6rem",
                            },
                            fontWeight: 600,
                            color: "#3E2616",
                        }}
                    >
                        History
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            color: "text.secondary",
                            fontSize: "0.85rem",
                        }}
                    >
                        Your borrowing and wallet activity.
                    </Typography>
                </Box>
            </Box>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <Snackbar
                    open={Boolean(error)}
                    autoHideDuration={5000}
                    onClose={() =>
                        setError("")
                    }
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "center",
                    }}
                >
                    <Alert
                        severity="error"
                        variant="filled"
                        onClose={() =>
                            setError("")
                        }
                    >
                        {error}
                    </Alert>
                </Snackbar>
            )}

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {combinedHistory.length === 0 ? (
                <Card
                    sx={{
                        borderRadius: 3,
                        p: 5,
                        textAlign: "center",
                        backgroundColor:
                            "rgba(255,253,247,0.9)",
                        boxShadow:
                            "0 10px 30px rgba(62,38,22,0.08)",
                    }}
                >
                    <HistoryOutlinedIcon
                        sx={{
                            fontSize: 45,
                            color: "#8A6545",
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
                        No history yet
                    </Typography>

                    <Typography
                        sx={{
                            color: "text.secondary",
                            fontSize: "0.8rem",
                        }}
                    >
                        Your borrowing and wallet
                        activity will appear here.
                    </Typography>
                </Card>
            ) : (
                /* =================================================
                   COMPLETE HISTORY
                ================================================= */

                <Card
                    sx={{
                        borderRadius: 3,
                        backgroundColor:
                            "rgba(255,253,247,0.9)",
                        boxShadow:
                            "0 10px 30px rgba(62,38,22,0.08)",
                        overflow: "hidden",
                    }}
                >
                    {/* HISTORY HEADER */}

                    <Box
                        sx={{
                            px: {
                                xs: 2,
                                md: 3,
                            },
                            py: 2,
                            display: "flex",
                            alignItems: "center",
                            backgroundColor:
                                "rgba(92, 58, 33, 0.2)",
                            gap: 1.5,
                        }}
                    >
                        <HistoryOutlinedIcon
                            sx={{
                                color: "#5C3A21",
                            }}
                        />

                        <Box>
                            <Typography
                                sx={{
                                    fontWeight: 600,
                                    color: "#3E2616",
                                }}
                            >
                                Recent Activity
                            </Typography>

                            <Typography
                                sx={{
                                    color:
                                        "text.secondary",
                                    fontSize:
                                        "0.75rem",
                                }}
                            >
                                Borrowing and wallet
                                transactions
                            </Typography>
                        </Box>
                    </Box>

                    <Divider />

                    {/* =================================================
                        HISTORY ITEMS
                    ================================================= */}

                    {paginatedHistory.map(
                        (item, index) => {
                            /*
                             * =========================================
                             * BORROWING ITEM
                             * =========================================
                             */

                            if (
                                item.type ===
                                "borrowing"
                            ) {
                                const book =
                                    item.book;

                                return (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            backgroundColor:
                                                index % 2 === 0
                                                    ? "rgba(92,58,33,0.025)"
                                                    : "rgba(92,58,33,0.07)",

                                            borderBottom:
                                                index <
                                                    paginatedHistory.length - 1
                                                    ? "1px solid rgba(92,58,33,0.08)"
                                                    : "none",
                                        }}
                                    >
                                        <CardContent
                                            sx={{
                                                p: {
                                                    xs: 2,
                                                    md: 3,
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display:
                                                        "flex",
                                                    alignItems: {
                                                        xs: "flex-start",
                                                        sm: "center",
                                                    },
                                                    gap: 2,
                                                }}
                                            >
                                                {/* ICON */}

                                                <Box
                                                    sx={{
                                                        width: 42,
                                                        height: 42,
                                                        borderRadius: 2,
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        justifyContent:
                                                            "center",
                                                        flexShrink: 0,
                                                        backgroundColor:
                                                            "rgba(92,58,33,0.08)",
                                                        color:
                                                            "#5C3A21",
                                                    }}
                                                >
                                                    <HistoryOutlinedIcon />
                                                </Box>

                                                {/* DETAILS */}

                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontWeight:
                                                                600,
                                                            fontSize:
                                                                "0.95rem",
                                                        }}
                                                    >
                                                        Returned{" "}

                                                        {
                                                            book.title
                                                        }

                                                    </Typography>



                                                    <Typography
                                                        sx={{
                                                            color:
                                                                "text.secondary",
                                                            fontSize:
                                                                "0.75rem",
                                                            mt: 0.6,
                                                        }}
                                                    >
                                                        Borrowed:{" "}
                                                        {formatDate(
                                                            book.borrowedDate
                                                        )}
                                                    </Typography>

                                                    <Typography
                                                        sx={{
                                                            color:
                                                                "text.secondary",
                                                            fontSize:
                                                                "0.75rem",
                                                            mt: 0.2,
                                                        }}
                                                    >
                                                        Returned:{" "}
                                                        {formatDate(
                                                            book.returnedDate
                                                        )}
                                                    </Typography>

                                                    {book.fine >
                                                        0 && (
                                                            <Typography
                                                                sx={{
                                                                    color:
                                                                        "#B42318",
                                                                    fontSize:
                                                                        "0.75rem",
                                                                    fontWeight:
                                                                        500,
                                                                    mt: 0.5,
                                                                }}
                                                            >
                                                                Fine:
                                                                {" "}
                                                                ₹
                                                                {book.fine.toLocaleString(
                                                                    "en-IN",
                                                                    {
                                                                        minimumFractionDigits:
                                                                            2,
                                                                    }
                                                                )}
                                                            </Typography>
                                                        )}
                                                </Box>

                                                {/* STATUS */}

                                                <Chip
                                                    label={
                                                        book.status
                                                    }
                                                    size="small"
                                                    sx={{
                                                        backgroundColor:
                                                            "rgba(76,120,75,0.10)",
                                                        color:
                                                            "#4C784B",
                                                    }}
                                                />
                                            </Box>
                                        </CardContent>

                                        {index <
                                            paginatedHistory.length -
                                            1 && (
                                                <Divider />
                                            )}
                                    </Box>
                                );
                            }

                            /*
                             * =========================================
                             * WALLET TRANSACTION ITEM
                             * =========================================
                             */

                            const transaction =
                                item.transaction;

                            const isCredit =
                                transaction.transactionType.toLowerCase() ===
                                "credit";

                            return (
                                <Box
                                    key={item.id}
                                    sx={{
                                        backgroundColor:
                                            index % 2 === 0
                                                ? "rgba(92,58,33,0.025)"
                                                : "rgba(92,58,33,0.07)",

                                        borderBottom:
                                            index <
                                                paginatedHistory.length - 1
                                                ? "1px solid rgba(92,58,33,0.08)"
                                                : "none",
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            p: {
                                                xs: 2,
                                                md: 3,
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                gap: 2,
                                            }}
                                        >
                                            {/* ICON */}

                                            <Box
                                                sx={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius:
                                                        2,
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    flexShrink: 0,
                                                    backgroundColor:
                                                        isCredit
                                                            ? "rgba(46,125,50,0.10)"
                                                            : "rgba(198,40,40,0.10)",
                                                }}
                                            >
                                                {isCredit ? (
                                                    <AddOutlinedIcon
                                                        sx={{
                                                            color:
                                                                "#2E7D32",
                                                        }}
                                                    />
                                                ) : (
                                                    <CurrencyRupeeOutlinedIcon
                                                        sx={{
                                                            color:
                                                                "#C62828",
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* DETAILS */}

                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontWeight:
                                                            600,
                                                        fontSize:
                                                            "0.95rem",
                                                    }}
                                                >
                                                    {
                                                        transaction.description
                                                    }
                                                </Typography>

                                                <Typography
                                                    sx={{
                                                        color:
                                                            "text.secondary",
                                                        fontSize:
                                                            "0.75rem",
                                                        mt: 0.4,
                                                    }}
                                                >
                                                    {formatDate(
                                                        transaction.createdAt
                                                    )}
                                                </Typography>
                                            </Box>

                                            {/* AMOUNT */}

                                            <Box
                                                sx={{
                                                    textAlign:
                                                        "right",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontWeight:
                                                            700,
                                                        color:
                                                            isCredit
                                                                ? "#2E7D32"
                                                                : "#C62828",
                                                    }}
                                                >
                                                    {isCredit
                                                        ? "+"
                                                        : "-"}
                                                    {" "}
                                                    ₹
                                                    {transaction.amount.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits:
                                                                2,
                                                        }
                                                    )}
                                                </Typography>

                                                <Chip
                                                    label={
                                                        transaction.transactionType
                                                    }
                                                    size="small"
                                                    sx={{
                                                        mt: 0.5,
                                                        height: 22,
                                                        fontSize:
                                                            "0.65rem",
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </CardContent>

                                    {index <
                                        paginatedHistory.length -
                                        1 && (
                                            <Divider />
                                        )}
                                </Box>
                            );
                        }
                    )}

                    {/* =================================================
                        ONE PAGINATION FOR EVERYTHING
                    ================================================= */}

                    {combinedHistory.length >
                        HISTORY_PER_PAGE && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent:
                                        "center",
                                    alignItems:
                                        "center",
                                    py: 3,
                                    borderTop:
                                        "1px solid rgba(92,58,33,0.08)",
                                    backgroundColor:
                                        "rgba(92,58,33,0.02)",
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
        </Box>
    );
}
