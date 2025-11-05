# Multi-Environment Data Processing Pipeline

Hey team,

We've got a request from our financial services client to build out a data processing pipeline that stays consistent across their dev, staging, and prod environments. They've been struggling with configuration drift between environments and need a single codebase that can deploy identical architectures with just the environment-specific parameters changed.

The business requirement is pretty clear - they need to replicate any configuration changes or data schema updates across all three environments immediately, but each environment needs its own resource sizing, naming, and certain operational settings. Think of it like having one blueprint that can scale up or down based on where it's being deployed.

I've been asked to implement this using **CDKTF with TypeScript** for the infrastructure code. This approach gives us the flexibility of code while keeping Terraform's state management benefits.

## What we need to build

Create a multi-environment data processing pipeline using **CDKTF with TypeScript** that maintains architectural consistency across dev, staging, and production environments while supporting environment-specific configurations.

### Core Infrastructure Components

1. **S3 Buckets for Data Ingestion**
   - Environment-specific naming pattern: myapp-{env}-data-{environmentSuffix}
   - Versioning enabled on all buckets
   - Different lifecycle policies per environment: 30 days (dev), 90 days (staging), 365 days (prod)
   - All buckets must include the environmentSuffix for uniqueness

2. **DynamoDB Tables for Metadata Storage**
   - Consistent table schemas across all environments
   - Environment-specific capacity settings:
     - dev: 5 read / 5 write units (on-demand billing)
     - staging: 10 read / 10 write units (provisioned)
     - prod: 25 read / 25 write units (provisioned)
   - Table names must include environmentSuffix

3. **Lambda Functions for Data Processing**
   - Node.js 18.x runtime
   - Identical processing code across all environments
   - Environment-specific memory allocations:
     - dev: 512MB
     - staging: 1024MB
     - prod: 2048MB
   - X-Ray tracing enabled for staging and production only (disabled in dev)
   - Function names must include environmentSuffix

4. **EventBridge Rules for Event Routing**
   - Trigger Lambda functions on S3 object creation events
   - Connect each environment's S3 bucket to its corresponding Lambda
   - Rule names must include environmentSuffix

5. **SNS Topics for Alerting**
   - Environment-specific email endpoints for notifications
   - Different subscription configurations per environment
   - Topic names must include environmentSuffix

6. **IAM Roles and Permissions**
   - Least-privilege IAM roles for Lambda execution
   - Specific permissions for S3 read/write
   - DynamoDB read/write access
   - SNS publish permissions
   - X-Ray daemon write permissions (staging/prod only)
   - CloudWatch Logs write permissions

7. **Custom CDKTF Construct**
   - Encapsulate the entire pipeline as a reusable construct
   - Extend the Construct class
   - Accept environment-specific parameters
   - Allow easy replication across environments

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **S3** for data storage with versioning and lifecycle management
- Use **DynamoDB** for fast metadata access
- Use **Lambda** (Node.js 18.x) for serverless data processing
- Use **EventBridge** for event-driven architecture
- Use **SNS** for alerting and notifications
- Use **IAM** for security and access control
- Use **CloudWatch** for logging and monitoring
- Use **X-Ray** for distributed tracing (staging/prod only)
- Deploy to **ap-southeast-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-{env}-name-{environmentSuffix}

### Implementation Architecture

- Single CDKTF application with multiple stacks
- Stack naming pattern: DataPipeline-{Environment}-Stack
- All environment-specific values defined in cdktf.json context
- Shared infrastructure code through custom construct
- Use CDKTF context values for environment configuration
- Apply tags uniformly using CDKTF tagging features

### Constraints

- All resources must be fully destroyable (no Retain deletion policies)
- Encryption at rest and in transit for all data storage
- Follow principle of least privilege for all IAM policies
- Enable appropriate logging and monitoring for all services
- Include proper error handling in Lambda functions
- Stack names must follow pattern: DataPipeline-{Environment}-Stack
- DynamoDB billing: on-demand for dev, provisioned for staging/prod
- Lambda X-Ray tracing: disabled in dev, enabled in staging/prod
- All resources must include environmentSuffix in their names

### Resource Tagging

- Apply Environment tag to all resources (dev, staging, prod)
- Apply CostCenter tag to all resources
- Use consistent tagging strategy across all environments
- Tags should be applied uniformly to enable cost tracking and resource organization

## Success Criteria

- **Functionality**: Three separate CDKTF stacks deploy successfully with identical architecture
- **Consistency**: Schema and configuration changes replicate across all environments
- **Environment Isolation**: Each environment has independent resources with unique names
- **Resource Naming**: All resources include environmentSuffix for PR environment support
- **Performance**: Resources sized appropriately for each environment's load
- **Monitoring**: CloudWatch logs capture all Lambda executions and errors
- **Tracing**: X-Ray provides request tracing in staging and production
- **Cost Management**: Tags enable environment-specific cost tracking
- **Security**: All IAM roles follow least-privilege principles
- **Code Quality**: TypeScript code is well-structured, type-safe, and documented

## What to deliver

- Complete CDKTF TypeScript implementation with custom construct
- cdktf.json with context values for all three environments
- Lambda function code (Node.js 18.x) in lib/lambda/ directory
- IAM roles and policies with least-privilege permissions
- CloudFormation outputs for bucket names, table names, and SNS topic ARNs
- All resources properly tagged with Environment and CostCenter
- Documentation explaining the architecture and deployment process
- Infrastructure that can be deployed and destroyed cleanly for CI/CD

The key goal here is having one codebase that can confidently deploy to any environment with just configuration changes. No code modifications should be needed when promoting changes from dev to staging to production.
