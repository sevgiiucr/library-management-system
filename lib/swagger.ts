import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Kütüphane Yönetim Sistemi API',
        version: '1.0.0',
        description: 'Kütüphane yönetim sistemi için REST API dokümantasyonu',
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apiFolder: 'app/api',
  });
  return spec;
}; 