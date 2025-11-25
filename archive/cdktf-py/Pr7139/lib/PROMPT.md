# AWS WAF v2 with CloudFront Integration

Hey team,

We need to build a comprehensive web application firewall setup for one of our financial services clients. They're dealing with increasing security threats and need to implement geo-blocking for regulatory compliance. I've been asked to create this using CDKTF with Python to ensure we can deploy consistently across their multiple environments while maintaining strict security standards.

The business requirements are pretty clear here. They need a production-ready WAF configuration protecting a CloudFront distribution that serves content from an S3 bucket. The security team has specified exact rule sets they want implemented, and compliance has strict requirements around geo-blocking and logging. This needs to be bulletproof since it's protecting financial services infrastructure.

## What we need to build

Create a web application firewall and content delivery system using **CDKTF with Python** that protects against common attacks and enforces geographic access controls.

### Core Requirements

1. **WAF v2 Web ACL Configuration**
   - Create WAFv2 WebACL in CLOUDFRONT scope (must be in us-east-1)
   - Implement rate-based rule limiting requests to 2000 per 5 minutes per IP address
   - Use aggregation key type 'IP' with scope 'CLOUDFRONT' for rate limiting
   - Set IP allowlist as highest priority (priority 1)
   - Configure managed rule groups: AWSManagedRulesCommonRuleSet and AWSManagedRulesKnownBadInputsRuleSet

2. **Custom Security Rules**
   - Create custom rule to block SQL injection patterns in query strings
   - SQL injection rule must inspect URL query string with positional constraint 'CONTAINS'
   - Implement geo-blocking to allow only US, CA, and UK traffic
   - Create IP set for allowlisting office IPs: 203.0.113.0/24 and 198.51.100.0/24

3. **CloudFront Distribution**
   - Deploy CloudFront distribution with S3 origin
   - Associate the WAF WebACL with CloudFront distribution
   - Use Origin Access Control (OAC) instead of legacy Origin Access Identity
   - Set TLS 1.2 as minimum protocol version
   - Configure HTTPS-only viewer protocol policy

4. **S3 Origin Configuration**
   - Create S3 bucket in us-west-2 for origin storage
   - Enable versioning on the bucket
   - Block all public access
   - S3 bucket policy must explicitly deny non-HTTPS requests

5. **Monitoring and Logging**
   - Enable CloudWatch metrics for all WAF rules
   - Configure WAF logging to CloudWatch Logs in us-east-1
   - Set CloudWatch log retention to exactly 30 days for compliance

6. **Resource Management**
   - Tag all resources with Environment, Project, and CostCenter tags
   - All resource names must include environmentSuffix for uniqueness
   - Follow naming convention: {resource-type}-{environment-suffix}
   - All resources must be destroyable (no Retain policies)

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS WAFv2 for web application firewall
- Use CloudFront for content delivery
- Use S3 for origin storage
- Deploy WAF and CloudWatch Logs to us-east-1 region
- Deploy S3 bucket to us-west-2 region
- Python 3.9+ compatibility required
- CDKTF CLI 0.15+ required
- Create IAM roles for CloudFront S3 access and WAF logging permissions
- Include proper error handling and validation

### Deployment Requirements (CRITICAL)

- Resource names must include environmentSuffix parameter for environment isolation
- All resources must use RemovalPolicy DESTROY (no RETAIN policies allowed)
- WAF rules must be ordered correctly with IP allowlist at priority 1
- CloudFront must use OAC (Origin Access Control), not legacy OAI
- S3 bucket policies must explicitly deny HTTP (non-HTTPS) access

### Constraints

- WAF WebACL must be created in us-east-1 (CLOUDFRONT scope requirement)
- Rate limiting aggregation key must be type 'IP' with scope 'CLOUDFRONT'
- Custom SQL injection rule positional constraint must be 'CONTAINS'
- CloudWatch log retention must be exactly 30 days
- All managed rule groups must use vendor name 'AWS'
- Geo-blocking must allow only country codes: US, CA, GB

## Success Criteria

- Functionality: WAF blocks malicious requests, allows legitimate traffic, and enforces geo-restrictions
- Performance: Rate limiting prevents abuse without impacting normal users
- Reliability: CloudFront provides low-latency content delivery with WAF protection
- Security: All traffic uses HTTPS, SQL injection attempts blocked, office IPs allowlisted
- Resource Naming: All resources include environmentSuffix in their names
- Compliance: Logging enabled with 30-day retention, geo-blocking active
- Code Quality: Python code is well-structured, tested, and documented

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- CloudFront distribution with S3 origin and OAC
- WAFv2 WebACL with rate-based, managed, custom, geo-blocking, and IP allowlist rules
- S3 bucket with versioning, private access, and HTTPS-only policy
- CloudWatch Logs configuration with 30-day retention
- IAM roles and policies for service permissions
- Proper tagging on all resources
- Documentation and deployment instructions in lib/README.md
