# Serverless File Processing Pipeline

Hey team,

We're working with a financial analytics startup that needs to process large volumes of market data files uploaded by their partners. They're experiencing bursty workloads during market hours and need a solution that can scale up during peak times and scale down during off-hours to keep costs manageable. The current manual processing workflow is becoming a bottleneck, and they need an automated, serverless solution that can handle the variable workload efficiently.

The business has asked us to build this using **Pulumi with TypeScript** for infrastructure as code. They want a completely serverless architecture that can automatically scale based on demand without any manual intervention. The system needs to handle file validation, data processing, and result aggregation in an ordered, reliable manner with proper error handling and monitoring.

The key challenge here is maintaining processing order while handling failures gracefully. Market data needs to be processed sequentially to maintain data integrity, and any failed processing attempts need to be retried with proper dead letter queue handling. The solution also needs to provide a REST API endpoint for partners to query the processing status of their uploaded files.

## What we need to build

Create a serverless file processing pipeline using **Pulumi with TypeScript** for infrastructure deployment. The system will automatically process market data files uploaded to S3, with ordered processing through multiple Lambda functions and status tracking via API Gateway.

### Core Requirements

1. **S3 Storage**
   - Create S3 bucket with versioning enabled
   - Configure lifecycle rule to transition objects to Glacier storage after 90 days
   - Set up S3 event notifications to trigger Lambda on object creation
   - Enable server-side encryption

2. **Lambda Functions**
   - Deploy three Lambda functions: file validator, data processor, and result aggregator
   - Use Go 1.x runtime for all Lambda functions
   - Configure 512MB memory allocation for each function
   - Set up CloudWatch Logs with 7-day retention for all functions
   - Implement proper IAM roles with least privilege access

3. **Message Processing**
   - Create SQS FIFO queues between Lambda functions for ordered processing
   - Configure dead letter queues for each Lambda function
   - Set maximum receive count to 3 for DLQ triggering
   - Ensure message ordering is maintained throughout the pipeline

4. **Data Storage**
   - Deploy DynamoDB table for tracking processing status
   - Enable Time-To-Live (TTL) on the table
   - Use on-demand billing mode
   - Enable point-in-time recovery

5. **API Gateway**
   - Create REST API with GET endpoint for querying processing status
   - Configure request throttling at 1000 requests per second
   - Integrate with Lambda for status queries
   - Enable CORS if needed for web access

6. **Monitoring and Logging**
   - CloudWatch Logs retention set to 7 days for all Lambda functions
   - Enable detailed monitoring for all resources
   - Set up proper error handling and logging

7. **Resource Organization**
   - Tag all resources with Environment=Production and Team=Analytics
   - Use environmentSuffix variable for all resource names to ensure uniqueness
   - Follow naming convention: {resource-type}-{environmentSuffix}

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for file storage with versioning and lifecycle policies
- Use **Lambda** with Go 1.x runtime and 512MB memory for compute
- Use **SQS FIFO queues** for ordered message processing between functions
- Use **DynamoDB** for processing metadata with TTL enabled
- Use **API Gateway** for REST endpoints with throttling at 1000 req/sec
- Use **CloudWatch Logs** with 7-day retention
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-environmentSuffix
- All resources must be fully destroyable (no Retain policies)

### Constraints

- Lambda functions must use Go 1.x runtime specifically
- Each Lambda must have exactly 512MB memory allocation
- SQS queues must be FIFO type for ordered processing
- Dead letter queue max receive count must be 3
- API Gateway throttling must be exactly 1000 requests per second
- CloudWatch Logs retention must be 7 days
- S3 lifecycle transition to Glacier must occur at 90 days
- All resources must have proper encryption at rest and in transit
- IAM roles must follow least privilege principle
- No VPC required - use managed services only
- Include proper error handling and retry logic
- All resources must be destroyable without data retention policies

## Success Criteria

- **Functionality**: File upload triggers validator, processing flows through all three Lambdas in order, status queryable via API
- **Performance**: System handles bursty workloads during market hours, automatic scaling based on S3 events
- **Reliability**: Failed messages moved to DLQ after 3 attempts, processing order maintained via FIFO queues
- **Security**: Encryption enabled, least privilege IAM, no hardcoded credentials
- **Resource Naming**: All resources include environmentSuffix variable
- **Cost Optimization**: Serverless architecture, lifecycle policies for storage tiering, proper resource cleanup
- **Monitoring**: 7-day log retention, detailed CloudWatch metrics available
- **Code Quality**: TypeScript code, well-tested, comprehensive documentation

## What to deliver

- Complete Pulumi TypeScript implementation with all components
- S3 bucket with versioning, lifecycle rules, and event notifications
- Three Lambda functions (validator, processor, aggregator) with Go 1.x runtime and 512MB memory
- SQS FIFO queues connecting Lambda functions with DLQs
- DynamoDB table with TTL for processing status tracking
- API Gateway REST API with throttling at 1000 req/sec
- Proper IAM roles and policies for all resources
- CloudWatch Logs configuration with 7-day retention
- Resource tags for Environment and Team
- Unit tests for all infrastructure components
- Integration tests that read from cfn-outputs/flat-outputs.json
- Documentation including deployment instructions and architecture overview
