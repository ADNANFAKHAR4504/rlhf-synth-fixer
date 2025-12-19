# Lambda Function Optimization Project

Hey team,

We've got a Lambda function infrastructure that's running with some pretty aggressive settings right now, and we need to optimize it for better cost efficiency and performance. The current setup has memory allocation at 3008MB, unlimited timeout at 5 minutes, and logs that stick around forever. It's time to bring this in line with best practices and cut down on unnecessary costs.

I've been asked to create this optimization using **Pulumi with TypeScript**. The business wants us to implement proper resource management, monitoring, and cost controls while maintaining reliability. This is a production optimization task, so we need to be careful and methodical about the changes we make.

The current Lambda setup is overprovisioned for its actual workload. We're seeing high costs from oversized memory allocation, indefinite log retention, and lack of proper concurrency controls. Plus, we don't have any dead letter queues for failed invocations or X-Ray tracing for performance visibility. We need to fix all of this while keeping the function fully operational.

## What we need to build

Create an optimized Lambda function infrastructure using **Pulumi with TypeScript** for better cost efficiency and operational visibility.

This task focuses on infrastructure optimization. You'll deploy baseline infrastructure with current settings, then create an optimization script that improves the configuration on live resources.

### Core Requirements

1. **Memory Optimization**
   - Reduce Lambda function memory from 3008MB to 1024MB
   - Right-size memory allocation for actual workload needs

2. **Concurrency Management**
   - Implement reserved concurrent executions set to 50
   - Prevent runaway costs from unlimited concurrent invocations

3. **Environment Configuration**
   - Add environment variables for DATABASE_URL using Pulumi config secrets
   - Add environment variable for API_KEY using Pulumi config secrets
   - Ensure sensitive data is properly encrypted

4. **Timeout Optimization**
   - Configure Lambda timeout to 30 seconds (from current 5 minutes)
   - Prevent long-running executions that waste resources

5. **Log Management**
   - Set up CloudWatch log retention to 7 days (from indefinite)
   - Implement automatic log cleanup to reduce storage costs

6. **Deployment Package Management**
   - Create S3 bucket for Lambda deployment packages
   - Enable versioning on the S3 bucket
   - Ensure deployment artifacts are properly managed

7. **Shared Dependencies**
   - Implement Lambda layers for shared dependencies
   - Reduce deployment package size through code reuse

8. **Performance Monitoring**
   - Add X-Ray tracing configuration for performance monitoring
   - Enable detailed performance insights and debugging

9. **Error Handling**
   - Configure Lambda Dead Letter Queue using SQS for failed invocations
   - Ensure failed executions are captured for analysis

10. **CloudWatch Alarms**
    - Set up CloudWatch alarm for error rate greater than 1 percent
    - Set up CloudWatch alarm for duration greater than 20 seconds
    - Enable proactive monitoring and alerting

### Baseline Infrastructure Requirements

Deploy infrastructure with these baseline configurations:

- Lambda function with 3008MB memory allocation
- Lambda timeout set to 300 seconds (5 minutes)
- CloudWatch logs with indefinite retention
- No reserved concurrency limits
- Basic environment variables (non-secret)
- No X-Ray tracing
- No Dead Letter Queue
- No CloudWatch alarms

### Optimization Script Requirements

Create `lib/optimize.py` that:

1. Reads `ENVIRONMENT_SUFFIX` from environment variable
2. Finds Lambda functions and related resources using naming pattern: `{resource-name}-{environmentSuffix}`
3. Optimizes resources via AWS APIs (boto3):
   - Lambda memory: 3008MB to 1024MB
   - Lambda timeout: 300 seconds to 30 seconds
   - Reserved concurrency: add limit of 50
   - CloudWatch log retention: indefinite to 7 days
   - Add environment variables using AWS Secrets Manager integration
   - Enable X-Ray tracing
   - Configure DLQ with SQS
   - Create CloudWatch alarms for errors and duration
4. Calculates and displays monthly cost savings from optimizations
5. Includes proper error handling and waiter logic for AWS operations
6. Supports --dry-run mode for testing without making changes

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS Lambda for compute
- Use Amazon S3 for deployment package storage
- Use AWS Lambda Layers for shared dependencies
- Use AWS X-Ray for performance tracing
- Use Amazon SQS for Dead Letter Queue
- Use Amazon CloudWatch for logs and alarms
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to us-east-1 region
- All resources must be destroyable (no Retain policies)
- Include proper IAM roles and permissions
- Use least privilege access principles

### Deployment Requirements (CRITICAL)

- All resource names MUST include the environmentSuffix parameter
- Example: `lambda-function-${environmentSuffix}`, `s3-bucket-${environmentSuffix}`
- All resources MUST use RemovalPolicy DESTROY (no RETAIN policies)
- This ensures resources can be cleaned up after testing
- Infrastructure code contains BASELINE (non-optimized) values
- The optimize.py script performs the actual optimizations on deployed resources

### Success Criteria

- Functionality: All 10 optimization requirements implemented
- Performance: Lambda executes within optimized memory and timeout
- Reliability: Error handling and DLQ prevent lost invocations
- Security: Secrets properly managed, IAM roles follow least privilege
- Cost: Monthly savings from memory, timeout, log retention, and concurrency optimizations
- Resource Naming: All resources include environmentSuffix for unique identification
- Monitoring: X-Ray and CloudWatch provide full visibility
- Code Quality: TypeScript code is well-typed, tested, and documented
- Optimization Script: optimize.py successfully modifies deployed resources and reports savings

## What to deliver

- Complete Pulumi TypeScript baseline infrastructure implementation
- Lambda function with S3 deployment package storage
- Lambda layers for shared dependencies
- X-Ray tracing configuration
- SQS Dead Letter Queue
- CloudWatch log groups and alarms
- Python optimization script (lib/optimize.py) that modifies deployed resources
- Unit tests for all infrastructure components
- Integration tests that verify optimize.py works on actual deployed resources
- Documentation with deployment and optimization instructions
- Cost savings calculations demonstrating optimization benefits