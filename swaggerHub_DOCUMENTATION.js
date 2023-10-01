const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const express = require('express');

const app = express();
app.use(express.json());

const swaggerOptions = {
    swaggerDefinition: {
        owner: "ARC-Solutions",
        project: "--- None ---",
        specification: "OpenAPI 3.0.x",
        template: "None",
        name: "MovieVault",
        version: "1.0.0",
        title: "Movie Vault API",
        description: "API for accessing and managing a collection of movies.",
        visibility: "Public",
    },
    apis: ["server.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

module.exports = app;
