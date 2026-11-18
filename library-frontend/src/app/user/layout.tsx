"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

import { InfinityLoop } from "@/components/infinity";

import {
    Box,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Chip,
} from "@mui/material";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";

import LogoutFeedbackDialog from "../components/LogoutFeedbackDialog";
import UserChatbot from "../components/UserChatbot";

type UnreadCountResponse = {
    count?: number;
    message?: string;
};

export default function UserLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const pathname = usePathname();

    const sidebarNavRef =
        useRef<HTMLUListElement | null>(null);

    const [unreadCount, setUnreadCount] =
        useState(0);

    const [isLoggingOut, setIsLoggingOut] =
        useState(false);

    const [feedbackDialogOpen, setFeedbackDialogOpen] =
        useState(false);

    /*
     * =========================
     * AUTHENTICATION
     * =========================
     */

    useEffect(() => {
        const token =
            sessionStorage.getItem(
                "accessToken"
            );

        if (!token) {
            router.replace("/login");
            return;
        }

        fetch(
            "http://localhost:5011/api/Auth/me",
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },
            }
        )
            .then((response) => {
                if (!response.ok) {
                    sessionStorage.removeItem(
                        "accessToken"
                    );

                    router.replace("/login");
                }
            })
            .catch(() => {
                sessionStorage.removeItem(
                    "accessToken"
                );

                router.replace("/login");
            });
    }, [router]);

    /*
 * =========================
 * SIDEBAR SCROLL POSITION
 * =========================
 */

    /*
 * =========================
 * SIDEBAR SCROLL POSITION
 * =========================
 */

    useEffect(() => {
        const sidebar = sidebarNavRef.current;

        if (!sidebar) {
            return;
        }

        const targetScroll =
            pathname === "/user/profile"
                ? sidebar.scrollHeight
                : pathname === "/user"
                    ? 0
                    : sidebar.scrollTop;

        const startScroll =
            sidebar.scrollTop;

        const distance =
            targetScroll - startScroll;

        if (distance === 0) {
            return;
        }

        const duration = 700;
        let startTime: number | null = null;

        const animateScroll = (
            currentTime: number
        ) => {
            if (startTime === null) {
                startTime = currentTime;
            }

            const elapsed =
                currentTime - startTime;

            const progress = Math.min(
                elapsed / duration,
                1
            );

            /*
             * Ease-in-out
             * for a smoother transition.
             */
            const easedProgress =
                progress < 0.5
                    ? 2 * progress * progress
                    : 1 -
                    Math.pow(
                        -2 * progress + 2,
                        2
                    ) / 2;

            sidebar.scrollTop =
                startScroll +
                distance * easedProgress;

            if (progress < 1) {
                window.requestAnimationFrame(
                    animateScroll
                );
            }
        };

        window.requestAnimationFrame(
            animateScroll
        );
    }, [pathname]);

    /*
     * =========================
     * LOAD UNREAD COUNT
     * =========================
     */

    useEffect(() => {
        let cancelled = false;

        const loadUnreadCount =
            async () => {
                const token =
                    sessionStorage.getItem(
                        "accessToken"
                    );

                if (
                    !token ||
                    isLoggingOut
                ) {
                    return;
                }

                try {
                    const response =
                        await fetch(
                            "http://localhost:5011/api/User/notifications/unread-count",
                            {
                                method: "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,
                                },

                                cache: "no-store",
                            }
                        );

                    /*
                     * =========================
                     * AUTH ERROR
                     * =========================
                     */

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

                    /*
                     * =========================
                     * READ RESPONSE SAFELY
                     * =========================
                     */

                    const text =
                        await response.text();

                    let result: UnreadCountResponse =
                        {};

                    if (
                        text.trim()
                    ) {
                        try {
                            result =
                                JSON.parse(
                                    text
                                ) as UnreadCountResponse;
                        } catch {
                            result = {};
                        }
                    }

                    /*
                     * =========================
                     * API ERROR
                     * =========================
                     */

                    if (
                        !response.ok
                    ) {
                        console.error(
                            "Unread count API failed:",
                            response.status
                        );

                        return;
                    }

                    /*
                     * =========================
                     * UPDATE COUNT
                     * =========================
                     */

                    if (
                        !cancelled
                    ) {
                        setUnreadCount(
                            Number(
                                result.count
                            ) || 0
                        );
                    }
                } catch (error) {
                    if (
                        !cancelled
                    ) {
                        console.error(
                            "Unread notification count error:",
                            error
                        );
                    }
                }
            };

        /*
         * =========================
         * NOTIFICATION UPDATE EVENT
         * =========================
         */

        const handleNotificationUpdate =
            () => {
                loadUnreadCount();
            };

        window.addEventListener(
            "notificationsUpdated",
            handleNotificationUpdate
        );

        /*
         * =========================
         * INITIAL LOAD
         * =========================
         */

        const timer =
            window.setTimeout(() => {
                loadUnreadCount();
            }, 0);

        /*
         * =========================
         * CLEANUP
         * =========================
         */

        return () => {
            cancelled = true;

            window.clearTimeout(
                timer
            );

            window.removeEventListener(
                "notificationsUpdated",
                handleNotificationUpdate
            );
        };
    }, [
        router,
        isLoggingOut,
    ]);

    /*
     * =========================
     * LOGOUT
     * =========================
     */

    const handleLogout = () => {
        if (isLoggingOut) {
            return;
        }

        setFeedbackDialogOpen(true);
    };

    /*
     * =========================
     * FINAL LOGOUT
     * =========================
     */

    const handleFinalLogout =
        async () => {
            if (isLoggingOut) {
                return;
            }

            setFeedbackDialogOpen(
                false
            );

            setIsLoggingOut(true);

            sessionStorage.removeItem(
                "accessToken"
            );

            await new Promise<void>(
                (resolve) => {
                    window.setTimeout(
                        resolve,
                        1500
                    );
                }
            );

            router.replace("/");
        };

    /*
     * =========================
     * CLOSE FEEDBACK DIALOG
     * =========================
     */

    const handleFeedbackDialogClose =
        () => {
            if (isLoggingOut) {
                return;
            }

            setFeedbackDialogOpen(
                false
            );
        };

    /*
     * =========================
     * ACTIVE MENU
     * =========================
     */

    const isActive = (
        path: string
    ) => {
        return pathname === path;
    };

    return (
        <>
            {/* =========================
                MAIN APPLICATION
            ========================= */}

            <Box
                suppressHydrationWarning
                sx={{
                    minHeight:
                        "100vh",

                    display: "flex",

                    background:
                        "linear-gradient(135deg, #F8F2E7 0%, #E8D8BE 100%)",
                }}
            >
                {/* =========================
                    SIDEBAR
                ========================= */}

                <Box
                    component="aside"
                    sx={{
                        width: 250,

                        flexShrink: 0,

                        height: "100vh",

                        position:
                            "fixed",

                        left: 0,
                        top: 0,
                        bottom: 0,

                        display: {
                            xs: "none",
                            md: "flex",
                        },

                        flexDirection:
                            "column",

                        /*
                         * Sidebar itself
                         * does NOT scroll.
                         */
                        overflow:
                            "hidden",

                        background:
                            "linear-gradient(180deg, #3E2616 0%, #5C3A21 55%, #6D3A32 100%)",

                        color: "#FFFDF7",
                    }}
                >
                    {/* =========================
                        LOGO
                    ========================= */}

                    <Box
                        sx={{
                            px: 3,
                            py: 3,

                            flexShrink: 0,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize:
                                    "1.15rem",

                                fontWeight: 600,

                                letterSpacing:
                                    "0.12em",
                            }}
                        >
                            LIBRARY
                        </Typography>

                        <Typography
                            sx={{
                                fontSize:
                                    "0.7rem",

                                opacity: 0.6,

                                mt: 0.5,
                            }}
                        >
                            MEMBER AREA
                        </Typography>
                    </Box>

                    <Divider
                        sx={{
                            borderColor:
                                "rgba(255,255,255,0.12)",

                            flexShrink: 0,
                        }}
                    />

                    {/* =========================
                        SCROLLABLE NAVIGATION
                    ========================= */}

                    <List
                        ref={sidebarNavRef}
                        sx={{
                            px: 1.5,
                            py: 2,

                            flex: 1,

                            minHeight: 0,

                            overflowY:
                                "auto",

                            /*
                             * Scrollbar
                             */

                            "&::-webkit-scrollbar":
                            {
                                width: 5,
                            },

                            "&::-webkit-scrollbar-track":
                            {
                                background:
                                    "transparent",
                            },

                            "&::-webkit-scrollbar-thumb":
                            {
                                backgroundColor:
                                    "rgba(255,255,255,0.2)",

                                borderRadius:
                                    10,
                            },

                            "&::-webkit-scrollbar-thumb:hover":
                            {
                                backgroundColor:
                                    "rgba(255,255,255,0.3)",
                            },
                        }}
                    >
                        {/* =========================
                            DASHBOARD
                        ========================= */}

                        <ListItemButton
                            component={
                                Link
                            }
                            href="/user"
                            sx={menuItemStyle(
                                isActive(
                                    "/user"
                                )
                            )}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <DashboardOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="Dashboard"
                            />
                        </ListItemButton>

                        {/* =========================
                            BROWSE BOOKS
                        ========================= */}

                        <ListItemButton
                            component={
                                Link
                            }
                            href="/user/browse-books"
                            sx={menuItemStyle(
                                isActive(
                                    "/user/browse-books"
                                )
                            )}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <MenuBookOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="Browse Books"
                            />
                        </ListItemButton>

                        {/* =========================
                            BORROWED BOOKS
                        ========================= */}

                        <ListItemButton
                            component={
                                Link
                            }
                            href="/user/borrowed"
                            sx={menuItemStyle(
                                isActive(
                                    "/user/borrowed"
                                )
                            )}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <MenuBookOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="Borrowed Books"
                            />
                        </ListItemButton>

                        {/* =========================
                            DUE BOOKS
                        ========================= */}

                        <ListItemButton
                            component={
                                Link
                            }
                            href="/user/due-books"
                            sx={menuItemStyle(
                                isActive(
                                    "/user/due-books"
                                )
                            )}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <EventOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="Due Books"
                            />
                        </ListItemButton>

                        {/* =========================
                            NOTIFICATIONS
                        ========================= */}

                        <ListItemButton
                            component={
                                Link
                            }
                            href="/user/notifications"
                            sx={menuItemStyle(
                                isActive(
                                    "/user/notifications"
                                )
                            )}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <NotificationsNoneOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="Notifications"
                            />

                            {unreadCount >
                                0 && (
                                    <Chip
                                        label={
                                            unreadCount
                                        }
                                        size="small"
                                        sx={{
                                            height: 22,

                                            minWidth: 22,

                                            px: 0.5,

                                            backgroundColor:
                                                "#B8860B",

                                            color:
                                                "#FFFDF7",

                                            fontSize:
                                                "0.65rem",

                                            fontWeight: 700,

                                            "& .MuiChip-label":
                                            {
                                                px: 0.8,
                                            },
                                        }}
                                    />
                                )}
                        </ListItemButton>

                        {/* =========================
                            PAYMENT / WALLET
                        ========================= */}

                        <ListItemButton
                            component={
                                Link
                            }
                            href="/user/wallet"
                            sx={menuItemStyle(
                                isActive(
                                    "/user/wallet"
                                )
                            )}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <AccountBalanceWalletOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="Payment"
                            />
                        </ListItemButton>

                        {/* =========================
                            HISTORY
                        ========================= */}

                        <ListItemButton
                            component={
                                Link
                            }
                            href="/user/history"
                            sx={menuItemStyle(
                                isActive(
                                    "/user/history"
                                )
                            )}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <HistoryOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="History"
                            />
                        </ListItemButton>

                        {/* =========================
                            PROFILE
                        ========================= */}

                        <ListItemButton
                            component={
                                Link
                            }
                            href="/user/profile"
                            sx={menuItemStyle(
                                isActive(
                                    "/user/profile"
                                )
                            )}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <PersonOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="Profile"
                            />
                        </ListItemButton>
                    </List>

                    {/* =========================
                        FIXED LOGOUT
                    ========================= */}

                    <Box
                        sx={{
                            p: 1.5,

                            flexShrink: 0,

                            background:
                                "rgba(62,38,22,0.18)",
                        }}
                    >
                        <ListItemButton
                            disabled={
                                isLoggingOut
                            }
                            onClick={
                                handleLogout
                            }
                            sx={{
                                borderRadius: 2,

                                color:
                                    "rgba(255,255,255,0.75)",

                                "&:hover":
                                {
                                    backgroundColor:
                                        "rgba(255,255,255,0.08)",

                                    color:
                                        "#FFFDF7",
                                },

                                "&.Mui-disabled":
                                {
                                    color:
                                        "rgba(255,255,255,0.55)",
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={
                                    iconStyle
                                }
                            >
                                <LogoutOutlinedIcon />
                            </ListItemIcon>

                            <ListItemText
                                primary="Logout"
                            />
                        </ListItemButton>
                    </Box>
                </Box>

                {/* =========================
                    MAIN CONTENT
                ========================= */}

                <Box
                    sx={{
                        width: "100%",

                        minWidth: 0,

                        ml: {
                            xs: 0,
                            md: "250px",
                        },
                    }}
                >
                    {children}
                </Box>
            </Box>

            {/* <UserChatbot /> */}

            {/* =========================
                LOGOUT FEEDBACK DIALOG
            ========================= */}

            <LogoutFeedbackDialog
                open={
                    feedbackDialogOpen
                }
                onClose={
                    handleFeedbackDialogClose
                }
                onLogout={
                    handleFinalLogout
                }
            />

            {/* =========================
                CUSTOM LOGOUT LOADER
            ========================= */}

            {isLoggingOut && (
                <Box
                    sx={{
                        position:
                            "fixed",

                        inset: 0,

                        width: "100vw",

                        height: "100vh",

                        zIndex: 999999,

                        display: "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",

                        backgroundColor:
                            "rgba(248, 242, 231, 0.72)",

                        backdropFilter:
                            "blur(6px)",

                        WebkitBackdropFilter:
                            "blur(6px)",
                    }}
                >
                    <InfinityLoop
                        className="h-16 w-20"
                    />
                </Box>
            )}
        </>
    );
}

/*
 * =========================
 * SIDEBAR MENU STYLE
 * =========================
 */

const menuItemStyle = (
    active: boolean
) => ({
    color: "#FFFDF7",

    borderRadius: 2,

    mb: 0.7,

    backgroundColor: active
        ? "rgba(255,255,255,0.14)"
        : "transparent",

    boxShadow: active
        ? "0 4px 12px rgba(0,0,0,0.12)"
        : "none",

    "&:hover": {
        backgroundColor:
            "rgba(255,255,255,0.08)",
    },
});

/*
 * =========================
 * SIDEBAR ICON STYLE
 * =========================
 */

const iconStyle = {
    minWidth: 38,

    color: "inherit",
};