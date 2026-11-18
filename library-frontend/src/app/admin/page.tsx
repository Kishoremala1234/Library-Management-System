"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Box,
  Card,
  Typography,
  Button,
  Divider,
  Badge,
  IconButton,
  Popover,
} from "@mui/material";

import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";

type AdminDashboard = {
  totalBooks: number;
  totalUsers: number;
  activeBorrowings: number;
  overdueBooks: number;
  totalCategories: number;
};

type AdminBorrowing = {
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

type AdminNotification = {
  notificationId: string;
  borrowingId: string;
  userId: string;
  username: string;
  name: string;
  bookId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<AdminDashboard | null>(null);

  const [upcomingDueUsers, setUpcomingDueUsers] =
    useState<AdminBorrowing[]>([]);

  const [notifications, setNotifications] =
    useState<AdminNotification[]>([]);

  const [notificationCount, setNotificationCount] =
    useState(0);

  const [notificationAnchor, setNotificationAnchor] =
    useState<HTMLElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // NOTIFICATION POPUP
  // =====================================================

  const notificationOpen =
    Boolean(notificationAnchor);

  const handleNotificationClick = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setNotificationAnchor(event.currentTarget);
    setNotificationCount(0);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  // =====================================================
  // OPEN NOTIFICATION PAGE
  // =====================================================

  const handleOpenNotification = () => {
    setNotificationAnchor(null);
    router.push("/admin/notifications");
  };

  // =====================================================
  // DASHBOARD API
  // =====================================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token =
          sessionStorage.getItem("accessToken");

        if (!token) {
          router.replace("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // ==========================================
        // DASHBOARD
        // ==========================================

        const dashboardResponse = await fetch(
          "http://localhost:5011/api/Admin/dashboard",
          {
            method: "GET",
            headers,
          }
        );

        const dashboardText =
          await dashboardResponse.text();

        let dashboardResult:
          | AdminDashboard
          | { message?: string } = {};

        if (dashboardText.trim()) {
          try {
            dashboardResult =
              JSON.parse(dashboardText);
          } catch {
            throw new Error(
              "Invalid response from dashboard API."
            );
          }
        }

        if (!dashboardResponse.ok) {
          if (
            dashboardResponse.status === 401
          ) {
            sessionStorage.removeItem(
              "accessToken"
            );

            router.replace("/login");
            return;
          }

          if (
            dashboardResponse.status === 403
          ) {
            router.replace("/user");
            return;
          }

          throw new Error(
            "message" in dashboardResult
              ? dashboardResult.message ||
              "Failed to load admin dashboard"
              : "Failed to load admin dashboard"
          );
        }

        setDashboard(
          dashboardResult as AdminDashboard
        );

        // ==========================================
        // BORROWINGS
        // ==========================================

        const borrowingsResponse =
          await fetch(
            "http://localhost:5011/api/Admin/borrowings",
            {
              method: "GET",
              headers,
            }
          );

        const borrowingsText =
          await borrowingsResponse.text();

        let borrowingsResult:
          | AdminBorrowing[]
          | { message?: string } = [];

        if (borrowingsText.trim()) {
          try {
            borrowingsResult =
              JSON.parse(borrowingsText);
          } catch {
            throw new Error(
              "Invalid response from borrowings API."
            );
          }
        }

        if (!borrowingsResponse.ok) {
          if (
            borrowingsResponse.status === 401
          ) {
            sessionStorage.removeItem(
              "accessToken"
            );

            router.replace("/login");
            return;
          }

          if (
            borrowingsResponse.status === 403
          ) {
            router.replace("/user");
            return;
          }

          throw new Error(
            "message" in borrowingsResult
              ? borrowingsResult.message ||
              "Failed to load borrowings"
              : "Failed to load borrowings"
          );
        }

        // ==========================================
        // UPCOMING DUE USERS
        // ==========================================

        const now = new Date();

        const borrowingList =
          Array.isArray(borrowingsResult)
            ? borrowingsResult
            : [];

        const upcoming = borrowingList
          .filter((borrowing) => {
            if (borrowing.returnedDate) {
              return false;
            }

            const dueDate =
              new Date(borrowing.dueDate);

            return dueDate >= now;
          })
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() -
              new Date(b.dueDate).getTime()
          )
          .slice(0, 5);

        setUpcomingDueUsers(upcoming);

        // ==========================================
        // NOTIFICATIONS
        // ==========================================

        try {
          const notificationsResponse =
            await fetch(
              "http://localhost:5011/api/Admin/notifications",
              {
                method: "GET",
                headers,
              }
            );

          const notificationsText =
            await notificationsResponse.text();

          // ----------------------------------------
          // EMPTY RESPONSE
          // ----------------------------------------

          if (!notificationsText.trim()) {
            setNotifications([]);
            setNotificationCount(0);
          } else {
            let notificationsResult:
              | AdminNotification[]
              | { message?: string };

            try {
              notificationsResult =
                JSON.parse(
                  notificationsText
                );
            } catch {
              console.error(
                "Invalid notifications response:",
                notificationsText
              );

              setNotifications([]);
              setNotificationCount(0);

              return;
            }

            // --------------------------------------
            // AUTHORIZATION
            // --------------------------------------

            if (
              !notificationsResponse.ok
            ) {
              if (
                notificationsResponse.status ===
                401
              ) {
                sessionStorage.removeItem(
                  "accessToken"
                );

                router.replace("/login");
                return;
              }

              if (
                notificationsResponse.status ===
                403
              ) {
                router.replace("/user");
                return;
              }

              console.error(
                "Notifications API error:",
                notificationsResult
              );

              setNotifications([]);
              setNotificationCount(0);
            } else {
              const notificationData =
                Array.isArray(
                  notificationsResult
                )
                  ? notificationsResult
                  : [];

              setNotifications(
                notificationData
              );

              setNotificationCount(
                notificationData.filter(
                  (notification) =>
                    !notification.isRead
                ).length
              );
            }
          }
        } catch (notificationError) {
          // Notifications should not prevent
          // the admin dashboard from loading.

          console.error(
            "Notifications API error:",
            notificationError
          );

          setNotifications([]);
          setNotificationCount(0);
        }
      } catch (error) {
        console.error(
          "Admin dashboard API error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  // =====================================================
  // REFRESH SIDEBAR NOTIFICATION COUNT
  // =====================================================

  useEffect(() => {
    const refreshNotificationCount = async () => {
      try {
        const token =
          sessionStorage.getItem("accessToken");

        if (!token) {
          return;
        }

        const response = await fetch(
          "http://localhost:5011/api/Admin/notifications",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        const notificationData =
          Array.isArray(data) ? data : [];

        setNotifications(
          notificationData
        );

        setNotificationCount(
          notificationData.filter(
            (notification: AdminNotification) =>
              !notification.isRead
          ).length
        );
      } catch (error) {
        console.error(
          "Failed to refresh notification count:",
          error
        );
      }
    };

    const handleNotificationsUpdated = () => {
      refreshNotificationCount();
    };

    window.addEventListener(
      "adminNotificationsUpdated",
      handleNotificationsUpdated
    );

    return () => {
      window.removeEventListener(
        "adminNotificationsUpdated",
        handleNotificationsUpdated
      );
    };
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

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
          Loading admin dashboard...
        </Typography>
      </Box>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

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
            "Admin dashboard unavailable."}
        </Typography>
      </Box>
    );
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  const stats = [
    {
      title: "Total Books",
      value: dashboard.totalBooks,
      icon: <MenuBookOutlinedIcon />,
    },
    {
      title: "Total Users",
      value: dashboard.totalUsers,
      icon: <PeopleOutlineOutlinedIcon />,
    },
    {
      title: "Active Borrowings",
      value: dashboard.activeBorrowings,
      icon: <SwapHorizOutlinedIcon />,
    },
    {
      title: "Overdue Books",
      value: dashboard.overdueBooks,
      icon: <WarningAmberOutlinedIcon />,
    },
    {
      title: "Categories",
      value: dashboard.totalCategories,
      icon: <CategoryOutlinedIcon />,
    },
  ];

  // =====================================================
  // PAGE
  // =====================================================

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
          mb: 5,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 3,
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
            ADMINISTRATION
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "1.9rem",
                md: "2.8rem",
              },
              fontWeight: 600,
            }}
          >
            Library Overview
          </Typography>

          <Typography
            sx={{
              mt: 0.6,
              color: "text.secondary",
              fontSize: "0.85rem",
            }}
          >
            Manage your library from one place.
          </Typography>
        </Box>

        {/* =================================================
            NOTIFICATION
        ================================================= */}

        <Box
          sx={{
            flexShrink: 0,
            pt: {
              xs: 1.5,
              md: 4.5,
            },
          }}
        >
          <IconButton
            onClick={handleNotificationClick}
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
            {/* =================================================
                RED DOT ONLY
                NO NUMBER
            ================================================= */}

            <Badge
              variant="dot"
              invisible={
                notificationCount === 0
              }
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#D32F2F",
                  width: 9,
                  height: 15,
                  minWidth: 15,
                  borderRadius: "50%",
                  border: "2px solid #FFFDF7",
                  top: 3,
                  right: 3,
                },
              }}
            >
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>

          {/* =================================================
              NOTIFICATION POPUP
          ================================================= */}

          <Popover
            open={notificationOpen}
            anchorEl={notificationAnchor}
            onClose={handleNotificationClose}
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
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "text.primary",
                }}
              >
                Notifications
              </Typography>
            </Box>

            <Divider />

            {/* =================================================
                ONLY FIRST TWO NOTIFICATIONS
            ================================================= */}

            {notifications.length === 0 ? (
              <Box
                sx={{
                  px: 2,
                  py: 4,
                  textAlign: "center",
                }}
              >
                <NotificationsNoneOutlinedIcon
                  sx={{
                    fontSize: 34,
                    color: "text.secondary",
                    mb: 1,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: "text.secondary",
                  }}
                >
                  No notifications yet.
                </Typography>
              </Box>
            ) : (
              <Box>
                {notifications
                  .slice(0, 2)
                  .map((notification) => (
                    <Box
                      key={
                        notification.notificationId
                      }
                      onClick={
                        handleOpenNotification
                      }
                      sx={{
                        px: 2,
                        py: 1.8,

                        cursor: "pointer",

                        backgroundColor:
                          notification.isRead
                            ? "transparent"
                            : "rgba(184,134,11,0.06)",

                        borderBottom:
                          "1px solid rgba(92,58,33,0.08)",

                        transition:
                          "background-color 0.2s ease",

                        "&:hover": {
                          backgroundColor:
                            "rgba(92,58,33,0.06)",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "text.primary",
                        }}
                      >
                        {notification.name ||
                          notification.username}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.4,
                          fontSize: "0.78rem",
                          color: "text.primary",
                          lineHeight: 1.5,
                        }}
                      >
                        {notification.message}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.7,
                          fontSize: "0.68rem",
                          color: "text.secondary",
                        }}
                      >
                        {new Date(
                          notification.createdAt
                        ).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Typography>
                    </Box>
                  ))}

                {/* =================================================
                    VIEW ALL NOTIFICATIONS
                ================================================= */}

                <Box
                  onClick={
                    handleOpenNotification
                  }
                  sx={{
                    px: 2,
                    py: 1.5,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    cursor: "pointer",

                    color: "#5C3A21",
                    fontSize: "0.82rem",
                    fontWeight: 600,

                    transition:
                      "background-color 0.2s ease",

                    "&:hover": {
                      backgroundColor:
                        "rgba(92,58,33,0.06)",
                    },
                  }}
                >
                  View all notifications →
                </Box>
              </Box>
            )}
          </Popover>
        </Box>
      </Box>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr 1fr",
            md: "repeat(3, 1fr)",
            xl: "repeat(5, 1fr)",
          },

          gap: 2.5,
          mb: 5,
        }}
      >
        {stats.map((stat) => (
          <Card
            key={stat.title}
            sx={{
              p: 2.5,
              borderRadius: 3,

              background:
                "rgba(255,253,247,0.86)",

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
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                }}
              >
                {stat.title}
              </Typography>

              <Box
                sx={{
                  color: "secondary.dark",
                }}
              >
                {stat.icon}
              </Box>
            </Box>

            <Typography
              sx={{
                mt: 2,
                fontSize: "2rem",
                fontWeight: 600,
              }}
            >
              {stat.value}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* =================================================
          QUICK ACCESS
      ================================================= */}

      <Typography
        sx={{
          fontSize: "1.2rem",
          fontWeight: 600,
          mb: 2,
        }}
      >
        Quick Access
      </Typography>

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },

          gap: 2.5,
        }}
      >
        <QuickAction
          title="Manage Books"
          description="Add, edit, or remove books."
          href="/admin/books"
          icon={<MenuBookOutlinedIcon />}
        />

        <QuickAction
          title="Manage Users"
          description="View and manage library members."
          href="/admin/users"
          icon={<PeopleOutlineOutlinedIcon />}
        />

        <QuickAction
          title="Borrowings"
          description="Track borrowed and returned books."
          href="/admin/borrowings"
          icon={<SwapHorizOutlinedIcon />}
        />

        <QuickAction
          title="Categories"
          description="Manage your library categories."
          href="/admin/categories"
          icon={<CategoryOutlinedIcon />}
        />
      </Box>

      <Divider
        sx={{
          my: 4,
          borderColor:
            "rgba(92,58,33,0.08)",
        }}
      />

      {/* =================================================
          UPCOMING DUE USERS
      ================================================= */}

      <Box sx={{ mt: 5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "1.2rem",
              fontWeight: 600,
            }}
          >
            Upcoming Due Users
          </Typography>

          <Button
            onClick={() =>
              router.push(
                "/admin/borrowings"
              )
            }
            endIcon={
              <ArrowForwardOutlinedIcon
                sx={{ fontSize: 18 }}
              />
            }
            sx={{
              color: "#5C3A21",
              textTransform: "none",
              fontSize: "0.8rem",
              fontWeight: 600,

              "&:hover": {
                backgroundColor:
                  "rgba(92,58,33,0.06)",
              },
            }}
          >
            View All Borrowings
          </Button>
        </Box>

        <Card
          sx={{
            borderRadius: 3,

            background:
              "rgba(255,253,247,0.86)",

            border:
              "1px solid rgba(92,58,33,0.08)",

            boxShadow:
              "0 8px 25px rgba(62,38,22,0.08)",

            overflow: "hidden",
          }}
        >
          {upcomingDueUsers.length === 0 ? (
            <Box
              sx={{
                py: 5,
                px: 3,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.85rem",
                }}
              >
                No upcoming due users.
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* TABLE HEADER */}

              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1.2fr 1.5fr 1fr",
                    md: "1.2fr 2fr 1.2fr",
                  },

                  gap: 2,

                  px: {
                    xs: 2,
                    sm: 3,
                  },

                  py: 1.8,

                  backgroundColor:
                    "rgba(92,58,33,0.04)",

                  borderBottom:
                    "1px solid rgba(92,58,33,0.08)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  USER
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  BOOK
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  DUE DATE
                </Typography>
              </Box>

              {/* ROWS */}

              {upcomingDueUsers.map(
                (borrowing, index) => (
                  <Box
                    key={
                      borrowing.borrowingId
                    }
                    onClick={() =>
                      router.push(
                        "/admin/borrowings"
                      )
                    }
                    sx={{
                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1.2fr 1.5fr 1fr",
                        md: "1.2fr 2fr 1.2fr",
                      },

                      gap: 2,

                      px: {
                        xs: 2,
                        sm: 3,
                      },

                      py: 2.2,

                      cursor: "pointer",

                      borderBottom:
                        index !==
                          upcomingDueUsers.length -
                          1
                          ? "1px solid rgba(92,58,33,0.06)"
                          : "none",

                      "&:hover": {
                        backgroundColor:
                          "rgba(92,58,33,0.06)",
                      },
                    }}
                  >
                    {/* USER */}

                    <Box
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 600,

                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",

                          whiteSpace: "nowrap",
                        }}
                      >
                        {borrowing.name ||
                          borrowing.username}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.3,
                          fontSize: "0.7rem",
                          color:
                            "text.secondary",

                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",

                          whiteSpace: "nowrap",
                        }}
                      >
                        @{borrowing.username}
                      </Typography>
                    </Box>

                    {/* BOOK */}

                    <Box
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 500,

                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",

                          whiteSpace: "nowrap",
                        }}
                      >
                        {borrowing.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.3,
                          fontSize: "0.7rem",
                          color:
                            "text.secondary",

                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",

                          whiteSpace: "nowrap",
                        }}
                      >
                        {borrowing.author}
                      </Typography>
                    </Box>

                    {/* DUE DATE */}

                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        color: "#5C3A21",
                        alignSelf:
                          "center",
                      }}
                    >
                      {new Date(
                        borrowing.dueDate
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
}

// =====================================================
// QUICK ACTION COMPONENT
// =====================================================

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Card
      component="a"
      href={href}
      sx={{
        textDecoration: "none",
        color: "inherit",

        p: 2.5,

        borderRadius: 3,

        background:
          "rgba(255,253,247,0.86)",

        border:
          "1px solid rgba(92,58,33,0.08)",

        boxShadow:
          "0 8px 25px rgba(62,38,22,0.08)",

        transition:
          "transform 0.25s ease, box-shadow 0.25s ease",

        "&:hover": {
          transform: "translateY(-4px)",

          boxShadow:
            "0 14px 30px rgba(62,38,22,0.12)",
        },
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,

          borderRadius: 2,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          mb: 2,

          backgroundColor:
            "rgba(92,58,33,0.08)",

          color: "primary.main",
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          fontWeight: 600,
          fontSize: "0.95rem",
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.6,
          color: "text.secondary",
          fontSize: "0.75rem",
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Card>
  );
}