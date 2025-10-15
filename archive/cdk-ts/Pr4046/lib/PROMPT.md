# Task: Build Serverless E-Commerce Backend with AWS CDK

Hey, I need help building out a serverless e-commerce application backend using AWS CDK with TypeScript. I already have a basic CDK project structure set up, but I need you to implement the actual infrastructure.

## What I Need

I'm building a simple e-commerce app that needs:
- A Lambda function to handle user profile operations (create, update, retrieve)
- DynamoDB table to store user data
- API Gateway to expose REST endpoints
- Proper IAM permissions following least privilege
- CORS support and rate limiting

## Technical Requirements

**Lambda Function:**
- Must be written in TypeScript
- Handle creating, updating, and retrieving user profiles
- Include proper error handling for AWS SDK calls
- Use environment variables for configuration
- Set a concurrency limit of 5
- Use Lambda Layers for shared dependencies
- Deploy to us-east-1 region

**DynamoDB:**
- Store user profile data
- Create a Global Secondary Index (GSI) on the 'username' attribute for efficient queries
- Handle query operations properly

**API Gateway:**
- Enable CORS support
- Implement usage plans with rate limiting
- Integrate with the Lambda function

**IAM & Security:**
- Lambda function should have minimal required permissions (least privilege principle)
- Use environment variables for sensitive data and configuration

**Tagging:**
- All resources must be tagged with 'Environment: Production'

## Existing Code Structure

Here's my current CDK setup:

**bin/tap.ts:**
```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

**lib/tap-stack.ts:**
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

## CRITICAL Instructions - READ CAREFULLY

**1. ONLY UPDATE THE EXISTING `lib/tap-stack.ts` FILE**
   - Do NOT create any new Stack classes
   - Do NOT instantiate multiple stacks
   - There should be ONLY ONE stack: `TapStack`
   - All AWS resources (Lambda, DynamoDB, API Gateway) must be created DIRECTLY inside the existing `TapStack` class

**2. Implementation Approach:**
   - Remove or ignore the comments in `tap-stack.ts` that say "Do NOT create resources directly in this stack"
   - CREATE ALL RESOURCES (Lambda, DynamoDB, API Gateway, IAM roles, etc.) DIRECTLY in the TapStack constructor
   - All resources should be instantiated within the single TapStack class
   - You can optionally create helper constructs in separate files if needed, but everything must be used within TapStack

**3. File Structure:**
   - Update `lib/tap-stack.ts` to include all infrastructure code
   - Create the Lambda function handler code in `lib/lambda/` or `src/lambda/`
   - Do NOT create new stack files or multiple CloudFormation stacks

**4. Final Result:**
   - When deployed, there should be ONLY ONE CloudFormation stack named `TapStack{environmentSuffix}`
   - This single stack should contain all resources: Lambda, DynamoDB table, API Gateway, IAM roles, etc.
   - Running `cdk synth` should generate exactly ONE CloudFormation template
   - Running `cdk deploy` should deploy exactly ONE stack

Make sure everything is in the SINGLE existing TapStack and follows AWS CDK best practices.