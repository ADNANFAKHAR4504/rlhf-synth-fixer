You are an expert Terraform author specializing in secure content delivery systems. Generate a production-ready Terraform configuration that deploys a CloudFront-based content delivery system for a publishing company distributing ~20,000 daily e-books to premium subscribers, with authentication, low-latency delivery, and comprehensive logging.

Requirements:

- S3 Origin Bucket: Create S3 bucket for e-book storage. Enable versioning. Block all public access. Configure separate prefixes: premium/ and free/. Lifecycle policy: transition objects to Glacier after 90 days (expose glacier_transition_days variable). Server-side encryption with KMS customer-managed key. Object ownership: BucketOwnerEnforced. Add bucket policy allowing only CloudFront OAI to read objects.
- CloudFront Distribution: Create distribution with S3 as origin. Configure Origin Access Identity (OAI) and update S3 bucket policy accordingly. Custom origin path if needed. Default cache behavior: viewer protocol policy = redirect-to-https, allowed methods = GET/HEAD/OPTIONS, cached methods = GET/HEAD, compress = true, TTL settings (min=0, default=86400, max=31536000 - expose as variables). Create additional cache behavior for premium/\* path pattern with signed URLs required (trusted_key_groups). Price class: PriceClass_100 or configurable (expose price_class variable). Enable IPv6. HTTP version: http2and3.
- Signed URLs: Create CloudFront public key and key group for signed URL generation. Store private key in AWS Secrets Manager. Expose public_key_pem variable (from file or inline). Configure cache behavior for premium content to require signed requests using the key group. Output instructions or Lambda example for generating signed URLs with expiration.
- Custom Domain & SSL: ACM certificate for custom domain (expose domain_name variable, e.g., cdn.publishingco.com). Use DNS validation with Route 53. Configure CloudFront with aliases = [domain_name] and acm_certificate_arn. Minimum protocol version: TLSv1.2_2021. SSL support method: sni-only.
- Route 53: Create or use existing hosted zone (expose hosted_zone_id variable; if empty, create new zone for domain_name). Create A record (alias) pointing to CloudFront distribution. Create AAAA record for IPv6.
- Lambda@Edge Authentication: Python 3.12 Lambda function deployed as Lambda@Edge (viewer-request event). Logic:
  - Extract authentication token from Cookie or Authorization header
  - Validate token format (JWT or custom format - configurable)
  - For premium content requests (URI starts with /premium/), check subscriber status via DynamoDB table (expose dynamodb_table_name variable) or external API (expose auth_api_endpoint variable)
  - If authorized, allow request through; if unauthorized, return 403 response with custom error page
  - Set cache headers appropriately
  - Environment variables: AUTH_TYPE (jwt|api|dynamodb), DYNAMODB_TABLE, API_ENDPOINT, JWT_SECRET_ARN (reference Secrets Manager)
- Lambda@Edge IAM: Role with permissions: logs:\*, dynamodb:GetItem (if using DynamoDB), secretsmanager:GetSecretValue (for JWT secret or API keys). Edge function requires special trust policy for edgelambda.amazonaws.com and lambda.amazonaws.com.
- DynamoDB Subscribers Table (optional): Create table (expose create_subscriber_table variable, default false) with partition key subscriber_id, attributes: subscription_tier (premium|free), expiration_timestamp. Global table for multi-region (optional).
- CloudFront Logging: Enable access logs. Send to separate S3 bucket (cloudfront-logs-{account_id}). Prefix: cdn-access-logs/. Bucket lifecycle: delete after 365 days (expose log_retention_days variable). Enable S3 bucket encryption with KMS. Bucket policy allowing CloudFront to write logs.
- S3 Access Logging: Enable access logging on origin bucket. Send logs to same logging bucket with prefix: s3-access-logs/.
- CloudWatch Metrics: CloudFront automatically publishes metrics. Create CloudWatch alarms:
  - 4xxErrorRate > 5% for 5 minutes
  - 5xxErrorRate > 1% for 5 minutes
  - TotalErrorRate > 5% for 5 minutes
  - Requests count < threshold (indicating outage)
    Publish to SNS topic (expose sns_topic_arn variable).
- Log Analytics Lambda: Python 3.12 Lambda triggered daily (EventBridge scheduled rule) to process CloudFront logs from S3. Logic:
  - Parse access logs (gzip compressed)
  - Calculate metrics: total requests, requests by subscriber tier (premium vs free), top 10 e-books downloaded, geographic distribution, cache hit ratio, average response time
  - Write metrics to CloudWatch custom metrics (namespace: Publishing/CDN)
  - Optionally write summary report to S3 or send via SNS
    Lambda needs: s3:GetObject on log bucket, cloudwatch:PutMetricData, logs:\*.
- Athena Integration (optional): Create Glue database and table for CloudFront logs. Expose enable_athena variable (default false). Provide DDL for Athena table creation pointing to S3 log location. Include sample queries in README for common analytics (top content, traffic by country, error analysis).
- WAF WebACL: Create WAF WebACL attached to CloudFront distribution:
  - AWS managed rule sets: AWSManagedRulesCommonRuleSet (OWASP Top 10), AWSManagedRulesKnownBadInputsRuleSet
  - Rate-based rule: block IPs exceeding 2000 requests per 5 minutes (expose rate_limit variable)
  - Geo-blocking: optionally block/allow specific countries (expose geo_restriction_type = whitelist|blacklist|none and geo_restriction_locations list)
  - Custom rule: block requests without valid User-Agent
- KMS Encryption: Customer-managed CMK for S3 buckets (origin and logs). Enable key rotation. Key policy allowing CloudFront, Lambda, and S3 services. Create alias kms-publishing-cdn.
- IAM Policies: Least-privilege policies for all roles. Separate policies for Lambda@Edge, log processing Lambda, CloudFront service. Use IAM policy documents and attachments. No inline policies.
- Tags: Apply tags (Environment, Application=Publishing, Owner, ManagedBy=Terraform, ContentType=EBooks).
- Outputs: CloudFront distribution ID, domain name, S3 bucket name, Route 53 record FQDN, CloudFront OAI ID, Lambda@Edge function ARN, log bucket name, WAF WebACL ARN, public key ID for signed URLs.

Deliverables (as separate code blocks):

1. versions.tf (Terraform >= 1.5, AWS provider >= 5.0, archive provider)
2. providers.tf (aws provider with region variable, us-east-1 provider alias for ACM/Lambda@Edge)
3. variables.tf (all inputs: domain_name, hosted_zone_id, price_class, glacier_transition_days, log_retention_days, sns_topic_arn, auth_type, dynamodb_table_name, auth_api_endpoint, public_key_pem, create_subscriber_table, enable_athena, rate_limit, geo_restriction_type, geo_restriction_locations, cache TTL variables)
4. s3.tf (origin bucket, logging bucket, versioning, lifecycle, encryption, bucket policies)
5. kms.tf (CMK for S3 encryption, key policy, alias)
6. cloudfront.tf (distribution, OAI, cache behaviors, custom domain, SSL, WAF association, logging, public key and key group)
7. acm.tf (certificate in us-east-1, DNS validation records)
8. route53.tf (hosted zone if needed, A and AAAA alias records)
9. lambda-edge-auth.tf (Lambda function, IAM role/policy, CloudFront association, archive for code)
10. lambda-edge-auth/index.py (authentication logic with JWT/API/DynamoDB validation)
11. dynamodb.tf (subscribers table if create_subscriber_table = true, with sample items in README)
12. lambda-log-processor.tf (Lambda, IAM role, EventBridge daily rule, Lambda permission, archive)
13. lambda-log-processor/index.py (parse CloudFront logs, calculate metrics, publish to CloudWatch)
14. waf.tf (WebACL with managed rules, rate-based rule, custom rules, geo-blocking)
15. monitoring.tf (CloudWatch alarms, SNS topic reference)
16. athena.tf (Glue database and table if enable_athena = true)
17. secrets.tf (Secrets Manager for private key and JWT secret - provide placeholder, user must update)
18. outputs.tf (all requested outputs)
19. README.md (deployment steps, DNS configuration, how to generate signed URLs with code examples in Python/Node.js, how to add subscribers to DynamoDB, Athena sample queries, subscriber authentication flow diagram, troubleshooting)

Conventions:

- Lambda@Edge must be created in us-east-1 region (use provider alias)
- Use data sources for existing resources (Route 53 zone) if IDs provided
- Include example public/private key pair generation commands (openssl) in README
- Provide example subscriber token format and validation logic
- Include sample curl commands for testing signed URLs
- Set default cache TTLs appropriate for static e-book content (long caching)
- Make WAF rules configurable via variables
- Use Terraform archive provider to package Lambda functions inline
- Mark sensitive outputs (private keys, secrets) appropriately
- Include data lifecycle diagram in README (upload -> S3 -> CloudFront -> subscriber)
- Return only the requested files as code blocks with no extra commentary
