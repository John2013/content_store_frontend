#!/usr/bin/env python3
"""
Security testing for API fixes.
Tests:
- All protected endpoints require authentication
- Staff-only endpoints check is_staff
- include_inactive ignored for non-staff
- Authorization edge cases
"""

import sys
import json

def load_openapi_spec(filepath):
    """Load OpenAPI specification from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def check_authentication_requirements(spec):
    """Verify all protected endpoints require authentication."""
    issues = []
    paths = spec.get('paths', {})
    
    # Endpoints that MUST require authentication
    protected_endpoints = [
        ('PUT', '/api/store/categories/{category_id}', 'Update category'),
        ('PATCH', '/api/store/categories/{category_id}', 'Patch category'),
        ('DELETE', '/api/store/categories/{category_id}', 'Delete category'),
        ('PUT', '/api/store/products/{product_id}', 'Update product'),
        ('PATCH', '/api/store/products/{product_id}', 'Patch product'),
    ]
    
    print("\n1. Checking Authentication Requirements")
    print("-" * 80)
    
    for method, path, description in protected_endpoints:
        if path in paths and method.lower() in paths[path]:
            endpoint = paths[path][method.lower()]
            security = endpoint.get('security', [])
            
            if security and any('OAuth2PasswordBearer' in s for s in security):
                print(f"✓ {method} {path} requires authentication")
                
                # Check response codes
                responses = endpoint.get('responses', {})
                if '401' in responses:
                    print(f"  ✓ Documents 401 Unauthorized response")
                else:
                    issues.append(f"⚠️  {method} {path} missing 401 response documentation")
            else:
                issues.append(f"❌ {method} {path} missing authentication requirement")
        else:
            issues.append(f"❌ {method} {path} endpoint not found")
    
    return issues

def check_staff_requirements(spec):
    """Verify staff-only endpoints check is_staff."""
    issues = []
    paths = spec.get('paths', {})
    
    # All modification endpoints should be staff-only
    staff_endpoints = [
        ('PUT', '/api/store/categories/{category_id}', 'Update category'),
        ('PATCH', '/api/store/categories/{category_id}', 'Patch category'),
        ('DELETE', '/api/store/categories/{category_id}', 'Delete category'),
        ('PUT', '/api/store/products/{product_id}', 'Update product'),
        ('PATCH', '/api/store/products/{product_id}', 'Patch product'),
    ]
    
    print("\n2. Checking Staff-Only Requirements")
    print("-" * 80)
    
    for method, path, description in staff_endpoints:
        if path in paths and method.lower() in paths[path]:
            endpoint = paths[path][method.lower()]
            responses = endpoint.get('responses', {})
            
            # Check for 403 Forbidden response
            if '403' in responses:
                print(f"✓ {method} {path} documents 403 Forbidden (staff check)")
            else:
                issues.append(f"⚠️  {method} {path} missing 403 response documentation")
            
            # Check description mentions staff
            description_text = endpoint.get('description', '').lower()
            if 'staff' in description_text or 'admin' in description_text:
                print(f"  ✓ Description mentions staff requirement")
            else:
                issues.append(f"⚠️  {method} {path} description doesn't mention staff requirement")
        else:
            issues.append(f"❌ {method} {path} endpoint not found")
    
    return issues

def check_include_inactive_security(spec):
    """Verify include_inactive parameter is properly secured."""
    issues = []
    paths = spec.get('paths', {})
    
    print("\n3. Checking include_inactive Parameter Security")
    print("-" * 80)
    
    # Check GET /api/store/products
    if '/api/store/products' in paths:
        get_products = paths['/api/store/products'].get('get', {})
        params = get_products.get('parameters', [])
        
        # Find include_inactive parameter
        include_inactive_param = None
        for param in params:
            if param.get('name') == 'include_inactive':
                include_inactive_param = param
                break
        
        if include_inactive_param:
            print("✓ include_inactive parameter exists")
            
            # Check description mentions staff-only
            param_desc = include_inactive_param.get('description', '').lower()
            if 'staff' in param_desc:
                print("  ✓ Parameter description mentions staff requirement")
            else:
                issues.append("⚠️  include_inactive description should mention staff-only")
            
            # Note: The actual enforcement must be checked in backend code
            print("  ℹ️  Backend must enforce: non-staff users cannot see inactive products")
            print("     even if include_inactive=true is passed")
        else:
            issues.append("❌ include_inactive parameter not found")
    else:
        issues.append("❌ GET /api/store/products endpoint not found")
    
    return issues

def check_error_responses(spec):
    """Check that all endpoints document appropriate error responses."""
    issues = []
    paths = spec.get('paths', {})
    
    print("\n4. Checking Error Response Documentation")
    print("-" * 80)
    
    # Endpoints to check
    endpoints_to_check = [
        ('GET', '/api/store/categories/{category_id}', ['404', '422']),
        ('PUT', '/api/store/categories/{category_id}', ['401', '403', '404', '422']),
        ('PATCH', '/api/store/categories/{category_id}', ['401', '403', '404', '422']),
        ('DELETE', '/api/store/categories/{category_id}', ['401', '403', '404', '422']),
        ('PUT', '/api/store/products/{product_id}', ['401', '403', '404', '422']),
        ('PATCH', '/api/store/products/{product_id}', ['401', '403', '404', '422']),
    ]
    
    for method, path, expected_codes in endpoints_to_check:
        if path in paths and method.lower() in paths[path]:
            endpoint = paths[path][method.lower()]
            responses = endpoint.get('responses', {})
            
            missing_codes = [code for code in expected_codes if code not in responses]
            
            if not missing_codes:
                print(f"✓ {method} {path} documents all error responses")
            else:
                issues.append(f"⚠️  {method} {path} missing error codes: {missing_codes}")
        else:
            issues.append(f"❌ {method} {path} endpoint not found")
    
    return issues

def generate_security_test_cases():
    """Generate manual security test cases."""
    print("\n5. Manual Security Test Cases")
    print("-" * 80)
    
    test_cases = """
Manual security testing should verify:

A. Authentication Tests:
   1. Call protected endpoints without Authorization header → 401
   2. Call protected endpoints with invalid token → 401
   3. Call protected endpoints with expired token → 401
   4. Call protected endpoints with valid token → Success

B. Authorization Tests (Staff-Only):
   1. Call staff endpoints as non-staff user → 403
   2. Call staff endpoints as staff user → Success
   3. Verify is_staff flag is checked, not just authentication

C. include_inactive Parameter Tests:
   1. Call GET /api/store/products without auth → Only active products
   2. Call GET /api/store/products?include_inactive=true without auth → Only active products (parameter ignored)
   3. Call GET /api/store/products as non-staff user → Only active products
   4. Call GET /api/store/products?include_inactive=true as non-staff → Only active products (parameter ignored)
   5. Call GET /api/store/products?include_inactive=true as staff → All products

D. Resource Ownership Tests:
   1. Try to update/delete category created by another staff user → Should succeed (staff can modify any)
   2. Try to update/delete product created by another staff user → Should succeed (staff can modify any)

E. Input Validation Tests:
   1. Send invalid category_id (non-integer) → 422
   2. Send invalid product_id (non-integer) → 422
   3. Send empty required fields → 422
   4. Send fields exceeding max length → 422
   5. Send price <= 0 → 422

F. Edge Cases:
   1. Update non-existent resource → 404
   2. Delete non-existent resource → 404
   3. Concurrent updates to same resource → Last write wins
   4. SQL injection attempts in string fields → Properly escaped
   5. XSS attempts in string fields → Properly sanitized

Test Commands:

# A1: No authentication
curl -X PUT http://localhost:8000/api/store/categories/1 \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test", "description": "Test"}'
# Expected: 401

# A4: With valid token
curl -X PUT http://localhost:8000/api/store/categories/1 \\
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test", "description": "Test"}'
# Expected: 200

# B1: Non-staff user
curl -X PUT http://localhost:8000/api/store/categories/1 \\
  -H "Authorization: Bearer YOUR_NON_STAFF_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test", "description": "Test"}'
# Expected: 403

# C2: include_inactive without auth
curl http://localhost:8000/api/store/products?include_inactive=true
# Expected: 200, but only active products returned

# C5: include_inactive with staff auth
curl http://localhost:8000/api/store/products?include_inactive=true \\
  -H "Authorization: Bearer YOUR_STAFF_TOKEN"
# Expected: 200, all products returned

# E5: Invalid price
curl -X PUT http://localhost:8000/api/store/products/1 \\
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Test", "price": -10, "content_text": "Test"}'
# Expected: 422

# F1: Non-existent resource
curl -X PUT http://localhost:8000/api/store/categories/99999 \\
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test", "description": "Test"}'
# Expected: 404
    """
    
    print(test_cases)
    return []

def main():
    print("=" * 80)
    print("Security Testing for API Fixes")
    print("=" * 80)
    
    try:
        spec = load_openapi_spec('openapi.json')
    except Exception as e:
        print(f"❌ Error loading OpenAPI spec: {e}")
        return 1
    
    all_issues = []
    
    # Run automated checks
    all_issues.extend(check_authentication_requirements(spec))
    all_issues.extend(check_staff_requirements(spec))
    all_issues.extend(check_include_inactive_security(spec))
    all_issues.extend(check_error_responses(spec))
    
    # Generate manual test cases
    generate_security_test_cases()
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if all_issues:
        print(f"\n⚠️  Found {len(all_issues)} issue(s) in OpenAPI spec:\n")
        for issue in all_issues:
            print(f"  {issue}")
        print("\n⚠️  These issues should be addressed in the OpenAPI specification.")
    else:
        print("\n✅ All automated security checks passed!")
    
    print("\n📋 Manual Testing Required:")
    print("   The manual test cases above MUST be executed to verify:")
    print("   - Authentication is enforced at runtime")
    print("   - Staff authorization is checked correctly")
    print("   - include_inactive parameter is properly secured")
    print("   - All error cases are handled correctly")
    print("\n   Document test results before deploying to production.")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
