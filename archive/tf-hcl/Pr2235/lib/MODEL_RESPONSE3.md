The error you're encountering is related to AWS WAFv2 scope requirements, not the region. Here's the explanation and fix:

## **Error Explanation:**

AWS WAFv2 has specific requirements for CloudFront-scoped Web ACLs:
- CloudFront-scoped WAF resources (`scope = "CLOUDFRONT"`) **must** be created in the **us-east-1** region
- This is because CloudFront is a global service that operates from us-east-1
- Even though your other resources are in us-west-2, the WAF for CloudFront must be in us-east-1

## **Solution:**

You need to create a separate AWS provider for us-east-1 specifically for the WAF resource. Here's the code snippet to fix this:

```hcl
# Add this provider configuration at the top of your file (after variables section)
# ============================================================================
# ADDITIONAL PROVIDER FOR CLOUDFRONT WAF (us-east-1 required)
# ============================================================================

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# ============================================================================
# CLOUDFRONT AND WAF (Updated Section)
# ============================================================================

# CloudFront Origin Access Control (keep as is)
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${local.name_prefix}-oac"
  description                       = "Origin Access Control for S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# WAF Web ACL - UPDATED to use us-east-1 provider
resource "aws_wafv2_web_acl" "main" {
  provider = aws.us_east_1  # Add this line
  
  name  = "${local.name_prefix}-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                 = "CommonRuleSetMetric"
      sampled_requests_enabled    = false
    }
  }

  tags = local.common_tags

  visibility_config {
    cloudwatch_metrics_enabled = false
    metric_name                 = "${local.name_prefix}-waf"
    sampled_requests_enabled    = false
  }
}

# CloudFront Distribution (keep the rest as is, just update the web_acl_id reference)
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name              = aws_s3_bucket.main.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
    origin_id                = "S3-${aws_s3_bucket.main.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.main.arn  # This will now reference the us-east-1 WAF

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.main.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudfront"
  })
}
```

## **Key Changes Made:**

1. **Added provider alias**: `provider "aws" { alias = "us_east_1", region = "us-east-1" }`
2. **Updated WAF resource**: Added `provider = aws.us_east_1` to the `aws_wafv2_web_acl` resource
3. **CloudFront remains unchanged**: It can reference the us-east-1 WAF from any region

## **Why This Works:**

- CloudFront is a global service that can reference resources across regions
- The WAF Web ACL created in us-east-1 can be attached to CloudFront distributions
- Your S3 bucket and other resources remain in us-west-2 as intended
- This is the standard AWS architecture pattern for CloudFront + WAF

After making these changes, your Terraform deployment should work correctly. The WAF will be created in us-east-1 while all other resources remain in us-west-2.
