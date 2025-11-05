Hey team,

We need to build a multi-environment infrastructure deployment system for our financial services platform. The business wants consistent infrastructure across multiple environments (examples: development, staging, production), but each environment needs its own parameterized configurations for capacity, alerting, and data protection.

Our data processing workflows require identical S3 bucket setups and DynamoDB table schemas across all environments, but with environment-appropriate settings. Development needs to be lightweight and cost-effective, staging should mirror production at reduced scale, and production requires full redundancy with cross-region replication. The compliance team also mandates consistent tagging and monitoring across everything we deploy.

This needs to be implemented as reusable infrastructure patterns that we can deploy via CDKTF synth and deploy commands, generating separate CloudFormation stacks that can be stood up independently. The system must accept any environmentSuffix value (not just hardcoded environment names) to support CI/CD pipelines, PR-based deployments, and parallel testing environments.

## What we need to build

Create a multi-environment infrastructure deployment system using **CDKTF with TypeScript** that provisions consistent AWS resources across multiple environments with environment-specific configurations. The system must accept any dynamic environmentSuffix value (e.g., 'dev', 'staging', 'prod', 'pr-123', 'synth-abc123') for maximum deployment flexibility.

### Core Requirements

1. **Reusable S3 Bucket Constructs**
   - Define constructs with environment-specific naming using environmentSuffix
   - Configure retention policies that vary by environment
   - Enable versioning with lifecycle policies tailored to each environment

2. **DynamoDB Tables with Environment-Specific Capacity**
   - Create tables with identical schemas across all environments
   - Support both on-demand (PAY_PER_REQUEST) and provisioned billing modes
   - For cost-optimized test environments, on-demand billing is recommended
   - For production workloads, provisioned capacity may be configured
   - Configure appropriate read/write capacity settings when using provisioned mode

3. **Cross-Region Replication (Optional)**
   - Support S3 cross-region replication configuration when enabled
   - When enabled, replicate from primary region to ap-northeast-2
   - For cost-optimized test environments, replication may be disabled
   - Production environments may enable replication for disaster recovery

4. **Environment-Specific CloudWatch Alarms**
   - Monitor DynamoDB read/write capacity with environment-appropriate thresholds
   - Support configurable alarm threshold multipliers per environment
   - Example thresholds: dev at 50%, staging at 75%, production at 100% of baseline
   - Threshold multipliers should be configurable via environment configuration

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
   - Ensure required parameters are provided for selected configurations
   - Validate that provisioned billing mode includes capacity settings
   - Validate that cross-region replication includes replication region when enabled

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
- Resource names must include **environmentSuffix** for uniqueness (accepts any string value)
- Follow naming convention: resource-type-environment-suffix
- Deploy to **ap-northeast-2** region (or region specified via AWS_REGION environment variable or lib/AWS_REGION file)
- Use environment configuration functions for environment-specific settings
- Implement custom CDK constructs for reusable patterns
- Support dynamic environmentSuffix values for CI/CD and testing scenarios

### Constraints

- S3 cross-region replication is optional and configurable per environment (may be disabled for cost optimization)
- DynamoDB billing mode is configurable (on-demand recommended for cost-optimized test environments)
- All S3 buckets must have server-side encryption with AWS managed keys
- CloudWatch alarm thresholds must be configurable via threshold multiplier
- All resources must be destroyable with no Retain deletion policies
- Include proper error handling and logging
- Environment configuration must accept any environmentSuffix value (not restricted to specific names)
- Cost optimization is acceptable for test/training environments

## Success Criteria

- Functionality: Deployable CloudFormation stacks with environment-specific resources (supports any environmentSuffix)
- Performance: Appropriate capacity settings for each environment
- Reliability: Optional cross-region replication when enabled for disaster recovery
- Security: Server-side encryption, least-privilege IAM roles, secure configurations
- Resource Naming: All resources include environmentSuffix for uniqueness (accepts any string value)
- Flexibility: Supports dynamic environmentSuffix values for CI/CD pipelines and parallel testing
- Code Quality: TypeScript, well-tested, documented with clear deployment instructions

## What to deliver

- Complete CDKTF TypeScript implementation with custom constructs
- S3 buckets with encryption, versioning, lifecycle policies, and optional cross-region replication
- DynamoDB tables with configurable billing modes (on-demand or provisioned) and capacity settings
- CloudWatch alarms with configurable threshold multipliers per environment
- SNS topics integrated with CloudWatch for environment-specific alerts
- IAM roles with least-privilege policies for each environment
- Parameter validation to ensure configuration consistency
- CloudFormation outputs for resource ARNs and endpoints
- Support for dynamic environmentSuffix values (not restricted to specific environment names)
- Unit tests for all components
- Documentation and deployment instructions
