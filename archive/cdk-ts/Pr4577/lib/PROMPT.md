Hey, I need help building a serverless web application infrastructure using AWS CDK with TypeScript. I have an existing CDK stack file that I need you to update - please don't create new files or new stacks, just modify what I already have.

Here's what I'm trying to build:

I need a complete serverless architecture that includes:
- Lambda functions to handle the application logic
- API Gateway to create a RESTful API that my frontend can call
- An S3 bucket for storing static files (images, documents, etc.)
- DynamoDB table for the application database (needs a primary key configured)
- Proper IAM roles and policies so everything can talk to each other securely
- Lambda functions should use environment variables for configuration
- CloudWatch log groups to track Lambda execution logs
- The API Gateway needs to be inside a VPC for better security
- Secrets Manager integration for any sensitive data like API keys

Here's my current stack file (lib/tap-stack.ts):

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

**Important requirements:**
- Please update ONLY the existing lib/tap-stack.ts file shown above
- Don't create any new stack files - add all resources directly into this TapStack class
- Use the `environmentSuffix` variable that's already defined to make resource names unique
- Make sure all the AWS resources are properly connected (Lambda has permissions to access DynamoDB, S3, Secrets Manager, etc.)
- The API Gateway should have proper integration with the Lambda functions
- Set up CloudWatch logging for the Lambda functions
- Configure the API Gateway to run within a VPC
- Use AWS CDK L2 constructs where possible for cleaner code

Can you update this stack file with all the infrastructure I need? Remember - just update the existing TapStack class, don't create separate stack files or suggest creating new files. Thanks!
