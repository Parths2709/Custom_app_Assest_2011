'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'F1-US01-CRUD Backend — Asset Management API',
      version: '0.1.0',
      description:
        'REST API for the Asset Management system. Covers asset lifecycle management, ' +
        'category/sub-category definitions, employee allocation, job cards, dashboard, ' +
        'reports, notifications, and user access control.',
      contact: { name: 'API Support' },
      license: { name: 'MIT' },
    },
    servers: [{ url: '/api/v1', description: 'Default API prefix' }],
    tags: [
      { name: 'Health', description: 'Service health and readiness probes' },
      { name: 'Categories', description: 'Asset categories, sub-categories, and specifications' },
      { name: 'Assets', description: 'Asset lifecycle: creation, status, allocation, history' },
      { name: 'Employees', description: 'Employee records and asset allocation view' },
      { name: 'JobCards', description: 'Job cards for assets under repair' },
      { name: 'Dashboard', description: 'Summary metrics and inventory overview' },
      { name: 'Reports', description: 'Filtered asset reports with custom field selection' },
      { name: 'Notifications', description: 'Notifications and scheduled reminders' },
      { name: 'Users', description: 'User accounts and role-based access management' },
    ],
    components: {
      schemas: {
        // ── Shared ──────────────────────────────────────────────────────────
        HealthResponse: {
          type: 'object',
          required: ['status', 'uptime', 'timestamp'],
          properties: {
            status: { type: 'string', enum: ['ok'], example: 'ok' },
            uptime: { type: 'number', description: 'Process uptime in seconds', example: 42.5 },
            timestamp: { type: 'string', format: 'date-time', example: '2026-11-20T12:00:00.000Z' },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['status', 'message'],
              properties: {
                status: { type: 'integer', example: 404 },
                message: { type: 'string', example: 'Not Found' },
                stack: { type: 'string', description: 'Stack trace (non-production only)' },
              },
            },
          },
        },

        // ── Categories ───────────────────────────────────────────────────────
        CategoryInput: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            name: { type: 'string', example: 'Hardware' },
            code: { type: 'string', example: 'HW', description: 'Short uppercase code used in Asset ID' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', example: 'HW' },
            name: { type: 'string', example: 'Hardware' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CategoryDetail: {
          allOf: [
            { $ref: '#/components/schemas/Category' },
            {
              type: 'object',
              properties: {
                subCategories: { type: 'array', items: { $ref: '#/components/schemas/SubCategory' } },
              },
            },
          ],
        },
        SubCategoryInput: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            name: { type: 'string', example: 'Laptop' },
            code: { type: 'string', example: 'LPT' },
          },
        },
        SubCategory: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            categoryId: { type: 'string' },
            code: { type: 'string', example: 'LPT' },
            name: { type: 'string', example: 'Laptop' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SubCategoryDetail: {
          allOf: [
            { $ref: '#/components/schemas/SubCategory' },
            {
              type: 'object',
              properties: {
                specifications: { type: 'array', items: { $ref: '#/components/schemas/Specification' } },
              },
            },
          ],
        },
        SpecificationInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'RAM' },
            type: { type: 'string', enum: ['text', 'number', 'date', 'boolean'], default: 'text' },
            required: { type: 'boolean', default: false },
            categoryId: { type: 'string' },
            subCategoryId: { type: 'string' },
          },
        },
        Specification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            categoryId: { type: 'string', nullable: true },
            subCategoryId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Assets ───────────────────────────────────────────────────────────
        AssetInput: {
          type: 'object',
          properties: {
            model: { type: 'string', example: 'ThinkPad X1' },
            name: { type: 'string', example: 'Dev Laptop #1' },
            serialNumber: { type: 'string', example: 'SN-12345678' },
            purchaseDate: { type: 'string', format: 'date', example: '2026-01-15' },
            warrantyDate: { type: 'string', format: 'date', example: '2029-01-15' },
            specValues: {
              type: 'object',
              additionalProperties: true,
              description: 'Key-value pairs matching the category/sub-category specifications',
              example: { RAM: '16GB', Storage: '512GB SSD' },
            },
          },
        },
        Asset: {
          type: 'object',
          properties: {
            assetId: { type: 'string', example: 'HW-LPT-001', description: 'Immutable unique Asset ID' },
            categoryId: { type: 'string' },
            subCategoryId: { type: 'string' },
            model: { type: 'string', nullable: true },
            name: { type: 'string', nullable: true },
            serialNumber: { type: 'string', nullable: true },
            purchaseDate: { type: 'string', format: 'date', nullable: true },
            warrantyDate: { type: 'string', format: 'date', nullable: true },
            status: {
              type: 'string',
              enum: ['New', 'Instock', 'Ready', 'Check-In', 'Check-Out', 'Repair', 'Ready after Repair', 'Disposal'],
            },
            employeeId: { type: 'string', nullable: true },
            allocatedAt: { type: 'string', format: 'date-time', nullable: true },
            specValues: { type: 'object', additionalProperties: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AssetDetail: {
          allOf: [
            { $ref: '#/components/schemas/Asset' },
            {
              type: 'object',
              properties: {
                history: { type: 'array', items: { $ref: '#/components/schemas/ActivityHistory' } },
                employee: { $ref: '#/components/schemas/Employee', nullable: true },
              },
            },
          ],
        },
        ActivityHistory: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            assetId: { type: 'string' },
            action: { type: 'string', example: 'status_changed' },
            fromStatus: { type: 'string', nullable: true },
            toStatus: { type: 'string', nullable: true },
            employeeId: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },

        // ── Employees ────────────────────────────────────────────────────────
        EmployeeInput: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', format: 'email', example: 'jane.smith@example.com' },
            department: { type: 'string', example: 'Engineering' },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            department: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Job Cards ────────────────────────────────────────────────────────
        JobCardInput: {
          type: 'object',
          properties: {
            assetId: { type: 'string', example: 'HW-LPT-001' },
            vendorName: { type: 'string', example: 'Acme Repairs Ltd' },
            vendorContact: { type: 'string', example: '+1-555-0100' },
            issueDescription: { type: 'string', example: 'Screen cracked, keyboard not responding' },
          },
        },
        JobCard: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            assetId: { type: 'string' },
            vendorName: { type: 'string', nullable: true },
            vendorContact: { type: 'string', nullable: true },
            issueDescription: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['open', 'signed', 'closed'] },
            vendorSignedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Notifications ────────────────────────────────────────────────────
        NotificationInput: {
          type: 'object',
          required: ['type', 'message'],
          properties: {
            type: {
              type: 'string',
              enum: ['status_change', 'warranty_expiry', 'maintenance', 'licensing', 'inventory', 'custom'],
            },
            assetId: { type: 'string', nullable: true },
            message: { type: 'string', example: 'Warranty expiring in 30 days' },
            scheduledAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            assetId: { type: 'string', nullable: true },
            message: { type: 'string' },
            scheduledAt: { type: 'string', format: 'date-time', nullable: true },
            sentAt: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['pending', 'sent', 'cancelled'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Users ────────────────────────────────────────────────────────────
        UserInput: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'Alice Admin' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            role: { type: 'string', enum: ['Admin', 'User'], default: 'User' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['Admin', 'User'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Dashboard ────────────────────────────────────────────────────────
        DashboardSummary: {
          type: 'object',
          properties: {
            totalAssets: { type: 'integer' },
            allocatedAssets: { type: 'integer' },
            unallocatedAssets: { type: 'integer' },
            statusBreakdown: { type: 'object', additionalProperties: { type: 'integer' } },
            categoryBreakdown: { type: 'object', additionalProperties: { type: 'integer' } },
            totalCategories: { type: 'integer' },
            totalSubCategories: { type: 'integer' },
            totalEmployees: { type: 'integer' },
            openJobCards: { type: 'integer' },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'The requested resource was not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        BadRequest: {
          description: 'Invalid request payload or parameters',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        InternalServerError: {
          description: 'An unexpected server error occurred',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.js'],
};

module.exports = swaggerJsdoc(options);
