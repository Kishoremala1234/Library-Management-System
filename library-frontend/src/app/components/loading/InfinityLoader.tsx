"use client";

import { Box } from "@mui/material";
import { InfinityLoop } from "@/components/infinity";


export default function InfinityLoader() {
    return (
        <Box
            sx={{
                position: "fixed !important",
                top: "0 !important",
                left: "0 !important",
                width: "100vw !important",
                height: "100vh !important",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                zIndex: 999999,

                backgroundColor:
                    "rgba(248, 242, 231, 0.65)",

                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
            }}
        >
            <InfinityLoop className="h-16 w-20" />
        </Box>
    );
}