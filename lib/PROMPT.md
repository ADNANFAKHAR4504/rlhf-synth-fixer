Hey team,

We need to build a fraud detection infrastructure that can be deployed consistently across dev, staging, and production environments for our financial services client. They're running a real-time fraud detection system and need it identical across environments, but with environment-specific configurations for resource sizing and retention.

The challenge is avoiding infrastructure drift between environments while still allowing for appropriate resource scaling. Right now they manually manage separate configurations for each environment, which has led to inconsistencies and deployment errors. Need to implement this using AWS CDK with Python to leverage context variables and parameterized stacks.

The system handles real-time transaction data through Kinesis streams, processes it with Lambda functions, stores results in DynamoDB, and archives to S3. Each environment needs different resource allocations based on expected load, but the architecture must remain identical. Also need conditional tracing enabled only for staging and production to help with debugging without adding overhead to dev environments.

## What to build

Create a multi-environment fraud detection pipeline using AWS CDK with Python that deploys consistent infrastructure across dev, staging, and production with environment-specific configurations.

### Core Infrastructure

**Data Ingestion**
- Kinesis Data Streams for transaction ingestion
- Environment-specific shard counts: dev gets 1 shard, staging gets 2 shards, prod gets 4 shards
- Stream encryption enabled with proper retention settings
- Kinesis connects to Lambda for processing

**Stream Processing**
- Lambda functions that process Kinesis streams
- Environment-based memory: dev uses 512MB, staging uses 1GB, prod uses 2GB
- Functions read configuration from SSM Parameter Store at runtime
- Lambda integrates with DynamoDB for storing results and S3 for archival
- Python runtime with fraud detection logic included

**Data Storage**
- DynamoDB tables for processed fraud detection results
- Environment-specific capacity: dev uses 5/5, staging uses 10/10, prod uses 25/25
- Point-in-time recovery enabled for staging and production only
- DynamoDB connects to Lambda for data writes

**Data Archival**
- S3 buckets with naming: company-fraud-data-ENVIRONMENT-REGION-SUFFIX
- Versioning enabled for staging and production buckets only
- Lifecycle policies appropriate for each environment
- Auto-delete enabled for bucket contents
- S3 integrates with Lambda for archival writes

**Monitoring**
- CloudWatch alarms for Lambda error rates
- Environment-specific thresholds: dev tolerates 10%, staging 5%, prod 2%
- CloudWatch Logs retention: dev 7 days, staging 14 days, prod 30 days
- SNS topics for alarm notifications per environment
- CloudWatch monitors Lambda, Kinesis, and DynamoDB

**Configuration Management**
- SSM Parameter Store for API keys and connection strings
- Parameters use paths like: /fraud-detection/ENVIRONMENT/api-key
- Lambda reads from SSM at runtime
- Specific IAM permissions for Kinesis read, DynamoDB write, S3 write, SSM read, CloudWatch logs write

**Conditional Tracing**
- X-Ray tracing enabled only for staging and production
- Lambda tracing mode based on environment
- IAM roles include X-Ray write permissions when tracing is enabled

### Technical Setup

- Implement with AWS CDK 2.x using Python 3.8+
- Single CDK stack class that accepts environment configuration parameters
- CDK context variables stored in cdk.json for environment-specific values
- Support three environments: dev, staging, prod
- Multi-region support: us-east-1 for prod, us-west-2 for staging, eu-west-1 for dev

### Resource Management

**Naming Convention**
All resources must include environmentSuffix parameter in names using pattern: {resource-typeENVIRONMENT-SUFFIX

**Destroyability Requirements**
- S3 buckets use auto_delete_objects=True with RemovalPolicy.DESTROY
- DynamoDB tables use RemovalPolicy.DESTROY
- Lambda functions use RemovalPolicy.DESTROY
- Kinesis streams use RemovalPolicy.DESTROY
- CloudWatch log groups use RemovalPolicy.DESTROY
- Never use RemovalPolicy.RETAIN or deletion_protection=True

### Deliverables

- Complete AWS CDK Python implementation with reusable stack class
- app.py with stack instantiation for all environments
- cdk.json with context configuration for dev, staging, prod
- Lambda function code in lib/lambda/ with fraud detection logic
- IAM roles with specific permissions per service
- DynamoDB table definitions with environment-specific capacity
- Kinesis Data Streams with environment-specific shards
- S3 buckets with lifecycle policies
- CloudWatch alarms with environment-specific thresholds
- SSM Parameter Store integration
- X-Ray tracing conditionally enabled
- Unit tests with 100% coverage in tests/unit/
- Integration tests in tests/integration/
- README with deployment instructions

The infrastructure must be identical across environments except for explicitly parameterized values. Each environment must be deployable independently and support clean destruction without manual cleanup.
