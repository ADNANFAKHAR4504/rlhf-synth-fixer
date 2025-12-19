Hey team,

We need to build a multi-environment data processing infrastructure for a data analytics company. They're looking to maintain identical pipelines across dev, staging, and production environments with the same Lambda functions, S3 buckets, and DynamoDB tables, but with environment-specific configurations. The business wants a single configuration parameter to control which environment gets deployed, making it easy to replicate the same infrastructure pattern across all three environments.

The current challenge is that they're manually creating infrastructure for each environment, which leads to configuration drift and inconsistencies. They need a way to ensure that what works in dev will work exactly the same way in production, just with different resource capacities and settings. This is critical for their testing and deployment workflow.

I've been asked to create this using Pulumi with TypeScript. The infrastructure needs to handle S3 event processing through Lambda functions that update DynamoDB tables, with everything properly configured for each environment.

## What we need to build

Create a multi-environment data processing system using **Pulumi with TypeScript** that can be deployed to dev, staging, or prod environments by changing a single configuration value.

### Core Requirements

1. **Reusable Component Architecture**
   - Define a ComponentResource that encapsulates S3 bucket, Lambda function, and DynamoDB table
   - Component should accept environment name and create all resources with environment-specific settings
   - Enable reuse across multiple environments without code duplication

2. **Environment Configuration**
   - Accept environment name as a Pulumi configuration parameter (dev, staging, or prod)
   - Use Pulumi config system, not environment variables
   - Apply environment-specific settings based on configuration

3. **S3 Bucket Setup**
   - Create S3 buckets with environment-specific naming: data-processor-{env}-{random}
   - Enable versioning on all buckets
   - Block all public access
   - Include random suffix in bucket names for uniqueness

4. **Lambda Function Configuration**
   - Deploy Lambda functions that process S3 events
   - Use Node.js 18.x runtime
   - Environment-specific memory allocation:
     - dev: 512MB
     - staging: 1024MB
     - prod: 2048MB
   - Lambda code must be inline (not from external files)
   - Set 60-second timeout for all environments
   - Configure environment variables to reference the correct DynamoDB table

5. **DynamoDB Table Setup**
   - Create DynamoDB tables with environment-specific capacity settings
   - Use on-demand billing mode (PAY_PER_REQUEST)
   - Define appropriate partition key for data processing metadata
   - Include environment suffix in table names

6. **S3 Event Notifications**
   - Configure S3 event notifications to trigger Lambda on object creation
   - Lambda should receive bucket and object key from event
   - Ensure proper permissions for S3 to invoke Lambda

7. **Resource Tagging**
   - Apply consistent tags across all resources:
     - Environment: {env}
     - ManagedBy: Pulumi
   - Tags help with cost allocation and resource management

8. **IAM Roles and Policies**
   - Create IAM roles for Lambda execution with least-privilege policies
   - Grant Lambda permissions to:
     - Read from S3 bucket
     - Write to DynamoDB table
     - Write logs to CloudWatch
   - No wildcard permissions on production resources

9. **CloudWatch Logs**
   - Enable CloudWatch Logs for Lambda functions
   - Environment-specific retention periods:
     - dev: 7 days
     - staging: 14 days
     - prod: 30 days
   - Ensure logs are retained for debugging but not indefinitely

10. **Stack Outputs**
    - Export S3 bucket name for each deployment
    - Export Lambda function ARN for reference
    - Export DynamoDB table name for application configuration

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for data storage with versioning and encryption
- Use **Lambda** for serverless event processing with Node.js 18.x
- Use **DynamoDB** for metadata storage with on-demand billing
- Use **IAM** for role-based access control with least privilege
- Use **CloudWatch Logs** for logging with retention policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{env}-environment-suffix
- Deploy to **ap-northeast-2** region
- Use Pulumi ComponentResource pattern for reusability

### Constraints

- Lambda function code must be inline (not from external files) for simplicity
- All resource names must include a random suffix (environmentSuffix) to avoid conflicts
- S3 buckets must have versioning enabled and block public access
- DynamoDB tables must use on-demand billing mode despite capacity value references
- Lambda functions must have a 60-second timeout across all environments
- Use Pulumi configuration system (Pulumi.Config), not process.env
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling in Lambda code
- No hardcoded environment names in resource names (use configuration)

## Success Criteria

- **Functionality**: Single configuration change deploys to any environment with correct settings
- **Reusability**: ComponentResource pattern enables clean separation and reuse
- **Resource Isolation**: Each environment deployment creates isolated resources with unique names
- **Event Processing**: S3 object creation triggers Lambda which processes and updates DynamoDB
- **Security**: IAM roles follow least privilege, S3 buckets block public access
- **Observability**: CloudWatch logs available with appropriate retention
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript code with proper typing, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation with ComponentResource pattern
- S3 buckets with versioning, encryption, and event notifications
- Lambda functions with inline code for S3 event processing
- DynamoDB tables with on-demand billing for metadata storage
- IAM roles and policies with least-privilege access
- CloudWatch Logs configuration with environment-specific retention
- Pulumi stack exports for bucket name, Lambda ARN, and table name
- Configuration documentation showing how to deploy to different environments
- Unit tests validating resource creation and configuration
