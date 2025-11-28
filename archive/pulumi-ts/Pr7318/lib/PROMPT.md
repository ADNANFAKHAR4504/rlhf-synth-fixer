# Zero-Trust Security Infrastructure for Microservices

## Platform and Language Requirements
**MANDATORY**: This infrastructure MUST be implemented using **Pulumi with TypeScript**.

## Task Overview
Create a Pulumi TypeScript program to deploy a zero-trust security infrastructure for microservices.

## Business Context
A financial services company needs to implement zero-trust security architecture for their microservices platform. The infrastructure must enforce strict network segmentation, certificate-based authentication, and automated secret rotation while maintaining compliance with PCI-DSS requirements.

## Infrastructure Requirements

The configuration must implement the following components:

1. **VPC with Private Subnets**
   - Create a VPC with only private subnets across 3 AZs
   - Configure VPC endpoints for AWS services
   - No Internet Gateway (IGW) - all outbound traffic through VPC endpoints

2. **AWS Secrets Manager with Automatic Rotation**
   - Configure AWS Secrets Manager with automatic rotation Lambda for database credentials and API keys
   - Enable automatic rotation every 30 days
   - All secrets must be stored in AWS Secrets Manager

3. **Network Load Balancer with mTLS**
   - Implement Network Load Balancer with ACM certificates for internal mTLS communication
   - Configure for internal service discovery with TLS termination
   - Network traffic between services must use mTLS with certificates managed by AWS Certificate Manager

4. **Security Groups**
   - Create security groups that deny all traffic by default
   - Explicitly allow only required ports
   - Each microservice must run in isolated security groups with no direct internet access

5. **CloudWatch Logs**
   - Set up CloudWatch Logs with encryption at rest and 90-day retention for audit trails
   - CloudTrail alternatives using CloudWatch Logs must capture all API calls for compliance

6. **IAM Roles with ABAC**
   - Configure IAM roles using ABAC (Attribute-Based Access Control) tags for fine-grained access control between services
   - IAM roles must follow least privilege with no inline policies or wildcard permissions

7. **Parameter Store / Systems Manager**
   - Deploy for non-sensitive configuration with encryption

8. **AWS WAF**
   - Implement AWS WAF rules on the internal load balancer to prevent OWASP Top 10 attacks

9. **CloudWatch Alarms**
   - Create CloudWatch alarms for failed authentication attempts exceeding thresholds

10. **Compute Services**
    - Use EC2 and Lambda for compute orchestration

## Technical Details
- Region: us-east-1
- Requires Pulumi 3.x with TypeScript
- AWS CLI v2 configured with appropriate permissions
- VPC with private subnets across 3 availability zones, no IGW, all outbound traffic through endpoints
- Network Load Balancer for internal service discovery with TLS termination

## Security Constraints
- All secrets must be stored in AWS Secrets Manager with automatic rotation enabled every 30 days
- Network traffic between services must use mTLS with certificates managed by AWS Certificate Manager
- Each microservice must run in isolated security groups with no direct internet access
- CloudTrail alternatives using CloudWatch Logs must capture all API calls for compliance
- IAM roles must follow least privilege with no inline policies or wildcard permissions

## Expected Output
A complete Pulumi program that provisions zero-trust infrastructure where services can only communicate through authenticated channels with full audit logging.

## Deployment Requirements (CRITICAL)

### Resource Naming
- All resource names MUST include the environmentSuffix parameter for uniqueness
- Pattern: `resource-name-${environmentSuffix}`

### Destroyability
- No resources should have RemovalPolicy.RETAIN or deletionProtection: true
- All resources must be destroyable for testing and cleanup

### Lambda Functions (Node.js 18+)
- Lambda runtime Node.js 18.x and above do NOT include AWS SDK v2 by default
- Either use AWS SDK v3 (`@aws-sdk/client-*`) with Lambda layers
- Or extract all needed data from event objects (preferred for rotation Lambda)
- FORBIDDEN: `require('aws-sdk')` in Node.js 18+ runtimes

### Secrets Manager Rotation
- Rotation Lambda must handle all rotation logic within the function
- Use environment variables for secret ARNs, not hardcoded values
- Rotation interval: 30 days

## Critical Requirements
- Follow Pulumi best practices for TypeScript implementation
- Ensure all code is production-ready with proper error handling
- All infrastructure code in Pulumi TypeScript only
