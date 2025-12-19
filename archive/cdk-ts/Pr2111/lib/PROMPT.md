# Task: Multi-Environment Consistency & Replication

## Problem ID: trainr302

## Requirements

Design a CDK TypeScript solution to manage a complex multi-region AWS infrastructure for a production environment. The solution should encompass the following requirements:

1. **Multi-Region S3 Buckets**: Create an S3 bucket in each of the regions us-east-1, eu-west-1, and ap-southeast-1, ensuring cross-region replication is enabled between them.

2. **IAM Roles and Policies**: Define IAM roles and policies that allow Lambda functions to access these S3 buckets securely with the principle of least privilege.

3. **Resource Tagging**: Implement tagging for all IAM resources using the format 'Environment:Production'. This should be consistently applied across all resources.

## Constraints

1. Ensure that the resources defined are available in us-east-1, eu-west-1, and ap-southeast-1 regions
2. All IAM resources must have appropriate tags for identification using the format 'Environment:Production'
3. The template must be structured to accommodate additions and modifications with minimal risk of impacting existing resources

## Expected Output

A fully functional CDK TypeScript application that:
- Creates and manages the multi-region infrastructure
- Passes AWS CDK synthesis and deployment validation
- Meets all specified constraints
- Follows CDK best practices for multi-region deployments
- Uses modular, maintainable code structure

## Technical Approach

- Use AWS CDK v2 with TypeScript
- Implement cross-region references where needed
- Use CDK constructs for reusability
- Ensure proper stack dependencies
- Apply tags at the stack level for inheritance

## Platform Translation

Original task specified CloudFormation YAML, but per platform enforcement, this should be implemented using CDK with TypeScript while maintaining all functional requirements.