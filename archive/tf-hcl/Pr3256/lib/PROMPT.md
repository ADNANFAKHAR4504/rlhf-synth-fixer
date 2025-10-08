Create infrastructure code in Terraform HCL for a donation platform static website.

Requirements:
- Deploy a static website in S3 bucket for HTML, JavaScript, and CSS files
- Configure CloudFront distribution with custom SSL certificate for global content delivery
- Set up Route 53 DNS alias record pointing to CloudFront distribution
- Configure S3 bucket policy allowing public read access for website content
- Implement CloudWatch metrics monitoring for access patterns
- Add S3 lifecycle rules to automatically archive logs to Glacier after 30 days
- Enable CloudFront Origin Access Control (OAC) for secure S3 access
- Configure CloudWatch Application Signals for runtime metrics collection

Implementation details:
- Use S3 bucket for hosting static website content
- Enable versioning on the S3 bucket for content protection
- Configure CloudFront with custom SSL certificate from ACM
- Restrict S3 write access to authorized IAM roles only
- Set up CloudWatch dashboard showing request metrics and error rates
- Create separate S3 bucket for CloudFront access logs
- Apply lifecycle policy to logs bucket for 30-day archival to Glacier

The infrastructure should handle 2,000 daily visitors with secure HTTPS access and efficient global content delivery.

Provide the complete Terraform infrastructure code with one code block per file.