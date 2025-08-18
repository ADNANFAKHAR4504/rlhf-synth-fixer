# Prompt: Secure AWS Environment with CloudFormation – SecureApp

## Objective
Design and implement a secure, monitored, and efficient AWS infrastructure using AWS CloudFormation in YAML, deployable in the `us-east-1` region. The infrastructure should follow a modular and best-practices-driven approach, ensuring security, observability, and role-based access.

## Problem Statement

You are tasked with building a secure and observable AWS environment using CloudFormation to provision and configure the necessary services in the `us-east-1` region. The infrastructure will be used by a project called `SecureApp`:

## Infrastructure Components & Requirements

You must provision the following resources, ensuring they are properly configured, secured, and interconnected:

1. **Amazon S3 Bucket** (`SecureApp-AppDataBucket`)
   - Must have server-side encryption enabled.
   - Used for secure application data storage.
   - Bucket name must conform to naming convention and must not allow public access.

2. **Amazon RDS MySQL Instance** (`SecureApp-MySQLInstance`)
   - Deployed in a public subnet to enable direct administrative access.
   - Must follow secure configuration practices (e.g., no public snapshots, secure credentials via Secrets Manager is recommended).
   - VPC, subnet, and security group setup must allow for secure but direct connectivity.

3. **Amazon EC2 Instance Group** (`SecureApp-AppServerGroup`)
   - Must be able to connect to both the S3 bucket and RDS instance.
   - An IAM Role and Instance Profile must be attached to allow:
     - Read/Write access to the S3 bucket.
     - Secure connection permissions to the RDS instance.
   - EC2 security groups must allow appropriate ingress and egress traffic for application workloads and administration.

4. **Amazon CloudWatch Alarm** (`SecureApp-HighCPUAlarm`)
   - Set up to monitor CPU Utilization of the EC2 instances.
   - Alarm must trigger when CPU utilization exceeds 75%.
   - Optionally, integrate SNS topic and email subscription to notify administrators.

## Security & Best Practices

- Use least privilege IAM policies for roles assigned to EC2.
- Disable public access to the S3 bucket.
- Use parameterized templates where applicable.
- Apply tags consistently to all resources for cost tracking and management (`Environment`, `Project`, etc.).

## Deliverables

- A single CloudFormation YAML template named: `TapStack.yml`
- The template must deploy successfully in `us-east-1` without any validation errors using AWS CloudFormation.
- It must pass all functional and security validations described above.

## Acceptance Criteria

| Requirement                                       | Must Pass |
|--------------------------------------------------|-----------|
| S3 server-side encryption enabled                | Yes       |
| RDS in public subnet with direct access          | Yes       |
| IAM roles for EC2 to access S3 and RDS           | Yes       |
| CloudWatch alarm on CPU > 75%                    | Yes       |
| Secure configuration and best practices applied  | Yes       |
