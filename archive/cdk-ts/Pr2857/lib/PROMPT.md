I need help building a serverless application infrastructure using AWS CDK with TypeScript. The application needs to be deployed in the us-east-1 region and should include the following components and requirements:

## Application Requirements

The serverless application should have these key components:

1. **API Gateway** - Set up an AWS API Gateway to handle incoming HTTP requests
2. **Lambda Functions** - Deploy Lambda functions using Python 3.8 runtime that are triggered by both API Gateway endpoints and S3 bucket events
3. **S3 Storage** - Create an S3 bucket for storing files that will trigger Lambda function executions, with public access completely blocked
4. **DynamoDB Tables** - Set up DynamoDB tables configured with on-demand capacity mode for storing application data
5. **IAM Roles** - Configure IAM roles following the principle of least privilege, granting only necessary permissions for Lambda functions to access DynamoDB and other required services
6. **CloudWatch Monitoring** - Create CloudWatch alarms that monitor Lambda function error rates and trigger when errors exceed 5%
7. **Network Security** - Implement security groups and network ACLs that restrict API Gateway access to specific allowed IP ranges
8. **Logging** - Configure Lambda functions to send execution logs to CloudWatch Logs
9. **Region Deployment** - Ensure all infrastructure is properly configured for deployment in us-east-1 region
10. **Stack Outputs** - Provide stack outputs that include the API Gateway URL and DynamoDB table names

## Technical Specifications

- Use AWS CDK with TypeScript for infrastructure definition
- Target platform is CloudFormation
- All Lambda functions must use Python 3.8 runtime
- DynamoDB tables should use on-demand billing mode
- S3 bucket must have all public access blocked
- Implement proper error monitoring with 5% threshold
- Follow AWS security best practices

## Implementation Details

Resource naming should follow organizational standards using the pattern 'orgname-env-resourcetype'. The infrastructure should be deployed in a single VPC with appropriate CIDR blocks configured according to organizational requirements.

## Current Code Structure

Here is the existing CDK stack file at ./lib/tap-stack.ts that needs to be updated:

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

## Important Notes

- Generate all CDK code in the existing ./lib/tap-stack.ts file
- Do not create any additional files
- Ensure the infrastructure can be completely destroyed when running destroy commands
- All resources should be properly tagged and organized
- Follow AWS CDK best practices and TypeScript conventions
- Make sure the code passes linting and build checks

Please implement the complete serverless infrastructure in the tap-stack.ts file, ensuring all requirements are met and the solution follows AWS best practices for security, scalability, and maintainability.