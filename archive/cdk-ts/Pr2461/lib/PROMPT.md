Hey, I'm working on building a serverless app for my company and could really use some help getting all the AWS pieces working together properly. We're using CDK with TypeScript for this project.

## What I'm trying to build

So basically, I need to set up a serverless application that can handle POST requests, process some data, store it securely, and keep track of what's happening. The app needs to be really secure and scalable since it'll be handling sensitive data in production.

## Current situation

I've got a CDK project already set up with a basic stack file at `/iac-test-automations/lib/tap-stack.ts`. Here's what's in there right now:

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

## What needs to be done

I need to update this file (and ONLY this file - no additional files please) to include all the AWS resources. Here's what the architecture should look like:

**API & Lambda Setup:**
- Set up an API Gateway with a `/submit` endpoint that accepts POST requests
- Create a Lambda function using Python runtime to process these requests
- The Lambda needs to run in a VPC for security (no public access)
- Enable versioning on the Lambda and set up CloudWatch logging
- Add a dead-letter queue using SQS for handling failures

**Storage & Database:**
- Create an S3 bucket to store the incoming data (needs to be encrypted with KMS)
- Set up a DynamoDB table for logging metadata
- The DynamoDB should start with read capacity of 5, but then switch to on-demand mode
- All resources should use the naming pattern starting with "MyApp"

**Security Requirements:**
- Lambda needs proper IAM permissions for S3, DynamoDB, and CloudWatch
- Use environment variables for any sensitive config
- Everything should be encrypted (S3 with KMS, etc.)
- Deploy in us-west-2 region

**Extra stuff:**
- Add CloudFront distribution in front of the API Gateway with logging
- Enable CORS on the API endpoints
- Make sure to add proper tags to everything for cost tracking

## Lambda Function

Oh, and I'll also need the Python code for the Lambda handler. It should:
- Validate the incoming POST data
- Store the data in S3
- Log metadata to DynamoDB
- Return proper HTTP responses with error handling

Can you help me get all this set up? Remember, everything needs to go in that single tap-stack.ts file - don't create any additional files. Just update what's there to include all these resources directly in the stack.

Thanks!