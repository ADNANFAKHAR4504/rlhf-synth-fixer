# Task: Build a Serverless API with Lambda, API Gateway, S3, and DynamoDB

Hey, I need help building a serverless application using AWS CDK with TypeScript. I have an existing stack file that I need you to update - please don't create any new stack files or reorganize the structure. Just update the code I'm providing below.

## Current Code Structure

Here's my existing stack file at `lib/tap-stack.ts`:

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

## What I Need

**IMPORTANT: Please update ONLY the existing `lib/tap-stack.ts` file above. Do not create new stack files or change the overall structure.**

I need you to add the following AWS resources to this stack:

1. **Lambda Function**
   - Runtime: Node.js 22.x
   - Should be able to read data from an S3 bucket
   - Should interact with a DynamoDB table
   - Need environment variables pointing to the S3 bucket name and DynamoDB table name

2. **S3 Bucket**
   - Should be secure - only the Lambda function can access it, no public access
   - Lock it down with proper IAM policies

3. **DynamoDB Table**
   - Use on-demand capacity mode (I don't want to manage provisioned capacity)
   - Lambda needs read/write access to this table

4. **API Gateway**
   - HTTP API that triggers the Lambda function
   - Configure CORS for a specific origin (let's say https://example.com for now)
   - Should have proper CloudWatch logging enabled

5. **IAM Permissions**
   - Lambda needs IAM role with policies to access S3 (read only) and DynamoDB (read/write)
   - Use AWS Managed Policies wherever possible - I don't want to write custom policies unless absolutely necessary

6. **CloudWatch Logging**
   - Enable CloudWatch Logs for both Lambda and API Gateway
   - Centralized logging would be great

7. **Error Handling**
   - Set up an SNS topic for error alerts
   - Lambda should send notifications to this SNS topic when errors occur

8. **Idempotency**
   - Make sure I can run `cdk deploy` multiple times without issues
   - Stack should be fully idempotent

## Additional Requirements

- Use the `environmentSuffix` variable that's already in the code for naming resources
- Make sure all resource names are unique using the environment suffix
- Add proper removal policies for development environments
- Follow AWS CDK best practices for TypeScript

Remember: Update the existing stack file only. Don't create separate stack files or refactor the structure. Just add all the resources directly into the TapStack class where the comments indicate.

Thanks!
