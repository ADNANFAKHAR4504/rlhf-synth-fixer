# Secure Secrets Vault with Automated Rotation

Hey team,

We need to build a secure secrets management system that automatically rotates database credentials. The compliance team has been asking for better secrets handling, and we've had too many incidents with hardcoded credentials in the past. I've been asked to create this using Pulumi with TypeScript.

The business wants a solution that stores sensitive database credentials securely, rotates them automatically every 30 days, and ensures everything is encrypted both at rest and in transit. We need to follow the principle of least privilege for all IAM policies and make sure we can track everything for compliance audits.

This needs to be production-ready, which means proper VPC isolation, encrypted logs, and tags for cost tracking. The security team is particularly concerned about key management, so we'll be using customer-managed KMS keys with automatic rotation enabled.

## What we need to build

Create a secrets management infrastructure using **Pulumi with TypeScript** for storing and automatically rotating database credentials on AWS.

### Core Requirements

1. **Database Infrastructure**
   - Aurora MySQL cluster with encryption at rest using customer-managed KMS key
   - Database must be in private subnets only (no public access)
   - Multi-AZ deployment for high availability
   - All connection credentials stored in AWS Secrets Manager

2. **Secrets Management**
   - AWS Secrets Manager secret for storing database credentials
   - Automatic rotation enabled with 30-day schedule
   - Lambda function to handle the rotation logic
   - Secret ARN must be exported as stack output

3. **Encryption and Key Management**
   - Customer-managed KMS key for encrypting database storage
   - Customer-managed KMS key for encrypting Secrets Manager secrets
   - KMS key rotation enabled automatically
   - CloudWatch Logs encrypted using KMS keys
   - Comprehensive KMS key policy allowing CloudWatch Logs service access

4. **Lambda Rotation Function**
   - Node.js 18.x runtime for rotation logic
   - Proper IAM role with least-privilege permissions
   - No wildcard permissions except for GetRandomPassword action
   - CloudWatch Logs integration for audit trail
   - Security group allowing access to Aurora cluster

5. **Network Architecture**
   - VPC with private subnets across multiple availability zones
   - VPC endpoints for AWS Secrets Manager (no internet access required)
   - VPC endpoints for AWS KMS (no internet access required)
   - Security groups properly configured for Lambda and Aurora communication
   - No NAT gateways or public subnets

6. **Security and Compliance**
   - All IAM policies follow least-privilege principle
   - No wildcard resource ARNs (except GetRandomPassword)
   - All resources tagged with Environment, CostCenter, and Compliance tags
   - CloudWatch Logs for Lambda function with encryption
   - Audit trail for all secret access

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Aurora MySQL 8.0** with engine version compatible with db.t3.medium instance class
- Use **AWS Secrets Manager** for credential storage
- Use **AWS Lambda** with Node.js 18.x runtime for rotation function
- Use **AWS KMS** for encryption key management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Constraints

- Aurora instance class must be **db.t3.medium** (db.t3.small is not compatible with Aurora MySQL 8.0)
- KMS key policy must include comprehensive permissions for CloudWatch Logs service
- KMS key policy must include encryption context condition for log group ARN
- All resources must be destroyable (skipFinalSnapshot: true, no deletion protection)
- Include proper error handling and logging in Lambda function
- Lambda function must handle all rotation steps: create, set, test, finish
- No hardcoded secrets or credentials in code

### Deployment Requirements (CRITICAL)

- All resource names must include **environmentSuffix** parameter for uniqueness
- All resources must support destruction without manual intervention
- Aurora cluster must use skipFinalSnapshot: true
- Aurora cluster must not have deletion protection enabled
- KMS key policy must allow CloudWatch Logs service principal
- Lambda function must be deployed in VPC with proper security groups

## Success Criteria

- **Functionality**: Database credentials stored in Secrets Manager and rotated automatically every 30 days
- **Performance**: Lambda rotation function completes within 5 minutes
- **Reliability**: Multi-AZ Aurora cluster with automatic failover capability
- **Security**: All data encrypted at rest and in transit, least-privilege IAM policies, no public access
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: TypeScript with proper type definitions, well-tested, documented
- **Compliance**: All resources tagged appropriately, audit logs enabled, encryption enforced

## What to deliver

- Complete Pulumi TypeScript implementation
- Aurora MySQL cluster in private subnets
- AWS Secrets Manager secret with automatic rotation
- Lambda function for credential rotation (Node.js 18.x)
- Customer-managed KMS keys with proper policies
- VPC endpoints for Secrets Manager and KMS
- Least-privilege IAM roles and policies
- CloudWatch Logs with KMS encryption
- Comprehensive tags on all resources
- Unit tests for all components
- Documentation and deployment instructions
- Export secret ARN as stack output
