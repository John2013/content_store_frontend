#!/usr/bin/env python3
"""
Verify OpenAPI specification completeness for API fixes.
Checks:
- All CRUD operations present
- Consistent naming conventions
- Consistent URL patterns
- Security requirements
- Validation rules
"""

import json
import sys

def load_openapi_spec(filepath):
    """Load OpenAPI specification from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def check_crud_operations(spec):
    """Check that all CRUD operations are present for categories and products."""
    issues = []
    paths = spec.get('paths', {})
    
    # Expected category endpoints
    category_endpoints = {
        'GET /api/store/categories': 'List categories',
        'GET /api/store/categories/{category_id}': 'Get category by ID',
        'PUT /api/store/categories/{category_id}': 'Update category (full)',
        'PATCH /api/store/categories/{category_id}': 'Update category (partial)',
        'DELETE /api/store/categories/{category_id}': 'Delete category',
    }
    
    # Expected product endpoints (DELETE not part of API fixes requirements)
    product_endpoints = {
        'GET /api/store/products': 'List products',
        'GET /api/store/products/{product_id}': 'Get product by ID',
        'PUT /api/store/products/{product_id}': 'Update product (full)',
        'PATCH /api/store/products/{product_id}': 'Update product (partial)',
    }
    
    # Check category endpoints
    for endpoint_method, description in category_endpoints.items():
        method, path = endpoint_method.split(' ', 1)
        if path not in paths:
            issues.append(f"❌ Missing path: {path}")
        elif method.lower() not in paths[path]:
            issues.append(f"❌ Missing method {method} for {path} ({description})")
        else:
            print(f"✓ {endpoint_method} - {description}")
    
    # Check product endpoints
    for endpoint_method, description in product_endpoints.items():
        method, path = endpoint_method.split(' ', 1)
        if path not in paths:
            issues.append(f"❌ Missing path: {path}")
        elif method.lower() not in paths[path]:
            issues.append(f"❌ Missing method {method} for {path} ({description})")
        else:
            print(f"✓ {endpoint_method} - {description}")
    
    return issues

def check_naming_conventions(spec):
    """Check consistent naming conventions for schemas."""
    issues = []
    schemas = spec.get('components', {}).get('schemas', {})
    
    # Expected schemas
    expected_schemas = {
        'CategoryRead': 'Category read schema',
        'CategoryUpdate': 'Category full update schema',
        'CategoryPatch': 'Category partial update schema',
        'ProductRead': 'Product read schema',
        'ProductUpdate': 'Product full update schema',
        'ProductPatch': 'Product partial update schema',
    }
    
    for schema_name, description in expected_schemas.items():
        if schema_name in schemas:
            print(f"✓ Schema {schema_name} - {description}")
        else:
            issues.append(f"❌ Missing schema: {schema_name} ({description})")
    
    return issues

def check_url_patterns(spec):
    """Check consistent URL patterns (path parameters for IDs)."""
    issues = []
    paths = spec.get('paths', {})
    
    # Check that category delete uses path parameter
    category_delete_path = '/api/store/categories/{category_id}'
    if category_delete_path in paths:
        if 'delete' in paths[category_delete_path]:
            print(f"✓ Category DELETE uses path parameter: {category_delete_path}")
        else:
            issues.append(f"❌ Category DELETE method not found at {category_delete_path}")
    else:
        issues.append(f"❌ Category DELETE path not found: {category_delete_path}")
    
    # Check that old query parameter pattern is not present
    old_category_path = '/api/store/categories'
    if old_category_path in paths:
        if 'delete' in paths[old_category_path]:
            issues.append(f"⚠️  Old DELETE method still exists at {old_category_path} (should be removed)")
    
    return issues

def check_security_requirements(spec):
    """Check security requirements for protected endpoints."""
    issues = []
    paths = spec.get('paths', {})
    
    # Endpoints that should require authentication and staff privileges
    protected_endpoints = [
        ('PUT', '/api/store/categories/{category_id}'),
        ('PATCH', '/api/store/categories/{category_id}'),
        ('DELETE', '/api/store/categories/{category_id}'),
        ('PUT', '/api/store/products/{product_id}'),
        ('PATCH', '/api/store/products/{product_id}'),
    ]
    
    for method, path in protected_endpoints:
        if path in paths and method.lower() in paths[path]:
            endpoint = paths[path][method.lower()]
            security = endpoint.get('security', [])
            if security and any('OAuth2PasswordBearer' in s for s in security):
                print(f"✓ {method} {path} has OAuth2 security")
            else:
                issues.append(f"❌ {method} {path} missing OAuth2 security requirement")
        else:
            issues.append(f"❌ {method} {path} not found")
    
    return issues

def check_validation_rules(spec):
    """Check validation rules in schemas."""
    issues = []
    schemas = spec.get('components', {}).get('schemas', {})
    
    # Check CategoryUpdate
    if 'CategoryUpdate' in schemas:
        cat_update = schemas['CategoryUpdate']
        props = cat_update.get('properties', {})
        required = cat_update.get('required', [])
        
        if 'name' in props:
            name_prop = props['name']
            if 'maxLength' in name_prop and name_prop['maxLength'] == 100:
                print("✓ CategoryUpdate.name has maxLength: 100")
            else:
                issues.append("❌ CategoryUpdate.name missing maxLength: 100")
        
        if 'name' in required:
            print("✓ CategoryUpdate.name is required")
        else:
            issues.append("❌ CategoryUpdate.name should be required")
    
    # Check CategoryPatch
    if 'CategoryPatch' in schemas:
        cat_patch = schemas['CategoryPatch']
        required = cat_patch.get('required', [])
        
        if not required or len(required) == 0:
            print("✓ CategoryPatch has no required fields (all optional)")
        else:
            issues.append(f"⚠️  CategoryPatch has required fields: {required} (should all be optional)")
    
    # Check ProductUpdate
    if 'ProductUpdate' in schemas:
        prod_update = schemas['ProductUpdate']
        props = prod_update.get('properties', {})
        required = prod_update.get('required', [])
        
        if 'title' in props:
            title_prop = props['title']
            if 'maxLength' in title_prop and title_prop['maxLength'] == 200:
                print("✓ ProductUpdate.title has maxLength: 200")
            else:
                issues.append("❌ ProductUpdate.title missing maxLength: 200")
        
        if 'price' in props:
            price_prop = props['price']
            # Check for exclusiveMinimum
            if 'exclusiveMinimum' in price_prop and price_prop['exclusiveMinimum'] == 0:
                print("✓ ProductUpdate.price has exclusiveMinimum: 0")
            else:
                issues.append("❌ ProductUpdate.price missing exclusiveMinimum: 0")
        
        if 'title' in required and 'price' in required and 'content_text' in required:
            print("✓ ProductUpdate has required fields: title, price, content_text")
        else:
            issues.append(f"❌ ProductUpdate missing required fields. Found: {required}")
    
    # Check ProductPatch
    if 'ProductPatch' in schemas:
        prod_patch = schemas['ProductPatch']
        props = prod_patch.get('properties', {})
        required = prod_patch.get('required', [])
        
        if not required or len(required) == 0:
            print("✓ ProductPatch has no required fields (all optional)")
        else:
            issues.append(f"⚠️  ProductPatch has required fields: {required} (should all be optional)")
        
        if 'price' in props:
            price_prop = props['price']
            if 'exclusiveMinimum' in price_prop and price_prop['exclusiveMinimum'] == 0:
                print("✓ ProductPatch.price has exclusiveMinimum: 0")
            else:
                issues.append("❌ ProductPatch.price missing exclusiveMinimum: 0")
    
    # Check CategoryRead for product_count
    if 'CategoryRead' in schemas:
        cat_read = schemas['CategoryRead']
        props = cat_read.get('properties', {})
        
        if 'product_count' in props:
            print("✓ CategoryRead has product_count field")
        else:
            issues.append("❌ CategoryRead missing product_count field")
    
    return issues

def check_query_parameters(spec):
    """Check new query parameters."""
    issues = []
    paths = spec.get('paths', {})
    
    # Check include_counts parameter on GET /api/store/categories
    if '/api/store/categories' in paths:
        get_cats = paths['/api/store/categories'].get('get', {})
        params = get_cats.get('parameters', [])
        
        has_include_counts = any(p.get('name') == 'include_counts' for p in params)
        if has_include_counts:
            print("✓ GET /api/store/categories has include_counts parameter")
        else:
            issues.append("❌ GET /api/store/categories missing include_counts parameter")
    
    # Check include_inactive parameter on GET /api/store/products
    if '/api/store/products' in paths:
        get_prods = paths['/api/store/products'].get('get', {})
        params = get_prods.get('parameters', [])
        
        has_include_inactive = any(p.get('name') == 'include_inactive' for p in params)
        if has_include_inactive:
            print("✓ GET /api/store/products has include_inactive parameter")
        else:
            issues.append("❌ GET /api/store/products missing include_inactive parameter")
    
    return issues

def main():
    print("=" * 80)
    print("OpenAPI Specification Verification")
    print("=" * 80)
    print()
    
    try:
        spec = load_openapi_spec('openapi.json')
    except Exception as e:
        print(f"❌ Error loading OpenAPI spec: {e}")
        return 1
    
    all_issues = []
    
    # Check CRUD operations
    print("\n1. Checking CRUD Operations")
    print("-" * 80)
    issues = check_crud_operations(spec)
    all_issues.extend(issues)
    
    # Check naming conventions
    print("\n2. Checking Naming Conventions")
    print("-" * 80)
    issues = check_naming_conventions(spec)
    all_issues.extend(issues)
    
    # Check URL patterns
    print("\n3. Checking URL Patterns")
    print("-" * 80)
    issues = check_url_patterns(spec)
    all_issues.extend(issues)
    
    # Check security requirements
    print("\n4. Checking Security Requirements")
    print("-" * 80)
    issues = check_security_requirements(spec)
    all_issues.extend(issues)
    
    # Check validation rules
    print("\n5. Checking Validation Rules")
    print("-" * 80)
    issues = check_validation_rules(spec)
    all_issues.extend(issues)
    
    # Check query parameters
    print("\n6. Checking Query Parameters")
    print("-" * 80)
    issues = check_query_parameters(spec)
    all_issues.extend(issues)
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if all_issues:
        print(f"\n❌ Found {len(all_issues)} issue(s):\n")
        for issue in all_issues:
            print(f"  {issue}")
        return 1
    else:
        print("\n✅ All checks passed! OpenAPI specification is complete and consistent.")
        return 0

if __name__ == '__main__':
    sys.exit(main())
