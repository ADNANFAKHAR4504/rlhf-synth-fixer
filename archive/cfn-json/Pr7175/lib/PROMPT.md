# AWS WAF Security Infrastructure for API Protection

Hey team,

We've got a fintech startup that needs to lock down their API endpoints with AWS WAF. They're dealing with common web attacks and abuse issues, and their security team wants everything managed through Infrastructure as Code so it's auditable and version-controlled. This needs to be built using **CloudFormation with JSON** for their us-east-1 production environment.

The current situation is they've already got an Application Load Balancer running across multiple AZs serving HTTPS traffic, and they need comprehensive WAF protection layered on top. The security requirements are pretty specific: rate limiting to prevent abuse, geo-blocking for certain countries, SQL injection protection, and centralized logging for compliance. Everything needs to integrate with their existing ALB without disrupting current traffic.

## What we need to build

Create a production-ready AWS WAF configuration using **CloudFormation with JSON** that provides comprehensive security controls for API endpoints with centralized logging and monitoring.

### Core Requirements

1. **WAFv2 Web ACL Configuration**
   - Create WAFv2 Web ACL (not WAF Classic) with CloudWatch metrics enabled
   - Associate the Web ACL with existing Application Load Balancer using ARN parameter
   - Configure proper default action and rule priorities

2. **Rate Limiting Protection**
   - Implement rate-based rule limiting 2000 requests per 5-minute window per IP address
   - Ensure rate limiting applies per source IP to prevent distributed abuse
   - Configure appropriate action (block or count) for rate limit violations

3. **SQL Injection Protection**
   - Add AWS Managed Rule Group for SQL injection protection (AWSManagedRulesSQLiRuleSet)
   - Use AWS-managed rules to benefit from automatic updates
   - Configure rule group with appropriate action overrides if needed

4. **Geo-Blocking Rules**
   - Create geo-blocking rule to deny traffic from North Korea (KP) and Iran (IR)
   - Use country codes for geo-matching conditions
   - Set rule action to block matching requests

5. **IP Allowlisting**
   - Create IP set for allowlisting trusted office IPs (10.0.0.0/24 and 192.168.1.0/24)
   - Configure rule to allow traffic from allowlisted IPs regardless of other rules
   - Use appropriate rule priority to ensure allowlist is checked first

6. **Centralized Logging Infrastructure**
   - Set up S3 bucket for WAF logs with AES256 encryption enabled
   - Configure bucket with proper naming convention including **environmentSuffix**
   - Implement bucket policy allowing WAF to write logs
   - Enable versioning and lifecycle policies for log retention

7. **WAF Logging Configuration**
   - Configure WAF logging to send all logs to the S3 bucket
   - Set up proper resource policies for log delivery
   - Ensure logging captures all matched rules and actions

8. **Outputs for Verification**
   - Output Web ACL ARN for reference and association verification
   - Output S3 bucket name for log access and monitoring integration
   - Include any additional identifiers needed for operational access

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS WAFv2** (not WAF Classic) for all web ACL and rule configurations
- Use **Amazon S3** for centralized log storage with encryption
- Resource names must include **environmentSuffix** for uniqueness across PR environments
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Use Parameters for ALB ARN and environmentSuffix to support multiple deployments

### Constraints

- WAFv2 API must be used for all WAF resources (no Classic WAF resources)
- Rate limiting must allow exactly 2000 requests per 5-minute window per IP
- SQL injection protection must use the specific AWS managed rule group: AWSManagedRulesSQLiRuleSet
- All WAF logs must be sent to S3 bucket with AES256 server-side encryption
- Geo-blocking must block traffic from North Korea (KP) and Iran (IR) using country codes
- IP sets must include both office ranges: 10.0.0.0/24 and 192.168.1.0/24
- All resources must be destroyable (no DeletionPolicy: Retain)
- Include proper error handling and validation for all resources
- All resources must have Cost Allocation tags with Environment and Project keys

### Deployment Requirements (CRITICAL)

- **Resource Naming**: All named resources MUST include environmentSuffix parameter in their names
- **Destroyability**: All resources MUST be destroyable - do NOT use DeletionPolicy: Retain
- **No Hardcoded Values**: Do not hardcode environment names like prod, dev, stage in resource names
- **Proper Dependencies**: Use DependsOn where necessary to ensure correct resource creation order
- **S3 Bucket Naming**: Follow format `aws-waf-logs-{environmentSuffix}` with proper uniqueness guarantees

## Success Criteria

- **Functionality**: WAF successfully blocks malicious traffic including SQL injection attempts and geo-blocked countries
- **Performance**: Rate limiting accurately tracks and blocks IPs exceeding 2000 requests per 5-minute window
- **Reliability**: All rules execute in correct priority order with allowlist checked first
- **Security**: S3 bucket for logs has AES256 encryption enabled and proper access controls
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Logging**: All WAF activity logged to S3 with proper formatting for analysis tools
- **Integration**: Web ACL successfully associates with ALB without disrupting existing traffic
- **Code Quality**: Valid CloudFormation JSON template, well-structured, follows AWS best practices

## What to deliver

- Complete CloudFormation JSON template implementing all security controls
- WAFv2 Web ACL with rate limiting, SQL injection protection, and geo-blocking rules
- S3 bucket for WAF logs with encryption and proper bucket policies
- IP set resource for office IP allowlisting
- Web ACL association with Application Load Balancer
- CloudFormation Parameters for ALB ARN and environmentSuffix
- CloudFormation Outputs for Web ACL ARN and S3 bucket name
- Proper resource tagging with Environment and Project cost allocation tags
