"use client";

import Link from "next/link";
import { Box, Typography } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export default function Header() {
  return (
    <Box
      component="header"
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 10,
        px: { xs: 5, md: 8 },
        py: 3,
        color: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <MenuBookIcon sx={{ fontSize: 28 }} />

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "1.2rem",
              letterSpacing: "0.08em",
            }}
          >
            Library
          </Typography>
        </Box>

        {/* Navigation */}
        <Box
          component="nav"
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 5,
          }}
        >
          <Typography
            component={Link}
            href="/"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontSize: "0.95rem",
              "&:hover": {
                opacity: 0.65,
              },
            }}
          >
            Home
          </Typography>

          <Typography
            component={Link}
            href="/#books"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontSize: "0.95rem",
              "&:hover": {
                opacity: 0.65,
              },
            }}
          >
            Books
          </Typography>

          <Typography
            component={Link}
            href="/#categories"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontSize: "0.95rem",
              "&:hover": {
                opacity: 0.65,
              },
            }}
          >
            Categories
          </Typography>
        </Box>

        {/* Authentication */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Typography
            component={Link}
            href="/login"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontSize: "0.95rem",
              "&:hover": {
                opacity: 0.65,
              },
            }}
          >
            Login
          </Typography>

          <Typography
            component={Link}
            href="/signup"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontSize: "0.95rem",
              "&:hover": {
                opacity: 0.65,
              },
            }}
          >
            Sign Up
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
