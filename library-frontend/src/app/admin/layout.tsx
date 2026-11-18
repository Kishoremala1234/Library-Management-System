"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InfinityLoop } from "@/components/infinity";

import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

interface AdminNotification {
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
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const [logoutDialogOpen, setLogoutDialogOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [notificationCount, setNotificationCount] =
    useState(0);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogoutClick = () => {
    if (isLoggingOut) {
      return;
    }

    setLogoutDialogOpen(true);
  };

  const handleCloseLogoutDialog = () => {
    if (isLoggingOut) {
      return;
    }

    setLogoutDialogOpen(false);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    setLogoutDialogOpen(false);

    sessionStorage.removeItem("accessToken");

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1500);
    });

    router.replace("/");
  };

  // =====================================================
  // FETCH SIDEBAR NOTIFICATION COUNT
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    const loadNotificationCount = async () => {
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
          return;
        }

        const data =
          await response.json();

        const notificationData: AdminNotification[] =
          Array.isArray(data)
            ? data
            : [];

        const unreadCount =
          notificationData.filter(
            (notification) =>
              !notification.isRead
          ).length;

        if (isMounted) {
          setNotificationCount(
            unreadCount
          );
        }
      } catch (error) {
        console.error(
          "Failed to load notification count:",
          error
        );
      }
    };

    const handleNotificationsUpdated = () => {
      void loadNotificationCount();
    };

    window.addEventListener(
      "adminNotificationsUpdated",
      handleNotificationsUpdated
    );

    void loadNotificationCount();

    return () => {
      isMounted = false;

      window.removeEventListener(
        "adminNotificationsUpdated",
        handleNotificationsUpdated
      );
    };
  }, [router]);

  // =====================================================
  // ACTIVE SIDEBAR ITEM
  // =====================================================

  const isActive = (path: string) => {
    return pathname === path;
  };

  // =====================================================
  // NAVIGATION ITEMS
  // =====================================================

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <DashboardOutlinedIcon />,
    },
    {
      label: "Books",
      href: "/admin/books",
      icon: <MenuBookOutlinedIcon />,
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: <PeopleOutlineOutlinedIcon />,
    },
    {
      label: "Borrowings",
      href: "/admin/borrowings",
      icon: <SwapHorizOutlinedIcon />,
    },
    {
      label: "Payments",
      href: "/admin/payments",
      icon: <PaymentsOutlinedIcon />,
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: <NotificationsNoneOutlinedIcon />,
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: <CategoryOutlinedIcon />,
    },
  ];

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",

        background:
          "linear-gradient(135deg, #F8F2E7 0%, #E8D8BE 100%)",
      }}
    >
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Box
        component="aside"
        sx={{
          width: 250,
          minHeight: "100vh",

          display: {
            xs: "none",
            md: "flex",
          },

          flexDirection: "column",

          position: "fixed",

          left: 0,
          top: 0,
          bottom: 0,

          backgroundColor:
            "rgba(62,38,22,0.97)",

          color: "#FFFDF7",

          px: 2,
          py: 3,

          zIndex: 1200,
        }}
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <Box
          sx={{
            px: 1.5,
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <AdminPanelSettingsOutlinedIcon />

            <Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                Library Admin
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.65rem",
                  opacity: 0.6,
                  letterSpacing: "0.08em",
                }}
              >
                ADMIN PANEL
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider
          sx={{
            borderColor:
              "rgba(255,255,255,0.12)",
            mb: 2,
          }}
        />

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <List sx={{ px: 0 }}>
          {navigationItems.map((item) => {
            const active = isActive(
              item.href
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <ListItemButton
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    mb: 0.7,

                    color: "#FFFDF7",

                    backgroundColor:
                      active
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",

                    boxShadow:
                      active
                        ? "0 4px 12px rgba(0,0,0,0.12)"
                        : "none",

                    "&:hover": {
                      backgroundColor:
                        "rgba(255,255,255,0.08)",
                    },

                    "&.Mui-selected": {
                      backgroundColor:
                        "rgba(255,255,255,0.08)",
                    },

                    "&.Mui-selected:hover": {
                      backgroundColor:
                        "rgba(255,255,255,0.12)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: "#D4AF37",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={item.label}
                  />

                  {/* =================================================
                      NOTIFICATION COUNT
                  ================================================= */}

                  {item.label ===
                    "Notifications" &&
                    notificationCount > 0 && (
                      <Badge
                        badgeContent={
                          notificationCount
                        }
                        max={99}
                        color="error"
                        sx={{
                          ml: 1,

                          "& .MuiBadge-badge":
                            {
                              position:
                                "relative",

                              transform:
                                "none",

                              right: "auto",

                              top: "auto",

                              fontSize:
                                "0.65rem",

                              minWidth: 20,

                              height: 20,

                              padding:
                                "0 5px",

                              fontWeight: 700,
                            },
                        }}
                      />
                    )}
                </ListItemButton>
              </Link>
            );
          })}
        </List>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <Box sx={{ mt: "auto" }}>
          <Divider
            sx={{
              borderColor:
                "rgba(255,255,255,0.12)",
              mb: 2,
            }}
          />

          <Button
            fullWidth
            onClick={
              handleLogoutClick
            }
            disabled={isLoggingOut}
            startIcon={
              <LogoutOutlinedIcon />
            }
            sx={{
              justifyContent:
                "flex-start",

              px: 1.5,
              py: 1.2,

              borderRadius: 2,

              color: "#FFFDF7",

              textTransform: "none",

              "&:hover": {
                backgroundColor:
                  "rgba(255,255,255,0.08)",
              },

              "&.Mui-disabled": {
                color: "#FFFDF7",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <Box
        component="main"
        sx={{
          flex: 1,

          ml: {
            xs: 0,
            md: "250px",
          },

          width: {
            xs: "100%",
            md: "calc(100% - 250px)",
          },

          minWidth: 0,
        }}
      >
        {children}
      </Box>

      {/* =================================================
          LOGOUT CONFIRMATION
      ================================================= */}

      <Dialog
        open={logoutDialogOpen}
        onClose={
          handleCloseLogoutDialog
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
          Logout
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "text.secondary",
              lineHeight: 1.7,
            }}
          >
            Are you sure you want to
            logout?
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
              handleCloseLogoutDialog
            }
            disabled={isLoggingOut}
            sx={{
              color: "#5C3A21",
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={
              handleConfirmLogout
            }
            variant="contained"
            disabled={isLoggingOut}
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
                color: "#FFFDF7",

                background:
                  "rgba(92,58,33,0.35)",
              },
            }}
          >
            {isLoggingOut ? (
              <InfinityLoop />
            ) : (
              "OK"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================
          FULL SCREEN LOGOUT LOADER
      ================================================= */}

      {isLoggingOut && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,

            zIndex: 9999,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            backgroundColor:
              "rgba(248,242,231,0.72)",

            backdropFilter:
              "blur(6px)",

            WebkitBackdropFilter:
              "blur(6px)",
          }}
        >
          <InfinityLoop className="h-16 w-20" />
        </Box>
      )}
    </Box>
  );
}