A single deployment environment (e.g., "dev")

Unit and integration test structure under tests/unit/ and tests/integration/

Entry point: tap.py

Main stack: lib/tap_stack.py

✅ CDK Python Prompt: Secure E-Commerce Infrastructure with Tests
You are developing a secure AWS infrastructure for an e-commerce application using AWS CDK in Python. Your goal is to implement the infrastructure and include both unit and integration tests to validate the deployment.

📁 Project Structure
graphql
Copy
Edit
.
├── tap.py                          # CDK app entry point
├── lib/
│   └── tap_stack.py                # CDK stack implementation
└── tests/
    ├── unit/
    │   └── test_tap_stack.py       # Unit tests for resource definitions
    └── integration/
        └── test_tap_stack.py       # Integration tests for synthesized stack
🌍 Environment
Use a single environment: dev

Hardcode environment values (account, region) or read from context/environment variables if needed

🛠️ Required Infrastructure
Amazon RDS (PostgreSQL/MySQL)

Launched in private subnets (no public access)

Enabled encryption, multi-AZ, automated backups, and deletion protection

Security group allows inbound DB traffic only from internal services

Amazon S3 Bucket

Block all public access

Versioning and SSE encryption (SSE-S3 or SSE-KMS)

Add a bucket policy to allow access only from CloudFront Origin Access Identity (OAI) or Origin Access Control (OAC)

IAM Roles with Least Privilege

Role for accessing RDS (e.g., by a Lambda or ECS task)

Role for accessing S3

Each role must have resource-scoped, action-limited policies to follow the principle of least privilege

🧪 Testing Requirements
Unit Tests (tests/unit/test_tap_stack.py):

Assert S3 bucket has:

Public access blocked

Versioning and encryption enabled

IAM roles have expected policy structure

RDS is configured with deletion protection and private subnet group

Integration Tests (tests/integration/test_tap_stack.py):

Deploy the synthesized template (cdk synth) and assert:

Expected resource counts/types

RDS subnet group does not include public subnets

Bucket policy only allows access from CloudFront

✅ Output Expectations
Working CDK Python application with:

Secure RDS and S3 setup

Proper IAM roles with minimal permissions

Unit and integration test coverage for core resource behavior