# Performance Testing Guide for API Fixes

This document describes the performance testing requirements for the API fixes implementation.

## Requirements

Performance testing validates:
- Product counting queries with large datasets (Requirement 9.1, 9.3)
- Category list with counts performance
- Database indexes are properly used

## Test Environment Setup

1. **Backend must be running**: `cd backend && uvicorn main:app --reload`
2. **Database should have test data**: At least 100 categories with 10-100 products each
3. **Python with requests library**: `pip install requests` (for automated testing)

## Automated Performance Tests

Run the automated performance test script:

```bash
python performance_test.py
```

This script will:
- Measure response times for category list with/without counts
- Measure response times for category detail (includes count)
- Compare performance overhead
- Provide recommendations

### Expected Results

**Category List Performance:**
- Without counts: < 100ms average
- With counts: < 200ms average
- Overhead: < 100% increase

**Category Detail Performance:**
- Response time: < 500ms average
- Should include product_count in response

## Manual Performance Testing

If automated testing is not available, perform these manual tests:

### 1. Test Category List with Counts

```bash
# Without counts
curl -w "\nTime: %{time_total}s\n" http://localhost:8000/api/store/categories

# With counts
curl -w "\nTime: %{time_total}s\n" http://localhost:8000/api/store/categories?include_counts=true
```

**Expected:**
- Both requests should complete in < 1 second
- Response with counts should include `product_count` field for each category
- Performance overhead should be reasonable (< 2x)

### 2. Test Category Detail

```bash
# Get a category by ID (includes product count)
curl -w "\nTime: %{time_total}s\n" http://localhost:8000/api/store/categories/1
```

**Expected:**
- Response should include `product_count` field
- Response time < 500ms

### 3. Test Product Filtering

```bash
# Get active products only (default)
curl -w "\nTime: %{time_total}s\n" http://localhost:8000/api/store/products

# Get all products including inactive (requires staff auth)
curl -w "\nTime: %{time_total}s\n" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  http://localhost:8000/api/store/products?include_inactive=true
```

**Expected:**
- Default request returns only active products
- With include_inactive=true and staff auth, returns all products
- Response times should be similar (< 200ms)

## Database Index Verification

### Required Indexes

For optimal performance, ensure these indexes exist:

```sql
-- Index for product counting per category
CREATE INDEX idx_products_category_active 
ON products(category_id, is_active);

-- Index for filtering by active status
CREATE INDEX idx_products_active 
ON products(is_active);
```

### Verify Indexes Are Used

Run EXPLAIN ANALYZE to verify indexes are being used:

```sql
-- Check category product count query
EXPLAIN ANALYZE 
SELECT COUNT(*) FROM products 
WHERE category_id = 1 AND is_active = true;

-- Check product filtering query
EXPLAIN ANALYZE 
SELECT * FROM products 
WHERE is_active = true;
```

**Expected:**
- Query plan should show "Index Scan" (not "Seq Scan")
- Execution time should be < 10ms for counting
- If you see "Seq Scan", indexes are not being used

### Example Good Query Plan

```
Index Scan using idx_products_category_active on products
  Index Cond: ((category_id = 1) AND (is_active = true))
  Planning Time: 0.123 ms
  Execution Time: 2.456 ms
```

### Example Bad Query Plan

```
Seq Scan on products
  Filter: ((category_id = 1) AND (is_active = true))
  Planning Time: 0.123 ms
  Execution Time: 45.678 ms
```

## Performance Benchmarks

### With Small Dataset (< 100 products)

- Category list without counts: < 50ms
- Category list with counts: < 100ms
- Category detail: < 50ms
- Product list: < 50ms

### With Medium Dataset (100-1000 products)

- Category list without counts: < 100ms
- Category list with counts: < 200ms
- Category detail: < 100ms
- Product list: < 100ms

### With Large Dataset (> 1000 products)

- Category list without counts: < 200ms
- Category list with counts: < 500ms
- Category detail: < 200ms
- Product list: < 200ms

## Performance Optimization Recommendations

If performance is below expectations:

1. **Add Database Indexes** (most important)
   - Create the indexes listed above
   - Verify they're being used with EXPLAIN ANALYZE

2. **Optimize Counting Query**
   - Use JOIN instead of subquery if needed
   - Avoid N+1 query problem (count all categories in one query)

3. **Consider Caching**
   - Cache category counts if they don't change frequently
   - Use Redis or in-memory cache
   - Invalidate cache when products are added/removed

4. **Database Connection Pooling**
   - Ensure connection pooling is configured
   - Typical pool size: 10-20 connections

5. **Query Optimization**
   - Review slow query logs
   - Add indexes for frequently queried fields
   - Consider denormalization for read-heavy operations

## Load Testing

For production readiness, perform load testing:

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/store/categories?include_counts=true

# Using wrk
wrk -t4 -c100 -d30s http://localhost:8000/api/store/categories?include_counts=true
```

**Expected:**
- Should handle 100+ requests/second
- 95th percentile response time < 500ms
- No errors under normal load

## Monitoring in Production

Set up monitoring for:
- Response times (p50, p95, p99)
- Error rates
- Database query times
- Cache hit rates (if caching is implemented)

## Test Results Documentation

Document your test results:

```
Date: YYYY-MM-DD
Environment: [Development/Staging/Production]
Dataset Size: [Number of categories/products]

Test Results:
- Category list without counts: XXms average
- Category list with counts: XXms average
- Category detail: XXms average
- Product list: XXms average

Database Indexes:
- idx_products_category_active: [Present/Missing]
- idx_products_active: [Present/Missing]

Query Plans:
- [Attach EXPLAIN ANALYZE output]

Recommendations:
- [List any performance improvements needed]
```

## Conclusion

Performance testing ensures that:
1. Product counting is efficient even with large datasets
2. Database indexes are properly configured
3. API response times meet acceptable thresholds
4. The system can handle expected load

All tests should pass before deploying to production.
