# CI/CD Pipeline Infrastructure Implementation

I need help setting up a comprehensive CI/CD pipeline infrastructure using AWS CDK with TypeScript. This is for a production environment that requires high availability, security, and automated testing capabilities.

## Requirements

Please update the existing `tap-stack.ts` file to implement a complete CI/CD pipeline with the following specifications:

### Core Pipeline Components
- **CodePipeline**: Multi-stage pipeline with Source, Build, Test, and Deploy stages
- **CodeCommit**: Source repository integration
- **CodeBuild**: Separate build projects for build and test stages
- **ECS Fargate**: Target deployment service with auto-scaling capabilities

### Security & Compliance Requirements
- **SNS Notifications**: Pipeline failure notifications
- **S3 Artifact Storage**: Encrypted bucket with version tracking enabled
- **IAM Roles**: Least privilege access for all resources
- **Resource Tagging**: All resources must have 'Environment: Production' tag
- **CloudWatch Monitoring**: Comprehensive monitoring for all pipeline stages
- **Secure Credentials**: Environment variables in CodeBuild for AWS credentials

### High Availability & Reliability
- **Multi-AZ Deployment**: ECS tasks distributed across multiple availability zones
- **Auto-scaling**: ECS service with automatic scaling capabilities
- **Manual Approval**: Manual approval step before production deployment
- **Rollback Mechanism**: Automatic rollback if deployment fails during Deploy stage
- **Fault Tolerance**: Ensure ECS service remains available during deployments

### Integration Features
- **Slack Integration**: Custom Lambda function for Slack channel notifications
- **CloudWatch Integration**: Detailed monitoring and alerting
- **Organizational Compliance**: Must meet organizational tagging policies

## Current Implementation Context

I have an existing CDK stack structure in `lib/tap-stack.ts` with:
- Basic TapStack class extending cdk.Stack
- Environment suffix support
- Placeholder for stack instantiations

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```
Please enhance this existing file to include all the required infrastructure components while maintaining the current structure and patterns.

## Expected Deliverables

1. Complete implementation of the CI/CD pipeline infrastructure
2. All AWS services properly configured with security best practices
3. Resource tagging and compliance with organizational policies
4. High availability and fault tolerance configurations
5. Integration with monitoring and notification systems

The implementation should follow AWS CDK best practices and be production-ready with proper error handling and resource dependencies.
