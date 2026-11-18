import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#5C3A21",
      dark: "#3E2616",
      light: "#806044",
    },

    secondary: {
      main: "#B8860B",
      dark: "#8B6508",
      light: "#D4AF37",
    },

    background: {
      default: "#F6F0E4",
      paper: "#FFFDF7",
    },

    text: {
      primary: "#2F241C",
      secondary: "#6B5A4A",
    },
  },

  typography: {
    fontFamily: "var(--font-poppins), sans-serif",
  },

  shape: {
    borderRadius: 10,
  },
});

export default theme;