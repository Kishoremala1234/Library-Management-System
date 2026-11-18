"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
    Menu,
    MenuItem,
    Pagination,
    Snackbar,
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    ListItemIcon,
    ListItemText,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";

import { InfinityLoop } from "@/components/infinity";

type AdminBook = {
    bookId: string;
    title: string;
    author: string;
    isbn: string | null;
    description: string | null;
    publisher: string | null;
    publishedYear: number | null;
    categoryId: string;
    categoryName: string;
    totalCopies: number;
    availableCopies: number;
    amount: number;
};

type Category = {
    categoryId: string;
    categoryName: string;
};

type BookForm = {
    title: string;
    author: string;
    isbn: string;
    description: string;
    publisher: string;
    publishedYear: string;
    categoryId: string;
    totalCopies: string;
    availableCopies: string;
    amount: string;
};

type ConfirmAction = "edit" | "delete" | null;

const API_BASE_URL = "http://localhost:5011/api/Admin";

const BOOKS_PER_PAGE = 10;

const emptyForm: BookForm = {
    title: "",
    author: "",
    isbn: "",
    description: "",
    publisher: "",
    publishedYear: "",
    categoryId: "",
    totalCopies: "1",
    availableCopies: "0",
    amount: "",
};

type BookFormErrors = {
    title?: string;
    author?: string;
    isbn?: string;
    publisher?: string;
    publishedYear?: string;
    categoryId?: string;
    totalCopies?: string;
    availableCopies?: string;
    amount?: string;
};

export default function AdminBooksPage() {
    const router = useRouter();

    const [books, setBooks] = useState<AdminBook[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [openDialog, setOpenDialog] = useState(false);
    const [editingBookId, setEditingBookId] =
        useState<string | null>(null);

    const [form, setForm] = useState<BookForm>({
        ...emptyForm,
    });

    const [formErrors, setFormErrors] =
        useState<BookFormErrors>({});

    const [saving, setSaving] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] =
        useState<ConfirmAction>(null);

    const [selectedBook, setSelectedBook] =
        useState<AdminBook | null>(null);

    const [confirmLoading, setConfirmLoading] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const [actionAnchorEl, setActionAnchorEl] =
        useState<null | HTMLElement>(null);

    const [actionBook, setActionBook] =
        useState<AdminBook | null>(null);

    const actionMenuOpen =
        Boolean(actionAnchorEl);

    const handleActionMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        book: AdminBook
    ) => {
        setActionAnchorEl(event.currentTarget);
        setActionBook(book);
    };

    const handleActionMenuClose = () => {
        setActionAnchorEl(null);
    };

    const handleMenuEdit = () => {
        if (!actionBook) {
            return;
        }

        const book = actionBook;

        handleActionMenuClose();
        handleEditClick(book);
    };

    const handleMenuDelete = () => {
        if (!actionBook) {
            return;
        }

        const book = actionBook;

        handleActionMenuClose();
        handleDeleteClick(book);
    };

    const getToken = () => {
        const token =
            sessionStorage.getItem("accessToken");

        if (!token) {
            router.replace("/login");
            return null;
        }

        return token;
    };

    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = (
        _event?: React.SyntheticEvent | Event,
        reason?: string
    ) => {
        if (reason === "clickaway") {
            return;
        }

        setSnackbarOpen(false);
    };

    const handleUnauthorized = useCallback(
        (status: number) => {
            if (status === 401) {
                sessionStorage.removeItem("accessToken");
                router.replace("/login");
                return true;
            }

            if (status === 403) {
                router.replace("/user");
                return true;
            }

            return false;
        },
        [router]
    );

    const parseResponse = async (
        response: Response
    ) => {
        const text = await response.text();

        if (!text.trim()) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                message: text,
            };
        }
    };

    const fetchBooksData = useCallback(
        async (
            token: string
        ): Promise<AdminBook[] | null> => {
            const response = await fetch(
                `${API_BASE_URL}/books`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const result =
                await parseResponse(response);

            if (!response.ok) {
                if (
                    handleUnauthorized(
                        response.status
                    )
                ) {
                    return null;
                }

                throw new Error(
                    result?.message ||
                    "Failed to load books."
                );
            }

            return Array.isArray(result)
                ? (result as AdminBook[])
                : [];
        },
        [handleUnauthorized]
    );

    const fetchCategoriesData = useCallback(
        async (
            token: string
        ): Promise<Category[] | null> => {
            const response = await fetch(
                `${API_BASE_URL}/categories`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const result =
                await parseResponse(response);

            if (!response.ok) {
                if (
                    handleUnauthorized(
                        response.status
                    )
                ) {
                    return null;
                }

                throw new Error(
                    result?.message ||
                    "Failed to load categories."
                );
            }

            return Array.isArray(result)
                ? (result as Category[])
                : [];
        },
        [handleUnauthorized]
    );

    const refreshBooks = async (
        token: string
    ) => {
        const updatedBooks =
            await fetchBooksData(token);

        if (updatedBooks !== null) {
            setBooks(updatedBooks);
        }
    };

    useEffect(() => {
        let cancelled = false;

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

                const [
                    bookResult,
                    categoryResult,
                ] = await Promise.all([
                    fetchBooksData(token),
                    fetchCategoriesData(token),
                ]);

                if (cancelled) {
                    return;
                }

                if (bookResult !== null) {
                    setBooks(bookResult);
                }

                if (categoryResult !== null) {
                    setCategories(categoryResult);
                }
            } catch (error) {
                console.error(
                    "Admin books API error:",
                    error
                );

                if (!cancelled) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load books."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [
        router,
        fetchBooksData,
        fetchCategoriesData,
    ]);

    const filteredBooks = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return books.filter((book) => {
            const matchesSearch =
                !searchValue ||
                book.title
                    .toLowerCase()
                    .includes(searchValue) ||
                book.author
                    .toLowerCase()
                    .includes(searchValue) ||
                (book.isbn ?? "")
                    .toLowerCase()
                    .includes(searchValue) ||
                book.categoryName
                    .toLowerCase()
                    .includes(searchValue) ||
                (book.description ?? "")
                    .toLowerCase()
                    .includes(searchValue);

            const matchesCategory =
                !selectedCategory ||
                book.categoryId ===
                selectedCategory;

            return (
                matchesSearch &&
                matchesCategory
            );
        });
    }, [
        books,
        search,
        selectedCategory,
    ]);

    const totalPages = Math.ceil(
        filteredBooks.length /
        BOOKS_PER_PAGE
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
        BOOKS_PER_PAGE;

    const paginatedBooks =
        filteredBooks.slice(
            startIndex,
            startIndex +
            BOOKS_PER_PAGE
        );

    const handleSearchChange = (
        value: string
    ) => {
        setSearch(value);
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

    const handleAddClick = () => {
        setEditingBookId(null);

        setForm({
            ...emptyForm,
        });

        setFormErrors({});
        setOpenDialog(true);
    };

    const handleEditClick = (
        book: AdminBook
    ) => {
        setEditingBookId(
            book.bookId
        );

        setForm({
            title: book.title,
            author: book.author,
            isbn: book.isbn ?? "",
            description:
                book.description ?? "",
            publisher:
                book.publisher ?? "",
            publishedYear:
                book.publishedYear !== null
                    ? book.publishedYear.toString()
                    : "",
            categoryId:
                book.categoryId,
            totalCopies:
                book.totalCopies.toString(),
            availableCopies:
                book.availableCopies.toString(),
            amount:
                book.amount !== null &&
                    book.amount !== undefined
                    ? book.amount.toString()
                    : "",
        });

        setFormErrors({});
        setOpenDialog(true);
    };

    const handleFormChange = (
        field: keyof BookForm,
        value: string
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        if (field in formErrors) {
            clearFieldError(
                field as keyof BookFormErrors
            );
        }
    };

    const clearFieldError = (
        field: keyof BookFormErrors
    ) => {
        setFormErrors((current) => ({
            ...current,
            [field]: undefined,
        }));
    };

    const handleCopiesChange = (
        field:
            | "totalCopies"
            | "availableCopies",
        value: string
    ) => {
        const numbersOnly =
            value.replace(
                /[^0-9]/g,
                ""
            );

        if (numbersOnly === "") {
            handleFormChange(
                field,
                ""
            );
            return;
        }

        const numericValue =
            Number(numbersOnly);

        if (numericValue > 100) {
            return;
        }

        handleFormChange(
            field,
            numbersOnly
        );
    };

    const handleAmountChange = (
        value: string
    ) => {
        const numbersOnly =
            value.replace(
                /[^0-9]/g,
                ""
            );

        if (numbersOnly === "") {
            handleFormChange(
                "amount",
                ""
            );
            return;
        }

        const numericValue =
            Number(numbersOnly);

        if (numericValue > 99999) {
            return;
        }

        handleFormChange(
            "amount",
            numbersOnly
        );
    };

    const validateForm = (): boolean => {
        const errors: BookFormErrors = {};

        const title =
            form.title.trim();

        const author =
            form.author.trim();

        const isbn =
            form.isbn.trim();

        const publishedYear =
            form.publishedYear.trim();

        const amount =
            Number(form.amount);

        const totalCopies =
            Number(form.totalCopies);

        const availableCopies =
            Number(form.availableCopies);

        const currentYear =
            new Date().getFullYear();

        if (!title) {
            errors.title =
                "Title is required.";
        }

        if (!author) {
            errors.author =
                "Author is required.";
        }

        if (!isbn) {
            errors.isbn =
                "ISBN is required.";
        } else if (
            !/^\d{10}$/.test(isbn)
        ) {
            errors.isbn =
                "ISBN must contain exactly 10 digits.";
        }

        if (!form.categoryId) {
            errors.categoryId =
                "Category is required.";
        }

        if (
            form.totalCopies.trim() === "" ||
            !/^\d+$/.test(
                form.totalCopies
            ) ||
            !Number.isInteger(
                totalCopies
            ) ||
            totalCopies < 1 ||
            totalCopies > 100
        ) {
            errors.totalCopies =
                "Total copies must be a whole number between 1 and 100.";
        }

        if (
            form.availableCopies.trim() === "" ||
            !/^\d+$/.test(
                form.availableCopies
            ) ||
            !Number.isInteger(
                availableCopies
            ) ||
            availableCopies < 0 ||
            availableCopies > 100
        ) {
            errors.availableCopies =
                "Available copies must be a whole number between 0 and 100.";
        } else if (
            availableCopies >=
            totalCopies
        ) {
            errors.availableCopies =
                "Available copies must be smaller than total copies.";
        }

        if (
            form.amount.trim() === ""
        ) {
            errors.amount =
                "Amount is required.";
        } else if (
            !/^\d+$/.test(
                form.amount
            ) ||
            !Number.isInteger(amount) ||
            amount < 1 ||
            amount > 99999
        ) {
            errors.amount =
                "Amount must be a whole number between 1 and 99999.";
        }

        if (
            publishedYear &&
            !/^\d{4}$/.test(
                publishedYear
            )
        ) {
            errors.publishedYear =
                "Published year must contain exactly 4 digits.";
        } else if (
            publishedYear &&
            Number(publishedYear) >
            currentYear
        ) {
            errors.publishedYear =
                `Published year cannot be greater than ${currentYear}.`;
        }

        setFormErrors(errors);

        return (
            Object.keys(errors).length ===
            0
        );
    };

    const checkDuplicateBook =
        (): string | null => {
            const title =
                form.title
                    .trim()
                    .toLowerCase();

            const isbn =
                form.isbn.trim();

            const duplicateBook =
                books.find((book) => {
                    if (
                        book.bookId ===
                        editingBookId
                    ) {
                        return false;
                    }

                    const sameTitle =
                        book.title
                            .trim()
                            .toLowerCase() ===
                        title;

                    const sameIsbn =
                        isbn !== "" &&
                        (book.isbn ?? "")
                            .trim() ===
                        isbn;

                    return (
                        sameTitle ||
                        sameIsbn
                    );
                });

            if (!duplicateBook) {
                return null;
            }

            const sameTitle =
                duplicateBook.title
                    .trim()
                    .toLowerCase() ===
                title;

            const sameIsbn =
                isbn !== "" &&
                (duplicateBook.isbn ?? "")
                    .trim() ===
                isbn;

            if (
                sameTitle &&
                sameIsbn
            ) {
                return "A book with this title and ISBN already exists.";
            }

            if (sameTitle) {
                return "A book with this title already exists.";
            }

            if (sameIsbn) {
                return "A book with this ISBN already exists.";
            }

            return null;
        };

    const buildBookPayload = () => {
        const publishedYear =
            form.publishedYear.trim();

        return {
            title:
                form.title.trim(),
            author:
                form.author.trim(),
            isbn:
                form.isbn.trim(),
            description:
                form.description.trim() ||
                null,
            publisher:
                form.publisher.trim() ||
                null,
            publishedYear:
                publishedYear
                    ? Number(
                        publishedYear
                    )
                    : null,
            categoryId:
                form.categoryId,
            totalCopies:
                Number(
                    form.totalCopies
                ),
            availableCopies:
                Number(
                    form.availableCopies
                ),
            amount:
                Number(
                    form.amount
                ),
        };
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return false;
        }

        const duplicateError =
            checkDuplicateBook();

        if (duplicateError) {
            const errors: BookFormErrors = {};

            if (
                duplicateError.includes(
                    "title and ISBN"
                )
            ) {
                errors.title =
                    duplicateError;
                errors.isbn =
                    duplicateError;
            } else if (
                duplicateError.includes(
                    "title"
                )
            ) {
                errors.title =
                    duplicateError;
            } else if (
                duplicateError.includes(
                    "ISBN"
                )
            ) {
                errors.isbn =
                    duplicateError;
            }

            setFormErrors(errors);

            return false;
        }

        try {
            setSaving(true);

            const token =
                getToken();

            if (!token) {
                return false;
            }

            const isEditing =
                Boolean(
                    editingBookId
                );

            const url =
                isEditing
                    ? `${API_BASE_URL}/books/${editingBookId}`
                    : `${API_BASE_URL}/books`;

            const method =
                isEditing
                    ? "PUT"
                    : "POST";

            const response =
                await fetch(
                    url,
                    {
                        method,
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${token}`,
                        },
                        body:
                            JSON.stringify(
                                buildBookPayload()
                            ),
                    }
                );

            const result =
                await parseResponse(
                    response
                );

            if (!response.ok) {
                if (
                    handleUnauthorized(
                        response.status
                    )
                ) {
                    return false;
                }

                setFormErrors({
                    title:
                        result?.message ||
                        result?.error ||
                        `Unable to ${isEditing
                            ? "update"
                            : "add"
                        } book.`,
                });

                return false;
            }

            await refreshBooks(
                token
            );

            setOpenDialog(false);
            setEditingBookId(null);

            setForm({
                ...emptyForm,
            });

            setFormErrors({});

            showSnackbar(
                isEditing
                    ? "Book updated successfully"
                    : "Book added successfully"
            );

            return true;
        } catch (error) {
            console.error(
                "Save book error:",
                error
            );

            setFormErrors({
                title:
                    error instanceof Error
                        ? error.message
                        : "Unable to connect to the server.",
            });

            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (
        bookId: string
    ) => {
        try {
            setConfirmLoading(true);

            const token =
                getToken();

            if (!token) {
                return;
            }

            const response =
                await fetch(
                    `${API_BASE_URL}/books/${bookId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const result =
                await parseResponse(
                    response
                );

            if (!response.ok) {
                if (
                    handleUnauthorized(
                        response.status
                    )
                ) {
                    return;
                }

                setError(
                    result?.message ||
                    result?.error ||
                    "Unable to delete book."
                );

                return;
            }

            setBooks(
                (currentBooks) =>
                    currentBooks.filter(
                        (book) =>
                            book.bookId !==
                            bookId
                    )
            );

            setConfirmOpen(false);
            setConfirmAction(null);
            setSelectedBook(null);

            showSnackbar(
                "Book deleted successfully"
            );
        } catch (error) {
            console.error(
                "Delete book error:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to delete book."
            );

            setConfirmOpen(false);
            setConfirmAction(null);
            setSelectedBook(null);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleUpdateClick = () => {
        if (!validateForm()) {
            return;
        }

        const duplicateError =
            checkDuplicateBook();

        if (duplicateError) {
            const errors: BookFormErrors = {};

            if (
                duplicateError.includes(
                    "title and ISBN"
                )
            ) {
                errors.title =
                    duplicateError;
                errors.isbn =
                    duplicateError;
            } else if (
                duplicateError.includes(
                    "title"
                )
            ) {
                errors.title =
                    duplicateError;
            } else if (
                duplicateError.includes(
                    "ISBN"
                )
            ) {
                errors.isbn =
                    duplicateError;
            }

            setFormErrors(errors);

            return;
        }

        const book =
            books.find(
                (item) =>
                    item.bookId ===
                    editingBookId
            );

        if (!book) {
            setFormErrors({
                title:
                    "The selected book could not be found.",
            });

            return;
        }

        setSelectedBook(book);
        setConfirmAction("edit");
        setConfirmOpen(true);
    };

    const handleDeleteClick = (
        book: AdminBook
    ) => {
        setSelectedBook(book);
        setConfirmAction("delete");
        setConfirmOpen(true);
    };

    const handleConfirmAction =
        async () => {
            if (!selectedBook) {
                return;
            }

            if (
                confirmAction ===
                "edit"
            ) {
                setConfirmOpen(false);

                const success =
                    await handleSave();

                if (success) {
                    setConfirmAction(
                        null
                    );

                    setSelectedBook(
                        null
                    );
                }

                return;
            }

            if (
                confirmAction ===
                "delete"
            ) {
                await handleDelete(
                    selectedBook.bookId
                );
            }
        };

    const handleCloseFormDialog =
        () => {
            if (saving) {
                return;
            }

            setOpenDialog(false);
            setEditingBookId(null);
            setFormErrors({});
        };

    const handleCloseConfirmDialog =
        () => {
            if (confirmLoading) {
                return;
            }

            setConfirmOpen(false);
            setConfirmAction(null);
            setSelectedBook(null);
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
                    Loading books...
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
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
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
                        gap: 1.5,
                        ml: 2,
                        transform:
                            "translateX(-20px)",
                    }}
                >
                    <IconButton
                        onClick={() =>
                            router.push("/admin")
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
                                fontWeight:
                                    600,
                                mb: 1,
                            }}
                        >
                            COLLECTION MANAGEMENT
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: {
                                    xs: "1.8rem",
                                    md: "2.6rem",
                                },
                                fontWeight:
                                    600,
                            }}
                        >
                            Books
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
                            Manage the library
                            collection.
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        flexWrap: "wrap",
                    }}
                >
                    <TextField
                        select
                        value={
                            selectedCategory
                        }
                        onChange={(event) => {
                            setSelectedCategory(
                                event.target
                                    .value
                            );
                            setCurrentPage(1);
                        }}
                        size="small"
                        slotProps={{
                            select: {
                                displayEmpty:
                                    true,
                                MenuProps: {
                                    slotProps: {
                                        paper: {
                                            sx: {
                                                maxHeight:
                                                    300,
                                            },
                                        },
                                    },
                                },
                            },
                        }}
                        sx={{
                            minWidth: 180,

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
                            },

                            "& .MuiSelect-icon":
                            {
                                color:
                                    "#5C3A21",
                            },
                        }}
                    >
                        <MenuItem value="">
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

                    <Button
                        startIcon={
                            <AddOutlinedIcon />
                        }
                        onClick={
                            handleAddClick
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
                        Add Book
                    </Button>
                </Box>
            </Box>

            <Box
                sx={{
                    mb: 3,
                    maxWidth: 640,
                }}
            >
                <TextField
                    fullWidth
                    value={search}
                    onChange={(event) =>
                        handleSearchChange(
                            event.target
                                .value
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
                        minWidth: 170,

                        "& .MuiOutlinedInput-root":
                        {
                            backgroundColor:
                                "#FFFFFF",
                            borderRadius: 3,

                            "& fieldset": {
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
                    }}
                />
            </Box>

            <Typography
                sx={{
                    mb: 2.5,
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

            {filteredBooks.length ===
                0 ? (
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
                        }}
                    >
                        No books found
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
                            ? `No books match "${search}".`
                            : "There are no active books in the library."}
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
                        <Box
                            sx={{
                                display: {
                                    xs: "none",
                                    md: "grid",
                                },
                                gridTemplateColumns:
                                    "minmax(240px, 1.5fr) minmax(160px, 1fr) minmax(140px, 0.8fr) 110px 100px 52px",
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
                                }}
                            >
                                AUTHOR
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
                                }}
                            >
                                CATEGORY
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
                                        "left",
                                    transform: "translateX(18px)",
                                }}
                            >
                                COPIES
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
                                        "left",
                                    transform: "translateX(18px)",
                                }}
                            >
                                AMOUNT
                            </Typography>

                            <Box />
                        </Box>

                        {paginatedBooks.map(
                            (
                                book,
                                index
                            ) => (
                                <Box
                                    key={
                                        book.bookId
                                    }
                                    sx={{
                                        display: {
                                            xs: "flex",
                                            md: "grid",
                                        },
                                        gridTemplateColumns:
                                        {
                                            md:
                                                "minmax(240px, 1.5fr) minmax(160px, 1fr) minmax(140px, 0.8fr) 110px 100px 52px",
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
                                                ? "rgba(92,58,33,0.08)"
                                                : "rgba(92,58,33,0.03)",

                                        borderBottom:
                                            index <
                                                paginatedBooks.length -
                                                1
                                                ? "1px solid rgba(92,58,33,0.08)"
                                                : "none",
                                        transition:
                                            "background-color 0.2s ease",

                                        // "&:hover":
                                        // {
                                        //     backgroundColor:
                                        //         "rgba(92,58,33,0.14)",
                                        // },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap: {
                                                xs: 1.5,
                                                md: 2,
                                            },
                                            minWidth:
                                                0,
                                            flex: {
                                                xs: 1,
                                                md:
                                                    "unset",
                                            },
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
                                                    {
                                                        xs:
                                                            "0.85rem",
                                                        md:
                                                            "0.9rem",
                                                    },
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
                                                    book.title
                                                }
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    display: {
                                                        xs:
                                                            "block",
                                                        md:
                                                            "none",
                                                    },
                                                    mt:
                                                        0.3,
                                                    fontSize:
                                                        "0.72rem",
                                                    color:
                                                        "text.secondary",
                                                    overflow:
                                                        "hidden",
                                                    textOverflow:
                                                        "ellipsis",
                                                    whiteSpace:
                                                        "nowrap",
                                                }}
                                            >
                                                {
                                                    book.author
                                                }
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography
                                        sx={{
                                            display: {
                                                xs:
                                                    "none",
                                                md:
                                                    "block",
                                            },
                                            fontSize:
                                                "0.82rem",
                                            color:
                                                "#6F625B",
                                            overflow:
                                                "hidden",
                                            textOverflow:
                                                "ellipsis",
                                            whiteSpace:
                                                "nowrap",
                                        }}
                                    >
                                        {
                                            book.author
                                        }
                                    </Typography>

                                    <Box
                                        sx={{
                                            display: {
                                                xs:
                                                    "none",
                                                md:
                                                    "block",
                                            },
                                        }}
                                    >
                                        <Chip
                                            label={
                                                book.categoryName ||
                                                "Uncategorized"
                                            }
                                            size="small"
                                            sx={{
                                                backgroundColor:
                                                    "rgba(184,134,11,0.10)",
                                                color:
                                                    "#8B6508",
                                                fontSize:
                                                    "0.68rem",
                                                height:
                                                    25,
                                                fontWeight:
                                                    500,
                                            }}
                                        />
                                    </Box>

                                    <Box
                                        sx={{
                                            display: {
                                                xs: "none",
                                                md: "flex",
                                            },
                                            alignItems: "center",
                                            justifyContent: "flex-end",
                                            gap: 0.6,
                                            pr: 3,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize:
                                                    "0.85rem",
                                                fontWeight:
                                                    600,
                                                color:
                                                    book.availableCopies >
                                                        0
                                                        ? "#4C784B"
                                                        : "#B42318",
                                            }}
                                        >
                                            {
                                                book.availableCopies
                                            }
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontSize:
                                                    "0.8rem",
                                                color:
                                                    "#9A8E86",
                                            }}
                                        >
                                            /
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontSize:
                                                    "0.8rem",
                                                color:
                                                    "#6F625B",
                                            }}
                                        >
                                            {
                                                book.totalCopies
                                            }
                                        </Typography>
                                    </Box>

                                    <Typography
                                        sx={{
                                            display: {
                                                xs:
                                                    "none",
                                                md:
                                                    "block",
                                            },
                                            fontSize:
                                                "0.82rem",
                                            fontWeight:
                                                600,
                                            color:
                                                "#5C3A21",
                                            transform: "translateX(40px)",
                                        }}
                                    >
                                        ₹{book.amount}
                                    </Typography>

                                    <Box
                                        sx={{
                                            display: {
                                                xs:
                                                    "flex",
                                                md:
                                                    "none",
                                            },
                                            alignItems:
                                                "center",
                                            gap: 0.7,
                                            ml: "auto",
                                            mr: 0.5,
                                        }}
                                    >
                                        <Chip
                                            label={
                                                book.categoryName ||
                                                "Uncategorized"
                                            }
                                            size="small"
                                            sx={{
                                                backgroundColor:
                                                    "rgba(184,134,11,0.10)",
                                                color:
                                                    "#8B6508",
                                                fontSize:
                                                    "0.6rem",
                                                height:
                                                    23,
                                            }}
                                        />

                                        <Typography
                                            sx={{
                                                fontSize:
                                                    "0.68rem",
                                                fontWeight:
                                                    600,
                                                color:
                                                    book.availableCopies >
                                                        0
                                                        ? "#4C784B"
                                                        : "#B42318",
                                            }}
                                        >
                                            {
                                                book.availableCopies
                                            }
                                            /
                                            {
                                                book.totalCopies
                                            }
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontSize:
                                                    "0.68rem",
                                                fontWeight:
                                                    600,
                                                color:
                                                    "#5C3A21",
                                            }}
                                        >
                                            ₹
                                            {
                                                book.amount
                                            }
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            display:
                                                "flex",
                                            justifyContent:
                                                "flex-end",
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={(
                                                event
                                            ) =>
                                                handleActionMenuOpen(
                                                    event,
                                                    book
                                                )
                                            }
                                            disabled={
                                                confirmLoading
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
                                            <MoreVertOutlinedIcon
                                                fontSize="small"
                                            />
                                        </IconButton>
                                    </Box>
                                </Box>
                            )
                        )}
                    </Card>

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
                                    minWidth: 150,
                                    borderRadius:
                                        2,
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
                                handleMenuEdit
                            }
                            sx={{
                                py: 1.1,
                                color:
                                    "#5C3A21",
                            }}
                        >
                            <ListItemIcon>
                                <EditOutlinedIcon
                                    fontSize="small"
                                    sx={{
                                        color:
                                            "#5C3A21",
                                    }}
                                />
                            </ListItemIcon>

                            <ListItemText
                                primary="Edit"
                                slotProps={{
                                    primary: {
                                        sx: {
                                            fontSize:
                                                "0.85rem",
                                        },
                                    },
                                }}
                            />
                        </MenuItem>

                        <MenuItem
                            onClick={
                                handleMenuDelete
                            }
                            sx={{
                                py: 1.1,
                                color:
                                    "#B42318",
                            }}
                        >
                            <ListItemIcon>
                                <DeleteOutlineOutlinedIcon
                                    fontSize="small"
                                    sx={{
                                        color:
                                            "#B42318",
                                    }}
                                />
                            </ListItemIcon>

                            <ListItemText
                                primary="Delete"
                                slotProps={{
                                    primary: {
                                        sx: {
                                            fontSize:
                                                "0.85rem",
                                        },
                                    },
                                }}
                            />
                        </MenuItem>
                    </Menu>

                    {filteredBooks.length >
                        BOOKS_PER_PAGE && (
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
                                    borderRadius:
                                        3,
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

            <Dialog
                open={openDialog}
                onClose={
                    handleCloseFormDialog
                }
                fullWidth
                maxWidth="md"
            >
                <DialogTitle
                    sx={{
                        color: "#3E2616",
                        fontWeight: 600,
                    }}
                >
                    {editingBookId
                        ? "Edit Book"
                        : "Add Book"}
                </DialogTitle>

                <DialogContent>
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
                            },
                            gap: 2,
                            mt: 1,
                        }}
                    >
                        <TextField
                            fullWidth
                            required
                            label="Title"
                            value={
                                form.title
                            }
                            onChange={(
                                event
                            ) =>
                                handleFormChange(
                                    "title",
                                    event
                                        .target
                                        .value
                                )
                            }
                            error={Boolean(
                                formErrors.title
                            )}
                            helperText={
                                formErrors.title
                            }
                        />

                        <TextField
                            fullWidth
                            required
                            label="Author"
                            value={
                                form.author
                            }
                            onChange={(
                                event
                            ) =>
                                handleFormChange(
                                    "author",
                                    event
                                        .target
                                        .value
                                )
                            }
                            error={Boolean(
                                formErrors.author
                            )}
                            helperText={
                                formErrors.author
                            }
                        />

                        <TextField
                            fullWidth
                            required
                            label="ISBN"
                            value={
                                form.isbn
                            }
                            onChange={(
                                event
                            ) => {
                                const value =
                                    event.target.value.replace(
                                        /[^0-9]/g,
                                        ""
                                    );

                                if (
                                    value.length <=
                                    10
                                ) {
                                    handleFormChange(
                                        "isbn",
                                        value
                                    );
                                }
                            }}
                            error={Boolean(
                                formErrors.isbn
                            )}
                            helperText={
                                formErrors.isbn
                            }
                            slotProps={{
                                htmlInput: {
                                    inputMode:
                                        "numeric",
                                    pattern:
                                        "[0-9]*",
                                    maxLength:
                                        10,
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Publisher"
                            value={
                                form.publisher
                            }
                            onChange={(
                                event
                            ) =>
                                handleFormChange(
                                    "publisher",
                                    event
                                        .target
                                        .value
                                )
                            }
                        />

                        <TextField
                            select
                            fullWidth
                            required
                            label="Category"
                            value={
                                form.categoryId
                            }
                            onChange={(
                                event
                            ) =>
                                handleFormChange(
                                    "categoryId",
                                    event
                                        .target
                                        .value
                                )
                            }
                            error={Boolean(
                                formErrors.categoryId
                            )}
                            helperText={
                                formErrors.categoryId
                            }
                        >
                            {categories.length ===
                                0 ? (
                                <MenuItem
                                    disabled
                                    value=""
                                >
                                    No categories
                                    available
                                </MenuItem>
                            ) : (
                                categories.map(
                                    (
                                        category
                                    ) => (
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
                                )
                            )}
                        </TextField>

                        <TextField
                            fullWidth
                            label="Published Year"
                            placeholder="2026"
                            value={
                                form.publishedYear
                            }
                            onChange={(
                                event
                            ) => {
                                const value =
                                    event.target.value.replace(
                                        /[^0-9]/g,
                                        ""
                                    );

                                if (
                                    value.length <=
                                    4
                                ) {
                                    handleFormChange(
                                        "publishedYear",
                                        value
                                    );
                                }
                            }}
                            error={Boolean(
                                formErrors.publishedYear
                            )}
                            helperText={
                                formErrors.publishedYear
                            }
                            slotProps={{
                                htmlInput: {
                                    inputMode:
                                        "numeric",
                                    pattern:
                                        "[0-9]*",
                                    maxLength:
                                        4,
                                },
                            }}
                        />

                        {/* TOTAL COPIES + AVAILABLE COPIES + AMOUNT */}
                        <Box
                            sx={{
                                gridColumn: {
                                    xs: "auto",
                                    sm: "1 / -1",
                                },
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(3, 1fr)",
                                },
                                gap: 2,
                            }}
                        >
                            <TextField
                                fullWidth
                                required
                                label="Total Copies"
                                value={
                                    form.totalCopies
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleCopiesChange(
                                        "totalCopies",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                error={Boolean(
                                    formErrors.totalCopies
                                )}
                                helperText={
                                    formErrors.totalCopies
                                }
                                slotProps={{
                                    htmlInput: {
                                        inputMode:
                                            "numeric",
                                        pattern:
                                            "[0-9]*",
                                        maxLength:
                                            3,
                                    },
                                }}
                            />

                            <TextField
                                fullWidth
                                required
                                label="Available Copies"
                                value={
                                    form.availableCopies
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleCopiesChange(
                                        "availableCopies",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                error={Boolean(
                                    formErrors.availableCopies
                                )}
                                helperText={
                                    formErrors.availableCopies
                                }
                                slotProps={{
                                    htmlInput: {
                                        inputMode:
                                            "numeric",
                                        pattern:
                                            "[0-9]*",
                                        maxLength:
                                            3,
                                    },
                                }}
                            />

                            <TextField
                                fullWidth
                                required
                                label="Amount"
                                value={
                                    form.amount
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleAmountChange(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                error={Boolean(
                                    formErrors.amount
                                )}
                                helperText={
                                    formErrors.amount
                                }
                                slotProps={{
                                    htmlInput: {
                                        inputMode:
                                            "numeric",
                                        pattern:
                                            "[0-9]*",
                                        maxLength:
                                            5,
                                    },
                                }}
                            />
                        </Box>

                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            label="Description"
                            value={
                                form.description
                            }
                            onChange={(
                                event
                            ) =>
                                handleFormChange(
                                    "description",
                                    event
                                        .target
                                        .value
                                )
                            }
                            sx={{
                                gridColumn:
                                {
                                    xs:
                                        "auto",
                                    sm:
                                        "1 / -1",
                                },
                            }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{
                        p: 2,
                        display: "flex",
                        justifyContent:
                            "space-between",
                    }}
                >
                    <Button
                        onClick={
                            handleCloseFormDialog
                        }
                        disabled={saving}
                        sx={{
                            color: "#5C3A21",
                            textTransform:
                                "none",
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            editingBookId
                                ? handleUpdateClick
                                : handleSave
                        }
                        variant="contained"
                        disabled={saving}
                        sx={{
                            color: "#FFFDF7",
                            background:
                                "linear-gradient(135deg, #5C3A21, #8A6545)",
                            borderRadius: 1.5,
                            px: 2.5,
                            py: 1.2,
                            fontFamily:
                                "Poppins, sans-serif",
                            fontWeight: 500,
                            textTransform:
                                "none !important",

                            "&.MuiButton-root":
                            {
                                textTransform:
                                    "none !important",
                            },

                            "& .MuiButton-label":
                            {
                                textTransform:
                                    "none !important",
                            },

                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #3E2616, #6D3A32)",
                            },

                            "&:disabled": {
                                color: "#FFFDF7",
                                opacity: 0.6,
                            },
                        }}
                    >
                        {saving ? (
                            <InfinityLoop />
                        ) : editingBookId ? (
                            "Update Book"
                        ) : (
                            "Add Book"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={confirmOpen}
                onClose={
                    handleCloseConfirmDialog
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
                        color: "#3E2616",
                        fontWeight: 600,
                    }}
                >
                    {confirmAction ===
                        "edit"
                        ? "Update Book"
                        : "Delete Book"}
                </DialogTitle>

                <DialogContent>
                    <Typography
                        sx={{
                            color:
                                "text.secondary",
                            lineHeight: 1.7,
                        }}
                    >
                        {confirmAction ===
                            "edit" ? (
                            <>
                                Are you sure you
                                want to update{" "}
                                <Box
                                    component="span"
                                    sx={{
                                        fontWeight:
                                            700,
                                        color:
                                            "#3E2616",
                                    }}
                                >
                                    {
                                        selectedBook?.title
                                    }
                                </Box>
                                ?
                            </>
                        ) : (
                            <>
                                Are you sure you
                                want to delete{" "}
                                <Box
                                    component="span"
                                    sx={{
                                        fontWeight:
                                            700,
                                        color:
                                            "#3E2616",
                                    }}
                                >
                                    {
                                        selectedBook?.title
                                    }
                                </Box>
                                ?
                            </>
                        )}
                    </Typography>
                </DialogContent>

                <DialogActions
                    sx={{
                        p: 2,
                        justifyContent:
                            "space-between",
                        gap: 1,
                    }}
                >
                    <Button
                        onClick={
                            handleCloseConfirmDialog
                        }
                        disabled={
                            confirmLoading
                        }
                        sx={{
                            color: "#5C3A21",
                            textTransform:
                                "none",
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleConfirmAction
                        }
                        variant="contained"
                        disabled={
                            confirmLoading
                        }
                        color={
                            confirmAction ===
                                "delete"
                                ? "error"
                                : "primary"
                        }
                        sx={{
                            ...(confirmAction ===
                                "edit"
                                ? {
                                    background:
                                        "linear-gradient(135deg, #5C3A21, #8A6545)",

                                    "&:hover":
                                    {
                                        background:
                                            "linear-gradient(135deg, #3E2616, #6D3A32)",
                                    },
                                }
                                : {}),

                            textTransform:
                                "none",
                        }}
                    >
                        {confirmLoading ? (
                            <InfinityLoop />
                        ) : (
                            "OK"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={
                    handleSnackbarClose
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={
                        handleSnackbarClose
                    }
                    severity="success"
                    variant="filled"
                    sx={{
                        width: "100%",
                        minWidth: {
                            xs: "auto",
                            sm: 320,
                        },
                        borderRadius: 2,
                        fontWeight: 500,
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}