# CI/CD Pipeline Implementation Task

I need help implementing a comprehensive CI/CD pipeline using AWS CloudFormation and AWS CDK with TypeScript. The current project structure includes a basic CDK stack that needs to be enhanced with a complete CI/CD solution.

## Current Project Structure
The project has:
- A basic `TapStack` class in `lib/tap-stack.ts` (currently mostly empty)
- CDK TypeScript configuration in `cdk.json`
- Package.json with CDK dependencies and scripts
- Basic unit and integration test files
- Build scripts in the `scripts/` folder

### Existing Stack Code (`lib/tap-stack.ts`)
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
I need you to update the existing `lib/tap-stack.ts` file to implement a complete CI/CD pipeline that meets these specifications:

1. **CloudFormation Stack**: Define using AWS CDK in TypeScript (update existing TapStack class)
2. **CodePipeline**: Include stages for building, testing, and deploying an AWS Lambda function
3. **CodeBuild Integration**: Implement build and test processes using AWS CodeBuild with Linux environment
4. **Lambda Application**: Deploy a Node.js 14.x compatible Lambda function as the target application
5. **Failure Notifications**: Incorporate SNS notifications for failed pipeline stages
6. **Environment Variables**: Use environment variables instead of hardcoded values throughout
7. **S3 Integration**: Include S3 bucket for source control integration
8. **Version Control & Rollback**: Implement version control practices with rollback capabilities
9. **Regional Deployment**: Configure for deployment in the 'us-east-1' AWS region
10. **IAM Security**: Use IAM roles and permissions following the principle of least privilege

## Technical Constraints
- Must utilize AWS CDK for all CloudFormation stack definitions
- Pipeline must include distinct stages for build, test, and deploy
- Must integrate with AWS CodePipeline for orchestration
- Use AWS CodeBuild for build and test stages with Linux build environment
- Tests must run within AWS CodeBuild projects
- Target deployment must be an AWS Lambda-based application
- Lambda function must support Node.js 14.x runtime environment
- Include comprehensive failure notifications using SNS
- All configurations must use environment variables (no hardcoding)
- Must support version control integration with S3 bucket storage

## Expected Deliverables
Please update the existing `lib/tap-stack.ts` file to include:
1. Complete CI/CD pipeline infrastructure definition
2. CodePipeline with source, build, test, and deploy stages
3. CodeBuild projects for build and test execution
4. Lambda function definition with proper runtime configuration
5. S3 bucket setup for source code storage
6. SNS topics and subscriptions for failure notifications
7. IAM roles with minimal required permissions
8. Environment variable configuration throughout
9. Proper resource naming with environment suffixes
10. CloudFormation outputs for key resources

The implementation should demonstrate all functional components through a working example that can be deployed and tested. The solution should follow AWS best practices for security, scalability, and maintainability.

Please maintain the existing class structure but expand it with the complete infrastructure definition. Make sure to include proper TypeScript typing and CDK constructs for all AWS resources.