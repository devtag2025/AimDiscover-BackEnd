import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Express API",
      version: "1.0.0",
      description: "API documentation generated with Swagger",
    },
    servers: [
      { url: "http://localhost:5000" },
    ],
  },
  apis: ["./routes/*.js"], 
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };

