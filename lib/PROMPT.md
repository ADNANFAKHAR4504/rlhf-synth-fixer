# AWS CDK Multi-Region Infrastructure Development Task

## Overview
You are tasked with creating a complete, production-ready AWS CDK application that deploys a multi-region infrastructure using TypeScript. This should be a single, well-structured file that's ready for immediate deployment.

## Infrastructure Requirements

### 1. Multi-Region Deployment
- Deploy resources to **both** `us-west-1` and `us-west-2` AWS regions
- Each region needs its own dedicated CDK Stack

### 2. DynamoDB Tables
- Create **separate** Amazon DynamoDB tables in each region
- Tables should be isolated and independent

### 3. Capacity Configuration
- **us-west-1 table**: Fixed capacity
  - Read capacity: **5**
  - Write capacity: **5**
- **us-west-2 table**: Configurable capacity
  - Use `CfnParameter` to allow runtime configuration
  - Users can specify read/write capacities during deployment

### 4. Lambda Functions & Permissions
- Create AWS Lambda functions in each region with Node.js runtime
- Set up **fine-grained IAM permissions**:
  - **us-west-1 Lambda**: Write permissions to us-west-1 table only
  - **us-west-2 Lambda**: Write permissions to us-west-2 table only
  - **Restrict permissions** to: `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`

## Deliverable
Provide a complete, executable TypeScript CDK application in a single file that:
- Includes all necessary imports
- Is logically structured
- Can be deployed with `cdk deploy`
- Demonstrates best practices for resource linking and permission management
- Is self-contained and production-ready

## Key Points
- Focus on **minimal changes** to meet requirements
- Ensure **proper resource isolation** between regions
- Implement **secure, least-privilege permissions**
- Make the code **deployment-ready** with clear structure and comments