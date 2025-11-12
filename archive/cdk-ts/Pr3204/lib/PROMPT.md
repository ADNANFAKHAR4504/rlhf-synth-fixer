# CI/CD Pipeline Implementation Task

I need help implementing a comprehensive CI/CD pipeline for a web application using AWS CDK with TypeScript. I already have a basic stack structure in place, but I need you to enhance it with a complete pipeline implementation.

## Current Code Structure

Here's my existing stack file that needs to be updated:

```typescript
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

## Requirements

**IMPORTANT: Please update ONLY the existing stack code above. Do not create new stacks or provide separate implementations. Work within the existing TapStack class structure.**

I need you to implement the following pipeline components within this stack:

### 1. Source Stage
- Connect to an S3 bucket as the source repository
- Set up automatic triggers on pull requests
- Use the existing environmentSuffix variable for naming resources

### 2. Build Stage  
- Implement AWS CodeBuild with Linux build environment
- Configure TypeScript production build
- Include unit test execution
- Use AWS Secrets Manager for build secrets (API keys, etc.)

### 3. Deployment Stage
- Set up CodeDeploy for EC2 deployment
- Deploy to EC2 instances within a private VPC
- Include auto-scaling configuration for EC2 instances

### 4. Pipeline Management
- Use AWS CodePipeline to orchestrate the entire process
- Add approval steps before staging and production deployments
- Implement rollback capabilities for failed deployments

### 5. Storage & Artifacts
- Configure S3 bucket for build artifacts with versioning enabled
- Ensure proper artifact management throughout the pipeline

### 6. Security & Networking
- Create IAM roles and policies with least-privilege access
- Implement VPC with private subnets for EC2 instances
- Configure security groups and network ACLs
- Use AWS Secrets Manager for sensitive data

### 7. Monitoring & Notifications
- Set up comprehensive logging for all pipeline stages
- Configure CloudWatch Alarms for pipeline monitoring
- Implement Slack notifications via AWS Chatbot for pipeline events
- Alert on failures and successful deployments

### 8. Additional Requirements
- All resources should use the environmentSuffix for consistent naming
- Ensure the pipeline is production-ready with proper error handling
- Follow AWS CDK best practices for TypeScript development

Please update the existing TapStack class to include all these components. Make sure to import any necessary AWS CDK modules and maintain the existing structure while adding the required functionality.