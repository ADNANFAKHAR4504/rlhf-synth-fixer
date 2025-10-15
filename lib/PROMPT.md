# HIPAA-Compliant Event Processing Pipeline

## The Problem

MediTech Solutions runs patient monitoring devices across multiple hospitals. These devices generate constant streams of health data that need to be captured, processed, and stored in real-time - all while maintaining HIPAA compliance. We're talking about 1000 events per second during peak hours, with strict requirements around encryption, audit logging, and access controls.

## What We Built

A complete event processing pipeline using AWS CloudFormation (YAML) deployed in **eu-west-2**. The infrastructure handles real-time data ingestion through Kinesis, processes it with ECS Fargate, stores it in Aurora Serverless, and provides an API for external systems. Everything's encrypted, logged, and locked down for HIPAA compliance.

## The Architecture

### Core Components

**Kinesis Data Streams** - Ingests the real-time data. We configured it with 2 shards for 1000+ events/second capacity and 24-hour retention so we can replay events if something goes wrong.

**ECS Fargate** - Runs the data processing containers. No servers to manage - tasks just run in private subnets, pull data from Kinesis, process it, and write to Aurora. The task definition uses a simple Amazon Linux container that runs for demo purposes.

**Aurora Serverless v2** - MySQL-compatible database that auto-scales from 0.5 to 2 ACUs based on load. Deployed with 2 instances across multiple AZs for high availability. Much faster to spin up than regular RDS.

**Secrets Manager** - Stores database credentials with KMS encryption. The secret gets auto-generated when the stack deploys and can be rotated automatically.

**API Gateway** - REST API with a `/health` endpoint for monitoring. Uses IAM authentication so only authorized systems can access it. Rate limiting set to 500 burst and 100 requests/second steady state.

### Network Architecture

VPC using 10.0.0.0/16 CIDR block with:

- **3 private subnets** (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs - ECS tasks and Aurora instances run here
- **2 public subnets** (10.0.10.0/24, 10.0.11.0/24) across 2 AZs - needed for the NAT Gateway
- **NAT Gateway** with Elastic IP in the first public subnet - provides internet access for ECS tasks to pull container images from public.ecr.aws
- **Internet Gateway** - connects the VPC to the internet
- **VPC Endpoints** - Private connections to S3, Kinesis, Secrets Manager, ECR, and CloudWatch Logs. Reduces data transfer costs and keeps traffic within AWS network.

### Security & Compliance

HIPAA compliance requirements:

- **Customer-managed KMS keys** - All encryption uses our own KMS key, not AWS-managed ones. Automatic annual rotation is enabled.
- **CloudTrail** - Logs every API call to an encrypted S3 bucket with log file validation enabled. Complete audit trail.
- **Security Groups** - Least privilege access. ECS tasks can reach Aurora and VPC endpoints. VPC endpoints only accept traffic from ECS. Aurora only accepts connections from ECS.
- **Encryption at rest** - Kinesis, Aurora, CloudWatch Logs, CloudTrail S3 bucket - all encrypted with KMS.
- **Encryption in transit** - Aurora requires secure transport. API Gateway is HTTPS only. All AWS API calls use TLS.

## Data Flow

**Ingestion** - Medical devices send events to Kinesis Data Streams. The stream is KMS-encrypted and retains data for 24 hours.

**Processing** - ECS Fargate tasks run in private subnets and continuously read from Kinesis. They process the events and write results to Aurora. Currently running 2 tasks for redundancy, but this can scale up or down based on load.

**Storage** - Aurora Serverless v2 cluster auto-scales between 0.5 and 2 ACUs. Two database instances across multiple AZs provide high availability. Automated backups run daily with a 1-day retention (configurable for production).

**External Access** - API Gateway exposes a `/health` endpoint. Uses IAM authentication and has rate limiting configured (500 burst, 100/sec steady state).

**Monitoring** - Container Insights enabled on ECS cluster. CloudWatch captures all logs (encrypted with KMS). CloudTrail records every API action.

## Design Decisions

**Why NAT Gateway instead of just VPC Endpoints?**

ECS tasks pull container images from `public.ecr.aws`. VPC endpoints only work with private ECR repositories. So we need NAT Gateway to provide internet access from private subnets. Costs about $32/month plus data transfer, but it's required for this setup.

**Why Aurora Serverless v2 instead of provisioned instances?**

Serverless v2 provisions in minutes instead of 10-15 minutes. It auto-scales based on actual load, so we only pay for what we use. No capacity planning needed - it automatically adjusts between 0.5 and 2 ACUs.

**Resource naming with environment suffix**

Every resource name includes `${EnvironmentSuffix}` - for example, `patient-data-stream-dev` or `aurora-cluster-prod`. This allows deploying multiple environments (dev, staging, prod) in the same AWS account without name collisions.

**Deletion policies for easy cleanup**

All resources have `DeletionPolicy: Delete` and RDS deletion protection is disabled. This is intentional for dev/test environments where we want clean teardowns. Production deployments would need stricter settings.

## Resources Deployed

The CloudFormation stack creates approximately **55 AWS resources**:

**Networking (18 resources)**
- 1 VPC (10.0.0.0/16)
- 5 subnets: 3 private + 2 public
- 1 Internet Gateway
- 1 NAT Gateway with Elastic IP
- 2 route tables with associations
- 5 VPC endpoints: S3, Kinesis, Secrets Manager, ECR (API + DKR), CloudWatch Logs
- 3 security groups: VPC endpoints, ECS tasks, RDS

**Compute (9 resources)**
- 1 ECS cluster with Container Insights enabled
- 1 task definition (512 CPU, 1024 MB memory)
- 1 ECS service running 2 tasks
- 3 IAM roles: task execution role, task role, (implicit service role)
- 1 CloudWatch log group for ECS

**Database (5 resources)**
- 1 Aurora Serverless v2 cluster
- 2 DB instances across AZs
- 1 DB subnet group
- 1 DB cluster parameter group

**Data Streaming (1 resource)**
- 1 Kinesis Data Stream with 2 shards

**Security & Audit (8 resources)**
- 1 KMS key with alias for encryption
- 1 Secrets Manager secret for DB credentials
- 1 CloudTrail trail
- 1 S3 bucket for CloudTrail logs with lifecycle policy
- 1 S3 bucket policy
- 1 secret target attachment

**API Gateway (8 resources)**
- 1 REST API
- 1 resource (`/health`)
- 1 method (GET)
- 1 deployment
- 1 stage (prod)
- 1 usage plan
- 1 CloudWatch log group for API Gateway

## Deployment

Deploy the stack with:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStackdev \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=dev \
  --region eu-west-2
```

Deployment takes 15-20 minutes. Aurora instances are the slowest to provision (about 10-12 minutes). ECS, Kinesis, and networking components come up quickly.

## Stack Outputs

The stack exports these outputs:

- VPC ID and all subnet IDs (private and public)
- KMS key ID and ARN
- Kinesis stream name and ARN
- Aurora cluster endpoints (writer and reader)
- Database secret ARN
- ECS cluster name, ARN, and service name
- API Gateway ID and URL
- CloudTrail name and bucket name
- Environment suffix

Example output values:
- **API Gateway URL**: `https://abc123xyz.execute-api.eu-west-2.amazonaws.com/prod`
- **Aurora Writer Endpoint**: `aurora-cluster-dev.cluster-abc123.eu-west-2.rds.amazonaws.com`
- **Aurora Reader Endpoint**: `aurora-cluster-dev.cluster-ro-abc123.eu-west-2.rds.amazonaws.com`
- **Kinesis Stream**: `patient-data-stream-dev`
- **ECS Cluster**: `data-processing-cluster-dev`

Database credentials are stored in Secrets Manager at `aurora-db-secret-dev` - never exposed in outputs or code.

## Cost Estimate

Monthly costs for a dev environment (rough estimates):

**Compute & Processing**
- ECS Fargate: ~$58/month (2 tasks × 0.5 vCPU × 1GB × 24/7)
- Kinesis: ~$22/month (2 shards provisioned)

**Database**
- Aurora Serverless v2: ~$100-150/month (depends on ACU usage, 20GB storage)
- Backup storage: ~$10-20/month

**Networking**
- NAT Gateway: ~$32/month + data transfer charges

**Other**
- CloudTrail S3 storage: ~$5/month
- API Gateway: $3.50 per million requests
- VPC endpoints: Free (interface endpoints in some regions may have hourly charges)
- CloudWatch Logs: Minimal for dev usage
- KMS: $1/month per key + API call charges (negligible)


