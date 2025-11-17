# Multi-Environment Data Processing Pipeline

Hey team,

We need to build a data processing pipeline that can be deployed consistently across multiple environments. Our data analytics company is struggling with maintaining identical infrastructure patterns between dev, staging, and production, and we keep running into issues where configurations drift between environments. This needs to be implemented using **CDKTF with TypeScript** for the ap-southeast-1 region.

The core challenge here is that we need the same architecture everywhere, but with environment-appropriate sizing and configurations. For example, we don't need production-level capacity in dev, but we do need the same structure and security patterns. The business wants a single codebase that can deploy to any environment just by changing a context parameter.

Currently, the team is managing separate configurations for each environment, which leads to inconsistencies. We've had incidents where security policies were different between staging and prod, or where dev had features that weren't in prod yet. We need to fix this by using a single infrastructure definition that adapts based on environment context.

## What we need to build

Create a multi-environment data processing infrastructure using **CDKTF with TypeScript** that deploys consistent patterns across dev, staging, and production environments.

### Core Requirements

1. **Storage Layer**
   - S3 bucket per environment with environment-specific naming
   - Bucket names must include environment suffix for uniqueness
   - Example naming: company-data-dev, company-data-staging, company-data-prod
   - All buckets must be fully destroyable without retention policies

2. **Data Tracking**
   - DynamoDB table for job tracking with consistent schema across environments
   - Environment-specific capacity: dev (5/5 RCU/WCU), staging (10/10), prod (25/25)
   - Table names must include environment identifier

3. **Processing Functions**
   - Lambda functions for data processing with identical code
   - Environment-specific memory: dev (128MB), staging (256MB), prod (512MB)
   - Functions must have IAM roles that prevent cross-environment access

4. **Access Control**
   - IAM roles with least privilege access
   - Explicit denial of cross-environment access using condition statements
   - Policies must enforce environment boundaries

5. **Logging and Monitoring**
   - CloudWatch log groups for each Lambda function
   - Environment-specific retention: dev (7 days), staging (30 days), prod (90 days)
   - Consistent logging patterns across environments

6. **Environment Configuration**
   - Use CDKTF context variables for environment selection
   - Single app that deploys to any environment via: cdktf deploy --context env=dev/staging/prod
   - Stack names must include environment identifier

7. **Resource Tagging**
   - All resources tagged with Environment tag (dev/staging/prod)
   - All resources tagged with Project tag
   - Tags must be consistent across all resource types

8. **Output Visibility**
   - Stack outputs that clearly identify deployed resources per environment
   - Output bucket names, table names, Lambda ARNs, log group names

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **S3** for data storage buckets
- Use **DynamoDB** for job tracking metadata
- Use **Lambda** for data processing functions
- Use **IAM** for access control and cross-environment restrictions
- Use **CloudWatch** for log groups and retention policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **ap-southeast-1** region
- Use TypeScript interfaces for environment configuration
- Implement proper error handling and validation

### Constraints

- Environment names must be passed via CDK context, not hardcoded
- S3 bucket names must be globally unique
- All resources must be destroyable (no Retain policies)
- IAM policies must explicitly deny cross-environment resource access
- Stack names must clearly differentiate environments
- Use single CDK app structure that supports all three environments
- Follow CDK best practices for code reusability
- All Lambda functions must have proper IAM execution roles
- CloudWatch logs must have retention policies set

## Success Criteria

- **Functionality**: Deploy to any environment using context parameter
- **Consistency**: Identical architecture patterns across all environments
- **Isolation**: Complete data and access isolation between environments
- **Configuration**: Environment-specific sizing (capacity, memory, retention)
- **Security**: IAM policies prevent cross-environment access
- **Resource Naming**: All resources include environmentSuffix
- **Tagging**: Consistent Environment and Project tags on all resources
- **Visibility**: Clear stack outputs identifying resources
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete CDKTF TypeScript implementation
- Single stack that adapts based on environment context
- S3 buckets with environment-specific naming
- DynamoDB table with environment-specific capacity
- Lambda functions with environment-specific memory
- IAM roles with cross-environment access denial
- CloudWatch log groups with environment-specific retention
- Proper resource tagging (Environment, Project)
- Stack outputs for all key resources
- Unit tests for all components
- Documentation explaining deployment process
- Example commands for deploying to each environment
