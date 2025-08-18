Role
You are an expert AWS Cloud Engineer specializing in Infrastructure as Code (IaC) and enterprise-grade security. Your task is to architect and implement a foundational AWS infrastructure using the AWS Cloud Development Kit (CDK) with TypeScript.

Primary Goal
Design and implement a secure, resilient, and scalable AWS infrastructure that adheres to modern security best practices. The entire infrastructure must be defined programmatically using AWS CDK (TypeScript) to ensure it is repeatable, auditable, and version-controlled.

Core Infrastructure Specifications
You must provision the following components, ensuring all security and operational constraints are met:

1. Networking Layer (VPC)

VPC: Deploy a new VPC.

Subnetting: The VPC must contain at least two public and two private subnets distributed across a minimum of two Availability Zones for high availability.

Egress: Each private subnet must have a route to the internet via a NAT Gateway located in a corresponding public subnet.

2. Data Security & Encryption

KMS: Provision a Customer Managed Key (CMK) with automatic key rotation enabled. This key will be the primary source for all data-at-rest encryption.

S3 Buckets:

Encryption: All S3 buckets must enforce server-side encryption using the provisioned KMS CMK (SSE-KMS).

Versioning: Object versioning must be enabled on all buckets to protect against accidental data deletion or modification.

Public Access: All public access must be blocked at the bucket level.

RDS Database:

Encryption: The RDS instance must have storage encryption enabled, utilizing the provisioned KMS CMK.

3. Compute & Access Management

IAM: EC2 instances must not use static IAM access keys. Instead, they must be assigned an IAM Role with the minimum necessary permissions (principle of least privilege).

ECS Cluster:

Deploy an ECS cluster (Fargate or EC2-backed).

Services within the cluster must be configured with an auto-scaling policy based on CPU utilization or another relevant metric (e.g., SQS queue depth).

RDS Instance Policy:

Constraint: The RDS database instances are restricted to specific instance types: db.m5.large or db.m5.xlarge only. This policy must be enforced programmatically within the CDK application, preventing the deployment of non-compliant instances. Hint: An advanced CDK pattern like Aspects is ideal for this.

4. Auditing & Monitoring

CloudTrail: Deploy a multi-region CloudTrail trail that logs all management events. Configure it to specifically capture all S3 data events (e.g., GetObject, PutObject) for sensitive data buckets.

CloudWatch:

EC2: Create alarms to monitor key metrics such as CPU and Memory Utilization.

RDS: Create alarms to monitor metrics like CPU Utilization, DB Connections, and Read/Write Latency.

5. Security Posture

Security Groups: Adhere strictly to the principle of least privilege. Security Groups should only allow traffic on necessary ports and from known, specific sources (e.g., another Security Group or a specific IP CIDR block). Avoid using 0.0.0.0/0 where possible, especially for management ports like SSH.

Deliverables
AWS CDK Project: A complete, well-structured, and runnable AWS CDK project written in TypeScript.

Synthesized Template: The CDK app must successfully synthesize into a CloudFormation YAML template.

Validation: The generated template must pass validation using the aws cloudformation validate-template command.

Deployment: The resulting stack must be deployable without errors using standard CDK commands (cdk deploy) or AWS CloudFormation (aws cloudformation create-stack).

Code Quality: The code must be clean, well-commented, and follow TypeScript best practices. Comments should explain the "why" behind security configurations and architectural decisions.