# API Documentation

> **Stack:** NestJS · TypeORM · PostgreSQL · JWT (Bearer)
> **Swagger UI:** `GET /docs` (requires env vars `SWAGGER_TITLE`, `SWAGGER_DESCRIPTION`, `SWAGGER_VERSION`)
> **Static uploads:** served at `/uploads/<path>` (e.g. `/uploads/users/avatar.webp`)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [API Endpoints](#3-api-endpoints)
   - [Auth](#31-auth)
   - [Users](#32-users)
   - [Prestataires](#33-prestataires)
   - [Categories](#34-categories)
   - [Services](#35-services)
   - [Service Requests](#36-service-requests)
   - [Reviews](#37-reviews)
   - [Reports](#38-reports)
   - [Admin](#39-admin)
4. [DTOs & Schemas](#4-dtos--schemas)
5. [Database Models](#5-database-models)
6. [Business Logic Notes](#6-business-logic-notes)
7. [Integration Notes for Angular](#7-integration-notes-for-angular)

---

## 1. Overview

The backend is a RESTful API built with **NestJS** (Express adapter), **TypeORM**, and **PostgreSQL**. All modules follow a Controller → Service → Repository pattern.

### Modules & Responsibilities

| Module | Prefix | Responsibility |
|---|---|---|
| `AuthModule` | `/auth` | Registration, email verification, login, password reset |
| `UsersModule` | `/users` | Authenticated user profile management |
| `PrestatairesModule` | `/prestataires` | Service-provider application submission with file uploads |
| `CategoriesModule` | `/categories` | Category / sub-category CRUD (admin-managed) |
| `ServicesModule` | `/services` | Service listing, creation, update, soft-delete |
| `ServiceRequestsModule` | `/service-requests` | Request lifecycle between clients and prestataires |
| `ReviewsModule` | `/reviews` | Review creation and listing |
| `ReportsModule` | `/reports` | User-submitted abuse reports |
| `AdminModule` | `/admin` | Moderation actions (approve/reject, suspend, pardon, delete) |
| `MailModule` | *(internal)* | Transactional email (verification, notifications) |

### Global Middleware

| Layer | Behaviour |
|---|---|
| `ValidationPipe` | `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true` — unknown fields are rejected |
| `TransformInterceptor` | Wraps every success response in `{ "message": "success", "data": <payload> }` |
| `HttpExceptionFilter` | Wraps every error in `{ "statusCode", "path", "error", "timestamp" }` |
| `useStaticAssets` | Serves `./uploads/` directory at `/uploads/` |
| CORS | Configurable via `CORS_ORIGIN` env var (comma-separated origins or `*`) |

---

## 2. Authentication

### Flow

1. **Register** → account created with role `client`; verification email sent.
2. **Verify email** → click link containing a UUID token; `is_email_verified` set to `true`.
3. **Login** → returns `access_token` (JWT Bearer).
4. All protected routes require `Authorization: Bearer <token>`.
5. On each request the JWT strategy reloads the user from DB and checks `is_suspended`.

### JWT Payload

```json
{ "sub": "<user-uuid>", "role": "client|prestataire|admin" }
```

### Required Header (protected routes)

```
Authorization: Bearer <access_token>
```

### Guards

| Guard | Applied by | Effect |
|---|---|---|
| `JwtAuthGuard` | `@UseGuards(JwtAuthGuard)` | Validates JWT; throws `401` if invalid/expired/user-not-found |
| `RolesGuard` | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` | Checks `user.role`; throws `401` (message: "Insufficient role") if not matching |

> **Suspended account:** The JWT strategy throws `403 Forbidden` with `{ "message": "Account suspended", "reasons": [...adminActions] }` if `user.is_suspended` is `true`.

---

## 3. API Endpoints

> All success responses are wrapped: `{ "message": "success", "data": <payload> }`
> All error responses follow: `{ "statusCode": N, "path": "...", "error": {...}, "timestamp": "..." }`

---

### 3.1 Auth

#### `POST /auth/register`

Register a new client account. Triggers a verification email.

| | |
|---|---|
| **Controller method** | `AuthController.register` |
| **Service method** | `AuthService.register` |
| **Auth** | Public |

**Request Body**

```json
{
  "name": "Khaled Ali",
  "email": "khaled@example.com",
  "password": "strongPassword123"
}
```

**Success `201`**

```json
{
  "message": "success",
  "data": {
    "id": "uuid",
    "email": "khaled@example.com",
    "name": "Khaled Ali"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| `400` | Email already exists |
| `400` | Validation failure (missing/invalid fields) |

---

#### `GET /auth/verify-email?token=<uuid>`

Verify account email using the UUID token sent by email.

| | |
|---|---|
| **Auth** | Public |
| **Query Param** | `token` (UUID, required) |

**Success `200`**

```json
{ "message": "success", "data": { "verified": true } }
```

**Errors**

| Status | Condition |
|---|---|
| `400` | Token invalid, expired, or already used |

---

#### `POST /auth/login`

Authenticate and receive a JWT access token.

| | |
|---|---|
| **Auth** | Public |

**Request Body**

```json
{
  "email": "khaled@example.com",
  "password": "strongPassword123"
}
```

**Success `200`**

```json
{
  "message": "success",
  "data": {
    "access_token": "<jwt>"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| `401` | Invalid credentials |
| `401` | Email not verified |
| `401` | Account suspended |

---

#### `POST /auth/forgot-password`

Request a password reset email. Always returns `{ sent: true }` to prevent email enumeration.

| | |
|---|---|
| **Auth** | Public |

**Request Body**

```json
{ "email": "khaled@example.com" }
```

**Success `200`**

```json
{ "message": "success", "data": { "sent": true } }
```

> If the email does not exist, the response is still `{ sent: true }`.

---

#### `POST /auth/reset-password`

Reset password using the token from the password-reset email.

| | |
|---|---|
| **Auth** | Public |

**Request Body**

```json
{
  "token": "9d8e9d12-81f6-4991-9930-bd37ef0ea6da",
  "password": "newStrongPassword123"
}
```

**Success `200`**

```json
{ "message": "success", "data": { "updated": true } }
```

**Errors**

| Status | Condition |
|---|---|
| `400` | Token invalid, expired, or already used |

---

### 3.2 Users

> All endpoints require `Authorization: Bearer <token>`.

#### `GET /users/me`

Get the current authenticated user's profile.

| | |
|---|---|
| **Auth** | JWT (any role) |
| **Service method** | `UsersService.me` |

**Success `200`**

```json
{
  "message": "success",
  "data": {
    "role": "client",
    "name": "Khaled Ali",
    "phone_number": "+212600000000",
    "date_of_birth": "1998-10-01",
    "address": "Casablanca",
    "image_url": "/uploads/users/abc.webp",
    "prestataire_application": null
  }
}
```

> `prestataire_application` is `null` if the user has never applied. If they have, it includes:
> ```json
> {
>   "status": "pending|approved|rejected",
>   "rejected_at": null,
>   "rejection_reason": null,
>   "reapplication_count": 0,
>   "can_apply": true,
>   "cooldown": {
>     "is_on_cooldown": false,
>     "retry_at": null,
>     "remaining_seconds": 0,
>     "remaining_minutes": 0,
>     "rejection_reason": null
>   }
> }
> ```

---

#### `PATCH /users/me/data`

Update editable profile fields (no image).

| | |
|---|---|
| **Auth** | JWT (any role) |
| **Content-Type** | `application/json` |

**Request Body** (all fields optional)

```json
{
  "name": "New Name",
  "phone_number": "+212600000000",
  "date_of_birth": "1998-10-01",
  "address": "Casablanca"
}
```

**Success `200`** — Returns updated profile (same shape as `GET /users/me`).

---

#### `PATCH /users/me/image`

Update profile avatar. Accepted: `image/*` ≤ 5 MB. Stored as `.webp`.

| | |
|---|---|
| **Auth** | JWT (any role) |
| **Content-Type** | `multipart/form-data` |

**Form Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `image` | file | Yes | `image/*`, max 5 MB |

**Success `200`** — Returns updated profile.

**Errors**

| Status | Condition |
|---|---|
| `400` | No image provided |
| `400` | Invalid file type (not `image/*`) |

---

#### `PATCH /users/me/password`

Change the currently authenticated user's password.

| | |
|---|---|
| **Auth** | JWT (any role) |

**Request Body**

```json
{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

**Success `200`**

```json
{ "message": "success", "data": { "updated": true } }
```

**Errors**

| Status | Condition |
|---|---|
| `401` | `current_password` is incorrect |
| `400` | `new_password` equals `current_password` |

---

### 3.3 Prestataires

#### `POST /prestataires/application`

Submit or resubmit a prestataire application. Includes profile info and supporting documents.

| | |
|---|---|
| **Auth** | JWT (any role — typically `client`) |
| **Content-Type** | `multipart/form-data` |

**Form Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | e.g. `"Certified Electrician"` |
| `bio` | string | Yes | e.g. `"5 years of experience"` |
| `doc_types[]` | string (enum) | Yes | One per file, same order as `documents[]`. Values: `id_card`, `diploma`, `certificate`, `other` |
| `documents[]` | file | Yes | `image/*` or `application/pdf`, max 10 MB each, max 10 files |

> `doc_types` can be sent as repeated form fields, a comma-separated string, or a JSON array string like `["id_card","diploma"]`.

**Success `201`**

```json
{
  "message": "success",
  "data": {
    "mode": "apply | update_pending | reapply",
    "profile": { ...PrestataireProfile }
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| `400` | Already approved — cannot reapply |
| `400` | Reapplication cooldown not elapsed (48 h after rejection) — includes `retry_at` and `remaining_seconds` |
| `400` | `doc_types` length ≠ number of uploaded files |
| `400` | No documents uploaded |
| `400` | Invalid file type |

---

### 3.4 Categories

#### `GET /categories`

List all active (non-deleted) categories with their sub-categories.

| | |
|---|---|
| **Auth** | Public |

**Success `200`**

```json
{
  "message": "success",
  "data": [
    {
      "id": "uuid",
      "name": "Home Repair",
      "status": true,
      "sous_categories": [
        { "id": "uuid", "name": "Plumbing", "status": true, ... }
      ]
    }
  ]
}
```

---

#### `POST /categories`

Create a new category.

| | |
|---|---|
| **Auth** | JWT + Admin role |

**Request Body**

```json
{ "name": "Home Repair", "status": true }
```

**Success `201`** — Returns created `Category` entity.

---

#### `PATCH /categories/:id`

Update a category.

| | |
|---|---|
| **Auth** | JWT + Admin role |
| **URL Param** | `id` (UUID) |

**Request Body** (all fields optional)

```json
{ "name": "Updated Name", "status": false }
```

---

#### `DELETE /categories/:id`

Soft-delete a category.

| | |
|---|---|
| **Auth** | JWT + Admin role |
| **URL Param** | `id` (UUID) |

**Success `200`**

```json
{ "message": "success", "data": { "deleted": true } }
```

---

#### `POST /categories/sous-categories`

Create a new sub-category.

| | |
|---|---|
| **Auth** | JWT + Admin role |

**Request Body**

```json
{
  "category_id": "uuid",
  "name": "Plumbing"
}
```

---

#### `PATCH /categories/sous-categories/:id`

Update a sub-category.

| | |
|---|---|
| **Auth** | JWT + Admin role |
| **URL Param** | `id` (UUID) |

**Request Body** (fields optional)

```json
{ "name": "Updated Name" }
```

---

#### `DELETE /categories/sous-categories/:id`

Soft-delete a sub-category.

| | |
|---|---|
| **Auth** | JWT + Admin role |

**Success `200`** — `{ "deleted": true }`

---

### 3.5 Services

#### `GET /services`

List active services with optional filtering and pagination.

| | |
|---|---|
| **Auth** | Public |

**Query Parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `categoryId` | UUID | — | Filter by category |
| `sousCategoryId` | UUID | — | Filter by sub-category |
| `region` | string | — | Case-insensitive partial match on prestataire address |
| `sortBy` | `price \| date \| reviews` | `date` | Sort field |
| `order` | `asc \| desc` | `desc` | Sort direction |
| `page` | integer ≥ 1 | `1` | Page number |
| `limit` | integer 1–100 | `10` | Page size |

**Success `200`**

```json
{
  "message": "success",
  "data": {
    "data": [ ...Service[] ],
    "total": 42,
    "page": 1,
    "limit": 10
  }
}
```

---

#### `GET /services/:id`

Get service details with paginated reviews.

| | |
|---|---|
| **Auth** | Public |
| **URL Param** | `id` (UUID) |

**Query Parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer ≥ 1 | `1` | Review page. Page > 1 returns reviews only |
| `q` | string | — | Search in review comment or client name |

**Success `200` — page = 1**

```json
{
  "message": "success",
  "data": {
    "search_mode": "default | ranked",
    "service": { ...Service },
    "prestataire": { ...User },
    "reviews": [ ...Review[] ],
    "review_summary": { "total": 12, "average_score": 4.5 },
    "pagination": { "page": 1, "limit": 5, "total": 12, "totalPages": 3 }
  }
}
```

**Success `200` — page > 1** (reviews only)

```json
{
  "message": "success",
  "data": {
    "search_mode": "default | ranked",
    "reviews": [ ...Review[] ],
    "pagination": { ... }
  }
}
```

---

#### `POST /services`

Create a service. Only approved prestataires can create services.

| | |
|---|---|
| **Auth** | JWT (role: `prestataire`, application: `approved`) |
| **Content-Type** | `multipart/form-data` |

**Form Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | |
| `description` | string | Yes | |
| `price` | numeric string | Yes | e.g. `"120.00"` |
| `sous_category_id` | UUID | No | |
| `image` | file | No | `image/*`, max 5 MB, stored as `.webp` |

**Success `201`** — Returns created `Service` entity.

**Errors**

| Status | Condition |
|---|---|
| `403` | User is not a prestataire |
| `400` | Prestataire profile not approved |

---

#### `PATCH /services/:id`

Update a service. Prestataire must own the service.

| | |
|---|---|
| **Auth** | JWT (role: `prestataire`) |
| **Content-Type** | `multipart/form-data` |
| **URL Param** | `id` (UUID) |

**Form Fields** (all optional)

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `description` | string | |
| `price` | numeric string | |
| `sous_category_id` | UUID | |
| `image` | file | Replaces existing image |

**Errors**

| Status | Condition |
|---|---|
| `404` | Service not found |
| `403` | Service does not belong to user |

---

#### `DELETE /services/:id?mode=pause|delete`

Pause or soft-delete a service.

| | |
|---|---|
| **Auth** | JWT (role: `prestataire`) |
| **URL Param** | `id` (UUID) |
| **Query Param** | `mode` — `pause` (default) or `delete` |

**Success `200`**

- `mode=pause`: `{ "paused": true }`
- `mode=delete`: `{ "deleted": true }`

---

### 3.6 Service Requests

> All endpoints require `Authorization: Bearer <token>`.

#### `POST /service-requests`

Create a service request (client → prestataire). Triggers an email notification to the prestataire.

| | |
|---|---|
| **Auth** | JWT (role: `client`) |

**Request Body**

```json
{
  "service_id": "uuid",
  "client_message": "Please come tomorrow afternoon"
}
```

**Success `201`** — Returns created `ServiceRequest` entity.

**Errors**

| Status | Condition |
|---|---|
| `404` | Service not found or soft-deleted |

---

#### `PATCH /service-requests/:id/transition`

Transition a service request to a new status.

| | |
|---|---|
| **Auth** | JWT (client or prestataire who owns the request) |
| **URL Param** | `id` (UUID) |

**Request Body**

```json
{ "status": "accepted" }
```

**Allowed transitions:**

| From | To | Who |
|---|---|---|
| `pending` | `accepted` | prestataire |
| `pending` | `rejected` | prestataire |
| `pending` | `cancelled` | client |
| `accepted` | `in_progress` | prestataire |
| `accepted` | `cancelled` | prestataire |
| `in_progress` | `done` | prestataire |
| `in_progress` | `cancelled` | prestataire |
| `done` | *(terminal)* | — |
| `rejected` | *(terminal)* | — |
| `cancelled` | *(terminal)* | — |

**Success `200`** — Returns updated `ServiceRequest` entity.

**Errors**

| Status | Condition |
|---|---|
| `404` | Request not found |
| `403` | Not the client or prestataire of the request |
| `403` | Role not permitted for the requested transition |
| `400` | Transition not allowed from current status |

---

#### `GET /service-requests/history`

Get the current client's request history.

| | |
|---|---|
| **Auth** | JWT (role: `client`) |

**Success `200`** — Array of history items:

```json
{
  "message": "success",
  "data": [
    {
      "id": "uuid",
      "status": "done",
      "start_date": "2026-04-01T10:00:00.000Z",
      "service": { "id": "uuid", "title": "Plumbing", "image_url": null },
      "prestataire": { "id": "uuid", "name": "Ali", "email": "ali@example.com", "phone_number": null, "image_url": null },
      "can_cancel": false,
      "can_review": true,
      "review_id": null
    }
  ]
}
```

---

#### `GET /service-requests/history/:id`

Get a single history item for the current client.

| | |
|---|---|
| **Auth** | JWT (role: `client`) |
| **URL Param** | `id` (UUID) |

**Success `200`** — Single history item (same shape as above).

---

#### `GET /service-requests/missions`

Get the current prestataire's missions.

| | |
|---|---|
| **Auth** | JWT (role: `prestataire`) |

**Success `200`** — Array of mission items:

```json
{
  "message": "success",
  "data": [
    {
      "id": "uuid",
      "status": "pending",
      "start_date": "2026-04-01T10:00:00.000Z",
      "service": { "id": "uuid", "title": "Plumbing", "image_url": null },
      "client": { "id": "uuid", "name": "Khaled", "email": "khaled@example.com", "phone_number": null, "image_url": null },
      "allowed_next_statuses": ["accepted", "rejected", "cancelled"]
    }
  ]
}
```

---

#### `GET /service-requests/missions/:id`

Get a single mission item for the current prestataire.

| | |
|---|---|
| **Auth** | JWT (role: `prestataire`) |
| **URL Param** | `id` (UUID) |

---

### 3.7 Reviews

#### `POST /reviews`

Submit a review for a completed service request. One review per request.

| | |
|---|---|
| **Auth** | JWT (must be the client of the request) |

**Request Body**

```json
{
  "service_request_id": "uuid",
  "score": 5,
  "commentaire": "Excellent service and on time."
}
```

**Success `201`** — Returns created `Review` entity.

**Errors**

| Status | Condition |
|---|---|
| `400` | Request not found or not owned by the client |
| `400` | Request status is not `done` |
| `400` | Review already exists for this request |

---

#### `GET /reviews/prestataire/:id`

List all non-deleted reviews for a prestataire (public).

| | |
|---|---|
| **Auth** | Public |
| **URL Param** | `id` (prestataire user UUID) |

**Success `200`** — Array of `Review` entities with `service_request` and `service` relations.

---

### 3.8 Reports

#### `POST /reports`

Submit a report on a service or review. Exactly one of `service_id` or `review_id` must be provided.

| | |
|---|---|
| **Auth** | JWT (any role) |

**Request Body**

```json
{
  "service_id": "uuid",
  "comment": "This service listing contains misleading information."
}
```

*or*

```json
{
  "review_id": "uuid",
  "comment": "Inappropriate content in this review."
}
```

**Success `201`** — Returns created `Report` entity.

**Errors**

| Status | Condition |
|---|---|
| `400` | Both `service_id` and `review_id` provided, or neither |
| `404` | Target service or review not found |

---

#### `GET /reports`

List all reports (admin only). Optional status filter.

| | |
|---|---|
| **Auth** | JWT + Admin role |

**Query Parameters**

| Param | Type | Description |
|---|---|---|
| `status` | `unseen \| seen` | Filter by report status |

**Success `200`** — Array of `Report` entities with `reporter`, `service`, and `review` relations.

---

#### `PATCH /reports/:id/seen`

Mark a report as seen.

| | |
|---|---|
| **Auth** | JWT + Admin role |
| **URL Param** | `id` (UUID) |

**Success `200`** — Returns updated `Report` entity.

---

### 3.9 Admin

> All endpoints require `Authorization: Bearer <token>` with role `admin`.

#### `DELETE /admin/reviews/:id`

Soft-delete a review and increment the client's `deleted_review_count`. If count reaches **5**, the client is automatically suspended.

| | |
|---|---|
| **URL Param** | `id` (review UUID) |

**Request Body**

```json
{ "reason": "Policy violation: abusive content" }
```

**Success `200`**

```json
{ "message": "success", "data": { "deleted": true, "suspended": false } }
```

---

#### `DELETE /admin/services/:id`

Soft-delete a service and increment the prestataire's `deleted_service_count`. If count reaches **3**, the prestataire is automatically suspended — all their services are set to `suspended` status and all active/pending requests for those services are cancelled (clients are emailed).

| | |
|---|---|
| **URL Param** | `id` (service UUID) |

**Request Body**

```json
{ "reason": "Policy violation" }
```

**Success `200`**

```json
{ "message": "success", "data": { "deleted": true, "suspended": true } }
```

---

#### `PATCH /admin/prestataires/:id/approve`

Approve a prestataire application. Sets profile status to `approved`, upgrades user role to `prestataire`, sends notification email.

| | |
|---|---|
| **URL Param** | `id` (prestataire **profile** UUID) |

**Success `200`** — `{ "approved": true }`

---

#### `PATCH /admin/prestataires/:id/reject`

Reject a prestataire application. Records `rejected_at`, sets `rejection_reason`, and sends a notification email.

| | |
|---|---|
| **URL Param** | `id` (prestataire **profile** UUID) |

**Request Body**

```json
{ "reason": "Insufficient documentation" }
```

**Success `200`** — `{ "rejected": true }`

---

#### `GET /admin/users`

List all users ordered by registration date (newest first).

**Success `200`** — Array of `User` entities (all fields, **including** `password` hash — handle with care on the frontend).

---

#### `GET /admin/prestataires`

List all pending prestataire applications with user relation, ordered by `created_at` descending.

**Success `200`** — Array of `PrestataireProfile` entities with embedded `user`.

---

#### `PATCH /admin/users/:id/suspend`

Manually suspend a user with a reason. Does not modify counters.

| | |
|---|---|
| **URL Param** | `id` (user UUID) |

**Request Body**

```json
{ "reason": "Multiple complaints" }
```

**Success `200`**

```json
{
  "message": "success",
  "data": {
    "suspended": true,
    "deleted_service_count": 1,
    "deleted_review_count": 2
  }
}
```

---

#### `PATCH /admin/users/:id/reinstate`

Lift a suspension on a user.

| | |
|---|---|
| **URL Param** | `id` (user UUID) |

**Success `200`** — `{ "reinstated": true }`

---

#### `PATCH /admin/users/:id/pardon/service/:amount`

Reduce a user's `deleted_service_count` by `amount` (1–3).

| | |
|---|---|
| **URL Params** | `id` (user UUID), `amount` (integer 1–3) |

**Success `200`**

```json
{
  "message": "success",
  "data": {
    "pardoned": true,
    "deleted_service_count": 0,
    "deleted_review_count": 2,
    "is_suspended": false
  }
}
```

**Errors** — `400` if `amount` not in 1–3.

---

#### `PATCH /admin/users/:id/pardon/review/:amount`

Reduce a user's `deleted_review_count` by `amount` (1–5).

| | |
|---|---|
| **URL Params** | `id` (user UUID), `amount` (integer 1–5) |

**Success `200`** — Same shape as service pardon.

**Errors** — `400` if `amount` not in 1–5.

---

## 4. DTOs & Schemas

### `RegisterDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `name` | string | `@IsString` | Yes |
| `email` | string | `@IsEmail` | Yes |
| `password` | string | `@IsString`, `@MinLength(6)` | Yes |

### `LoginDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `email` | string | `@IsEmail` | Yes |
| `password` | string | `@IsString` | Yes |

### `ForgotPasswordDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `email` | string | `@IsEmail` | Yes |

### `ResetPasswordDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `token` | string | `@IsUUID` | Yes |
| `password` | string | `@IsString`, `@MinLength(6)` | Yes |

### `UpdateUserDataDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `name` | string | `@IsString` | No |
| `phone_number` | string | `@IsString` | No |
| `date_of_birth` | string | `@IsDateString` (ISO 8601) | No |
| `address` | string | `@IsString` | No |

### `ChangePasswordDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `current_password` | string | `@IsString` | Yes |
| `new_password` | string | `@IsString`, `@MinLength(6)` | Yes |

### `SubmitPrestataireApplicationDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `title` | string | `@IsString`, `@IsNotEmpty` | Yes |
| `bio` | string | `@IsString`, `@IsNotEmpty` | Yes |
| `doc_types` | `DocumentType[]` | `@IsArray`, `@ArrayMinSize(1)`, `@IsEnum(DocumentType, { each: true })` | Yes |

### `CategoryDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `name` | string | `@IsString` | Yes |
| `status` | boolean | `@IsBoolean` | No |

### `SousCategoryDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `category_id` | string | `@IsUUID` | Yes |
| `name` | string | `@IsString` | Yes |

### `CreateServiceDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `title` | string | `@IsString` | Yes |
| `description` | string | `@IsString` | Yes |
| `price` | string | `@IsNumberString` | Yes |
| `sous_category_id` | string | `@IsUUID` | No |

### `FilterServicesDto`

| Field | Type | Default | Validation |
|---|---|---|---|
| `categoryId` | UUID | — | `@IsUUID` |
| `sousCategoryId` | UUID | — | `@IsUUID` |
| `region` | string | — | `@IsString` |
| `sortBy` | `price\|date\|reviews` | `date` | `@IsEnum(ServicesSortBy)` |
| `order` | `asc\|desc` | `desc` | `@IsEnum(SortOrder)` |
| `page` | integer | `1` | `@IsInt @Min(1)` |
| `limit` | integer | `10` | `@IsInt @Min(1) @Max(100)` |

### `ServiceDetailsQueryDto`

| Field | Type | Default | Validation |
|---|---|---|---|
| `page` | integer | `1` | `@IsInt @Min(1)` |
| `q` | string | — | `@IsString` |

### `CreateServiceRequestDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `service_id` | string | `@IsUUID` | Yes |
| `client_message` | string | `@IsString` | No |

### `TransitionServiceRequestDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `status` | `ServiceRequestStatus` | `@IsEnum(ServiceRequestStatus)` | Yes |

### `CreateReviewDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `service_request_id` | string | `@IsUUID` | Yes |
| `score` | integer | `@IsInt @Min(1) @Max(5)` | Yes |
| `commentaire` | string | `@IsString` | No |

### `CreateReportDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `service_id` | string | `@IsUUID` | No (exclusive-or with `review_id`) |
| `review_id` | string | `@IsUUID` | No (exclusive-or with `service_id`) |
| `comment` | string | `@IsString @MinLength(3)` | Yes |

### `ListReportsQueryDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `status` | `unseen\|seen` | `@IsEnum(ReportStatus)` | No |

### `ReasonDto`

| Field | Type | Validation | Required |
|---|---|---|---|
| `reason` | string | `@IsString @MinLength(3)` | Yes |

---

## 5. Database Models

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | varchar(100) | |
| `email` | varchar (unique) | |
| `password` | varchar | bcrypt hash |
| `phone_number` | varchar | nullable |
| `date_of_birth` | date | nullable |
| `address` | varchar | nullable |
| `image_url` | varchar | nullable; path relative to `/uploads/` |
| `role` | enum | `client`, `prestataire`, `admin` |
| `is_active` | boolean | default `true` |
| `is_suspended` | boolean | default `false` |
| `is_email_verified` | boolean | default `false` |
| `deleted_review_count` | smallint | incremented by admin; threshold 5 → auto-suspend |
| `deleted_service_count` | smallint | incremented by admin; threshold 3 → auto-suspend |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `deleted_at` | timestamp | soft-delete |

### `prestataire_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users, unique) | |
| `application_status` | enum | `pending`, `approved`, `rejected` |
| `doc_validation` | boolean | set to `true` when admin approves |
| `title` | varchar | nullable |
| `bio` | text | nullable |
| `reapplication_count` | smallint | incremented on each resubmission after rejection |
| `rejected_at` | timestamp | nullable |
| `rejection_reason` | text | nullable |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `documents`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `prestataire_id` | UUID (FK → users) | |
| `doc_url` | varchar | path relative to `/uploads/` |
| `doc_type` | enum | `id_card`, `diploma`, `certificate`, `other` |
| `created_at` | timestamp | |

### `categories`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | varchar (unique) | |
| `status` | boolean | active/inactive |
| `deleted_at` | timestamp | soft-delete |

### `sous_categories`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `category_id` | UUID (FK → categories, CASCADE delete) | |
| `name` | varchar | |
| `status` | boolean | |
| `deleted_at` | timestamp | soft-delete |

### `services`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `prestataire_id` | UUID (FK → users) | |
| `sous_category_id` | UUID (FK → sous_categories, nullable, SET NULL) | |
| `title` | varchar | |
| `description` | text | |
| `price` | decimal(10,2) | stored as string in TypeORM due to precision |
| `image_url` | varchar | nullable |
| `status` | enum | `active`, `paused`, `suspended` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `deleted_at` | timestamp | soft-delete |

### `service_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `service_id` | UUID (FK → services, CASCADE) | |
| `client_id` | UUID (FK → users) | |
| `prestataire_id` | UUID (FK → users) | denormalized for query convenience |
| `status` | enum | `pending`, `accepted`, `rejected`, `in_progress`, `done`, `cancelled` |
| `client_message` | text | nullable |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `reviews`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `service_request_id` | UUID (FK → service_requests, unique, CASCADE) | one review per request |
| `client_id` | UUID (FK → users) | |
| `score` | smallint | 1–5 (DB-level CHECK constraint) |
| `commentaire` | text | nullable |
| `created_at` | timestamp | |
| `deleted_at` | timestamp | soft-delete |

### `admin_actions`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `admin_id` | UUID (FK → users) | |
| `action_type` | enum | `delete`, `pardon`, `suspend` |
| `target_id` | UUID | nullable; refers to review or service |
| `target_type` | enum | `review`, `service`; nullable |
| `target_user_id` | UUID (FK → users) | user affected |
| `reason` | text | |
| `pardon_amount` | smallint | nullable; only for pardon actions |
| `created_at` | timestamp | |

### `email_tokens`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | |
| `token` | varchar (unique) | UUID v4 |
| `type` | enum | `verification`, `password_reset` |
| `expires_at` | timestamp | verification: 24 h; password reset: 15 min |
| `used` | boolean | marked `true` on consumption |

### `reports`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `reporter_id` | UUID (FK → users) | |
| `service_id` | UUID (FK → services, nullable, SET NULL) | |
| `review_id` | UUID (FK → reviews, nullable, SET NULL) | |
| `comment` | text | |
| `status` | enum | `unseen`, `seen` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### Entity Relationships

```
users ──────────────── prestataire_profiles (1:1)
users ──────────────── documents (1:N)
users ──────────────── services (1:N, as prestataire)
users ──────────────── service_requests (1:N, as client)
users ──────────────── service_requests (1:N, as prestataire)
users ──────────────── reviews (1:N, as client)
users ──────────────── admin_actions (1:N, as admin)
users ──────────────── admin_actions (1:N, as target)
users ──────────────── email_tokens (1:N)
users ──────────────── reports (1:N, as reporter)
categories ─────────── sous_categories (1:N)
sous_categories ─────── services (1:N)
services ───────────── service_requests (1:N)
service_requests ────── reviews (1:1)
services ───────────── reports (1:N)
reviews ────────────── reports (1:N)
```

---

## 6. Business Logic Notes

### User Role Promotion
A user is registered as `client`. Their role is upgraded to `prestataire` only when an admin **approves** their prestataire application (`PATCH /admin/prestataires/:id/approve`). Role downgrade is not implemented.

### Prestataire Application State Machine

```
(none) ──[POST /prestataires/application]──► pending
pending ──[admin approve]──► approved
pending ──[admin reject]──► rejected
rejected ──[48h cooldown]──[POST /prestataires/application]──► pending (reapply)
approved ──► terminal (cannot reapply)
```

- Submitting while `pending` **updates** the existing pending application (does not recount).
- `reapplication_count` is incremented only when reapplying after rejection.

### Service Status
- `active`: visible in public listings.
- `paused`: hidden from listings; can be reactivated via `PATCH /services/:id`.
- `suspended`: set automatically when prestataire is auto-suspended; cannot be unpaused through normal flow.

### Automatic Suspension Rules

| Threshold | Counter | Effect |
|---|---|---|
| `deleted_review_count >= 5` | per-user | User `is_suspended = true` |
| `deleted_service_count >= 3` | per-prestataire | User `is_suspended = true`; all services → `suspended`; all active/pending/accepted/in_progress requests → `cancelled`; client notification emails sent |

### Service Request Transitions (Roles)
- Only the **prestataire** can: `accept`, `reject`, `mark in_progress`, `mark done`.
- Only the **client** can: `cancel` a `pending` request.
- The **prestataire** can also `cancel` an `accepted` or `in_progress` request.
- Terminal statuses (`done`, `rejected`, `cancelled`) accept no further transitions.

### Review Eligibility
A review can only be submitted when:
1. The service request status is `done`.
2. The caller is the `client_id` of the request.
3. No review already exists for that request.

### `price` Field
`price` is stored as `decimal(10,2)` in PostgreSQL but TypeORM returns and accepts it as a **string** (e.g., `"120.00"`). Send it as a string in requests; compare with `parseFloat()` on the frontend.

### `GET /services/:id` Pagination Split
- `page = 1`: full response including service details, prestataire info, and first 5 reviews.
- `page > 1`: reviews only (5 per page). Use this for lazy-loading more reviews without re-fetching service info.

### Review Search Ranking (`q` param on `GET /services/:id`)
When `q` is provided, results are ranked:
1. Exact match on comment or client name.
2. Prefix match.
3. Partial (contains) match.

### File Storage
Uploaded files are stored locally at `./uploads/<subfolder>/`. The `image_url` / `doc_url` returned by the API is the full path from the uploads root (e.g., `users/abc.webp`). Prefix it with `/uploads/` to get the accessible URL.

### Email Token Expiry
| Type | TTL |
|---|---|
| `verification` | 24 hours |
| `password_reset` | 15 minutes |

---

## 7. Integration Notes for Angular

### Base URL

Configure in `environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://localhost:<APP_PORT>'
};
```

### Auth Interceptor

Attach the JWT token to every request:

```typescript
// auth.interceptor.ts
intercept(req: HttpRequest<unknown>, next: HttpHandler) {
  const token = this.authService.getToken(); // read from localStorage / cookie
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next.handle(req);
}
```

### Response Unwrapping Interceptor

Every successful response is wrapped in `{ message: 'success', data: <payload> }`. Unwrap automatically:

```typescript
// transform.interceptor.ts
intercept(req: HttpRequest<unknown>, next: HttpHandler) {
  return next.handle(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body?.message === 'success') {
        return event.clone({ body: event.body.data });
      }
      return event;
    })
  );
}
```

### Error Handling

All errors follow:

```json
{
  "statusCode": 400,
  "path": "/auth/login",
  "error": { "message": "Invalid credentials" },
  "timestamp": "2026-04-28T10:00:00.000Z"
}
```

The `error` field may be a string or an object (e.g., NestJS validation errors return `{ "message": [...], "error": "Bad Request" }`). Read `error.message` defensively.

### File Uploads (FormData)

Use `FormData` and do **not** set `Content-Type` manually — the browser will set `multipart/form-data` with the correct boundary:

```typescript
const form = new FormData();
form.append('title', 'My Service');
form.append('price', '99.99');
form.append('image', file); // File from input
this.http.post(`${environment.apiUrl}/services`, form).subscribe(...);
```

For prestataire application with multiple files:

```typescript
const form = new FormData();
form.append('title', 'Electrician');
form.append('bio', '5 years exp');
files.forEach((file, i) => {
  form.append('documents', file);
  form.append('doc_types', docTypes[i]); // 'id_card' | 'diploma' | etc.
});
this.http.post(`${environment.apiUrl}/prestataires/application`, form).subscribe(...);
```

### Static Image URLs

Build full URLs like:

```typescript
imageUrl(path: string | null): string {
  if (!path) return 'assets/placeholder.png';
  return `${environment.apiUrl}/uploads/${path}`;
}
```

### Common Pitfalls

| Pitfall | Resolution |
|---|---|
| `403` on login | Account is suspended — read `error.reasons[]` for admin action history |
| `401 Insufficient role` | Sending a request to an admin or role-restricted endpoint with wrong role |
| `400 forbidNonWhitelisted` | Sending extra fields not in the DTO — remove them |
| `price` value comparison | Always `parseFloat(service.price)` — it's a decimal string from the API |
| `GET /services/:id` page split | Only page 1 includes the service and prestataire objects; don't re-request them on page > 1 |
| `doc_types` ordering | The `i`-th `doc_types` value must correspond to the `i`-th file in `documents[]` |
| Pardon endpoint | `amount` is a **URL path param**, not a body field: `PATCH /admin/users/:id/pardon/service/2` |
| `GET /admin/users` returns passwords | Filter out or never display the `password` field — it's a bcrypt hash, but still sensitive |
