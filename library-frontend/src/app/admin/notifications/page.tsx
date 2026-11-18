"use client";

import {
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Typography,
  Button,
  TextField,
  MenuItem,
  Pagination,
  Menu,
  ListItemText,
} from "@mui/material";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationType =
  | "borrow"
  | "due"
  | "success";

type NotificationFilter =
  | "all"
  | "read"
  | "unread";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  read: boolean;
};

type ApiNotification = {
  notificationId?: string;
  notificationID?: string;

  borrowingId?: string;

  userId?: string;
  username?: string;
  name?: string;

  bookId?: string;

  title?: string;
  Title?: string;

  bookTitle?: string;
  BookTitle?: string;

  message?: string;
  Message?: string;

  createdAt?: string;
  CreatedAt?: string;

  isRead?: boolean;
  IsRead?: boolean;
  notificationType?: string;
  NotificationType?: string;
};

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [bulkAction, setBulkAction] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<NotificationFilter>("all");

  const [page, setPage] =
    useState(1);

  /*
   * Three-dot menu
   */
  const [menuAnchorEl, setMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  /*
   * Delete submenu
   */
  const [deleteMenuAnchorEl, setDeleteMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  const notificationsPerPage = 10;

  /*
   * =========================================================
   * LOAD NOTIFICATIONS
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      const token =
        sessionStorage.getItem(
          "accessToken"
        );

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response =
          await fetch(
            "http://localhost:5011/api/Admin/notifications",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

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

        if (!response.ok) {
          throw new Error(
            "Unable to load notifications."
          );
        }

        const result =
          await response.json();

        const apiData: ApiNotification[] =
          Array.isArray(result)
            ? result
            : Array.isArray(
              result.notifications
            )
              ? result.notifications
              : Array.isArray(
                result.data
              )
                ? result.data
                : [];

        const formatted =
          apiData
            .filter(
              (notification) =>
                notification.notificationId ||
                notification.notificationID
            )
            .map(
              (
                notification
              ): NotificationItem => {
                const notificationId =
                  notification.notificationId ??
                  notification.notificationID ??
                  "";

                const bookTitle =
                  notification.bookTitle ??
                  notification.BookTitle ??
                  notification.title ??
                  notification.Title ??
                  "Library";

                const message =
                  notification.message ??
                  notification.Message ??
                  "You have a new library update.";

                const notificationType =
                  notification.notificationType ??
                  notification.NotificationType ??
                  "";

                const createdAt =
                  notification.createdAt ??
                  notification.CreatedAt;

                const isRead =
                  notification.isRead ??
                  notification.IsRead ??
                  false;

                return {
                  id: notificationId,

                  title:
                    notificationType === "AdminRequest"
                      ? "Activate Account"
                      : bookTitle,

                  message,

                  time:
                    formatNotificationTime(
                      createdAt
                    ),

                  type:
                    getNotificationType(
                      message
                    ),

                  read: isRead,
                };
              }
            );

        if (!cancelled) {
          setNotifications(
            formatted
          );

          setLoading(false);
        }
      } catch (error) {
        console.error(
          "Admin notification error:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            "Unable to load notifications."
          );

          setLoading(false);
        }
      }
    };

    const timer =
      window.setTimeout(() => {
        void loadNotifications();
      }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router]);

  /*
   * =========================================================
   * UNREAD COUNT
   * =========================================================
   */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredNotifications =
    useMemo(() => {
      if (filter === "read") {
        return notifications.filter(
          (notification) =>
            notification.read
        );
      }

      if (filter === "unread") {
        return notifications.filter(
          (notification) =>
            !notification.read
        );
      }

      return notifications;
    }, [
      notifications,
      filter,
    ]);

  /*
   * =========================================================
   * PAGINATION
   * =========================================================
   */

  const totalPages =
    Math.ceil(
      filteredNotifications.length /
      notificationsPerPage
    );

  const paginatedNotifications =
    useMemo(() => {
      const startIndex =
        (page - 1) *
        notificationsPerPage;

      return filteredNotifications.slice(
        startIndex,
        startIndex +
        notificationsPerPage
      );
    }, [
      filteredNotifications,
      page,
    ]);

  /*
   * Keep page valid whenever
   * notification count changes.
   */

  /*
   * =========================================================
   * FILTER CHANGE
   * =========================================================
   */

  const handleFilterChange = (
    event: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  ) => {
    setFilter(
      event.target.value as NotificationFilter
    );

    setPage(1);
  };

  /*
   * =========================================================
   * PAGE CHANGE
   * =========================================================
   */

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =========================================================
   * CLOSE MENUS
   * =========================================================
   */

  const closeMenus = () => {
    setMenuAnchorEl(null);
    setDeleteMenuAnchorEl(null);
  };

  /*
   * =========================================================
   * MARK ONE READ / UNREAD
   * =========================================================
   */

  const toggleReadStatus = async (
    notification: NotificationItem
  ) => {
    if (
      updatingId !== null ||
      deletingId !== null ||
      bulkAction !== null
    ) {
      return;
    }

    const token =
      sessionStorage.getItem(
        "accessToken"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    const previousRead =
      notification.read;

    setUpdatingId(
      notification.id
    );

    /*
     * Optimistic update
     */
    setNotifications(
      (current) =>
        current.map(
          (item) =>
            item.id ===
              notification.id
              ? {
                ...item,
                read:
                  !previousRead,
              }
              : item
        )
    );

    try {
      const endpoint =
        previousRead
          ? `http://localhost:5011/api/Admin/notifications/${notification.id}/unread`
          : `http://localhost:5011/api/Admin/notifications/${notification.id}/read`;

      const response =
        await fetch(
          endpoint,
          {
            method: "PUT",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

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

      if (!response.ok) {
        throw new Error(
          "Notification update failed."
        );
      }

      window.dispatchEvent(
        new Event(
          "adminNotificationsUpdated"
        )
      );
    } catch (error) {
      console.error(
        "Notification update error:",
        error
      );

      /*
       * Rollback
       */
      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
                notification.id
                ? {
                  ...item,
                  read:
                    previousRead,
                }
                : item
          )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /*
   * =========================================================
   * DELETE ONE NOTIFICATION
   * =========================================================
   */

  const deleteNotification = async (
    notification: NotificationItem
  ) => {
    if (
      updatingId !== null ||
      deletingId !== null ||
      bulkAction !== null
    ) {
      return;
    }

    const token =
      sessionStorage.getItem(
        "accessToken"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeletingId(
      notification.id
    );

    try {
      const response =
        await fetch(
          `http://localhost:5011/api/Admin/notifications/${notification.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

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

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete notification API error:",
          response.status,
          errorText
        );

        throw new Error(
          `Notification deletion failed: ${response.status}`
        );
      }

      setNotifications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              notification.id
          )
      );

      window.dispatchEvent(
        new Event(
          "adminNotificationsUpdated"
        )
      );
    } catch (error) {
      console.error(
        "Notification deletion error:",
        error
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
   * =========================================================
   * MARK ALL AS READ
   * =========================================================
   */

  const markAllAsRead = async () => {
    if (
      bulkAction !== null ||
      updatingId !== null ||
      deletingId !== null
    ) {
      return;
    }

    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.read
      );

    closeMenus();

    if (
      unreadNotifications.length === 0
    ) {
      return;
    }

    const token =
      sessionStorage.getItem(
        "accessToken"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    setBulkAction(
      "markAllRead"
    );

    /*
     * Optimistic update
     */
    setNotifications(
      (current) =>
        current.map(
          (notification) => ({
            ...notification,
            read: true,
          })
        )
    );

    try {
      await Promise.all(
        unreadNotifications.map(
          async (notification) => {
            const response =
              await fetch(
                `http://localhost:5011/api/Admin/notifications/${notification.id}/read`,
                {
                  method: "PUT",
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            if (
              response.status ===
              401
            ) {
              throw new Error(
                "UNAUTHORIZED"
              );
            }

            if (
              response.status ===
              403
            ) {
              throw new Error(
                "FORBIDDEN"
              );
            }

            if (!response.ok) {
              throw new Error(
                "MARK_ALL_FAILED"
              );
            }
          }
        )
      );

      window.dispatchEvent(
        new Event(
          "adminNotificationsUpdated"
        )
      );
    } catch (error) {
      console.error(
        "Mark all as read error:",
        error
      );

      /*
       * Reload notifications if
       * any bulk update fails.
       */
      window.location.reload();
    } finally {
      setBulkAction(null);
    }
  };

  /*
   * =========================================================
   * DELETE BY STATUS
   * =========================================================
   */

  const deleteNotificationsByStatus =
    async (
      status:
        | "unread"
        | "read"
        | "all"
    ) => {
      if (
        bulkAction !== null ||
        updatingId !== null ||
        deletingId !== null
      ) {
        return;
      }

      let selectedNotifications: NotificationItem[];

      if (status === "unread") {
        selectedNotifications =
          notifications.filter(
            (notification) =>
              !notification.read
          );
      } else if (
        status === "read"
      ) {
        selectedNotifications =
          notifications.filter(
            (notification) =>
              notification.read
          );
      } else {
        selectedNotifications =
          [...notifications];
      }

      closeMenus();

      if (
        selectedNotifications.length ===
        0
      ) {
        return;
      }

      const token =
        sessionStorage.getItem(
          "accessToken"
        );

      if (!token) {
        router.replace("/login");
        return;
      }

      setBulkAction(
        `delete-${status}`
      );

      /*
       * Store IDs so the UI can
       * update after successful calls.
       */
      const selectedIds =
        new Set(
          selectedNotifications.map(
            (notification) =>
              notification.id
          )
        );

      try {
        const results =
          await Promise.all(
            selectedNotifications.map(
              async (
                notification
              ) => {
                const response =
                  await fetch(
                    `http://localhost:5011/api/Admin/notifications/${notification.id}`,
                    {
                      method:
                        "DELETE",
                      headers: {
                        Authorization:
                          `Bearer ${token}`,
                      },
                    }
                  );

                if (
                  response.status ===
                  401
                ) {
                  throw new Error(
                    "UNAUTHORIZED"
                  );
                }

                if (
                  response.status ===
                  403
                ) {
                  throw new Error(
                    "FORBIDDEN"
                  );
                }

                return response.ok;
              }
            )
          );

        const allSuccessful =
          results.every(
            (result) => result
          );

        if (!allSuccessful) {
          throw new Error(
            "Some notifications could not be deleted."
          );
        }

        setNotifications(
          (current) =>
            current.filter(
              (notification) =>
                !selectedIds.has(
                  notification.id
                )
            )
        );

        window.dispatchEvent(
          new Event(
            "adminNotificationsUpdated"
          )
        );
      } catch (error) {
        console.error(
          "Bulk notification deletion error:",
          error
        );

        /*
         * Reload from database so
         * UI matches backend.
         */
        window.location.reload();
      } finally {
        setBulkAction(null);
      }
    };

  /*
   * =========================================================
   * ICON
   * =========================================================
   */

  const getIcon = (
    type: NotificationType
  ) => {
    if (type === "borrow") {
      return (
        <MenuBookOutlinedIcon
          sx={{
            fontSize: 22,
            color: "#8B6508",
          }}
        />
      );
    }

    if (type === "due") {
      return (
        <EventOutlinedIcon
          sx={{
            fontSize: 22,
            color: "#A15C32",
          }}
        />
      );
    }

    return (
      <CheckCircleOutlineOutlinedIcon
        sx={{
          fontSize: 22,
          color: "#4C784B",
        }}
      />
    );
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",

        px: {
          xs: 2,
          sm: 3,
          md: 5,
        },

        py: {
          xs: 3,
          md: 5,
        },

        background:
          "linear-gradient(135deg, #F8F2E7 0%, #E6D6B9 100%)",
      }}
    >
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
        }}
      >
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 2,
            mb: 4,

            flexWrap: {
              xs: "wrap",
              sm: "nowrap",
            },
          }}
        >
          {/* LEFT */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: 0,
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

                  fontWeight: 600,

                  mb: 0.5,
                }}
              >
                LIBRARY UPDATES
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: {
                      xs: "1.8rem",
                      md: "2.5rem",
                    },

                    fontWeight: 600,

                    color: "#3E2616",

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  Notifications
                </Typography>

                {/* {unreadCount > 0 && (
                  <Chip
                    label={
                      unreadCount
                    }
                    size="small"
                    sx={{
                      mt: 0.8,

                      backgroundColor:
                        "#B8860B",

                      color:
                        "#FFFDF7",

                      fontWeight: 600,
                    }}
                  />
                )} */}
              </Box>
            </Box>
          </Box>

          {/* FILTER */}

          <TextField
            select
            size="small"
            value={filter}
            onChange={
              handleFilterChange
            }
            sx={{
              minWidth: 170,

              mt: 2,

              flexShrink: 0,

              "& .MuiOutlinedInput-root": {
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

              "& .MuiSelect-select": {
                color: "#3E2616",

                fontSize: "1rem",
              },

              "& .MuiSelect-icon": {
                color: "#5C3A21",
              },
            }}
          >
            <MenuItem value="all">
              All
            </MenuItem>

            <MenuItem value="unread">
              Unread
            </MenuItem>

            <MenuItem value="read">
              Read
            </MenuItem>
          </TextField>
        </Box>

        {/* =================================================
            NOTIFICATION CARD
        ================================================= */}

        <Card
          sx={{
            borderRadius: 3,

            overflow: "hidden",

            background:
              "rgba(255,253,247,0.94)",

            boxShadow:
              "0 10px 30px rgba(62,38,22,0.08)",
          }}
        >
          {/* =================================================
              CARD HEADER
          ================================================= */}

          <Box
            sx={{
              display: "flex",

              alignItems:
                "center",

              px: {
                xs: 2,
                sm: 3,
              },

              py: 2.5,
              backgroundColor: "rgba(92,58,33,0.2)",
            }}
          >
            {/* ICON */}

            <Box
              sx={{
                width: 42,
                height: 42,

                borderRadius: 2,

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                backgroundColor:
                  "rgba(184,134,11,0.10)",

                flexShrink: 0,

                mr: 1.5,
              }}
            >
              <NotificationsNoneOutlinedIcon
                sx={{
                  color:
                    "#8B6508",
                }}
              />
            </Box>

            {/* TITLE */}

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize:
                    "1rem",

                  fontWeight: 600,

                  color:
                    "#3E2616",

                  lineHeight: 1.4,
                }}
              >
                Recent activity
              </Typography>

              <Typography
                sx={{
                  fontSize:
                    "0.75rem",

                  color:
                    "text.secondary",

                  mt: 0.3,

                  lineHeight: 1.4,
                }}
              >
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "You are all caught up."}
              </Typography>
            </Box>

            {/* =================================================
                THREE DOT BUTTON
            ================================================= */}

            <IconButton
              size="small"
              disabled={
                bulkAction !== null
              }
              onClick={(
                event
              ) => {
                setMenuAnchorEl(
                  event.currentTarget
                );
              }}
              sx={{
                color:
                  "#5C3A21",

                flexShrink: 0,

                ml: 1,

                "&:hover": {
                  backgroundColor:
                    "rgba(92,58,33,0.08)",
                },
              }}
            >
              <MoreVertOutlinedIcon />
            </IconButton>
          </Box>

          {/* =================================================
              THREE DOT MENU
          ================================================= */}

          <Menu
            anchorEl={
              menuAnchorEl
            }
            open={Boolean(
              menuAnchorEl
            )}
            onClose={() => {
              setMenuAnchorEl(
                null
              );
            }}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem
              disabled={
                unreadCount === 0
              }
              onClick={
                markAllAsRead
              }
            >
              <DoneOutlinedIcon
                sx={{
                  fontSize: 19,
                  mr: 1.2,
                  color: "#8B6508",
                }}
              />

              Mark all as read
            </MenuItem>

            <MenuItem
              disabled={
                notifications.length ===
                0
              }
              onClick={(
                event
              ) => {
                setDeleteMenuAnchorEl(
                  event.currentTarget
                );
              }}
            >
              <DeleteOutlineOutlinedIcon
                sx={{
                  fontSize: 19,
                  mr: 1.2,
                  color: "#9A5A4A",
                }}
              />

              <ListItemText
                primary="Delete notification"
              />

              <ChevronRightOutlinedIcon
                fontSize="small"
              />
            </MenuItem>
          </Menu>

          {/* =================================================
              DELETE SUBMENU
          ================================================= */}

          <Menu
            anchorEl={
              deleteMenuAnchorEl
            }
            open={Boolean(
              deleteMenuAnchorEl
            )}
            onClose={() => {
              setDeleteMenuAnchorEl(
                null
              );
            }}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
          >
            <MenuItem
              disabled={
                notifications.filter(
                  (notification) =>
                    !notification.read
                ).length === 0
              }
              onClick={() =>
                deleteNotificationsByStatus(
                  "unread"
                )
              }
            >
              Unread messages
            </MenuItem>

            <MenuItem
              disabled={
                notifications.filter(
                  (notification) =>
                    notification.read
                ).length === 0
              }
              onClick={() =>
                deleteNotificationsByStatus(
                  "read"
                )
              }
            >
              Read messages
            </MenuItem>

            <MenuItem
              disabled={
                notifications.length ===
                0
              }
              onClick={() =>
                deleteNotificationsByStatus(
                  "all"
                )
              }
            >
              All messages
            </MenuItem>
          </Menu>

          <Divider />

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <Box
              sx={{
                py: 8,
                textAlign:
                  "center",
              }}
            >
              <Typography
                sx={{
                  color:
                    "text.secondary",

                  fontSize:
                    "0.85rem",
                }}
              >
                Loading
                notifications...
              </Typography>
            </Box>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading &&
            errorMessage && (
              <Box
                sx={{
                  py: 8,
                  px: 3,
                  textAlign:
                    "center",
                }}
              >
                <NotificationsNoneOutlinedIcon
                  sx={{
                    fontSize: 48,
                    color:
                      "text.disabled",
                    mb: 1,
                  }}
                />

                <Typography
                  sx={{
                    fontWeight: 600,
                    color:
                      "#3E2616",
                  }}
                >
                  Unable to load
                  notifications
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize:
                      "0.8rem",
                    color:
                      "text.secondary",
                  }}
                >
                  {errorMessage}
                </Typography>
              </Box>
            )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            !errorMessage &&
            filteredNotifications.length ===
            0 && (
              <Box
                sx={{
                  py: 8,
                  px: 3,
                  textAlign:
                    "center",
                }}
              >
                <NotificationsNoneOutlinedIcon
                  sx={{
                    fontSize: 48,
                    color:
                      "text.disabled",
                    mb: 1,
                  }}
                />

                <Typography
                  sx={{
                    fontWeight: 600,
                    color:
                      "#3E2616",
                  }}
                >
                  {filter ===
                    "all"
                    ? "No notifications"
                    : filter ===
                      "unread"
                      ? "No unread notifications"
                      : "No read notifications"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize:
                      "0.8rem",
                    color:
                      "text.secondary",
                  }}
                >
                  {filter ===
                    "all"
                    ? "You are all caught up."
                    : "Try selecting another filter."}
                </Typography>
              </Box>
            )}

          {/* =================================================
              NOTIFICATION LIST
          ================================================= */}

          {!loading &&
            !errorMessage &&
            paginatedNotifications.map(
              (
                notification,
                index
              ) => (
                <Box
                  key={
                    notification.id
                  }
                  sx={{
                    display:
                      "flex",

                    gap: 2,

                    px: {
                      xs: 2,
                      sm: 3,
                    },

                    py: 2.5,

                    minHeight: 120,

                    backgroundColor:
                      index % 2 === 0
                        ? "rgba(92,58,33,0.025)"
                        : "rgba(92,58,33,0.07)",

                    borderBottom:
                      index <
                        paginatedNotifications.length -
                        1
                        ? "1px solid rgba(92,58,33,0.08)"
                        : "none",


                    transition:
                      "background-color 0.2s",

                    // "&:hover": {
                    //   backgroundColor:
                    //     "rgba(92,58,33,0.035)",
                    // },
                  }}
                >
                  {/* ICON */}

                  <Box
                    sx={{
                      width: 42,
                      height: 42,

                      flexShrink: 0,

                      borderRadius:
                        "50%",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      backgroundColor:
                        "#F8F2E7",
                    }}
                  >
                    {getIcon(
                      notification.type
                    )}
                  </Box>

                  {/* CONTENT */}

                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* TOP ROW */}

                    <Box
                      sx={{
                        display:
                          "flex",

                        alignItems:
                          "flex-start",

                        justifyContent:
                          "space-between",

                        gap: 2,

                        width:
                          "100%",
                      }}
                    >
                      {/* TITLE */}

                      <Box
                        sx={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap: 1,

                          minWidth: 0,

                          flex: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight:
                              notification.read
                                ? 500
                                : 600,

                            color:
                              "#3E2616",

                            fontSize:
                              "0.9rem",

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",

                            whiteSpace:
                              "nowrap",

                            minWidth: 0,
                          }}
                        >
                          {
                            notification.title
                          }
                        </Typography>

                        {!notification.read && (
                          <Chip
                            label="New"
                            size="small"
                            sx={{
                              height:
                                22,

                              fontSize:
                                "0.65rem",

                              backgroundColor:
                                "rgba(184,134,11,0.12)",

                              color:
                                "#8B6508",

                              fontWeight:
                                600,

                              flexShrink:
                                0,
                            }}
                          />
                        )}
                      </Box>

                      {/* ACTIONS */}

                      <Box
                        sx={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap: 2,

                          flexShrink:
                            0,

                          mt: -0.5,
                        }}
                      >
                        {/* MARK READ / UNREAD */}

                        <Button
                          size="small"
                          variant="text"
                          disabled={
                            updatingId ===
                            notification.id ||
                            deletingId ===
                            notification.id ||
                            bulkAction !==
                            null
                          }
                          onClick={() =>
                            toggleReadStatus(
                              notification
                            )
                          }
                          startIcon={
                            notification.read ? (
                              <MarkEmailUnreadOutlinedIcon />
                            ) : (
                              <DoneOutlinedIcon />
                            )
                          }
                          sx={{
                            px: 0,

                            minWidth:
                              0,

                            color:
                              "#8B6508",

                            fontSize:
                              "0.7rem",

                            fontWeight:
                              600,

                            textTransform:
                              "none",

                            whiteSpace:
                              "nowrap",

                            "&:hover":
                            {
                              backgroundColor:
                                "transparent",

                              color:
                                "#5C3A21",
                            },
                          }}
                        >
                          {updatingId ===
                            notification.id
                            ? "Updating..."
                            : notification.read
                              ? "Mark as unread"
                              : "Mark as read"}
                        </Button>

                        {/* DELETE */}

                        <Button
                          size="small"
                          variant="text"
                          disabled={
                            updatingId ===
                            notification.id ||
                            deletingId ===
                            notification.id ||
                            bulkAction !==
                            null
                          }
                          onClick={() =>
                            deleteNotification(
                              notification
                            )
                          }
                          startIcon={
                            <DeleteOutlineOutlinedIcon />
                          }
                          sx={{
                            px: 0,

                            minWidth:
                              0,

                            color:
                              "#9A5A4A",

                            fontSize:
                              "0.7rem",

                            fontWeight:
                              600,

                            textTransform:
                              "none",

                            whiteSpace:
                              "nowrap",

                            "&:hover":
                            {
                              backgroundColor:
                                "transparent",

                              color:
                                "#7A3F32",
                            },
                          }}
                        >
                          {deletingId ===
                            notification.id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </Box>
                    </Box>

                    {/* MESSAGE */}

                    <Typography
                      sx={{
                        mt: 0.7,

                        fontSize:
                          "0.78rem",

                        lineHeight:
                          1.6,

                        color:
                          "text.secondary",
                      }}
                    >
                      {
                        notification.message
                      }
                    </Typography>

                    {/* TIME */}

                    <Typography
                      sx={{
                        mt: 1,

                        fontSize:
                          "0.68rem",

                        color:
                          "text.disabled",
                      }}
                    >
                      {
                        notification.time
                      }
                    </Typography>
                  </Box>
                </Box>
              )
            )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            !errorMessage &&
            totalPages > 1 && (
              <>
                <Divider />

                <Box
                  sx={{
                    display:
                      "flex",

                    justifyContent:
                      "center",

                    alignItems:
                      "center",

                    py: 2.5,

                    backgroundColor:
                      "rgba(248,242,231,0.45)",
                  }}
                >
                  <Pagination
                    count={
                      totalPages
                    }
                    page={page}
                    onChange={
                      handlePageChange
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

                        fontWeight:
                          500,

                        borderRadius:
                          1.5,
                      },

                      "& .MuiPaginationItem-root.Mui-selected":
                      {
                        backgroundColor:
                          "#5C3A21",

                        color:
                          "#FFFDF7",

                        fontWeight:
                          600,

                        "&:hover":
                        {
                          backgroundColor:
                            "#3E2616",
                        },
                      },

                      "& .MuiPaginationItem-root:hover":
                      {
                        backgroundColor:
                          "rgba(92,58,33,0.10)",
                      },
                    }}
                  />
                </Box>
              </>
            )}
        </Card>
      </Box>
    </Box>
  );
}

/*
 * =========================================================
 * NOTIFICATION TYPE
 * =========================================================
 */

function getNotificationType(
  message: string
): NotificationType {
  const text =
    message.toLowerCase();

  if (
    text.includes("borrow") ||
    text.includes("borrowed")
  ) {
    return "borrow";
  }

  if (
    text.includes("due") ||
    text.includes("overdue") ||
    text.includes("return")
  ) {
    return "due";
  }

  return "success";
}

/*
 * =========================================================
 * NOTIFICATION TIME
 * =========================================================
 */

function formatNotificationTime(
  value?: string
) {
  if (!value) {
    return "Recently";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const minutes =
    Math.floor(
      difference / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return `${String(
    date.getDate()
  ).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}