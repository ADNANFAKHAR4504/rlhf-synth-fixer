ROLE: You are a senior Terraform engineer specializing in global content delivery and security.

CONTEXT:
A media company needs to deliver content to 5 million users globally with DDoS protection and compliance with regional regulations. The system must provide low-latency delivery, content personalization, and detailed access analytics across multiple regions.

CONSTRAINTS:
- Deploy infrastructure in us-east-1 (primary) and ap-southeast-1 (secondary) regions.
- Use CloudFront with WAF for DDoS protection and web application firewall rules.
- Implement encryption at rest (S3, KMS) and in transit (ACM certificates).
- Configure Lambda@Edge for content personalization at edge locations.
- Ensure compliance with regional data regulations (data residency, logging).
- Set up comprehensive monitoring and analytics (CloudWatch, QuickSight).
- Follow AWS Well-Architected Framework best practices for security and performance.
- Use Terraform best practices: modules, remote state, and proper resource dependencies.

DELIVERABLES:
1) tap_stack.tf (All resources and output in single file with outputs )
2) variables.tf (parameterized configuration for multi-region deployment)



OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:
```hcl
# tap_stack.tf
...
```

SPECIFIC REQUIREMENTS:
1) S3 Buckets:
   - Create separate buckets for content storage in each region
   - Enable versioning, server-side encryption (KMS), and logging
   - Configure lifecycle policies for cost optimization
   - Implement proper bucket policies and CORS configuration

2) CloudFront Distribution:
   - Configure origin access identity (OAI) for S3 bucket access
   - Set up multiple origins for regional failover
   - Enable HTTP/2 and HTTP/3 support
   - Configure custom cache behaviors and TTL policies
   - Add custom headers for security and tracking

3) WAF Configuration:
   - Create WAF web ACL with DDoS protection rules
   - Implement rate limiting (per IP, per session)
   - Add managed rule groups (AWS Core, Known Bad Inputs)
   - Configure geo-blocking if needed for compliance
   - Set up IP reputation lists and custom rules

4) Route 53:
   - Create hosted zone and DNS records
   - Configure health checks for failover
   - Implement latency-based or geolocation routing
   - Set appropriate TTL values for DNS records

5) Lambda@Edge:
   - Create functions for viewer request/response manipulation
   - Implement content personalization logic
   - Add security headers (HSTS, CSP, X-Frame-Options)
   - Configure appropriate execution role and permissions

6) Monitoring & Analytics:
   - CloudWatch dashboards for real-time metrics
   - Alarms for error rates, latency, and traffic anomalies
   - CloudFront access logs to S3
   - QuickSight dashboards for business analytics
   - Enable AWS CloudTrail for audit logging

7) Security & Encryption:
   - KMS keys for S3 encryption in each region
   - ACM certificates for CloudFront (must be in us-east-1)
   - IAM roles following least privilege principle
   - Enable S3 Block Public Access
   - Configure encryption in transit and at rest

8) Multi-Region Considerations:
   - Use S3 cross-region replication if needed
   - Configure CloudFront to use optimal edge locations
   - Ensure KMS keys are created in respective regions
   - Handle regional service availability and quotas

VALIDATION CHECKLIST:
- All resources are properly tagged (Environment, Project, ManagedBy)
- Terraform state is stored remotely with locking enabled
- All sensitive values use variables (no hardcoded secrets)
- Proper dependencies are defined between resources
- Outputs provide essential information for operations
- Documentation includes troubleshooting and rollback procedures
