Hey team,

We have an existing Lambda-based ETL infrastructure running on AWS that needs some serious optimization work. The current setup is running outdated Node.js 14.x functions with performance issues and missing proper error handling. Business is concerned about reliability and wants us to modernize everything.

I've been asked to refactor this using Pulumi with TypeScript to bring it up to current standards. We're deploying to eu-west-2 and need to make sure all the Lambda functions are optimized for performance, cost, and observability. The data processing pipeline handles critical ETL operations, so we can't afford failures during batch processing.

## What we need to build

Refactor and optimize Lambda ETL infrastructure using **Pulumi with TypeScript** for improved performance and reliability.

### Core Requirements

1. **Lambda Runtime Updates**
   - Update all Lambda functions from Node.js 14.x to Node.js 18.x runtime
   - Ensure compatibility with latest AWS SDK features

2. **Memory and Performance Optimization**
   - Configure 512MB memory for small ETL functions
   - Configure 1024MB memory for large data processing functions
   - Right-size resources based on function purpose

3. **Database Connection Management**
   - Add environment variables for connection pooling
   - Set MAX_CONNECTIONS=10 for all database interactions
   - Optimize connection reuse across invocations

4. **Concurrent Execution Control**
   - Configure reserved concurrent executions of 5 for critical functions
   - Prevent throttling during peak processing periods
   - Stay within account concurrency limits

5. **Timeout Configuration**
   - Set 30 second timeout for API handler functions
   - Set 5 minute (300 second) timeout for batch processor functions
   - Match timeouts to actual function workload patterns

6. **Performance Monitoring**
   - Enable AWS X-Ray tracing on all Lambda functions
   - Track execution patterns and identify bottlenecks
   - Monitor cold starts and performance metrics

7. **IAM Security**
   - Implement IAM role boundaries for all functions
   - Apply least privilege access principles
   - Separate roles per function based on required permissions

8. **Log Management**
   - Configure CloudWatch Log Groups for each function
   - Set 7 day retention for development environment
   - Set 30 day retention for production environment

9. **Dependency Optimization**
   - Create Lambda layers for shared dependencies
   - Reduce deployment package sizes below 50MB unzipped
   - Improve deployment speed and cold start performance

10. **Error Handling**
    - Configure SQS dead letter queues for failed executions
    - Implement retry logic with exponential backoff
    - Capture and route failed messages for investigation

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **eu-west-2** region
- Use **AWS Lambda** with Node.js 18.x runtime
- Configure **CloudWatch Logs** with appropriate retention
- Implement **IAM roles and policies** with least privilege
- Enable **AWS X-Ray** for distributed tracing
- Use **AWS KMS** for environment variable encryption
- Integrate with **S3** for data storage
- Use **DynamoDB** for metadata and state management
- Configure **SQS** queues for dead letter handling
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`

### Constraints

1. TypeScript must use strict mode with proper type definitions
2. Lambda deployment packages must be under 50MB unzipped
3. Cannot exceed 1000 concurrent executions across all functions
4. Must implement retry logic with exponential backoff for transient failures
5. Environment variables must be encrypted using AWS KMS
6. Each Lambda function must have its own dedicated CloudWatch Log Group
7. IAM roles must follow principle of least privilege
8. All resources must be tagged with Environment and CostCenter tags
9. All resources must be destroyable (no Retain deletion policies)
10. Include comprehensive error handling and logging

## Success Criteria

- **Functionality**: All ETL operations continue working with improved reliability
- **Performance**: Reduced cold start times and optimized execution duration
- **Reliability**: 99.9% success rate with proper DLQ handling for failures
- **Security**: Encrypted environment variables and least privilege IAM roles
- **Observability**: Full X-Ray tracing and CloudWatch metrics for all functions
- **Cost Optimization**: Reduced deployment sizes and optimized memory allocation
- **Resource Naming**: All resources include environmentSuffix for multi-environment deployment
- **Code Quality**: TypeScript with strict mode, well-tested, properly documented

## What to deliver

- Complete Pulumi TypeScript implementation with all optimizations
- Lambda functions with Node.js 18.x runtime configuration
- Lambda layers for shared dependencies
- IAM roles and policies with least privilege access
- CloudWatch Log Groups with retention policies
- X-Ray tracing configuration
- KMS encryption for environment variables
- SQS dead letter queues for error handling
- S3 bucket configuration for data storage
- DynamoDB table setup for metadata
- Comprehensive unit tests with 90%+ coverage
- Integration tests using deployed resources
- Documentation and deployment instructions
