# Task: Build a CI/CD Pipeline for Node.js Application Using AWS CDK with CloudFormation

Hey, I need help setting up a comprehensive CI/CD pipeline for a Node.js application. I'm working with AWS CDK and CloudFormation (using TypeScript), and I have some specific requirements that need to be met.

## What I Need

I need to create a complete CI/CD pipeline that handles everything from source code retrieval to deployment across multiple regions. Here are the details:

### Pipeline Requirements:

1. **Source Stage**: The pipeline should pull source code from an S3 bucket using AWS CodePipeline

2. **Build Stage**: Use AWS CodeBuild to:
   - Compile the Node.js application
   - Run unit tests
   - Make sure both integration and unit tests pass before proceeding

3. **Security**:
   - Set up proper IAM roles and policies following the principle of least privilege
   - Use AWS Secrets Manager to handle sensitive configuration data
   - The CodeBuild stage should be able to access secrets from Secrets Manager

4. **Deployment Stage**:
   - Deploy the application to an ECS cluster
   - The deployment must span across TWO AWS regions for high availability and redundancy
   - Include a manual approval step before deploying to production

5. **Notifications**:
   - Each pipeline stage should report its status
   - Send notifications through an SNS topic for pipeline state changes

6. **Environment Management**:
   - Use environment variables to safely manage differences between staging and production
   - Ensure proper environment segregation

## Important Constraints

**CRITICAL**: I already have an existing CDK stack file at `lib/tap-stack.ts`. Here's the current code:

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

**You MUST update this existing file only. Do NOT create new stacks or provide a completely new implementation. Work within the existing structure and follow the comments/guidelines already present in the code.**

## Expected Outcome

I need you to update the `lib/tap-stack.ts` file to implement all the requirements listed above. The solution should:
- Be production-ready and robust
- Follow AWS best practices for security and architecture
- Ensure the pipeline is reliable with proper error handling
- Handle the multi-region deployment correctly
- Integrate all the required AWS services (CodePipeline, CodeBuild, ECS, SNS, Secrets Manager, S3, IAM)

The final infrastructure should allow me to automatically build, test, and deploy my Node.js application in a secure manner with proper notifications and approval gates.

Please update the existing code in `lib/tap-stack.ts` to fulfill these requirements. Remember to work with the existing structure - don't start from scratch or create entirely new files.
