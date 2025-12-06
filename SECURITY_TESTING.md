# Security Testing Guide for API Fixes

This document describes the security testing requirements for the API fixes implementation.

## Requirements

Security testing validates:
- All protected endpoints require authentication (Requirement 1.4, 2.5, 3.5)
- Staff-only endpoints check is_staff flag
- include_inactive parameter is ignored for non-staff users (Requirement 6.3)
- Authorization edge cases are handled correctly

## Automated Security Checks

Run the automated security verification script:

```bash
python security_test.py
```

This script verifies the OpenAPI specification includes:
- OAuth2 security requirements on protected endpoints
- 401 Unauthorized response documentation
- 403 Forbidden response documentation for staff-only endpoints
- Proper documentation of include_inactive parameter security

## Manual Security Testing

The following manual tests MUST be performed to verify runtime security:

### A. Authentication Tests

#### A1: No Authentication Header

```bash
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "description": "Test"}'
```

**Expected:** 401 Unauthorized

#### A2: Invalid Token

```bash
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "description": "Test"}'
```

**Expected:** 401 Unauthorized

#### A3: Expired Token

```bash
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer EXPIRED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "description": "Test"}'
```

**Expected:** 401 Unauthorized

#### A4: Valid Token

```bash
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Category", "description": "Updated"}'
```

**Expected:** 200 OK with updated category

### B. Authorization Tests (Staff-Only)

#### B1: Non-Staff User Attempts Update

```bash
# First, login as non-staff user to get token
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=regular_user&password=password"

# Then try to update category
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer NON_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "description": "Test"}'
```

**Expected:** 403 Forbidden

#### B2: Staff User Updates Category

```bash
# Login as staff user
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=staff_user&password=password"

# Update category
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated", "description": "Updated"}'
```

**Expected:** 200 OK with updated category

#### B3: Verify All Staff Endpoints

Test each of these endpoints with non-staff and staff users:

- PUT /api/store/categories/{category_id}
- PATCH /api/store/categories/{category_id}
- DELETE /api/store/categories/{category_id}
- PUT /api/store/products/{product_id}
- PATCH /api/store/products/{product_id}

**Expected:** 403 for non-staff, 200/204 for staff

### C. include_inactive Parameter Security Tests

#### C1: No Authentication, Default Behavior

```bash
curl http://localhost:8000/api/store/products
```

**Expected:** 200 OK, only active products (is_active=true)

#### C2: No Authentication, include_inactive=true

```bash
curl http://localhost:8000/api/store/products?include_inactive=true
```

**Expected:** 200 OK, only active products (parameter ignored)

#### C3: Non-Staff User, Default Behavior

```bash
curl http://localhost:8000/api/store/products \
  -H "Authorization: Bearer NON_STAFF_TOKEN"
```

**Expected:** 200 OK, only active products

#### C4: Non-Staff User, include_inactive=true

```bash
curl http://localhost:8000/api/store/products?include_inactive=true \
  -H "Authorization: Bearer NON_STAFF_TOKEN"
```

**Expected:** 200 OK, only active products (parameter ignored)

#### C5: Staff User, include_inactive=true

```bash
curl http://localhost:8000/api/store/products?include_inactive=true \
  -H "Authorization: Bearer STAFF_TOKEN"
```

**Expected:** 200 OK, all products (active and inactive)

### D. Resource Ownership Tests

#### D1: Staff Can Modify Any Category

```bash
# Create category as staff user 1
curl -X POST http://localhost:8000/api/store/categories \
  -H "Authorization: Bearer STAFF_TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Category"}'

# Update same category as staff user 2
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer STAFF_TOKEN_2" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated by Another Staff"}'
```

**Expected:** Both operations succeed (staff can modify any resource)

### E. Input Validation Tests

#### E1: Invalid Category ID (Non-Integer)

```bash
curl -X PUT http://localhost:8000/api/store/categories/abc \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

**Expected:** 422 Unprocessable Entity

#### E2: Empty Required Field

```bash
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'
```

**Expected:** 422 Unprocessable Entity

#### E3: Field Exceeding Max Length

```bash
# Category name max length is 100
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "'$(python -c "print('a' * 101)")'"}'
```

**Expected:** 422 Unprocessable Entity

#### E4: Product Title Exceeding Max Length

```bash
# Product title max length is 200
curl -X PUT http://localhost:8000/api/store/products/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "'$(python -c "print('a' * 201)")'"}'
```

**Expected:** 422 Unprocessable Entity

#### E5: Invalid Price (≤ 0)

```bash
curl -X PUT http://localhost:8000/api/store/products/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "price": -10, "content_text": "Test"}'
```

**Expected:** 422 Unprocessable Entity

```bash
curl -X PUT http://localhost:8000/api/store/products/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "price": 0, "content_text": "Test"}'
```

**Expected:** 422 Unprocessable Entity

### F. Edge Cases

#### F1: Update Non-Existent Resource

```bash
curl -X PUT http://localhost:8000/api/store/categories/99999 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

**Expected:** 404 Not Found

#### F2: Delete Non-Existent Resource

```bash
curl -X DELETE http://localhost:8000/api/store/categories/99999 \
  -H "Authorization: Bearer STAFF_TOKEN"
```

**Expected:** 404 Not Found

#### F3: SQL Injection Attempt

```bash
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test'\'' OR 1=1--", "description": "Test"}'
```

**Expected:** 200 OK, string is properly escaped (no SQL injection)

#### F4: XSS Attempt

```bash
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(\"XSS\")</script>", "description": "Test"}'
```

**Expected:** 200 OK, string is stored as-is (sanitization happens on frontend display)

#### F5: Concurrent Updates

```bash
# Terminal 1
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Update 1"}'

# Terminal 2 (run simultaneously)
curl -X PUT http://localhost:8000/api/store/categories/1 \
  -H "Authorization: Bearer STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Update 2"}'
```

**Expected:** Both succeed, last write wins (no data corruption)

## Security Checklist

Before deploying to production, verify:

- [ ] All authentication tests pass (A1-A4)
- [ ] All authorization tests pass (B1-B3)
- [ ] include_inactive security works correctly (C1-C5)
- [ ] Resource ownership is handled correctly (D1)
- [ ] All input validation tests pass (E1-E5)
- [ ] All edge cases are handled correctly (F1-F5)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Concurrent updates don't cause data corruption
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting is configured (if applicable)
- [ ] HTTPS is enforced in production
- [ ] CORS is properly configured

## Common Security Issues to Avoid

### 1. Missing Authentication Check

**Bad:**
```python
@router.put("/api/store/categories/{category_id}")
async def update_category(category_id: int, data: CategoryUpdate):
    # Missing authentication!
    return update_category_in_db(category_id, data)
```

**Good:**
```python
@router.put("/api/store/categories/{category_id}")
async def update_category(
    category_id: int, 
    data: CategoryUpdate,
    current_user: User = Depends(get_current_user)  # Authentication required
):
    if not current_user.is_staff:
        raise HTTPException(status_code=403)
    return update_category_in_db(category_id, data)
```

### 2. Missing Staff Check

**Bad:**
```python
@router.put("/api/store/categories/{category_id}")
async def update_category(
    category_id: int, 
    data: CategoryUpdate,
    current_user: User = Depends(get_current_user)
):
    # Missing staff check!
    return update_category_in_db(category_id, data)
```

**Good:**
```python
@router.put("/api/store/categories/{category_id}")
async def update_category(
    category_id: int, 
    data: CategoryUpdate,
    current_user: User = Depends(get_current_active_staff_user)  # Staff check
):
    return update_category_in_db(category_id, data)
```

### 3. Insecure include_inactive Implementation

**Bad:**
```python
@router.get("/api/store/products")
async def get_products(include_inactive: bool = False):
    # Anyone can see inactive products!
    if include_inactive:
        return get_all_products()
    return get_active_products()
```

**Good:**
```python
@router.get("/api/store/products")
async def get_products(
    include_inactive: bool = False,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Only staff can see inactive products
    if include_inactive and current_user and current_user.is_staff:
        return get_all_products()
    return get_active_products()
```

## Test Results Documentation

Document your security test results:

```
Date: YYYY-MM-DD
Tester: [Name]
Environment: [Development/Staging/Production]

Authentication Tests:
- A1: No auth header → [PASS/FAIL]
- A2: Invalid token → [PASS/FAIL]
- A3: Expired token → [PASS/FAIL]
- A4: Valid token → [PASS/FAIL]

Authorization Tests:
- B1: Non-staff update → [PASS/FAIL]
- B2: Staff update → [PASS/FAIL]
- B3: All staff endpoints → [PASS/FAIL]

include_inactive Tests:
- C1: No auth, default → [PASS/FAIL]
- C2: No auth, include_inactive → [PASS/FAIL]
- C3: Non-staff, default → [PASS/FAIL]
- C4: Non-staff, include_inactive → [PASS/FAIL]
- C5: Staff, include_inactive → [PASS/FAIL]

Input Validation Tests:
- E1: Invalid ID → [PASS/FAIL]
- E2: Empty field → [PASS/FAIL]
- E3: Exceeds max length → [PASS/FAIL]
- E5: Invalid price → [PASS/FAIL]

Edge Cases:
- F1: Update non-existent → [PASS/FAIL]
- F2: Delete non-existent → [PASS/FAIL]
- F3: SQL injection → [PASS/FAIL]
- F4: XSS attempt → [PASS/FAIL]
- F5: Concurrent updates → [PASS/FAIL]

Issues Found:
- [List any security issues discovered]

Recommendations:
- [List any security improvements needed]
```

## Conclusion

Security testing ensures that:
1. Authentication is properly enforced on all protected endpoints
2. Authorization checks prevent unauthorized access
3. The include_inactive parameter is properly secured
4. Input validation prevents malicious input
5. Edge cases are handled securely

All security tests must pass before deploying to production.
