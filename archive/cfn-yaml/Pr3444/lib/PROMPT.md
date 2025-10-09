Create CloudFormation infrastructure code in YAML format for a static website hosting solution for a small business expecting 3,000 monthly visitors with enhanced security and performance features.

Requirements:
- S3 bucket for static website content storage with public read access using bucket policy
- CloudFront distribution with SSL certificate for secure content delivery
- Route 53 hosted zone with A record pointing to CloudFront distribution
- S3 bucket for CloudFront access logs with 30-day lifecycle policy for automatic deletion
- CloudWatch dashboard displaying CloudFront cache hit ratio, S3 request metrics, and WAF metrics
- Restrict S3 bucket write access to CloudFront origin access identity only
- Use TLSv1.2_2021 security policy for CloudFront
- Enable S3 request metrics in CloudWatch for monitoring
- AWS WAF WebACL attached to CloudFront distribution with rate-based rule limiting requests to 2000 per 5 minutes per IP and managed rule group for common web vulnerabilities protection including SQL injection and XSS attacks
- Lambda@Edge function at viewer-request event to add security headers including X-Frame-Options, X-Content-Type-Options, and Strict-Transport-Security
- Lambda@Edge function at origin-response event to add custom cache control headers and remove unnecessary server headers
- IAM roles and policies for Lambda@Edge functions with least privilege permissions

The infrastructure should be cost-effective and optimized for low traffic volumes. Deploy in us-west-2 region. Note that Lambda@Edge functions and ACM certificates for CloudFront must be created in us-east-1 region.

Provide the complete CloudFormation template with all resources properly configured and outputs for key resource identifiers.