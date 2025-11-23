# EC2 Cost Optimization

Hey, so we need to build this with Pulumi and TypeScript. Region is ap-southeast-1. Please don't change the platform or language - management already decided on Pulumi/TS.

## The Problem

Our AWS bill is getting out of control. The dev team keeps their EC2 instances running 24/7 even though nobody uses them at night or on weekends. We're burning money for no reason.

We want to automatically shut down the dev and staging instances when people aren't working (like 7 PM to 8 AM on weekdays) and restart them in the morning.

## What needs to be done

Import the existing EC2 instances that are tagged with Environment=development or Environment=staging. Don't recreate them, just import them using Pulumi's import feature.

Set up CloudWatch Events to stop these instances at 7 PM EST every weekday and start them back up at 8 AM EST. Make sure it handles daylight saving time properly.

Create Lambda functions to do the actual stopping and starting. The Lambda should be able to handle multiple instances at once so we're not wasting money on a bunch of separate invocations.

Give the Lambda the IAM permissions it needs. Don't go overboard - just what's actually required.

Add CloudWatch alarms so we know if instances fail to start up.

Don't change any of the instance settings or tags. Just leave everything as is.

Calculate how much money we're going to save and show that in the output. Assume we're shutting down for 13 hours each weekday.

The output should show the instance IDs, Lambda ARNs, CloudWatch rule ARNs, and the monthly savings estimate.

## Context

We're a small startup. Our developers spin up test environments and forget about them. The CFO is freaking out about the AWS costs. We need to cut costs but we can't make it hard for developers to do their jobs.

The solution needs to only affect dev and staging. Production instances should be completely untouched.

## Technical stuff

We're using Pulumi TypeScript SDK 3.x with Node.js 18+ and AWS SDK v3.

Current setup is in ap-southeast-1. We have a bunch of t3.medium and t3.large instances scattered across development and staging environments.

When you're calculating costs, use the actual current EC2 on-demand pricing for those instance types.

Make sure all state changes get logged to CloudWatch Logs because we need to be able to audit this.

The instances will stay in their current VPCs and subnets. No network changes.

## Project setup notes

Use the environmentSuffix variable in resource names so we can have multiple PR environments running at the same time. Just do something like myresource-\${environmentSuffix} or add it as a tag.

For the integration tests, they should load outputs from cfn-outputs/flat-outputs.json and validate against the actual deployed resources.

Everything should be destroyable for our CI/CD pipeline. The only exception is secrets - those should be fetched from AWS Secrets Manager, not created by the stack.

Don't use DeletionPolicy Retain unless you absolutely have to.

For security, make sure we have encryption at rest and in transit, use least privilege for IAM roles, pull credentials from Secrets Manager, and enable logging and monitoring.

Deploy to ap-southeast-1.
