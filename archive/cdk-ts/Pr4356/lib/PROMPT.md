# Task: Implement Serverless Application Infrastructure

Hey, I need help building out AWS infrastructure for a serverless application using AWS CDK in TypeScript. We're working on a project that collects user data through an API, processes it with Lambda, and stores everything in DynamoDB and S3.

## What We Need

The application should handle incoming data through API Gateway, process it via Lambda functions, and store the results in both DynamoDB and S3. We also need proper security, monitoring, and best practices in place.

## Requirements

Here's what needs to be implemented:

1. **Lambda Function** - Create a Lambda function that processes incoming data
2. **API Gateway** - Set up API Gateway endpoints that trigger the Lambda function
3. **Storage** - Configure both S3 bucket for data storage and DynamoDB table for processed data
4. **Security & Access Control**:
   - IAM roles and policies for secure resource access
   - AWS WAF to secure the API Gateway
   - AWS Secrets Manager for any sensitive data
   - VPC integration for resource security
5. **Data Management**:
   - S3 bucket versioning enabled
   - DynamoDB backup mechanism for high availability
6. **Monitoring & Logging**:
   - CloudWatch alarms for Lambda execution errors
   - API Gateway request logging
   - Error handling in Lambda function
7. **Configuration**:
   - Environment variables for Lambda configuration
   - CORS enabled on API Gateway

## Important Constraints

- **Update existing code only** - I already have a base stack structure. Please modify the existing `lib/tap-stack.ts` file rather than creating new files
- The infrastructure should work across different AWS accounts using the `environmentSuffix` variable
- Use AWS region: `ap-northeast-1`
- Follow the existing pattern in the codebase where separate stacks are created for each resource type (don't put everything directly in TapStack)

## Current Code Structure

Here's the existing stack file that needs to be updated:

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

## Deliverables

Please provide TypeScript code that:
- Updates the existing `lib/tap-stack.ts` structure
- Creates separate stack files for different resource types (Lambda, API Gateway, S3, DynamoDB, etc.)
- Includes proper IAM roles and policies
- Sets up monitoring and security features
- Ensures everything is properly configured for the ap-northeast-1 region
- Works with the environmentSuffix pattern for multi-account deployment

**Critical**: Do not create entirely new stack structures or files outside the existing pattern. Update and extend what's already there. The code should integrate seamlessly with the existing codebase structure.

Let me know if you need any clarification on the requirements!
