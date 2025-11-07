import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BusLink API',
      version: '1.0.0',
      description: 'API documentation for the BusLink application, providing real-time bus tracking and user management.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development Server'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer {token}'
        },
      },
    },
    // This makes the bearerAuth scheme global, but can be overridden at the operation level
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the files containing OpenAPI definitions
  apis: [path.resolve(__dirname, './api/*/routes.ts')],
}

export const swaggerSpec = swaggerJsdoc(swaggerOptions)
export { swaggerUi }