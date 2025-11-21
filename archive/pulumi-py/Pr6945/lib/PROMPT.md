# Trading Analytics Platform Migration

Hey team,

We need to migrate our legacy on-premises trading analytics platform to AWS. This system processes market data in real-time and absolutely must maintain sub-second response times while ensuring data consistency across all our environments. The business is counting on us to get this right since any downtime or inconsistencies could directly impact trading decisions.

I've been asked to create this using **Pulumi with Python**. The platform needs to work seamlessly across three environments: development for testing new features, staging for validation, and production for live trading data. Each environment has different scaling requirements and we need to make sure resources are appropriately sized for each one.

The challenge here is that we can't just copy-paste the same configuration three times. Development needs minimal resources to keep costs down, staging should mirror production at about 50% capacity for realistic testing, and production needs to handle the full workload with no compromises. We also need to maintain strict isolation between environments so that dev work never impacts production.

## What we need to build

Create a multi-environment trading analytics platform using **Pulumi with Python** for infrastructure deployment across dev, staging, and production environments.

### Core Requirements

1. **Lambda Functions for Data Processing**
   - Create Lambda functions for real-time market data processing
   - Environment-specific memory: 512MB (dev), 1024MB (staging), 2048MB (production)
   - Must use ARM64 architecture for cost optimization
   - Include proper IAM execution roles

2. **DynamoDB Tables for Analytics Storage**
   - Deploy tables for storing real-time analytics results
   - Use on-demand billing in dev and staging
   - Use provisioned capacity in production
   - Implement consistent naming across environments

3. **S3 Buckets for Data Archival**
   - Create buckets for historical data storage
   - Enable versioning only in production environment
   - Configure appropriate access policies

4. **Environment-Aware IAM Configuration**
   - Implement IAM roles for Lambda-DynamoDB-S3 access
   - Follow least-privilege principle with no wildcard actions
   - Separate roles per environment

5. **CloudWatch Logging**
   - Set up log groups for all Lambda functions
   - Environment-specific retention: 7 days (dev), 30 days (staging), 90 days (production)
   - Enable proper log streaming

6. **Reusable Stack Architecture**
   - Define Stack class that accepts environment name as parameter
   - Use Pulumi data structures for environment configuration
   - Support independent deployment per environment

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Python 3.9 or higher for implementation
- Use **Lambda** for real-time data processing with ARM64 architecture
- Use **DynamoDB** for analytics storage with environment-specific billing
- Use **S3** for archival storage with production-only versioning
- Use **CloudWatch** for logging with environment-specific retention
- Use **IAM** for access control following least-privilege principle
- Use **VPC** with private subnets for compute resource isolation
- Deploy to **us-east-1** region
- Resource names must follow {env}-{service}-{region} pattern
- All resources must include environmentSuffix for uniqueness
- Pulumi remote backend with S3 state storage segregated by environment
- All resources tagged with Environment and ManagedBy tags
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- Each environment (dev, staging, production) must be independently deployable
- Stack instances must be isolated with separate state files
- Configuration values managed through Pulumi data structures
- Resource naming must include environment prefix for uniqueness
- No shared resources between environments except IAM service roles
- State files must be stored in S3 backend with environment-specific prefixes

### Constraints

- Lambda functions must use ARM64 architecture only
- DynamoDB on-demand billing in dev/staging, provisioned in production
- S3 versioning enabled only in production
- IAM roles must have no wildcard actions
- CloudWatch retention: 7 days (dev), 30 days (staging), 90 days (production)
- Lambda memory: 512MB (dev), 1024MB (staging), 2048MB (production)
- All resources must be destroyable (no Retain/RETAIN policies)
- VPC isolation required for each environment
- Environment-specific scaling configurations

## Success Criteria

- **Functionality**: Complete multi-environment deployment with Lambda, DynamoDB, S3, CloudWatch, and IAM
- **Environment Isolation**: Each environment deployable independently with separate state files
- **Resource Naming**: All resources follow {env}-{service}-{region} pattern with environmentSuffix
- **Performance**: Environment-specific resource sizing (512MB/1024MB/2048MB for Lambda)
- **Cost Optimization**: ARM64 architecture, on-demand billing in non-prod, appropriate retention periods
- **Security**: Least-privilege IAM roles with no wildcard actions
- **Compliance**: Proper tagging (Environment, ManagedBy), production-only versioning
- **Reliability**: Separate VPCs, proper error handling, CloudWatch logging
- **Code Quality**: Clean Python code, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation with reusable Stack class
- Lambda functions with environment-specific configurations
- DynamoDB tables with appropriate billing modes per environment
- S3 buckets with conditional versioning
- IAM roles and policies following least-privilege principle
- CloudWatch log groups with environment-specific retention
- VPC configuration with private subnets per environment
- Pulumi configuration for remote S3 backend
- Environment-specific resource tagging
- Unit tests for all components
- Documentation and deployment instructions for each environment
