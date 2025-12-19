I need help implementing a comprehensive CI/CD pipeline using AWS CodePipeline for a serverless application deployment. This is for a production system that needs to be robust and follow AWS best practices.

Here's what I need to accomplish:

**Main Requirements:**
1. Set up AWS CodePipeline to orchestrate the entire CI/CD process
2. Configure AWS CodeBuild to automatically run tests (the test commands are already defined in package.json)
3. Use AWS CodeDeploy for managing deployments with rolling updates
4. Set up S3 bucket as the source trigger for the pipeline (like a repository webhook)
5. Store all build artifacts in an encrypted S3 bucket using AWS KMS
6. Create IAM roles with minimal required permissions (principle of least privilege)
7. Implement SNS notifications for every stage of the pipeline (success/failure alerts)
8. Add a manual approval step before production deployment
9. Everything must be implemented using TypeScript and AWS CDK

**Technical Details:**
- The pipeline should automatically trigger when files are uploaded to the S3 source bucket
- CodeBuild should execute the test scripts defined in my package.json file
- Build artifacts need server-side encryption with AWS KMS managed keys
- Each pipeline stage should send notifications via SNS
- IAM permissions should be as restrictive as possible while still functional
- Manual approval gate should be required before production deployment

**Current Code Structure:**
I already have a basic CDK stack file at `lib/tap-stack.ts` that needs to be updated. Here's the current content:

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

**What I need you to do:**
Please update this `lib/tap-stack.ts` file to implement all the CI/CD pipeline requirements. I want to keep the existing structure but add all the necessary AWS constructs for the complete pipeline. The solution should be production-ready and follow AWS security best practices.

Also, please make sure the implementation handles the environment suffix properly so it can work across different environments (dev, staging, prod).

Can you help me implement this complete CI/CD pipeline solution?