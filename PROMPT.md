# IaC Program Optimization Task

## Problem Statement

Create a Pulumi TypeScript program to optimize an existing EC2 infrastructure by implementing scheduled start/stop functionality. The configuration must:

1. Import existing EC2 instances tagged with Environment=development or Environment=staging
2. Create CloudWatch Events rules to stop instances at 7 PM EST on weekdays
3. Create CloudWatch Events rules to start instances at 8 AM EST on weekdays
4. Implement Lambda functions to handle the start/stop operations
5. Set up proper IAM roles and policies for Lambda execution
6. Add CloudWatch alarms to notify if instances fail to start
7. Preserve all existing instance configurations and tags
8. Calculate and output estimated monthly cost savings

### Additional Requirements

1. Integrate Step Functions for enhanced functionality and scalability
2. Integrate Lambda for enhanced functionality and scalability
3. Integrate DynamoDB for enhanced functionality and scalability
4. Integrate EventBridge for enhanced functionality and scalability

**Expected output:** The program should display the imported instance IDs, created Lambda function ARNs, CloudWatch rule ARNs, and estimated monthly savings based on 13 hours daily shutdown.

## Background

A startup's development team has been running their test environments 24/7, resulting in unnecessarily high AWS bills. Management wants to optimize costs by automatically shutting down non-production EC2 instances during off-hours while maintaining the ability to quickly restart them when needed.

## Environment

AWS us-east-1 region with existing EC2 instances requiring cost optimization. Uses Pulumi TypeScript SDK 3.x, Node.js 18+, and AWS SDK v3. Existing infrastructure includes multiple t3.medium and t3.large instances across development and staging environments. CloudWatch Events and Lambda functions will orchestrate the automated scheduling. No VPC modifications required as instances remain in their current subnets.

## Constraints

- Must use Pulumi's import functionality to adopt existing EC2 instances without recreation
- Lambda functions must handle multiple instances in a single execution to minimize invocations
- CloudWatch Events rules must account for EST timezone including daylight saving transitions
- Instance state changes must be logged to CloudWatch Logs for audit purposes
- Cost calculation must use current EC2 on-demand pricing for the specific instance types
- Solution must not affect instances tagged with Environment=production

## Technical Details

**Platform:** Pulumi
**Language:** TypeScript
**Difficulty:** hard
**Category:** IaC Optimization
