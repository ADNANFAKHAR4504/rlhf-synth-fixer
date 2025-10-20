# Task: Build Complete CI/CD Pipeline with AWS CDK (TypeScript)

Hey, I need help building out a complete CI/CD pipeline infrastructure using AWS CDK in TypeScript. This is for a web application that needs to be deployed in the us-west-2 region with automated build, test, and deployment workflows.

## Current Code Structure

Here's my existing stack file that needs to be updated:

**File: lib/tap-stack.ts**
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

## IMPORTANT: Update Existing Code Only

**Please update ONLY the existing `lib/tap-stack.ts` file shown above. Do NOT create new stack files or separate files. All the infrastructure resources should be added within the existing TapStack class or as nested stacks if needed. I just want modifications to what's already there.**

## What I Need

I'm looking to set up a full CI/CD pipeline with the following components and requirements:

### Source and Storage
- Use S3 as the source code management tool for storing code
- Create an S3 bucket for storing build artifacts with versioning enabled
- Set up access logging for the artifacts bucket - logs should go to a separate dedicated logging bucket

### Build Process
- Use AWS CodeBuild as the build service
- Keep it simple with a single compute environment configuration
- Build artifacts should be stored in the S3 bucket mentioned above

### Deployment
- Use AWS CodeDeploy for deploying to EC2 instances
- Implement blue/green deployment strategy
- EC2 instances should be in a private subnet
- Add automatic rollback capability if health checks fail after deployment

### Notifications and Monitoring
- Set up Amazon SNS for pipeline notifications
- I need notifications for both stage completions and errors
- Send pipeline status updates to a Slack channel using AWS Lambda and SNS integration
- Create CloudWatch Alarms to monitor execution failures in pipeline stages

### Security and Access
- All IAM roles should follow the least privilege principle
- Store S3 access tokens securely using AWS Secrets Manager
- Make sure every service has only the permissions it actually needs

### Automation and Triggers
- Pipeline should automatically trigger when there are changes in the S3 repository
- This includes branch creation, deletion, and code pushes

### Cost Management
- Implement AWS budget alerts that trigger when resource costs exceed a specified threshold

### Best Practices
- Tag all resources according to standard organizational policies
- Make the CloudFormation stack parameterized so different configurations can be passed via parameters
- Include CloudFormation StackSets configuration so this can be deployed across multiple AWS accounts with centralized management

### Region
- Everything should be deployed in the us-west-2 region

## Constraints to Keep in Mind

- The pipeline must work within the us-west-2 region
- S3 is the SCM provider (not GitHub or CodeCommit)
- Single compute environment for CodeBuild
- Blue/green deployment is required, not rolling or in-place
- EC2 instances must be in private subnets
- Secrets Manager must be used for S3 credentials
- StackSets capability is needed for multi-account deployment

## Platform Details
- Language: TypeScript
- Platform: AWS CDK
- Complexity: This is a complex setup with multiple integrated services

Please help me update the existing stack code to include all these components. Remember - just update the `lib/tap-stack.ts` file I shared above, don't create new files or separate stacks. Everything should be integrated into that single stack structure.

Thanks!
