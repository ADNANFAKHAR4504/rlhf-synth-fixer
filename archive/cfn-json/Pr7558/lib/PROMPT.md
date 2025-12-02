Hey team,

We need to build a multi-account payment processing infrastructure for a fintech startup. They recently had a production incident caused by configuration drift - a critical Lambda timeout setting differed between environments, which caused payment processing failures. The business wants to ensure their infrastructure remains identical across development, staging, and production environments.

The core problem is deploying consistent infrastructure across three separate AWS accounts (dev, staging, prod) while preventing configuration drift. They need the infrastructure to be absolutely identical except for environment-specific values like account IDs and domain names. This is mission-critical for payment processing.

We've been asked to create this using **CloudFormation with JSON**. The business wants a single source of truth that deploys identical configurations across all their AWS environments.

## What we need to build

Create a payment processing infrastructure using **CloudFormation with JSON** that deploys consistently across three AWS environments. The infrastructure must support payment validation, processing, and workflow orchestration.

### Core Requirements

1. **Lambda Functions for Payment Processing**
   - Payment validation function that validates incoming payment requests
   - Payment processing function that handles the actual payment transaction
   - Both functions must use identical runtime versions (Node.js 22.x) and memory allocations (512 MB)
   - Include reserved concurrency for production environment only

2. **DynamoDB Tables**
   - Payment transactions table with partition key (transactionId) and sort key (timestamp)
   - Two Global Secondary Indexes: one on customerId, one on paymentStatus
   - Identical capacity settings (on-demand billing) across all environments
   - Same GSI configurations in all accounts

3. **Application Load Balancer**
   - ALB with listeners on port 80 (HTTP)
   - Target groups pointing to Lambda functions
   - Health checks configured for Lambda targets
   - Deploy to public subnets across 3 availability zones

4. **Step Functions State Machine**
   - Orchestrate payment workflow: validate -> process -> succeed/fail
   - Integrate with Lambda functions and DynamoDB
   - Include error handling and retry logic

5. **CloudWatch Alarms with SNS**
   - Alarm for Lambda errors (threshold: 5 errors in 5 minutes)
   - Alarm for DynamoDB throttling
   - Environment-specific SNS topic endpoints for notifications

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON** (not YAML)
- Use CloudFormation Parameters for environment-specific values only:
  - EnvironmentName (dev, staging, prod)
  - SnsEmail
  - VpcCidr
  - AvailabilityZones
- Use CloudFormation Conditions to add production-only features:
  - Reserved concurrency for Lambda functions
- Single flattened template (TapStack.json) containing all resources
- All IAM roles must reference resources using CloudFormation intrinsic functions only (Ref, GetAtt, Sub)
- Resource names must include EnvironmentName parameter for uniqueness
- Deploy to us-east-1 region

### Constraints

- Parameter overrides limited to environment-specific values only (no infrastructure changes via parameters)
- All Lambda functions identical across environments (same runtime, memory, timeout)
- DynamoDB tables identical across environments (same capacity, GSI configs)
- All resources must be destroyable (DeletionPolicy: Delete, no Retain)
- Include proper error handling and logging for all components
- VPC with 3 availability zones, private subnets for Lambda/DynamoDB, public subnets for ALB

## Success Criteria

- Functionality: Payment workflow executes successfully across all environments
- Consistency: Infrastructure identical across dev, staging, prod accounts
- Reliability: Step Functions handles failures with retries
- Security: All IAM roles follow least-privilege principle
- Resource Naming: All resources include EnvironmentName parameter
- Code Quality: Valid CloudFormation JSON, well-structured, documented
- Drift Detection: Infrastructure supports CloudFormation drift detection

## What to deliver

- Complete CloudFormation JSON template (TapStack.json)
- Parameter files for each environment (dev-params.json, staging-params.json, prod-params.json)
- Deployment instructions
