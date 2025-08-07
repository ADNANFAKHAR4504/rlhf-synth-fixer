Prompt for CDK Python Project (IaC - AWS Nova Model Breaking)
You are a Senior AWS Cloud Infrastructure Engineer tasked with implementing a secure and scalable infrastructure using AWS CDK (Python) for the Nova Model Breaking application.

Project Requirements
Your CDK project must meet the following requirements and match the structure below:

Project Structure
graphql
Copy
Edit
root/
├── tap.py                     # CDK App entry point
├── lib/
│   └── tap_stack.py           # Main CDK stack logic (VPC, EC2, ELB, S3, etc.)
└── tests/
    ├── unit/
    │   └── test_tap_stack.py  # Unit tests for individual constructs
    └── integration/
        └── test_tap_stack.py  # Integration tests for stack outputs and resources
Security & Compliance Requirements
Secure all API Gateway endpoints with IAM authentication

Use AWS KMS with customer-managed keys to encrypt S3 data at rest

Ensure TLS 1.2 or higher is used for all service-to-service communication

IAM policies must follow the principle of least privilege

Trust policies must allow access only to necessary services

Use SSM Parameter Store to securely manage application configuration

Availability & Infrastructure Requirements
Define a VPC with:

At least 2 public and 2 private subnets across multiple Availability Zones

Proper route tables, NAT Gateways, and Internet Gateways

Deploy an Auto Scaling Group (ASG) behind an Application Load Balancer (ALB):

Ensure at least 2 EC2 instances are always running

Enable detailed monitoring for EC2

Add an HTTPS listener with a valid ACM SSL certificate

Set up CloudWatch for:

Application logs

Infrastructure deployment logs

Additional Requirements:

Use Elastic Load Balancing (ALB) to distribute incoming traffic

Enable automatic backups for database instances with 7-day minimum retention

Restrict security group access to known IP ranges only

Testing Expectations
tests/unit/test_tap_stack.py: Test logical unit constructs (e.g., IAM roles, VPC setup)

tests/integration/test_tap_stack.py: Deploy CDK and validate:

Resource creation

Output correctness

IAM roles and policies

Security group rules

Expected Outcome
A working AWS CDK Python program that:

Successfully provisions the infrastructure

Passes both unit and integration tests

Enforces all the above security, compliance, and availability constraints

Can be deployed in us-east-1 using a simple cdk deploy command