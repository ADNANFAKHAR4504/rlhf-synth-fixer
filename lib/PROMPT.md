Hey team,

We need to build a secure data analytics platform for a financial services company that requires PCI-DSS compliance. The business is serious about defense-in-depth security, and they want everything locked down with multiple layers of protection. I've been asked to create this using **AWS CDK with TypeScript** and deploy to the us-east-1 region

The company processes sensitive financial data, and the security team has made it clear that they need encryption everywhere, strict access controls, complete audit logging, and network isolation. They're following a zero-trust approach and want to ensure that even if one security layer is compromised, others are still protecting the data. All traffic should stay within AWS using VPC endpoints with no internet gateways or NAT gateways.

This needs to handle a typical analytics workflow where raw data arrives in S3, gets processed by Lambda functions, and the results are accessed through a secure API. Everything needs to be auditable, and they want alarms on security events like failed authentication attempts.

## What we need to build

Create a secure data analytics platform using **AWS CDK with TypeScript** for PCI-DSS compliant financial data processing in us-east-1.

### Core Security Components

1. **Encryption Key Management**
   - KMS customer-managed key with automatic rotation enabled
   - Resource-based policy restricting key usage to specific IAM roles only
   - Key used for all data encryption across the platform

2. **Secure Data Storage**
   - Three S3 buckets: raw-data, processed-data, and audit-logs
   - All buckets encrypted with KMS (SSE-KMS)
   - Versioning enabled on all buckets
   - Bucket policies explicitly denying unencrypted uploads
   - Access logging from data buckets to audit bucket
   - Lifecycle policies on audit logs for compliance retention

3. **Network Isolation**
   - VPC with three private subnets across different availability zones
   - VPC endpoints for S3, DynamoDB, and Lambda
   - No internet gateway or NAT gateway
   - Security groups allowing only HTTPS traffic between components

4. **Data Processing**
   - Lambda functions for data processing running in private subnets
   - IAM roles with session policies limiting access to specific S3 prefixes
   - No internet access for Lambda functions
   - CloudWatch Log groups with KMS encryption and 90-day retention

5. **API Access Layer**
   - API Gateway REST API for secure data access
   - AWS WAF integration with custom rule groups
   - API key authentication
   - Request and response logging enabled

6. **Event Orchestration**
   - EventBridge rules triggering Lambda on S3 object creation events
   - Event-driven processing workflow

7. **Access Control and Governance**
   - IAM roles following least privilege principle
   - Permission boundaries on all roles
   - Explicit deny policies for destructive actions
   - No wildcard permissions

8. **Monitoring and Compliance**
   - CloudWatch alarms for security events
   - Failed authentication attempt monitoring
   - All logs encrypted with KMS
   - 90-day log retention for compliance

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Deploy to **us-east-1** region
- Use KMS customer-managed keys for all encryption
- VPC with private subnets only (no public subnets)
- VPC endpoints for AWS service communication
- Security groups with explicit port ranges (no 0.0.0.0/0 ingress)
- CloudWatch Logs retention set to exactly 90 days

### Deployment Requirements (CRITICAL)

- **All resource names MUST include environmentSuffix for uniqueness**
- Use pattern: `resource-name-${environmentSuffix}` for S3 buckets, KMS keys, Lambda functions, etc.
- Deploy with: `cdk deploy -c environmentSuffix=synth8k3zn9`
- **FORBIDDEN**: Do NOT use hardcoded suffixes like 'dev' or 'prod'
- **FORBIDDEN**: No `RemovalPolicy.RETAIN` on any resources
- **FORBIDDEN**: No `deletionProtection: true` on any resources
- All resources must be destroyable for testing and cleanup

### Service-Specific Requirements

- **Lambda**: Use Node.js 18.x or 20.x runtime (avoid SDK v2 dependencies)
- **IAM**: No wildcard (*) in resource ARNs, use specific resource references
- **S3**: Bucket names must be globally unique, always use environmentSuffix
- **KMS**: Key alias must include environmentSuffix
- **WAF**: Use AWS WAFv2 (not classic WAF)

### Constraints

- All S3 buckets use SSE-KMS encryption with customer-managed CMKs
- Lambda functions run in private subnets with no internet access
- IAM roles follow least privilege with explicit deny statements
- API Gateway endpoints protected by AWS WAF with custom rule groups
- VPC endpoints required for all AWS service communications
- Security groups use explicit port ranges, no 0.0.0.0/0 for ingress
- CloudWatch Logs retain audit trails for exactly 90 days with encryption
- No GuardDuty detector creation (account-level service)

## Success Criteria

- **Functionality**: All components deploy successfully and integrate correctly
- **Security**: KMS encryption on all data at rest, IAM least privilege enforced
- **Network Isolation**: All traffic flows through VPC endpoints, no internet access
- **Monitoring**: CloudWatch logs capture all operations, alarms configured
- **Compliance**: 90-day log retention, complete audit trail
- **Resource Naming**: All resources include environmentSuffix
- **Destroyability**: Stack can be destroyed completely without manual cleanup
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- KMS key with rotation and resource policy
- Three S3 buckets with encryption, versioning, and policies
- VPC with private subnets and VPC endpoints (S3, DynamoDB, Lambda)
- Lambda functions with IAM roles and session policies
- API Gateway with WAF integration and API key auth
- EventBridge rules for S3 event processing
- CloudWatch Log groups with encryption and retention
- Security groups for HTTPS-only traffic
- CloudWatch alarms for security events
- Stack outputs: API endpoint URL, S3 bucket names, KMS key ARN
- Unit tests for infrastructure components
- Documentation for deployment and usage
