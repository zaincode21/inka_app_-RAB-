import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../openapi/document.js';

export const docsRouter = Router();

docsRouter.get('/openapi.json', (_request, response) => {
  response.json(openApiDocument);
});

docsRouter.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Inka API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
  }),
);
