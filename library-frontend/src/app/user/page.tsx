"use client";

import {
  Box,
  Card,
  Typography,
  Chip,
  Divider,
  Button,
  Menu,
  MenuItem,
  Badge,
  IconButton,
} from "@mui/material";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LogoutFeedbackDialog from "../components/LogoutFeedbackDialog";
import UserChatbot from "../components/UserChatbot";

type RecentBook = {
  bookId: string;
  title: string;
  author: string;
  dueDate: string;
  status: string;
};

type Notification = {
  notificationId: string;
  borrowingId: string;
  bookTitle: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type UserDashboard = {
  userName: string;
  borrowedCount: number;
  dueSoonCount: number;
  overdueCount: number;
  totalFine: number;
  recentBooks: RecentBook[];
};

const getInitials = (name: string) => {
  if (!name) {
    return "U";
  }

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function UserPage() {
  const router = useRouter();

  // =========================
  // DASHBOARD STATE
  // =========================

  const [dashboard, setDashboard] =
    useState<UserDashboard | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================
  // NOTIFICATION STATE
  // =========================

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [notificationLoading, setNotificationLoading] =
    useState(true);

  // =========================
  // PROFILE MENU STATE
  // =========================

  const [profileAnchorEl, setProfileAnchorEl] =
    useState<null | HTMLElement>(null);

  const [feedbackDialogOpen, setFeedbackDialogOpen] =
    useState(false);

  // =========================
  // NOTIFICATION MENU STATE
  // =========================

  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);

  // =========================
  // FETCH NOTIFICATIONS
  // =========================

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token =
          sessionStorage.getItem("accessToken");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5011/api/User/notifications",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          sessionStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setNotifications([]);
          return;
        }

        const result = await response.json();

        if (Array.isArray(result)) {
          setNotifications(result);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error(
          "Notification error:",
          error
        );

        setNotifications([]);
      } finally {
        setNotificationLoading(false);
      }
    };

    loadNotifications();
  }, [router]);

  // =========================
  // FETCH DASHBOARD
  // =========================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token =
          sessionStorage.getItem("accessToken");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5011/api/User/dashboard",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403 ||
            response.status === 404
          ) {
            sessionStorage.removeItem(
              "accessToken"
            );

            router.replace("/login");
            return;
          }

          throw new Error(
            result.message ||
            "Failed to load dashboard"
          );
        }

        setDashboard(result);
      } catch (error) {
        console.error(
          "Dashboard API error:",
          error
        );

        setError(
          "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  // =========================
  // PROFILE MENU
  // =========================

  const handleProfileClick = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setProfileAnchorEl(
      event.currentTarget
    );
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  // =========================
  // MY PROFILE
  // =========================

  const handleMyProfile = () => {
    setProfileAnchorEl(null);

    router.push("/user/profile");
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    setProfileAnchorEl(null);

    setFeedbackDialogOpen(true);
  };

  const handleFinalLogout = () => {
    setFeedbackDialogOpen(false);

    sessionStorage.removeItem(
      "accessToken"
    );

    router.replace("/");
  };

  // =========================
  // CANCEL LOGOUT
  // =========================

  const handleFeedbackDialogClose = () => {
    setFeedbackDialogOpen(false);
  };

  // =========================
  // MARK ALL NOTIFICATIONS AS READ
  // =========================

  const markNotificationsAsRead = async () => {
    const token =
      sessionStorage.getItem("accessToken");

    if (!token) {
      sessionStorage.removeItem(
        "accessToken"
      );

      router.replace("/login");

      return;
    }

    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.isRead
      );

    if (
      unreadNotifications.length === 0
    ) {
      return;
    }

    try {
      const results = await Promise.all(
        unreadNotifications.map(
          async (notification) => {
            const response =
              await fetch(
                `http://localhost:5011/api/User/notifications/${notification.notificationId}/read`,
                {
                  method: "PUT",
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            if (
              response.status === 401
            ) {
              sessionStorage.removeItem(
                "accessToken"
              );

              router.replace("/login");

              return false;
            }

            return response.ok;
          }
        )
      );

      const allSuccessful =
        results.every(
          (result) => result === true
        );

      if (allSuccessful) {
        setNotifications(
          (currentNotifications) =>
            currentNotifications.map(
              (notification) => ({
                ...notification,
                isRead: true,
              })
            )
        );
      }
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );
    }
  };

  // =========================
  // NOTIFICATION BUTTON
  // =========================

  const handleNotificationClick = async (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setNotificationAnchorEl(
      event.currentTarget
    );

    await markNotificationsAsRead();
  };

  // =========================
  // CLOSE NOTIFICATION POPUP
  // =========================

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  // =========================
  // CLICK NOTIFICATION
  // =========================

  const handleNotificationItemClick =
    async () => {
      setNotificationAnchorEl(null);

      router.push(
        "/user/notifications"
      );
    };

  // =========================
  // UNREAD COUNT
  // =========================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  // =========================
  // LOADING
  // =========================

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
        <Typography
          color="text.secondary"
        >
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error || !dashboard) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="error">
          {error ||
            "Dashboard data not available."}
        </Typography>
      </Box>
    );
  }

  // =========================
  // STATISTICS
  // =========================

  const stats = [
    {
      title: "Currently Borrowed",
      value: dashboard.borrowedCount,
      icon: <MenuBookOutlinedIcon />,
    },
    {
      title: "Due Soon",
      value: dashboard.dueSoonCount,
      icon: <EventOutlinedIcon />,
    },
    {
      title: "Overdue",
      value: dashboard.overdueCount,
      icon: <WarningAmberOutlinedIcon />,
    },
    {
      title: "Total Fine",
      value: `₹${dashboard.totalFine}`,
      icon: <CurrencyRupeeOutlinedIcon />,
    },
  ];

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
      {/* =========================
          HEADER
      ========================= */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 4,
        }}
      >
        {/* LEFT SIDE */}

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
            MEMBER DASHBOARD
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "1.8rem",
                md: "2.6rem",
              },
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            Welcome back,{" "}
            {dashboard.userName}
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "text.secondary",
              fontSize: "0.85rem",
            }}
          >
            Here is an overview of
            your library activity.
          </Typography>
        </Box>

        {/* RIGHT SIDE */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >

          <Button
            variant="contained"
            startIcon={<span>✨</span>}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("open-library-chatbot")
              );
            }}
          sx={{
            height: 46,
            px: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            color: "#FFFDF7",
            background:
              "linear-gradient(135deg, #5C3A21, #B8860B)",
            boxShadow:
              "0 4px 12px rgba(62,38,22,0.12)",
            "&:hover": {
              background:
                "linear-gradient(135deg, #3E2616, #8A6545)",
            },
          }}
          >
          Ask LibriX
        </Button>
        {/* =========================
              NOTIFICATION BUTTON
          ========================= */}

        <IconButton
          onClick={
            handleNotificationClick
          }
          aria-label="Notifications"
          sx={{
            width: 46,
            height: 46,
            color: "secondary.dark",
            backgroundColor:
              "rgba(255,253,247,0.8)",
            border:
              "1px solid rgba(92,58,33,0.10)",
            "&:hover": {
              backgroundColor:
                "rgba(184,134,11,0.10)",
            },
          }}
        >
          <Badge
            badgeContent={
              unreadCount
            }
            max={99}
            color="error"
            invisible={
              unreadCount === 0
            }
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.65rem",
                minWidth: 18,
                height: 18,
                padding: "0 4px",
              },
            }}
          >
            <NotificationsNoneOutlinedIcon />
          </Badge>
        </IconButton>

        {/* =========================
              PROFILE BUTTON
          ========================= */}

        <Box
          onClick={
            handleProfileClick
          }
          role="button"
          tabIndex={0}
          sx={{
            display: {
              xs: "none",
              sm: "flex",
            },
            width: 48,
            height: 48,
            borderRadius: "50%",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #5C3A21, #B8860B)",
            color: "#FFFDF7",
            fontWeight: 600,
            cursor: "pointer",
            userSelect: "none",
            transition:
              "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform:
                "translateY(-1px)",
              boxShadow:
                "0 6px 18px rgba(62,38,22,0.20)",
            },
          }}
        >
          {getInitials(
            dashboard.userName
          )}
        </Box>
      </Box>
    </Box>

      {/* =========================
          PROFILE MENU
      ========================= */}

  <Menu
    anchorEl={
      profileAnchorEl
    }
    open={
      Boolean(profileAnchorEl)
    }
    onClose={
      handleProfileClose
    }
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    slotProps={{
      paper: {
        sx: {
          mt: 1,
          minWidth: 190,
          borderRadius: 2,
          boxShadow:
            "0 10px 30px rgba(62,38,22,0.15)",
        },
      },
    }}
  >
    <MenuItem
      onClick={
        handleMyProfile
      }
      sx={{
        py: 1.3,
        fontSize: "0.85rem",
      }}
    >
      <PersonOutlinedIcon
        sx={{
          mr: 1.5,
          fontSize: 20,
          color: "secondary.dark",
        }}
      />

      My Profile
    </MenuItem>

    <Divider />

    <MenuItem
      onClick={
        handleLogout
      }
      sx={{
        py: 1.3,
        fontSize: "0.85rem",
        color: "#B42318",
      }}
    >
      <LogoutOutlinedIcon
        sx={{
          mr: 1.5,
          fontSize: 20,
        }}
      />

      Logout
    </MenuItem>
  </Menu>

  {/* =========================
          NOTIFICATION MENU
      ========================= */}

  <Menu
    anchorEl={
      notificationAnchorEl
    }
    open={
      Boolean(
        notificationAnchorEl
      )
    }
    onClose={
      handleNotificationClose
    }
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    slotProps={{
      paper: {
        sx: {
          mt: 1,
          width: {
            xs: "calc(100vw - 32px)",
            sm: 380,
          },
          maxHeight: 500,
          borderRadius: 2,
          boxShadow:
            "0 10px 30px rgba(62,38,22,0.15)",
          overflowY: "auto",
        },
      },
    }}
  >
    {/* NOTIFICATION HEADER */}

    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
      }}
    >
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: "0.95rem",
        }}
      >
        Notifications
      </Typography>

      {unreadCount > 0 && (
        <Chip
          label={`${unreadCount} new`}
          size="small"
          sx={{
            height: 24,
            fontSize: "0.65rem",
            backgroundColor:
              "rgba(180,35,24,0.10)",
            color: "#B42318",
          }}
        />
      )}
    </Box>

    <Divider />

    {/* NOTIFICATION CONTENT */}

    {notificationLoading ? (
      <Box
        sx={{
          px: 2,
          py: 3,
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.8rem",
            color:
              "text.secondary",
          }}
        >
          Loading notifications...
        </Typography>
      </Box>
    ) : notifications.length ===
      0 ? (
      <Box
        sx={{
          px: 2,
          py: 3,
          textAlign: "center",
        }}
      >
        <NotificationsNoneOutlinedIcon
          sx={{
            fontSize: 34,
            color:
              "text.secondary",
            mb: 1,
          }}
        />

        <Typography
          sx={{
            fontSize: "0.8rem",
            color:
              "text.secondary",
          }}
        >
          No notifications yet.
        </Typography>
      </Box>
    ) : (
      <Box>
        {/* ONLY FIRST 2 NOTIFICATIONS */}
        {notifications
          .slice(0, 2)
          .map(
            (
              notification,
              index
            ) => (
              <Box
                key={
                  notification.notificationId
                }
              >
                <MenuItem
                  onClick={
                    handleNotificationItemClick
                  }
                  sx={{
                    display:
                      "block",
                    whiteSpace:
                      "normal",
                    py: 1.5,
                    px: 2,
                    backgroundColor:
                      notification.isRead
                        ? "transparent"
                        : "rgba(184,134,11,0.06)",
                    "&:hover": {
                      backgroundColor:
                        "rgba(184,134,11,0.10)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display:
                        "flex",
                      alignItems:
                        "flex-start",
                      gap: 1.5,
                    }}
                  >
                    {/* UNREAD DOT */}

                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        minWidth: 8,
                        borderRadius:
                          "50%",
                        mt: 0.7,
                        backgroundColor:
                          notification.isRead
                            ? "transparent"
                            : "#B42318",
                      }}
                    />

                    <Box
                      sx={{
                        flex: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize:
                            "0.8rem",
                          fontWeight:
                            notification.isRead
                              ? 500
                              : 600,
                          lineHeight:
                            1.5,
                        }}
                      >
                        {
                          notification.message
                        }
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.4,
                          fontSize:
                            "0.7rem",
                          color:
                            "text.secondary",
                        }}
                      >
                        {
                          notification.bookTitle
                        }
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.3,
                          fontSize:
                            "0.65rem",
                          color:
                            "text.secondary",
                        }}
                      >
                        {new Date(
                          notification.createdAt
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>

                {index < 1 && (
                  <Divider />
                )}
              </Box>
            )
          )}
      </Box>
    )}

    {/* VIEW ALL */}

    {notifications.length >
      0 && (
        <>
          <Divider />

          <Box
            sx={{
              px: 2,
              py: 1,
            }}
          >
            <Button
              component={Link}
              href="/user/notifications"
              onClick={
                handleNotificationClose
              }
              fullWidth
              sx={{
                textTransform:
                  "none",
                color:
                  "primary.main",
                fontSize:
                  "0.8rem",
                fontWeight: 600,
              }}
            >
              View all notifications →
            </Button>
          </Box>
        </>
      )}
  </Menu>

  {/* =========================
          LOGOUT FEEDBACK DIALOG
      ========================= */}

      <LogoutFeedbackDialog
        open={feedbackDialogOpen}
        onClose={
          handleFeedbackDialogClose
        }
        onLogout={
          handleFinalLogout
        }
      />

      <UserChatbot />

  {/* =========================
          STATISTICS
      ========================= */}

  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr 1fr",
        md: "repeat(4, 1fr)",
      },
      gap: 2.5,
      mb: 4,
    }}
  >
    {stats.map((stat) => (
      <Card
        key={stat.title}
        sx={{
          p: 2.5,
          borderRadius: 3,
          background:
            "rgba(255,253,247,0.8)",
          border:
            "1px solid rgba(92,58,33,0.08)",
          boxShadow:
            "0 8px 25px rgba(62,38,22,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "flex-start",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              color:
                "text.secondary",
              lineHeight: 1.4,
            }}
          >
            {stat.title}
          </Typography>

          <Box
            sx={{
              color:
                "secondary.dark",
            }}
          >
            {stat.icon}
          </Box>
        </Box>

        <Typography
          sx={{
            mt: 2,
            fontSize: "1.8rem",
            fontWeight: 600,
            color:
              "text.primary",
          }}
        >
          {stat.value}
        </Typography>
      </Card>
    ))}
  </Box>

  {/* =========================
          BORROWED BOOKS
      ========================= */}

  <Card
    sx={{
      borderRadius: 3,
      p: {
        xs: 2,
        md: 3,
      },
      background:
        "rgba(255,253,247,0.88)",
      boxShadow:
        "0 10px 30px rgba(62,38,22,0.08)",
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: "1.2rem",
            fontWeight: 600,
            color:
              "text.primary",
          }}
        >
          Currently Borrowed
        </Typography>

        <Typography
          sx={{
            fontSize: "0.75rem",
            color:
              "text.secondary",
            mt: 0.4,
          }}
        >
          Books currently with you
        </Typography>
      </Box>

      <Button
        component={Link}
        href="/user/borrowed"
        sx={{
          fontSize: "0.8rem",
          color:
            "primary.main",
          textTransform:
            "none",
          fontWeight: 600,
          minWidth: "auto",
          p: 0,
        }}
      >
        View all →
      </Button>
    </Box>

    <Divider
      sx={{
        mb: 1,
      }}
    />

    {dashboard.recentBooks
      .length === 0 ? (
      <Typography
        sx={{
          py: 3,
          textAlign: "center",
          color:
            "text.secondary",
          fontSize: "0.85rem",
        }}
      >
        You dont have any currently
        borrowed books.
      </Typography>
    ) : (
      dashboard.recentBooks.map(
        (book, index) => (
          <Box
            key={`${book.bookId}-${index}`}
          >
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
                py: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize:
                      "0.95rem",
                  }}
                >
                  {book.title}
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
                  {book.author}
                </Typography>

                <Typography
                  sx={{
                    color:
                      "text.secondary",
                    fontSize:
                      "0.75rem",
                    mt: 1,
                  }}
                >
                  Due:{" "}
                  {new Date(
                    book.dueDate
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month:
                        "long",
                      year:
                        "numeric",
                    }
                  )}
                </Typography>
              </Box>

              <Chip
                label={
                  book.status
                }
                size="small"
                sx={{
                  color:
                    book.status ===
                      "Due Soon"
                      ? "#8B6508"
                      : book.status ===
                        "Overdue"
                        ? "#B42318"
                        : "#5C3A21",

                  backgroundColor:
                    book.status ===
                      "Due Soon"
                      ? "rgba(184,134,11,0.12)"
                      : book.status ===
                        "Overdue"
                        ? "rgba(180,35,24,0.10)"
                        : "rgba(92,58,33,0.10)",

                  fontWeight: 500,
                }}
              />
            </Box>

            {index <
              dashboard
                .recentBooks
                .length -
              1 && (
                <Divider />
              )}
          </Box>
        )
      )
    )}
  </Card>
    </Box >
  );
}