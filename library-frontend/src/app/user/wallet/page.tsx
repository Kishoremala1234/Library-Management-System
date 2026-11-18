"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";

type Wallet = {
    walletId: string;
    userId: string;
    balance: number;
};

type WalletTransaction = {
    transactionId: string;
    transactionType: string;
    amount: number;
    description: string;
    referenceId: string | null;
    createdAt: string;
};

type ApiResponse = {
    message?: string;
    count?: number;
};

const TRANSACTIONS_PER_PAGE = 5;

const readApiResponse = async (
    response: Response
): Promise<ApiResponse> => {
    const text = await response.text();

    if (!text.trim()) {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(text);

        if (
            typeof parsed === "object" &&
            parsed !== null
        ) {
            const data =
                parsed as Record<string, unknown>;

            return {
                message:
                    typeof data.message === "string"
                        ? data.message
                        : undefined,

                count:
                    typeof data.count === "number"
                        ? data.count
                        : undefined,
            };
        }

        return {};
    } catch {
        return {};
    }
};

export default function WalletPage() {
    const router = useRouter();

    const [wallet, setWallet] =
        useState<Wallet | null>(null);

    const [transactions, setTransactions] =
        useState<WalletTransaction[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [addingMoney, setAddingMoney] =
        useState(false);

    const [openDialog, setOpenDialog] =
        useState(false);

    const [amount, setAmount] =
        useState("");

    const [paymentMethod, setPaymentMethod] =
        useState("UPI");

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const [amountError, setAmountError] =
        useState("");

    const [showBalance, setShowBalance] =
        useState(false);

    // =====================================================
    // PAGINATION
    // =====================================================

    const [currentPage, setCurrentPage] =
        useState(1);

    const totalPages = Math.max(
        1,
        Math.ceil(
            transactions.length /
            TRANSACTIONS_PER_PAGE
        )
    );

    const paginatedTransactions =
        useMemo(() => {
            const startIndex =
                (currentPage - 1) *
                TRANSACTIONS_PER_PAGE;

            const endIndex =
                startIndex +
                TRANSACTIONS_PER_PAGE;

            return transactions.slice(
                startIndex,
                endIndex
            );
        }, [
            transactions,
            currentPage,
        ]);

    // =====================================================
    // FETCH WALLET
    // =====================================================

    const fetchWallet = useCallback(
        async () => {
            try {
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
                        "http://localhost:5011/api/Payment/wallet",
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                            cache: "no-store",
                        }
                    );

                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (!response.ok) {
                    const result =
                        await readApiResponse(
                            response
                        );

                    throw new Error(
                        result.message ||
                        "Unable to load wallet."
                    );
                }

                const text =
                    await response.text();

                if (!text.trim()) {
                    throw new Error(
                        "Wallet API returned an empty response."
                    );
                }

                const parsed: unknown =
                    JSON.parse(text);

                if (
                    typeof parsed !==
                    "object" ||
                    parsed === null
                ) {
                    throw new Error(
                        "Invalid wallet response."
                    );
                }

                setWallet(
                    parsed as Wallet
                );
            } catch (error) {
                console.error(
                    "Wallet API error:",
                    error
                );

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to load wallet."
                );
            }
        },
        [router]
    );

    // =====================================================
    // FETCH TRANSACTIONS
    // =====================================================

    const fetchTransactions =
        useCallback(async () => {
            try {
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

                const responseText =
                    await response.text();

                let result:
                    WalletTransaction[] = [];

                let errorMessage =
                    "Unable to load transactions.";

                if (
                    responseText.trim()
                ) {
                    try {
                        const parsed: unknown =
                            JSON.parse(
                                responseText
                            );

                        if (
                            Array.isArray(
                                parsed
                            )
                        ) {
                            result =
                                parsed as WalletTransaction[];
                        } else if (
                            typeof parsed ===
                                "object" &&
                            parsed !== null &&
                            "message" in parsed
                        ) {
                            const messageValue =
                                (
                                    parsed as {
                                        message?: unknown;
                                    }
                                ).message;

                            if (
                                typeof messageValue ===
                                "string"
                            ) {
                                errorMessage =
                                    messageValue;
                            }
                        }
                    } catch {
                        // Response was not valid JSON.
                    }
                }

                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        errorMessage
                    );
                }

                setTransactions(result);

                // Reset to first page whenever
                // transaction data is refreshed.
                setCurrentPage(1);
            } catch (error) {
                console.error(
                    "Transaction API error:",
                    error
                );

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to load transactions."
                );
            }
        }, [router]);

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        const loadWallet =
            async () => {
                setLoading(true);

                await Promise.all([
                    fetchWallet(),
                    fetchTransactions(),
                ]);

                setLoading(false);
            };

        loadWallet();
    }, [
        fetchWallet,
        fetchTransactions,
    ]);

    // =====================================================
    // VALIDATE AMOUNT
    // =====================================================

    const validateAmount = (
        value: string
    ) => {
        if (!value) {
            setAmountError(
                "Please enter an amount."
            );

            return false;
        }

        const numericAmount =
            Number(value);

        if (
            Number.isNaN(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {
            setAmountError(
                "Enter a valid amount."
            );

            return false;
        }

        if (numericAmount < 10) {
            setAmountError(
                "Minimum amount is ₹10."
            );

            return false;
        }

        if (numericAmount > 50000) {
            setAmountError(
                "Maximum amount is ₹50,000."
            );

            return false;
        }

        setAmountError("");

        return true;
    };

    // =====================================================
    // ADD MONEY
    // =====================================================

    const handleAddMoney =
        async () => {
            if (
                !validateAmount(
                    amount
                )
            ) {
                return;
            }

            try {
                setAddingMoney(true);

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
                        "http://localhost:5011/api/Payment/wallet/add",
                        {
                            method: "POST",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                amount:
                                    Number(
                                        amount
                                    ),
                                paymentMethod,
                            }),
                        }
                    );

                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                    return;
                }

                if (!response.ok) {
                    const result =
                        await readApiResponse(
                            response
                        );

                    throw new Error(
                        result.message ||
                        "Unable to add money."
                    );
                }

                const addedAmount =
                    Number(amount);

                setOpenDialog(false);
                setAmount("");
                setAmountError("");

                await Promise.all([
                    fetchWallet(),
                    fetchTransactions(),
                ]);

                setSuccessMessage(
                    `₹${addedAmount.toFixed(
                        2
                    )} added to your wallet successfully.`
                );
            } catch (error) {
                console.error(
                    "Add money error:",
                    error
                );

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to add money."
                );
            } finally {
                setAddingMoney(false);
            }
        };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        date: string
    ) => {
        return new Date(
            date
        ).toLocaleString(
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

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight:
                        "100vh",
                    display: "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
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

    return (
        <Box
            sx={{
                minHeight:
                    "100vh",
                p: {
                    xs: 2,
                    sm: 3,
                    md: 5,
                },
            }}
        >
            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    alignItems:
                        "center",
                    gap: 1.5,
                }}
            >
                <IconButton
                    onClick={() =>
                        router.push(
                            "/user"
                        )
                    }
                    sx={{
                        color: "#5C3A21",
                        backgroundColor:
                            "rgba(255,255,255,0.45)",
                        flexShrink: 0,
                        mt: 2.5,

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
                            fontSize:
                                "0.7rem",
                            letterSpacing:
                                "0.2em",
                            fontWeight: 600,
                            mb: 0.5,
                        }}
                    >
                        ACCOUNT
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
                        My Wallet
                    </Typography>
                </Box>
            </Box>

            {/* ================================================= */}
            {/* WALLET BALANCE */}
            {/* ================================================= */}

            <Card
                sx={{
                    maxWidth: 900,
                    mb: 4,
                    borderRadius: 4,
                    overflow:
                        "hidden",
                    background:
                        "linear-gradient(135deg, #5C3A21, #8A6545)",
                    color: "#FFFDF7",
                    boxShadow:
                        "0 12px 35px rgba(62,38,22,0.18)",
                }}
            >
                <CardContent
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
                                    AVAILABLE
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
                                        fontWeight: 700,
                                        letterSpacing:
                                            "0.02em",
                                    }}
                                >
                                    {showBalance
                                        ? `₹${(
                                            wallet?.balance ??
                                            0
                                        ).toLocaleString(
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
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={
                                <AddOutlinedIcon />
                            }
                            onClick={() =>
                                setOpenDialog(
                                    true
                                )
                            }
                            sx={{
                                px: 3,
                                py: 1.3,
                                borderRadius:
                                    2,
                                textTransform:
                                    "none",
                                fontWeight:
                                    600,
                                backgroundColor:
                                    "#FFFDF7",
                                color:
                                    "#5C3A21",

                                "&:hover": {
                                    backgroundColor:
                                        "#F5EDE2",
                                },
                            }}
                        >
                            Add Money
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* ================================================= */}
            {/* TRANSACTIONS */}
            {/* ================================================= */}

            <Card
                sx={{
                    maxWidth: 900,
                    borderRadius: 3,
                    backgroundColor:
                        "rgba(255,253,247,0.92)",
                    boxShadow:
                        "0 10px 30px rgba(62,38,22,0.08)",
                }}
            >
                <CardContent
                    sx={{
                        p: {
                            xs: 2,
                            md: 4,
                        },
                    }}
                >
                    <Box
                        sx={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            gap: 1.5,
                            mb: 2,
                        }}
                    >
                        <PaymentOutlinedIcon
                            sx={{
                                color:
                                    "#5C3A21",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize:
                                    "1.2rem",
                                fontWeight:
                                    600,
                                color:
                                    "#3E2616",
                            }}
                        >
                            Recent Transactions
                        </Typography>
                    </Box>

                    <Divider
                        sx={{
                            mb: 1,
                        }}
                    />

                    {transactions.length ===
                        0 ? (
                        <Box
                            sx={{
                                py: 6,
                                textAlign:
                                    "center",
                            }}
                        >
                            <AccountBalanceWalletOutlinedIcon
                                sx={{
                                    fontSize:
                                        42,
                                    color:
                                        "text.secondary",
                                    mb: 1,
                                }}
                            />

                            <Typography
                                color="text.secondary"
                            >
                                No transactions
                                yet.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* ===================================== */}
                            {/* CURRENT PAGE TRANSACTIONS */}
                            {/* ===================================== */}

                            {paginatedTransactions.map(
                                (
                                    transaction
                                ) => {
                                    const isCredit =
                                        transaction.transactionType.toLowerCase() ===
                                        "credit";

                                    return (
                                        <Box
                                            key={
                                                transaction.transactionId
                                            }
                                            sx={{
                                                py: 2,
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                    "space-between",
                                                gap: 2,
                                                borderBottom:
                                                    "1px solid rgba(62,38,22,0.08)",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: 1.5,
                                                    minWidth:
                                                        0,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 42,
                                                        height: 42,
                                                        borderRadius:
                                                            "50%",
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        justifyContent:
                                                            "center",
                                                        flexShrink:
                                                            0,
                                                        backgroundColor:
                                                            isCredit
                                                                ? "rgba(46,125,50,0.1)"
                                                                : "rgba(198,40,40,0.1)",
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

                                                <Box
                                                    sx={{
                                                        minWidth:
                                                            0,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontWeight:
                                                                600,
                                                            fontSize:
                                                                "0.9rem",
                                                            wordBreak:
                                                                "break-word",
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
                                                            mt: 0.3,
                                                        }}
                                                    >
                                                        {formatDate(
                                                            transaction.createdAt
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box
                                                sx={{
                                                    textAlign:
                                                        "right",
                                                    flexShrink:
                                                        0,
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
                                                        : "-"}{" "}
                                                    ₹
                                                    {transaction.amount.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits:
                                                                2,
                                                            maximumFractionDigits:
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
                                    );
                                }
                            )}

                            {/* ===================================== */}
                            {/* PAGINATION */}
                            {/* ===================================== */}

                            {totalPages > 1 && (
                                <Box
                                    sx={{
                                        display:
                                            "flex",
                                        justifyContent:
                                            "center",
                                        mt: 3,
                                        mb: 1,
                                    }}
                                >
                                    <Pagination
                                        count={
                                            totalPages
                                        }
                                        page={
                                            currentPage
                                        }
                                        onChange={(
                                            _event,
                                            page
                                        ) =>
                                            setCurrentPage(
                                                page
                                            )
                                        }
                                        color="standard"
                                        shape="rounded"
                                        siblingCount={1}
                                        boundaryCount={1}
                                        sx={{
                                            "& .MuiPaginationItem-root":
                                                {
                                                    color:
                                                        "#5C3A21",
                                                },

                                            "& .Mui-selected":
                                                {
                                                    backgroundColor:
                                                        "#5C3A21",
                                                    color:
                                                        "#FFFDF7",

                                                    "&:hover":
                                                        {
                                                            backgroundColor:
                                                                "#4A2E1A",
                                                        },
                                                },
                                        }}
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ================================================= */}
            {/* ADD MONEY DIALOG */}
            {/* ================================================= */}

            <Dialog
                open={openDialog}
                onClose={() => {
                    if (!addingMoney) {
                        setOpenDialog(
                            false
                        );
                        setAmount("");
                        setAmountError("");
                    }
                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle
                    sx={{
                        fontWeight: 600,
                        color: "#3E2616",
                    }}
                >
                    Add Money
                </DialogTitle>

                <DialogContent>
                    <Typography
                        sx={{
                            mb: 3,
                            color:
                                "text.secondary",
                            fontSize:
                                "0.9rem",
                        }}
                    >
                        Add money to your
                        library wallet for
                        future book purchases.
                    </Typography>

                    <TextField
                        fullWidth
                        label="Amount"
                        value={amount}
                        onChange={(e) => {
                            const value =
                                e.target.value;

                            if (
                                !/^\d*(\.\d{0,2})?$/.test(
                                    value
                                )
                            ) {
                                return;
                            }

                            setAmount(value);

                            if (value) {
                                validateAmount(
                                    value
                                );
                            } else {
                                setAmountError(
                                    ""
                                );
                            }
                        }}
                        error={Boolean(
                            amountError
                        )}
                        helperText={
                            amountError ||
                            "Minimum ₹10 · Maximum ₹50,000"
                        }
                        disabled={
                            addingMoney
                        }
                        slotProps={{
                            input: {
                                startAdornment:
                                    (
                                        <InputAdornment position="start">
                                            ₹
                                        </InputAdornment>
                                    ),
                            },

                            htmlInput: {
                                inputMode:
                                    "decimal",
                            },
                        }}
                    />

                    <FormControl
                        fullWidth
                        sx={{
                            mt: 2.5,
                        }}
                    >
                        <InputLabel>
                            Payment Method
                        </InputLabel>

                        <Select
                            value={
                                paymentMethod
                            }
                            label="Payment Method"
                            onChange={(e) =>
                                setPaymentMethod(
                                    e.target
                                        .value
                                )
                            }
                            disabled={
                                addingMoney
                            }
                        >
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
                                    <PaymentOutlinedIcon fontSize="small" />
                                    UPI
                                </Box>
                            </MenuItem>

                            <MenuItem value="Card">
                                <Box
                                    sx={{
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        gap: 1,
                                    }}
                                >
                                    <CreditCardOutlinedIcon fontSize="small" />
                                    Card
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
                                    <AccountBalanceOutlinedIcon fontSize="small" />
                                    Net Banking
                                </Box>
                            </MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 3,
                        justifyContent:
                            "space-between",
                    }}
                >
                    <Button
                        onClick={() => {
                            setOpenDialog(
                                false
                            );
                            setAmount("");
                            setAmountError("");
                        }}
                        disabled={
                            addingMoney
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
                        variant="contained"
                        onClick={
                            handleAddMoney
                        }
                        disabled={
                            addingMoney
                        }
                        sx={{
                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",
                            color:
                                "#FFFDF7",
                            textTransform:
                                "none",
                            px: 3,

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #4A2E1A, #745337)",
                            },
                        }}
                    >
                        {addingMoney ? (
                            <CircularProgress
                                size={22}
                                sx={{
                                    color:
                                        "#FFFDF7",
                                }}
                            />
                        ) : (
                            "Add Money"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ================================================= */}
            {/* SUCCESS SNACKBAR */}
            {/* ================================================= */}

            <Snackbar
                open={Boolean(
                    successMessage
                )}
                autoHideDuration={3000}
                onClose={() =>
                    setSuccessMessage("")
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={() =>
                        setSuccessMessage("")
                    }
                    severity="success"
                    variant="filled"
                    sx={{
                        width: "100%",
                    }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* ================================================= */}
            {/* ERROR SNACKBAR */}
            {/* ================================================= */}

            <Snackbar
                open={Boolean(
                    errorMessage
                )}
                autoHideDuration={4000}
                onClose={() =>
                    setErrorMessage("")
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={() =>
                        setErrorMessage("")
                    }
                    severity="error"
                    variant="filled"
                    sx={{
                        width: "100%",
                    }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}