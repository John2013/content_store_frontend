# Manual Testing Checklist for API Fixes

This comprehensive checklist covers all manual testing that should be performed before deploying the API fixes to production.

## Prerequisites

- [ ] Backend is running and accessible
- [ ] Frontend is running and accessible
- [ ] Test database has sample data (categories, products, users)
- [ ] Staff user account is available for testing
- [ ] Non-staff user account is available for testing
- [ ] API documentation is accessible

## 1. Category Endpoints Testing

### 1.1 GET /api/store/categories (List)

#### Without include_counts Parameter

- [ ] Request: `GET /api/store/categories`
- [ ] Response status: 200 OK
- [ ] Response contains array of categories
- [ ] Each category has: id, name, description, created_at
- [ ] No product_count field present

#### With include_counts=true Parameter

- [ ] Request: `GET /api/store/categories?include_counts=true`
- [ ] Response status: 200 OK
- [ ] Response contains array of categories
- [ ] Each category has: id, name, description, created_at, product_count
- [ ] product_count values are correct (count active products only)
- [ ] Categories with no products show product_count: 0

#### With include_counts=false Parameter

- [ ] Request: `GET /api/store/categories?include_counts=false`
- [ ] Response status: 200 OK
- [ ] No product_count field present

### 1.2 GET /api/store/categories/{category_id} (Detail)

#### Existing Category

- [ ] Request: `GET /api/store/categories/1`
- [ ] Response status: 200 OK
- [ ] Response contains: id, name, description, created_at, product_count
- [ ] product_count is correct (counts only active products)

#### Non-Existent Category

- [ ] Request: `GET /api/store/categories/99999`
- [ ] Response status: 404 Not Found

#### Invalid Category ID

- [ ] Request: `GET /api/store/categories/abc`
- [ ] Response status: 422 Unprocessable Entity

### 1.3 PUT /api/store/categories/{category_id} (Full Update)

#### Without Authentication

- [ ] Request: `PUT /api/store/categories/1` (no auth header)
- [ ] Response status: 401 Unauthorized

#### As Non-Staff User

- [ ] Request: `PUT /api/store/categories/1` (non-staff token)
- [ ] Response status: 403 Forbidden

#### As Staff User - Valid Data

- [ ] Request: `PUT /api/store/categories/1` with valid data
- [ ] Request body: `{"name": "Updated Category", "description": "Updated description"}`
- [ ] Response status: 200 OK
- [ ] Response contains updated category
- [ ] All fields are updated correctly
- [ ] Verify in database that changes persisted

#### As Staff User - Missing Required Field

- [ ] Request: `PUT /api/store/categories/1` with missing name
- [ ] Request body: `{"description": "Test"}`
- [ ] Response status: 422 Unprocessable Entity

#### As Staff User - Empty Name

- [ ] Request: `PUT /api/store/categories/1` with empty name
- [ ] Request body: `{"name": "", "description": "Test"}`
- [ ] Response status: 422 Unprocessable Entity

#### As Staff User - Name Too Long (> 100 chars)

- [ ] Request: `PUT /api/store/categories/1` with 101-char name
- [ ] Response status: 422 Unprocessable Entity

#### As Staff User - Non-Existent Category

- [ ] Request: `PUT /api/store/categories/99999` with valid data
- [ ] Response status: 404 Not Found

### 1.4 PATCH /api/store/categories/{category_id} (Partial Update)

#### Without Authentication

- [ ] Request: `PATCH /api/store/categories/1` (no auth header)
- [ ] Response status: 401 Unauthorized

#### As Non-Staff User

- [ ] Request: `PATCH /api/store/categories/1` (non-staff token)
- [ ] Response status: 403 Forbidden

#### As Staff User - Update Name Only

- [ ] Request: `PATCH /api/store/categories/1`
- [ ] Request body: `{"name": "Patched Name"}`
- [ ] Response status: 200 OK
- [ ] Name is updated
- [ ] Description remains unchanged
- [ ] Verify in database

#### As Staff User - Update Description Only

- [ ] Request: `PATCH /api/store/categories/1`
- [ ] Request body: `{"description": "Patched description"}`
- [ ] Response status: 200 OK
- [ ] Description is updated
- [ ] Name remains unchanged
- [ ] Verify in database

#### As Staff User - Update Both Fields

- [ ] Request: `PATCH /api/store/categories/1`
- [ ] Request body: `{"name": "New Name", "description": "New description"}`
- [ ] Response status: 200 OK
- [ ] Both fields are updated
- [ ] Verify in database

#### As Staff User - Empty Body

- [ ] Request: `PATCH /api/store/categories/1`
- [ ] Request body: `{}`
- [ ] Response status: 200 OK (no changes)

#### As Staff User - Non-Existent Category

- [ ] Request: `PATCH /api/store/categories/99999` with valid data
- [ ] Response status: 404 Not Found

### 1.5 DELETE /api/store/categories/{category_id} (BREAKING CHANGE)

#### Without Authentication

- [ ] Request: `DELETE /api/store/categories/1` (no auth header)
- [ ] Response status: 401 Unauthorized

#### As Non-Staff User

- [ ] Request: `DELETE /api/store/categories/1` (non-staff token)
- [ ] Response status: 403 Forbidden

#### As Staff User - Existing Category

- [ ] Request: `DELETE /api/store/categories/1`
- [ ] Response status: 204 No Content
- [ ] Category is deleted from database
- [ ] Subsequent GET returns 404

#### As Staff User - Non-Existent Category

- [ ] Request: `DELETE /api/store/categories/99999`
- [ ] Response status: 404 Not Found

#### Verify Old Endpoint No Longer Works

- [ ] Request: `DELETE /api/store/categories?category_id=1`
- [ ] Response status: 404 or 405 (old endpoint removed)

## 2. Product Endpoints Testing

### 2.1 GET /api/store/products (List with Filtering)

#### Default Behavior (No Parameters)

- [ ] Request: `GET /api/store/products`
- [ ] Response status: 200 OK
- [ ] Response contains only active products (is_active=true)
- [ ] Inactive products are not included

#### With include_inactive=false

- [ ] Request: `GET /api/store/products?include_inactive=false`
- [ ] Response status: 200 OK
- [ ] Response contains only active products

#### With include_inactive=true (No Auth)

- [ ] Request: `GET /api/store/products?include_inactive=true` (no auth)
- [ ] Response status: 200 OK
- [ ] Response contains only active products (parameter ignored)

#### With include_inactive=true (Non-Staff User)

- [ ] Request: `GET /api/store/products?include_inactive=true` (non-staff token)
- [ ] Response status: 200 OK
- [ ] Response contains only active products (parameter ignored)

#### With include_inactive=true (Staff User)

- [ ] Request: `GET /api/store/products?include_inactive=true` (staff token)
- [ ] Response status: 200 OK
- [ ] Response contains all products (active and inactive)

### 2.2 PUT /api/store/products/{product_id} (Full Update)

#### Without Authentication

- [ ] Request: `PUT /api/store/products/1` (no auth header)
- [ ] Response status: 401 Unauthorized

#### As Non-Staff User

- [ ] Request: `PUT /api/store/products/1` (non-staff token)
- [ ] Response status: 403 Forbidden

#### As Staff User - Valid Data

- [ ] Request: `PUT /api/store/products/1` with valid data
- [ ] Request body includes: title, price, content_text, is_active
- [ ] Response status: 200 OK
- [ ] Response contains updated product
- [ ] All fields are updated correctly
- [ ] Verify in database

#### As Staff User - Missing Required Field

- [ ] Request: `PUT /api/store/products/1` with missing title
- [ ] Response status: 422 Unprocessable Entity

#### As Staff User - Invalid Price (Negative)

- [ ] Request: `PUT /api/store/products/1` with price: -10
- [ ] Response status: 422 Unprocessable Entity

#### As Staff User - Invalid Price (Zero)

- [ ] Request: `PUT /api/store/products/1` with price: 0
- [ ] Response status: 422 Unprocessable Entity

#### As Staff User - Valid Price (Positive)

- [ ] Request: `PUT /api/store/products/1` with price: 19.99
- [ ] Response status: 200 OK
- [ ] Price is updated correctly

#### As Staff User - Title Too Long (> 200 chars)

- [ ] Request: `PUT /api/store/products/1` with 201-char title
- [ ] Response status: 422 Unprocessable Entity

#### As Staff User - Non-Existent Product

- [ ] Request: `PUT /api/store/products/99999` with valid data
- [ ] Response status: 404 Not Found

### 2.3 PATCH /api/store/products/{product_id} (Partial Update)

#### Without Authentication

- [ ] Request: `PATCH /api/store/products/1` (no auth header)
- [ ] Response status: 401 Unauthorized

#### As Non-Staff User

- [ ] Request: `PATCH /api/store/products/1` (non-staff token)
- [ ] Response status: 403 Forbidden

#### As Staff User - Update Price Only

- [ ] Request: `PATCH /api/store/products/1`
- [ ] Request body: `{"price": 29.99}`
- [ ] Response status: 200 OK
- [ ] Price is updated
- [ ] Other fields remain unchanged
- [ ] Verify in database

#### As Staff User - Update is_active Only

- [ ] Request: `PATCH /api/store/products/1`
- [ ] Request body: `{"is_active": false}`
- [ ] Response status: 200 OK
- [ ] is_active is updated to false
- [ ] Other fields remain unchanged
- [ ] Product is hidden from public list
- [ ] Verify in database

#### As Staff User - Reactivate Product

- [ ] Request: `PATCH /api/store/products/1`
- [ ] Request body: `{"is_active": true}`
- [ ] Response status: 200 OK
- [ ] is_active is updated to true
- [ ] Product appears in public list again

#### As Staff User - Update Multiple Fields

- [ ] Request: `PATCH /api/store/products/1`
- [ ] Request body: `{"title": "New Title", "price": 39.99}`
- [ ] Response status: 200 OK
- [ ] Both fields are updated
- [ ] Other fields remain unchanged

#### As Staff User - Invalid Price in PATCH

- [ ] Request: `PATCH /api/store/products/1`
- [ ] Request body: `{"price": -5}`
- [ ] Response status: 422 Unprocessable Entity

#### As Staff User - Non-Existent Product

- [ ] Request: `PATCH /api/store/products/99999` with valid data
- [ ] Response status: 404 Not Found

## 3. Frontend Integration Testing

### 3.1 Admin Categories Page

#### List View

- [ ] Navigate to admin categories page
- [ ] Categories are displayed in a list/table
- [ ] Product count is displayed for each category
- [ ] Product counts are accurate

#### Create Category

- [ ] Click "Add Category" button
- [ ] Fill in category form (name, description)
- [ ] Submit form
- [ ] Category is created successfully
- [ ] New category appears in list

#### Edit Category

- [ ] Click "Edit" button on a category
- [ ] Form is pre-filled with current values
- [ ] Modify name and/or description
- [ ] Submit form
- [ ] Category is updated successfully
- [ ] Changes are reflected in list

#### Delete Category (BREAKING CHANGE)

- [ ] Click "Delete" button on a category
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Category is deleted successfully
- [ ] Category is removed from list
- [ ] Verify API call uses path parameter (not query parameter)

#### Error Handling

- [ ] Try to create category with empty name → Error message displayed
- [ ] Try to create category with name > 100 chars → Error message displayed
- [ ] Try to edit non-existent category → Error message displayed

### 3.2 Admin Products Page

#### List View - Default

- [ ] Navigate to admin products page
- [ ] Products are displayed in a list/table
- [ ] Only active products are shown by default

#### List View - Show Inactive Toggle

- [ ] Toggle "Show Inactive Products" checkbox
- [ ] All products (active and inactive) are displayed
- [ ] Inactive products are visually distinguished (e.g., grayed out)

#### Edit Product

- [ ] Click "Edit" button on a product
- [ ] Form is pre-filled with current values
- [ ] Modify title, price, description, etc.
- [ ] Submit form
- [ ] Product is updated successfully
- [ ] Changes are reflected in list

#### Deactivate Product

- [ ] Click "Deactivate" button on an active product
- [ ] Product is deactivated (is_active=false)
- [ ] Product disappears from default list
- [ ] Product appears when "Show Inactive" is toggled

#### Reactivate Product

- [ ] Toggle "Show Inactive Products"
- [ ] Click "Activate" button on an inactive product
- [ ] Product is reactivated (is_active=true)
- [ ] Product appears in default list

#### Price Validation

- [ ] Try to update product with negative price → Error message displayed
- [ ] Try to update product with zero price → Error message displayed
- [ ] Try to update product with valid price → Success

#### Error Handling

- [ ] Try to edit non-existent product → Error message displayed
- [ ] Try to update with invalid data → Error message displayed

### 3.3 Public Product List

#### Default View

- [ ] Navigate to public product list (not logged in)
- [ ] Only active products are displayed
- [ ] Inactive products are not visible

#### As Regular User

- [ ] Login as regular (non-staff) user
- [ ] Navigate to product list
- [ ] Only active products are displayed
- [ ] Inactive products are not visible

#### Product Detail

- [ ] Click on a product
- [ ] Product detail page loads
- [ ] Product information is displayed correctly

## 4. Error Response Testing

### 4.1 404 Not Found

- [ ] GET non-existent category → 404
- [ ] GET non-existent product → 404
- [ ] PUT non-existent category → 404
- [ ] PUT non-existent product → 404
- [ ] PATCH non-existent category → 404
- [ ] PATCH non-existent product → 404
- [ ] DELETE non-existent category → 404

### 4.2 401 Unauthorized

- [ ] PUT category without auth → 401
- [ ] PATCH category without auth → 401
- [ ] DELETE category without auth → 401
- [ ] PUT product without auth → 401
- [ ] PATCH product without auth → 401

### 4.3 403 Forbidden

- [ ] PUT category as non-staff → 403
- [ ] PATCH category as non-staff → 403
- [ ] DELETE category as non-staff → 403
- [ ] PUT product as non-staff → 403
- [ ] PATCH product as non-staff → 403

### 4.4 422 Unprocessable Entity

- [ ] PUT category with empty name → 422
- [ ] PUT category with name > 100 chars → 422
- [ ] PUT product with empty title → 422
- [ ] PUT product with title > 200 chars → 422
- [ ] PUT product with price ≤ 0 → 422
- [ ] PATCH product with price ≤ 0 → 422

## 5. Breaking Changes Verification

### 5.1 Category Delete Endpoint Change

- [ ] Old endpoint `DELETE /api/store/categories?category_id=X` no longer works
- [ ] New endpoint `DELETE /api/store/categories/{category_id}` works correctly
- [ ] Frontend uses new endpoint
- [ ] Migration guide is available
- [ ] Breaking change is documented

## 6. Data Integrity Testing

### 6.1 Product Count Accuracy

- [ ] Create a new product in a category
- [ ] Verify category product_count increases
- [ ] Deactivate the product
- [ ] Verify category product_count decreases
- [ ] Reactivate the product
- [ ] Verify category product_count increases again
- [ ] Delete the product
- [ ] Verify category product_count decreases

### 6.2 Partial Update Integrity

- [ ] Get current product data
- [ ] PATCH product with only price field
- [ ] Verify only price changed
- [ ] Verify all other fields unchanged (title, description, content_text, category_id, is_active)

### 6.3 Deactivation Preserves Data

- [ ] Get current product data
- [ ] PATCH product with `{"is_active": false}`
- [ ] Verify is_active changed to false
- [ ] Verify all other fields unchanged

## 7. Performance Testing

- [ ] Category list with counts loads in < 1 second
- [ ] Category detail loads in < 500ms
- [ ] Product list loads in < 1 second
- [ ] Update operations complete in < 500ms
- [ ] No N+1 query problems observed

## 8. Documentation Verification

- [ ] OpenAPI spec is up to date
- [ ] API documentation reflects all changes
- [ ] Breaking changes are documented
- [ ] Migration guide is available
- [ ] Frontend integration guide is available

## Test Results Summary

**Date:** _______________  
**Tester:** _______________  
**Environment:** _______________

**Results:**
- Total Tests: _____
- Passed: _____
- Failed: _____
- Blocked: _____

**Critical Issues Found:**
1. _______________
2. _______________
3. _______________

**Non-Critical Issues Found:**
1. _______________
2. _______________
3. _______________

**Recommendations:**
1. _______________
2. _______________
3. _______________

**Sign-off:**
- [ ] All critical tests passed
- [ ] All blocking issues resolved
- [ ] Ready for production deployment

**Signatures:**
- Tester: _______________ Date: _______________
- Reviewer: _______________ Date: _______________
- Approver: _______________ Date: _______________
