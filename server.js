const express = require('express');
const prisma = require('./prismaClient');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Movies API!')
});


app.get('/movies', async (req, res) => {
   const movies = await prisma.movie.findMany();
   res.json(movies);
});

// Get a single movie by ID
app.get("/movies/:id", async (req, res) => {
    const { id } = req.params;
    const movie = await prisma.movie.findUnique({
        where: { id: Number(id) },
    });
    res.json(movie);
});

// Update a movie by ID
app.put("/movies/:id", async (req, res) => {
    const { id } = req.params;
    const { title, director, rating } = req.body;
    const movie = await prisma.movie.update({
        where: { id: Number(id) },
        data: { title, director, rating },
    });
    res.json(movie);
});

// Delete a movie by ID
app.delete("/movies/:id", async (req, res) => {
    const { id } = req.params;
    const movie = await prisma.movie.delete({
        where: { id: Number(id) },
    });
    res.json(movie);
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Debug DB URL
console.log("Debugging DATABASE_URL:", process.env.DATABASE_URL);
