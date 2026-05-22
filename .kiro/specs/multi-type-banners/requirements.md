# Requirements Document

## Introduction

This feature extends the existing Banner model in the Enterfly e-commerce platform to support multiple banner types: main banners, sub banners, and category banners. Administrators will be able to create, update, delete, and manage banners by type through the admin panel, and the storefront will fetch and render the correct banners in their designated slots (hero section, secondary placements, category pages). Category banners will be associated with a specific Category, while main and sub banners are global. The change requires extending the Prisma `Banner` model with a `BannerType` enum and an optional relation to `Category`.

## Glossary

- **Banner_System**: The backend module responsible for storing, validating, and serving banner records (Prisma model + service layer).
- **Admin_API**: The set of HTTP endpoints under `/api` used by authenticated admin users to manage banners (create, read, update, delete).
- **Storefront_API**: The public/read-only HTTP endpoints used by the storefront to fetch banners for display.
- **Admin_Panel**: The Next.js admin UI located under `app/(pages)/adminpannel` used to manage banners.
- **Storefront**: The public-facing Next.js pages (home page, category pages, etc.) that render banners.
- **Banner**: A persistent record describing an image-based promotional element with optional link, status, and type.
- **Banner_Type**: An enum value identifying the slot a banner belongs to. Allowed values: `MAIN`, `SUB`, `CATEGORY`.
- **Banner_Status**: An enum value indicating whether a banner is rendered. Allowed values: `ACTIVE`, `INACTIVE`.
- **Main_Banner**: A banner with `Banner_Type = MAIN`, intended for the storefront hero section.
- **Sub_Banner**: A banner with `Banner_Type = SUB`, intended for secondary placements on the storefront.
- **Category_Banner**: A banner with `Banner_Type = CATEGORY` that is associated with exactly one `Category` record via `categoryId`.
- **Category**: An existing Prisma model representing a product category (`prisma/schema.prisma`).
- **Admin_User**: A `User` record whose `role` field equals `ADMIN`.
- **Image_URL**: A non-empty string referencing a publicly accessible image asset (HTTP/HTTPS URL or storage path).

## Requirements

### Requirement 1: Banner Type Schema Extension

**User Story:** As a platform developer, I want the Banner model to encode banner type and an optional category reference, so that the system can distinguish where each banner is rendered and which category it belongs to.

#### Acceptance Criteria

1. THE Banner_System SHALL define a `BannerType` enum with exactly the values `MAIN`, `SUB`, and `CATEGORY`.
2. THE Banner_System SHALL include a non-nullable `type` field of type `BannerType` on the `Banner` model.
3. THE Banner_System SHALL include a nullable `categoryId` foreign key field on the `Banner` model that references `Category.id`.
4. THE Banner_System SHALL define a nullable relation `category` from `Banner` to `Category` using `categoryId` as the foreign key.
5. THE Banner_System SHALL preserve the existing `Banner` fields `id`, `image`, `link`, `status`, `createdAt`, and `updatedAt` without changing their types or defaults.
6. WHERE existing Banner records exist at migration time, THE Banner_System SHALL set their `type` to `MAIN` as the default backfill value.

### Requirement 2: Create Banners by Type

**User Story:** As an Admin_User, I want to create a banner and choose its type, so that I can place promotional content in the correct storefront slot.

#### Acceptance Criteria

1. WHEN an Admin_User submits a banner creation request with `type = MAIN`, a non-empty `image` Image_URL, and no `categoryId`, THE Admin_API SHALL persist a new Banner record with `type = MAIN`, `categoryId = null`, and `status = ACTIVE` by default and SHALL return the created record with HTTP status `201`.
2. WHEN an Admin_User submits a banner creation request with `type = SUB`, a non-empty `image` Image_URL, and no `categoryId`, THE Admin_API SHALL persist a new Banner record with `type = SUB`, `categoryId = null`, and `status = ACTIVE` by default and SHALL return the created record with HTTP status `201`.
3. WHEN an Admin_User submits a banner creation request with `type = CATEGORY`, a non-empty `image` Image_URL, and a `categoryId` that exists in the `Category` table, THE Admin_API SHALL persist a new Banner record with `type = CATEGORY`, the provided `categoryId`, and `status = ACTIVE` by default and SHALL return the created record with HTTP status `201`.
4. IF a banner creation request is submitted with `type = CATEGORY` and a missing or empty `categoryId`, THEN THE Admin_API SHALL reject the request with HTTP status `400` and SHALL return an error message identifying `categoryId` as required for category banners.
5. IF a banner creation request is submitted with `type = CATEGORY` and a `categoryId` that does not exist in the `Category` table, THEN THE Admin_API SHALL reject the request with HTTP status `400` and SHALL return an error message indicating the category was not found.
6. IF a banner creation request is submitted with `type` set to `MAIN` or `SUB` and a non-null `categoryId`, THEN THE Admin_API SHALL reject the request with HTTP status `400` and SHALL return an error message indicating that `categoryId` is only allowed for category banners.
7. IF a banner creation request is submitted with a missing or empty `image` field, THEN THE Admin_API SHALL reject the request with HTTP status `400` and SHALL return an error message identifying `image` as required.
8. IF a banner creation request is submitted with a `type` value not in `{MAIN, SUB, CATEGORY}`, THEN THE Admin_API SHALL reject the request with HTTP status `400` and SHALL return an error message identifying `type` as invalid.
9. IF a banner creation request is submitted by a User whose `role` is not `ADMIN`, THEN THE Admin_API SHALL reject the request with HTTP status `403`.

### Requirement 3: Update Banners

**User Story:** As an Admin_User, I want to update an existing banner's image, link, status, type, and category, so that I can keep promotional content current.

#### Acceptance Criteria

1. WHEN an Admin_User submits an update request for an existing Banner with valid field values, THE Admin_API SHALL apply the changes to the matching record, update `updatedAt` to the current timestamp, and SHALL return the updated record with HTTP status `200`.
2. WHEN an Admin_User changes a Banner's `type` from `MAIN` or `SUB` to `CATEGORY` and provides an existing `categoryId`, THE Admin_API SHALL set both `type = CATEGORY` and the supplied `categoryId` on the record.
3. WHEN an Admin_User changes a Banner's `type` from `CATEGORY` to `MAIN` or `SUB`, THE Admin_API SHALL set `categoryId` to `null` on that record.
4. IF an update request changes `type` to `CATEGORY` without supplying an existing `categoryId` and the record does not already reference an existing Category, THEN THE Admin_API SHALL reject the request with HTTP status `400` and SHALL return an error message identifying `categoryId` as required.
5. IF an update request supplies a `categoryId` that does not exist in the `Category` table, THEN THE Admin_API SHALL reject the request with HTTP status `400` and SHALL return an error message indicating the category was not found.
6. IF an update request targets a Banner `id` that does not exist, THEN THE Admin_API SHALL return HTTP status `404` and SHALL return an error message indicating the banner was not found.
7. IF an update request is submitted by a User whose `role` is not `ADMIN`, THEN THE Admin_API SHALL reject the request with HTTP status `403`.

### Requirement 4: Delete Banners

**User Story:** As an Admin_User, I want to delete a banner, so that I can remove outdated or incorrect promotional content.

#### Acceptance Criteria

1. WHEN an Admin_User submits a delete request for an existing Banner `id`, THE Admin_API SHALL remove the matching record from the database and SHALL return HTTP status `200` with a confirmation payload.
2. IF a delete request targets a Banner `id` that does not exist, THEN THE Admin_API SHALL return HTTP status `404` and SHALL return an error message indicating the banner was not found.
3. IF a delete request is submitted by a User whose `role` is not `ADMIN`, THEN THE Admin_API SHALL reject the request with HTTP status `403`.
4. WHEN a Category referenced by one or more Category_Banner records is deleted, THE Banner_System SHALL either cascade-delete the related Banner records or set their `categoryId` to `null` and `type` accordingly, and SHALL document the chosen behavior in the design document.

### Requirement 5: Banner Status Management

**User Story:** As an Admin_User, I want to toggle a banner's active status without deleting the record, so that I can temporarily hide banners from the storefront.

#### Acceptance Criteria

1. WHEN an Admin_User submits a status change request setting an existing Banner's `status` to `ACTIVE` or `INACTIVE`, THE Admin_API SHALL persist the new status on the record and SHALL return the updated record with HTTP status `200`.
2. IF a status change request supplies a `status` value not in `{ACTIVE, INACTIVE}`, THEN THE Admin_API SHALL reject the request with HTTP status `400` and SHALL return an error message identifying `status` as invalid.
3. THE Storefront_API SHALL exclude Banner records whose `status` equals `INACTIVE` from all read responses returned to the Storefront.

### Requirement 6: List and Filter Banners in the Admin Panel

**User Story:** As an Admin_User, I want to list and filter banners by type, status, and category, so that I can find and manage banners efficiently.

#### Acceptance Criteria

1. WHEN an Admin_User requests the banner list without filters, THE Admin_API SHALL return all Banner records ordered by `createdAt` descending with HTTP status `200`.
2. WHEN an Admin_User requests the banner list with a `type` filter equal to `MAIN`, `SUB`, or `CATEGORY`, THE Admin_API SHALL return only Banner records whose `type` equals the filter value.
3. WHEN an Admin_User requests the banner list with a `status` filter equal to `ACTIVE` or `INACTIVE`, THE Admin_API SHALL return only Banner records whose `status` equals the filter value.
4. WHEN an Admin_User requests the banner list with a `categoryId` filter, THE Admin_API SHALL return only Banner records whose `categoryId` equals the filter value.
5. WHERE multiple filters are supplied in a single request, THE Admin_API SHALL apply all filters conjunctively (logical AND).
6. IF a list request supplies a `type` value not in `{MAIN, SUB, CATEGORY}`, THEN THE Admin_API SHALL reject the request with HTTP status `400`.
7. IF a list request is submitted by a User whose `role` is not `ADMIN`, THEN THE Admin_API SHALL reject the request with HTTP status `403` before any filter evaluation or database query is performed.

### Requirement 7: Storefront Fetch by Type

**User Story:** As a Storefront visitor, I want to see the correct banners in the hero section, secondary placements, and category pages, so that I can discover relevant promotions.

#### Acceptance Criteria

1. WHEN the Storefront requests Main_Banners, THE Storefront_API SHALL return all Banner records where `type = MAIN` and `status = ACTIVE`, ordered by `createdAt` descending.
2. WHEN the Storefront requests Sub_Banners, THE Storefront_API SHALL return all Banner records where `type = SUB` and `status = ACTIVE`, ordered by `createdAt` descending.
3. WHEN the Storefront requests Category_Banners for a given `categoryId`, THE Storefront_API SHALL return all Banner records where `type = CATEGORY`, `status = ACTIVE`, and `categoryId` equals the supplied value.
4. IF the Storefront requests Category_Banners with a `categoryId` that does not exist in the `Category` table, THEN THE Storefront_API SHALL return an empty list with HTTP status `200`.
5. WHEN no Banner records match the requested type (and category, if applicable), THE Storefront_API SHALL return an empty list with HTTP status `200`.
6. THE Storefront_API SHALL respond to banner list requests within 500 ms under a load of 50 concurrent requests on the staging environment.
7. WHERE a Banner in the response payload has `type = MAIN` or `type = SUB`, THE Storefront_API SHALL omit the `categoryId` field from that Banner's serialized payload.
8. WHERE a Banner in the response payload has `type = CATEGORY`, THE Storefront_API SHALL include the `categoryId` field in that Banner's serialized payload.

### Requirement 8: Admin Panel UI for Multi-Type Banners

**User Story:** As an Admin_User, I want a banner management screen that lets me pick the banner type and a category when applicable, so that I can manage banners without writing API calls manually.

#### Acceptance Criteria

1. THE Admin_Panel SHALL render a banner creation form that includes fields for `image`, `link`, `type`, `status`, and `categoryId`.
2. WHILE the selected `type` in the banner form equals `CATEGORY`, THE Admin_Panel SHALL display a category picker populated from the `Category` table and SHALL mark the category field as required before submission.
3. WHILE the selected `type` in the banner form equals `MAIN` or `SUB`, THE Admin_Panel SHALL hide the category picker and SHALL omit `categoryId` from the submitted payload.
4. THE Admin_Panel SHALL render a banner list view that displays at minimum the columns `image` (thumbnail), `type`, `status`, `category name` (for `CATEGORY` banners), `createdAt`, and action buttons for edit and delete.
5. THE Admin_Panel SHALL provide filter controls for `type`, `status`, and `category` on the banner list view that map to the Admin_API filter parameters defined in Requirement 6.
6. IF the Admin_API returns a validation error, THEN THE Admin_Panel SHALL display the returned error message in the form without losing the user's other field values.
