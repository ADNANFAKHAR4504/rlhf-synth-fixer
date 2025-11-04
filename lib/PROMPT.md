Hey team,

We need to build a multi-environment infrastructure deployment system for our financial services platform. The business wants consistent infrastructure across development, staging, and production environments, but each environment needs its own parameterized configurations for capacity, alerting, and data protection.

Our data processing workflows require identical S3 bucket setups and DynamoDB table schemas across all three environments, but with environment-appropriate settings. Development needs to be lightweight and cost-effective, staging should mirror production at reduced scale, and production requires full redundancy with cross-region replication. The compliance team also mandates consistent tagging and monitoring across everything we deploy.

This needs to be implemented as reusable infrastructure patterns that we can deploy via CDKTF synth and deploy commands, generating three separate CloudFormation stacks that can be stood up independently.

## What we need to build

Create a multi-environment infrastructure deployment system using **CDKTF with TypeScript** that provisions consistent AWS resources across dev, staging, and production environments with environment-specific configurations.

### Core Requirements

1. **Reusable S3 Bucket Constructs**
   - Define constructs with environment-specific naming using environmentSuffix
   - Configure retention policies that vary by environment
   - Enable versioning with lifecycle policies tailored to each environment

2. **DynamoDB Tables with Environment-Specific Capacity**
   - Create tables with identical schemas across all environments
   - Use on-demand billing for dev and staging environments
   - Use provisioned capacity for production environment
   - Configure appropriate read/write capacity settings per environment

3. **Production Cross-Region Replication**
   - Implement S3 cross-region replication for production buckets only
   - Replicate from primary region to ap-northeast-2
   - No replication for dev or staging environments

4. **Environment-Specific CloudWatch Alarms**
   - Monitor DynamoDB read/write capacity with environment-appropriate thresholds
   - Dev alarms at 50% of baseline thresholds
   - Staging alarms at 75% of baseline thresholds
   - Production alarms at 100% of baseline thresholds

5. **SNS Alert Configuration**
   - Create SNS topics for each environment
   - Configure environment-specific email endpoints for alerts
   - Integrate with CloudWatch alarms for notifications

6. **Consistent Resource Tagging**
   - Apply Environment tag to all resources
   - Apply CostCenter tag to all resources
   - Ensure tags propagate across all infrastructure

7. **S3 Security and Lifecycle Configuration**
   - Enable server-side encryption with AWS managed keys on all buckets
   - Configure S3 bucket versioning across all environments
   - Implement lifecycle policies that vary by environment

8. **IAM Roles with Least-Privilege Access**
   - Create environment-specific IAM roles
   - Define least-privilege policies for each environment's needs
   - Separate roles for different resource access patterns

9. **Parameter Validation**
   - Validate environment configurations at deployment time
   - Prevent production settings from being applied to non-production environments
   - Ensure required parameters are provided

10. **Stack Outputs for Integration**
    - Generate CloudFormation outputs for key resource ARNs
    - Export endpoints for downstream consumption
    - Make outputs available for cross-stack references

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **S3** for object storage with environment-specific configurations
- Use **DynamoDB** for data storage with appropriate billing modes
- Use **CloudWatch** for monitoring with environment-specific alarm thresholds
- Use **SNS** for alerting with environment-appropriate topics
- Use **IAM** for access control with least-privilege policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **ap-northeast-2** region
- Use CDK context variables for environment-specific configurations
- Implement custom CDK constructs for reusable patterns

### Constraints

- Production S3 buckets must have cross-region replication to ap-northeast-2
- DynamoDB must use on-demand billing for dev/staging, provisioned for production
- All S3 buckets must have server-side encryption with AWS managed keys
- CloudWatch alarm thresholds must scale proportionally (dev: 50%, staging: 75%, prod: 100%)
- All resources must be destroyable with no Retain deletion policies
- Include proper error handling and logging
- Validate that production settings cannot be applied to non-production environments

## Success Criteria

- Functionality: Three deployable CloudFormation stacks with environment-specific resources
- Performance: Appropriate capacity settings for each environment
- Reliability: Production includes cross-region replication for disaster recovery
- Security: Server-side encryption, least-privilege IAM roles, secure configurations
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: TypeScript, well-tested, documented with clear deployment instructions

## What to deliver

- Complete CDKTF TypeScript implementation with custom constructs
- S3 buckets with encryption, versioning, lifecycle policies, and cross-region replication for production
- DynamoDB tables with environment-appropriate billing modes and capacity settings
- CloudWatch alarms with proportional thresholds across environments
- SNS topics integrated with CloudWatch for environment-specific alerts
- IAM roles with least-privilege policies for each environment
- Parameter validation to prevent configuration mismatches
- CloudFormation outputs for resource ARNs and endpoints
- Unit tests for all components
- Documentation and deployment instructions
