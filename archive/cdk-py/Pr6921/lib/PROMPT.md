# Multi-Environment Fraud Detection Pipeline

Hey team,

We need to build a consistent fraud detection infrastructure that can be deployed across multiple environments for our financial services client. They are running a real-time fraud detection system that needs to be identical across dev, staging, and production environments, but with environment-specific configurations for resource sizing, retention policies, and alerting thresholds.

The challenge here is avoiding infrastructure drift between environments while still allowing for appropriate resource scaling. Right now they are manually managing separate configurations for each environment, which has led to inconsistencies and deployment errors. We need to implement this using **AWS CDK with Python** to leverage context variables and parameterized stacks.

The system handles real-time transaction data through Kinesis streams, processes it with Lambda functions, stores results in DynamoDB, and archives to S3. Each environment needs different resource allocations based on expected load, but the architecture must remain identical. We also need conditional tracing enabled only for staging and production to help with debugging without adding overhead to dev environments.

## What we need to build

Create a multi-environment fraud detection pipeline using **AWS CDK with Python** that deploys consistent infrastructure across dev, staging, and production environments with environment-specific configurations.

### Core Requirements

1. **Reusable Stack Architecture**
   - Implement a single CDK stack class that accepts environment configuration parameters
   - Use CDK context variables stored in cdk.json for environment-specific values
   - Support deployment to three environments: dev, staging, and prod
   - Ensure identical infrastructure topology across all environments

2. **Real-Time Data Ingestion**
   - Deploy Kinesis Data Streams for transaction ingestion
   - Configure environment-specific shard counts: dev (1 shard), staging (2 shards), prod (4 shards)
   - Resource names must include environmentSuffix for uniqueness
   - Enable stream encryption and proper retention settings

3. **Stream Processing**
   - Create Lambda functions for processing Kinesis streams
   - Configure environment-based memory allocation: dev (512MB), staging (1GB), prod (2GB)
   - Implement proper IAM roles with permissions for Kinesis, DynamoDB, S3, and SSM access
   - Lambda functions must read configuration from SSM Parameter Store
   - Include Python runtime code for processing fraud detection logic

4. **Data Storage**
   - Set up DynamoDB tables for storing processed fraud detection results
   - Configure environment-specific read/write capacity: dev (5/5), staging (10/10), prod (25/25)
   - Resource names must include environmentSuffix parameter
   - Enable point-in-time recovery for staging and production only

5. **Data Archival**
   - Create S3 buckets with naming pattern: company-fraud-data-{env}-{region}-{environmentSuffix}
   - Enable versioning for staging and production buckets only
   - Configure lifecycle policies appropriate for each environment
   - Enable auto-delete for bucket contents to ensure destroyability

6. **Monitoring and Alerting**
   - Implement CloudWatch alarms for Lambda error rates
   - Configure environment-specific error thresholds: dev (10%), staging (5%), prod (2%)
   - Set CloudWatch Logs retention: dev (7 days), staging (14 days), prod (30 days)
   - Create SNS topics for alarm notifications per environment

7. **Secure Configuration Management**
   - Use SSM Parameter Store for managing environment-specific API keys and connection strings
   - Create parameters with paths like: /fraud-detection/{env}/api-key
   - Lambda functions must read configuration from parameter store at runtime
   - Grant appropriate IAM permissions for parameter access

8. **Conditional Tracing**
   - Enable AWS X-Ray tracing only for staging and production environments
   - Configure Lambda functions with tracing mode based on environment
   - Ensure IAM roles include X-Ray write permissions when tracing is enabled

9. **IAM and Security**
   - Define consistent IAM roles across all environments using CDK Role construct
   - Implement least-privilege access policies
   - Use managed policies where appropriate
   - Tag all resources with environment and team information

10. **Multi-Region Support**
    - Support deployment to three regions: us-east-1 (prod), us-west-2 (staging), eu-west-1 (dev)
    - Each environment operates independently (no cross-region replication)
    - Region-specific configurations managed through CDK context

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use Python 3.8+ for CDK stack implementation
- Use **Amazon Kinesis Data Streams** for real-time data ingestion
- Use **AWS Lambda** for stream processing with Python runtime
- Use **Amazon DynamoDB** for storing processed results
- Use **Amazon S3** for data archival with lifecycle policies
- Use **AWS Systems Manager Parameter Store** for configuration management
- Use **Amazon CloudWatch** for logging and alarms
- Use **AWS IAM** for role and policy management
- Use **AWS X-Ray** conditionally for tracing (staging and prod only)
- Resource names must include environmentSuffix for uniqueness across deployments
- Follow naming convention: resource-name-{env}-{environmentSuffix}
- Deploy to us-east-1 region by default (configurable per environment)
- Use AWS CDK 2.x with Python bindings

### Deployment Requirements (CRITICAL)

1. **Resource Naming with environmentSuffix**
   - ALL resources MUST include environmentSuffix parameter in their names
   - Pattern: {resource-type}-{env}-{environmentSuffix}
   - Example: company-fraud-data-dev-${environmentSuffix}
   - This ensures unique resource names across multiple deployments

2. **Destroyability Requirements**
   - ALL resources must be easily destroyable without manual intervention
   - S3 buckets: auto_delete_objects=True, removal_policy=RemovalPolicy.DESTROY
   - DynamoDB tables: removal_policy=RemovalPolicy.DESTROY
   - Lambda functions: removal_policy=RemovalPolicy.DESTROY
   - Kinesis streams: removal_policy=RemovalPolicy.DESTROY
   - CloudWatch log groups: removal_policy=RemovalPolicy.DESTROY
   - FORBIDDEN: RemovalPolicy.RETAIN on any resource
   - FORBIDDEN: deletion_protection=True on any resource

3. **Context Configuration**
   - Create comprehensive cdk.json with context variables for all three environments
   - Include configurations for shard counts, memory sizes, capacity units, thresholds
   - Environment-specific settings should be clearly organized
   - Support easy addition of new environments

### Constraints

- No manual configuration outside of CDK code and context
- Infrastructure must be identical across environments except for explicitly parameterized values
- Each environment must be deployable independently
- All resources must support clean destruction (no Retain policies)
- Lambda functions must handle cold starts gracefully
- DynamoDB tables must use on-demand billing or provisioned with appropriate capacity
- CloudWatch Logs must not accumulate indefinitely (enforce retention policies)
- No hardcoded credentials or secrets in code (use SSM Parameter Store)
- Follow AWS CDK best practices for Python

## Success Criteria

- **Functionality**: Successfully deploys identical infrastructure to all three environments with environment-specific configurations
- **Performance**: Lambda functions process streams within configured memory limits, DynamoDB handles expected load
- **Reliability**: Proper error handling, retry logic, and CloudWatch alarms configured per environment
- **Security**: IAM roles follow least-privilege, secrets managed in Parameter Store, encryption enabled
- **Resource Naming**: All resources include environmentSuffix in names for uniqueness
- **Destroyability**: All resources can be destroyed with cdk destroy without errors or manual cleanup
- **Code Quality**: Python code follows PEP 8, includes type hints, comprehensive error handling
- **Testing**: Unit tests achieve 100% coverage, integration tests validate multi-environment deployment
- **Documentation**: Clear README explaining deployment process, environment configuration, and customization

## What to deliver

- Complete AWS CDK Python implementation with reusable stack class
- app.py with proper stack instantiation for all environments
- cdk.json with comprehensive context configuration for dev, staging, and prod
- Lambda function code in lib/lambda/ directory with fraud detection logic
- IAM roles and policies using CDK constructs
- DynamoDB table definitions with environment-specific capacity
- Kinesis Data Streams with environment-specific shards
- S3 buckets with proper lifecycle policies and naming patterns
- CloudWatch alarms with environment-specific thresholds
- SSM Parameter Store integration for configuration management
- X-Ray tracing enabled conditionally based on environment
- Unit tests with 100% coverage in tests/unit/
- Integration tests in tests/integration/
- Comprehensive README.md with deployment instructions and architecture overview
- All code following AWS CDK and Python best practices
