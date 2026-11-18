"use client";

import { useCallback, useEffect, useState } from "react";
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
Pagination,
Snackbar,
TextField,
Typography,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

type Category = {
categoryId: string;
categoryName: string;
};

const CATEGORIES_PER_PAGE = 10;

export default function AdminCategoriesPage() {
const router = useRouter();

const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// =========================================================
// PAGINATION
// =========================================================

const [currentPage, setCurrentPage] = useState(1);

// Add / Edit dialog
const [openDialog, setOpenDialog] = useState(false);
const [editingCategoryId, setEditingCategoryId] =
    useState<string | null>(null);

const [categoryName, setCategoryName] = useState("");
const [formError, setFormError] = useState("");
const [saving, setSaving] = useState(false);

// Delete confirmation dialog
const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

const [deleting, setDeleting] = useState(false);

// Snackbar
const [snackbarOpen, setSnackbarOpen] =
    useState(false);

const [snackbarMessage, setSnackbarMessage] =
    useState("");

const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error">("success");

// =========================================================
// SNACKBAR
// =========================================================

const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success"
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

// =========================================================
// GET CATEGORIES
// =========================================================

const getCategories = useCallback(
    async (
        token: string
    ): Promise<Category[] | null> => {
        const response = await fetch(
            "http://localhost:5011/api/Admin/categories",
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
            | Category[]
            | {
                message?: string;
            } = [];

        if (responseText.trim()) {
            try {
                result =
                    JSON.parse(responseText);
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

                return null;
            }

            if (
                response.status === 403
            ) {
                router.replace("/user");

                return null;
            }

            throw new Error(
                !Array.isArray(result)
                    ? result.message ||
                    "Failed to load categories."
                    : "Failed to load categories."
            );
        }

        if (!Array.isArray(result)) {
            throw new Error(
                result.message ||
                "Invalid category response."
            );
        }

        return result;
    },
    [router]
);

// =========================================================
// INITIAL LOAD
// =========================================================

useEffect(() => {
    const loadCategories = async () => {
        try {
            const token =
                sessionStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                router.replace("/login");
                return;
            }

            const result =
                await getCategories(token);

            if (result) {
                setCategories(result);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error(
                "Categories API error:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to load categories."
            );
        } finally {
            setLoading(false);
        }
    };

    loadCategories();
}, [router, getCategories]);

// =========================================================
// ADD
// =========================================================

const handleAddClick = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setFormError("");
    setOpenDialog(true);
};

// =========================================================
// EDIT
// =========================================================

const handleEditClick = (
    category: Category
) => {
    setEditingCategoryId(
        category.categoryId
    );

    setCategoryName(
        category.categoryName
    );

    setFormError("");
    setOpenDialog(true);
};

// =========================================================
// ADD / UPDATE
// =========================================================

const handleSave = async () => {
    setFormError("");

    const trimmedName =
        categoryName.trim();

    if (!trimmedName) {
        setFormError(
            "Category name is required."
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

        const isEditing =
            !!editingCategoryId;

        const url = isEditing
            ? `http://localhost:5011/api/Admin/categories/${editingCategoryId}`
            : "http://localhost:5011/api/Admin/categories";

        const method = isEditing
            ? "PUT"
            : "POST";

        const response = await fetch(
            url,
            {
                method,
                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,
                },

                body: JSON.stringify({
                    categoryName:
                        trimmedName,
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
                    JSON.parse(responseText);
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

            setFormError(
                result.message ||
                "Unable to save category."
            );

            return;
        }

        const updatedCategories =
            await getCategories(token);

        if (updatedCategories) {
            setCategories(
                updatedCategories
            );
        }

        setOpenDialog(false);
        setCategoryName("");
        setEditingCategoryId(null);
        setFormError("");

        if (isEditing) {
            showSnackbar(
                "Category updated successfully"
            );
        } else {
            showSnackbar(
                "Category added successfully"
            );

            setCurrentPage(1);
        }
    } catch (error) {
        console.error(
            "Save category error:",
            error
        );

        setFormError(
            error instanceof Error
                ? error.message
                : "Unable to connect to the server."
        );
    } finally {
        setSaving(false);
    }
};

// =========================================================
// OPEN DELETE CONFIRMATION
// =========================================================

const handleDeleteClick = (
    category: Category
) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
};

// =========================================================
// CLOSE DELETE CONFIRMATION
// =========================================================

const handleDeleteCancel = () => {
    if (deleting) {
        return;
    }

    setDeleteDialogOpen(false);
    setSelectedCategory(null);
};

// =========================================================
// DELETE CATEGORY
// =========================================================

const handleDeleteConfirm = async () => {
    if (!selectedCategory) {
        return;
    }

    try {
        setDeleting(true);

        const token =
            sessionStorage.getItem(
                "accessToken"
            );

        if (!token) {
            router.replace("/login");
            return;
        }

        const response = await fetch(
            `http://localhost:5011/api/Admin/categories/${selectedCategory.categoryId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },
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

            showSnackbar(
                result.message ||
                "Unable to delete category.",
                "error"
            );

            return;
        }

        const updatedCategories =
            categories.filter(
                (category) =>
                    category.categoryId !==
                    selectedCategory.categoryId
            );

        setCategories(
            updatedCategories
        );

        const newTotalPages =
            Math.ceil(
                updatedCategories.length /
                CATEGORIES_PER_PAGE
            );

        setCurrentPage(
            (page) =>
                Math.min(
                    page,
                    Math.max(
                        newTotalPages,
                        1
                    )
                )
        );

        setDeleteDialogOpen(false);
        setSelectedCategory(null);

        showSnackbar(
            "Category deleted successfully"
        );
    } catch (error) {
        console.error(
            "Delete category error:",
            error
        );

        showSnackbar(
            "Unable to connect to the server.",
            "error"
        );
    } finally {
        setDeleting(false);
    }
};

// =========================================================
// PAGINATION CALCULATION
// =========================================================

const totalPages = Math.ceil(
    categories.length /
    CATEGORIES_PER_PAGE
);

const startIndex =
    (currentPage - 1) *
    CATEGORIES_PER_PAGE;

const endIndex =
    startIndex +
    CATEGORIES_PER_PAGE;

const paginatedCategories =
    categories.slice(
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
                justifyContent: "center",
            }}
        >
            <Typography color="text.secondary">
                Loading categories...
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
        {/* Header */}

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
                mb: 4,
            }}
        >
            {/* LEFT SIDE */}

            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    minWidth: 0,
                }}
            >
                {/* BACK BUTTON */}

                <Button
                    onClick={() =>
                        router.push("/admin")
                    }
                    sx={{
                        minWidth: 42,
                        width: 42,
                        height: 42,
                        p: 0,
                        mt: 4.5,

                        color: "#5C3A21",

                        backgroundColor:
                            "rgba(255,255,255,0.45)",

                        borderRadius: "50%",

                        flexShrink: 0,

                        "&:hover": {
                            backgroundColor:
                                "rgba(255,255,255,0.7)",
                        },
                    }}
                >
                    <ArrowBackOutlinedIcon />
                </Button>

                {/* HEADER TEXT */}

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
                        LIBRARY STRUCTURE
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
                        Categories
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
                        Manage the categories
                        in your library.
                    </Typography>
                </Box>
            </Box>

            {/* ADD CATEGORY */}

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
                    textTransform: "none",

                    "&:hover": {
                        background:
                            "linear-gradient(135deg, #3E2616, #6D3A32)",
                    },
                }}
            >
                Add Category
            </Button>
        </Box>

        {/* Category List */}

        <Card
            sx={{
                borderRadius: 3,
                overflow: "hidden",
                background:
                    "rgba(255,253,247,0.92)",
                boxShadow:
                    "0 10px 30px rgba(62,38,22,0.08)",
            }}
        >
            {paginatedCategories.map(
                (category, index) => (
                    <Box
                        key={
                            category.categoryId
                        }
                        sx={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            gap: 2,
                            px: {
                                xs: 2,
                                md: 3,
                            },
                            py: {
                                xs: 2,
                                md: 2.4,
                            },

                            borderBottom:
                                index <
                                    paginatedCategories.length -
                                    1
                                    ? "1px solid rgba(92,58,33,0.08)"
                                    : "none",

                            "&:hover": {
                                backgroundColor:
                                    "rgba(92,58,33,0.025)",
                            },
                        }}
                    >
                        {/* Category Name */}

                        <Typography
                            sx={{
                                fontWeight:
                                    600,
                                fontSize:
                                    "0.9rem",
                                flexShrink:
                                    0,
                                minWidth: {
                                    xs: 110,
                                    sm: 150,
                                },
                            }}
                        >
                            {
                                category.categoryName
                            }
                        </Typography>

                        {/* Dotted Connector */}

                        <Box
                            sx={{
                                flex: 1,
                                borderBottom:
                                    "1px dotted rgba(92,58,33,0.35)",
                                minWidth:
                                    30,
                            }}
                        />

                        {/* Status */}

                        <Chip
                            label="Active"
                            size="small"
                            sx={{
                                backgroundColor:
                                    "rgba(76,120,75,0.10)",
                                color:
                                    "#4C784B",
                                fontSize:
                                    "0.68rem",
                                flexShrink:
                                    0,
                            }}
                        />

                        {/* Actions */}

                        <Box
                            sx={{
                                display:
                                    "flex",
                                gap: 1,
                                flexShrink:
                                    0,

                                "@media (max-width:600px)":
                                {
                                    "& .MuiButton-startIcon":
                                    {
                                        display:
                                            "none",
                                    },
                                },
                            }}
                        >
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={
                                    <EditOutlinedIcon />
                                }
                                onClick={() =>
                                    handleEditClick(
                                        category
                                    )
                                }
                                sx={{
                                    borderRadius:
                                        1.5,
                                    textTransform:
                                        "none",
                                    minWidth:
                                        "auto",
                                }}
                            >
                                Edit
                            </Button>

                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={
                                    <DeleteOutlineOutlinedIcon />
                                }
                                onClick={() =>
                                    handleDeleteClick(
                                        category
                                    )
                                }
                                sx={{
                                    borderRadius:
                                        1.5,
                                    textTransform:
                                        "none",
                                    minWidth:
                                        "auto",
                                }}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                )
            )}

            {/* Empty State */}

            {categories.length ===
                0 && (
                    <Box
                        sx={{
                            p: 5,
                            textAlign:
                                "center",
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight:
                                    600,
                            }}
                        >
                            No categories found
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
                            There are no active
                            categories in the
                            library.
                        </Typography>
                    </Box>
                )}

            {/* PAGINATION */}

            {categories.length >
                CATEGORIES_PER_PAGE && (
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

        {/* =====================================================
            ADD / EDIT DIALOG
        ===================================================== */}

        <Dialog
            open={openDialog}
            onClose={() => {
                if (!saving) {
                    setOpenDialog(
                        false
                    );
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
                {editingCategoryId
                    ? "Edit Category"
                    : "Add Category"}
            </DialogTitle>

            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    label="Category Name*"
                    value={categoryName}
                    onChange={(event) => {
                        setCategoryName(
                            event.target.value
                        );

                        if (
                            formError
                        ) {
                            setFormError(
                                ""
                            );
                        }
                    }}
                    error={
                        !!formError
                    }
                    helperText={
                        formError
                    }
                    sx={{ mt: 1 }}
                />
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    gap: 1,
                    justifyContent: "space-between",
                }}
            >
                <Button
                    onClick={() =>
                        setOpenDialog(
                            false
                        )
                    }
                    disabled={
                        saving
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
                    onClick={handleSave}
                    variant="contained"
                    disabled={
                        saving
                    }
                    sx={{
                        color: "#FFFDF7",

                        background:
                            "linear-gradient(135deg, #5C3A21, #8A6545)",

                        borderRadius: 1.5,

                        px: 2.5,

                        py: 1.2,

                        minWidth: 90,

                        textTransform: "none",

                        "&:hover": {
                            background:
                                "linear-gradient(135deg, #3E2616, #6D3A32)",
                        },

                        "&.Mui-disabled": {
                            color: "#FFFFFF",

                            background:
                                "rgba(92, 58, 33, 0.35)",
                        },
                    }}
                >
                    {saving ? (
                        "Saving..."
                    ) : editingCategoryId ? (
                        "Update"
                    ) : (
                        "Add"
                    )}
                </Button>
            </DialogActions>
        </Dialog>

        {/* =====================================================
            DELETE CONFIRMATION DIALOG
        ===================================================== */}

        <Dialog
            open={deleteDialogOpen}
            onClose={
                handleDeleteCancel
            }
            fullWidth
            maxWidth="xs"
        >
            <DialogTitle
                sx={{
                    color: "#3E2616",
                    fontWeight: 600,
                }}
            >
                Delete Category
            </DialogTitle>

            <DialogContent>
                <Typography
                    sx={{
                        color:
                            "text.secondary",
                        lineHeight: 1.7,
                    }}
                >
                    Are you sure you want
                    to delete{" "}
                    <Box
                        component="strong"
                        sx={{
                            color:
                                "#3E2616",
                            fontWeight: 700,
                        }}
                    >
                        {
                            selectedCategory?.categoryName
                        }
                    </Box>
                    ?
                </Typography>
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    gap: 1,
                    justifyContent: "space-between",
                }}
            >
                <Button
                    onClick={
                        handleDeleteCancel
                    }
                    disabled={
                        deleting
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
                        handleDeleteConfirm
                    }
                    variant="contained"
                    color="error"
                    disabled={
                        deleting
                    }
                    sx={{
                        textTransform:
                            "none",
                    }}
                >
                    {deleting
                        ? "Deleting..."
                        : "OK"}
                </Button>
            </DialogActions>
        </Dialog>

        {/* =====================================================
            SNACKBAR
        ===================================================== */}

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
                severity={
                    snackbarSeverity
                }
                variant="filled"
                sx={{
                    width: "100%",
                    borderRadius: 2,
                }}
            >
                {snackbarMessage}
            </Alert>
        </Snackbar>
    </Box>
);

}
