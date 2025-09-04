Insert here the prompt that made the model fail.You are tasked with creating a secure, scalable, and modular AWS infrastructure using the AWS Cloud Development Kit (CDK) with Python. Use the following specifications:

Folder Structure
bash
Copy
Edit
project-root/
├── tap.py # Entry point for CDK app (like app.py)
└── lib/
└── tap_stack.py # CDK Stack definition
Environment
Region: us-east-1

Cloud Provider: AWS

Language: Python (AWS CDK)

Framework: AWS CDK v2

Infrastructure Requirements
Within your tap_stack.py, implement the following resources:

VPC & Networking

Custom VPC with public and private subnets across at least two Availability Zones

Configure route tables, NAT gateway, and Internet gateway

Use Security Groups for controlling network access

Compute

Launch 2 EC2 instances (Amazon Linux 2), each in a different AZ (high availability)

Attach IAM roles with least privilege

Place instances in private subnets

Associate the instances with the Security Groups

Database

Use Amazon RDS (PostgreSQL or MySQL)

Configure it for multi-AZ deployment

Enable automated backups (minimum 7-day retention)

Ensure storage encryption with KMS

Load Balancing

Create an Application Load Balancer (ALB)

Distribute traffic to EC2 instances

ALB should be in public subnets and EC2 in target group

Storage

Provision at least one S3 bucket

Enable versioning

Enforce encryption at rest using KMS

Apply least privilege bucket policies

Monitoring & Logging

Enable CloudWatch Logs and Metrics for:

EC2

RDS

ELB

Define alarms for instance CPU thresholds, RDS storage, etc.

Security & IAM

All IAM roles and policies must follow the least privilege principle

Enforce role-based access control (RBAC)

Ensure resources (like RDS, EC2, S3) use KMS encryption

Constraints
Use snake_case for all logical ID/resource names.

Use modular and reusable constructs if applicable.

Code must reside in:

tap.py for initializing the CDK app.

lib/tap_stack.py for defining the full stack.

Must be able to deploy the stack using cdk deploy successfully.

Expected Output
A fully working AWS CDK (Python) project that can be deployed using:

bash
Copy
Edit
cdk synth
cdk deploy
The deployed infrastructure should meet all the requirements above and demonstrate high availability, security, and scalability following AWS best practices.