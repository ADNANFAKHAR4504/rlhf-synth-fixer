I need help implementing a serverless infrastructure using CloudFormation and TypeScript CDK. Here's what I'm trying to build:

## What I Need

I want to set up a serverless architecture that has an S3 bucket triggering a Lambda function whenever a new object is created. The Lambda should do some basic processing and log any errors to CloudWatch.

## Specific Requirements

Here's everything that needs to be included:

1. **S3 Bucket Setup**
   - Enable server-side encryption using AES-256
   - Add versioning to the bucket
   - Set up a lifecycle policy that moves objects to Glacier storage class after 30 days
   - Make the bucket name parameterized so I can customize it
   - Bucket policy should only allow HTTPS connections (secure transport only)
   - Configure it to trigger the Lambda function on object creation events

2. **Lambda Function**
   - Should be triggered when objects are created in the S3 bucket
   - The handler function must be named 'index.handler'
   - Set timeout to 15 seconds
   - Allocate 256 MB of memory
   - Log any errors to CloudWatch
   - Set up a dead-letter queue using SQS for failed invocations

3. **IAM Roles**
   - Create IAM roles for Lambda with least privilege access
   - Only grant the permissions actually needed for the function to work

4. **CloudWatch Monitoring**
   - Set up an alarm that triggers if Lambda errors exceed 5 within a 5 minute window

5. **Stack Configuration**
   - Tag the CloudFormation stack with Environment='Production'
   - Use CloudFormation intrinsic functions where it makes sense
   - Output the S3 Bucket ARN and Lambda function ARN so I can reference them later

## Current Code

Here's my existing stack file that needs to be updated:

**lib/tap-stack.ts:**
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

## IMPORTANT

Please update the existing tap-stack.ts file shown above. I don't want you to create any new stack files or separate files. Just work with what I have and add all the resources directly into this existing TapStack class. Update this file only - don't suggest creating new stacks or restructuring into multiple files. I know the comments say not to create resources directly, but for this implementation, please just add everything into this single stack file.

Make sure to use TypeScript and the AWS CDK framework. The solution should be production-ready and follow AWS best practices for security and monitoring.
