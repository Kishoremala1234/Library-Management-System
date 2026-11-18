"use client";

import {
    FormEvent,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Box,
    Fab,
    IconButton,
    Paper,
    TextField,
    Typography,
} from "@mui/material";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import MessageIcon from "@mui/icons-material/Message";

interface ChatMessage {
    id: number;
    text: string;
    sender: "bot" | "user";
}

export default function UserChatbot() {
    // =========================================================
    // CHATBOT OPEN / CLOSE STATE
    // =========================================================

    const [open, setOpen] = useState(false);

    const [message, setMessage] = useState("");

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            text: "Hi! 👋 I'm your Library Assistant. Ask me about a book, author, category, or topic.",
            sender: "bot",
        },
    ]);

    const [loading, setLoading] = useState(false);

    const [showScrollButton, setShowScrollButton] =
        useState(false);

    const messagesContainerRef =
        useRef<HTMLDivElement | null>(null);

    const messagesEndRef =
        useRef<HTMLDivElement | null>(null);

    // =========================================================
    // CHATBOT EVENTS
    // =========================================================
    // Ask AI button from dashboard sends:
    // "open-library-chatbot"
    //
    // We ONLY open the chatbot here.
    // The floating button itself handles open/close.
    // =========================================================

    useEffect(() => {
        const handleOpenChatbot = () => {
            setOpen(true);
        };

        window.addEventListener(
            "open-library-chatbot",
            handleOpenChatbot
        );

        return () => {
            window.removeEventListener(
                "open-library-chatbot",
                handleOpenChatbot
            );
        };
    }, []);

    // =========================================================
    // CHECK WHETHER USER IS AT THE BOTTOM
    // =========================================================

    const handleScroll = () => {
        const container =
            messagesContainerRef.current;

        if (!container) {
            return;
        }

        const distanceFromBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;

        setShowScrollButton(
            distanceFromBottom > 80
        );
    };

    // =========================================================
    // AUTO SCROLL TO LATEST MESSAGE
    // =========================================================

    useEffect(() => {
        if (!open) {
            return;
        }

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages, loading, open]);

    // =========================================================
    // SCROLL TO BOTTOM
    // =========================================================

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });

        setShowScrollButton(false);
    };

    // =========================================================
    // FLOATING BUTTON
    // =========================================================
    // CLOSED → Open chatbot
    // OPEN   → Close chatbot
    // =========================================================

    const toggleChatbot = () => {
        setOpen((previous) => !previous);
    };

    // =========================================================
    // HEADER X CLOSE BUTTON
    // =========================================================
    // This uses the SAME open state as the floating button.
    //
    // So:
    //
    // Header X clicked
    //       ↓
    // Popup closes
    //       ↓
    // Floating icon becomes 📖
    // =========================================================

    const closeChatbot = () => {
        setOpen(false);
    };

    // =========================================================
    // SEND MESSAGE
    // =========================================================

    const handleSend = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        const trimmedMessage =
            message.trim();

        if (!trimmedMessage || loading) {
            return;
        }

        const userMessage: ChatMessage = {
            id: Date.now(),
            text: trimmedMessage,
            sender: "user",
        };

        setMessages((previous) => [
            ...previous,
            userMessage,
        ]);

        setMessage("");
        setLoading(true);

        try {
            const token =
                sessionStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                "http://localhost:5011/api/User/chatbot",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        message:
                            trimmedMessage,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to process your request."
                );
            }

            const botMessage: ChatMessage = {
                id: Date.now() + 1,
                text:
                    data?.response ||
                    "Sorry, I couldn't find an answer.",
                sender: "bot",
            };

            setMessages((previous) => [
                ...previous,
                botMessage,
            ]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                text:
                    error instanceof Error
                        ? error.message
                        : "Something went wrong. Please try again.",
                sender: "bot",
            };

            setMessages((previous) => [
                ...previous,
                errorMessage,
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* =================================================
                CHAT WINDOW
            ================================================= */}

            {open && (
                <Paper
                    elevation={10}
                    sx={{
                        position: "fixed",

                        right: {
                            xs: 16,
                            sm: 28,
                        },

                        bottom: {
                            xs: 86,
                            sm: 95,
                        },

                        width: {
                            xs: "calc(100vw - 32px)",
                            sm: 380,
                        },

                        height: 540,

                        maxHeight:
                            "calc(100vh - 120px)",

                        borderRadius: 4,

                        overflow: "hidden",

                        display: "flex",

                        flexDirection:
                            "column",

                        zIndex: 1400,

                        border:
                            "1px solid rgba(184, 134, 11, 0.25)",
                    }}
                >
                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <Box
                        sx={{
                            px: 2,
                            py: 1.8,

                            background:
                                "linear-gradient(135deg, #3E2616, #6D3A32)",

                            color: "#FFFDF7",

                            display: "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "space-between",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems:
                                    "center",
                                gap: 1.2,
                            }}
                        >
                            <MessageIcon />

                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily:
                                            "Poppins, sans-serif",

                                        fontWeight:
                                            600,

                                        fontSize: 16,
                                    }}
                                >
                                    Library Assistant
                                </Typography>

                                <Typography
                                    sx={{
                                        fontFamily:
                                            "Poppins, sans-serif",

                                        fontSize: 11,

                                        opacity: 0.8,
                                    }}
                                >
                                    Ask me about books
                                </Typography>
                            </Box>
                        </Box>

                        {/* =================================================
                            HEADER CLOSE X
                        ================================================= */}

                        <IconButton
                            onClick={closeChatbot}
                            aria-label="Close chatbot"
                            sx={{
                                color:
                                    "#FFFDF7",

                                width: 40,
                                height: 40,

                                "&:hover": {
                                    backgroundColor:
                                        "rgba(255,255,255,0.12)",
                                },
                            }}
                        >
                            <CloseOutlinedIcon />
                        </IconButton>
                    </Box>

                    {/* =================================================
                        MESSAGES
                    ================================================= */}

                    <Box
                        ref={
                            messagesContainerRef
                        }
                        onScroll={
                            handleScroll
                        }
                        sx={{
                            flex: 1,

                            overflowY:
                                "auto",

                            p: 2,

                            backgroundColor:
                                "#FFFDF7",

                            display: "flex",

                            flexDirection:
                                "column",

                            gap: 1.5,

                            position:
                                "relative",
                        }}
                    >
                        {messages.map(
                            (item) => (
                                <Box
                                    key={
                                        item.id
                                    }
                                    sx={{
                                        display:
                                            "flex",

                                        justifyContent:
                                            item.sender ===
                                                "user"
                                                ? "flex-end"
                                                : "flex-start",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            maxWidth:
                                                "82%",

                                            px: 1.8,

                                            py: 1.2,

                                            borderRadius:
                                                item.sender ===
                                                    "user"
                                                    ? "18px 18px 4px 18px"
                                                    : "18px 18px 18px 4px",

                                            backgroundColor:
                                                item.sender ===
                                                    "user"
                                                    ? "#6D3A32"
                                                    : "#F1E9DC",

                                            color:
                                                item.sender ===
                                                    "user"
                                                    ? "#FFFDF7"
                                                    : "#3E2616",

                                            whiteSpace:
                                                "pre-line",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontFamily:
                                                    "Poppins, sans-serif",

                                                fontSize:
                                                    13,

                                                lineHeight:
                                                    1.6,
                                            }}
                                        >
                                            {
                                                item.text
                                            }
                                        </Typography>
                                    </Box>
                                </Box>
                            )
                        )}

                        {/* =================================================
                            LOADING MESSAGE
                        ================================================= */}

                        {loading && (
                            <Box
                                sx={{
                                    display:
                                        "flex",

                                    justifyContent:
                                        "flex-start",
                                }}
                            >
                                <Box
                                    sx={{
                                        px: 1.8,

                                        py: 1.2,

                                        borderRadius:
                                            "18px 18px 18px 4px",

                                        backgroundColor:
                                            "#F1E9DC",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily:
                                                "Poppins, sans-serif",

                                            fontSize:
                                                13,

                                            color:
                                                "#6D3A32",
                                        }}
                                    >
                                        Searching the library...
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        <div
                            ref={
                                messagesEndRef
                            }
                        />

                        {/* =================================================
                            SCROLL TO BOTTOM
                        ================================================= */}

                        {showScrollButton && (
                            <IconButton
                                onClick={
                                    scrollToBottom
                                }
                                aria-label="Scroll to latest message"
                                sx={{
                                    position:
                                        "sticky",

                                    bottom: 8,

                                    alignSelf:
                                        "center",

                                    width: 38,

                                    height: 38,

                                    backgroundColor:
                                        "#6D3A32",

                                    color:
                                        "#FFFDF7",

                                    boxShadow:
                                        "0 4px 12px rgba(62, 38, 22, 0.3)",

                                    zIndex: 2,

                                    "&:hover": {
                                        backgroundColor:
                                            "#3E2616",
                                    },
                                }}
                            >
                                <KeyboardArrowDownOutlinedIcon />
                            </IconButton>
                        )}
                    </Box>

                    {/* =================================================
                        INPUT
                    ================================================= */}

                    <Box
                        component="form"
                        onSubmit={
                            handleSend
                        }
                        sx={{
                            p: 1.5,

                            borderTop:
                                "1px solid #E5D8C8",

                            backgroundColor:
                                "#FFFFFF",

                            display: "flex",

                            gap: 1,

                            alignItems:
                                "center",
                        }}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            value={
                                message
                            }
                            onChange={(
                                event
                            ) =>
                                setMessage(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="Ask about a book..."
                            disabled={
                                loading
                            }
                            sx={{
                                "& .MuiOutlinedInput-root":
                                    {
                                        borderRadius:
                                            3,

                                        fontFamily:
                                            "Poppins, sans-serif",

                                        fontSize:
                                            13,
                                    },
                            }}
                        />

                        <IconButton
                            type="submit"
                            disabled={
                                !message.trim() ||
                                loading
                            }
                            aria-label="Send message"
                            sx={{
                                width: 42,

                                height: 42,

                                backgroundColor:
                                    "#6D3A32",

                                color:
                                    "#FFFDF7",

                                "&:hover": {
                                    backgroundColor:
                                        "#3E2616",
                                },

                                "&.Mui-disabled":
                                    {
                                        backgroundColor:
                                            "#D8CFC4",

                                        color:
                                            "#FFFFFF",
                                    },
                            }}
                        >
                            <SendOutlinedIcon
                                fontSize="small"
                            />
                        </IconButton>
                    </Box>
                </Paper>
            )}

            {/* =================================================
                FLOATING CHATBOT TOGGLE BUTTON

                CLOSED → 📖
                OPEN   → ✕
            ================================================= */}

            <Fab
                onClick={
                    toggleChatbot
                }
                aria-label={
                    open
                        ? "Close library assistant"
                        : "Open library assistant"
                }
                sx={{
                    position: "fixed",

                    right: {
                        xs: 16,
                        sm: 28,
                    },

                    bottom: {
                        xs: 16,
                        sm: 28,
                    },

                    width: 58,

                    height: 58,

                    background:
                        "linear-gradient(135deg, #5C3A21, #B8860B)",

                    color:
                        "#FFFDF7",

                    boxShadow:
                        "0 6px 20px rgba(62, 38, 22, 0.28)",

                    zIndex: 1400,

                    "&:hover": {
                        background:
                            "linear-gradient(135deg, #3E2616, #8A6545)",

                        transform:
                            "translateY(-2px)",
                    },

                    transition:
                        "transform 0.2s ease",
                }}
            >
                {open ? (
                    <CloseOutlinedIcon
                        sx={{
                            fontSize: 27,
                        }}
                    />
                ) : (
                    <MessageIcon
                        sx={{
                            fontSize: 27,
                        }}
                    />
                )}
            </Fab>
        </>
    );
}
