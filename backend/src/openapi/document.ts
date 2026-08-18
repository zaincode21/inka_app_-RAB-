/**
 * Hand-maintained OpenAPI 3 contract for /api/v1.
 * Keep in sync with routes + Zod schemas in resourceSchemas.ts.
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Inka Farm API',
    version: 'v1',
    description: [
      'REST API for the Inka dairy/beef farm management app.',
      '',
      '**Quick start**',
      '1. `POST /auth/login` with a seeded account (e.g. `owner@inka.local` / `owner123`).',
      '2. Click **Authorize** and paste the `token` as a Bearer value.',
      '3. `GET /cattle` to list the herd for the active farm.',
      '',
      'Most authenticated routes are scoped to the JWT `farmId`. Soft-deleted rows use `?archived=true` and `POST /{resource}/{id}/restore`.',
    ].join('\n'),
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current host (relative)',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Farms' },
    { name: 'Categories' },
    { name: 'Cattle' },
    { name: 'Milk Records' },
    { name: 'Events' },
    { name: 'Transactions' },
    { name: 'Inventory' },
    { name: 'Reports' },
    { name: 'Audit Logs' },
    { name: 'Attachments' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from `POST /auth/login` or `POST /auth/register`.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          details: {},
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string', nullable: true },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'VETERINARIAN', 'WORKER'],
          },
          farmId: { type: 'string', nullable: true },
          farmName: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
        },
      },
      AuthResponse: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'owner@inka.local' },
          password: { type: 'string', example: 'owner123' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'phone', 'password', 'farmName', 'district', 'sector'],
        properties: {
          fullName: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', minLength: 7 },
          password: { type: 'string', minLength: 6 },
          farmName: { type: 'string', minLength: 2 },
          district: { type: 'string', minLength: 2 },
          sector: { type: 'string', minLength: 2 },
        },
      },
      SwitchFarmRequest: {
        type: 'object',
        required: ['farmId'],
        properties: {
          farmId: { type: 'string' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'role'],
        properties: {
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          password: { type: 'string', minLength: 6 },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'VETERINARIAN', 'WORKER'],
          },
          farmId: { type: 'string' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          phone: { type: 'string' },
          password: { type: 'string', minLength: 6 },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'VETERINARIAN', 'WORKER'],
          },
          isActive: { type: 'boolean' },
        },
      },
      Farm: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          ownerName: { type: 'string' },
          ownerPhone: { type: 'string', nullable: true },
          location: { type: 'string' },
          district: { type: 'string' },
          sector: { type: 'string' },
          currency: { type: 'string', example: 'RWF' },
          weightUnit: { type: 'string', example: 'kg' },
          milkUnit: { type: 'string', example: 'L' },
          returnHeatDays: { type: 'integer' },
          returnHeatTime: { type: 'string', example: '08:00' },
          milkPricePerLiter: { type: 'number' },
          defaultMilkBuyer: { type: 'string', nullable: true },
          defaultMilkDestination: { type: 'string', nullable: true },
        },
      },
      SystemConfigUpdate: {
        type: 'object',
        properties: {
          returnHeatDays: { type: 'integer', minimum: 0, maximum: 45 },
          returnHeatTime: { type: 'string', example: '08:00' },
          milkPricePerLiter: { type: 'number', minimum: 0 },
          defaultMilkBuyer: { type: 'string' },
          defaultMilkDestination: { type: 'string' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          farmId: { type: 'string' },
          kind: { type: 'string', example: 'breed' },
          name: { type: 'string' },
          isDefault: { type: 'boolean' },
          defaultWithdrawalDays: { type: 'number' },
        },
      },
      Cattle: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          farmId: { type: 'string' },
          tagNumber: { type: 'string', example: 'RW-001' },
          name: { type: 'string' },
          breed: { type: 'string' },
          sex: { type: 'string', enum: ['MALE', 'FEMALE'] },
          stage: {
            type: 'string',
            enum: ['CALF', 'WEANER', 'HEIFER', 'COW', 'BULL', 'STEER'],
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'SOLD', 'CULLED', 'DEAD', 'INACTIVE'],
          },
          groupName: { type: 'string', nullable: true },
          dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
          weightKg: { type: 'number' },
          reproductiveStatus: {
            type: 'string',
            enum: ['OPEN', 'BRED', 'PREGNANT', 'DRY', 'LACTATING', 'NOT_APPLICABLE'],
          },
          motherTag: { type: 'string', nullable: true },
          fatherTag: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          createdBy: { type: 'object', nullable: true },
        },
      },
      CattleCreate: {
        type: 'object',
        required: ['tagNumber', 'name', 'breed', 'sex', 'stage'],
        properties: {
          farmId: { type: 'string' },
          tagNumber: { type: 'string' },
          name: { type: 'string' },
          officialId: { type: 'string' },
          rfid: { type: 'string' },
          breed: { type: 'string' },
          sex: { type: 'string', enum: ['MALE', 'FEMALE'] },
          stage: {
            type: 'string',
            enum: ['CALF', 'WEANER', 'HEIFER', 'COW', 'BULL', 'STEER'],
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'SOLD', 'CULLED', 'DEAD', 'INACTIVE'],
            default: 'ACTIVE',
          },
          groupName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date-time' },
          entryDate: { type: 'string', format: 'date-time' },
          weightKg: { type: 'number' },
          bodyConditionScore: { type: 'number' },
          colorMarkings: { type: 'string' },
          source: { type: 'string' },
          sourceDetail: { type: 'string' },
          purchasePrice: { type: 'number' },
          paddock: { type: 'string' },
          lactationNumber: { type: 'integer' },
          parity: { type: 'integer' },
          reproductiveStatus: {
            type: 'string',
            enum: ['OPEN', 'BRED', 'PREGNANT', 'DRY', 'LACTATING', 'NOT_APPLICABLE'],
          },
          motherTag: { type: 'string' },
          fatherTag: { type: 'string' },
          notes: { type: 'string' },
          photoUri: { type: 'string' },
        },
      },
      CattleExit: {
        type: 'object',
        required: ['status', 'exitDate'],
        properties: {
          status: { type: 'string', enum: ['SOLD', 'CULLED', 'DEAD', 'INACTIVE'] },
          exitDate: { type: 'string', format: 'date-time' },
          reason: { type: 'string' },
          amount: { type: 'number' },
          buyerVendor: { type: 'string' },
          paymentMethod: { type: 'string' },
        },
      },
      MilkRecord: {
        type: 'object',
        required: ['date', 'milkType'],
        properties: {
          farmId: { type: 'string' },
          cattleId: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          milkType: { type: 'string', example: 'Whole Farm' },
          amTotal: { type: 'number' },
          noonTotal: { type: 'number' },
          pmTotal: { type: 'number' },
          totalProduced: { type: 'number' },
          totalUsed: { type: 'number' },
          calfMilk: { type: 'number' },
          rejectedMilk: { type: 'number' },
          destination: { type: 'string' },
          buyer: { type: 'string' },
          pricePerLiter: { type: 'number' },
          fatPercent: { type: 'number' },
          proteinPercent: { type: 'number' },
          somaticCellCount: { type: 'number' },
          notes: { type: 'string' },
          createMilkSale: { type: 'boolean' },
          paymentMethod: { type: 'string' },
        },
      },
      HealthEvent: {
        type: 'object',
        required: ['scope', 'eventDate', 'eventType'],
        properties: {
          farmId: { type: 'string' },
          cattleId: { type: 'string' },
          scope: { type: 'string', enum: ['INDIVIDUAL', 'MASS'] },
          groupName: { type: 'string' },
          eventDate: { type: 'string', format: 'date-time' },
          eventType: { type: 'string' },
          symptoms: { type: 'string' },
          diagnosis: { type: 'string' },
          medicine: { type: 'string' },
          dosage: { type: 'string' },
          withdrawalDays: { type: 'number' },
          followUpDate: { type: 'string', format: 'date-time' },
          treatmentCost: { type: 'number' },
          semenUsed: { type: 'string' },
          bullResponsible: { type: 'string' },
          calfTag: { type: 'string' },
          calfGender: { type: 'string', enum: ['MALE', 'FEMALE'] },
          sourceEventId: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      Transaction: {
        type: 'object',
        required: ['kind', 'date', 'category', 'title', 'amount'],
        properties: {
          farmId: { type: 'string' },
          cattleId: { type: 'string' },
          milkRecordId: { type: 'string' },
          healthEventId: { type: 'string' },
          kind: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          date: { type: 'string', format: 'date-time' },
          category: { type: 'string' },
          title: { type: 'string' },
          amount: { type: 'number' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
          paymentMethod: { type: 'string' },
          buyerVendor: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      InventoryItem: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          category: { type: 'string', default: 'Feed' },
          unit: { type: 'string', default: 'kg' },
          quantityOnHand: { type: 'number' },
          reorderLevel: { type: 'number' },
          notes: { type: 'string' },
          lowStock: { type: 'boolean', readOnly: true },
        },
      },
      InventoryReceive: {
        type: 'object',
        required: ['quantity', 'date'],
        properties: {
          quantity: { type: 'number' },
          unitCost: { type: 'number' },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
          createExpense: { type: 'boolean' },
          vendor: { type: 'string' },
        },
      },
      InventoryUse: {
        type: 'object',
        required: ['quantity', 'date'],
        properties: {
          quantity: { type: 'number' },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
        },
      },
      DashboardMetrics: {
        type: 'object',
        properties: {
          calves: { type: 'integer' },
          cows: { type: 'integer' },
          bulls: { type: 'integer' },
          totalMilkToday: { type: 'number' },
          healthAlerts: { type: 'integer' },
          incomeThisMonth: { type: 'number' },
          expensesThisMonth: { type: 'number' },
        },
      },
    },
    parameters: {
      IdPath: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
      FarmIdQuery: {
        name: 'farmId',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Optional farm scope (Super Admin / membership rules).',
      },
      ArchivedQuery: {
        name: 'archived',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['true'] },
        description: 'When `true`, list soft-archived rows only.',
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid Bearer token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      BadRequest: {
        description: 'Validation or business-rule error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NoContent: {
        description: 'Soft-deleted (no body)',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'API health check',
        security: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    version: { type: 'string', example: 'v1' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'JWT + user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register farm owner + farm',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset code',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Always succeeds (may include `devResetToken` in non-prod)',
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Password updated' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password (authenticated)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/switch-farm': {
      post: {
        tags: ['Auth'],
        summary: 'Switch active farm (new JWT)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SwitchFarmRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'New JWT + user with updated farm',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Current user profile',
        responses: {
          '200': {
            description: 'Profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (Owner / Super Admin)',
        parameters: [{ $ref: '#/components/parameters/FarmIdQuery' }],
        responses: {
          '200': {
            description: 'User list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create staff user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/users/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/farms/mine': {
      get: {
        tags: ['Farms'],
        summary: 'Farms accessible to the caller',
        responses: {
          '200': {
            description: 'Membership farms (`isActive` marks the session farm)',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Farm' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/farms/system-config': {
      get: {
        tags: ['Farms'],
        summary: 'Get system configuration',
        parameters: [{ $ref: '#/components/parameters/FarmIdQuery' }],
        responses: {
          '200': { description: 'System config fields on the farm' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Farms'],
        summary: 'Update system configuration (Owner)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SystemConfigUpdate' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated config' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/farms': {
      get: {
        tags: ['Farms'],
        summary: 'List farms',
        responses: {
          '200': {
            description: 'Farms',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Farm' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Farms'],
        summary: 'Create farm (Super Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Farm' },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/farms/{id}': {
      get: {
        tags: ['Farms'],
        summary: 'Get farm',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Farm',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Farm' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Farms'],
        summary: 'Update farm',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Farm' } } },
        },
        responses: {
          '200': { description: 'Updated' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Farms'],
        summary: 'Delete farm (Super Admin)',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '204': { $ref: '#/components/responses/NoContent' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          {
            name: 'kind',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by kind (breed, medicine, event, disease, …)',
          },
        ],
        responses: {
          '200': {
            description: 'Categories',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create category (Owner)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Category' },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': { description: 'Category' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Categories'],
        summary: 'Update category',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Category' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '204': { $ref: '#/components/responses/NoContent' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/cattle': {
      get: {
        tags: ['Cattle'],
        summary: 'List cattle',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          { $ref: '#/components/parameters/ArchivedQuery' },
        ],
        responses: {
          '200': {
            description: 'Cattle list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Cattle' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Cattle'],
        summary: 'Create cattle',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CattleCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Cattle' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/cattle/{id}': {
      get: {
        tags: ['Cattle'],
        summary: 'Get cattle by id',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Cattle',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Cattle' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Cattle'],
        summary: 'Update cattle',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CattleCreate' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Cattle'],
        summary: 'Soft-archive cattle',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '204': { $ref: '#/components/responses/NoContent' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/cattle/{id}/restore': {
      post: {
        tags: ['Cattle'],
        summary: 'Restore soft-archived cattle',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Restored',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Cattle' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/cattle/{id}/exit': {
      post: {
        tags: ['Cattle'],
        summary: 'Record herd exit (sold/culled/dead/inactive)',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CattleExit' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated cattle (and optional sale/disposal transaction)' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/milk-records': {
      get: {
        tags: ['Milk Records'],
        summary: 'List milk records',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          { $ref: '#/components/parameters/ArchivedQuery' },
        ],
        responses: {
          '200': { description: 'Milk records' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Milk Records'],
        summary: 'Create milk record',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MilkRecord' },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/milk-records/{id}': {
      get: {
        tags: ['Milk Records'],
        summary: 'Get milk record',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': { description: 'Milk record' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Milk Records'],
        summary: 'Update milk record',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MilkRecord' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Milk Records'],
        summary: 'Soft-archive milk record',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '204': { $ref: '#/components/responses/NoContent' },
        },
      },
    },
    '/milk-records/{id}/restore': {
      post: {
        tags: ['Milk Records'],
        summary: 'Restore milk record',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': { description: 'Restored' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'List health events',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          { $ref: '#/components/parameters/ArchivedQuery' },
          { name: 'eventType', in: 'query', schema: { type: 'string' } },
          { name: 'cattleTag', in: 'query', schema: { type: 'string' } },
          { name: 'cattleId', in: 'query', schema: { type: 'string' } },
          {
            name: 'scope',
            in: 'query',
            schema: { type: 'string', enum: ['INDIVIDUAL', 'MASS'] },
          },
          {
            name: 'followUpDue',
            in: 'query',
            schema: { type: 'string', enum: ['true'] },
          },
        ],
        responses: {
          '200': { description: 'Events' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Create health event',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HealthEvent' },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/events/latest-breeding': {
      get: {
        tags: ['Events'],
        summary: 'Latest breeding event for pregnancy prefill',
        parameters: [
          {
            name: 'cattleTag',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Breeding event or null' },
        },
      },
    },
    '/events/birth-prefill': {
      get: {
        tags: ['Events'],
        summary: 'Birth form prefill from pregnancy/breeding',
        parameters: [
          {
            name: 'cattleTag',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Prefill payload' },
        },
      },
    },
    '/events/milk-withdrawal': {
      get: {
        tags: ['Events'],
        summary: 'Active milk withdrawal for a cow on a date',
        parameters: [
          {
            name: 'cattleTag',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'onDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': { description: 'Withdrawal status' },
        },
      },
    },
    '/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': { description: 'Event' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Events'],
        summary: 'Update event',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HealthEvent' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Soft-archive event',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '204': { $ref: '#/components/responses/NoContent' },
        },
      },
    },
    '/events/{id}/restore': {
      post: {
        tags: ['Events'],
        summary: 'Restore event',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': { description: 'Restored' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          { $ref: '#/components/parameters/ArchivedQuery' },
          {
            name: 'kind',
            in: 'query',
            schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          },
        ],
        responses: {
          '200': { description: 'Transactions' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Create transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Transaction' },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/transactions/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Get transaction',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': { description: 'Transaction' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Transactions'],
        summary: 'Update transaction',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Transaction' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Soft-archive transaction',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '204': { $ref: '#/components/responses/NoContent' },
        },
      },
    },
    '/transactions/{id}/restore': {
      post: {
        tags: ['Transactions'],
        summary: 'Restore transaction',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': { description: 'Restored' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'List inventory items',
        parameters: [{ $ref: '#/components/parameters/FarmIdQuery' }],
        responses: {
          '200': {
            description: 'Items',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/InventoryItem' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Inventory'],
        summary: 'Create inventory item',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InventoryItem' },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/inventory/{id}': {
      patch: {
        tags: ['Inventory'],
        summary: 'Update inventory item metadata',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InventoryItem' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/inventory/{id}/receive': {
      post: {
        tags: ['Inventory'],
        summary: 'Receive stock (optional Feed expense)',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InventoryReceive' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated item + movement' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/inventory/{id}/use': {
      post: {
        tags: ['Inventory'],
        summary: 'Use / deduct stock',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InventoryUse' },
            },
          },
        },
        responses: {
          '200': { description: 'Updated item + movement' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/inventory/{id}/movements': {
      get: {
        tags: ['Inventory'],
        summary: 'List recent stock movements',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': { description: 'Movements' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/reports/dashboard': {
      get: {
        tags: ['Reports'],
        summary: 'Dashboard metrics',
        parameters: [{ $ref: '#/components/parameters/FarmIdQuery' }],
        responses: {
          '200': {
            description: 'Dashboard KPIs',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardMetrics' },
              },
            },
          },
        },
      },
    },
    '/reports/summaries': {
      get: {
        tags: ['Reports'],
        summary: 'Report summary cards',
        parameters: [{ $ref: '#/components/parameters/FarmIdQuery' }],
        responses: {
          '200': { description: 'Summaries' },
        },
      },
    },
    '/reports/period': {
      get: {
        tags: ['Reports'],
        summary: 'Period rollup (milk, herd, events, finance)',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          {
            name: 'from',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'to',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': { description: 'Period totals' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/reports/details': {
      get: {
        tags: ['Reports'],
        summary: 'JSON rows for the selected report dataset and date range',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          {
            name: 'from',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'to',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'dataset',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['milk', 'transactions', 'events', 'cattle'],
            },
          },
          {
            name: 'kind',
            in: 'query',
            required: false,
            description: 'Optional filter when dataset=transactions (INCOME or EXPENSE)',
            schema: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Report details with farm info, summary, and rows',
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/reports/export.csv': {
      get: {
        tags: ['Reports'],
        summary: 'CSV export for a date range',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          {
            name: 'from',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'to',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'dataset',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['milk', 'transactions', 'events', 'cattle'],
            },
          },
          {
            name: 'kind',
            in: 'query',
            required: false,
            description: 'Optional filter when dataset=transactions (INCOME or EXPENSE)',
            schema: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'CSV download with farm header block',
            content: {
              'text/csv': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/reports/export.pdf': {
      get: {
        tags: ['Reports'],
        summary: 'PDF export via jsreport (includes farm information)',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          {
            name: 'from',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'to',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'dataset',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['milk', 'transactions', 'events', 'cattle'],
            },
          },
          {
            name: 'kind',
            in: 'query',
            required: false,
            description: 'Optional filter when dataset=transactions (INCOME or EXPENSE)',
            schema: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'PDF download',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Activity trail (Owner / Super Admin)',
        parameters: [
          { $ref: '#/components/parameters/FarmIdQuery' },
          { name: 'entityType', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          '200': { description: 'Paginated audit entries' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/attachments': {
      get: {
        tags: ['Attachments'],
        summary: 'List attachments',
        parameters: [
          { name: 'cattleId', in: 'query', schema: { type: 'string' } },
          { name: 'healthEventId', in: 'query', schema: { type: 'string' } },
          { name: 'transactionId', in: 'query', schema: { type: 'string' } },
          { name: 'milkRecordId', in: 'query', schema: { type: 'string' } },
          { name: 'ownerType', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Attachments' },
        },
      },
      post: {
        tags: ['Attachments'],
        summary: 'Upload attachment (multipart)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'ownerType'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  ownerType: { type: 'string' },
                  label: { type: 'string' },
                  cattleId: { type: 'string' },
                  milkRecordId: { type: 'string' },
                  healthEventId: { type: 'string' },
                  transactionId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created attachment metadata' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
} as const;
