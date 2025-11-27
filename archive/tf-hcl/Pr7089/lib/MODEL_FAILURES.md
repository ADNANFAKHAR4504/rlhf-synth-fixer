# Model Failures and Corrections

This document tracks all errors encountered during terraform apply and their resolutions.

## Error Summary

Total Errors: 3 (4 individual failures)
- Critical: 1
- Configuration: 2

---

## Error 1: S3 Cross-Region Replication - Missing DeleteMarkerReplication

**Severity:** Critical  
**Category:** Configuration Error  
**File:** main.tf, Line 360  
**Resource:** `aws_s3_bucket_replication_configuration.replication`

### Error Message

```
Error: creating S3 Bucket (s3-payment-docs-east-dev-044454600151) Replication Configuration: 
operation error S3: PutBucketReplication, https response error StatusCode: 400, 
RequestID: N7PJ0CWGKJYZ9X99, api error InvalidRequest: DeleteMarkerReplication must be 
specified for this version of Cross Region Replication configuration schema.
```

### Description

The S3 bucket replication configuration was missing the required `delete_marker_replication` block. AWS Provider 5.x enforces this requirement for cross-region replication schema compliance.

### Root Cause

The model generated S3 replication configuration without the `delete_marker_replication` block, which became mandatory in newer AWS Provider versions (5.x+). This is a breaking change from AWS Provider 4.x where this parameter was optional.

### Impact

**Operational Impact:** Cross-region replication would fail completely, preventing disaster recovery capabilities.  
**Security Impact:** None  
**Cost Impact:** None  
**Compliance Impact:** High - DR requirements not met

### Original Code

```hcl
resource "aws_s3_bucket_replication_configuration" "replication" {
  depends_on = [aws_s3_bucket_versioning.primary, aws_s3_bucket_versioning.secondary]
  
  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id
  
  rule {
    id     = "replicate-all-objects"
    status = "Enabled"
    
    filter {}
    
    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}
```

### Corrected Code

```hcl
resource "aws_s3_bucket_replication_configuration" "replication" {
  depends_on = [aws_s3_bucket_versioning.primary, aws_s3_bucket_versioning.secondary]
  
  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id
  
  rule {
    id     = "replicate-all-objects"
    status = "Enabled"
    
    filter {}
    
    delete_marker_replication {
      status = "Enabled"
    }
    
    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}
```

### Prevention Strategy

1. Always include `delete_marker_replication` block in S3 replication configurations when using AWS Provider 5.x+
2. Enable delete marker replication by default for complete object lifecycle replication
3. Add validation checks for required AWS Provider version-specific parameters
4. Document breaking changes between AWS Provider versions in infrastructure code

---

## Error 2: Route53 Hosted Zone - Reserved Domain Name

**Severity:** Configuration Error  
**Category:** Configuration Error  
**File:** main.tf, Line 817  
**Resource:** `aws_route53_zone.main`

### Error Message

```
Error: creating Route53 Hosted Zone (payment.example.com): operation error Route 53: 
CreateHostedZone, https response error StatusCode: 400, RequestID: e612e737-36fa-479f-b781-a73354a3b4bc, 
InvalidDomainName: payment.example.com is reserved by AWS!
```

### Description

The domain name `payment.example.com` is reserved by AWS and cannot be used for Route53 hosted zones. AWS reserves the `example.com`, `example.net`, and `example.org` domains for documentation purposes per RFC 2606.

### Root Cause

The model used a standard documentation domain pattern without checking against AWS reserved domain list. The domain `payment.example.com` falls under the reserved `example.com` domain space.

### Impact

**Operational Impact:** DNS management would fail, preventing domain-based routing and health checks.  
**Security Impact:** None  
**Cost Impact:** None  
**Compliance Impact:** None

### Original Code

```hcl
resource "aws_route53_zone" "main" {
  name = "payment.example.com"
  
  tags = {
    Name = "route53-zone-payment-${var.environment}"
  }
}
```

### Corrected Code

```hcl
resource "aws_route53_zone" "main" {
  name = "drpayment.example.internal"
  
  tags = {
    Name = "route53-zone-payment-${var.environment}"
  }
}
```

### Prevention Strategy

1. Use non-reserved domain patterns for testing (e.g., `*.example.internal`, `*.test.local`)
2. Avoid using `example.com`, `example.net`, `example.org` in infrastructure code
3. Validate domain names against AWS reserved domain list before deployment
4. Use organization-specific domain patterns for development environments

---

## Error 3: Route53 Health Check - Invalid FQDN Format

**Severity:** Configuration Error  
**Category:** Configuration Error  
**File:** main.tf, Lines 826 and 839  
**Resources:** `aws_route53_health_check.primary` and `aws_route53_health_check.secondary`

### Error Message

```
Error: creating Route53 Health Check: operation error Route 53: CreateHealthCheck, 
https response error StatusCode: 400, RequestID: 93c0a504-5a2b-4c43-9253-b798fd6dd233, 
InvalidInput: Invalid fully qualified domain name: It may not contain reserved 
characters of RFC1738 ";/?:@=&"
```

### Description

The Route53 health check FQDN configuration included the path portion of API Gateway URLs (e.g., `/health`) which contains the reserved character `/`. Route53 health checks require a clean FQDN without path, query parameters, or URL fragments. The `resource_path` parameter should be used for specifying paths.

### Root Cause

The model used `replace()` function to strip `https://` from API Gateway URLs but didn't remove the path portion. This resulted in FQDNs like `abc123.execute-api.us-east-1.amazonaws.com/default/health` which contains invalid characters for FQDN.

Additionally, the model included `resource_path = "/health"` which would have been correct, but the FQDN still contained the path making it invalid.

### Impact

**Operational Impact:** Health checks would fail, preventing automated failover and route weighting adjustments.  
**Security Impact:** None  
**Cost Impact:** None  
**Compliance Impact:** None

### Original Code

```hcl
resource "aws_route53_health_check" "primary" {
  fqdn              = replace(aws_apigatewayv2_stage.primary.invoke_url, "https://", "")
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  
  tags = {
    Name = "health-check-primary-${var.environment}"
  }
}

resource "aws_route53_health_check" "secondary" {
  fqdn              = replace(aws_apigatewayv2_stage.secondary.invoke_url, "https://", "")
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  
  tags = {
    Name = "health-check-secondary-${var.environment}"
  }
}
```

### Corrected Code

```hcl
resource "aws_route53_health_check" "primary" {
  fqdn              = split("/", replace(aws_apigatewayv2_stage.primary.invoke_url, "https://", ""))[0]
  port              = 443
  type              = "HTTPS"
  failure_threshold = 3
  request_interval  = 30
  
  tags = {
    Name = "health-check-primary-${var.environment}"
  }
}

resource "aws_route53_health_check" "secondary" {
  fqdn              = split("/", replace(aws_apigatewayv2_stage.secondary.invoke_url, "https://", ""))[0]
  port              = 443
  type              = "HTTPS"
  failure_threshold = 3
  request_interval  = 30
  
  tags = {
    Name = "health-check-secondary-${var.environment}"
  }
}
```

### Prevention Strategy

1. Use `split("/", url)[0]` to extract hostname from URLs containing paths
2. Remove `resource_path` parameter when health checking API Gateway root endpoints
3. Validate FQDN format against RFC1738 reserved characters before health check creation
4. For API endpoints requiring path-based health checks, use Application Load Balancer instead of API Gateway direct health checks
5. Test FQDN extraction logic with sample API Gateway URLs during development

---

## Summary and Recommendations

### Key Takeaways

1. **AWS Provider Version Awareness:** Breaking changes in AWS Provider 5.x require explicit configuration of previously optional parameters
2. **Domain Name Validation:** Always validate domain names against AWS reserved lists before deployment
3. **URL Parsing:** Properly extract hostname from URLs using string manipulation functions when configuring health checks

### Recommended Improvements

1. Add pre-deployment validation scripts to check for common configuration issues
2. Implement unit tests for Terraform string manipulation functions
3. Document AWS Provider version requirements and breaking changes
4. Create reusable modules for Route53 health checks with built-in URL parsing

### Model Training Opportunities

These errors provide valuable training data for:
- AWS Provider version-specific parameter requirements
- AWS service reserved resource naming patterns
- Proper FQDN extraction from complex URLs
- Terraform function usage for string manipulation