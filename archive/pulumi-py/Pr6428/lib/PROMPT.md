Hey team,

We're dealing with a critical performance issue in our streaming data pipeline infrastructure. The current deployment process is taking over 15 minutes and frequently failing due to AWS API throttling, which is blocking our ability to push critical updates during production incidents. Our streaming analytics platform processes millions of events per second, so any deployment delays directly impact our ability to scale and respond to issues.

The business has asked us to optimize our infrastructure code using **Pulumi with Python**. They want us to leverage Pulumi's advanced patterns to reduce deployment times by at least 50% while preventing the API throttling issues we're currently experiencing. The infrastructure runs in us-east-1 across 3 availability zones and handles 100,000+ concurrent Lambda executions.

We need to demonstrate best practices for managing high-scale deployments that include proper dependency ordering, resource batching, and provider-level optimizations. This will become a reference implementation for other teams dealing with similar deployment performance challenges.

## What we need to build

Create an optimized streaming data pipeline infrastructure using **Pulumi with Python** that demonstrates advanced deployment optimization patterns for high-scale AWS environments.

### Core Infrastructure Requirements

1. **Data Ingestion Layer**
   - Kinesis Data Stream with 10 shards for high-throughput ingestion
   - Enable server-side encryption for data at rest
   - Configure appropriate retention period for stream data

2. **Processing Layer**
   - Deploy 5 Lambda functions for stream processing stages
   - Configure reserved concurrent executions of 100 per function
   - Use VPC endpoints to avoid NAT Gateway costs
   - Implement proper IAM roles with least privilege

3. **State Management**
   - DynamoDB table with 5000 RCU/WCU for high-performance access
   - Add global secondary index for query optimization
   - Enable encryption at rest
   - Configure appropriate TTL for data lifecycle management

4. **Data Archival**
   - S3 bucket for processed data storage
   - Enable server-side encryption
   - Configure lifecycle policies for cost optimization

### Advanced Pulumi Optimization Requirements

5. **Resource Batching**
   - Implement batched resource creation using Pulumi's apply() method
   - Minimize sequential API calls by parallelizing independent resources
   - Use Pulumi's resource transformations where applicable

6. **Retry Logic and Throttling Prevention**
   - Add custom retry logic with exponential backoff and jitter for AWS API calls
   - Configure provider-level concurrency limits to prevent API throttling
   - Implement custom timeouts for long-running resource operations

7. **Dependency Management**
   - Use explicit depends_on to control resource creation order
   - Prevent race conditions through proper dependency chains
   - Optimize dependency graph for maximum parallelization

8. **Resource Organization**
   - Create custom ComponentResource to encapsulate related resources
   - Implement resource tagging using loops instead of individual calls
   - Use Pulumi outputs with export() for cross-stack references
   - Leverage Pulumi stack references for cross-stack dependencies

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **Kinesis Data Streams** for data ingestion
- Use **Lambda** for serverless processing
- Use **DynamoDB** for state management
- Use **S3** for data archival
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-name-{environment_suffix}`
- Deploy to **us-east-1** region
- VPC configuration with private subnets for Lambda execution
- VPC endpoints for AWS services (S3, DynamoDB, Kinesis)
- Requires Pulumi 3.x with Python 3.9+

### Optional Enhancements

If time permits, add these features to improve operational visibility and reliability:

- **CloudWatch Dashboard** for monitoring pipeline metrics and performance
- **SQS Queues** between Lambda stages for buffering and fault tolerance
- **EventBridge Rules** for orchestrating pipeline stages with event-driven patterns

### Constraints

- Implement explicit dependency ordering to prevent race conditions
- Use Pulumi's ResourceOptions to batch API calls where possible
- Apply rate limiting with exponential backoff for AWS API calls
- Utilize Pulumi stack references for cross-stack dependencies
- Implement custom timeouts for long-running resources
- Use Pulumi's ignore_changes for frequently changing attributes
- Leverage Pulumi provider configuration for connection pooling
- All resources must be destroyable (no Retain policies or deletion protection)
- Include proper error handling and logging throughout

## Success Criteria

- **Deployment Performance**: Reduce deployment time from 15+ minutes to under 7 minutes
- **Reliability**: Zero API throttling errors during deployment
- **Scalability**: Support 100,000+ concurrent Lambda executions
- **Resource Optimization**: Minimize AWS API calls through batching and parallelization
- **Code Quality**: Production-ready Python code with proper error handling
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Best Practices**: Demonstrate advanced Pulumi patterns (ComponentResource, apply(), exports)
- **Security**: Encryption enabled for all data storage services

## What to deliver

- Complete Pulumi Python implementation with __main__.py entry point
- Custom ComponentResource class for resource encapsulation
- Kinesis Data Stream with encryption and proper configuration
- 5 Lambda functions with VPC configuration and reserved concurrency
- DynamoDB table with GSI and encryption
- S3 bucket with encryption and lifecycle policies
- VPC infrastructure with private subnets and VPC endpoints
- Provider-level optimization configurations
- Proper resource tagging and naming with environmentSuffix
- Export outputs for cross-stack references
- CloudWatch dashboard for monitoring (optional)
- SQS queues for buffering (optional)
- EventBridge rules for orchestration (optional)
