# AWS Serverless Infrastructure Implementation Request

I need help implementing a comprehensive serverless infrastructure using AWS CloudFormation with TypeScript. I have an existing CloudFormation stack that needs to be enhanced with the following requirements:

## Current Code Structure

Here's my existing TypeScript CloudFormation stack file (`lib/tap-stack.ts`):

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

## Requirements to Implement

**IMPORTANT: Please update ONLY the existing stack code above. Do not create new stacks or provide separate implementations.**

### Core Infrastructure Requirements:

1. **AWS Lambda Configuration**
   - Deploy using Python runtime
   - Trigger via API Gateway as REST API
   - Implement versioning and publishing for all deployments
   - Include Lambda layers for custom dependencies
   - Set up environment variables for runtime configuration
   - Configure graceful error handling with appropriate HTTP status codes

2. **API Gateway Setup**
   - REST API configuration to trigger Lambda functions
   - Security using API Key authentication
   - Deploy to a specified stage with custom domain name
   - CORS headers enabled for cross-origin requests
   - Usage plans with throttling (limit: 1000 req/sec)
   - Separate logging policy for CloudWatch Logs

3. **DynamoDB Configuration**
   - Minimum read capacity: 5
   - Minimum write capacity: 5
   - TTL attribute for automatic item deletion after 30 days
   - Connect via VPC Endpoint (avoid public internet)

4. **Monitoring & Logging**
   - Enable X-Ray tracing on both Lambda and API Gateway
   - CloudWatch Logs policies for both services
   - Performance monitoring setup

5. **Security & Networking**
   - IAM roles and policies with least privilege access
   - VPC Endpoints for DynamoDB connectivity
   - Dead-letter queue using SQS for unsuccessful Lambda invocations

6. **Resource Management**
   - Tag all resources with 'Environment: production'
   - CloudFormation Stack outputs providing REST API endpoint

## Technical Specifications

- **Language**: TypeScript
- **Platform**: AWS CloudFormation (using AWS CDK)
- **Runtime**: Python for Lambda functions
- **Storage**: DynamoDB with specified capacity
- **API**: REST API via API Gateway
- **Monitoring**: X-Ray tracing enabled
- **Security**: API Key authentication, VPC endpoints

## Deliverable

Please update the existing `TapStack` class in the provided code to include all the specified infrastructure components. The implementation should:

- Maintain the existing class structure and interface
- Add all required AWS resources within the constructor
- Follow AWS CDK best practices
- Ensure all test cases related to infrastructure deployment will pass
- Include proper resource naming using the environmentSuffix variable

The updated stack should be production-ready and comply with all security policies mentioned above.