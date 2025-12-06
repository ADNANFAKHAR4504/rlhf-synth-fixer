# Lambda Order Processing System Optimization

## Task Description

Create a Pulumi TypeScript program to optimize an existing Lambda-based order processing system that currently suffers from performance bottlenecks and cost overruns.

## Requirements

The infrastructure configuration must implement the following 10 requirements:

1. **Lambda Function Configuration Optimization**
   - Refactor Lambda function configuration with appropriate memory allocation of 512MB
   - Set timeout to 30 seconds based on actual usage patterns

2. **Concurrency Management**
   - Implement Lambda reserved concurrency of 50 to prevent throttling during peak hours

3. **Distributed Tracing**
   - Enable X-Ray tracing for all Lambda functions to identify performance bottlenecks

4. **Log Management**
   - Configure CloudWatch Log retention to 7 days instead of the default indefinite retention

5. **Resource Tagging**
   - Add proper tagging to all resources with Environment, Team, and CostCenter tags

6. **Version Management**
   - Implement Lambda function versioning
   - Create an alias pointing to the latest version

7. **Error Monitoring**
   - Set up CloudWatch alarms for Lambda errors exceeding 1% error rate over 5 minutes

8. **Dead Letter Queue**
   - Configure dead letter queue for failed Lambda invocations using SQS

9. **Deployment Package Optimization**
   - Optimize the Lambda deployment package by excluding unnecessary dependencies

10. **Monitoring Dashboard**
    - Add CloudWatch dashboard displaying key Lambda metrics

## Expected Deliverables

- Complete Pulumi TypeScript infrastructure code implementing all 10 requirements
- Lambda function with optimized configuration
- CloudWatch monitoring and alerting setup
- Comprehensive unit and integration tests
- 100% test coverage
- All documentation files (PROMPT.md, MODEL_RESPONSE.md, MODEL_FAILURES.md, IDEAL_RESPONSE.md)

## Platform Details

- Platform: Pulumi
- Language: TypeScript
- Complexity: Hard
- AWS Services: Lambda, CloudWatch, X-Ray, SQS, IAM
