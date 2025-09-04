# AWS Serverless Infrastructure Development Task

I need help updating an existing AWS CDK TypeScript stack to implement a complete serverless REST API infrastructure. I have a basic CDK stack structure already in place that needs to be enhanced with the following requirements.

## Current Code Structure
I have an existing `tap-stack.ts` file with a basic CDK stack setup:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Add your stack instantiations here
  }
}
```

## Requirements to Implement

**IMPORTANT**: Please update ONLY the existing `TapStack` class. Do not create new stacks or separate files. All resources should be added within this single existing stack.

### Core Infrastructure Requirements:

1. **Lambda REST API**: Implement a serverless REST API using AWS Lambda that handles CRUD operations
2. **API Gateway Integration**: Use API Gateway to expose the Lambda function over HTTP with proper routing
3. **DynamoDB Table**: Create a DynamoDB table with:
   - Primary key: `id` (string type)
   - Sort key: `createdAt` (number type)
4. **DynamoDB Streams**: Enable DynamoDB Streams that trigger a second Lambda function for processing data updates
5. **Environment Configuration**: Use environment variables for resource configuration (table names, API endpoints, etc.)

### Security & Access:
6. **CORS Configuration**: Enable CORS on API Gateway for specified origins
7. **IAM Roles**: Implement least privilege IAM roles and policies for all resources
8. **Security Best Practices**: Follow AWS security best practices for serverless applications

### Monitoring & Observability:
9. **CloudWatch Alarms**: Set up CloudWatch Alarms to monitor Lambda execution errors
10. **X-Ray Tracing**: Enable X-Ray tracing for both API Gateway and Lambda functions
11. **Comprehensive Logging**: Configure logging for API Gateway, Lambda, and DynamoDB services

### Configuration Specifications:
12. **Lambda Configuration**: Set Lambda functions with minimum 128MB memory and 10-second timeout
13. **Environment Suffix**: Utilize the existing `environmentSuffix` variable for resource naming

### Deployment & Testing:
14. **Single Command Deployment**: Ensure the stack can be deployed using a single AWS CDK CLI command
15. **Infrastructure Validation**: Structure should support post-deployment testing

## Expected Deliverable

Please provide the complete updated TypeScript code for the existing `TapStack` class that includes all the above requirements. The code should:

- Use AWS CDK v2 constructs and best practices
- Include proper TypeScript typing
- Follow clean code principles with appropriate comments
- Integrate seamlessly with the existing stack structure
- Use the existing `environmentSuffix` variable for consistent resource naming

Remember: **Only update the existing stack code - do not create new files or separate stacks**. All resources should be defined within the single `TapStack` class constructor.
