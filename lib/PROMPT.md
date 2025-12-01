Hey team,

We've got a Lambda function that's been causing us headaches with performance issues and it's time to fix it properly. The current setup has some serious problems - it's timing out, costing us more than it should, and we don't have good visibility into what's actually happening when things go wrong. The business has asked us to refactor this deployment and get it production-ready using modern best practices.

I've been asked to create this infrastructure using Pulumi with TypeScript. The existing Lambda is pretty rough around the edges - someone set a 5-minute timeout which is way too long, there's no cost controls in place, and we're not tracking performance at all. We need to completely rethink how this function is deployed.

The performance team did some profiling and gave us some concrete recommendations. They found that 512MB of memory is the sweet spot for this workload, and the function should complete in under 30 seconds if everything is working correctly. We also need to add proper observability so we can see what's happening in production.

## What we need to build

Create a Lambda function deployment using **Pulumi with TypeScript** that implements a comprehensive set of optimizations to address our current performance and cost issues.

### Core Optimizations

1. **Cost Control**
   - Implement reserved concurrency set to 10 concurrent executions
   - This prevents runaway costs from unexpected traffic spikes

2. **Performance Configuration**
   - Set memory allocation to 512MB based on profiling data
   - Configure timeout to 30 seconds instead of the current 5 minutes
   - Right-sized configuration improves cold start times and reduces costs

3. **Observability**
   - Enable X-Ray tracing for distributed request tracking
   - We need visibility into Lambda performance and dependencies

4. **Configuration Management**
   - Use Pulumi Config for all environment variables
   - No more hardcoded values in the Lambda code
   - Makes configuration changes safer and more auditable

5. **Security**
   - Create IAM role with least-privilege permissions
   - Only grant the specific permissions this Lambda actually needs
   - No overly broad policies

6. **Log Management**
   - Set CloudWatch Log retention to 7 days
   - Current logs are retained forever which costs money
   - 7 days is enough for debugging recent issues

7. **Deployment Optimization**
   - Use Lambda layers for shared dependencies
   - Reduces deployment package size
   - Faster deployments and better cold start performance

8. **Error Handling**
   - Configure dead letter queue for failed invocations
   - We need to capture failures for analysis
   - Can't just lose failed events

9. **Resource Management**
   - All resources must include environmentSuffix for uniqueness
   - Follow naming convention: resourceName-${environmentSuffix}
   - Enables multiple deployments in same account

10. **Compliance**
    - Add comprehensive resource tags for cost tracking
    - Tags for environment, repository, team, created date
    - Finance team needs this for chargeback

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Resource names must include **environmentSuffix** parameter from Pulumi Config
- Follow naming convention: {resource-type}-${environmentSuffix}
- Deploy to **us-east-1** region
- Lambda runtime should use Node.js 18.x or later
- All resources must be destroyable (no Retain policies or deletion protection)
- Use AWS SDK v3 syntax compatible with Node.js 18+ if Lambda code needs SDK
- Include proper error handling in all resources

### Deployment Requirements (CRITICAL)

- environmentSuffix is MANDATORY for all named resources (Lambda, SQS, IAM, CloudWatch)
- Pattern: `lambda-function-${environmentSuffix}`, `dlq-${environmentSuffix}`, etc.
- All resources MUST be destroyable (RemovalPolicy.DESTROY equivalent in Pulumi)
- NO deletion protection flags on any resources
- CloudWatch Log Groups must have defined retention period (7 days)

### Constraints

- Memory allocation locked at 512MB based on profiling
- Timeout must be exactly 30 seconds
- Reserved concurrency must be exactly 10
- Log retention must be 7 days
- All environment variables sourced from Pulumi Config
- IAM role limited to least-privilege permissions only
- All resources must support cleanup after testing

## Success Criteria

- **Functionality**: All 10 optimization requirements implemented correctly
- **Performance**: Lambda configured for optimal performance (512MB, 30s timeout)
- **Cost Control**: Reserved concurrency limits spend, log retention reduces storage costs
- **Observability**: X-Ray tracing enabled for request tracking
- **Security**: IAM role follows least-privilege principle
- **Reliability**: DLQ captures all failed invocations for analysis
- **Resource Naming**: All resources include environmentSuffix for isolation
- **Configuration**: All environment variables managed through Pulumi Config
- **Code Quality**: TypeScript with proper types, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- Lambda function with all 10 optimizations applied
- IAM role with least-privilege permissions for Lambda execution and X-Ray
- SQS dead letter queue for failed invocations
- Lambda layer for shared dependencies
- CloudWatch Log Group with 7-day retention
- Comprehensive resource tagging on all resources
- Pulumi outputs for Lambda ARN, function name, role ARN, log group, DLQ URL, layer ARN
- Unit tests for all infrastructure components
- Documentation explaining the optimization decisions
