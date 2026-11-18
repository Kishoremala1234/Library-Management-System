"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Box,
    Card,
    CardContent,
    Chip,
    Button,
    InputAdornment,
    TextField,
    Typography,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Stack,
    IconButton,
    MenuItem,
    Divider,
} from "@mui/material";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import MenuBookTwoToneIcon from "@mui/icons-material/MenuBookTwoTone";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";

type Book = {
    bookId: string;
    title: string;
    author: string;
    isbn: string | null;
    description: string | null;
    coverImage: string | null;
    publisher: string | null;
    publishedYear: number | null;
    categoryId: string;
    categoryName: string;
    totalCopies: number;
    availableCopies: number;
    price: number;
};

type Category = {
    categoryId: string;
    categoryName: string;
};

type BorrowedBook = {
    borrowingId: string;
    bookId: string;
    title: string;
    author: string;
    borrowedDate: string;
    dueDate: string;
    fine: number;
    status: string;
};

export default function BrowseBooksPage() {
    const router = useRouter();

    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [borrowingBookId, setBorrowingBookId] =
        useState<string | null>(null);

    const [purchasingBookId, setPurchasingBookId] =
        useState<string | null>(null);

    const [selectedBook, setSelectedBook] =
        useState<Book | null>(null);

    const [selectedPurchaseBook, setSelectedPurchaseBook] =
        useState<Book | null>(null);

    const [purchaseQuantity, setPurchaseQuantity] = useState(1);

    const [paymentMethod, setPaymentMethod] =
        useState("Wallet");

    const [hasOverdueOrFine, setHasOverdueOrFine] =
        useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    /*
     * =====================================================
     * PAYMENT AVAILABILITY
     * =====================================================
     */

    const paymentUnavailable =
        paymentMethod === "UPI" ||
        paymentMethod === "Card";

    /*
     * =====================================================
     * BORROW BUTTON CLICK
     * =====================================================
     */

    const handleBorrowClick = (book: Book) => {
        if (book.availableCopies <= 0) {
            return;
        }

        if (hasOverdueOrFine) {
            return;
        }

        if (borrowingBookId) {
            return;
        }

        setSelectedBook(book);
    };

    /*
     * =====================================================
     * BUY NOW BUTTON CLICK
     * =====================================================
     */

    const handleBuyNowClick = (book: Book) => {
        if (book.availableCopies <= 0) {
            return;
        }

        if (purchasingBookId) {
            return;
        }

        setPurchaseQuantity(1);
        setPaymentMethod("Wallet");
        setSelectedPurchaseBook(book);
    };

    /*
     * =====================================================
     * NOTIFY BUTTON
     * =====================================================
     */

    const handleNotifyClick = async (book: Book) => {
        try {
            const token =
                sessionStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            const response = await fetch(
                "http://localhost:5011/api/User/notify-availability",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        bookId: book.bookId,
                    }),
                }
            );

            const responseText =
                await response.text();

            let result: {
                message?: string;
            } = {};

            if (responseText.trim()) {
                try {
                    result = JSON.parse(responseText);
                } catch {
                    result = {
                        message: responseText,
                    };
                }
            }

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

                setSnackbar({
                    open: true,
                    message:
                        result.message ||
                        "Unable to notify the admin.",
                    severity: "error",
                });

                return;
            }

            setSnackbar({
                open: true,
                message:
                    result.message ||
                    `Admin has been notified about "${book.title}".`,
                severity: "success",
            });
        } catch (error) {
            console.error(
                "Notify availability error:",
                error
            );

            setSnackbar({
                open: true,
                message:
                    "Unable to connect to the server.",
                severity: "error",
            });
        }
    };

    /*
     * =====================================================
     * PURCHASE QUANTITY
     * =====================================================
     */

    const decreasePurchaseQuantity = () => {
        setPurchaseQuantity((current) =>
            Math.max(1, current - 1)
        );
    };

    const increasePurchaseQuantity = () => {
        if (!selectedPurchaseBook) {
            return;
        }

        setPurchaseQuantity((current) =>
            Math.min(
                selectedPurchaseBook.availableCopies,
                current + 1
            )
        );
    };

    /*
     * =====================================================
     * CONFIRM PURCHASE
     * =====================================================
     */

    const handleConfirmPurchase = async () => {
        if (!selectedPurchaseBook) {
            return;
        }

        /*
         * Do not continue if the selected payment
         * method is currently unavailable.
         */
        if (paymentUnavailable) {
            return;
        }

        const bookId =
            selectedPurchaseBook.bookId;

        const quantity = Math.min(
            Math.max(1, purchaseQuantity),
            selectedPurchaseBook.availableCopies
        );

        const selectedPaymentMethod =
            paymentMethod;

        setSelectedPurchaseBook(null);

        try {
            const token =
                sessionStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                router.replace("/login");
                return;
            }

            setPurchasingBookId(bookId);

            const response = await fetch(
                "http://localhost:5011/api/Payment/buy",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        bookId,
                        quantity,
                        paymentMethod:
                            selectedPaymentMethod,
                    }),
                }
            );

            const responseText =
                await response.text();

            let result: {
                message?: string;
                purchase?: unknown;
            } = {};

            if (responseText.trim()) {
                try {
                    result =
                        JSON.parse(
                            responseText
                        );
                } catch {
                    result = {
                        message:
                            responseText,
                    };
                }
            }

            if (!response.ok) {
                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");

                    return;
                }

                if (
                    response.status === 403
                ) {
                    router.replace("/user");

                    return;
                }

                setSnackbar({
                    open: true,
                    message:
                        result.message ||
                        "Unable to purchase this book.",
                    severity: "error",
                });

                return;
            }

            setBooks(
                (currentBooks) =>
                    currentBooks.map(
                        (book) =>
                            book.bookId ===
                                bookId
                                ? {
                                    ...book,
                                    availableCopies:
                                        Math.max(
                                            0,
                                            book.availableCopies -
                                            quantity
                                        ),
                                }
                                : book
                    )
            );

            setSnackbar({
                open: true,
                message:
                    result.message ||
                    "Book purchased successfully.",
                severity: "success",
            });
        } catch (error) {
            console.error(
                "Purchase book error:",
                error
            );

            setSnackbar({
                open: true,
                message:
                    "Unable to connect to the server.",
                severity: "error",
            });
        } finally {
            setPurchasingBookId(null);
        }
    };

    /*
     * =====================================================
     * CONFIRM BORROW
     * =====================================================
     */

    const handleConfirmBorrow = async () => {
        if (!selectedBook) {
            return;
        }

        const bookId =
            selectedBook.bookId;

        setSelectedBook(null);

        try {
            const token =
                sessionStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                router.replace("/login");
                return;
            }

            setBorrowingBookId(bookId);

            const response = await fetch(
                "http://localhost:5011/api/User/borrow",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        bookId,
                    }),
                }
            );

            const responseText =
                await response.text();

            let result: {
                message?: string;
            } = {};

            if (responseText.trim()) {
                try {
                    result =
                        JSON.parse(
                            responseText
                        );
                } catch {
                    result = {
                        message:
                            responseText,
                    };
                }
            }

            if (!response.ok) {
                if (
                    response.status === 401
                ) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");

                    return;
                }

                if (
                    response.status === 403
                ) {
                    router.replace("/user");

                    return;
                }

                setSnackbar({
                    open: true,
                    message:
                        result.message ||
                        "This book is not available.",
                    severity: "error",
                });

                return;
            }

            setBooks(
                (currentBooks) =>
                    currentBooks.map(
                        (book) =>
                            book.bookId ===
                                bookId
                                ? {
                                    ...book,
                                    availableCopies:
                                        Math.max(
                                            0,
                                            book.availableCopies -
                                            1
                                        ),
                                }
                                : book
                    )
            );

            setSnackbar({
                open: true,
                message:
                    "Book borrowed successfully.",
                severity: "success",
            });
        } catch (error) {
            console.error(
                "Borrow book error:",
                error
            );

            setSnackbar({
                open: true,
                message:
                    "Unable to connect to the server.",
                severity: "error",
            });
        } finally {
            setBorrowingBookId(null);
        }
    };

    /*
     * =====================================================
     * LOAD BOOKS + CATEGORIES + USER BORROWING STATUS
     * =====================================================
     */

    useEffect(() => {
        const loadData = async () => {
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
                 * LOAD BOOKS
                 */

                const booksResponse =
                    await fetch(
                        "http://localhost:5011/api/Books",
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                const booksText =
                    await booksResponse.text();

                let booksResult:
                    | Book[]
                    | {
                        message?: string;
                    } = [];

                if (booksText.trim()) {
                    try {
                        booksResult =
                            JSON.parse(
                                booksText
                            );
                    } catch {
                        booksResult = {
                            message:
                                booksText,
                        };
                    }
                }

                if (!booksResponse.ok) {
                    if (
                        booksResponse.status ===
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
                        booksResponse.status ===
                        403
                    ) {
                        router.replace(
                            "/user"
                        );

                        return;
                    }

                    throw new Error(
                        !Array.isArray(
                            booksResult
                        )
                            ? booksResult.message ||
                            "Failed to load books."
                            : "Failed to load books."
                    );
                }

                if (
                    Array.isArray(
                        booksResult
                    )
                ) {
                    setBooks(
                        booksResult
                    );
                }

                /*
                 * LOAD CATEGORIES
                 */

                const categoriesResponse =
                    await fetch(
                        "http://localhost:5011/api/Books/categories",
                        {
                            method: "GET",
                        }
                    );

                const categoriesText =
                    await categoriesResponse.text();

                let categoriesResult:
                    | Category[]
                    | {
                        message?: string;
                    } = [];

                if (
                    categoriesText.trim()
                ) {
                    try {
                        categoriesResult =
                            JSON.parse(
                                categoriesText
                            );
                    } catch {
                        categoriesResult = {
                            message:
                                categoriesText,
                        };
                    }
                }

                if (
                    !categoriesResponse.ok
                ) {
                    throw new Error(
                        !Array.isArray(
                            categoriesResult
                        )
                            ? categoriesResult.message ||
                            "Failed to load categories."
                            : "Failed to load categories."
                    );
                }

                if (
                    Array.isArray(
                        categoriesResult
                    )
                ) {
                    setCategories(
                        categoriesResult
                    );
                }

                /*
                 * LOAD BORROWED BOOKS
                 */

                const borrowedResponse =
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

                const borrowedText =
                    await borrowedResponse.text();

                let borrowedResult:
                    | BorrowedBook[]
                    | {
                        message?: string;
                    } = [];

                if (
                    borrowedText.trim()
                ) {
                    try {
                        borrowedResult =
                            JSON.parse(
                                borrowedText
                            );
                    } catch {
                        borrowedResult = {
                            message:
                                borrowedText,
                        };
                    }
                }

                if (
                    !borrowedResponse.ok
                ) {
                    if (
                        borrowedResponse.status ===
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
                        borrowedResponse.status ===
                        403
                    ) {
                        router.replace(
                            "/user"
                        );

                        return;
                    }

                    throw new Error(
                        !Array.isArray(
                            borrowedResult
                        )
                            ? borrowedResult.message ||
                            "Failed to check borrowed books."
                            : "Failed to check borrowed books."
                    );
                }

                /*
                 * CHECK OVERDUE / FINE
                 */

                if (
                    Array.isArray(
                        borrowedResult
                    )
                ) {
                    const overdueOrFine =
                        borrowedResult.some(
                            (book) => {
                                const status =
                                    book.status
                                        ?.trim()
                                        .toLowerCase();

                                return (
                                    status ===
                                    "overdue" ||
                                    Number(
                                        book.fine
                                    ) > 0
                                );
                            }
                        );

                    setHasOverdueOrFine(
                        overdueOrFine
                    );
                } else {
                    setHasOverdueOrFine(
                        false
                    );
                }
            } catch (error) {
                console.error(
                    "Browse books API error:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load books."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    /*
     * =====================================================
     * SEARCH + CATEGORY FILTER
     * =====================================================
     */

    const filteredBooks =
        books.filter(
            (book) => {
                const searchValue =
                    search
                        .trim()
                        .toLowerCase();

                const matchesSearch =
                    !searchValue ||
                    book.title
                        .toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    book.author
                        .toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    (book.isbn ?? "")
                        .toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    book.categoryName
                        .toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    (book.description ?? "")
                        .toLowerCase()
                        .includes(
                            searchValue
                        );

                const matchesCategory =
                    selectedCategory ===
                    "all" ||
                    book.categoryId ===
                    selectedCategory;

                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );

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
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                }}
            >
                <CircularProgress
                    sx={{
                        color: "#5C3A21",
                    }}
                />

                <Typography
                    color="text.secondary"
                    sx={{
                        fontWeight: 500,
                    }}
                >
                    Loading library collection...
                </Typography>
            </Box>
        );
    }

    /*
     * =====================================================
     * ERROR
     * =====================================================
     */

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
                <Typography
                    color="error"
                    sx={{
                        fontWeight: 600,
                    }}
                >
                    {error}
                </Typography>
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
                    xs: 2.5,
                    sm: 4,
                    md: 6,
                },

                background:
                    "linear-gradient(135deg, #F8F2E7 0%, #E6D6B9 100%)",
            }}
        >
            {/* HEADER */}

            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
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
                                fontSize: "0.75rem",
                                letterSpacing: "0.2em",
                                fontWeight: 700,
                                textTransform:
                                    "uppercase",
                                mb: 0.5,
                            }}
                        >
                            Library Collection
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
                            Browse Books
                        </Typography>
                    </Box>
                </Box>

                <Typography
                    sx={{
                        mt: 0.5,
                        ml: {
                            xs: 0,
                            sm: 7,
                        },
                        color: "#6B5E55",
                        fontSize: "0.95rem",
                    }}
                >
                    Discover and borrow your
                    next favorite read from our
                    catalog.
                </Typography>
            </Box>

            {/* SEARCH + CATEGORY FILTER */}

            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    flexDirection: {
                        xs: "column",
                        md: "row",
                    },
                    gap: 2,
                    alignItems: {
                        xs: "stretch",
                        md: "center",
                    },
                    width: "100%",
                }}
            >
                <Box
                    sx={{
                        width: {
                            xs: "100%",
                            md: "calc(100% - 260px)",
                        },
                        maxWidth: 640,
                    }}
                >
                    <TextField
                        fullWidth
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search title, author, ISBN, or category..."
                        slotProps={{
                            input: {
                                startAdornment:
                                    (
                                        <InputAdornment position="start">
                                            <SearchOutlinedIcon
                                                sx={{
                                                    color:
                                                        "#8A6545",
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                            },
                        }}
                        sx={{
                            minWidth: 180,

                            "& .MuiOutlinedInput-root": {
                                backgroundColor:
                                    "#FFFFFF",

                                borderRadius: 3,

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

                            "& .MuiInputBase-input": {
                                color: "#3E2616",
                            },

                            "& .MuiInputBase-input::placeholder": {
                                color: "#8A7A70",
                                opacity: 1,
                            },
                        }}
                    />
                </Box>

                <TextField
                    select
                    value={selectedCategory}
                    onChange={(event) =>
                        setSelectedCategory(
                            event.target.value
                        )
                    }
                    slotProps={{
                        select: {
                            MenuProps: {
                                slotProps: {
                                    paper: {
                                        sx: {
                                            maxHeight:
                                                6 *
                                                48 +
                                                16,
                                        },
                                    },
                                },
                            },
                        },
                    }}
                    sx={{
                        width: {
                            xs: "100%",
                            md: 240,
                        },

                        flexShrink: 0,

                        "& .MuiOutlinedInput-root": {
                            backgroundColor:
                                "#FFFFFF",

                            borderRadius: 3,

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
                            fontWeight: 500,
                        },

                        "& .MuiSelect-icon": {
                            color: "#5C3A21",
                        },
                    }}
                >
                    <MenuItem value="all">
                        All Categories
                    </MenuItem>

                    {categories.map(
                        (category) => (
                            <MenuItem
                                key={
                                    category.categoryId
                                }
                                value={
                                    category.categoryId
                                }
                            >
                                {
                                    category.categoryName
                                }
                            </MenuItem>
                        )
                    )}
                </TextField>
            </Box>

            {/* RESULT COUNT */}

            <Typography
                sx={{
                    mb: 3,
                    fontSize: "0.85rem",
                    color: "#7A6B63",
                    fontWeight: 600,
                }}
            >
                {filteredBooks.length}{" "}
                {filteredBooks.length === 1
                    ? "book"
                    : "books"}{" "}
                found
            </Typography>

            {/* BOOKS */}

            {filteredBooks.length === 0 ? (
                <Card
                    sx={{
                        p: 6,
                        textAlign: "center",
                        borderRadius: 4,
                        backgroundColor:
                            "#FFFFFF",
                        boxShadow:
                            "0 10px 30px rgba(62, 38, 22, 0.05)",
                    }}
                >
                    <MenuBookTwoToneIcon
                        sx={{
                            fontSize: 48,
                            color: "#8A6545",
                            mb: 1,
                            opacity: 0.7,
                        }}
                    />

                    <Typography
                        sx={{
                            fontWeight: 600,
                            fontSize: "1.1rem",
                            color: "#2C1810",
                        }}
                    >
                        {search ||
                        selectedCategory !==
                            "all"
                            ? "No books found"
                            : "No books available"}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            color: "#6B5E55",
                            fontSize: "0.85rem",
                        }}
                    >
                        {search
                            ? `We couldn't find anything matching "${search}".`
                            : selectedCategory !==
                                "all"
                                ? "There are no books available in this category."
                                : "There are currently no books in the library system."}
                    </Typography>
                </Card>
            ) : (
                <Box
                    sx={{
                        display: "grid",

                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, 1fr)",
                            md: "repeat(3, 1fr)",
                            lg: "repeat(4, 1fr)",
                        },

                        gap: 3.5,
                    }}
                >
                    {filteredBooks.map(
                        (book) => {
                            const isAvailable =
                                book.availableCopies >
                                0;

                            const isBorrowingThis =
                                borrowingBookId ===
                                book.bookId;

                            const isPurchasingThis =
                                purchasingBookId ===
                                book.bookId;

                            const borrowDisabled =
                                !isAvailable ||
                                hasOverdueOrFine ||
                                isBorrowingThis;

                            return (
                                <Card
                                    key={
                                        book.bookId
                                    }
                                    sx={{
                                        height:
                                            "100%",

                                        display:
                                            "flex",

                                        flexDirection:
                                            "column",

                                        borderRadius:
                                            3.5,

                                        backgroundColor:
                                            "#FFFFFF",

                                        border:
                                            "1px solid rgba(138, 101, 69, 0.12)",

                                        boxShadow:
                                            "0 4px 16px rgba(62, 38, 22, 0.04)",

                                        transition:
                                            "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

                                        position:
                                            "relative",

                                        overflow:
                                            "hidden",

                                        "&:hover": {
                                            transform:
                                                "translateY(-8px)",

                                            boxShadow:
                                                "0 16px 32px rgba(62, 38, 22, 0.12)",

                                            borderColor:
                                                "rgba(138, 101, 69, 0.3)",
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

                                            background:
                                                "linear-gradient(145deg, #F5EBE1 0%, #E6D7C3 100%)",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position:
                                                    "absolute",

                                                top: 0,
                                                left: 0,
                                                width:
                                                    "100%",
                                                height:
                                                    "100%",

                                                display:
                                                    "flex",

                                                flexDirection:
                                                    "column",

                                                alignItems:
                                                    "center",

                                                justifyContent:
                                                    "center",

                                                p: 3,
                                            }}
                                        >
                                            <MenuBookTwoToneIcon
                                                sx={{
                                                    fontSize:
                                                        52,

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
                                                        "0.95rem",

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

                                        <Chip
                                            label={
                                                book.categoryName
                                            }
                                            size="small"
                                            sx={{
                                                position:
                                                    "absolute",

                                                top: 12,
                                                left: 12,

                                                backgroundColor:
                                                    "rgba(255, 255, 255, 0.9)",

                                                backdropFilter:
                                                    "blur(6px)",

                                                color:
                                                    "#5C3A21",

                                                fontWeight:
                                                    600,

                                                fontSize:
                                                    "0.68rem",

                                                boxShadow:
                                                    "0 2px 8px rgba(0,0,0,0.08)",
                                            }}
                                        />
                                    </Box>

                                    {/* BODY */}

                                    <CardContent
                                        sx={{
                                            flex: 1,

                                            display:
                                                "flex",

                                            flexDirection:
                                                "column",

                                            p: 2.5,
                                        }}
                                    >
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

                                        <Typography
                                            sx={{
                                                mt: 0.5,
                                                color:
                                                    "#7A6B63",
                                                fontSize:
                                                    "0.82rem",
                                                fontWeight:
                                                    500,
                                            }}
                                        >
                                            by{" "}
                                            {
                                                book.author
                                            }
                                        </Typography>

                                        <Typography
                                            sx={{
                                                mt: 1.5,
                                                color:
                                                    "#574C45",
                                                fontSize:
                                                    "0.78rem",
                                                lineHeight:
                                                    1.5,
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
                                            {book.description ||
                                                "No preview description provided for this book."}
                                        </Typography>

                                        <Box
                                            sx={{
                                                mt:
                                                    "auto",
                                                pt: 2,
                                            }}
                                        >
                                            {/* AVAILABILITY */}

                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                sx={{
                                                    mb: 1.5,
                                                    pt: 1.5,
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "space-between",
                                                    borderTop:
                                                        "1px dashed rgba(138, 101, 69, 0.15)",
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    sx={{
                                                        alignItems:
                                                            "center",
                                                    }}
                                                >
                                                    {isAvailable ? (
                                                        <CheckCircleOutlinedIcon
                                                            sx={{
                                                                fontSize:
                                                                    16,
                                                                color:
                                                                    "#2E7D32",
                                                            }}
                                                        />
                                                    ) : (
                                                        <HighlightOffIcon
                                                            sx={{
                                                                fontSize:
                                                                    16,
                                                                color:
                                                                    "#D32F2F",
                                                            }}
                                                        />
                                                    )}

                                                    <Typography
                                                        sx={{
                                                            fontSize:
                                                                "0.72rem",
                                                            fontWeight:
                                                                600,
                                                            color:
                                                                isAvailable
                                                                    ? "#2E7D32"
                                                                    : "#D32F2F",
                                                        }}
                                                    >
                                                        {isAvailable
                                                            ? "Available"
                                                            : "Out of Stock"}
                                                    </Typography>
                                                </Stack>

                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            "0.72rem",
                                                        color:
                                                            "#7A6B63",
                                                        fontWeight:
                                                            500,
                                                    }}
                                                >
                                                    {
                                                        book.availableCopies
                                                    }{" "}
                                                    left
                                                </Typography>
                                            </Stack>

                                            {/* AMOUNT */}

                                            <Box
                                                sx={{
                                                    mb: 1.5,
                                                    px: 0.5,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            "0.82rem",
                                                        color:
                                                            "#574C45",
                                                        fontWeight:
                                                            600,
                                                    }}
                                                >
                                                    Amount :{" "}
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            color:
                                                                "#3E2616",
                                                            fontWeight:
                                                                700,
                                                        }}
                                                    >
                                                        ₹
                                                        {Number(
                                                            book.price
                                                        ).toLocaleString(
                                                            "en-IN",
                                                            {
                                                                minimumFractionDigits:
                                                                    2,
                                                                maximumFractionDigits:
                                                                    2,
                                                            }
                                                        )}
                                                    </Box>
                                                </Typography>
                                            </Box>

                                            {/* ACTION BUTTONS */}

                                            <Stack
                                                spacing={1}
                                            >
                                                {/* BORROW */}

                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    disabled={
                                                        borrowDisabled
                                                    }
                                                    onClick={() =>
                                                        handleBorrowClick(
                                                            book
                                                        )
                                                    }
                                                    sx={{
                                                        py: 1,
                                                        borderRadius:
                                                            2,
                                                        textTransform:
                                                            "none",
                                                        fontWeight:
                                                            600,
                                                        fontSize:
                                                            "0.85rem",

                                                        background:
                                                            !isAvailable ||
                                                                hasOverdueOrFine
                                                                ? "#E0E0E0"
                                                                : "linear-gradient(135deg, #5C3A21 0%, #8A6545 100%)",

                                                        color:
                                                            !isAvailable ||
                                                                hasOverdueOrFine
                                                                ? "#9E9E9E"
                                                                : "#FFFFFF",

                                                        boxShadow:
                                                            isAvailable &&
                                                                !hasOverdueOrFine
                                                                ? "0 4px 12px rgba(92, 58, 33, 0.2)"
                                                                : "none",

                                                        cursor:
                                                            !isAvailable ||
                                                                hasOverdueOrFine
                                                                ? "not-allowed"
                                                                : "pointer",

                                                        "&:hover":
                                                        {
                                                            background:
                                                                !isAvailable ||
                                                                    hasOverdueOrFine
                                                                    ? "#E0E0E0"
                                                                    : "linear-gradient(135deg, #3E2616 0%, #6D3A32 100%)",

                                                            boxShadow:
                                                                isAvailable &&
                                                                    !hasOverdueOrFine
                                                                    ? "0 6px 16px rgba(62, 38, 22, 0.3)"
                                                                    : "none",
                                                        },

                                                        "&.Mui-disabled":
                                                        {
                                                            backgroundColor:
                                                                "#E0E0E0",
                                                            color:
                                                                "#9E9E9E",
                                                            pointerEvents:
                                                                "auto",
                                                        },
                                                    }}
                                                >
                                                    {isBorrowingThis
                                                        ? "Borrowing..."
                                                        : isAvailable
                                                            ? "Borrow Book"
                                                            : "Unavailable"}
                                                </Button>

                                                {/* BUY / NOTIFY */}

                                                {isAvailable ? (
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        startIcon={
                                                            isPurchasingThis ? (
                                                                <CircularProgress
                                                                    size={
                                                                        17
                                                                    }
                                                                    sx={{
                                                                        color:
                                                                            "#5C3A21",
                                                                    }}
                                                                />
                                                            ) : (
                                                                <ShoppingCartOutlinedIcon
                                                                    sx={{
                                                                        fontSize:
                                                                            18,
                                                                    }}
                                                                />
                                                            )
                                                        }
                                                        disabled={
                                                            isPurchasingThis
                                                        }
                                                        onClick={() =>
                                                            handleBuyNowClick(
                                                                book
                                                            )
                                                        }
                                                        sx={{
                                                            py: 1,
                                                            borderRadius:
                                                                2,
                                                            textTransform:
                                                                "none",
                                                            fontWeight:
                                                                600,
                                                            fontSize:
                                                                "0.85rem",
                                                            color:
                                                                "#5C3A21",
                                                            borderColor:
                                                                "#8A6545",
                                                            backgroundColor:
                                                                "#FFFFFF",

                                                            "&:hover":
                                                            {
                                                                borderColor:
                                                                    "#3E2616",
                                                                backgroundColor:
                                                                    "rgba(92, 58, 33, 0.05)",
                                                            },
                                                        }}
                                                    >
                                                        {isPurchasingThis
                                                            ? "Purchasing..."
                                                            : "Buy Now"}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        startIcon={
                                                            <NotificationsNoneOutlinedIcon
                                                                sx={{
                                                                    fontSize:
                                                                        18,
                                                                }}
                                                            />
                                                        }
                                                        onClick={() =>
                                                            handleNotifyClick(
                                                                book
                                                            )
                                                        }
                                                        sx={{
                                                            py: 1,
                                                            borderRadius:
                                                                2,
                                                            textTransform:
                                                                "none",
                                                            fontWeight:
                                                                600,
                                                            fontSize:
                                                                "0.85rem",
                                                            color:
                                                                "#8A6545",
                                                            borderColor:
                                                                "#B49A72",
                                                            backgroundColor:
                                                                "#FFFFFF",

                                                            "&:hover":
                                                            {
                                                                borderColor:
                                                                    "#5C3A21",
                                                                backgroundColor:
                                                                    "rgba(92, 58, 33, 0.05)",
                                                            },
                                                        }}
                                                    >
                                                        Notify
                                                    </Button>
                                                )}
                                            </Stack>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        }
                    )}
                </Box>
            )}

            {/* BORROW CONFIRMATION DIALOG */}

            <Dialog
                open={
                    selectedBook !== null
                }
                onClose={() =>
                    setSelectedBook(null)
                }
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            p: 1,
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        color: "#2C1810",
                        pb: 1,
                    }}
                >
                    Confirm Borrow
                </DialogTitle>

                <DialogContent>
                    <DialogContentText
                        sx={{
                            color: "#574C45",
                            fontSize: "0.95rem",
                        }}
                    >
                        Are you sure you want
                        to borrow{" "}
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
                        pt: 1,
                        px: 3,
                        justifyContent:
                            "space-between",
                        pb: 2,
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
                            color: "#7A6B63",
                            fontWeight: 600,
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleConfirmBorrow
                        }
                        variant="contained"
                        disabled={
                            borrowingBookId !==
                            null
                        }
                        sx={{
                            px: 3,
                            borderRadius: 2,
                            textTransform:
                                "none",
                            fontWeight: 600,
                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            "&:hover":
                            {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },
                        }}
                    >
                        {borrowingBookId ? (
                            <CircularProgress
                                size={20}
                                sx={{
                                    color:
                                        "#FFFFFF",
                                }}
                            />
                        ) : (
                            "Confirm"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* BUY NOW DIALOG */}

            <Dialog
                open={
                    selectedPurchaseBook !==
                    null
                }
                onClose={() =>
                    purchasingBookId === null &&
                    setSelectedPurchaseBook(
                        null
                    )
                }
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            p: 1,
                            backgroundColor:
                                "#FFFDF7",
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        color: "#2C1810",
                        pb: 0.5,
                    }}
                >
                    Confirm Purchase
                </DialogTitle>

                <DialogContent>
                    {/* BOOK DETAILS */}

                    <Box
                        sx={{
                            mb: 2,
                            mt: 0.5,
                        }}
                    >
                        <Typography
                            sx={{
                                color: "#3E2616",
                                fontSize: "1rem",
                                fontWeight: 700,
                                lineHeight: 1.4,
                            }}
                        >
                            {
                                selectedPurchaseBook?.title
                            }
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.3,
                                color: "#7A6B63",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                            }}
                        >
                            by{" "}
                            {
                                selectedPurchaseBook?.author
                            }
                        </Typography>
                    </Box>

                    <Divider
                        sx={{
                            mb: 2,
                        }}
                    />

                    {/* QUANTITY */}

                    <Box
                        sx={{
                            mb: 2,
                        }}
                    >
                        <Typography
                            sx={{
                                mb: 0.8,
                                color: "#574C45",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                            }}
                        >
                            Quantity
                        </Typography>

                        <Box
                            sx={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "space-between",

                                border:
                                    "1px solid rgba(138, 101, 69, 0.35)",

                                borderRadius: 2,

                                px: 1,
                                py: 0.5,

                                backgroundColor:
                                    "#FFFFFF",
                            }}
                        >
                            <Button
                                onClick={
                                    decreasePurchaseQuantity
                                }
                                disabled={
                                    purchasingBookId !==
                                        null ||
                                    purchaseQuantity <=
                                        1
                                }
                                sx={{
                                    minWidth: 40,
                                    width: 40,
                                    height: 36,
                                    borderRadius: 1.5,
                                    color: "#5C3A21",
                                    fontSize: "1.2rem",
                                    fontWeight: 700,
                                    textTransform:
                                        "none",
                                }}
                            >
                                −
                            </Button>

                            <Typography
                                sx={{
                                    minWidth: 50,
                                    textAlign:
                                        "center",
                                    color:
                                        "#3E2616",
                                    fontSize:
                                        "1rem",
                                    fontWeight:
                                        700,
                                }}
                            >
                                {
                                    purchaseQuantity
                                }
                            </Typography>

                            <Button
                                onClick={
                                    increasePurchaseQuantity
                                }
                                disabled={
                                    purchasingBookId !==
                                        null ||
                                    !selectedPurchaseBook ||
                                    purchaseQuantity >=
                                        selectedPurchaseBook.availableCopies
                                }
                                sx={{
                                    minWidth: 40,
                                    width: 40,
                                    height: 36,
                                    borderRadius: 1.5,
                                    color: "#5C3A21",
                                    fontSize: "1.2rem",
                                    fontWeight: 700,
                                    textTransform:
                                        "none",
                                }}
                            >
                                +
                            </Button>
                        </Box>

                        <Typography
                            sx={{
                                mt: 0.5,
                                color: "#8A6545",
                                fontSize: "0.72rem",
                            }}
                        >
                            {
                                selectedPurchaseBook?.availableCopies
                            }{" "}
                            copies available
                        </Typography>
                    </Box>

                    {/* PAYMENT METHOD */}

                    <Box
                        sx={{
                            mb: 2,
                        }}
                    >
                        <Typography
                            sx={{
                                mb: 0.8,
                                color: "#574C45",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                            }}
                        >
                            Payment Method
                        </Typography>

                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={
                                paymentMethod
                            }
                            onChange={(
                                event
                            ) =>
                                setPaymentMethod(
                                    event.target
                                        .value
                                )
                            }
                            disabled={
                                purchasingBookId !==
                                null
                            }
                            sx={{
                                "& .MuiOutlinedInput-root":
                                {
                                    backgroundColor:
                                        "#FFFFFF",

                                    borderRadius:
                                        2,

                                    "& fieldset":
                                    {
                                        borderColor:
                                            "rgba(138, 101, 69, 0.35)",
                                    },

                                    "&:hover fieldset":
                                    {
                                        borderColor:
                                            "#8A6545",
                                    },

                                    "&.Mui-focused fieldset":
                                    {
                                        borderColor:
                                            "#5C3A21",
                                    },
                                },

                                "& .MuiSelect-select":
                                {
                                    color:
                                        "#3E2616",

                                    fontWeight:
                                        500,
                                },
                            }}
                        >
                            <MenuItem value="Wallet">
                                Wallet
                            </MenuItem>

                            <MenuItem value="UPI">
                                UPI
                            </MenuItem>

                            <MenuItem value="Card">
                                Net Banking
                            </MenuItem>
                        </TextField>

                        {/* PAYMENT UNAVAILABLE ERROR */}

                        {paymentUnavailable && (
                            <Typography
                                sx={{
                                    mt: 0.8,
                                    color: "#D32F2F",
                                    fontSize:
                                        "0.75rem",
                                    fontWeight:
                                        500,
                                }}
                            >
                                currently unavailable.
                            </Typography>
                        )}
                    </Box>

                    <Divider
                        sx={{
                            mb: 2,
                        }}
                    />

                    {/* PRICE SUMMARY */}

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection:
                                "column",
                            gap: 1,
                        }}
                    >
                        <Box
                            sx={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >
                            <Typography
                                sx={{
                                    color:
                                        "#7A6B63",
                                    fontSize:
                                        "0.82rem",
                                    fontWeight:
                                        600,
                                }}
                            >
                                Book Price
                            </Typography>

                            <Typography
                                sx={{
                                    color:
                                        "#3E2616",
                                    fontSize:
                                        "0.85rem",
                                    fontWeight:
                                        600,
                                }}
                            >
                                ₹
                                {Number(
                                    selectedPurchaseBook?.price ??
                                    0
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits:
                                            2,
                                        maximumFractionDigits:
                                            2,
                                    }
                                )}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >
                            <Typography
                                sx={{
                                    color:
                                        "#7A6B63",
                                    fontSize:
                                        "0.82rem",
                                    fontWeight:
                                        600,
                                }}
                            >
                                Quantity
                            </Typography>

                            <Typography
                                sx={{
                                    color:
                                        "#3E2616",
                                    fontSize:
                                        "0.85rem",
                                    fontWeight:
                                        600,
                                }}
                            >
                                {
                                    purchaseQuantity
                                }
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                mt: 0.5,
                                pt: 1.2,
                                borderTop:
                                    "1px dashed rgba(138, 101, 69, 0.25)",
                            }}
                        >
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
                                Total Amount
                            </Typography>

                            <Typography
                                sx={{
                                    color:
                                        "#5C3A21",
                                    fontSize:
                                        "1.15rem",
                                    fontWeight:
                                        800,
                                }}
                            >
                                ₹
                                {(
                                    Number(
                                        selectedPurchaseBook?.price ??
                                        0
                                    ) *
                                    purchaseQuantity
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits:
                                            2,
                                        maximumFractionDigits:
                                            2,
                                    }
                                )}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{
                        pt: 1,
                        px: 3,
                        justifyContent:
                            "space-between",
                        pb: 2,
                    }}
                >
                    <Button
                        onClick={() =>
                            setSelectedPurchaseBook(
                                null
                            )
                        }
                        disabled={
                            purchasingBookId !==
                            null
                        }
                        sx={{
                            textTransform:
                                "none",
                            color: "#7A6B63",
                            fontWeight: 600,
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleConfirmPurchase
                        }
                        variant="contained"
                        disabled={
                            purchasingBookId !==
                                null ||
                            paymentUnavailable ||
                            !selectedPurchaseBook ||
                            purchaseQuantity < 1 ||
                            purchaseQuantity >
                                (
                                    selectedPurchaseBook?.availableCopies ??
                                    0
                                )
                        }
                        sx={{
                            px: 3,
                            borderRadius: 2,
                            textTransform:
                                "none",
                            fontWeight: 600,

                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",

                            "&:hover":
                            {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },

                            "&.Mui-disabled":
                            {
                                backgroundColor:
                                    "#E0E0E0",
                                color:
                                    "#9E9E9E",
                            },
                        }}
                    >
                        {purchasingBookId ? (
                            <CircularProgress
                                size={20}
                                sx={{
                                    color:
                                        "#FFFFFF",
                                }}
                            />
                        ) : (
                            "Buy Now"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SNACKBAR */}

            <Snackbar
                open={
                    snackbar.open
                }
                autoHideDuration={3000}
                onClose={() =>
                    setSnackbar({
                        ...snackbar,
                        open: false,
                    })
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
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
                        width: "100%",
                        borderRadius: 2.5,
                        fontWeight: 500,
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