# Multi-Region DynamoDB Infrastructure Setup

## Task Overview
We need to build a multi-region AWS infrastructure using CDK TypeScript. The goal is to create DynamoDB tables in two different regions with some specific requirements around capacity and permissions.

## What We Need to Build

### Multi-Region Setup
- Deploy resources to both us-west-1 and us-west-2 regions
- Each region should have its own CDK stack

### DynamoDB Tables
- Create separate DynamoDB tables in each region
- Tables should be independent and isolated from each other

### Capacity Configuration
- **us-west-1 table**: Use fixed capacity
  - Read capacity: 5
  - Write capacity: 5
- **us-west-2 table**: Make capacity configurable
  - Use CfnParameter so users can set read/write capacity during deployment

### Lambda Functions and Permissions
- Add Lambda functions in each region (Node.js runtime)
- Set up IAM permissions for each Lambda:
  - us-west-1 Lambda should have write access to us-west-1 table only
  - us-west-2 Lambda should have write access to us-west-2 table only
  - Limit permissions to: dynamodb:PutItem, dynamodb:UpdateItem, dynamodb:DeleteItem

## What to Deliver
Provide a complete CDK TypeScript application that:
- Includes all necessary imports
- Has logical structure
- Can be deployed with cdk deploy
- Shows best practices for linking resources and managing permissions
- Is self-contained and ready for production use

## Key Points
- Keep changes minimal to meet requirements
- Ensure proper isolation between regions
- Implement secure, least-privilege permissions
- Make the code deployment-ready with clear structure