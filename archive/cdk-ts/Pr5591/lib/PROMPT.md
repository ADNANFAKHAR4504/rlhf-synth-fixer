# Infrastructure Replication System Task

We're working on a project where we need to keep our infrastructure consistent across different environments. Right now we have separate dev, staging, and production setups, but managing them manually is getting messy.

The goal is to build a system that can automatically check if environments are in sync and help promote changes from dev to staging to prod in a controlled way.

## What We Need

I need you to update the existing `lib/tap-stack.ts` file with infrastructure that handles multi-environment replication. Here's what the system should do:

**Core Components:**

1. **State Tracking** - We need a DynamoDB table that keeps track of what version is deployed to each environment. It should use on-demand billing since we don't know how much traffic we'll get. Each record should store the environment name, a timestamp, and version info.

2. **Configuration Storage** - An S3 bucket where we'll store environment-specific configuration files. These configs will be versioned so we can roll back if needed. The bucket should be locked down - no public access.

3. **Validation Functions** - Lambda functions that compare configurations between environments to detect drift. These should run on ARM processors (Graviton2) to save costs. One function will check for drift between environments, another will handle tracking when stacks get updated.

4. **Event Triggers** - When CloudFormation stacks complete their updates, we want EventBridge to automatically trigger validation checks. This ensures we catch configuration drift right away.

5. **Monitoring** - A CloudWatch dashboard that shows us environment update metrics and helps visualize when things drift. We also need SNS topics to alert us when drift is detected or validation fails.

6. **Network Setup** - A VPC with private subnets where the Lambda functions will run. We need VPC endpoints for S3, DynamoDB, Lambda, and SNS so traffic stays within AWS and doesn't go over the internet.

## Technical Requirements

- Use TypeScript with CDK v2
- The stack already has an `environmentSuffix` parameter - make sure all resources use this for naming
- Lambda functions need ARM64 architecture
- DynamoDB should have a Global Secondary Index on version for easier lookups
- Point-in-time recovery isn't needed for this use case
- Everything should have proper removal policies so we can clean up test environments
- Tag all resources with Environment, ManagedBy, and Project tags

## Current Stack Structure

The file `lib/tap-stack.ts` already exists with a basic TapStack class. Just add all the resources inside that class. The entry point is `bin/tap.ts` which passes the environment suffix.

Make sure resources are properly connected - Lambda functions can access DynamoDB and S3, EventBridge can invoke the Lambdas, and everything has the right IAM permissions with least privilege.

Keep it minimal but functional. We want the core replication and validation capabilities without over-engineering it.
