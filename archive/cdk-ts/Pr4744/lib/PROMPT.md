# Task: Update AWS CDK TypeScript Stack for Secure Web Application Infrastructure

Hey, I need your help updating an existing AWS CDK stack to meet some specific security and compliance requirements for a web application. I already have a base stack file that needs to be enhanced - please don't create new files or new stacks, just update the existing code I'm providing below.

## Current Stack Code

Here's the existing stack file (lib/tap-stack.ts) that needs to be updated:

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

I need this stack updated to create a secure cloud environment with the following specifications:

**Region & Tagging:**
- Everything needs to be deployed in us-east-1 region
- All resources must have 'Environment' and 'Project' tags properly set

**Security & Access Control:**
- IAM roles should follow the principle of least privilege - only grant what's absolutely necessary
- EC2 instances should only allow SSH access from a specific IP address (let's say 203.0.113.0/24 for now, but make it configurable)
- RDS instances must NOT be publicly accessible - keep them private
- Security Groups need descriptive names that make it clear what they're for

**Encryption & Data Protection:**
- Enable server-side encryption by default on all S3 buckets
- Use AWS KMS Customer Managed Keys (CMKs) for encryption wherever it makes sense
- Lambda functions need to have their environment variables encrypted

**Logging & Monitoring:**
- Set up a dedicated CloudWatch Logs group for the application
- Make sure log data is retained and published to this log group

**High Availability:**
- The VPC should span at least two availability zones with subnets in each
- This is for high availability and fault tolerance

**Best Practices:**
- All resources need to be created in an idempotent way (can run the template multiple times safely)
- Follow cost optimization best practices - don't create resources we don't need
- Keep the code clean and maintainable

## Important Instructions

**CRITICAL:** Please update ONLY the existing stack code I provided above. Do not create new stack files or suggest creating separate stacks. Work within the TapStack class and modify it to include all the necessary resources.

The output should be the complete updated TypeScript file that's ready to deploy on AWS. Make sure each requirement from the list above is addressed in the code.

Thanks for your help with this!