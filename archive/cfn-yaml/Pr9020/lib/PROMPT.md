# Multi-Environment Payment Processing Infrastructure

Build a comprehensive multi-environment infrastructure for our payment processing system using CloudFormation. The solution should deploy consistent configurations across development, staging, and production environments.

## Infrastructure Requirements

We need a production-ready CloudFormation template that provisions the following AWS services with proper integration and connectivity:

### Database Layer

Deploy an Aurora PostgreSQL cluster version 15.8 that connects to Secrets Manager for credential management. The database should use the username dbadmin on port 5432 with storage encryption enabled using AWS managed keys. Configure a 7-day backup retention period and set DeletionPolicy to Delete for clean teardown.

### Container Platform

Create an ECS Fargate cluster with Container Insights enabled for monitoring. The cluster needs IAM roles for task execution that connect to CloudWatch Logs with 30-day retention. Task roles should have least privilege access to S3 and DynamoDB resources.

### Data Storage

Configure a DynamoDB table with streams enabled using NEW_AND_OLD_IMAGES mode. Enable server-side encryption and point-in-time recovery. Use PAY_PER_REQUEST billing mode and expose the stream ARN in outputs for downstream event processing.

Set up an S3 bucket with AES256 encryption and versioning. Add 90-day lifecycle policies for cost management and block all public access. Include the environment suffix in bucket naming for uniqueness.

### Network Architecture

Build a VPC with 10.0.0.0/16 CIDR block configured for multi-AZ deployment:
- Public Subnet 1 at 10.0.1.0/24 in AZ1
- Public Subnet 2 at 10.0.2.0/24 in AZ2
- Private Subnet 1 at 10.0.10.0/24 in AZ1
- Private Subnet 2 at 10.0.11.0/24 in AZ2

Deploy a single NAT Gateway for dev and staging environments but dual NAT Gateways for production. Add Transit Gateway for production environments with automated route propagation. Configure security groups allowing PostgreSQL port 5432 traffic.

### Supporting Services

Create an SNS topic for centralized notifications with environment-specific naming. Use Secrets Manager to generate and store Aurora database credentials automatically. The ECS task execution role should connect to Secrets Manager to retrieve credentials at runtime.

## Environment Configuration

The template must support three environments through parameters:
- Development with minimal redundancy
- Staging with moderate redundancy
- Production with full high availability including dual NAT Gateways and Transit Gateway

All resources must include an EnvironmentSuffix parameter in their names following the pattern resource-type-environment-suffix. Apply consistent tagging with Environment, Application, and CostCenter tags.

## Constraints

The infrastructure must work within AWS Organizations multi-account setup with StackSets enabled. Network CIDR ranges cannot overlap between environments. Security groups must follow least-privilege network access principles. All drift detection should trigger immediate notifications through SNS.

## Deployment

The template should deploy using aws cloudformation deploy with CAPABILITY_IAM. For development:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStack-dev \
  --parameter-overrides EnvironmentSuffix=dev Environment=dev \
  --capabilities CAPABILITY_IAM
```

For production with full high availability:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStack-prod \
  --parameter-overrides EnvironmentSuffix=prod Environment=prod \
  --capabilities CAPABILITY_IAM
```
