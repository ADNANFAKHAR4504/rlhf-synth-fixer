# AWS CDK Infrastructure Implementation Request

Hi! I need help implementing a secure data-processing infrastructure on AWS. I'm working with AWS CDK and TypeScript, and I have an existing stack that needs to be updated with the following requirements.

## Requirements

I need to build a production-ready data processing system with these components:

1. **S3 Bucket Setup**
   - Create a bucket named 'prod-data-bucket'
   - Enable server-side encryption
   - Turn on object versioning

2. **IAM Role Configuration**
   - Set up an IAM role with read-only access to the S3 bucket
   - Follow the principle of least privilege - only grant the minimum permissions needed

3. **CloudWatch Logging**
   - Configure CloudWatch to capture all access requests to 'prod-data-bucket'
   - Make sure we can track who's accessing what and when

4. **Lambda Function**
   - Deploy a Lambda function called 'prod-object-logger'
   - It should trigger whenever a new object is added to the S3 bucket
   - The function needs to log details about new objects to CloudWatch Logs
   - Set the timeout to at least 30 seconds
   - Include proper error handling for edge cases

5. **Tagging**
   - All resources must be tagged with 'Environment: Production'

## Important Constraints

- **CRITICAL**: I already have an existing stack file that you need to work with. Please UPDATE the existing code in `lib/tap-stack.ts` - do NOT create new stack files or suggest a completely new implementation.
- Use AWS CDK with TypeScript
- Follow AWS best practices for security
- Keep IAM policies minimal and specific (least privilege)
- Make sure all encryption and logging is properly configured

## Existing Code

Here's my current stack file that needs to be updated:

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

Please update this existing stack with all the required infrastructure components. I want to keep the existing structure and just add the new resources within this stack.

Thanks for your help!