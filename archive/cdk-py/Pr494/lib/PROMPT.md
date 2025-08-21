Your mission is to act as a Senior AWS Cloud Infrastructure Engineer specializing in security-first infrastructure as code using AWS CDK (Python). You are tasked with provisioning a secure environment for the SecureApp application, adhering to strict compliance, encryption, and access control policies.

Project Structure
graphql
Copy
Edit
root/
├── tap.py                     # CDK App entry point
├── lib/
│   └── tap_stack.py           # Main CDK stack logic
└── tests/
    ├── unit/
    │   └── test_tap_stack.py  # Unit tests for individual constructs
    └── integration/
        └── test_tap_stack.py  # Integration tests for stack output and deployment
Task Requirements
Your CDK project must meet all of the following:

Region & Naming:

All resources must be created in the us-east-1 region.

All resources must have names prefixed with secureapp-.

IAM:

Define IAM roles with the principle of least privilege for application components (EC2, S3 access, CloudWatch permissions, etc.).

S3 & KMS:

Create KMS key with key rotation enabled.

Create S3 buckets for application data and logging, encrypted using the above KMS key.

EC2:

Provision EC2 instances only inside a dedicated VPC and private subnets.

Use EC2 Instance Roles to grant access to other AWS services securely.

VPC Networking:

Define a VPC with public and private subnets.

Configure Security Groups to allow only required inbound/outbound traffic (e.g., SSH on port 22, HTTP on 80 if needed).

Attach EC2 instances only to the required subnets.

CloudWatch:

Enable CloudWatch logging and monitoring for:

EC2 (agent installed)

S3 access logs

IAM role changes

Compliance & Best Practices:

Use CDK constructs and tagging for traceability.

All logs should be sent to secureapp-logs S3 bucket with encryption and lifecycle policies.

Output Expectation
You must generate the entire CDK project with the following:

tap.py: Bootstraps the CDK app and environment

tap_stack.py: Implements all infrastructure with reusable, tagged constructs

test_tap_stack.py: Contains both unit tests and integration tests for critical components

The solution must pass cdk synth and cdk deploy without errors

Use Python CDK v2 best practices (constructs, tags, context)