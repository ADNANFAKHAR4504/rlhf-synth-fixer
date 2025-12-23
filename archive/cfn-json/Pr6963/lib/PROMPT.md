Hey team,

We need to build a production-grade AWS WAF security solution for our API protection infrastructure. Our fintech startup is getting increasingly sophisticated attack traffic, and we need robust, auditable security controls deployed through Infrastructure as Code. I've been asked to create this using **CloudFormation with JSON**.

The business wants comprehensive web application firewall protection with multiple layers: rate limiting to prevent DDoS attacks, SQL injection blocking, geo-blocking for high-risk countries, and centralized logging for compliance audits. All of this needs to integrate with our existing Application Load Balancer that's already serving production traffic.

This is a critical security implementation. We're protecting financial APIs, so we need to ensure everything follows best practices: encryption at rest for logs, proper IAM permissions, CloudWatch metrics for monitoring, and the ability to allowlist our office IPs so internal testing doesn't get blocked.

## What we need to build

Create a comprehensive AWS WAF security infrastructure using **CloudFormation with JSON** that protects API endpoints with rate limiting, geo-blocking, SQL injection prevention, and centralized logging.

### Core Requirements

1. **WAFv2 Web ACL**
   - Create a WAFv2 Web ACL with CloudWatch metrics enabled
   - Must use WAFv2 (not WAF Classic) for all configurations
   - Set proper metric names for CloudWatch integration
   - Enable sampled requests for debugging

2. **Rate Limiting Protection**
   - Configure rate-based rule limiting 2000 requests per 5-minute window per IP address
   - This prevents DDoS and brute force attacks
   - Must be enforced per client IP

3. **SQL Injection Protection**
   - Add AWS Managed Rule Group for SQL injection protection
   - Use AWSManagedRulesSQLiRuleSet managed rule group
   - Leverage AWS's continuously updated threat intelligence

4. **Geo-Blocking**
   - Create geo-blocking rule to deny traffic from high-risk countries
   - Block traffic from North Korea (KP) and Iran (IR)
   - Return 403 Forbidden for blocked requests

5. **Centralized Logging Infrastructure**
   - Set up S3 bucket for WAF logs with AES256 encryption
   - Configure WAF logging to send all requests to the S3 bucket
   - Ensure proper resource policies allow WAF service to write logs
   - Bucket must follow naming convention with EnvironmentSuffix

6. **IP Allowlisting**
   - Create IP set for allowlisting trusted office IPs
   - Include 10.0.0.0/24 and 192.168.1.0/24 CIDR ranges
   - Ensure allowlisted IPs bypass rate limiting and geo-blocking

7. **ALB Integration**
   - Associate Web ACL with existing Application Load Balancer
   - Use ALB ARN parameter for flexible integration
   - Ensure proper WebACLAssociation resource

8. **Outputs for Verification**
   - Output Web ACL ARN for reference and integration
   - Output S3 bucket name for log access and verification
   - Include any other relevant resource identifiers

### Optional Enhancements

If time permits and for additional security value:

- Add AWS Managed Rules for Known Bad Inputs (AWSManagedRulesKnownBadInputsRuleSet) to block common attack patterns
- Implement custom rule for User-Agent filtering to prevent bot traffic
- Configure Kinesis Firehose for real-time log streaming to enable real-time security analysis

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS WAFv2** for all web application firewall resources
- Use **S3** for centralized logging with encryption
- Use **CloudWatch Metrics** for monitoring WAF activity
- Use **CloudWatch Logs** for additional logging if needed
- Configure **IAM** service permissions for WAF logging
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-type-${EnvironmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no DeletionPolicy: Retain)

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: ALL named resources (S3 buckets, IP sets, Web ACLs) MUST include the EnvironmentSuffix parameter in their names using !Sub syntax
- **Destroyability**: NO DeletionPolicy: Retain allowed on any resource - all resources must be deletable after testing
- **Parameters**: Accept ALBArn and EnvironmentSuffix as CloudFormation parameters
- **S3 Bucket Policies**: Ensure S3 bucket has proper resource policy to allow aws-waf-logs service principal to write logs
- **WAF Logging Configuration**: Use correct AWS::WAFv2::LoggingConfiguration resource with proper log destination ARN format (arn:aws:s3:::aws-waf-logs-bucket-name)

### Constraints

- Use AWS WAFv2 API (not WAF Classic) for all rules and configurations
- Rate limiting must allow exactly 2000 requests per 5-minute window per IP address
- SQL injection protection must use AWS managed rule groups, not custom rules
- All WAF logs must be sent to S3 bucket with AES256 encryption enabled
- Web ACL must be associated with an existing Application Load Balancer via parameter
- Custom rules must block requests from North Korea (KP) and Iran (IR) country codes
- IP sets must be defined for allowlisting 10.0.0.0/24 and 192.168.1.0/24
- All resources must have proper CloudFormation metadata and tags
- Include proper error handling and logging configuration

### Security Requirements

- S3 bucket must have server-side encryption with AES256
- S3 bucket must block public access
- WAF logs must not be publicly accessible
- Use least privilege IAM permissions
- Enable CloudWatch metrics for monitoring
- Tag all resources with Environment and Project keys for cost allocation

## Success Criteria

- **Functionality**: WAF successfully blocks malicious traffic based on rate limits, SQL injection patterns, and geo-location
- **Rate Limiting**: Correctly limits to 2000 requests per 5-minute window per IP
- **SQL Protection**: AWS managed SQL injection rule group is active and monitoring
- **Geo-Blocking**: Traffic from North Korea and Iran is blocked with 403 response
- **Logging**: All WAF requests are logged to S3 bucket with encryption
- **Integration**: Web ACL is associated with ALB and actively filtering traffic
- **IP Allowlisting**: Office IPs can access without being blocked
- **Resource Naming**: All resources include EnvironmentSuffix parameter
- **Destroyability**: All resources can be deleted via CloudFormation stack deletion
- **Code Quality**: Clean JSON syntax, well-structured, follows CloudFormation best practices
- **Outputs**: Web ACL ARN and S3 bucket name are available for verification

## What to deliver

- Complete CloudFormation JSON template with all required resources
- AWS WAFv2 Web ACL with rate limiting, SQL injection protection, and geo-blocking rules
- S3 bucket for WAF logs with encryption and proper access policies
- IP set for office IP allowlisting
- WebACLAssociation to connect WAF with ALB
- CloudWatch metrics configuration for monitoring
- Proper IAM service roles and policies
- Parameters for EnvironmentSuffix and ALB ARN
- Outputs for Web ACL ARN and S3 bucket name
- All resources properly tagged for cost allocation
- Documentation in comments explaining each major section
