# CI/CD Pipeline Implementation Request

I need help implementing a complete CI/CD pipeline for my web application using AWS CDK in TypeScript. I have an existing CDK stack file that needs to be updated with all the pipeline components.

## Current Setup
I have a basic CDK stack file at `lib/tap-stack.ts` that currently looks like this:

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
I need you to update this single file (`lib/tap-stack.ts`) to include a complete CI/CD pipeline with these specific requirements:

1. **Source Stage**: Set up an S3 bucket as the source that triggers the pipeline when code is committed
2. **Build Stage**: Configure AWS CodeBuild with buildspec.yaml for the build process
3. **Deployment**: Deploy the application to AWS Elastic Beanstalk as part of the pipeline
4. **Manual Approval**: Add manual approval gates before production deployment
5. **Logging & Auditing**: Enable comprehensive logging for each pipeline stage
6. **Security**: Implement proper IAM roles and encryption throughout
7. **Rollback**: Ensure rollback mechanisms are in place for deployment failures

## Important Notes
- Please update ONLY the existing `lib/tap-stack.ts` file - don't create additional files
- Use the existing structure and environmentSuffix pattern that's already there
- Follow AWS CDK best practices for TypeScript
- Make sure all AWS services are properly integrated
- The solution should be deployable using standard CDK commands

Can you help me update this file with a complete, production-ready CI/CD pipeline implementation?