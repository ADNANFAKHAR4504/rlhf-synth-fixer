# CI/CD Pipeline Infrastructure Request

Hey there! I'm working on setting up a comprehensive CI/CD pipeline for our microservices architecture and could really use your expertise with AWS CDK and TypeScript.

## What We're Building

We need to create a robust multi-stage CI/CD pipeline that can handle our financial services workload. The main goal is to automate our deployment process while keeping security and compliance at the forefront.

## Key Requirements

**Pipeline Stages:**
- Source code management with branch-based triggers
- Automated building and testing
- Security scanning with vulnerability detection
- Staging deployment with manual approval
- Production deployment with additional approval gates

**Security & Compliance:**
- All artifacts must be encrypted using customer-managed KMS keys
- Security scans must block deployments if critical vulnerabilities are found
- Pipeline logs need to be retained for 90 days for auditing
- IAM roles should follow least privilege principles

**Operational Requirements:**
- Build caching to keep build times under 5 minutes
- Rollback capabilities by maintaining last 5 successful builds
- CloudWatch monitoring for failures and stuck executions
- SNS notifications for different stakeholder groups

## Technical Constraints

- Must use TypeScript with AWS CDK
- Support for both main and develop branch triggers
- Separate S3 buckets for staging and production with versioning
- Parallel execution of unit tests, integration tests, and security scans
- Manual approval workflows before production deployments

## What I Need

I'm looking for two main files:
1. **main.ts** - The CDK app entry point
2. **tapstack.ts** - The complete stack with all the pipeline resources

The code should be production-ready, well-commented, and follow AWS best practices. I'm particularly concerned about getting the resource connections right and ensuring proper security configurations.

## Environment Details

- **Platform:** AWS
- **Region:** us-east-1 (but should be configurable)
- **Account:** Multi-account setup for staging/production
- **Compliance:** Financial services requirements

This is a critical piece of our infrastructure, so I need something that's both secure and maintainable. Any insights on best practices for CI/CD pipelines in regulated environments would be greatly appreciated!