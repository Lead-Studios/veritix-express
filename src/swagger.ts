import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",  
    info: {
      title: "User Ticketing System API",
      description: "API documentation for the User Ticketing System",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000", 
      },
    ],
  },
  apis: ["./src/routes/*.ts"], 
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };
