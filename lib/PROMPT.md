# Lambda Function Optimization

Hey team,

We've got a Lambda function in production that's burning money and running suboptimally. The function is still on Node.js 14.x (which is EOL), provisioned with way too much memory, and has a timeout setting that's just ridiculous for what it does. I've been asked to refactor this using **Pulumi with TypeScript** to bring it up to modern standards.

The business team has been looking at the CloudWatch metrics and they're not happy. We're paying for 3008MB of memory when the function averages 450MB usage. That's a lot of wasted capacity. Plus, during peak hours we're seeing throttling issues, and the current 15-minute timeout is masking some real performance problems we need to address.

## What we need to build

Refactor and optimize an existing Lambda function deployment using **Pulumi with TypeScript** to improve performance, reduce costs, and modernize the runtime.

### Core Requirements

1. **Runtime Migration**
   - Upgrade from Node.js 14.x to Node.js 18.x runtime
   - Node.js 14.x reached end of life, need modern runtime for security and performance

2. **Memory Optimization**
   - Reduce memory allocation from 3008MB to 512MB
   - CloudWatch metrics show average usage of 450MB, so 512MB provides adequate buffer
   - This change will significantly reduce Lambda costs

3. **Concurrency Control**
   - Add reserved concurrency limit of 10
   - Note: AWS requires minimum 100 unreserved concurrent executions per account, so use a conservative value
   - Prevents throttling during peak traffic hours
   - Ensures predictable performance under load

4. **Environment Configuration**
   - Set NEW_RELIC_LICENSE_KEY environment variable for APM integration
   - Set DB_CONNECTION_POOL_SIZE environment variable for database optimization
   - Values should be configurable through Pulumi config
   - Note: Do NOT set AWS_REGION as environment variable - it is automatically provided by the Lambda runtime

5. **Observability**
   - Enable AWS X-Ray tracing for performance monitoring
   - Helps identify bottlenecks and optimize execution paths

6. **Timeout Adjustment**
   - Reduce timeout from 15 minutes to 30 seconds
   - Current timeout is excessive and masks performance issues
   - 30 seconds is appropriate for this workload type

7. **IAM Security**
   - Create IAM role with least privilege access
   - Grant only necessary permissions to DynamoDB table named 'payments-table'
   - Include basic Lambda execution permissions for CloudWatch Logs

8. **Log Management**
   - Configure CloudWatch log retention to 7 days
   - Reduces storage costs while maintaining adequate debugging history

9. **Resource Tagging**
   - Environment: production
   - Team: payments
   - CostCenter: engineering
   - Enables proper cost allocation and resource tracking

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for the compute function
- Use **IAM** for role and permissions management
- Use **CloudWatch Logs** for log retention configuration
- Use **X-Ray** for distributed tracing
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `lambda-{name}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no retention policies that prevent cleanup)

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resource names MUST include the environmentSuffix parameter to ensure uniqueness across multiple deployments
- **No Retention Policies**: Resources must NOT use RemovalPolicy.RETAIN or deletionProtection settings
- **Lambda Function Code**: Create a minimal handler in lib/lambda/index.js for the function code
- **IAM Best Practices**: Use managed policies where appropriate, create custom policies only for specific needs

### Constraints

- Lambda function must be in Node.js 18.x runtime (no other version acceptable)
- Memory must be exactly 512MB (based on metrics analysis)
- Reserved concurrency must be 10 (conservative value to respect AWS account limits)
- Timeout must be 30 seconds
- IAM permissions must follow least privilege principle
- DynamoDB table name is fixed as 'payments-table'
- CloudWatch log retention must be 7 days (cost optimization requirement)
- All resources must include proper error handling and logging

## Success Criteria

- **Functionality**: Lambda function deploys successfully with Node.js 18.x runtime
- **Performance**: Memory set to 512MB with 30-second timeout
- **Reliability**: Reserved concurrency of 10 configured, X-Ray tracing enabled
- **Security**: IAM role with least privilege access to DynamoDB table only
- **Cost Optimization**: Log retention set to 7 days, optimized memory allocation
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: TypeScript, well-structured, properly typed, follows Pulumi best practices

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function handler code in lib/lambda/index.js
- IAM role with policies for Lambda execution and DynamoDB access
- CloudWatch log group with 7-day retention
- Lambda function with all specified configurations
- Proper resource tagging for cost allocation
- Clean, maintainable code following Pulumi patterns
