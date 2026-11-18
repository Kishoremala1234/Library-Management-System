"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";

import {
  Box,
  Button,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Rating,
  Tabs,
  Tab,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";

const tabCategories = [
  "Fiction",
  "Self Development",
  "Business",
  "Technology",
];

const tabBooks = [
  // =====================================================
  // FICTION
  // =====================================================
  [
    {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      image: "/books/great_gatsby.jpg",
      description:
        "A classic story of ambition, wealth, love, and the pursuit of an impossible dream.",
      rating: 4.5,
    },
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      image: "/books/pride_and_prejudice.jpg",
      description:
        "A classic novel about relationships, social expectations, misunderstandings, and love.",
      rating: 4.6,
    },
    {
      title: "The Alchemist",
      author: "Paulo Coelho",
      image: "/books/the_alchemist.jpg",
      description:
        "A timeless story about dreams, purpose, courage, and following your own journey.",
      rating: 4.7,
    },
    {
      title: "The Book Thief",
      author: "Markus Zusak",
      image: "/books/The_book_thief.webp",
      description:
        "A powerful story of a young girl discovering the beauty and danger of words during wartime.",
      rating: 4.7,
    },
  ],

  // =====================================================
  // SELF DEVELOPMENT
  // =====================================================
  [
    {
      title: "Atomic Habits",
      author: "James Clear",
      image: "/books/atomic_habit.jpg",
      description:
        "A practical guide to building good habits and making small changes that create lasting results.",
      rating: 4.8,
    },
    {
      title: "Deep Work",
      author: "Cal Newport",
      image: "/books/deep_work.jpg",
      description:
        "A practical approach to improving concentration and producing meaningful work.",
      rating: 4.6,
    },
    {
      title: "The Power of Habit",
      author: "Charles Duhigg",
      image: "/books/power_of_habit.jpg",
      description:
        "An exploration of how habits work and how they can be changed.",
      rating: 4.5,
    },
    {
      title: "Think and Grow Rich",
      author: "Napoleon Hill",
      image: "/books/think_grow_rich.jpg",
      description:
        "A classic work focused on goals, mindset, persistence, and achievement.",
      rating: 4.5,
    },
  ],

  // =====================================================
  // BUSINESS
  // =====================================================
  [
    {
      title: "Good to Great",
      author: "Jim Collins",
      image: "/books/good_to_great.webp",
      description:
        "Research-based ideas about leadership, discipline, and building enduring organizations.",
      rating: 4.5,
    },
    {
      title: "The Hard Thing About Hard Things",
      author: "Ben Horowitz",
      image: "/books/hard_thing.webp",
      description:
        "Practical lessons on making difficult decisions and managing challenges while building a company.",
      rating: 4.4,
    },
    {
      title: "The Lean Startup",
      author: "Eric Ries",
      image: "/books/lean_startup.jpg",
      description:
        "A framework for building businesses through experimentation, feedback, and continuous learning.",
      rating: 4.5,
    },
    {
      title: "Zero to One",
      author: "Peter Thiel",
      image: "/books/zero_to_one.jpg",
      description:
        "Ideas about innovation, startups, competition, and creating something fundamentally new.",
      rating: 4.5,
    },
  ],

  // =====================================================
  // TECHNOLOGY
  // =====================================================
  [
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      image: "/books/clean_code.jpg",
      description:
        "Practical principles for writing readable, maintainable, and reliable software.",
      rating: 4.7,
    },
    {
      title: "Computer Networking",
      author: "James Kurose",
      image: "/books/computer_networking.jpg",
      description:
        "An introduction to modern computer networking concepts and technologies.",
      rating: 4.5,
    },
    {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      image: "/books/ddia.jpg",
      description:
        "A detailed look at reliable, scalable, and maintainable data systems.",
      rating: 4.8,
    },
    {
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      image: "/books/pragmatic_programmer.jpg",
      description:
        "Practical techniques and principles for becoming a better software developer.",
      rating: 4.7,
    },
  ],
];

type HomeBookSearch = {
  bookId: string;
  title: string;
  author: string;
  coverImage: string | null;
  categoryName: string;
  availableCopies: number;
  availabilityStatus: string;
};

export default function Home() {
  const [selectedTab, setSelectedTab] = useState(0);

  const displayedBooks = tabBooks[selectedTab];

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] =
    useState<HomeBookSearch[]>([]);
  const [searchLoading, setSearchLoading] =
    useState(false);

  useEffect(() => {
    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const response = await fetch(
          `http://localhost:5011/api/Books/search?query=${encodeURIComponent(
            trimmedSearch
          )}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
            "Failed to search books."
          );
        }

        setSearchResults(result);
      } catch (error) {
        console.error(
          "Home book search error:",
          error
        );

        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Box
      component="main"
      sx={{
        width: "100%",
        overflowX: "hidden",
        scrollBehavior: "smooth",
      }}
    >
      {/* =======================================================
          HERO SECTION
      ======================================================= */}

      <Box
        component="section"
        sx={{
          height: "100svh",
          minHeight: 650,
          position: "relative",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          textAlign: "center",
          overflow: "hidden",

          background: `
            radial-gradient(
              circle at 20% 20%,
              rgba(212, 175, 55, 0.18),
              transparent 30%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(92, 58, 33, 0.22),
              transparent 35%
            ),
            linear-gradient(
              135deg,
              #3E2616 0%,
              #5C3A21 35%,
              #6D3A32 65%,
              #B49A72 100%
            )
          `,

          color: "#FFFDF7",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 850,
            px: { xs: 2.5, sm: 4, md: 3 },
          }}
        >
          <Typography
            sx={{
              fontSize: {
                xs: "2.5rem",
                sm: "3.8rem",
                md: "5.5rem",
              },

              lineHeight: 1.08,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              mb: { xs: 2, md: 3 },
            }}
          >
            Where Stories
            <br />
            Never End
          </Typography>

          <Typography
            sx={{
              maxWidth: 650,
              mx: "auto",

              fontSize: {
                xs: "0.9rem",
                sm: "1rem",
                md: "1.15rem",
              },

              lineHeight: 1.8,
              opacity: 0.85,
              mb: { xs: 3, md: 4 },
            }}
          >
            Discover timeless stories, explore new ideas, and find your next
            unforgettable read.
          </Typography>

          <Button
            component={Link}
            href="/login"
            sx={{
              color: "#FFFDF7",
              borderBottom:
                "1px solid rgba(255,255,255,0.7)",
              borderRadius: 0,
              px: 0,
              py: 1,

              fontSize: {
                xs: "0.8rem",
                md: "0.95rem",
              },

              "&:hover": {
                background: "transparent",
                borderBottomColor: "#FFFDF7",
              },
            }}
          >
            Explore the Collection →
          </Button>
        </Box>

        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 20, md: 30 },
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.7,
              mb: 1,
            }}
          >
            Scroll
          </Typography>

          <Box
            sx={{
              width: 1,
              height: { xs: 30, md: 45 },
              mx: "auto",

              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)",
            }}
          />
        </Box>
      </Box>

      {/* =======================================================
          SECOND SECTION - BOOKS
      ======================================================= */}

      <Box
        component="section"
        id="books"
        sx={{
          minHeight: "100svh",
          height: "auto",
          display: "flex",
          alignItems: "center",

          px: {
            xs: 2,
            sm: 3,
            md: 5,
          },

          py: {
            xs: 8,
            sm: 10,
            md: 12,
          },

          background: `
            linear-gradient(
              to bottom,
              #B49A72 0%,
              #D8C4A2 25%,
              #F1E6D4 60%,
              #F8F2E7 100%
            )
          `,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1400,
            mx: "auto",
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              mb: {
                xs: 4,
                sm: 5,
                md: 6,
              },
            }}
          >
            <Typography
              sx={{
                color: "secondary.dark",

                fontSize: {
                  xs: "0.65rem",
                  sm: "0.7rem",
                  md: "0.75rem",
                },

                letterSpacing: "0.25em",
                fontWeight: 600,
                mb: 1,
              }}
            >
              GLOBAL FAVORITES
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: "1.8rem",
                  sm: "2.4rem",
                  md: "3.2rem",
                },

                lineHeight: 1.15,
                fontWeight: 600,
                color: "text.primary",
                mb: 1.5,
              }}
            >
              Most Loved Around the World
            </Typography>

            <Typography
              sx={{
                maxWidth: 600,
                mx: "auto",

                fontSize: {
                  xs: "0.75rem",
                  sm: "0.85rem",
                  md: "0.95rem",
                },

                lineHeight: 1.6,
                color: "text.secondary",
              }}
            >
              Discover stories that readers everywhere continue to enjoy.
            </Typography>

            <Tabs
              value={selectedTab}
              onChange={(_, newValue) =>
                setSelectedTab(newValue)
              }
              centered
              sx={{
                mt: 3,
                mb: 4,

                "& .MuiTabs-flexContainer": {
                  justifyContent: "center",
                },

                "& .MuiTabs-indicator": {
                  backgroundColor:
                    "secondary.main",
                  height: 2,
                },

                "& .MuiTab-root": {
                  color: "text.secondary",
                  fontFamily:
                    "var(--font-poppins), sans-serif",
                  fontWeight: 500,
                  textTransform: "none",
                  minWidth: "auto",
                  px: {
                    xs: 1.5,
                    sm: 2.5,
                    md: 3,
                  },
                },

                "& .Mui-selected": {
                  color: "primary.main",
                  fontWeight: 600,
                },
              }}
            >
              {tabCategories.map(
                (category) => (
                  <Tab
                    key={category}
                    label={category}
                  />
                )
              )}
            </Tabs>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {displayedBooks.map((book) => (
              <Card
                key={book.title}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2.5,
                  overflow: "hidden",
                  backgroundColor:
                    "rgba(255, 253, 247, 0.95)",
                  boxShadow:
                    "0 8px 25px rgba(62, 38, 22, 0.12)",
                  transition:
                    "transform 0.3s ease, box-shadow 0.3s ease",

                  "&:hover": {
                    transform:
                      "translateY(-6px)",
                    boxShadow:
                      "0 16px 35px rgba(62, 38, 22, 0.18)",
                  },
                }}
              >
                <CardMedia
                  component="img"
                  image={book.image}
                  alt={`${book.title} book cover`}
                  sx={{
                    width: "100%",
                    height: {
                      xs: 260,
                      sm: 280,
                      md: 300,
                    },
                    objectFit: "contain",
                    objectPosition: "center",
                    backgroundColor: "#F8F2E7",
                    p: 2,
                  }}
                />

                <CardContent
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: {
                      xs: 2,
                      md: 2.2,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: {
                        xs: "0.95rem",
                        md: "1.05rem",
                      },
                      lineHeight: 1.4,
                      mb: 0.5,
                    }}
                  >
                    {book.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: {
                        xs: "0.72rem",
                        md: "0.78rem",
                      },
                      color:
                        "text.secondary",
                      mb: 1.2,
                    }}
                  >
                    {book.author}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: {
                        xs: "0.72rem",
                        md: "0.78rem",
                      },
                      color:
                        "text.secondary",
                      lineHeight: 1.6,
                      mb: 1.5,
                      display:
                        "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient:
                        "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {book.description}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 1,
                      mt: "auto",
                    }}
                  >
                    <Rating
                      value={book.rating}
                      precision={0.1}
                      readOnly
                      size="small"
                    />

                    <Typography
                      sx={{
                        fontSize:
                          "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {book.rating}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>

      {/* =======================================================
          THIRD SECTION - CATEGORIES
      ======================================================= */}

      <Box
        component="section"
        id="categories"
        sx={{
          height: {
            xs: "auto",
            md: "100svh",
          },

          minHeight: "100svh",

          display: "flex",
          alignItems: "center",

          px: {
            xs: 2,
            sm: 3,
            md: 5,
          },

          py: {
            xs: 7,
            md: 4,
          },

          background: `
            linear-gradient(
              135deg,
              #D2B48C 0%,
              #E7D8BF 30%,
              #F6EFE2 70%,
              #F8F2E7 100%
            )
          `,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1300,
            mx: "auto",
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              mb: {
                xs: 4,
                md: 5,
              },
            }}
          >
            <Typography
              sx={{
                color:
                  "secondary.dark",
                fontSize:
                  "0.7rem",
                letterSpacing:
                  "0.25em",
                fontWeight: 600,
                mb: 1,
              }}
            >
              EXPLORE THE LIBRARY
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: "2rem",
                  sm: "2.6rem",
                  md: "3.5rem",
                },

                lineHeight: 1.15,
                fontWeight: 600,
                color:
                  "text.primary",
                mb: 1.5,
              }}
            >
              Find Your Next Chapter
            </Typography>

            <Typography
              sx={{
                maxWidth: 650,
                mx: "auto",

                fontSize: {
                  xs: "0.8rem",
                  sm: "0.9rem",
                  md: "1rem",
                },

                lineHeight: 1.7,
                color:
                  "text.secondary",
              }}
            >
              Explore stories, ideas, knowledge and inspiration
              across every corner of our collection.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },

              gap: {
                xs: 2,
                md: 3,
              },
            }}
          >
            {[
              {
                number: "01",
                title: "General",
                description:
                  "A little bit of everything.",
              },
              {
                number: "02",
                title: "Business",
                description:
                  "Ideas, leadership and entrepreneurship.",
              },
              {
                number: "03",
                title: "Money & Finance",
                description:
                  "Money, investing and financial wisdom.",
              },
              {
                number: "04",
                title: "Self Development",
                description:
                  "Grow your skills, mindset and confidence.",
              },
              {
                number: "05",
                title: "Literature",
                description:
                  "Stories, poetry, and timeless works of imagination.",
              },
              {
                number: "06",
                title: "Technology",
                description:
                  "Explore technology and innovation.",
              },
              {
                number: "07",
                title: "History",
                description:
                  "Discover stories from the past.",
              },
              {
                number: "08",
                title: "Fiction",
                description:
                  "Stories that take you somewhere new.",
              },
            ].map((category) => (
              <Box
                key={category.number}
                sx={{
                  position: "relative",

                  minHeight: {
                    xs: 145,
                    sm: 150,
                    md: 155,
                  },

                  p: {
                    xs: 2.5,
                    md: 3,
                  },

                  display: "flex",
                  flexDirection:
                    "column",
                  justifyContent:
                    "space-between",

                  border:
                    "1px solid rgba(92, 58, 33, 0.15)",

                  borderRadius: 3,

                  background:
                    "rgba(255, 253, 247, 0.55)",

                  backdropFilter:
                    "blur(4px)",

                  transition:
                    "transform 0.3s ease, background 0.3s ease",

                  "&:hover": {
                    transform:
                      "translateY(-6px)",
                    background:
                      "rgba(255, 253, 247, 0.85)",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize:
                      "0.7rem",
                    color:
                      "secondary.dark",
                    letterSpacing:
                      "0.15em",
                    fontWeight: 600,
                  }}
                >
                  {category.number}
                </Typography>

                <Box>
                  <Typography
                    sx={{
                      fontSize: {
                        xs: "1rem",
                        md: "1.15rem",
                      },

                      fontWeight: 600,
                      color:
                        "text.primary",
                      mb: 0.5,
                    }}
                  >
                    {category.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: {
                        xs: "0.7rem",
                        md: "0.75rem",
                      },

                      lineHeight: 1.5,
                      color:
                        "text.secondary",
                    }}
                  >
                    {category.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* =======================================================
          FOURTH SECTION - EXPLORE COLLECTION
      ======================================================= */}

      <Box
        component="section"
        sx={{
          minHeight: "100svh",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          px: {
            xs: 2.5,
            sm: 4,
            md: 6,
          },

          py: {
            xs: 8,
            md: 5,
          },

          textAlign: "center",

          background: `
            linear-gradient(
              135deg,
              #F8F2E7 0%,
              #E7D8BF 45%,
              #B8860B 140%
            )
          `,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 900,
            mx: "auto",
          }}
        >
          <Typography
            sx={{
              color: "secondary.dark",
              fontSize: "0.7rem",
              letterSpacing: "0.25em",
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            DISCOVER SOMETHING NEW
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "2.2rem",
                sm: "3rem",
                md: "4.2rem",
              },

              lineHeight: 1.1,
              fontWeight: 600,
              color: "text.primary",
              mb: 2,
            }}
          >
            Find a Book Worth Remembering
          </Typography>

          <Typography
            sx={{
              maxWidth: 650,
              mx: "auto",

              fontSize: {
                xs: "0.8rem",
                sm: "0.9rem",
                md: "1rem",
              },

              lineHeight: 1.8,
              color: "text.secondary",
              mb: 4,
            }}
          >
            Search through stories, ideas, knowledge and imagination
            to find something that speaks to you.
          </Typography>

          <Box
            sx={{
              maxWidth: 700,
              mx: "auto",
              position: "relative",
            }}
          >
            <TextField
              fullWidth
              value={search}
              onChange={(event) => {
                const value = event.target.value;

                setSearch(value);

                if (!value.trim()) {
                  setSearchResults([]);
                  setSearchLoading(false);
                }
              }}
              placeholder="Search books, authors, or ISBN..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon
                        sx={{
                          color: "text.secondary",
                        }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                minWidth: 170,

                "& .MuiOutlinedInput-root":
                {
                  backgroundColor:
                    "#FFFFFF",
                  borderRadius: 3,

                  "& fieldset": {
                    borderColor:
                      "#5C3A21",
                    borderWidth:
                      1.5,
                  },

                  "&:hover fieldset":
                  {
                    borderColor:
                      "#3E2616",
                  },

                  "&.Mui-focused fieldset":
                  {
                    borderColor:
                      "#5C3A21",
                    borderWidth:
                      2,
                  },
                },
              }}
            />

            {search.trim() && (
              <Box
                sx={{
                  position:
                    "absolute",

                  top:
                    "calc(100% + 8px)",

                  left: 0,
                  right: 0,

                  zIndex: 100,

                  backgroundColor:
                    "rgba(255,253,247,0.98)",

                  border:
                    "1px solid rgba(92,58,33,0.10)",

                  borderRadius: 2.5,

                  overflow: "hidden",

                  boxShadow:
                    "0 18px 40px rgba(62,38,22,0.16)",

                  textAlign: "left",
                }}
              >
                {searchLoading ? (
                  <Box sx={{ p: 2 }}>
                    <Typography
                      sx={{
                        fontSize:
                          "0.8rem",
                        color:
                          "text.secondary",
                      }}
                    >
                      Searching books...
                    </Typography>
                  </Box>
                ) : searchResults.length ===
                  0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography
                      sx={{
                        fontSize:
                          "0.8rem",
                        color:
                          "text.secondary",
                      }}
                    >
                      No books found for ~
                      {search}~.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box
                      sx={{
                        maxHeight: 320,
                        overflowY:
                          "auto",

                        "&::-webkit-scrollbar":
                        {
                          width: 6,
                        },

                        "&::-webkit-scrollbar-thumb":
                        {
                          backgroundColor:
                            "rgba(92,58,33,0.25)",
                          borderRadius:
                            10,
                        },
                      }}
                    >
                      {searchResults.map(
                        (
                          book,
                          index
                        ) => (
                          <Box
                            key={
                              book.bookId
                            }
                            sx={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 2,

                              px: 2,
                              py: 1.5,

                              borderBottom:
                                index <
                                  searchResults.length -
                                  1
                                  ? "1px solid rgba(92,58,33,0.08)"
                                  : "none",

                              "&:hover":
                              {
                                backgroundColor:
                                  "rgba(92,58,33,0.04)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 52,
                                flexShrink:
                                  0,

                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",

                                backgroundColor:
                                  "#F8F2E7",

                                borderRadius:
                                  1,

                                overflow:
                                  "hidden",
                              }}
                            >
                              {book.coverImage ? (
                                <Box
                                  component="img"
                                  src={
                                    book.coverImage
                                  }
                                  alt={
                                    book.title
                                  }
                                  sx={{
                                    width:
                                      "100%",
                                    height:
                                      "100%",
                                    objectFit:
                                      "contain",
                                  }}
                                />
                              ) : (
                                <MenuBookOutlinedIcon
                                  sx={{
                                    fontSize:
                                      20,
                                    color:
                                      "secondary.dark",
                                    opacity:
                                      0.5,
                                  }}
                                />
                              )}
                            </Box>

                            <Box
                              sx={{
                                flex: 1,
                                minWidth:
                                  0,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight:
                                    600,
                                  fontSize:
                                    "0.82rem",

                                  whiteSpace:
                                    "nowrap",

                                  overflow:
                                    "hidden",

                                  textOverflow:
                                    "ellipsis",
                                }}
                              >
                                {book.title}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.2,
                                  fontSize:
                                    "0.68rem",
                                  color:
                                    "text.secondary",

                                  whiteSpace:
                                    "nowrap",

                                  overflow:
                                    "hidden",

                                  textOverflow:
                                    "ellipsis",
                                }}
                              >
                                {book.author}
                              </Typography>
                            </Box>

                            <Chip
                              label={
                                book.availabilityStatus
                              }
                              size="small"
                              sx={{
                                flexShrink:
                                  0,

                                backgroundColor:
                                  book.availabilityStatus ===
                                    "Available"
                                    ? "rgba(76,120,75,0.10)"
                                    : book.availabilityStatus ===
                                      "Soon Available"
                                      ? "rgba(184,134,11,0.10)"
                                      : "rgba(180,60,40,0.10)",

                                color:
                                  book.availabilityStatus ===
                                    "Available"
                                    ? "#4C784B"
                                    : book.availabilityStatus ===
                                      "Soon Available"
                                      ? "#8B6508"
                                      : "#B42318",

                                fontSize:
                                  "0.63rem",
                              }}
                            />
                          </Box>
                        )
                      )}
                    </Box>

                    {searchResults.length >
                      4 && (
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            borderTop:
                              "1px solid rgba(92,58,33,0.08)",
                            backgroundColor:
                              "rgba(92,58,33,0.025)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize:
                                "0.65rem",
                              color:
                                "text.secondary",
                              textAlign:
                                "center",
                            }}
                          >
                            {searchResults.length}{" "}
                            matching books ·
                            scroll to see more
                          </Typography>
                        </Box>
                      )}
                  </>
                )}
              </Box>
            )}
          </Box>

          <Button
            component={Link}
            href="/login"
            sx={{
              mt: 4,

              color: "primary.main",

              borderBottom:
                "1px solid rgba(92,58,33,0.5)",

              borderRadius: 0,

              px: 0,
              py: 1,

              fontSize: "0.9rem",

              "&:hover": {
                background:
                  "transparent",
                borderBottomColor:
                  "primary.main",
              },
            }}
          >
            Explore the Full Collection →
          </Button>
        </Box>
      </Box>

      {/* =======================================================
          FINAL SECTION - CTA
      ======================================================= */}

      <Box
        component="section"
        sx={{
          height: {
            xs: "auto",
            md: "100svh",
          },

          minHeight: "100svh",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          px: {
            xs: 2.5,
            sm: 4,
            md: 6,
          },

          py: {
            xs: 8,
            md: 5,
          },

          textAlign: "center",

          color: "#FFFDF7",

          background: `
            radial-gradient(
              circle at 15% 25%,
              rgba(212, 175, 55, 0.18),
              transparent 30%
            ),
            radial-gradient(
              circle at 85% 75%,
              rgba(255, 255, 255, 0.06),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #3E2616 0%,
              #5C3A21 45%,
              #6D3A32 75%,
              #8A6545 100%
            )
          `,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 850,
            mx: "auto",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.7rem",
              letterSpacing: "0.3em",
              fontWeight: 600,
              opacity: 0.75,
              mb: 2,
            }}
          >
            YOUR NEXT CHAPTER
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "2.4rem",
                sm: "3.4rem",
                md: "5rem",
              },

              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              mb: 3,
            }}
          >
            Your Library
            <br />
            Awaits
          </Typography>

          <Typography
            sx={{
              maxWidth: 620,
              mx: "auto",

              fontSize: {
                xs: "0.85rem",
                sm: "0.95rem",
                md: "1.05rem",
              },

              lineHeight: 1.8,
              opacity: 0.8,
              mb: 4,
            }}
          >
            Step into a world of stories, knowledge and imagination.
            Find something new to read and let your next chapter begin.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",

              gap: {
                xs: 2,
                sm: 3,
              },

              flexWrap: "wrap",
            }}
          >
            <Button
              component={Link}
              href="/login"
              sx={{
                color: "#FFFDF7",
                border:
                  "1px solid rgba(255,255,255,0.65)",
                borderRadius: 0,
                px: 3,
                py: 1.3,

                fontSize:
                  "0.85rem",

                "&:hover": {
                  backgroundColor:
                    "rgba(255,255,255,0.08)",
                  borderColor:
                    "#FFFDF7",
                },
              }}
            >
              Explore Books
            </Button>

            <Button
              component={Link}
              href="/signup"
              sx={{
                color: "#3E2616",

                background:
                  "linear-gradient(135deg, #D4AF37, #F0D889)",

                borderRadius: 0,

                px: 3,
                py: 1.3,

                fontSize:
                  "0.85rem",
                fontWeight: 600,

                "&:hover": {
                  background:
                    "linear-gradient(135deg, #F0D889, #D4AF37)",
                },
              }}
            >
              Join the Library
            </Button>
          </Box>

          <Box
            sx={{
              width: 80,
              height: "1px",
              mx: "auto",
              mt: 7,

              background:
                "linear-gradient(to right, transparent, #D4AF37, transparent)",
            }}
          />

          <Typography
            sx={{
              mt: 2,
              fontSize:
                "0.7rem",
              letterSpacing:
                "0.12em",
              opacity: 0.55,
            }}
          >
            READ • DISCOVER • BELONG
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
