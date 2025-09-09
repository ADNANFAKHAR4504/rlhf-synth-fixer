# Serverless Application Infrastructure Request

Hi, I need help implementing a serverless application using AWS CDK with TypeScript. I have an existing stack file that needs to be updated with the required infrastructure components.

## Requirements

I need to build a comprehensive serverless application with the following components:

1. **Lambda Function**: Create a Lambda function that gets triggered by S3 object creation events
2. **API Gateway**: Set up an API Gateway that interacts with the Lambda function via HTTPS
3. **S3 Bucket**: Configure an S3 bucket for file storage with event triggers
4. **DynamoDB Table**: Set up a DynamoDB table for data persistence
5. **Security & Monitoring**: Implement proper IAM roles, logging, and CloudWatch monitoring

## Specific Technical Requirements

- **API Gateway**: Must only accept HTTPS traffic with rate limiting at 1000 requests/second
- **DynamoDB**: Set read capacity to 5 and write capacity to 5
- **Lambda**: 10-second timeout, include environment variable 'STAGE' set to 'production'
- **S3 Bucket**: Name must follow pattern 'prod-${AWS::AccountId}-data-storage'
- **Logging**: CloudWatch logs with 14-day retention period
- **Security**: Use least privilege IAM roles with AWS managed policies
- **Tagging**: Tag all resources with 'project':'serverless_app'

## Current Code

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

## Important Instructions

**CRITICAL**: Please update ONLY the existing TapStack class shown above. Do not create new stack files or classes. I need you to implement all the required AWS resources directly within the existing TapStack constructor while maintaining the current structure and environment suffix logic.

The Lambda should be able to securely access the DynamoDB table, and all components should work together as a cohesive serverless application. Make sure to follow AWS CDK best practices and include proper error handling.

Can you help me update this existing stack with all the required infrastructure components?
