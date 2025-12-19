# Task: Implement Serverless Application Infrastructure

Hey, I need help setting up a serverless infrastructure using AWS CDK in TypeScript. I've already got a base stack file that I need you to update - please don't create any new stack files, just work with what I have.

Here's my existing stack code:

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

**IMPORTANT: Please update ONLY the existing code above. Don't create new stacks or provide separate output - just modify this existing TapStack class.**

Here's what I need implemented:

1. A Lambda function written in TypeScript that I can deploy on AWS Lambda
2. An API Gateway that triggers this Lambda function
3. An S3 bucket to log all API requests
4. A DynamoDB table for storing application data (make sure it has a primary key)
5. Everything needs to be in the us-east-1 region
6. CloudWatch alarms to monitor the Lambda function's error rate
7. The S3 bucket should only be accessible by the Lambda function through proper IAM roles
8. Lambda configuration: 256 MB memory limit and 10-second timeout
9. Pass database connection details to the Lambda via environment variables

Also, please make sure to:
- Tag all resources with "iac-rlhf-amazon"
- Keep the existing structure with the environmentSuffix variable
- Write the Lambda function code inline or reference it appropriately
- Set up proper IAM policies so only the Lambda can access the S3 bucket

Can you update the stack code above to include all these requirements? Remember - update the existing TapStack class only, don't create new files or stacks.
