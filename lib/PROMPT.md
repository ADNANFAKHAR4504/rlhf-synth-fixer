# Serverless Infrastructure Setup Request

Hey, I'm working on setting up a serverless architecture using AWS CloudFormation with TypeScript, and I need some help building this out properly. The goal is to create a complete serverless environment that handles API requests through Lambda and manages data storage effectively.

So here's what I'm trying to accomplish: I need to build a Lambda function that gets triggered by an API Gateway REST API. The Lambda itself should be written in TypeScript and handle API Gateway events smoothly. The whole setup needs to be production-ready with proper monitoring, error handling, and resource management.

I already have a basic stack structure started in `lib/tap-stack.ts`, and I want to enhance that existing file rather than creating something completely new. Can you help me update the current implementation to include all these requirements?

Here's the existing code I'm working with:

**Current Implementation (lib/tap-stack.ts):**
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

Now, here's what I need this infrastructure to do:

First off, the Lambda function needs to be properly configured with an execution role that includes permissions for CloudWatch Logs, S3, and DynamoDB. It's important that the function can access all three services without any permission issues.

For the API Gateway side, I need a REST API that directly triggers the Lambda function. The API Gateway should have a deployment stage properly linked, and it needs to log both request and response data to CloudWatch so I can monitor what's happening with each API call. Also, I want to set up a custom domain name for the API Gateway to make it more readable and professional.

On the storage side, the Lambda's source code should be stored in an S3 bucket, and that bucket reference needs to be included in the infrastructure script. For data persistence, I need a DynamoDB table with a structure that uses `id` as the partition key and `timestamp` as a sort key. The Lambda function should be configured to write event data to this DynamoDB table whenever it processes a request.

For monitoring and troubleshooting, I want comprehensive error handling and logging built into the Lambda function itself. Additionally, there should be a CloudWatch alarm that sends notifications to a specified SNS topic whenever Lambda execution failures occur. This way I can stay on top of any issues that come up.

An important requirement is that all the resources need to be named with a `prod-` prefix. This helps me distinguish them as production assets and keeps everything organized. The infrastructure also needs to be compatible with AWS regions `us-east-1` and `us-west-2`, so it should work seamlessly in either location.

The final output should be a TypeScript file defining the CloudFormation stack that can be deployed using the AWS CDK CLI. When deployed, it should create and link all these resources together according to these specifications.

**IMPORTANT:** Please update the existing code in `lib/tap-stack.ts` only. Don't create new stack files or provide separate output. I want you to enhance the current implementation by adding all these features to the existing TapStack class. Just modify what's already there to include all the Lambda, API Gateway, DynamoDB, S3, CloudWatch, and SNS configurations I've described above.

Let me know if you need any clarification on these requirements, but essentially I'm looking for a complete serverless setup that's production-ready with proper monitoring, error handling, and resource tagging.
