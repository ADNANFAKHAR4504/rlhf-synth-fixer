# CDK Python: Secure E-Commerce Infrastructure with Tests

Need to build a secure AWS infrastructure for an e-commerce app using AWS CDK in Python. The infrastructure needs to be production-ready with proper testing - both unit tests and integration tests to make sure everything actually works when deployed.

## Project Structure

```
.
├── tap.py                          # CDK app entry point
├── lib/
│   └── tap_stack.py                # CDK stack implementation
└── tests/
    ├── unit/
    │   └── test_tap_stack.py       # Unit tests for resource definitions
    └── integration/
        └── test_tap_stack.py       # Integration tests for synthesized stack
```

## Environment

Use a single environment: **dev**

Hardcode environment values for account and region, or read from context/environment variables if needed.

## Required Infrastructure

### Amazon RDS - PostgreSQL or MySQL

- Needs to be in private subnets - absolutely no public access
- Enable encryption at rest, multi-AZ for HA, automated backups, and deletion protection
- Security group should allow inbound DB traffic only from internal services like Lambda or ECS

### Amazon S3 Bucket

- Block all public access - no exceptions
- Enable versioning and encryption using SSE-S3 or SSE-KMS
- Add bucket policy to allow access only from CloudFront Origin Access Identity or Origin Access Control - nothing else should reach this bucket directly

### IAM Roles with Least Privilege

Need two roles:

1. **RDS access role** - for Lambda or ECS tasks that need to connect to the database
2. **S3 access role** - for services that need to read/write to the bucket

Both roles must have resource-scoped, action-limited policies. Don't use wildcards - specify exact resources and actions needed.

## Testing Requirements

### Unit Tests - tests/unit/test_tap_stack.py

Verify resource configurations:

- S3 bucket has public access blocked, versioning enabled, and encryption enabled
- IAM roles have the expected policy structure with proper resource scoping
- RDS is configured with deletion protection and uses private subnet groups only

### Integration Tests - tests/integration/test_tap_stack.py

Deploy the synthesized template and validate:

- Expected resource counts and types are created
- RDS subnet group doesn't include any public subnets
- Bucket policy restricts access to CloudFront only

## What I'm Looking For

A working CDK Python application with:

- Secure RDS and S3 setup following AWS best practices
- Proper IAM roles with minimal permissions - no overly permissive policies
- Unit and integration test coverage for core resource behavior
- Clean, maintainable code that I can actually deploy to production

Entry point should be tap.py and the main stack in lib/tap_stack.py.
