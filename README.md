# Healthcare Referral Management System

A simple full-stack application for managing healthcare referrals between organizations. This system allows healthcare providers to register organizations, define coverage areas, create referrals, and manage incoming referral requests.

## Live Deployement

- **Frontend Vercel**: https://healthcare-refferal-management.vercel.app/
- **Backend + MCP Railway**: https://healthcare-refferal-management-production.up.railway.app/
- **Database**: Database is currently hosted on Supabase

## Features

- **Organization Management**: Register and manage healthcare organizations (clinics, pharmacies, home health, etc.)
- **Coverage Area Management**: Define and filter organizations by geographic coverage (state, county, city, zip code)
- **Referral System**: Send referrals between organizations with patient information
- **Referral Management**: Accept or reject incoming referrals with status tracking
- **Roles**: Organizations can be senders, receivers, or both
- **UI**: Responsive design with table and card views where needed

## Technologies

### Backend

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **PostgreSQL** database
- **Zod** for schema validation

### Frontend

- **React** with **TypeScript**
- **React Router DOM** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Axios** for API calls
- **Context API** for state management

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **pnpm** (v10.6.2 or compatible) - or npm
- **Git**

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Healthcare-Refferal-Management
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   pnpm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   pnpm install
   ```

## Database Setup

1. **Create a PostgreSQL database**

   ```sql
   CREATE DATABASE healthcare_referrals;
   ```

2. **Run the migration**

   ```bash
   cd backend
   psql -U postgres -d healthcare_referrals -f migrations/schema.sql
   ```

   Or using psql interactively:

   ```bash
   psql -U postgres -d healthcare_referrals
   \i migrations/schema.sql
   ```

   The schema includes:

   - Tables: `organizations`, `coverage_areas`, `referrals`
   - ENUMs: `organization_type`, `organization_role`, `referral_status`
   - Indexes for performance
   - Triggers for automatic timestamp updates
   - Constraints for data integrity

3. **Test the database connection**
   ```bash
   cd backend
   pnpm test:db
   ```

## Environment Variables

### Backend (.env)

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_referrals
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication
API_TOKEN=your_secret_api_token_here
```

### Frontend (.env)

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TOKEN=your_secret_api_token_here
```

**Important**: The `VITE_API_TOKEN` must match the `API_TOKEN` in the backend `.env` file.

## Running the Application

### Development Mode

1. **Start the backend server**

   ```bash
   cd backend
   pnpm dev
   ```

   The backend will run on `http://localhost:3000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   pnpm dev
   ```
   The frontend will run on `http://localhost:5173` (or the next available port)

### Production Build

1. **Build the backend**

   ```bash
   cd backend
   pnpm build
   pnpm start
   ```

2. **Build the frontend**
   ```bash
   cd frontend
   pnpm build
   ```
   The built files will be in `frontend/dist/`

## API Documentation

All API endpoints require authentication via Bearer token in the `Authorization` header:

```
Authorization: Bearer your_secret_api_token_here
```

### Organizations

#### Create Organization

```http
POST /api/organizations
Content-Type: application/json

{
  "name": "City Hospital",
  "type": "clinic",
  "role": "both",
  "contact_info": {
    "email": "contact@cityhospital.com",
    "phone": "555-1234"
  },
  "coverage_areas": [
    {
      "state": "CA",
      "county": "Los Angeles",
      "city": "Los Angeles",
      "zip_code": "90001"
    }
  ]
}
```

**Response**: `201 Created`

```json
{
  "id": "uuid",
  "name": "City Hospital",
  "type": "clinic",
  "role": "both",
  "contact_info": {...},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### List Organizations

```http
GET /api/organizations?type=clinic&role=both
```

**Response**: `200 OK`

```json
[
  {
    "id": "uuid",
    "name": "City Hospital",
    "type": "clinic",
    "role": "both",
    ...
  }
]
```

#### Get Organization

```http
GET /api/organizations/:id
```

**Response**: `200 OK` (includes coverage_areas)

#### Update Coverage Areas

```http
PUT /api/organizations/:id/coverage
Content-Type: application/json

{
  "coverage_areas": [
    {
      "state": "CA",
      "county": "San Francisco",
      "city": "San Francisco",
      "zip_code": "94102"
    }
  ]
}
```

### Referrals

#### Create Referral

```http
POST /api/referrals
Content-Type: application/json

{
  "sender_org_id": "uuid",
  "receiver_org_id": "uuid",
  "patient_name": "John Doe",
  "insurance_number": "INS123456",
  "notes": "Patient requires immediate attention"
}
```

**Response**: `201 Created`

#### List Referrals

```http
GET /api/referrals?sender_org_id=uuid
GET /api/referrals?receiver_org_id=uuid
```

**Response**: `200 OK` (includes sender_name and receiver_name)

#### Update Referral Status

```http
PATCH /api/referrals/:id/status
Content-Type: application/json

{
  "status": "accepted"
}
```

**Valid statuses**: `"accepted"`, `"rejected"`

**Response**: `200 OK`

### Error Responses

All endpoints may return:

- `400 Bad Request` - Validation errors or invalid input
- `401 Unauthorized` - Missing or invalid API token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Project Structure

```
Healthcar-Refferal-Management/
├── backend/
│   ├── migrations/
│   │   └── schema.sql          # Database schema
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts     # Database connection
│   │   ├── controllers/        # Request handlers
│   │   │   ├── organizations.controller.ts
│   │   │   └── referrals.controller.ts
│   │   ├── middleware/
│   │   │   └── auth.ts         # Authentication middleware
│   │   ├── routes/              # API routes
│   │   │   ├── organizations.routes.ts
│   │   │   └── referrals.routes.ts
│   │   ├── utils/
│   │   │   └── asyncHandler.ts # Async error handler
│   │   ├── validators/          # Zod schemas
│   │   │   ├── organizations.schema.ts
│   │   │   └── referrals.schema.ts
│   │   └── index.ts             # Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── context/
│   │   │   └── AppContext.tsx   # Global state management
│   │   ├── pages/                # Page components
│   │   │   ├── OrganizationsPage.tsx
│   │   │   ├── SendReferralPage.tsx
│   │   │   ├── IncomingReferralsPage.tsx
│   │   │   └── CoveragePage.tsx
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Development Workflow

1. **Database Changes**: Update `backend/migrations/schema.sql` and re-run the migration
2. **Backend Changes**: Controllers handle business logic, validators ensure data integrity
3. **Frontend Changes**: Pages use Context API for state, services handle API calls
4. **Type Safety**: TypeScript ensures type safety across the stack

## Common Issues

### Database Connection Error

- Verify PostgreSQL is running
- Check `.env` file has correct database credentials
- Ensure database exists: `CREATE DATABASE healthcare_referrals;`

### Authentication Error (401)

- Ensure `API_TOKEN` in backend `.env` matches `VITE_API_TOKEN` in frontend `.env`
- Check that the Authorization header is being sent correctly

### CORS Issues

- Backend has CORS enabled for all origins in development
- For production, configure CORS in `backend/src/index.ts`

## Author

Shoaib Ud Din
