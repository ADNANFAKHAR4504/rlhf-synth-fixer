# IaC Program Optimization Task

## Platform and Language

Create infrastructure using **Pulumi with TypeScript**

## Task Description

Create a Pulumi TypeScript program to refactor and optimize an existing Lambda-based data processing infrastructure. 

## Requirements

The configuration must implement the following optimizations:

1. **Code Consolidation**: Consolidate three separate Lambda functions with duplicate code into a single reusable component

2. **Memory Optimization**: Optimize memory allocation from fixed 3008MB to dynamic sizing based on actual usage patterns

3. **Dead Letter Queue**: Implement proper dead letter queue configuration for failed invocations

4. **Environment-Specific Timeouts**: Add environment-specific timeout values:
   - dev: 60s
   - prod: 300s

5. **CloudWatch Log Retention**: Configure CloudWatch Log retention to 7 days instead of indefinite retention

6. **IAM Security**: Fix the IAM role to use least-privilege permissions instead of AdministratorAccess

7. **Error Handling**: Implement proper error handling with custom CloudWatch metrics

8. **Resource Tagging**: Add resource tags for cost allocation and monitoring

9. **Concurrency Management**: Configure reserved concurrent executions to prevent throttling

10. **Performance Monitoring**: Set up X-Ray tracing for performance monitoring

## Technical Constraints

- All resource names MUST include `${environmentSuffix}` for uniqueness
- Resources must be destroyable (no retention policies)
- Use AWS region: us-east-1 (unless specified in lib/AWS_REGION file)
- Follow Pulumi TypeScript best practices
- Implement proper error handling and validation

## Deliverables

- Complete Pulumi TypeScript infrastructure code
- Unit tests with 100% coverage
- Integration tests using deployed resources
- Documentation of optimizations made
