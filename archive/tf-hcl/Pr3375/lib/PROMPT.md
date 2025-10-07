ROLE: You are a senior Terraform engineer specializing in AWS content delivery and security.

CONTEXT:
We need to deploy a secure content delivery system for a content publisher serving 5,000 daily readers globally with e-books. The system must ensure low-latency delivery, secure access, and comprehensive monitoring while being cost-effective and straightforward to manage.

CONSTRAINTS:
- Use S3 for e-book storage with server-side encryption
- Implement CloudFront with Origin Access Identity (OAI) for secure, low-latency delivery
- Configure Route 53 for DNS resolution and domain management
- Set up S3 bucket policy to restrict access only through CloudFront
- Implement CloudWatch for access metrics, logging, and monitoring
- Use KMS for server-side encryption key management
- Ensure HTTPS-only access with proper SSL/TLS certificates
- Design for global scalability and cost optimization
- Include proper IAM roles and policies for secure access
- Implement comprehensive monitoring and alerting

DELIVERABLES:
1) tap_stack.tf - Main resource file( S3 bucket, CloudFront distribution, Route 53, KMS, IAM resources)
2) variables.tf (configurable parameters for domain, bucket names, etc.)
3) outputs.tf (CloudFront domain, S3 bucket name, KMS key ID)
4) security.tf (S3 bucket policies, IAM roles, security configurations)
5) monitoring.tf (CloudWatch metrics, alarms, dashboards)
6) README.md (deployment instructions, architecture overview, cost considerations)


OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:
```hcl
# tap_stack.tf
...
```

ARCHITECTURE REQUIREMENTS:
- S3 bucket with versioning and encryption enabled
- CloudFront distribution with OAI for secure content delivery
- Route 53 hosted zone and DNS records
- KMS customer-managed key for encryption
- CloudWatch metrics for cache hit ratio, origin requests, and error rates
- IAM roles with least privilege access
- S3 bucket policy denying direct access (CloudFront-only access)

SECURITY REQUIREMENTS:
- All content must be encrypted at rest using KMS
- HTTPS-only access through CloudFront
- No direct S3 access (OAI-enforced)
- Proper IAM policies with least privilege
- CloudTrail logging for audit trails
- Security headers and caching policies

MONITORING REQUIREMENTS:
- CloudWatch metrics for performance monitoring
- Alarms for high error rates or unusual traffic patterns
- Cost monitoring and optimization recommendations
- Access pattern analysis for content popularity

COST OPTIMIZATION:
- Use appropriate S3 storage classes (Standard, IA, Glacier)
- Configure CloudFront caching policies efficiently
- Monitor and optimize data transfer costs
- Implement lifecycle policies for content archival
