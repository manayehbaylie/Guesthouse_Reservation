import swaggerJSDoc from "swagger-jsdoc";
const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Guesthouse Reservation API",
      version: "1.0.0",
      description:
        "API documentation for the Guesthouse Reservation Platform",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },

  apis: [
    "./src/routes/*.js",
  ],
};
const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;