if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}
const express = require('express');
const prisma = require('./prismaClient');
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { check, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

// Swagger options
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Movie Vault API",
            version: "1.0.0",
            description: "API for accessing and managing a collection of movies. \n Created by ARC-Solutions",
        }
    },
    apis: ["server.js"],
};

// Initialize Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /:
 *  get:
 *    summary: Welcome message
 *    responses:
 *      200:
 *        description: Returns a welcome message.
 */
app.get('/', (req, res) => {
    res.send('Welcome to the Movies API!')
});

/**
 * @swagger
 * /movies:
 *  get:
 *    summary: Get all movies
 *    tags: [Movies]
 *    responses:
 *      200:
 *        description: Returns a list of all movies.
 */
app.get('/movies', async (req, res) => {
   const movies = await prisma.movie.findMany();
   res.json(movies);
});

/**
 * @swagger
 * /movies/{id}:
 *  get:
 *    summary: Get a movie by ID
 *    tags: [Movies]
 *    parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: integer
 *    responses:
 *      200:
 *        description: Returns the movie with the specified ID.
 */
app.get("/movies/:id", async (req, res) => {
    const { id } = req.params;
    const movie = await prisma.movie.findUnique({
        where: { id: Number(id) },
    });
    res.json(movie);
});

/**
 * @swagger
 * /movies/{id}:
 *  put:
 *    summary: Update a movie by ID
 *    tags: [Movies]
 *    parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: integer
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                type: string
 *              director:
 *                type: string
 *              rating:
 *                type: number
 *    responses:
 *      200:
 *        description: Returns the updated movie.
 */
app.put("/movies/:id", [
    check('title').isString().notEmpty(),
    check('director').isString().notEmpty(),
    check('rating').isFloat({ min: 0, max: 10}).notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { title, director, rating } = req.body;
    const movie = await prisma.movie.update({
        where: { id: Number(id) },
        data: { title, director, rating },
    });
    res.json(movie);
});

/**
 * @swagger
 * /movies/{id}:
 *  delete:
 *    summary: Delete a movie by ID
 *    tags: [Movies]
 *    parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: integer
 *    responses:
 *      200:
 *        description: Returns the deleted movie.
 */
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
