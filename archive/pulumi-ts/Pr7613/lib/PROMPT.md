Hey team,

We need to refactor and optimize our existing Lambda-based ETL infrastructure. The current setup is running on outdated Node.js 14.x runtime and lacks proper performance monitoring and resource allocation. We've been asked to modernize this in **Pulumi with TypeScript** to bring it up to current best practices.

The business is concerned about the reliability of our ETL pipelines. We've had some issues with failed Lambda executions going unnoticed, and we're not getting good visibility into performance bottlenecks. Additionally, the deployment packages have gotten quite large, causing slower cold starts. The team wants us to implement proper monitoring, optimize resource usage, and make the whole system more robust.

This is a hard-complexity refactoring task that touches several critical aspects of our Lambda infrastructure. We need to update runtimes, implement better resource management, add observability, and ensure proper error handling throughout the pipeline.

## What we need to build

Refactor and optimize Lambda-based ETL infrastructure using **Pulumi with TypeScript** for improved performance, reliability, and maintainability.

### Core Requirements

1. **Runtime Modernization**
   - Update all Lambda functions from Node.js 14.x to Node.js 18.x runtime
   - Ensure Lambda code is compatible with Node.js 18 (no aws-sdk v2 dependencies)
   - Test runtime compatibility before deployment

2. **Resource Optimization**
   - Implement proper memory allocation: 512MB for small functions, 1024MB for large ones
   - Configure appropriate timeout values: 30 seconds for API handlers, 5 minutes for batch processors
   - Use Lambda layers for shared dependencies to reduce deployment package size

3. **Performance and Scalability**
   - Add environment variables for database connection pooling with MAX_CONNECTIONS=10
   - Configure reserved concurrent executions (5 for critical functions)
   - Ensure efficient resource utilization

4. **Monitoring and Observability**
   - Enable X-Ray tracing for performance monitoring on all Lambda functions
   - Add CloudWatch Log retention policies: 7 days for dev, 30 days for prod
   - Implement structured logging for better debugging

5. **Error Handling and Reliability**
   - Configure dead letter queues (DLQ) for failed executions
   - Ensure proper retry logic and error propagation
   - Set up alarms for critical function failures

6. **Security and IAM**
   - Implement proper IAM role boundaries with least privilege access
   - Create separate IAM roles per function with minimal required permissions
   - Follow AWS security best practices

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for compute functions
- Use **Amazon SQS** for dead letter queues
- Use **AWS X-Ray** for tracing and performance monitoring
- Use **CloudWatch Logs** for logging with retention policies
- Use **Lambda Layers** for shared dependencies
- Use **IAM** for proper access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- Lambda runtime: Node.js 18.x (no Node.js 14.x)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL resources must include environmentSuffix in their names for parallel deployment isolation
- **Destroyability**: All resources must be destroyable (no Retain deletion policies, no deletionProtection flags)
- **DLQ Configuration**: Dead letter queues must be properly connected to Lambda functions
- **X-Ray Integration**: Tracing must be active on all Lambda functions
- **Log Retention**: CloudWatch log groups must have explicit retention periods (7 or 30 days)
- **Lambda Layers**: Shared dependencies must be packaged as Lambda layers
- **IAM Least Privilege**: Each function should have its own IAM role with minimal permissions

### Constraints

- Node.js 18.x Lambda functions do not include aws-sdk v2 by default - use @aws-sdk v3 or extract data from events
- Lambda layers must be created before functions that depend on them
- Reserved concurrency should not exceed reasonable limits (use 5 for critical functions)
- Memory allocation must match function workload: 512MB for small, 1024MB for large
- Timeout values must be appropriate: 30s for API handlers, 300s for batch processors
- All resources must be tagged for cost tracking and management
- Include proper error handling and logging in all Lambda functions

## Success Criteria

- **Functionality**: All Lambda functions successfully updated to Node.js 18.x runtime
- **Performance**: Memory and timeout settings optimized for each function type
- **Reliability**: Dead letter queues configured and tested for failure handling
- **Observability**: X-Ray tracing enabled and CloudWatch logs retained with proper policies
- **Security**: IAM roles follow least privilege principle with appropriate boundaries
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: TypeScript code, well-tested with unit tests, documented
- **Cost Optimization**: Lambda layers implemented to reduce deployment package sizes

## What to deliver

- Complete Pulumi TypeScript implementation with optimized Lambda configuration
- AWS Lambda functions with Node.js 18.x runtime, proper memory, and timeout settings
- Lambda layers for shared dependencies
- Amazon SQS dead letter queues for failed executions
- AWS X-Ray tracing configuration
- CloudWatch log groups with retention policies
- IAM roles with least privilege access
- Unit tests for all infrastructure components
- Documentation and deployment instructions in lib/README.md
