# HR SaaS Backend — API Documentation

Base URL: **`https://hr-saas-cmra.onrender.com`**

All requests/responses are JSON. All timestamps are ISO-8601. All IDs are UUIDs (v4).

---

## Authentication

Every route except the ones under `/api/auth/**` requires an access token:

```
Authorization: Bearer <accessToken>
```

Access tokens are short-lived (default 1 hour). When one expires, call
`POST /api/auth/refresh` with the refresh token to get a new pair — don't
make the user log in again.

Two roles exist: `ADMIN` and `EMPLOYEE`. Routes under `/api/admin/**`
require `ADMIN`. Routes under `/api/employee/**` accept either role (an
admin can also use employee self-service routes, e.g. to check in/out or
file their own leave).

---

## Pagination

Any endpoint that returns a list is paginated. Control it with query
params:

```
?page=0&size=20&sort=lastName,asc
```

- `page` — zero-indexed page number (default `0`)
- `size` — items per page (default `20`)
- `sort` — optional, `field,asc` or `field,desc`

Paginated responses look like this:

```json
{
  "content": [ /* array of items */ ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 3,
    "totalPages": 1
  }
}
```

---

## Error Responses

Every error, regardless of endpoint, has this shape:

```json
{
  "status": 400,
  "message": "Description of what went wrong",
  "timestamp": "2026-07-20T10:15:30"
}
```

Common status codes: `400` bad request / validation failure, `401`
unauthorized (missing/invalid/expired token, or bad login credentials),
`403` forbidden (wrong role, or acting on someone else's resource), `404`
not found, `409` conflict (duplicate email, already checked in, etc.),
`500` unexpected server error (check server logs if you see this).

---

# Auth Endpoints (public)

## Register a company (tenant registration)

```
POST /api/auth/register-company
Content-Type: application/json
```

Creates a new company workspace and its first Admin user in one step.
Returns tokens immediately — no separate login required after this call.

**Body:**
```json
{
  "companyName": "Acme Inc",
  "industry": "Technology",
  "country": "Nigeria",
  "adminFirstName": "Jane",
  "adminLastName": "Doe",
  "adminEmail": "jane@acme.com",
  "adminPassword": "SecurePass123"
}
```

| Field | Required | Notes |
|---|---|---|
| companyName | yes | |
| industry | no | |
| country | no | |
| adminFirstName | yes | |
| adminLastName | yes | |
| adminEmail | yes | must be valid email format |
| adminPassword | yes | min 8 characters |

**Response `201 Created`:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "9f8a7b6c...",
  "role": "ADMIN",
  "email": "jane@acme.com",
  "companySlug": "acme-inc"
}
```

`companySlug` is auto-generated from `companyName` (lowercase, spaces →
hyphens, deduplicated with `-1`, `-2` suffixes on collision). **Save this
slug** — it's required on every future login for this company.

**cURL:**
```bash
curl -X POST https://hr-saas-cmra.onrender.com/api/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Inc",
    "adminFirstName": "Jane",
    "adminLastName": "Doe",
    "adminEmail": "jane@acme.com",
    "adminPassword": "SecurePass123"
  }'
```

---

## Log in

```
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "jane@acme.com",
  "password": "SecurePass123",
  "companySlug": "acme-inc"
}
```

All three fields are required. `companySlug` is what disambiguates users
across tenants — two different companies can each have a `jane@acme.com`
if their slugs differ.

**Response `200 OK`:** same shape as register-company response.

**cURL:**
```bash
curl -X POST https://hr-saas-cmra.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@acme.com",
    "password": "SecurePass123",
    "companySlug": "acme-inc"
  }'
```

---

## Accept an employee invitation

```
POST /api/auth/accept-invitation
Content-Type: application/json
```

Called by an employee after an admin creates their account and they
receive the invite email. Sets their password and activates the account.

**Body:**
```json
{
  "token": "the-token-from-the-invite-email-link",
  "password": "NewPassword123"
}
```

`password` min 8 characters.

**Response `200 OK`:** empty body.

**Errors:** `400` if the token is invalid, already used, or expired
(invites expire after 72 hours by default).

---

## Refresh an access token

```
POST /api/auth/refresh
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "9f8a7b6c..."
}
```

Rotates the token: the old refresh token is revoked and a brand new
access+refresh pair is returned. Use the new refresh token for the next
refresh.

**Response `200 OK`:** same shape as login response.

**Errors:** `401` if the refresh token is invalid, expired, or already
revoked (e.g. reused after already being rotated once).

---

## Forgot password

```
POST /api/auth/forgot-password
Content-Type: application/json
```

**Body:**
```json
{
  "email": "jane@acme.com",
  "companySlug": "acme-inc"
}
```

**Response `200 OK`:** always returns 200 and an empty body, whether or
not the account exists — this is intentional, to avoid revealing which
emails are registered. If the account exists and is active, a reset link
is emailed (valid 1 hour).

---

## Reset password

```
POST /api/auth/reset-password
Content-Type: application/json
```

**Body:**
```json
{
  "token": "the-token-from-the-reset-email-link",
  "newPassword": "AnotherNewPass123"
}
```

`newPassword` min 8 characters.

**Response `200 OK`:** empty body. All of that user's existing refresh
tokens are revoked as a side effect — they'll need to log in again on any
other device/session.

**Errors:** `400` if the token is invalid, already used, or expired.

---

# Admin Endpoints

All routes below require:
```
Authorization: Bearer <accessToken>
```
for an ADMIN-role user, plus `Content-Type: application/json` on any
request with a body.

## Create an employee

```
POST /api/admin/employees
```

Creates the employee record and emails them an invitation link. The
employee is `PENDING` until they accept the invite and set a password
(see `POST /api/auth/accept-invitation` above).

**Body:**
```json
{
  "email": "employee@acme.com",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+2348012345678",
  "jobTitle": "Software Engineer",
  "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "managerId": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
  "dateOfHire": "2026-01-15"
}
```

| Field | Required | Notes |
|---|---|---|
| email | yes | must be unique within the company |
| firstName | yes | |
| lastName | yes | |
| phone | no | |
| jobTitle | no | |
| departmentId | no | must be a real UUID if present — omit the field entirely rather than sending a placeholder string |
| managerId | no | same as above; must be a real user UUID if present |
| dateOfHire | no | format `YYYY-MM-DD` |

**Response `201 Created`:** the created user object (password hash never
included):
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "email": "employee@acme.com",
  "role": "EMPLOYEE",
  "status": "PENDING",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+2348012345678",
  "jobTitle": "Software Engineer",
  "departmentId": "uuid",
  "managerId": "uuid",
  "dateOfHire": "2026-01-15",
  "createdAt": "2026-07-20T10:00:00",
  "updatedAt": "2026-07-20T10:00:00"
}
```

**Errors:** `409` if the email already exists in this company.

**cURL:**
```bash
curl -X POST https://hr-saas-cmra.onrender.com/api/admin/employees \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@acme.com",
    "firstName": "John",
    "lastName": "Smith"
  }'
```

---

## List employees

```
GET /api/admin/employees?page=0&size=20
```

No body. Returns paginated employees (admins + employees) for the
authenticated user's company.

**Response `200 OK`:** paginated list of user objects (see shape above).

---

## Get a single employee

```
GET /api/admin/employees/{id}
```

`{id}` is the employee's UUID.

**Response `200 OK`:** single user object.
**Errors:** `404` if not found in this company.

---

## Update an employee

```
PUT /api/admin/employees/{id}
```

**Body:** same shape as create-employee. Note: `email` cannot currently
be changed via this endpoint even if included in the body — only profile
fields (name, phone, job title, department, manager, hire date) update.

**Response `200 OK`:** updated user object.

---

## Deactivate an employee

```
PATCH /api/admin/employees/{id}/deactivate
```

No body. Sets status to `SUSPENDED` — they can no longer log in.

**Response `204 No Content`.**

---

## Reactivate an employee

```
PATCH /api/admin/employees/{id}/reactivate
```

No body. Sets status back to `ACTIVE`.

**Response `204 No Content`.**

---

## Create a department

```
POST /api/admin/departments
```

**Body:**
```json
{ "name": "Engineering" }
```

**Response `201 Created`:**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "name": "Engineering",
  "createdAt": "2026-07-20T10:00:00"
}
```

**Errors:** `409` if a department with this name already exists in the
company.

---

## List departments

```
GET /api/admin/departments
```

No body, no pagination — returns a plain array.

**Response `200 OK`:**
```json
[
  { "id": "uuid", "companyId": "uuid", "name": "Engineering", "createdAt": "..." },
  { "id": "uuid", "companyId": "uuid", "name": "Sales", "createdAt": "..." }
]
```

---

## Delete a department

```
DELETE /api/admin/departments/{id}
```

No body.

**Response `204 No Content`.**
**Errors:** `404` if not found in this company.

---

## List all leave requests (company-wide)

```
GET /api/admin/leave-requests?page=0&size=20
```

No body. Returns every employee's leave requests, not just one person's.

**Response `200 OK`:** paginated list of leave request objects:
```json
{
  "content": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "employeeId": "uuid",
      "leaveType": "ANNUAL",
      "startDate": "2026-08-01",
      "endDate": "2026-08-05",
      "reason": "Family vacation",
      "status": "PENDING",
      "reviewedBy": null,
      "reviewedAt": null,
      "reviewNote": null,
      "createdAt": "2026-07-20T10:00:00",
      "updatedAt": "2026-07-20T10:00:00"
    }
  ],
  "page": { "size": 20, "number": 0, "totalElements": 1, "totalPages": 1 }
}
```

`leaveType` is one of: `ANNUAL`, `SICK`, `UNPAID`, `MATERNITY`,
`PATERNITY`, `OTHER`. `status` is one of: `PENDING`, `APPROVED`,
`REJECTED`, `CANCELLED`.

---

## Approve or reject a leave request

```
PATCH /api/admin/leave-requests/{id}/review
```

**Body:**
```json
{
  "approve": true,
  "note": "Enjoy your time off"
}
```

`approve`: `true` sets status to `APPROVED`, `false` sets it to
`REJECTED`. `note` is optional. Triggers an email to the employee
notifying them of the outcome.

**Response `200 OK`:** updated leave request object.

**Errors:** `400` if the request has already been reviewed (only
`PENDING` requests can be reviewed).

---

## List attendance (company-wide)

```
GET /api/admin/attendance?page=0&size=20
```

No body. Note the correct path is `/api/admin/attendance`, **not**
nested under `/employees/`.

**Response `200 OK`:** paginated list of attendance records:
```json
{
  "content": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "employeeId": "uuid",
      "workDate": "2026-07-20",
      "checkIn": "2026-07-20T09:02:11",
      "checkOut": "2026-07-20T17:30:00",
      "status": "PRESENT",
      "createdAt": "2026-07-20T09:02:11"
    }
  ],
  "page": { "size": 20, "number": 0, "totalElements": 1, "totalPages": 1 }
}
```

`status` is one of: `PRESENT`, `ABSENT`, `HALF_DAY`, `ON_LEAVE`.

---

# Employee Endpoints

All routes below require:
```
Authorization: Bearer <accessToken>
```
for either an ADMIN or EMPLOYEE user, plus `Content-Type: application/json`
where a body is sent. These act on the **logged-in user's own** data only
— there's no `{id}` in the path, the identity comes from the token.

## Get my profile

```
GET /api/employee/me
```

No body.

**Response `200 OK`:** the logged-in user's own user object (same shape
as the admin employee object above).

---

## Request leave

```
POST /api/employee/leave-requests
```

**Body:**
```json
{
  "leaveType": "ANNUAL",
  "startDate": "2026-08-01",
  "endDate": "2026-08-05",
  "reason": "Family vacation"
}
```

| Field | Required | Notes |
|---|---|---|
| leaveType | yes | one of `ANNUAL`, `SICK`, `UNPAID`, `MATERNITY`, `PATERNITY`, `OTHER` |
| startDate | yes | `YYYY-MM-DD`, must be today or in the future |
| endDate | yes | `YYYY-MM-DD`, must be today or in the future, and not before `startDate` |
| reason | no | free text |

**Response `201 Created`:** created leave request object, `status: "PENDING"`.

**Errors:** `400` if `endDate` is before `startDate`.

---

## List my leave requests

```
GET /api/employee/leave-requests?page=0&size=20
```

No body. Only returns the logged-in user's own leave requests.

**Response `200 OK`:** paginated list (same shape as admin's leave-requests endpoint).

---

## Cancel my leave request

```
PATCH /api/employee/leave-requests/{id}/cancel
```

No body. Only works on your own request, and only while it's still
`PENDING`.

**Response `204 No Content`.**

**Errors:** `403` if it's not your request. `400` if it's already been
reviewed (approved/rejected) or already cancelled.

---

## Check in

```
POST /api/employee/attendance/check-in
```

No body. Records `checkIn` timestamp for today's date.

**Response `201 Created`:** created attendance record.

**Errors:** `409` if you've already checked in today.

---

## Check out

```
POST /api/employee/attendance/check-out
```

No body. Records `checkOut` timestamp on today's existing record.

**Response `200 OK`:** updated attendance record.

**Errors:** `400` if you haven't checked in today yet. `409` if you've
already checked out today.

---

## List my attendance

```
GET /api/employee/attendance?page=0&size=20
```

No body. Only returns the logged-in user's own attendance history.

**Response `200 OK`:** paginated list (same shape as admin's attendance endpoint).

---

# Quick Testing Walkthrough

1. Register a company → save `accessToken`, `refreshToken`, `companySlug`.
2. As admin, create a department (optional) → save its `id`.
3. As admin, create an employee → they receive an invite email.
4. Employee accepts the invite with the token from their email → sets a password.
5. Employee logs in with `email` + `password` + `companySlug` → gets their own tokens.
6. Employee checks in, files a leave request.
7. Admin reviews (approves/rejects) the leave request.
8. Admin lists all leave requests / attendance to see the results.

Every token pair expires in ~1 hour by default — use `/api/auth/refresh`
rather than logging in again mid-session.