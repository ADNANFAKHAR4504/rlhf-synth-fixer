Hey team,

We need to refactor and optimize an existing serverless data processing infrastructure that's currently running inefficiently. I've been asked to improve this using **Pulumi with TypeScript**. The current infrastructure has several performance and cost issues that we need to address through better architecture patterns and proper right-sizing.

The existing setup has Lambda functions that are over-provisioned with 3008MB of memory but only using an average of 512MB based on CloudWatch metrics. We're also dealing with code duplication across multiple Lambda deployments, missing auto-scaling policies on DynamoDB, and Lambda functions that fail silently without proper dead letter queues. On top of that, IAM permissions are too broad with wildcard actions, there's no cost tagging strategy, logs are kept indefinitely, and some critical functions suffer from cold starts.

## What we need to build

Create an optimized serverless data processing infrastructure using **Pulumi with TypeScript** for the us-east-1 region.

### Core Requirements

1. **Lambda Memory Right-Sizing**
   - Implement Lambda function memory allocation based on actual CloudWatch metrics
   - Current functions use 3008MB but average only 512MB usage
   - Apply proper memory settings based on actual usage patterns

2. **Reusable Component Pattern**
   - Replace individual Lambda function deployments with a reusable component pattern
   - Reduce code duplication across Lambda deployments
   - Create modular, maintainable Lambda function components

3. **DynamoDB Auto-Scaling**
   - Implement proper DynamoDB auto-scaling policies that are currently missing
   - Configure read and write capacity auto-scaling
   - Set appropriate scaling targets and thresholds

4. **Dead Letter Queue Integration**
   - Add dead letter queues to Lambda functions that currently fail silently
   - Configure proper DLQ integration with SQS
   - Implement failure handling and alerting

5. **IAM Security Hardening**
   - Fix IAM role permissions that currently use wildcard actions
   - Implement least privilege access policies
   - Scope permissions to specific resources and actions

6. **Cost Allocation Tagging**
   - Implement proper tagging strategy for cost allocation
   - Apply consistent tags across all resources
   - Enable cost tracking and resource management

7. **Log Retention Management**
   - Add CloudWatch Log retention policies to prevent indefinite storage costs
   - Set appropriate retention periods (7-14 days recommended)
   - Apply retention policies to all Lambda function log groups

8. **Cold Start Optimization**
   - Implement provisioned concurrency for critical Lambda functions
   - Optimize Lambda cold starts for performance-sensitive operations
   - Configure appropriate provisioned concurrency levels

9. **Circular Dependency Resolution**
   - Fix circular dependency issues between Lambda functions and their event sources
   - Ensure proper resource dependency ordering
   - Use Pulumi's dependency management features correctly

10. **Error Handling and Retry Logic**
    - Implement proper error handling in the Pulumi program itself
    - Add retry logic for transient failures
    - Include validation and error recovery mechanisms

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for serverless compute
- Use **Amazon DynamoDB** for data storage
- Use **Amazon CloudWatch** for monitoring and metrics
- Use **AWS IAM** for access control
- Use **AWS SQS** for dead letter queues
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no deletion protection)

### Optimization Requirements

- Lambda memory configuration based on CloudWatch metrics
- Component-based architecture for Lambda functions
- Proper auto-scaling for DynamoDB tables
- Dead letter queues for failure handling
- Least privilege IAM policies
- Cost allocation tags on all resources
- CloudWatch log retention (7-14 days)
- Provisioned concurrency for critical functions

### Constraints

- Use Pulumi ComponentResource pattern for reusable components
- All Lambda functions must have appropriate memory settings (512MB-1024MB based on metrics)
- IAM policies must scope actions to specific services and resources
- All resources must include environmentSuffix in their names
- No RemovalPolicy.RETAIN or deletion protection
- Include proper error handling and validation in Pulumi code
- DynamoDB should use on-demand or auto-scaling (not fixed provisioning)

## Success Criteria

- **Functionality**: All 10 optimization requirements implemented correctly
- **Performance**: Lambda cold starts minimized through provisioned concurrency
- **Reliability**: Dead letter queues capture all Lambda failures
- **Security**: IAM policies follow least privilege principle with no wildcard actions
- **Cost Optimization**: Right-sized Lambda memory, log retention policies, cost allocation tags
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: TypeScript with proper types, reusable components, well-tested
- **Maintainability**: Component pattern reduces code duplication and improves maintainability

## What to deliver

- Complete Pulumi TypeScript implementation
- Reusable Lambda function component class
- DynamoDB tables with auto-scaling configuration
- Lambda functions with right-sized memory allocations
- SQS dead letter queues integrated with Lambda
- Hardened IAM roles with least privilege policies
- Cost allocation tags applied to all resources
- CloudWatch log retention policies
- Provisioned concurrency configuration for critical functions
- Proper dependency management avoiding circular references
- Error handling and retry logic in Pulumi code
- Unit tests for all components
- Documentation and deployment instructions