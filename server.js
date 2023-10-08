if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
            version: "2.0.3",
            description: "API for accessing and managing a collection of movies. \n Created by ARC-Solutions \n Authorization: Bearer <YOUR_ACCESS_TOKEN>",
        },
        securityDefinitions: {
            BearerAuth: {
                type: 'apiKey',
                name: 'Authorization',
                in: 'header',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            }
        }
    },
    apis: ["server.js"],
};

// Initialize Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * paths:
 *   /:
 *     get:
 *       tags:
 *         - General
 *       summary: 'Welcome endpoint'
 *       description: 'Returns a welcome message.'
 *       responses:
 *         200:
 *           description: 'Welcome to the Movies API!'
 */
app.get('/', (req, res) => {
    res.send('Welcome to the Movies API!')
});

/**
 * @swagger
 * paths:
 *   /register:
 *     post:
 *       tags:
 *         - Authentication
 *       summary: 'Register a new user'
 *       description: 'This endpoint registers a new user with the provided username and password.'
 *       operationId: 'registerUser'
 *       consumes:
 *         - 'application/json'
 *       produces:
 *         - 'application/json'
 *       parameters:
 *         - in: 'body'
 *           name: 'body'
 *           description: 'User details for registration'
 *           required: true
 *           schema:
 *             type: 'object'
 *             properties:
 *               username:
 *                 type: 'string'
 *                 description: 'Username for the new user'
 *               password:
 *                 type: 'string'
 *                 description: 'Password for the new user'
 *             example:
 *               username: 'newUser'
 *               password: 'newPassword'
 *       responses:
 *         201:
 *           description: 'User registered successfully'
 *         400:
 *           description: 'Invalid input, object invalid'
 */
app.post('/register', [
    check('username').isString().notEmpty(),
    check('password').isString().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        // Add user to the database
        const newUser = await prisma.user.create({
            data: {
                username: username,
                password: hashedPassword,
            },
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.log(`Error in /register: ${error}`);
        res.status(400).json("Error creating user");
    }
});

/**
 * @swagger
 * paths:
 *   /login:
 *     post:
 *       tags:
 *         - Authentication
 *       summary: 'User login'
 *       description: 'This endpoint allows a user to login.'
 *       consumes:
 *         - 'application/json'
 *       produces:
 *         - 'application/json'
 *       parameters:
 *         - in: 'body'
 *           name: 'body'
 *           required: true
 *           schema:
 *             type: 'object'
 *             properties:
 *               username:
 *                 type: 'string'
 *               password:
 *                 type: 'string'
 *       responses:
 *         200:
 *           description: 'Successful login'
 *         403:
 *           description: 'Invalid credentials'
 */
const secretKey = crypto.randomBytes(64).toString('hex');
console.log(secretKey);
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await isValidUser(username, password);
    if(user){
        const payload = { id: user.id, username: user.username };
        const accessToken = jwt.sign(payload, secretKey, { expiresIn: '1h' });
        res.json({ accessToken });
    } else {
        res.status(403).send('Invalid credentials!');
    }
});
async function isValidUser(username, password) {
    try{
        const user = await prisma.user.findUnique({
            where: {
                username: username
            },
        });
        if(user && bcrypt.compareSync(password, user.password)) {
            return user;
        }
        return false;
    } catch (error) {
        console.log(`Error in isValidUser: ${error}`);
        return false;
    }
}
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

/**
 * @swagger
 * paths:
 *   /movies:
 *     get:
 *       security:
 *         - BearerAuth: []
 *       tags:
 *         - Movies
 *       summary: 'List all movies'
 *       description: 'This endpoint returns a list of all movies. Requires authentication.'
 *       responses:
 *         200:
 *           description: 'List of movies'
 *         401:
 *           description: 'Unauthorized'
 */
app.get('/movies', authenticateJWT, async (req, res) => {
   const movies = await prisma.movie.findMany();
   res.json(movies);
});

/**
 * @swagger
 * paths:
 *   /movies/{id}:
 *     get:
 *       security:
 *         - BearerAuth: []
 *       tags:
 *         - Movies
 *       summary: 'Get a movie by ID'
 *       description: 'This endpoint returns a movie by its ID.'
 *       parameters:
 *         - in: 'path'
 *           name: 'id'
 *           required: true
 *           type: 'integer'
 *       responses:
 *         200:
 *           description: 'Movie data'
 */
app.get("/movies/:id", authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const movie = await prisma.movie.findUnique({
        where: { id: Number(id) },
    });
    res.json(movie);
});

/**
 * @swagger
 * paths:
 *   /movies:
 *     post:
 *       security:
 *         - BearerAuth: []
 *       tags:
 *         - Movies
 *       summary: 'Create a new movie'
 *       description: 'This endpoint creates a new movie. Requires authentication.'
 *       consumes:
 *         - 'application/json'
 *       produces:
 *         - 'application/json'
 *       parameters:
 *         - in: 'body'
 *           name: 'body'
 *           required: true
 *           schema:
 *             type: 'object'
 *             properties:
 *               title:
 *                 type: 'string'
 *               director:
 *                 type: 'string'
 *               rating:
 *                 type: 'number'
 *       responses:
 *         200:
 *           description: 'Movie created'
 *         401:
 *           description: 'Unauthorized'
 *         400:
 *           description: 'Invalid input'
 */
app.post("/movies", [
    check('title').isString().notEmpty(),
    check('director').isString().notEmpty(),
    check('rating').isFloat({ min: 0, max: 10}).notEmpty(),
], authenticateJWT, async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const { title, director, rating } = req.body;
    const movie = await prisma.movie.create({
        data: { title, director, rating },
    });
    res.json(movie);
});

/**
 * @swagger
 * paths:
 *   /movies/{id}:
 *     put:
 *       security:
 *         - BearerAuth: []
 *       tags:
 *         - Movies
 *       summary: 'Update a movie by ID'
 *       description: 'This endpoint updates a movie by its ID. Requires authentication.'
 *       parameters:
 *         - in: 'path'
 *           name: 'id'
 *           required: true
 *           type: 'integer'
 *         - in: 'body'
 *           name: 'body'
 *           required: true
 *           schema:
 *             type: 'object'
 *             properties:
 *               title:
 *                 type: 'string'
 *               director:
 *                 type: 'string'
 *               rating:
 *                 type: 'number'
 *       responses:
 *         200:
 *           description: 'Movie updated'
 *         401:
 *           description: 'Unauthorized'
 *         400:
 *           description: 'Invalid input'
 */
app.put("/movies/:id", [
    check('title').isString().notEmpty(),
    check('director').isString().notEmpty(),
    check('rating').isFloat({ min: 0, max: 10}).notEmpty(),
], authenticateJWT, async (req, res) => {
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
 * paths:
 *   /movies/{id}:
 *     delete:
 *       security:
 *         - BearerAuth: []
 *       tags:
 *         - Movies
 *       summary: 'Delete a movie by ID'
 *       description: 'This endpoint deletes a movie by its ID. Requires authentication.'
 *       parameters:
 *         - in: 'path'
 *           name: 'id'
 *           required: true
 *           type: 'integer'
 *       responses:
 *         200:
 *           description: 'Movie deleted'
 *         401:
 *           description: 'Unauthorized'
 */
app.delete("/movies/:id", authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const movie = await prisma.movie.delete({
        where: { id: Number(id) },
    });
    res.json(movie);
});

// Central error handler for middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Debug DB URL
console.log("Debugging DATABASE_URL:", process.env.DATABASE_URL);
