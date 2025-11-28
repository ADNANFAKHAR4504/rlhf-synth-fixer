# Multi-Environment Infrastructure Deployment with Drift Detection

Hey team,

We're building infrastructure for a fintech startup's payment processing platform that needs to maintain consistent deployments across three environments: development, staging, and production. The business requirement is strict - we need identical infrastructure configurations with only environment-specific scaling parameters. This is critical for their GitOps workflows and compliance requirements.

The challenge here is maintaining perfect configuration parity while allowing necessary differences like database instance sizes and Lambda memory allocations. They've had issues in the past where staging and prod drifted apart, causing deployment surprises. We need to solve this with programmatic validation and compile-time type checking.

I've been asked to implement this using **Pulumi with TypeScript** for the type safety benefits and ability to create reusable component resources. The team is already using Pulumi CLI 3.x with TypeScript 5.x and Node.js 18+, so we're sticking with that stack.

## What we need to build

Create a multi-environment deployment system using **Pulumi with TypeScript** that enforces configuration consistency across dev, staging, and production environments while allowing controlled environment-specific variations.

### Core Requirements

1. **Lambda Function Deployment**
   - Deploy containerized Lambda functions with environment-specific resource allocations
   - Dev environment: 0.5 vCPU / 1GB memory
   - Staging environment: 1 vCPU / 2GB memory
   - Production environment: 2 vCPU / 4GB memory
   - All environments must use identical Docker image tags from shared ECR
   - Environment variables must be identical except for ENVIRONMENT_NAME
   - Use Node.js 18.x or later runtime

2. **Aurora PostgreSQL Database**
   - Deploy Aurora PostgreSQL 15.4 clusters in each environment
   - Dev environment: db.t4g.medium instance class
   - Staging/Production environments: db.r6g.large instance class
   - All clusters must have automated backups with 7-day retention
   - Customer-managed KMS keys for encryption with identical key policies
   - Database must be fully destroyable (skipFinalSnapshot: true, deletionProtection: false)

3. **Secrets Manager Integration**
   - Implement automatic rotation for database credentials
   - 30-day rotation schedule identical across all environments
   - Naming convention: {environment}-{service}-{secret-type}-{environmentSuffix}
   - Secrets must be destroyable (no recovery windows blocking cleanup)

4. **Component Resources**
   - Define reusable TypeScript component resources
   - Use TypeScript interfaces to enforce configuration consistency
   - Components should accept environment-specific parameters through typed interfaces
   - Implement validation logic in component constructors

5. **Stack References**
   - Use Pulumi stack references to import VPC and subnet IDs from networking stack
   - Reference format: organization/networking-stack/environment
   - VPCs are pre-provisioned with 3 availability zones per region

6. **Configuration Validation**
   - Implement custom validation functions that fail at deployment time
   - Validate environment configurations don't drift beyond allowed parameters
   - Generate runtime errors for configuration violations

7. **Drift Detection Manifest**
   - Generate JSON manifest comparing critical settings across environments
   - Include SHA-256 hash of configuration for drift detection
   - Output manifest as stack output for CI/CD consumption
   - Compare: Lambda memory, RDS instance classes, KMS key configurations

8. **CloudWatch Monitoring**
   - Configure CloudWatch alarms with environment-specific thresholds
   - Identical metric definitions across all environments
   - Log groups with consistent 30-day retention period

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for containerized application deployment
- Use **Aurora PostgreSQL 15.4** for database layer
- Use **AWS Secrets Manager** for credential rotation
- Use **AWS KMS** for customer-managed encryption keys
- Use **CloudWatch** for monitoring and logging
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{environment}-{environmentSuffix}
- Deploy to region-specific environments:
  - Production: us-east-1
  - Staging: us-west-2
  - Development: us-east-2
- Configure Pulumi backend with local file backend for development: `backend: {url: "file://./pulumi-state"}`

### Deployment Requirements (CRITICAL)

- All resources must be fully destroyable without manual intervention
- Aurora clusters: skipFinalSnapshot: true, deletionProtection: false
- Secrets: no recovery windows (forceDeleteWithoutRecovery: true or recoveryWindowInDays: 0)
- KMS keys: enableKeyRotation: true, deletionWindowInDays: 7 (minimum for testing)
- No RemovalPolicy.RETAIN or RETAIN deletion policies allowed
- All IAM roles must follow principle of least privilege
- No AWS managed policies - use custom inline policies only

### Constraints

- All environments must use identical Docker image tags pulled from shared ECR repository
- Lambda environment variables must be identical except ENVIRONMENT_NAME
- Database encryption keys must use customer-managed KMS keys with identical key policies
- CloudWatch log groups must have consistent 30-day retention
- Secrets Manager must use identical naming conventions with environment prefixes
- Stack outputs must include SHA-256 hash for drift detection

## Success Criteria

- Functionality: Three complete environments deploy successfully with environment-specific parameters
- Consistency: Configuration manifest shows only allowed differences between environments
- Validation: Custom validation functions catch configuration drift attempts
- Type Safety: TypeScript interfaces enforce compile-time configuration consistency
- Drift Detection: JSON manifest enables automated comparison in CI/CD
- Resource Naming: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be fully destroyed without manual cleanup
- Code Quality: TypeScript with strict types, well-structured component resources
- Documentation: Clear deployment instructions and stack configuration guidance

## What to deliver

- Complete Pulumi TypeScript implementation with component resources
- Stack configuration files: Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml
- TypeScript interfaces for environment-specific configuration
- Custom validation functions for configuration drift prevention
- JSON manifest generation for CI/CD integration
- Lambda function placeholder code (Node.js 18+)
- Documentation covering deployment process and stack references
- Pulumi.yaml with local file backend configuration
