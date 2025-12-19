# Lambda Function Optimization for Financial Transactions

Hey team,

We've got a Lambda function handling financial transactions that's been having some performance issues. The cold starts are killing us during high traffic periods, and we're seeing occasional throttling when payment volumes spike. The business team wants this sorted out before we scale up our customer base next quarter.

I need to refactor this Lambda deployment with some serious optimizations. The performance testing team already ran their analysis and gave us specific recommendations on memory settings, concurrency, and other configurations. We need to implement these using **Pulumi with TypeScript** since that's our standard IaC tooling.

The finance team is also pushing hard on cost allocation and monitoring. They want proper tagging for their cost center reports and better visibility into transaction processing performance. We also need to reduce our CloudWatch storage costs while maintaining reasonable retention for compliance audits.

## What we need to build

Optimize an existing Lambda function deployment using **Pulumi with TypeScript** for financial transaction processing. This involves refactoring the Lambda configuration to eliminate cold starts, prevent throttling, and improve cost efficiency while maintaining robust monitoring and security.

### Core Requirements

1. **Concurrency Configuration**
   - Set up provisioned concurrency with 5 instances to eliminate cold starts during business hours
   - Configure reserved concurrent executions to 100 to prevent throttling during payment spikes
   - Ensure Lambda can handle transaction bursts without queuing delays

2. **Performance Optimization**
   - Set memory allocation to 1024 MB based on performance testing results
   - Configure timeout to 30 seconds for complex transaction processing
   - Use ARM-based Graviton2 processors (arm64 architecture) for cost-efficient processing

3. **Monitoring and Observability**
   - Enable X-Ray tracing for end-to-end transaction monitoring and debugging
   - Configure CloudWatch Logs with 7-day retention to reduce storage costs
   - Ensure all performance metrics are captured for the finance team

4. **Security and Configuration**
   - Create environment variables for DATABASE_URL and API_KEY
   - Encrypt environment variables using AWS-managed keys
   - Implement IAM role with least-privilege permissions for DynamoDB read/write access

5. **Cost Allocation and Management**
   - Apply required tags: Environment=production, Team=payments, CostCenter=fintech
   - Ensure all resources include environmentSuffix for uniqueness
   - Follow naming convention: lambda-function-environment-suffix

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** with provisioned concurrency and ARM64 architecture
- Use **IAM roles and policies** for DynamoDB access
- Use **CloudWatch Logs** for log retention management
- Use **X-Ray** for distributed tracing
- Lambda handler can be a simple placeholder (e.g., "index.handler")
- Code can be inline or reference a placeholder file
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies, use RemovalPolicy.DESTROY equivalent)
- FORBIDDEN: Do not use any retention or deletion protection policies
- Lambda function must support arm64 architecture
- IAM policy must follow least-privilege principle (only DynamoDB permissions needed)
- Environment variables must be encrypted with AWS-managed keys

### Constraints

- Must use Pulumi's @pulumi/aws package version compatible with TypeScript
- Lambda runtime should be recent (e.g., nodejs18.x or nodejs20.x for ARM64 support)
- Provisioned concurrency incurs costs - ensure it's set exactly to 5 instances
- Reserved concurrency must be exactly 100
- CloudWatch Logs retention must be exactly 7 days
- All configuration values must match performance testing recommendations

## Success Criteria

- **Functionality**: Lambda function configured with all optimization parameters
- **Performance**: Provisioned concurrency eliminates cold starts, reserved concurrency prevents throttling
- **Cost Efficiency**: ARM64 architecture reduces compute costs, 7-day log retention reduces storage costs
- **Monitoring**: X-Ray tracing enabled for transaction debugging
- **Security**: Environment variables encrypted, IAM follows least-privilege principle
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript code, well-structured, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function with all required configuration (concurrency, memory, timeout, architecture, tracing)
- IAM role and policy with DynamoDB read/write permissions
- CloudWatch Log Group with 7-day retention
- Environment variables with encryption enabled
- All required tags applied to resources
- Comprehensive unit tests covering all Lambda configuration
- Integration tests validating resource creation
- Documentation explaining optimization decisions and their business impact
